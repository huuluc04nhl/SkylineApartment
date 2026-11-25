import { NextResponse } from 'next/server';
import { buildVnpayPaymentUrl } from '@/lib/vnpay';
import { requireAuth } from '@/lib/auth/guard';
import { getBillWithDetailsByIdDb } from '@/lib/server/billingDb';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const { billId, bankCode, returnUrl } = body;

    if (!billId || typeof billId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã hóa đơn billId.' },
        { status: 400 }
      );
    }

    const bill = await getBillWithDetailsByIdDb(billId.trim());
    if (!bill) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy hóa đơn.' },
        { status: 404 }
      );
    }

    if (
      guard.session.role !== 'ADMIN' &&
      bill.apartment_code.toUpperCase() !== (guard.session.apartment_code || '').toUpperCase()
    ) {
      return NextResponse.json(
        { success: false, message: 'Không có quyền thanh toán hóa đơn của căn hộ khác.' },
        { status: 403 }
      );
    }

    if (bill.status === 'Paid') {
      return NextResponse.json(
        { success: false, message: 'Hóa đơn này đã được thanh toán hoàn tất trước đó.' },
        { status: 400 }
      );
    }

    const amount = Math.round(Number(bill.total_amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Số tiền hóa đơn không hợp lệ.' },
        { status: 400 }
      );
    }

    const aptCode = bill.apartment_code;
    const month = bill.billing_month;

    // Lấy IP client từ headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddr = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Lấy domain hiện tại (ưu tiên origin client, host header, hoặc Vercel production)
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const hostOrigin = host ? `${proto}://${host}` : null;

    const origin = req.headers.get('origin')
      || hostOrigin
      || process.env.NEXT_PUBLIC_BASE_URL
      || 'https://skyline-smart-residence.vercel.app';

    const computedReturnUrl = returnUrl || `${origin}/api/billing/vnpay-return`;

    const rawPaymentUrl = buildVnpayPaymentUrl({
      billId: bill.id,
      amount,
      orderInfo: `Thanh toan phi toa nha Skyline can ${aptCode} ky ${month}`,
      ipAddr,
      bankCode: bankCode || undefined,
      returnUrl: computedReturnUrl,
    });

    let finalPaymentUrl = rawPaymentUrl;
    const isNonProd = process.env.NODE_ENV !== 'production';

    if (isNonProd) {
      // Kiểm tra tính khả dụng của Terminal Code trên máy chủ Sandbox VNPAY (chỉ fallback sang cổng mô phỏng ở non-prod)
      try {
        const vnpCheck = await fetch(rawPaymentUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        const loc = vnpCheck.headers.get('location') || '';
        if (loc.includes('code=71') || loc.includes('code=72') || loc.includes('code=99')) {
          finalPaymentUrl = `${origin}/portal/vnpay-gateway?billId=${encodeURIComponent(bill.id)}&amount=${amount}&apt=${encodeURIComponent(aptCode)}&month=${encodeURIComponent(month)}&returnUrl=${encodeURIComponent(computedReturnUrl)}`;
        }
      } catch {
        finalPaymentUrl = `${origin}/portal/vnpay-gateway?billId=${encodeURIComponent(bill.id)}&amount=${amount}&apt=${encodeURIComponent(aptCode)}&month=${encodeURIComponent(month)}&returnUrl=${encodeURIComponent(computedReturnUrl)}`;
      }
    }

    return NextResponse.json({
      success: true,
      paymentUrl: finalPaymentUrl,
      billId: bill.id,
      amount,
    });
  } catch (error: any) {
    console.error('Lỗi khởi tạo thanh toán VNPAY:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Lỗi tạo liên kết thanh toán VNPAY.' },
      { status: 500 }
    );
  }
}
