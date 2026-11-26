import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRequireAuth = vi.fn();
const visitorState = {
  passes: new Map<string, any>(),
  logs: [] as any[],
};

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: (roles?: string[]) => mockRequireAuth(roles),
}));

vi.mock('@/lib/server/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/server/visitorDb', () => ({
  findVisitorPassByIdOrPinDb: vi.fn(async (idOrPin: string) => {
    return Array.from(visitorState.passes.values()).find((p) => p.id === idOrPin || p.pinCode === idOrPin) || null;
  }),
  createVisitorPassDb: vi.fn(async (params: any) => {
    const pass = {
      id: `SKY-PASS-${visitorState.passes.size + 1001}`,
      apartmentCode: params.apartmentCode,
      hostName: params.hostName || 'Chủ Hộ',
      hostPhone: params.hostPhone || '',
      visitorName: params.visitorName,
      entryType: params.entryType || 'MULTI',
      validHours: params.validHours || 4,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      qrData: '{}',
      pinCode: '654321',
      status: 'ACTIVE',
    };
    visitorState.passes.set(pass.id, pass);
    return pass;
  }),
  listVisitorPassesDb: vi.fn(async (filter?: { apartmentCode?: string }) => {
    const all = Array.from(visitorState.passes.values());
    if (filter?.apartmentCode) {
      return all.filter((p) => p.apartmentCode.toUpperCase() === filter.apartmentCode!.toUpperCase());
    }
    return all;
  }),
  listGateLogsDb: vi.fn(async (filter?: { apartmentCode?: string }) => {
    if (filter?.apartmentCode) {
      return visitorState.logs.filter((l) => l.apartmentCode.toUpperCase() === filter.apartmentCode!.toUpperCase());
    }
    return visitorState.logs;
  }),
  verifyVisitorQrDb: vi.fn(),
  checkInVisitorPassDb: vi.fn(),
  checkOutVisitorPassDb: vi.fn(),
}));

const mockListBillsWithDetailsDb = vi.fn();
vi.mock('@/lib/server/billingDb', () => ({
  listBillsWithDetailsDb: (...args: any[]) => mockListBillsWithDetailsDb(...args),
}));

vi.mock('@/lib/server/ticketDb', () => ({
  listTicketsDb: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/server/userDb', () => ({
  findUserByIdentifierDb: vi.fn().mockResolvedValue(null),
  listApartmentMembersDb: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: () => ({
        ilike: () => ({
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    })),
  },
}));

const mockAskGeminiConcierge = vi.fn();
vi.mock('@/lib/geminiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/geminiClient')>();
  return {
    ...actual,
    askGeminiConcierge: (...args: any[]) => mockAskGeminiConcierge(...args),
  };
});

import { GET as visitorGet, POST as visitorPost } from '@/app/api/visitor/route';
import { POST as conciergePost } from '@/app/api/ai/concierge/route';

describe('Visitor list isolation & Concierge real DB billing context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visitorState.passes.clear();
    visitorState.logs = [];
  });

  it('creates a visitor pass then ADMIN sees it on GET /api/visitor while OWNER of another apartment does not', async () => {
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'u-owner-6', role: 'OWNER', apartment_code: 'CH-06', profile: {} },
    });

    const createRes = await visitorPost(
      new Request('http://localhost/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE', visitorName: 'Nguyễn Văn Khách', validHours: 4 }),
      })
    );
    expect(createRes.status).toBe(200);

    // ADMIN sees the pass
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'u-admin', role: 'ADMIN', apartment_code: null, profile: {} },
    });
    const adminListRes = await visitorGet(new Request('http://localhost/api/visitor'));
    expect(adminListRes.status).toBe(200);
    const adminJson = await adminListRes.json();
    expect(adminJson.passes).toHaveLength(1);
    expect(adminJson.passes[0].apartmentCode).toBe('CH-06');

    // OWNER of BS08-CH08 does NOT see CH-06's pass
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'u-owner-8', role: 'OWNER', apartment_code: 'BS08-CH08', profile: {} },
    });
    const otherOwnerRes = await visitorGet(new Request('http://localhost/api/visitor'));
    expect(otherOwnerRes.status).toBe(200);
    const otherJson = await otherOwnerRes.json();
    expect(otherJson.passes).toHaveLength(0);
  });

  it('passes real DB bills for session apartment to askGeminiConcierge', async () => {
    mockRequireAuth.mockResolvedValue({
      ok: true,
      session: {
        authUserId: 'u-owner-8',
        role: 'OWNER',
        apartment_code: 'BS08-CH08',
        email: 'cuong@skyline.vn',
        profile: { id: 'user-member-1', fullname: 'Nguyễn Văn Cường', phone: '0325524482' },
      },
    });

    const realBill = {
      id: 'BILL-BS08-CH08-2026-11',
      apartment_code: 'BS08-CH08',
      billing_month: '11/2026',
      total_amount: 3150000,
      status: 'Unpaid',
    };
    mockListBillsWithDetailsDb.mockResolvedValueOnce([realBill]);
    mockAskGeminiConcierge.mockResolvedValueOnce('Hóa đơn tháng 11/2026 của căn BS08-CH08 là 3.150.000đ.');

    const res = await conciergePost(
      new Request('http://localhost/api/ai/concierge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Kiểm tra hóa đơn tháng này giúp tôi' }),
      }) as any
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reply).toContain('BS08-CH08');
    expect(mockListBillsWithDetailsDb).toHaveBeenCalledWith('BS08-CH08');
    expect(mockAskGeminiConcierge).toHaveBeenCalledWith(
      'Kiểm tra hóa đơn tháng này giúp tôi',
      [],
      expect.objectContaining({
        aptCode: 'BS08-CH08',
        bills: [realBill],
      })
    );
  });
});
