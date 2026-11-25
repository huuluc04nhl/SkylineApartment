import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { getBills, payBill, confirmPaidByAdmin, publishAllBills, SKYLINE_BANK_INFO } from '@/lib/billingStore';

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

    const bills = getBills(effectiveApt);

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
    const body = await req.json().catch(() => ({}));
    const { action, billId, method, transactionCode, notes } = body;

    if (action === 'CONFIRM_PAID' || action === 'PUBLISH_ALL') {
      const adminGuard = await requireAuth(['ADMIN']);
      if (!adminGuard.ok) return adminGuard.response;

      if (action === 'CONFIRM_PAID' && billId) {
        const updated = confirmPaidByAdmin(billId, notes);
        return NextResponse.json({ success: !!updated, bill: updated });
      }
      if (action === 'PUBLISH_ALL') {
        publishAllBills();
        return NextResponse.json({ success: true, message: 'Đã phát hành toàn bộ hóa đơn.' });
      }
    }

    if (action === 'PAY' && billId) {
      const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
      if (!guard.ok) return guard.response;

      if (guard.session.role !== 'ADMIN') {
        const ownBills = getBills(guard.session.apartment_code || undefined);
        if (!ownBills.some((b) => b.id === billId)) {
          return NextResponse.json(
            { success: false, message: 'Không có quyền thanh toán hóa đơn của căn hộ khác.' },
            { status: 403 }
          );
        }
      }

      const updated = payBill(billId, method, transactionCode);
      return NextResponse.json({ success: !!updated, bill: updated });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi xử lý hóa đơn.' },
      { status: 500 }
    );
  }
}
