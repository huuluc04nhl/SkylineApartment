import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NextResponse } from 'next/server';

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
    const validHours = params.validHours ?? 4;
    const validUntil = new Date(Date.now() + validHours * 3600 * 1000).toISOString();
    const pass = {
      id: `SKY-PASS-${visitorState.passes.size + 1001}`,
      apartmentCode: params.apartmentCode,
      hostName: params.hostName || 'Chủ Hộ',
      hostPhone: params.hostPhone || '',
      visitorName: params.visitorName,
      entryType: params.entryType || 'MULTI',
      validHours,
      createdAt: new Date().toISOString(),
      validUntil,
      qrData: '{}',
      pinCode: String(654321 + visitorState.passes.size),
      status: validHours < 0 ? 'EXPIRED' : 'ACTIVE',
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
  verifyVisitorQrDb: vi.fn(async (qrCode: string, checkpoint = 'Sảnh Chính Lobby BS-07', actorName?: string) => {
    const pass = Array.from(visitorState.passes.values()).find((p) => p.id === qrCode || p.pinCode === qrCode);
    if (!pass) {
      return { scanResult: 'INVALID', canEnter: false, title: 'Mã thẻ không hợp lệ', message: 'Not found', scannedAt: new Date().toISOString() };
    }
    const expired = new Date(pass.validUntil).getTime() < Date.now() || pass.status === 'EXPIRED';
    visitorState.logs.push({
      id: `LOG-${visitorState.logs.length + 1}`,
      passId: pass.id,
      apartmentCode: pass.apartmentCode,
      action: 'SCAN',
      result: expired ? 'EXPIRED' : 'VALID',
      checkpoint,
      notes: actorName ? `Actor: ${actorName}` : '',
    });
    return {
      scanResult: expired ? 'EXPIRED' : 'VALID',
      canEnter: !expired,
      title: expired ? 'Thẻ khách đã hết hạn' : 'Thẻ khách hợp lệ',
      message: expired ? 'Expired' : 'Valid',
      scannedAt: new Date().toISOString(),
      host: { apartmentCode: pass.apartmentCode, hostName: pass.hostName, hostPhone: pass.hostPhone, towerName: 'Tropical BS-07' },
      visitor: { passId: pass.id, visitorName: pass.visitorName, status: expired ? 'EXPIRED' : pass.status, pinCode: pass.pinCode },
    };
  }),
  checkInVisitorPassDb: vi.fn(async (passId: string, checkpoint = 'Sảnh Chính Lobby BS-07', actorName?: string) => {
    const pass = visitorState.passes.get(passId);
    if (!pass) return null;
    if (new Date(pass.validUntil).getTime() < Date.now() || pass.status === 'EXPIRED') {
      throw new Error('Thẻ khách đã hết hạn hiệu lực, không thể check-in.');
    }
    pass.status = 'CHECKED_IN';
    pass.checkedInAt = new Date().toISOString();
    visitorState.logs.push({
      id: `LOG-${visitorState.logs.length + 1}`,
      passId: pass.id,
      apartmentCode: pass.apartmentCode,
      action: 'CHECK_IN',
      result: 'VALID',
      checkpoint,
      notes: actorName ? `Actor: ${actorName}` : '',
    });
    return pass;
  }),
  checkOutVisitorPassDb: vi.fn(async (passId: string, checkpoint = 'Sảnh Chính Lobby BS-07', actorName?: string) => {
    const pass = visitorState.passes.get(passId);
    if (!pass) return null;
    pass.status = 'COMPLETED';
    pass.checkedOutAt = new Date().toISOString();
    visitorState.logs.push({
      id: `LOG-${visitorState.logs.length + 1}`,
      passId: pass.id,
      apartmentCode: pass.apartmentCode,
      action: 'CHECK_OUT',
      result: 'VALID',
      checkpoint,
      notes: actorName ? `Actor: ${actorName}` : '',
    });
    return pass;
  }),
  deleteVisitorPassDb: vi.fn(async (passId: string) => visitorState.passes.delete(passId)),
  purgeExpiredVisitorPassesDb: vi.fn(async () => 0),
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

  it('runs full visitor lifecycle (resident create -> receptionist VERIFY -> CHECK_IN -> CHECK_OUT), records 3 gate logs, rejects expired pass, and blocks other OWNER from VERIFY', async () => {
    // 1. Resident CH-06 creates pass
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'u-owner-6', role: 'OWNER', apartment_code: 'CH-06', profile: { full_name: 'Trần Hữu Lực' } },
    });
    const createRes = await visitorPost(
      new Request('http://localhost/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE', visitorName: 'Khách Kiểm Thử', validHours: 4 }),
      })
    );
    expect(createRes.status).toBe(200);
    const { pass } = await createRes.json();

    // 2. OWNER of another apartment cannot VERIFY (403)
    mockRequireAuth.mockImplementationOnce(async (roles?: string[]) => {
      if (roles && !roles.includes('OWNER')) {
        return { ok: false, response: NextResponse.json({ success: false }, { status: 403 }) };
      }
      return { ok: true, session: { authUserId: 'u-owner-8', role: 'OWNER', apartment_code: 'BS08-CH08' } };
    });
    const ownerVerifyRes = await visitorPost(
      new Request('http://localhost/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY', qrCode: pass.id }),
      })
    );
    expect(ownerVerifyRes.status).toBe(403);

    // 3. Receptionist VERIFY -> CHECK_IN -> CHECK_OUT
    const receptionSession = {
      ok: true,
      session: { authUserId: 'u-rec', role: 'RECEPTIONIST', email: 'reception@skyline.vn', apartment_code: null, profile: { full_name: 'Lễ Tân BS-07' } },
    };
    mockRequireAuth.mockResolvedValueOnce(receptionSession);
    const verifyRes = await visitorPost(
      new Request('http://localhost/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY', qrCode: pass.id, checkpoint: 'Sảnh BS-07' }),
      })
    );
    expect(verifyRes.status).toBe(200);
    const verifyJson = await verifyRes.json();
    expect(verifyJson.scanResult).toBe('VALID');
    expect(verifyJson.visitor.passId).toBe(pass.id);

    mockRequireAuth.mockResolvedValueOnce(receptionSession);
    const checkInRes = await visitorPost(
      new Request('http://localhost/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'CHECK_IN', passId: pass.id }),
      })
    );
    expect(checkInRes.status).toBe(200);
    expect((await checkInRes.json()).pass.status).toBe('CHECKED_IN');

    mockRequireAuth.mockResolvedValueOnce(receptionSession);
    const checkOutRes = await visitorPost(
      new Request('http://localhost/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'CHECK_OUT', passId: pass.id }),
      })
    );
    expect(checkOutRes.status).toBe(200);
    expect((await checkOutRes.json()).pass.status).toBe('COMPLETED');

    // Gate logs have 3 records (SCAN, CHECK_IN, CHECK_OUT)
    expect(visitorState.logs).toHaveLength(3);
    expect(visitorState.logs.map((l) => l.action)).toEqual(['SCAN', 'CHECK_IN', 'CHECK_OUT']);

    // 4. Expired pass is rejected
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'u-owner-6', role: 'OWNER', apartment_code: 'CH-06', profile: {} },
    });
    const expCreateRes = await visitorPost(
      new Request('http://localhost/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE', visitorName: 'Khách Hết Hạn', validHours: -2 }),
      })
    );
    const { pass: expPass } = await expCreateRes.json();

    mockRequireAuth.mockResolvedValueOnce(receptionSession);
    const expVerifyRes = await visitorPost(
      new Request('http://localhost/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY', qrCode: expPass.id }),
      })
    );
    const expVerifyJson = await expVerifyRes.json();
    expect(expVerifyJson.scanResult).toBe('EXPIRED');
    expect(expVerifyJson.canEnter).toBe(false);

    mockRequireAuth.mockResolvedValueOnce(receptionSession);
    const expCheckInRes = await visitorPost(
      new Request('http://localhost/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'CHECK_IN', passId: expPass.id }),
      })
    );
    expect(expCheckInRes.status).toBe(400);
  });
});
