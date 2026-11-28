import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireAuth = vi.fn();

const dbState = {
  bookings: new Map<string, any>(),
  profiles: new Map<string, any>(),
  facilityAccessLogs: [] as any[],
  doorAccessLogs: [] as any[],
};

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: (roles?: string[]) => mockRequireAuth(roles),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === 'facility_bookings') {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => ({ data: dbState.bookings.get(val) || null, error: null }),
            }),
          }),
          update: (patch: any) => ({
            eq: (_col: string, id: string) => ({
              select: () => ({
                single: async () => {
                  const found = Array.from(dbState.bookings.values()).find((b) => b.id === id);
                  if (!found) return { data: null, error: { message: 'Not found' } };
                  Object.assign(found, patch);
                  return { data: found, error: null };
                },
              }),
            }),
          }),
        };
      }
      if (table === 'facility_access_logs') {
        return {
          insert: async (row: any) => {
            dbState.facilityAccessLogs.push(row);
            return { error: null };
          },
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: (_col: string, id: string) => ({
              maybeSingle: async () => ({ data: dbState.profiles.get(id) || null, error: null }),
            }),
          }),
        };
      }
      if (table === 'smart_door_access_logs') {
        return {
          insert: async (row: any) => {
            dbState.doorAccessLogs.push(row);
            return { error: null };
          },
        };
      }
      return {};
    },
  },
}));

import { POST as verifyFacilityPost } from '@/app/api/facilities/verify/route';
import { GET as cardTokenGet } from '@/app/api/user/card-token/route';
import { POST as verifyCardPost } from '@/app/api/access/verify-card/route';
import { signResidentCardToken } from '@/lib/server/cardToken';

function todayVnDateStr(): string {
  const now = new Date();
  const vn = new Date(now.getTime() + 7 * 3600 * 1000);
  return vn.toISOString().slice(0, 10);
}

