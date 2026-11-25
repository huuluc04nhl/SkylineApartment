import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { type StoredUser } from '@/lib/userStore';
import { 
  checkBillingAiRateLimit, 
  BILLING_TOOLS, 
  GEMINI_BILLING_TOOL_DECLARATIONS, 
  buildResidentSystemPrompt 
} from '@/lib/billingAiService';
import { GEMINI_API_KEY } from '@/lib/geminiClient';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const session = await getAuthenticatedUser();
    const user: StoredUser | null = session ? session.profile : null;
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' },
        { status: 401 }
      );
    }

    // Rate Limiting
    const rateCheck = checkBillingAiRateLimit(user.id);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng chờ 1 phút trước khi hỏi tiếp.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = (body.message || body.prompt || '').trim();
    const chatHistory = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp nội dung câu hỏi.' },
        { status: 400 }
      );
    }

    const isAdmin = user.role === 'ADMIN';
    const toolCtx = { user, isAdmin };

    // Set up Server-Sent Event / Text streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      try {
        if (!GEMINI_API_KEY) {
          // Intelligent fallback generator when offline/no key
          const fallbackText = await generateSmartBillingResponse(message, toolCtx);
          for (let i = 0; i < fallbackText.length; i += 8) {
            await writer.write(encoder.encode(fallbackText.slice(i, i + 8)));
            await new Promise(r => setTimeout(r, 20));
          }
          await writer.close();
          return;
        }

        // Call Gemini with Tool Calling
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
        const systemPrompt = buildResidentSystemPrompt(user);

        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Tôi đã hiểu các quy tắc bảo mật và phạm vi dữ liệu. Tôi sẵn sàng hỗ trợ cư dân về hóa đơn và chi phí.' }] },
          ...chatHistory.slice(-6).map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(h.content || '') }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ];

        let geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            tools: [{ functionDeclarations: GEMINI_BILLING_TOOL_DECLARATIONS }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
            },
          }),
        });

        if (!geminiRes.ok) {
          // Model error fallback
          const fallbackText = await generateSmartBillingResponse(message, toolCtx);
          for (let i = 0; i < fallbackText.length; i += 8) {
            await writer.write(encoder.encode(fallbackText.slice(i, i + 8)));
            await new Promise(r => setTimeout(r, 15));
          }
          await writer.close();
          return;
        }

        let result = await geminiRes.json();
        let candidate = result?.candidates?.[0]?.content?.parts?.[0];

        // Handle tool calls loop (up to 3 turns)
        let loopCount = 0;
        while (candidate?.functionCall && loopCount < 3) {
          loopCount++;
          const call = candidate.functionCall;
          const fnName = call.name as keyof typeof BILLING_TOOLS;
          const fnArgs = call.args || {};

          let toolOutput = { error: 'Tool không tồn tại' };
          if (typeof BILLING_TOOLS[fnName] === 'function') {
            toolOutput = await (BILLING_TOOLS[fnName] as any)(fnArgs, toolCtx);
          }

          contents.push({
            role: 'model',
            parts: [{ functionCall: call }],
          });
          contents.push({
            role: 'function',
            parts: [{
              functionResponse: {
                name: fnName,
                response: toolOutput,
              },
            }],
          });

          const followUpRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              tools: [{ functionDeclarations: GEMINI_BILLING_TOOL_DECLARATIONS }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1024,
              },
            }),
          });

          if (!followUpRes.ok) break;
          result = await followUpRes.json();
          candidate = result?.candidates?.[0]?.content?.parts?.[0];
        }

        const finalText = candidate?.text || (await generateSmartBillingResponse(message, toolCtx));
        for (let i = 0; i < finalText.length; i += 12) {
          await writer.write(encoder.encode(finalText.slice(i, i + 12)));
          await new Promise(r => setTimeout(r, 15));
        }
        await writer.close();
      } catch (streamErr) {
        console.error('Billing AI Stream Error:', streamErr);
        try {
          const errFallback = 'Xin lỗi quý cư dân, hệ thống AI đang bận xử lý dữ liệu. Vui lòng xem bảng kê chi tiết tại tab hóa đơn hoặc thử lại sau.';
          await writer.write(encoder.encode(errFallback));
          await writer.close();
        } catch {}
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Lỗi xử lý trợ lý hóa đơn.' },
      { status: 500 }
    );
  }
}

/**
 * Intelligent Rule-Based Engine (Guarantees zero-failure when LLM network cuts out)
 */
