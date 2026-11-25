import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetAuthenticatedUser = vi.fn();
const mockRequireAuth = vi.fn();

// Shared in-memory DB state simulating Postgres ekyc_submissions & face_enrollments tables
const dbState = {
  ekyc: new Map<string, any>(),
  face: new Map<string, any>(),
};

const sampleVector = Array.from({ length: 128 }, (_, i) => (i % 2 === 0 ? 0.8 : 0.2));

vi.mock('@/lib/server/auth', () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}));

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: (roles?: string[]) => mockRequireAuth(roles),
}));

vi.mock('@/lib/server/userDb', () => ({
  findUserByIdentifierDb: vi.fn().mockResolvedValue(null),
  updateUserProfileDb: vi.fn().mockResolvedValue(null),
  updateApartmentMemberDb: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/biometricFaceEngine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/biometricFaceEngine')>();
  return {
    ...actual,
    analyzeBiometric4Samples: vi.fn(() => ({
      valid: true,
      livenessPassed: true,
      poseVarianceScore: 95,
      faceScore: 98,
      compositeDescriptor: sampleVector,
      descriptorsByAngle: {
        front: sampleVector,
        left: sampleVector,
        right: sampleVector,
        smile: sampleVector,
      },
      details: {
        frontLeftSim: 88,
        frontRightSim: 89,
        frontSmileSim: 90,
        leftRightSim: 85,
      },
    })),
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    auth: {
      verifyOtp: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-tenant-1' } }, error: null }),
    },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        generateLink: vi.fn().mockResolvedValue({
          data: { properties: { hashed_token: 'mock-token' } },
          error: null,
        }),
      },
    },
    rpc: vi.fn(async (fn: string, args: Record<string, any>) => {
      if (fn === 'check_face_login_rate_limit') return { data: true, error: null };
      if (fn === 'transition_ekyc_and_face_tx') {
        const target =
          (args.p_ekyc_id && dbState.ekyc.get(args.p_ekyc_id)) ||
          Array.from(dbState.ekyc.values()).find(
            (r) => r.user_id === args.p_target_user || r.phone === args.p_target_user
          );
        if (!target) return { data: null, error: { message: 'EKYC_NOT_FOUND: Không tìm thấy hồ sơ' } };

        if (args.p_action === 'CONFIRM_BY_OWNER') {
          if (args.p_actor_apt && target.apartment_code.toUpperCase() !== args.p_actor_apt.toUpperCase()) {
            return { data: null, error: { message: 'FORBIDDEN_APARTMENT: Sai căn hộ' } };
          }
          target.status = 'PENDING';
          const f = dbState.face.get(target.user_id);
          if (f) f.status = 'PENDING';
          return { data: target, error: null };
        }
        if (args.p_action === 'APPROVE') {
          target.status = 'APPROVED';
          const f = dbState.face.get(target.user_id);
          if (f) f.status = 'APPROVED';
          return { data: target, error: null };
        }
        if (args.p_action === 'REVOKE') {
          target.status = 'REVOKED';
          const f = dbState.face.get(target.user_id);
          if (f) f.status = 'REVOKED';
          return { data: target, error: null };
        }
      }
      return { data: null, error: null };
    }),
    from: vi.fn((table: string) => {
      if (table === 'face_enrollments') {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => ({ data: dbState.face.get(val) || null, error: null }),
              then: (resolve: any) =>
                resolve({
                  data: Array.from(dbState.face.values()).filter((r) => r.status === val),
                  error: null,
                }),
            }),
          }),
          upsert: async (row: any) => {
            dbState.face.set(row.user_id, row);
            return { error: null };
          },
        };
      }
      if (table === 'ekyc_submissions') {
        return {
          select: () => ({
            or: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: Array.from(dbState.ekyc.values())[0] || null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          upsert: (row: any) => ({
            select: () => ({
              single: async () => {
                dbState.ekyc.set(row.id, row);
                return { data: row, error: null };
              },
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'auth-tenant-1',
                  email: 'tenant@skyline.vn',
                  full_name: 'Tenant Test',
                  phone: '0911222333',
                  role: 'TENANT',
                  apartment_code: 'CH-06',
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    }),
  },
}));

describe('e-KYC -> FaceID atomic status sync flow', () => {
  beforeEach(() => {
    dbState.ekyc.clear();
    dbState.face.clear();
    vi.clearAllMocks();
  });

  it('requires PENDING_OWNER -> CONFIRM_BY_OWNER -> ADMIN APPROVE before face-login succeeds, and blocks after REVOKE', async () => {
    const { POST: faceEnrollPost } = await import('@/app/api/user/face-enroll/route');
    const { POST: ekycPost } = await import('@/app/api/ekyc/route');
    const { POST: faceLoginPost } = await import('@/app/api/user/face-login/route');

    // 1. TENANT enrolls FaceID -> PENDING_OWNER in face_enrollments
    mockGetAuthenticatedUser.mockResolvedValueOnce({
      authUserId: 'auth-tenant-1',
      email: 'tenant@skyline.vn',
      role: 'TENANT',
      apartment_code: 'CH-06',
      profile: { id: 'user-tenant-1', fullname: 'Tenant Test', phone: '0911222333', role: 'TENANT', apartment_code: 'CH-06' },
    });

    const makeSampleImg = (fill: number) => {
      const buf = Buffer.alloc(3500, fill);
      buf[0] = 0x89; buf[1] = 0x50; buf[2] = 0x4e; buf[3] = 0x47;
      buf.writeUInt32BE(640, 16);
      buf.writeUInt32BE(480, 20);
      return 'data:image/png;base64,' + buf.toString('base64');
    };
    const enrollRes = await faceEnrollPost(
      new Request('http://localhost/api/user/face-enroll', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-tenant-1',
          apartmentCode: 'CH-06',
          descriptor: sampleVector,
          samples: {
            front: makeSampleImg(1),
            left: makeSampleImg(2),
            right: makeSampleImg(3),
            smile: makeSampleImg(4),
          },
          submittedByRole: 'TENANT',
        }),
      })
    );
    expect(enrollRes.status).toBe(200);
    expect(dbState.face.get('user-tenant-1')?.status).toBe('PENDING_OWNER');

    // Seed matching ekyc_submissions row in PENDING_OWNER
    dbState.ekyc.set('EKYC-1', {
      id: 'EKYC-1',
      user_id: 'user-tenant-1',
      full_name: 'Tenant Test',
      role_label: 'Người Nhà',
      apartment_code: 'CH-06',
      phone: '0911222333',
      id_card_no: '079204001234',
      avatar_url: '',
      status: 'PENDING_OWNER',
    });

    // Unapproved -> face-login fails (401)
    const loginBeforeApprove = await faceLoginPost(
      new Request('http://localhost/api/user/face-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.1.1.1' },
        body: JSON.stringify({ faceVector: sampleVector }),
      })
    );
    expect(loginBeforeApprove.status).toBe(401);

    // 2. Owner of DIFFERENT apartment cannot CONFIRM_BY_OWNER (403)
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'owner-other', role: 'OWNER', apartment_code: 'BS08-CH08', email: 'other@skyline.vn', profile: {} },
    });
    const wrongOwnerRes = await ekycPost(
      new Request('http://localhost/api/ekyc', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'CONFIRM_BY_OWNER', userId: 'user-tenant-1' }),
      })
    );
    expect(wrongOwnerRes.status).toBe(403);

    // Owner of SAME apartment (CH-06) confirms -> PENDING
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'owner-ch06', role: 'OWNER', apartment_code: 'CH-06', email: 'owner@skyline.vn', profile: {} },
    });
    const confirmRes = await ekycPost(
      new Request('http://localhost/api/ekyc', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'CONFIRM_BY_OWNER', userId: 'user-tenant-1' }),
      })
    );
    expect(confirmRes.status).toBe(200);
    expect(dbState.face.get('user-tenant-1')?.status).toBe('PENDING');

    // 3. ADMIN approves -> face_enrollments.status = 'APPROVED'
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'admin-1', role: 'ADMIN', apartment_code: null, email: 'admin@skyline.vn', profile: {} },
    });
    const approveRes = await ekycPost(
      new Request('http://localhost/api/ekyc', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', id: 'EKYC-1' }),
      })
    );
    expect(approveRes.status).toBe(200);
    expect(dbState.face.get('user-tenant-1')?.status).toBe('APPROVED');

    // 4. Face-login now succeeds (200)
    const loginAfterApprove = await faceLoginPost(
      new Request('http://localhost/api/user/face-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.1.1.2' },
        body: JSON.stringify({ faceVector: sampleVector }),
      })
    );
    expect(loginAfterApprove.status).toBe(200);

    // 5. ADMIN revokes -> face-login fails again (401)
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'admin-1', role: 'ADMIN', apartment_code: null, email: 'admin@skyline.vn', profile: {} },
    });
    const revokeRes = await ekycPost(
      new Request('http://localhost/api/ekyc', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'REVOKE', id: 'EKYC-1', reason: 'Mất quyền' }),
      })
    );
    expect(revokeRes.status).toBe(200);
    expect(dbState.face.get('user-tenant-1')?.status).toBe('REVOKED');

    const loginAfterRevoke = await faceLoginPost(
      new Request('http://localhost/api/user/face-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.1.1.3' },
        body: JSON.stringify({ faceVector: sampleVector }),
      })
    );
    expect(loginAfterRevoke.status).toBe(401);
  });
});
