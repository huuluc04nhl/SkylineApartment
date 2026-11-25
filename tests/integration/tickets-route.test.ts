import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireAuth = vi.fn();
const mockGetTicketByIdDb = vi.fn();
const mockListTechniciansDb = vi.fn();
const mockAssignTicketRpcDb = vi.fn();
const mockStartTicketWorkRpcDb = vi.fn();
const mockResolveTicketRpcDb = vi.fn();
const mockUpdateTicketDb = vi.fn();
const mockInsertTicketEventDb = vi.fn();

vi.mock('@/lib/auth/guard', () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
}));

vi.mock('@/lib/server/ticketDb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server/ticketDb')>();
  return {
    ...actual,
    getTicketByIdDb: (...args: any[]) => mockGetTicketByIdDb(...args),
    listTechniciansDb: (...args: any[]) => mockListTechniciansDb(...args),
    assignTicketRpcDb: (...args: any[]) => mockAssignTicketRpcDb(...args),
    startTicketWorkRpcDb: (...args: any[]) => mockStartTicketWorkRpcDb(...args),
    resolveTicketRpcDb: (...args: any[]) => mockResolveTicketRpcDb(...args),
    updateTicketDb: (...args: any[]) => mockUpdateTicketDb(...args),
    insertTicketEventDb: (...args: any[]) => mockInsertTicketEventDb(...args),
  };
});

function sessionFor(role: 'ADMIN' | 'TECHNICIAN' | 'OWNER', overrides: Record<string, any> = {}) {
  return {
    ok: true,
    session: {
      authUserId: `auth-${role.toLowerCase()}`,
      email: overrides.email || `${role.toLowerCase()}@skyline.vn`,
      role,
      apartment_code: overrides.apartment_code ?? (role === 'OWNER' ? 'CH-06' : null),
      profile: {
        id: `prof-${role.toLowerCase()}`,
        fullname: `Test ${role}`,
        phone: overrides.phone || '0900000001',
        role,
      },
    },
    supabase: {},
  };
}

describe('Tickets API route state machine & role enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTechniciansDb.mockResolvedValue([
      { id: 'KTV-01', name: 'KTV A', phone: '0901111111', email: 'ktva@skyline.vn', status: 'AVAILABLE' },
      { id: 'KTV-02', name: 'KTV B', phone: '0902222222', email: 'ktvb@skyline.vn', status: 'AVAILABLE' },
    ]);
  });

  it('denies OWNER from ASSIGN (403) and blocks ADMIN ASSIGN when not Open (409)', async () => {
    const { POST } = await import('@/app/api/tickets/route');

    mockRequireAuth.mockResolvedValueOnce(sessionFor('OWNER'));
    mockGetTicketByIdDb.mockResolvedValueOnce({ id: 'T1', status: 'Open', apt_code: 'CH-06' });
    const resOwner = await POST(
      new Request('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'ASSIGN', ticketId: 'T1', technicianId: 'KTV-01' }),
      })
    );
    expect(resOwner.status).toBe(403);

    mockRequireAuth.mockResolvedValueOnce(sessionFor('ADMIN'));
    mockGetTicketByIdDb.mockResolvedValueOnce({ id: 'T1', status: 'In_Progress', apt_code: 'CH-06' });
    const resWrongState = await POST(
      new Request('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'ASSIGN', ticketId: 'T1', technicianId: 'KTV-01' }),
      })
    );
    expect(resWrongState.status).toBe(409);
  });

  it('blocks KTV B from resolving KTV A ticket (403) and requires afterImage (409)', async () => {
    const { POST } = await import('@/app/api/tickets/route');

    mockRequireAuth.mockResolvedValueOnce(
      sessionFor('TECHNICIAN', { email: 'ktvb@skyline.vn', phone: '0902222222' })
    );
    mockGetTicketByIdDb.mockResolvedValueOnce({
      id: 'T1',
      status: 'In_Progress',
      assigned_technician_id: 'KTV-01',
    });
    const resKtvB = await POST(
      new Request('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'RESOLVE', ticketId: 'T1', afterImage: 'after.jpg' }),
      })
    );
    expect(resKtvB.status).toBe(403);

    mockRequireAuth.mockResolvedValueOnce(
      sessionFor('TECHNICIAN', { email: 'ktva@skyline.vn', phone: '0901111111' })
    );
    mockGetTicketByIdDb.mockResolvedValueOnce({
      id: 'T1',
      status: 'In_Progress',
      assigned_technician_id: 'KTV-01',
      after_image: null,
    });
    const resNoImg = await POST(
      new Request('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'RESOLVE', ticketId: 'T1' }),
      })
    );
    expect(resNoImg.status).toBe(409);

    mockRequireAuth.mockResolvedValueOnce(
      sessionFor('TECHNICIAN', { email: 'ktva@skyline.vn', phone: '0901111111' })
    );
    mockGetTicketByIdDb.mockResolvedValueOnce({
      id: 'T1',
      status: 'In_Progress',
      assigned_technician_id: 'KTV-01',
    });
    mockResolveTicketRpcDb.mockResolvedValueOnce({ id: 'T1', status: 'Resolved' });
    const resOk = await POST(
      new Request('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'RESOLVE', ticketId: 'T1', afterImage: 'after.jpg' }),
      })
    );
    expect(resOk.status).toBe(200);
    expect(mockResolveTicketRpcDb).toHaveBeenCalledTimes(1);
  });

  it('blocks PUT Open -> Resolved jump with 409 and keeps REPAIR status unchanged on ADMIN_REPLY', async () => {
    const { POST, PUT } = await import('@/app/api/tickets/route');

    mockRequireAuth.mockResolvedValueOnce(sessionFor('ADMIN'));
    mockGetTicketByIdDb.mockResolvedValueOnce({ id: 'T2', status: 'Open', ticket_type: 'REPAIR' });
    const resJump = await PUT(
      new Request('http://localhost/api/tickets', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'T2', status: 'Resolved' }),
      })
    );
    expect(resJump.status).toBe(409);

    mockRequireAuth.mockResolvedValueOnce(sessionFor('ADMIN'));
    mockGetTicketByIdDb.mockResolvedValueOnce({
      id: 'T2',
      status: 'Open',
      ticket_type: 'REPAIR',
      handled_by: 'TECHNICIAN',
    });
    mockUpdateTicketDb.mockResolvedValueOnce({ id: 'T2', status: 'Open', admin_reply: 'Đã tiếp nhận' });
    const resReplyRepair = await POST(
      new Request('http://localhost/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'ADMIN_REPLY', ticketId: 'T2', replyText: 'Đã tiếp nhận' }),
      })
    );
    expect(resReplyRepair.status).toBe(200);
    expect(mockUpdateTicketDb).toHaveBeenCalledWith(
      'T2',
      expect.not.objectContaining({ status: 'Resolved' })
    );
    expect(mockInsertTicketEventDb).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'auth-admin', eventType: 'ADMIN_REPLIED' })
    );
  });
});
