import { describe, it, expect } from 'vitest';
import {
  evaluateTicketTransition,
  mapDirectStatusChangeToAction,
} from '@/lib/ticketStateMachine';

describe('ticketStateMachine', () => {
  it('allows Open -> Assigned only for ADMIN', () => {
    const ok = evaluateTicketTransition('ASSIGN', {
      currentStatus: 'Open',
      actorRole: 'ADMIN',
    });
    expect(ok).toMatchObject({ allowed: true, nextStatus: 'Assigned' });

    const deniedRole = evaluateTicketTransition('ASSIGN', {
      currentStatus: 'Open',
      actorRole: 'OWNER',
    });
    expect(deniedRole).toMatchObject({ allowed: false, httpStatus: 403 });

    const wrongState = evaluateTicketTransition('ASSIGN', {
      currentStatus: 'In_Progress',
      actorRole: 'ADMIN',
    });
    expect(wrongState).toMatchObject({ allowed: false, httpStatus: 409 });
  });

  it('allows Assigned -> In_Progress only for the assigned TECHNICIAN', () => {
    const ok = evaluateTicketTransition('START_WORK', {
      currentStatus: 'Assigned',
      actorRole: 'TECHNICIAN',
      assignedTechnicianId: 'KTV-01',
      isAssignedTechnician: true,
    });
    expect(ok).toMatchObject({ allowed: true, nextStatus: 'In_Progress' });

    const otherTech = evaluateTicketTransition('START_WORK', {
      currentStatus: 'Assigned',
      actorRole: 'TECHNICIAN',
      assignedTechnicianId: 'KTV-01',
      isAssignedTechnician: false,
    });
    expect(otherTech).toMatchObject({ allowed: false, httpStatus: 403 });

    const adminDenied = evaluateTicketTransition('START_WORK', {
      currentStatus: 'Assigned',
      actorRole: 'ADMIN',
      assignedTechnicianId: 'KTV-01',
    });
    expect(adminDenied).toMatchObject({ allowed: false, httpStatus: 403 });
  });

  it('blocks RESOLVE when unassigned, wrong technician, wrong state, or missing afterImage', () => {
    const unassigned = evaluateTicketTransition('RESOLVE', {
      currentStatus: 'In_Progress',
      actorRole: 'ADMIN',
      assignedTechnicianId: null,
    });
    expect(unassigned).toMatchObject({ allowed: false, httpStatus: 409 });

    const ktvB = evaluateTicketTransition('RESOLVE', {
      currentStatus: 'In_Progress',
      actorRole: 'TECHNICIAN',
      assignedTechnicianId: 'KTV-01',
      isAssignedTechnician: false,
      hasAfterImage: true,
    });
    expect(ktvB).toMatchObject({ allowed: false, httpStatus: 403 });

    const noImg = evaluateTicketTransition('RESOLVE', {
      currentStatus: 'In_Progress',
      actorRole: 'TECHNICIAN',
      assignedTechnicianId: 'KTV-01',
      isAssignedTechnician: true,
      hasAfterImage: false,
    });
    expect(noImg).toMatchObject({ allowed: false, httpStatus: 409 });

    const fromOpen = evaluateTicketTransition('RESOLVE', {
      currentStatus: 'Open',
      actorRole: 'ADMIN',
      assignedTechnicianId: 'KTV-01',
    });
    expect(fromOpen).toMatchObject({ allowed: false, httpStatus: 409 });

    const ok = evaluateTicketTransition('RESOLVE', {
      currentStatus: 'In_Progress',
      actorRole: 'TECHNICIAN',
      assignedTechnicianId: 'KTV-01',
      isAssignedTechnician: true,
      hasAfterImage: true,
    });
    expect(ok).toMatchObject({ allowed: true, nextStatus: 'Resolved' });
  });

  it('handles REJECT_RESOLUTION and CONFIRM_RESOLUTION permissions', () => {
    const rejectOk = evaluateTicketTransition('REJECT_RESOLUTION', {
      currentStatus: 'Resolved',
      actorRole: 'OWNER',
      isTicketOwner: true,
    });
    expect(rejectOk).toMatchObject({ allowed: true, nextStatus: 'In_Progress' });

    const rejectOtherApt = evaluateTicketTransition('REJECT_RESOLUTION', {
      currentStatus: 'Resolved',
      actorRole: 'TENANT',
      isTicketOwner: false,
    });
    expect(rejectOtherApt).toMatchObject({ allowed: false, httpStatus: 403 });

    const confirmOpen = evaluateTicketTransition('CONFIRM_RESOLUTION', {
      currentStatus: 'Open',
      actorRole: 'OWNER',
      isTicketOwner: true,
    });
    expect(confirmOpen).toMatchObject({ allowed: false, httpStatus: 409 });
  });

  it('keeps REPAIR status unchanged on ADMIN_REPLY, closes non-KTV INQUIRY/FEEDBACK', () => {
    const repairReply = evaluateTicketTransition('ADMIN_REPLY', {
      currentStatus: 'Open',
      ticketType: 'REPAIR',
      handledBy: 'TECHNICIAN',
      actorRole: 'ADMIN',
    });
    expect(repairReply).toMatchObject({ allowed: true, nextStatus: 'Open' });

    const inquiryReply = evaluateTicketTransition('ADMIN_REPLY', {
      currentStatus: 'Open',
      ticketType: 'INQUIRY',
      handledBy: 'MANAGEMENT',
      actorRole: 'ADMIN',
    });
    expect(inquiryReply).toMatchObject({ allowed: true, nextStatus: 'Resolved' });
  });

  it('rejects invalid direct status jumps in mapDirectStatusChangeToAction', () => {
    expect(mapDirectStatusChangeToAction('Open', 'Resolved')).toBeNull();
    expect(mapDirectStatusChangeToAction('Open', 'In_Progress')).toBeNull();
    expect(mapDirectStatusChangeToAction('Open', 'Assigned')).toBe('ASSIGN');
    expect(mapDirectStatusChangeToAction('Assigned', 'In_Progress')).toBe('START_WORK');
    expect(mapDirectStatusChangeToAction('In_Progress', 'Resolved')).toBe('RESOLVE');
    expect(mapDirectStatusChangeToAction('Resolved', 'In_Progress')).toBe('REJECT_RESOLUTION');
  });
});
