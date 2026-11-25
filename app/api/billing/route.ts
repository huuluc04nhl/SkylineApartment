import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { SKYLINE_BANK_INFO } from '@/lib/billingStore';
import {
  listBillsWithDetailsDb,
  confirmBillPaidByAdminDb,
  publishAllDraftBillsDb,
} from '@/lib/server/billingDb';

export async function GET(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const requestedApt = searchParams.get('aptCode') || undefined;
    const effectiveApt =
      guard.session.role === 'ADMIN'
        ? requestedApt
        : guard.session.apartment_code || undefined;

    const bills = await listBillsWithDetailsDb(effectiveApt);

    return NextResponse.json({
      success: true,
      bills,
      bankInfo: SKYLINE_BANK_INFO,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi tải danh sách hóa đơn.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const adminGuard = await requireAuth(['ADMIN']);
    if (!adminGuard.ok) return adminGuard.response;

    const body = await req.json().catch(() => ({}));
    const { action, billId, notes } = body;

    if (action === 'CONFIRM_PAID' && typeof billId === 'string' && billId.trim()) {
      const updated = await confirmBillPaidByAdminDb(
        billId.trim(),
        adminGuard.session.email || adminGuard.session.authUserId,
        typeof notes === 'string' ? notes : undefined
      );
      if (!updated) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy hóa đơn.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, bill: updated });
    }

    if (action === 'PUBLISH_ALL') {
      const publishedCount = await publishAllDraftBillsDb();
      return NextResponse.json({
        success: true,
        publishedCount,
        message: 'Đã phát hành toàn bộ hóa đơn.',
      });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi xử lý hóa đơn.' },
      { status: 500 }
    );
  }
}