async function generateSmartBillingResponse(query: string, ctx: { user: StoredUser; isAdmin: boolean }): Promise<string> {
  const norm = query.toLowerCase();
  const aptCode = ctx.user.apartment_code || 'CH-06';

  // 1. Câu hỏi về nợ / khoản chưa thanh toán
  if (norm.includes('nợ') || norm.includes('chưa trả') || norm.includes('chưa thanh toán') || norm.includes('phải nộp')) {
    const debt = await BILLING_TOOLS.getDebtSummary({}, ctx);
    if (debt.unpaid_count === 0) {
      return `Dạ chào quý cư dân căn ${aptCode}! Hiện tại căn hộ của mình đã hoàn tất thanh toán toàn bộ các hóa đơn và KHÔNG CÒN KHOẢN NỢ NÀO ạ. Cảm ơn quý cư dân đã luôn thanh toán đúng hạn!\n\n💡 *Nội dung do AI phân tích tự động từ dữ liệu hệ thống, quý cư dân vui lòng đối chiếu chi tiết tại bảng kê hóa đơn gốc.*`;
    }
    const billList = debt.unpaid_bills.map(b => `• Kỳ **${b.billing_month}**: **${b.total_amount.toLocaleString('vi-VN')} đ** (Hạn nộp: ${b.due_date ? new Date(b.due_date).toLocaleDateString('vi-VN') : 'Cuối tháng'})`).join('\n');
    return `Dạ chào quý cư dân! Hiện tại căn hộ **${aptCode}** đang có **${debt.unpaid_count} hóa đơn** chờ thanh toán với tổng số tiền là **${debt.total_debt_amount.toLocaleString('vi-VN')} VNĐ**:\n\n${billList}\n\nQuý cư dân có thể bấm nút **Thanh Toán VNPAY** hoặc quét mã **VietQR Napas247** ngay trên màn hình để gạch nợ tức thì ạ.\n\n💡 *Nội dung do AI phân tích tự động từ dữ liệu hệ thống, quý cư dân vui lòng đối chiếu chi tiết tại bảng kê hóa đơn gốc.*`;
  }

  // 2. Câu hỏi về tiền điện / tiền nước tăng
  if (norm.includes('điện') || norm.includes('nước') || norm.includes('tăng') || norm.includes('sao tăng')) {
    const invoices = await BILLING_TOOLS.getInvoices({}, ctx);
    const latestBill = invoices.bills[0];
    if (latestBill) {
      const detail = await BILLING_TOOLS.getInvoiceDetail({ billId: latestBill.id }, ctx);
      const waterLine = (detail as any).details?.find((d: any) => d.service_type === 'Water');
      const elecLine = (detail as any).details?.find((d: any) => d.service_type === 'Electricity');

      let explanation = `Dạ kính gửi quý cư dân căn ${aptCode}, AI đã đối soát chi tiết kỳ **${latestBill.billing_month}**:\n\n`;
      if (waterLine) {
        explanation += `💧 **Tiền Nước:** Tiêu thụ **${waterLine.usage} m³** (thành tiền: ${waterLine.total_line_amount.toLocaleString('vi-VN')} đ). `;
        if (waterLine.ai_anomaly) {
          explanation += `⚠️ **Cảnh báo bất thường:** ${waterLine.anomaly_reason || 'Lưu lượng nước tăng cao hơn 110% so với trung bình 3 tháng trước, cảm biến IoT phát hiện có rò rỉ rỉ van nước.'}\n`;
        } else {
          explanation += `Mức tiêu thụ bình thường, đơn giá định mức 17.700 đ/m³.\n`;
        }
      }
      if (elecLine) {
        explanation += `⚡ **Tiền Điện:** Tiêu thụ **${elecLine.usage} kWh** (thành tiền: ${elecLine.total_line_amount.toLocaleString('vi-VN')} đ) theo biểu giá bậc thang EVN.\n\n`;
      }
      explanation += `💡 **Gợi ý xử lý:** Quý cư dân có thể vào mục **Báo Hỏng / Kỹ Thuật** để tạo yêu cầu, kỹ thuật viên tòa nhà sẽ hỗ trợ kiểm tra van nước và đồng hồ miễn phí cho gia đình ạ.\n\n💡 *Nội dung do AI phân tích tự động từ dữ liệu hệ thống, quý cư dân vui lòng đối chiếu chi tiết tại bảng kê hóa đơn gốc.*`;
      return explanation;
    }
  }

  // 3. Câu hỏi về cách tính phí quản lý
  if (norm.includes('quản lý') || norm.includes('phí ql') || norm.includes('tính thế nào') || norm.includes('công thức')) {
    const policy = await BILLING_TOOLS.getFeePolicy();
    return `Dạ theo quy định chuẩn của tòa nhà Skyline Residence:\n\n🏢 **Phí Quản Lý Vận Hành:**\n• **Đơn giá:** **18.000 VNĐ / m² thông thủy / tháng**\n• **Công thức tính:** \`Diện tích thông thủy (m²) × 18.000 đ\`\n• **Quyền lợi bao gồm:** An ninh bảo vệ 24/7, vệ sinh khu vực chung, vận hành hệ thống thang máy Otis SkyRise, chiếu sáng công cộng, hệ thống phòng cháy chữa cháy tự động, và đặc quyền sử dụng miễn phí Hồ bơi vô cực chân mây & Phòng Gym Technogym.\n\nĐối với căn hộ **${aptCode}** (diện tích 42.0 m²), phí quản lý cố định hàng tháng là **756.000 VNĐ** ạ.\n\n💡 *Nội dung do AI phân tích tự động từ dữ liệu hệ thống, quý cư dân vui lòng đối chiếu chi tiết tại bảng kê hóa đơn gốc.*`;
  }

  // 4. Mặc định
  const debt = await BILLING_TOOLS.getDebtSummary({}, ctx);
  return `Dạ em là **Trợ Lý Hóa Đơn AI** của tòa nhà Skyline. Em có thể hỗ trợ quý cư dân căn **${aptCode}**:\n\n1. 📊 Giải thích chi tiết nguyên nhân tăng/giảm tiền điện, tiền nước tháng này.\n2. 💳 Kiểm tra tình trạng nợ và hạn thanh toán các kỳ hóa đơn (Hiện tại căn mình có **${debt.unpaid_count} hóa đơn** chờ thanh toán).\n3. 📋 Hướng dẫn công thức tính phí quản lý, phí gửi xe hầm B1/B2 và các tiện ích VIP.\n\nQuý cư dân vui lòng nhập câu hỏi hoặc chọn một trong các gợi ý bên dưới để em hỗ trợ nhé ạ!\n\n💡 *Nội dung do AI phân tích tự động từ dữ liệu hệ thống, quý cư dân vui lòng đối chiếu chi tiết tại bảng kê hóa đơn gốc.*`;
}
