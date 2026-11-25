import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { 
  generateVisitorPassToken, 
  verifyVisitorQr,
  getPassRegistry,
  getAllVisitorPasses,
  checkInVisitorPass,
  checkOutVisitorPass
} from '@/lib/visitorStore';

/**
 * GET /api/visitor
 * Lookup visitor pass by id or pin (chỉ ADMIN, RECEPTIONIST, hoặc cư dân xem thẻ căn hộ mình)
 */
export async function GET(request: Request) {
  const guard = await requireAuth(['ADMIN', 'RECEPTIONIST', 'OWNER', 'TENANT']);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || searchParams.get('passId');
  const pin = searchParams.get('pin');

  if (id || pin) {
    const registry = getPassRegistry();
    let pass = id ? registry.get(id) : undefined;
    if (!pass && pin) pass = registry.get(pin);
    if (!pass) {
      const all = getAllVisitorPasses();
      pass = all.find(p => p.id === id || p.pinCode === pin);
    }

    if (pass) {
      if (
        (guard.session.role === 'OWNER' || guard.session.role === 'TENANT') &&
        pass.apartmentCode !== guard.session.apartment_code
      ) {
        return NextResponse.json(
          { success: false, message: 'Không có quyền xem thẻ khách của căn hộ khác.' },
          { status: 403 }
        );
      }
      return NextResponse.json({
        success: true,
        pass,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Không tìm thấy thông tin thẻ khách thăm hợp lệ.',
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Skyline Secure Visitor Access Gateway (Zero-Dossier Privacy Enabled)',
  });
}

/**
 * POST /api/visitor
 * Generate ephemeral token (OWNER/TENANT/ADMIN), verify/check-in/out (ADMIN/RECEPTIONIST).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Generate ephemeral QR token
    if (action === 'GENERATE' || action === 'CREATE') {
      const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
      if (!guard.ok) return guard.response;

      const { apartmentCode, visitorName, phoneNumber, licensePlate, entryType, validHours, note } = body;
      const effectiveApt =
        guard.session.role === 'ADMIN'
          ? apartmentCode || 'CH-06'
          : guard.session.apartment_code || 'CH-06';

      const pass = generateVisitorPassToken({
        apartmentCode: effectiveApt,
        visitorName: visitorName || 'Khách Thăm Nhà',
        phoneNumber,
        licensePlate,
        entryType: entryType || 'MULTI',
        validHours: validHours || 4,
        note,
      });

      return NextResponse.json({
        success: true,
        message: 'Mã QR đón khách được tạo thành công và có hiệu lực ngay lập tức.',
        pass,
      });
    }

    // 2. Verify / Check-In / Check-Out chỉ dành cho ADMIN & RECEPTIONIST
    const staffGuard = await requireAuth(['ADMIN', 'RECEPTIONIST']);
    if (!staffGuard.ok) return staffGuard.response;

    if (action === 'VERIFY' || action === 'VERIFY_SCAN') {
      const { qrCode } = body;
      const result = verifyVisitorQr(qrCode || '');
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // 3. Confirm Check-In
    if (action === 'CHECK_IN') {
      const { passId } = body;
      const updated = checkInVisitorPass(passId);
      if (updated) {
        return NextResponse.json({
          success: true,
          message: 'Đã check-in đón khách thành công.',
          pass: updated
        });
      }
      return NextResponse.json({ success: false, message: 'Không tìm thấy mã thẻ khách' }, { status: 404 });
    }

    // 4. Confirm Check-Out
    if (action === 'CHECK_OUT') {
      const { passId } = body;
      const updated = checkOutVisitorPass(passId);
      if (updated) {
        return NextResponse.json({
          success: true,
          message: 'Đã ghi nhận khách rời tòa nhà.',
          pass: updated
        });
      }
      return NextResponse.json({ success: false, message: 'Không tìm thấy mã thẻ khách' }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
