import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import {
  findVisitorPassByIdOrPinDb,
  createVisitorPassDb,
  verifyVisitorQrDb,
  checkInVisitorPassDb,
  checkOutVisitorPassDb,
  deleteVisitorPassDb,
  purgeExpiredVisitorPassesDb,
  listVisitorPassesDb,
  listGateLogsDb,
} from '@/lib/server/visitorDb';

/**
 * GET /api/visitor
 * Lookup visitor pass by id or pin, or list passes + gateLogs.
 */
export async function GET(request: Request) {
  const guard = await requireAuth(['ADMIN', 'RECEPTIONIST', 'OWNER', 'TENANT']);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || searchParams.get('passId');
  const pin = searchParams.get('pin');

  if (id || pin) {
    const isStaff = guard.session.role === 'ADMIN' || guard.session.role === 'RECEPTIONIST';
    if (pin && !id && !isStaff) {
      return NextResponse.json(
        { success: false, message: 'Tra cứu bằng mã PIN riêng lẻ chỉ dành cho nhân viên.' },
        { status: 403 }
      );
    }
    const pass = await findVisitorPassByIdOrPinDb((id || pin)!, isStaff);

    if (pass) {
      if (
        (guard.session.role === 'OWNER' || guard.session.role === 'TENANT') &&
        pass.apartmentCode !== guard.session.apartment_code
      ) {
        return NextResponse.json(
          { success: false, message: 'Không tìm thấy thông tin thẻ khách thăm hợp lệ.' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        pass,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Không tìm thấy thông tin thẻ khách thăm hợp lệ.',
      },
      { status: 404 }
    );
  }

  const isResident = guard.session.role === 'OWNER' || guard.session.role === 'TENANT';
  const aptFilter = isResident
    ? guard.session.apartment_code || '__NONE__'
    : searchParams.get('apartment_code') || undefined;
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 50)));
  const offset = Math.max(0, Number(searchParams.get('offset') || 0));

  const [passes, gateLogs] = await Promise.all([
    listVisitorPassesDb({ apartmentCode: aptFilter, limit, offset }),
    listGateLogsDb({ apartmentCode: aptFilter, limit, offset }),
  ]);

  return NextResponse.json({
    success: true,
    passes,
    gateLogs,
  });
}

