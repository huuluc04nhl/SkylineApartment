import { describe, it, expect } from 'vitest';
import { parseVietnameseCccdQr } from '@/lib/ocrParser';

describe('ocrParser.parseVietnameseCccdQr', () => {
  it('parses a valid Vietnamese chip CCCD QR string', () => {
    const qr = '079204001234|025123456|Nguyễn Văn An|02112004|Nam|123 Lê Lợi, Quận 1, TP. Hồ Chí Minh|15082022';
    const parsed = parseVietnameseCccdQr(qr);
    expect(parsed).not.toBeNull();
    expect(parsed?.idNumber).toBe('079204001234');
    expect(parsed?.fullName).toBe('NGUYỄN VĂN AN');
    expect(parsed?.dob).toBe('2004-11-02');
    expect(parsed?.gender).toBe('1');
    expect(parsed?.province).toBe('TP. Hồ Chí Minh');
    expect(parsed?.idDate).toBe('2022-08-15');
    expect(parsed?.confidence).toBe(100);
  });

  it('returns null for malformed or too-short QR strings', () => {
    expect(parseVietnameseCccdQr('')).toBeNull();
    expect(parseVietnameseCccdQr('invalid-no-pipes')).toBeNull();
    expect(parseVietnameseCccdQr('123|456|Name|01012000|Nam|Addr')).toBeNull();
  });
});
