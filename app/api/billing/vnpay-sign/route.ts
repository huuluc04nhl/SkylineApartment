import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVnpayConfig, sortObject } from '@/lib/vnpay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, message: 'Simulated VNPay signing is disabled in production.' },
      { status: 403 }
    );
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { billId, amount, bankCode, returnUrl } = body;

    if (!billId) {
      return NextResponse.json({ success: false, message: 'Thiếu mã billId' }, { status: 400 });
    }

    const txnRef = `${billId}_${Date.now()}`;
    const amountVal = Math.round(Number(amount || 0)) * 100;
    const transNo = `VNP${Date.now().toString().slice(-8)}`;

    const cfg = getVnpayConfig();
    const vnp_Params: Record<string, unknown> = {
      vnp_Amount: amountVal,
      vnp_BankCode: bankCode || 'NCB',
      vnp_BankTranNo: `VNP${Date.now().toString().slice(-6)}`,
      vnp_CardType: 'ATM',
      vnp_OrderInfo: `Thanh toan hoa don ${billId}`,
      vnp_PayDate: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
      vnp_ResponseCode: '00',
      vnp_TmnCode: cfg.tmnCode,
      vnp_TransactionNo: transNo,
      vnp_TransactionStatus: '00',
      vnp_TxnRef: txnRef,
    };

    const sorted = sortObject(vnp_Params);
    const signData = Object.entries(sorted).map(([k, v]) => `${k}=${v}`).join('&');
    const hmac = crypto.createHmac('sha512', cfg.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const redirectUrl = `${returnUrl || '/api/billing/vnpay-return'}?${signData}&vnp_SecureHash=${signed}`;
    return NextResponse.json({ success: true, redirectUrl, transNo });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, message: (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}