/**
 * POST /api/visitor
 * GENERATE/CREATE (OWNER/TENANT/ADMIN), VERIFY/CHECK_IN/CHECK_OUT (ADMIN/RECEPTIONIST), DELETE/PURGE_EXPIRED (ADMIN).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    // 1. Generate ephemeral QR token
    if (action === 'GENERATE' || action === 'CREATE') {
      const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
      if (!guard.ok) return guard.response;

      const {
        apartmentCode,
        hostName,
        hostPhone,
        towerName,
        visitorName,
        phoneNumber,
        licensePlate,
        entryType,
        validHours,
        note,
      } = body;

      const effectiveApt = (
        guard.session.role === 'ADMIN'
          ? apartmentCode
          : guard.session.apartment_code
      )?.trim();
      if (!effectiveApt) {
        return NextResponse.json({ success: false, message: 'Thiếu mã căn hộ hợp lệ.' }, { status: 400 });
      }

      const sessionName =
        typeof guard.session.profile?.full_name === 'string' && guard.session.profile.full_name.trim()
          ? guard.session.profile.full_name.trim()
          : undefined;
      const sessionPhone =
        typeof guard.session.profile?.phone === 'string' && guard.session.profile.phone.trim()
          ? guard.session.profile.phone.trim()
          : undefined;

      const pass = await createVisitorPassDb({
        apartmentCode: effectiveApt,
        hostName: guard.session.role === 'ADMIN' ? hostName || sessionName : sessionName || hostName,
        hostPhone: guard.session.role === 'ADMIN' ? hostPhone || sessionPhone : sessionPhone || hostPhone,
        towerName: typeof towerName === 'string' ? towerName : undefined,
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

    // 2. Delete / Purge Expired (ADMIN only)
    if (action === 'DELETE' || action === 'PURGE_EXPIRED') {
      const adminGuard = await requireAuth(['ADMIN']);
      if (!adminGuard.ok) return adminGuard.response;

      if (action === 'PURGE_EXPIRED') {
        const deletedCount = await purgeExpiredVisitorPassesDb();
        return NextResponse.json({
          success: true,
          deletedCount,
          message:
            deletedCount > 0
              ? `Đã xóa ${deletedCount} thẻ khách hết hạn khỏi hệ thống.`
              : 'Không có thẻ khách hết hạn nào cần dọn dẹp.',
        });
      }

      const passId = typeof body.passId === 'string' ? body.passId : '';
      if (!passId.trim()) {
        return NextResponse.json({ success: false, message: 'Thiếu mã thẻ khách cần xóa.' }, { status: 400 });
      }
      const deleted = await deleteVisitorPassDb(passId);
      if (!deleted) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy mã thẻ khách.' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: 'Đã hủy và xóa thẻ khách thành công.',
      });
    }

    // 3. Verify / Check-In / Check-Out chỉ dành cho ADMIN & RECEPTIONIST
    const staffGuard = await requireAuth(['ADMIN', 'RECEPTIONIST']);
    if (!staffGuard.ok) return staffGuard.response;

    const actorName =
      (typeof staffGuard.session.profile?.full_name === 'string' && staffGuard.session.profile.full_name.trim()) ||
      staffGuard.session.email ||
      staffGuard.session.authUserId;
    const checkpoint = typeof body.checkpoint === 'string' && body.checkpoint.trim() ? body.checkpoint.trim() : undefined;

    if (action === 'VERIFY' || action === 'VERIFY_SCAN') {
      const { qrCode } = body;
      const result = await verifyVisitorQrDb(qrCode || '', checkpoint, actorName);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (action === 'CHECK_IN') {
      const { passId } = body;
      if (typeof passId !== 'string' || !passId.trim()) {
        return NextResponse.json({ success: false, message: 'Thiếu mã thẻ khách.' }, { status: 400 });
      }
      try {
        const updated = await checkInVisitorPassDb(passId, checkpoint, actorName);
        if (updated) {
          return NextResponse.json({
            success: true,
            message: 'Đã check-in đón khách thành công.',
            pass: updated,
          });
        }
        return NextResponse.json({ success: false, message: 'Không tìm thấy mã thẻ khách' }, { status: 404 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể check-in thẻ khách.';
        return NextResponse.json({ success: false, message: msg }, { status: 400 });
      }
    }

    if (action === 'CHECK_OUT') {
      const { passId } = body;
      if (typeof passId !== 'string' || !passId.trim()) {
        return NextResponse.json({ success: false, message: 'Thiếu mã thẻ khách.' }, { status: 400 });
      }
      const updated = await checkOutVisitorPassDb(passId, checkpoint, actorName);
      if (updated) {
        return NextResponse.json({
          success: true,
          message: 'Đã ghi nhận khách rời tòa nhà.',
          pass: updated,
        });
      }
      return NextResponse.json({ success: false, message: 'Không tìm thấy mã thẻ khách' }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi xử lý thẻ khách.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminGuard = await requireAuth(['ADMIN']);
  if (!adminGuard.ok) return adminGuard.response;

  const { searchParams } = new URL(request.url);
  const passId = searchParams.get('id') || searchParams.get('passId') || '';
  if (!passId.trim()) {
    return NextResponse.json({ success: false, message: 'Thiếu mã thẻ khách cần xóa.' }, { status: 400 });
  }

  const deleted = await deleteVisitorPassDb(passId);
  if (!deleted) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy mã thẻ khách.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Đã hủy và xóa thẻ khách thành công.',
  });
}
