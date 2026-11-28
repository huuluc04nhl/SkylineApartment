import { NextResponse } from 'next/server';
import { findVisitorPassByIdOrPinDb } from '@/lib/server/visitorDb';
import { checkRateLimit, getClientIp } from '@/lib/server/rateLimit';

/**
 * GET /api/visitor/public?id=SKY-PASS-...&pin=123456
 * Tra cứu thẻ khách thăm công khai (không cần đăng nhập):
 * - Bắt buộc cả id và pin khớp cùng một thẻ.
 * - Giới hạn tần suất theo IP qua rate_limits.
 * - Chỉ trả về các trường tối thiểu, tuyệt đối không trả số điện thoại chủ hộ.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`visitor_public:${ip}`, 20, 60, true);
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: 'Quá nhiều lượt tra cứu. Vui lòng thử lại sau ít phút.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || searchParams.get('passId') || '').trim();
  const pin = (searchParams.get('pin') || '').trim();

  if (!id || !pin) {
    return NextResponse.json(
      { success: false, message: 'Vui lòng cung cấp đầy đủ mã thẻ (id) và mã PIN.' },
      { status: 400 }
    );
  }

  const pass = await findVisitorPassByIdOrPinDb(id, false);
  if (!pass || pass.id.toUpperCase() !== id.toUpperCase() || pass.pinCode !== pin) {
    return NextResponse.json(
      { success: false, message: 'Mã thẻ hoặc mã PIN không chính xác.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    pass: {
      id: pass.id,
      visitorName: pass.visitorName,
      apartmentCode: pass.apartmentCode,
      towerName: pass.towerName,
      status: pass.status,
      validUntil: pass.validUntil,
      createdAt: pass.createdAt,
      validHours: pass.validHours,
      entryType: pass.entryType,
      pinCode: pass.pinCode,
      licensePlate: pass.licensePlate,
      note: pass.note,
      checkedInAt: pass.checkedInAt,
      checkedOutAt: pass.checkedOutAt,
    },
  });
}
