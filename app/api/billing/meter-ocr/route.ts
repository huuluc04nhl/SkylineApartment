import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/guard';
import { listMeterReadingsDb, insertMeterReadingDb } from '@/lib/server/billingDb';
import { MeterReadingRecord } from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AnalyzeInputSchema = z.object({
  image: z.string().min(10, 'Ảnh không hợp lệ'),
  apt_code: z.string().trim().min(1, 'Vui lòng cung cấp mã căn hộ'),
  meter_type_hint: z.enum(['ELECTRIC', 'WATER']).optional(),
  period: z.string().default('2026-09'),
});

const SaveInputSchema = z.object({
  action: z.literal('save'),
  apartment_code: z.string().trim().min(1, 'Vui lòng cung cấp mã căn hộ'),
  meter_type: z.enum(['ELECTRIC', 'WATER']),
  reading: z.number().positive(),
  confidence: z.number().min(0).max(1),
  source: z.enum(['manual', 'ocr']).default('manual'),
  period: z.string().default('2026-09'),
  image_url: z.string().optional(),
  is_confirmed: z.boolean(),
});

const OcrResultSchema = z.object({
  meter_type: z.enum(['ELECTRIC', 'WATER']),
  reading: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

/**
 * Call Gemini Vision to extract meter reading from image
 */
async function callGeminiVision(base64Data: string, mimeType: string, meterHint?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const prompt = `You are an automated high-precision utility meter reading system (đồng hồ điện và đồng hồ nước) for Skyline Smart Residence.
Analyze the provided image of the utility meter.
Identify:
1. "meter_type": either "ELECTRIC" (đồng hồ điện, kWh) or "WATER" (đồng hồ nước, m³). Hint: ${meterHint || 'detect from dial/units'}.
2. "reading": the exact primary numeric display counter / dial reading as a positive number. Ignore small secondary red decimal sub-dials if unclear.
3. "confidence": a float between 0.0 and 1.0 representing how clearly the digits are visible (e.g. 0.95 for sharp clear digits, 0.75 if glare or blurred, 0.50 if difficult to read).
4. "notes": concise Vietnamese explanation of what digits you identified.

Return ONLY a valid JSON object matching this schema without markdown codeblocks or quotes:
{
  "meter_type": "ELECTRIC" | "WATER",
  "reading": number,
  "confidence": number,
  "notes": string
}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
        }
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const cleaned = text.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const validated = OcrResultSchema.safeParse(parsed);
    if (validated.success) return validated.data;
  } catch (err) {
    console.warn('Gemini vision OCR call error:', err);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'TECHNICIAN']);
    if (!guard.ok) return guard.response;
    const staff = guard.session.profile;

    const json = await req.json();

    // Check if saving confirmed reading
    if (json.action === 'save') {
      const parsedSave = SaveInputSchema.safeParse(json);
      if (!parsedSave.success) {
        return NextResponse.json(
          { success: false, message: 'Dữ liệu lưu không hợp lệ', errors: parsedSave.error.format() },
          { status: 400 }
        );
      }

      const { apartment_code, meter_type, reading, confidence, source, period, is_confirmed } = parsedSave.data;

      // Enforcement: if confidence < 0.85, is_confirmed MUST be true
      if (confidence < 0.85 && !is_confirmed) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Độ tin cậy của ảnh dưới 85% (confidence < 0.85). Bắt buộc người quản lý phải tích xác nhận trước khi lưu!' 
          },
          { status: 422 }
        );
      }

      // Find previous reading for consumption calculation
      const history = await listMeterReadingsDb(apartment_code, meter_type);
      const prev = history.length > 0 ? history[history.length - 1] : undefined;
      const prevVal = prev ? prev.reading : undefined;
      const consumption = prevVal !== undefined ? Math.max(0, reading - prevVal) : undefined;

      const newRecord: MeterReadingRecord = {
        id: `MTR-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        apartment_code,
        meter_type,
        reading,
        previous_reading: prevVal,
        consumption,
        period,
        confidence,
        source,
        verified_by: `${staff.full_name} (${staff.role})`,
        recorded_at: new Date().toISOString(),
        status: 'CONFIRMED'
      };

      await insertMeterReadingDb(newRecord);

      return NextResponse.json({
        success: true,
        message: `Đã lưu thành công chỉ số ${meter_type === 'ELECTRIC' ? 'điện' : 'nước'} căn hộ ${apartment_code}: ${reading}`,
        data: newRecord
      });
    }

    // Default: OCR Analysis
    const parsedInput = AnalyzeInputSchema.safeParse(json);
    if (!parsedInput.success) {
      return NextResponse.json(
        { success: false, message: 'Ảnh đồng hồ hoặc tham số không hợp lệ', errors: parsedInput.error.format() },
        { status: 400 }
      );
    }

    const { image, apt_code, meter_type_hint, period } = parsedInput.data;

    let base64Clean = image;
    let mimeType = 'image/jpeg';
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Clean = match[2];
    }

    // Try Gemini Vision
    const result = await callGeminiVision(base64Clean, mimeType, meter_type_hint);

    // Không bịa chỉ số giả khi Gemini/OCR lỗi: yêu cầu nhập tay
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          requires_manual_entry: true,
          message:
            'Không thể nhận dạng tự động chỉ số từ ảnh (Gemini OCR lỗi hoặc chưa cấu hình). Vui lòng nhập chỉ số thủ công.',
        },
        { status: 503 }
      );
    }

    const needsConfirmation = result.confidence < 0.85;

    // Get previous reading from DB
    const history = await listMeterReadingsDb(apt_code, result!.meter_type);
    const lastReading = history.length > 0 ? history[history.length - 1].reading : undefined;

    return NextResponse.json({
      success: true,
      data: {
        meter_type: result.meter_type,
        reading: result.reading,
        confidence: Number(result.confidence.toFixed(2)),
        notes: result.notes || '',
        previous_reading: lastReading,
        consumption_estimate: lastReading ? Math.max(0, result.reading - lastReading) : undefined,
        needs_confirmation: needsConfirmation,
        confirmation_rule: 'Nếu độ tin cậy dưới 85%, bắt buộc cán bộ Ban Quản Lý phải kiểm tra và xác nhận thủ công trước khi ghi nhận vào hệ thống.'
      }
    });

  } catch (err: any) {
    console.error('Meter OCR API error:', err);
    return NextResponse.json(
      { success: false, message: 'Lỗi xử lý OCR: ' + (err.message || 'Lỗi không xác định') },
      { status: 500 }
    );
  }
}

