import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRequireAuth = vi.fn();

const state = {
  apartments: new Map<string, any>(),
  topics: new Map<string, any>(),
  options: new Map<string, any[]>(),
  votes: new Map<string, any>(), // key: `${topicId}:${aptCode}`
  parking: new Map<string, any>(),
};

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: (roles?: string[]) => mockRequireAuth(roles),
}));

vi.mock('@/lib/server/apartmentDb', () => ({
  listApartmentsDb: vi.fn(async () => Array.from(state.apartments.values())),
  getApartmentByCodeDb: vi.fn(async (code: string) => state.apartments.get(code.toUpperCase()) || null),
  createApartmentDb: vi.fn(async (input: any) => {
    state.apartments.set(input.apt_code.toUpperCase(), input);
    return input;
  }),
  updateApartmentDb: vi.fn(async (code: string, patch: any) => {
    const cur = state.apartments.get(code.toUpperCase());
    if (!cur) return null;
    const upd = { ...cur, ...patch };
    state.apartments.set(code.toUpperCase(), upd);
    return upd;
  }),
  deleteApartmentDb: vi.fn(async (code: string) => state.apartments.delete(code.toUpperCase())),
}));

vi.mock('@/lib/server/communityVotingDb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/communityVotingDb')>();
  return {
    ...actual,
    listVotingTopicsDb: vi.fn(async () => Array.from(state.topics.values())),
    createVotingTopicDb: vi.fn(async (params: any) => {
      const id = 'vote-test-1';
      const topic = {
        id,
        code: 'BQ-2026-99',
        title: params.title,
        description: params.description,
        legalType: params.legalType,
        createdBy: params.createdBy,
        createdAt: new Date().toISOString(),
        deadline: params.deadline,
        status: 'OPEN',
        isOwnerOnly: params.isOwnerOnly,
        totalEligibleApartments: 200,
        totalVotes: 0,
        summaryReport: '',
        options: params.options.map((text: string, i: number) => ({ id: `opt-${i + 1}`, text, votes: 0 })),
        voters: [],
      };
      state.topics.set(id, topic);
      return topic;
    }),
    castVoteDb: vi.fn(async (params: any) => {
      const key = `${params.topicId}:${params.aptCode.toUpperCase()}`;
      if (state.votes.has(key)) {
        throw new actual.VoteConflictError(`Căn hộ ${params.aptCode} đã bỏ phiếu cho chủ đề này rồi.`);
      }
      state.votes.set(key, params);
      const topic = state.topics.get(params.topicId);
      topic.voters.push({ aptCode: params.aptCode, voterName: params.voterName, optionId: params.optionId, votedAt: new Date().toISOString() });
      topic.totalVotes = topic.voters.length;
      return topic;
    }),
  };
});

vi.mock('@/lib/server/parkingDb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/parkingDb')>();
  return {
    ...actual,
    listParkingSlotsDb: vi.fn(async (apt?: string) => {
      const all = Array.from(state.parking.values());
      return apt ? all.filter((s) => s.apartment_code === apt) : all;
    }),
    assignParkingSlotDb: vi.fn(async (params: any) => {
      const existing = state.parking.get(params.slotCode);
      if (existing && existing.status === 'OCCUPIED' && existing.apartment_code !== params.apartmentCode) {
        throw new actual.ParkingConflictError(`Vị trí đỗ ${params.slotCode} đã được gán cho căn hộ ${existing.apartment_code}.`);
      }
      const row = {
        id: `slot-${params.slotCode.toLowerCase()}`,
        slot_code: params.slotCode,
        floor_number: params.floorNumber,
        vehicle_type: params.vehicleType,
        apartment_code: params.apartmentCode,
        assigned_license_plate: params.licensePlate,
        status: 'OCCUPIED',
        monthly_fee: params.monthlyFee,
      };
      state.parking.set(params.slotCode, row);
      return row;
    }),
  };
});

