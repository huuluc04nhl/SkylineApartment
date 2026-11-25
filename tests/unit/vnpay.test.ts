import { describe, it, expect } from 'vitest';
import { buildVnpayPaymentUrl, verifyVnpayChecksum } from '@/lib/vnpay';

describe('vnpay checksum & payment URL', () => {
  it('builds a signed URL and verifies its checksum as valid', () => {
    const urlStr = buildVnpayPaymentUrl({
      billId: 'BILL-TEST-01',
      amount: 1500000,
      ipAddr: '127.0.0.1',
      returnUrl: 'http://localhost:3000/api/billing/vnpay-return',
    });

    const parsed = new URL(urlStr);
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const check = verifyVnpayChecksum(params);
    expect(check.isValid).toBe(true);
    expect(params.vnp_Amount).toBe('150000000');
  });

  it('rejects tampered amount or invalid secure hash', () => {
    const urlStr = buildVnpayPaymentUrl({
      billId: 'BILL-TEST-02',
      amount: 2000000,
      ipAddr: '127.0.0.1',
      returnUrl: 'http://localhost:3000/api/billing/vnpay-return',
    });
    const parsed = new URL(urlStr);
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Tamper amount
    params.vnp_Amount = '10000';
    expect(verifyVnpayChecksum(params).isValid).toBe(false);

    // Tamper hash
    params.vnp_Amount = '200000000';
    params.vnp_SecureHash = '0000deadbeef';
    expect(verifyVnpayChecksum(params).isValid).toBe(false);
  });
});
