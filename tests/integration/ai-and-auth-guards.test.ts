import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockProfileMaybeSingle = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockResetRateLimit = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    auth: {
      getUser: () => mockGetUser(),
      signInWithPassword: (args: any) => mockSignInWithPassword(args),
      signOut: () => mockSignOut(),
    },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => mockProfileMaybeSingle(),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          ilike: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      };
    }),
    rpc: vi.fn(async () => ({ data: true, error: null })),
  },
}));

vi.mock('@/lib/server/rateLimit', () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  resetRateLimit: (...args: any[]) => mockResetRateLimit(...args),
  extractClientIp: (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
}));

vi.mock('@/lib/server/userDb', () => ({
  findUserByIdentifierDb: vi.fn().mockResolvedValue(null),
  listApartmentMembersDb: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/server/ticketDb', () => ({
  listTicketsDb: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/server/billingDb', () => ({
  listBillsWithDetailsDb: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/server/visitorDb', () => ({
  listVisitorPassesDb: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/geminiClient', () => ({
  GEMINI_API_KEY: '',
  askGeminiConcierge: vi.fn().mockResolvedValue('Mock AI reply'),
  generateSmartProjectFallback: vi.fn().mockReturnValue('Fallback reply'),
  extractAiSuggestions: (t: string) => ({ cleanText: t, suggestions: [] }),
  extractAiAction: (t: string) => ({ cleanText: t, action: null }),
}));

import { POST as conciergePost } from '@/app/api/ai/concierge/route';
import { POST as communityPost } from '@/app/api/ai/community-assistant/route';
import { POST as ocrCccdPost } from '@/app/api/ai/ocr-cccd/route';
import { POST as ticketAiPost } from '@/app/api/ai/ticket-assistant/route';
import { POST as loginPost } from '@/app/api/user/login/route';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { identifyFaceAmongEnrolled } from '@/lib/biometricFaceEngine';

describe('AI routes auth, profile requirement & rate-limit enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockCheckRateLimit.mockResolvedValue(true);
    mockResetRateLimit.mockResolvedValue(undefined);
  });

  it('returns 401 when calling every /api/ai/* route unauthenticated', async () => {
    const reqInit = (body: Record<string, unknown>) => ({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const r1 = await conciergePost(new Request('http://localhost/api/ai/concierge', reqInit({ message: 'hi' })) as any);
    const r2 = await communityPost(new Request('http://localhost/api/ai/community-assistant', reqInit({ action: 'ANALYZE_POST', title: 't', content: 'c' })) as any);
    const r3 = await ocrCccdPost(new Request('http://localhost/api/ai/ocr-cccd', reqInit({ frontImage: 'abc' })) as any);
    const r4 = await ticketAiPost(new Request('http://localhost/api/ai/ticket-assistant', reqInit({ action: 'CLASSIFY', content: 'hỏng đèn' })) as any);

    expect(r1.status).toBe(401);
    expect(r2.status).toBe(401);
    expect(r3.status).toBe(401);
    expect(r4.status).toBe(401);
  });

  it('rejects TECHNICIAN from /api/ai/ocr-cccd with 403', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-tech-1', email: 'tech@skyline.vn' } },
      error: null,
    });
    mockProfileMaybeSingle.mockResolvedValue({
      data: { id: 'auth-tech-1', role: 'TECHNICIAN', apartment_code: null, full_name: 'Kỹ Thuật' },
      error: null,
    });

    const res = await ocrCccdPost(
      new Request('http://localhost/api/ai/ocr-cccd', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ frontImage: 'abc' }),
      }) as any
    );
    expect(res.status).toBe(403);
  });

  it('uses session apartment_code (not body.aptCode) in /api/ai/concierge and enforces 429 rate limit', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-owner-1', email: 'owner@skyline.vn' } },
      error: null,
    });
    mockProfileMaybeSingle.mockResolvedValue({
      data: { id: 'auth-owner-1', role: 'OWNER', apartment_code: 'BS08-CH08', full_name: 'Chủ Hộ', phone: '0909' },
      error: null,
    });

    const { askGeminiConcierge } = await import('@/lib/geminiClient');
    const res = await conciergePost(
      new Request('http://localhost/api/ai/concierge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Xem hóa đơn', aptCode: 'CH-06' }),
      }) as any
    );
    expect(res.status).toBe(200);
    expect(askGeminiConcierge).toHaveBeenCalledWith(
      'Xem hóa đơn',
      [],
      expect.objectContaining({ aptCode: 'BS08-CH08' })
    );

    mockCheckRateLimit.mockResolvedValueOnce(false);
    const rateLimited = await conciergePost(
      new Request('http://localhost/api/ai/concierge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'spam' }),
      }) as any
    );
    expect(rateLimited.status).toBe(429);
  });

  it('returns null from getAuthenticatedUser and 401 from /api/user/login when profiles row is missing', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-no-profile', email: 'ghost@skyline.vn' } },
      error: null,
    });
    mockProfileMaybeSingle.mockResolvedValue({ data: null, error: null });

    const session = await getAuthenticatedUser();
    expect(session).toBeNull();

    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'auth-no-profile', email: 'ghost@skyline.vn' } },
      error: null,
    });

    const loginRes = await loginPost(
      new Request('http://localhost/api/user/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.9.9.1' },
        body: JSON.stringify({ username: 'ghost@skyline.vn', password: 'Password123!' }),
      })
    );
    expect(loginRes.status).toBe(401);
  });

  it('rejects FaceID profile missing apartmentCode instead of defaulting to CH-06', () => {
    const vec = Array.from({ length: 128 }, () => 0.5);
    const result = identifyFaceAmongEnrolled(vec, [
      {
        userId: 'u-1',
        fullName: 'No Apt',
        apartmentCode: '',
        avatarUrl: '',
        samples: { front: '', left: '', right: '', smile: '' },
        descriptor: vec,
        enrolledAt: new Date().toISOString(),
        status: 'APPROVED',
        faceScore: 99,
      },
    ]);
    expect(result.matched).toBe(false);
  });
});
