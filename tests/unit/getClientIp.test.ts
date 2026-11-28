import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getClientIp } from '@/lib/server/rateLimit';

describe('getClientIp (anti-spoofing X-Forwarded-For)', () => {
  const prevProxyCount = process.env.TRUSTED_PROXY_COUNT;

  beforeEach(() => {
    delete process.env.TRUSTED_PROXY_COUNT;
  });

  afterEach(() => {
    if (prevProxyCount === undefined) delete process.env.TRUSTED_PROXY_COUNT;
    else process.env.TRUSTED_PROXY_COUNT = prevProxyCount;
  });

  it('ignores spoofed x-forwarded-for when TRUSTED_PROXY_COUNT is 0 or unset', () => {
    const req = new Request('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        'x-real-ip': '203.0.113.10',
      },
    });
    expect(getClientIp(req)).toBe('203.0.113.10');

    process.env.TRUSTED_PROXY_COUNT = '0';
    expect(getClientIp(req)).toBe('203.0.113.10');

    const reqNoRealIp = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(getClientIp(reqNoRealIp)).toBe('unknown');
  });

  it('picks parts[length - TRUSTED_PROXY_COUNT] when TRUSTED_PROXY_COUNT > 0', () => {
    process.env.TRUSTED_PROXY_COUNT = '1';
    const req = new Request('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '9.9.9.9, 198.51.100.42',
        'x-real-ip': '10.0.0.1',
      },
    });
    expect(getClientIp(req)).toBe('198.51.100.42');

    process.env.TRUSTED_PROXY_COUNT = '2';
    const reqTwoProxies = new Request('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '8.8.8.8, 198.51.100.77, 10.0.0.2',
      },
    });
    expect(getClientIp(reqTwoProxies)).toBe('198.51.100.77');
  });
});