import { POST as apartmentsPost, GET as apartmentsGet } from '@/app/api/apartments/route';
import { POST as votingPost } from '@/app/api/voting/route';
import { POST as parkingPost } from '@/app/api/parking/route';

describe('Apartments, Voting & Parking API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.apartments.clear();
    state.topics.clear();
    state.votes.clear();
    state.parking.clear();
  });

  it('denies normal user POST /api/apartments (403) and allows ADMIN (201)', async () => {
    mockRequireAuth.mockImplementation(async (roles?: string[]) => {
      if (roles && !roles.includes('OWNER')) {
        return { ok: false, response: new Response(JSON.stringify({ success: false }), { status: 403 }) };
      }
      return { ok: true, session: { authUserId: 'u-owner', role: 'OWNER', apartment_code: 'CH-06', profile: {} } };
    });

    const denied = await apartmentsPost(
      new Request('http://localhost/api/apartments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: 'CH-99', tower: 'BS-07', floor: 30, type: '2PN' }),
      })
    );
    expect(denied.status).toBe(403);

    mockRequireAuth.mockResolvedValue({
      ok: true,
      session: { authUserId: 'u-admin', role: 'ADMIN', apartment_code: null, profile: {} },
    });
    const created = await apartmentsPost(
      new Request('http://localhost/api/apartments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: 'CH-99', tower: 'BS-07', floor: 30, type: '2PN' }),
      })
    );
    expect(created.status).toBe(201);

    const listRes = await apartmentsGet(new Request('http://localhost/api/apartments?block=BS-07'));
    const listJson = await listRes.json();
    expect(listJson.apartments).toHaveLength(1);
    expect(listJson.apartments[0].apt_code).toBe('CH-99');
  });

  it('allows ADMIN to create voting topic and prevents same apartment from voting twice (409)', async () => {
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'u-admin', role: 'ADMIN', apartment_code: null, profile: { fullname: 'Admin' } },
    });
    const createRes = await votingPost(
      new Request('http://localhost/api/voting', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          title: 'Nâng cấp sảnh',
          description: 'Mô tả chi tiết',
          deadline: '2026-12-31T23:59:59Z',
          options: ['Đồng ý', 'Không đồng ý'],
        }),
      })
    );
    expect(createRes.status).toBe(201);

    mockRequireAuth.mockResolvedValue({
      ok: true,
      session: { authUserId: 'u-owner', role: 'OWNER', apartment_code: 'CH-06', profile: { id: 'user-owner-1', fullname: 'Chủ Hộ' } },
    });

    const firstVote = await votingPost(
      new Request('http://localhost/api/voting', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'VOTE', topicId: 'vote-test-1', optionId: 'opt-1' }),
      })
    );
    expect(firstVote.status).toBe(200);

    const secondVote = await votingPost(
      new Request('http://localhost/api/voting', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'VOTE', topicId: 'vote-test-1', optionId: 'opt-2' }),
      })
    );
    expect(secondVote.status).toBe(409);
  });

  it('assigns parking slot for ADMIN (201) and rejects duplicate slot conflict (409)', async () => {
    mockRequireAuth.mockResolvedValue({
      ok: true,
      session: { authUserId: 'u-admin', role: 'ADMIN', apartment_code: null, profile: {} },
    });

    const okRes = await parkingPost(
      new Request('http://localhost/api/parking', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slotCode: 'B2-A01',
          vehicleType: 'CAR',
          apartmentCode: 'CH-06',
          licensePlate: '51K-889.99',
        }),
      })
    );
    expect(okRes.status).toBe(201);

    const conflictRes = await parkingPost(
      new Request('http://localhost/api/parking', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slotCode: 'B2-A01',
          vehicleType: 'CAR',
          apartmentCode: 'BS08-CH08',
          licensePlate: '51H-111.22',
        }),
      })
    );
    expect(conflictRes.status).toBe(409);
  });
});
