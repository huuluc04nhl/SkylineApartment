import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const mockRequireAuth = vi.fn();
const mockGetBillWithDetailsByIdDb = vi.fn();
const mockMarkBillPaidByIpnDb = vi.fn();
const mockRecordFailedBillIpnDb = vi.fn();
const mockConfirmBillPaidByAdminDb = vi.fn();
const mockListMeterReadingsDb = vi.fn();

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
}));

vi.mock('@/lib/server/billingDb', () => ({
  listBillsWithDetailsDb: vi.fn(),
  getBillWithDetailsByIdDb: (...args: any[]) => mockGetBillWithDetailsByIdDb(...args),
  markBillPaidByIpnDb: (...args: any[]) => mockMarkBillPaidByIpnDb(...args),
  recordFailedBillIpnDb: (...args: any[]) => mockRecordFailedBillIpnDb(...args),
  confirmBillPaidByAdminDb: (...args: any[]) => mockConfirmBillPaidByAdminDb(...args),
  publishAllDraftBillsDb: vi.fn(),
  listMeterReadingsDb: (...args: any[]) => mockListMeterReadingsDb(...args),
  insertMeterReadingDb: vi.fn(),
}));

function signVnpayQuery(params: Record<string, string>) {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, string>>((a, k) => ((a[k] = params[k]), a), {});
  const data = Object.entries(sorted)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&');
  const hmac = crypto
    .createHmac('sha512', process.env.VNP_HASH_SECRET!)
    .update(Buffer.from(data, 'utf-8'))
    .digest('hex');
  return `${data}&vnp_SecureHash=${hmac}`;
}

describe('Billing, VNPay IPN & Meter OCR routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admin user trying to mark bill paid via POST /api/billing (403)', async () => {
    const { POST } = await import('@/app/api/billing/route');
    mockRequireAuth.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const res = await POST(
      new Request('http://localhost/api/billing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'PAY', billId: 'BILL-1' }),
      })
    );
    expect(res.status).toBe(403);
  });

  it('enforces checksum (97), amount (04), and idempotency (00 then 02) on vnpay-ipn', async () => {
    const { GET } = await import('@/app/api/billing/vnpay-ipn/route');

    // 1. Invalid checksum -> 97
    const r97 = await (
      await GET(
        new Request(
          'http://localhost/api/billing/vnpay-ipn?vnp_TxnRef=BILL-1_1&vnp_Amount=50000000&vnp_ResponseCode=00&vnp_SecureHash=bad'
        )
      )
    ).json();
    expect(r97.RspCode).toBe('97');

    // 2. Amount mismatch -> 04
    mockGetBillWithDetailsByIdDb.mockResolvedValue({
      id: 'BILL-1',
      total_amount: 500000,
      status: 'Unpaid',
    });
    const q04 = signVnpayQuery({
      vnp_TxnRef: 'BILL-1_1',
      vnp_Amount: '10000000',
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'TX04',
    });
    const r04 = await (
      await GET(new Request(`http://localhost/api/billing/vnpay-ipn?${q04}`))
    ).json();
    expect(r04.RspCode).toBe('04');

    // 3. Valid IPN twice -> 00 first, 02 second
    const q00 = signVnpayQuery({
      vnp_TxnRef: 'BILL-1_2',
      vnp_Amount: '50000000',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TransactionNo: 'TX00',
      vnp_BankCode: 'NCB',
    });
    mockMarkBillPaidByIpnDb.mockResolvedValueOnce({ updated: true, bill: { id: 'BILL-1', status: 'Paid' } });
    const r00First = await (
      await GET(new Request(`http://localhost/api/billing/vnpay-ipn?${q00}`))
    ).json();
    expect(r00First.RspCode).toBe('00');

    mockGetBillWithDetailsByIdDb.mockResolvedValueOnce({
      id: 'BILL-1',
      total_amount: 500000,
      status: 'Paid',
    });
    const r00Second = await (
      await GET(new Request(`http://localhost/api/billing/vnpay-ipn?${q00}`))
    ).json();
    expect(r00Second.RspCode).toBe('02');
  });

  it('requires human confirmation below 0.85 confidence and returns 503 when Gemini fails on meter-ocr', async () => {
    const { POST } = await import('@/app/api/billing/meter-ocr/route');
    mockRequireAuth.mockResolvedValue({
      ok: true,
      session: {
        authUserId: 'auth-admin',
        role: 'ADMIN',
        profile: { full_name: 'Admin', role: 'ADMIN' },
      },
    });

    // Save with confidence < 0.85 and is_confirmed=false -> 422
    const res422 = await POST(
      new Request('http://localhost/api/billing/meter-ocr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          apartment_code: 'CH-06',
          meter_type: 'ELECTRIC',
          reading: 1500,
          confidence: 0.72,
          is_confirmed: false,
        }),
      })
    );
    expect(res422.status).toBe(422);

    // OCR analyze when GEMINI_API_KEY is unset -> 503 requires_manual_entry
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const res503 = await POST(
      new Request('http://localhost/api/billing/meter-ocr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,AAAAAAAAAAAA',
          apt_code: 'CH-06',
        }),
      })
    );
    if (prevKey) process.env.GEMINI_API_KEY = prevKey;

    const body503 = await res503.json();
    expect(res503.status).toBe(503);
    expect(body503.requires_manual_entry).toBe(true);
  });
});
