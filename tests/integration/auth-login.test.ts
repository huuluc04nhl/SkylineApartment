import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: mockAdminFrom,
  },
}));

describe('Auth & Login route security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the exact same 401 message for unknown account and wrong password', async () => {
    const { POST } = await import('@/app/api/user/login/route');

    // 1. Account does not exist in profiles or users
    mockAdminFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }));

    const resUnknown = await POST(
      new Request('http://localhost/api/user/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: '0999888777', password: 'any-password' }),
      })
    );
    const bodyUnknown = await resUnknown.json();

    // 2. Account exists, wrong password
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    const resWrongPass = await POST(
      new Request('http://localhost/api/user/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'resident@skyline.vn', password: 'wrong-password' }),
      })
    );
    const bodyWrongPass = await resWrongPass.json();

    expect(resUnknown.status).toBe(401);
    expect(resWrongPass.status).toBe(401);
    expect(bodyUnknown.message).toBe(bodyWrongPass.message);
    expect(bodyUnknown.message).toBe('Thông tin đăng nhập không chính xác.');
  });

  it('rejects forged/unauthenticated cookies in requireAuth', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT invalid' },
    });

    const { requireAuth } = await import('@/lib/auth/guard');
    const guard = await requireAuth(['ADMIN']);
    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.response.status).toBe(401);
    }
  });

  it('ignores clientProfiles in face-login and queries only approved face_enrollments in DB', async () => {
    const { POST } = await import('@/app/api/user/face-login/route');

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'face_enrollments') {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table query: ${table}`);
    });

    const res = await POST(
      new Request('http://localhost/api/user/face-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.99' },
        body: JSON.stringify({
          faceVector: Array(128).fill(0.5),
          clientProfiles: [
            {
              userId: 'FAKE-ADMIN',
              fullName: 'Attacker',
              role: 'ADMIN',
              descriptor: Array(128).fill(0.5),
              status: 'APPROVED',
            },
          ],
        }),
      })
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(mockAdminFrom).toHaveBeenCalledWith('face_enrollments');
  });
});
