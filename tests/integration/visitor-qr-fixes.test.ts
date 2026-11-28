import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mockFindPass = vi.fn();
const mockCheckRateLimit = vi.fn();

vi.mock('@/lib/server/visitorDb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/visitorDb')>();
  return {
    ...actual,
    findVisitorPassByIdOrPinDb: (...args: unknown[]) => mockFindPass(...args),
  };
});

vi.mock('@/lib/server/rateLimit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

vi.mock('@/lib/languageContext', () => ({
  useLanguage: () => ({ t: (viStr: string) => viStr, isEn: false }),
}));

import { GET as publicVisitorGet } from '@/app/api/visitor/public/route';
import { generateVisitorPassId } from '@/lib/server/visitorDb';
import { extractPassLookupKey, shouldProcessQrScan } from '@/lib/visitorStore';
import VisitorQrModal from '@/components/portal/resident/VisitorQrModal';

describe('Visitor QR fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(true);
  });

  it('(a) renders VisitorQrModal at isOpen=false then isOpen=true without Rules of Hooks errors', () => {
    expect(() =>
      renderToStaticMarkup(
        React.createElement(VisitorQrModal, {
          isOpen: false,
          onClose: () => {},
          apartmentCode: 'BS08-CH08',
        })
      )
    ).not.toThrow();

    expect(() =>
      renderToStaticMarkup(
        React.createElement(VisitorQrModal, {
          isOpen: true,
          onClose: () => {},
          apartmentCode: 'BS08-CH08',
        })
      )
    ).not.toThrow();
  });

  it('(b) deduplicates identical QR scans within 4000ms cooldown window', () => {
    const qr = 'SKY-PASS-ABCDEF23';
    const t0 = 1_700_000_000_000;
    expect(shouldProcessQrScan(null, qr, t0, 4000)).toBe(true);

    const last = { data: qr, at: t0 };
    expect(shouldProcessQrScan(last, qr, t0 + 16, 4000)).toBe(false);
    expect(shouldProcessQrScan(last, qr, t0 + 3999, 4000)).toBe(false);
    expect(shouldProcessQrScan(last, qr, t0 + 4000, 4000)).toBe(true);
    expect(shouldProcessQrScan(last, 'SKY-PASS-ZZZZ9999', t0 + 500, 4000)).toBe(true);
  });

  it('(c) enforces id+pin, rate limit (429), and omits hostPhone on GET /api/visitor/public', async () => {
    // Missing pin -> 400
    const resMissingPin = await publicVisitorGet(
      new Request('http://localhost/api/visitor/public?id=SKY-PASS-ABCDEF23')
    );
    expect(resMissingPin.status).toBe(400);

    // Wrong pin -> 404
    mockFindPass.mockResolvedValueOnce({
      id: 'SKY-PASS-ABCDEF23',
      pinCode: '123456',
      visitorName: 'Nguyễn Văn A',
      apartmentCode: 'BS08-CH08',
      hostPhone: '0909999888',
      phoneNumber: '0911222333',
      status: 'ACTIVE',
      validUntil: new Date(Date.now() + 3600_000).toISOString(),
      createdAt: new Date().toISOString(),
      validHours: 4,
      entryType: 'MULTI',
    });
    const resWrongPin = await publicVisitorGet(
      new Request('http://localhost/api/visitor/public?id=SKY-PASS-ABCDEF23&pin=999999')
    );
    expect(resWrongPin.status).toBe(404);

    // Valid id + pin -> 200 without hostPhone or visitor phoneNumber
    mockFindPass.mockResolvedValueOnce({
      id: 'SKY-PASS-ABCDEF23',
      pinCode: '123456',
      visitorName: 'Nguyễn Văn A',
      apartmentCode: 'BS08-CH08',
      hostPhone: '0909999888',
      phoneNumber: '0911222333',
      status: 'ACTIVE',
      validUntil: new Date(Date.now() + 3600_000).toISOString(),
      createdAt: new Date().toISOString(),
      validHours: 4,
      entryType: 'MULTI',
    });
    const resValid = await publicVisitorGet(
      new Request('http://localhost/api/visitor/public?id=SKY-PASS-ABCDEF23&pin=123456')
    );
    expect(resValid.status).toBe(200);
    const jsonValid = await resValid.json();
    expect(jsonValid.pass.id).toBe('SKY-PASS-ABCDEF23');
    expect(jsonValid.pass.hostPhone).toBeUndefined();
    expect(jsonValid.pass.phoneNumber).toBeUndefined();

    // Rate limit exceeded -> 429
    mockCheckRateLimit.mockResolvedValueOnce(false);
    const res429 = await publicVisitorGet(
      new Request('http://localhost/api/visitor/public?id=SKY-PASS-ABCDEF23&pin=123456')
    );
    expect(res429.status).toBe(429);
  });

  it('(d) generates 2,000 unique base32 visitor pass IDs without collisions', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const id = generateVisitorPassId();
      expect(id).toMatch(/^SKY-PASS-[A-Z2-7]{8}$/);
      expect(extractPassLookupKey(`Mã thẻ vé: ${id}`)).toBe(id);
      seen.add(id);
    }
    expect(seen.size).toBe(2000);
    expect(extractPassLookupKey('Mã thẻ vé: SKY-PASS-8492')).toBe('SKY-PASS-8492');
  });
});