describe('Facility ticket & Resident card QR verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESIDENT_CARD_SECRET = 'test-resident-card-secret-32-chars!!';
    dbState.bookings.clear();
    dbState.profiles.clear();
    dbState.facilityAccessLogs = [];
    dbState.doorAccessLogs = [];

    dbState.profiles.set('u-owner-6', {
      id: 'u-owner-6',
      role: 'OWNER',
      apartment_code: 'CH-06',
      full_name: 'Trần Hữu Lực',
    });
  });

  it('verifies valid, expired, and cancelled facility tickets and blocks residents (403)', async () => {
    const today = todayVnDateStr();
    dbState.bookings.set('FAC-VALID-1', {
      id: 'bk-1',
      ticket_code: 'FAC-VALID-1',
      facility_id: 'pool-t25',
      apartment_code: 'CH-06',
      booker_name: 'Trần Hữu Lực',
      booking_date: today,
      time_slot: '00:00 - 23:59',
      status: 'CONFIRMED',
      facilities: { name: 'Hồ Bơi Vô Cực' },
    });
    dbState.bookings.set('FAC-EXP-1', {
      id: 'bk-2',
      ticket_code: 'FAC-EXP-1',
      facility_id: 'pool-t25',
      apartment_code: 'CH-06',
      booker_name: 'Trần Hữu Lực',
      booking_date: '2020-01-01',
      time_slot: '08:00 - 10:00',
      status: 'CONFIRMED',
    });
    dbState.bookings.set('FAC-CANCEL-1', {
      id: 'bk-3',
      ticket_code: 'FAC-CANCEL-1',
      facility_id: 'pool-t25',
      apartment_code: 'CH-06',
      booker_name: 'Trần Hữu Lực',
      booking_date: today,
      time_slot: '00:00 - 23:59',
      status: 'CANCELLED',
    });

    // Resident -> 403
    mockRequireAuth.mockImplementationOnce(async (roles?: string[]) => {
      if (roles && !roles.includes('OWNER')) {
        return { ok: false, response: NextResponse.json({ success: false }, { status: 403 }) };
      }
      return { ok: true, session: { authUserId: 'u-owner-6', role: 'OWNER' } };
    });
    const res403 = await verifyFacilityPost(
      new Request('http://localhost/api/facilities/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketCode: 'FAC-VALID-1' }),
      })
    );
    expect(res403.status).toBe(403);

    const recSession = {
      ok: true,
      session: { authUserId: 'u-rec', role: 'RECEPTIONIST', profile: { full_name: 'Lễ Tân' } },
    };

    // Valid -> 200 & marked CHECKED_IN
    mockRequireAuth.mockResolvedValueOnce(recSession);
    const resValid = await verifyFacilityPost(
      new Request('http://localhost/api/facilities/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketCode: 'FAC-VALID-1' }),
      })
    );
    expect(resValid.status).toBe(200);
    expect(dbState.bookings.get('FAC-VALID-1').status).toBe('CHECKED_IN');

    // Second scan -> 409 ALREADY_USED
    mockRequireAuth.mockResolvedValueOnce(recSession);
    const resUsed = await verifyFacilityPost(
      new Request('http://localhost/api/facilities/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketCode: 'FAC-VALID-1' }),
      })
    );
    expect(resUsed.status).toBe(409);

    // Expired -> 400 EXPIRED
    mockRequireAuth.mockResolvedValueOnce(recSession);
    const resExp = await verifyFacilityPost(
      new Request('http://localhost/api/facilities/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketCode: 'FAC-EXP-1' }),
      })
    );
    expect(resExp.status).toBe(400);
    expect((await resExp.json()).status).toBe('EXPIRED');

    // Cancelled -> 400 CANCELLED
    mockRequireAuth.mockResolvedValueOnce(recSession);
    const resCancel = await verifyFacilityPost(
      new Request('http://localhost/api/facilities/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticketCode: 'FAC-CANCEL-1' }),
      })
    );
    expect(resCancel.status).toBe(400);
    expect((await resCancel.json()).status).toBe('CANCELLED');
    expect(dbState.facilityAccessLogs).toHaveLength(4);
  });

  it('issues resident card HMAC token, rejects expired/forged tokens, and blocks residents from verify-card (403)', async () => {
    // Resident fetches card token
    mockRequireAuth.mockResolvedValueOnce({
      ok: true,
      session: { authUserId: 'u-owner-6', role: 'OWNER', apartment_code: 'CH-06' },
    });
    const tokenRes = await cardTokenGet();
    expect(tokenRes.status).toBe(200);
    const { token } = await tokenRes.json();
    expect(token).toMatch(/^SKYLINE_CARD_V1\./);

    // Resident cannot call verify-card (403)
    mockRequireAuth.mockImplementationOnce(async (roles?: string[]) => {
      if (roles && !roles.includes('OWNER')) {
        return { ok: false, response: NextResponse.json({ success: false }, { status: 403 }) };
      }
      return { ok: true, session: { authUserId: 'u-owner-6', role: 'OWNER' } };
    });
    const res403 = await verifyCardPost(
      new Request('http://localhost/api/access/verify-card', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    );
    expect(res403.status).toBe(403);

    const recSession = {
      ok: true,
      session: { authUserId: 'u-rec', role: 'RECEPTIONIST', profile: { full_name: 'Lễ Tân' } },
    };

    // Valid token -> 200
    mockRequireAuth.mockResolvedValueOnce(recSession);
    const resValid = await verifyCardPost(
      new Request('http://localhost/api/access/verify-card', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    );
    expect(resValid.status).toBe(200);
    expect((await resValid.json()).resident.apartmentCode).toBe('CH-06');
    expect(dbState.doorAccessLogs).toHaveLength(1);

    // Forged signature -> 401
    mockRequireAuth.mockResolvedValueOnce(recSession);
    const forged = token.slice(0, -4) + 'AAAA';
    const resForged = await verifyCardPost(
      new Request('http://localhost/api/access/verify-card', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: forged }),
      })
    );
    expect(resForged.status).toBe(401);

    // Expired token -> 401
    const { token: expiredToken } = signResidentCardToken(
      { userId: 'u-owner-6', apartmentCode: 'CH-06', role: 'OWNER' },
      -10
    );
    mockRequireAuth.mockResolvedValueOnce(recSession);
    const resExp = await verifyCardPost(
      new Request('http://localhost/api/access/verify-card', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: expiredToken }),
      })
    );
    expect(resExp.status).toBe(401);
    expect((await resExp.json()).status).toBe('EXPIRED');
  });
});
