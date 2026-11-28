import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import {
  listTicketsDb,
  getTicketByIdDb,
  listTechniciansDb,
  insertTicketDb,
  createTicketFromFormDb,
  updateTicketDb,
  deleteTicketDb,
  insertTicketEventDb,
  assignTicketRpcDb,
  startTicketWorkRpcDb,
  resolveTicketRpcDb,
  rejectTicketResolutionRpcDb,
  TicketRpcError,
} from '@/lib/server/ticketDb';
import {
  evaluateTicketTransition,
  mapDirectStatusChangeToAction,
  type TicketAction,
  type TicketStatus,
} from '@/lib/ticketStateMachine';

export const dynamic = 'force-dynamic';

function findSessionTechnician(
  technicians: Awaited<ReturnType<typeof listTechniciansDb>>,
  session: { email: string; profile: { phone: string } }
) {
  return technicians.find(
    (t) =>
      (t.phone && t.phone === session.profile.phone) ||
      (t.email && t.email.toLowerCase() === session.email.toLowerCase())
  );
}

function buildTransitionContext(
  existing: NonNullable<Awaited<ReturnType<typeof getTicketByIdDb>>>,
  session: {
    role: 'ADMIN' | 'TECHNICIAN' | 'OWNER' | 'TENANT' | 'RECEPTIONIST';
    email: string;
    apartment_code: string | null;
    profile: { phone: string };
  },
  technicians: Awaited<ReturnType<typeof listTechniciansDb>>,
  hasAfterImage?: boolean
) {
  const myTech =
    session.role === 'TECHNICIAN' ? findSessionTechnician(technicians, session) : undefined;
  return {
    currentStatus: (existing.status || 'Open') as TicketStatus,
    ticketType: existing.ticket_type,
    handledBy: existing.handled_by,
    assignedTechnicianId: existing.assigned_technician_id ?? null,
    actorRole: session.role,
    isAssignedTechnician: Boolean(myTech && existing.assigned_technician_id === myTech.id),
    isTicketOwner:
      Boolean(session.apartment_code) &&
      (existing.apt_code || '').trim().toUpperCase() ===
        (session.apartment_code || '').trim().toUpperCase(),
    hasAfterImage,
  };
}

function actorMeta(session: {
  authUserId: string;
  email: string;
  role: string;
  profile: { fullname: string };
}) {
  return {
    actorId: session.authUserId,
    actorName: session.profile.fullname || session.email || 'Skyline User',
    actorRole: session.role,
  };
}

/**
 * GET /api/tickets - Lấy danh sách phiếu theo đúng phạm vi vai trò
 */
export async function GET(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'TECHNICIAN', 'OWNER', 'TENANT', 'RECEPTIONIST']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const requestedApt = searchParams.get('aptCode') || undefined;
    const requestedPhone = searchParams.get('phone') || undefined;
    const status = searchParams.get('status') || undefined;

    const isResident = guard.session.role === 'OWNER' || guard.session.role === 'TENANT';
    const effectiveApt = isResident ? (guard.session.apartment_code || '__NONE__') : requestedApt;
    const effectivePhone = isResident ? undefined : requestedPhone;

    const [allTickets, technicians] = await Promise.all([
      listTicketsDb(effectiveApt, effectivePhone, status),
      listTechniciansDb(),
    ]);

    let tickets = allTickets;
    if (guard.session.role === 'TECHNICIAN') {
      const myTech = technicians.find((t) => t.phone === guard.session.profile.phone || t.email === guard.session.email);
      tickets = myTech
        ? allTickets.filter((t) => t.assigned_technician_id === myTech.id)
        : [];
    }

    return NextResponse.json({
      success: true,
      tickets,
      technicians,
      total: tickets.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

/**
 * POST /api/tickets - Tạo phiếu mới hoặc xử lý các action (có phân quyền theo vai trò)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      action,
      ticketId,
      replyText,
      adminName,
      engineername,
      afterImage,
      apt_code,
      resident_name,
      resident_phone,
      content,
      service,
      before_image,
      ticket,
    } = body;

    // 1. Các action chuyển trạng thái / xử lý phiếu đi qua máy trạng thái chặt
    const stateActions: Record<string, TicketAction> = {
      ASSIGN: 'ASSIGN',
      START_WORK: 'START_WORK',
      ACCEPT: 'START_WORK',
      RESOLVE: 'RESOLVE',
      REJECT_RESOLUTION: 'REJECT_RESOLUTION',
      CONFIRM_RESOLUTION: 'CONFIRM_RESOLUTION',
      ADMIN_REPLY: 'ADMIN_REPLY',
    };

    if (action && stateActions[action]) {
      const guard = await requireAuth(['ADMIN', 'TECHNICIAN', 'OWNER', 'TENANT']);
      if (!guard.ok) return guard.response;

      if (!ticketId) {
        return NextResponse.json({ success: false, message: 'Thiếu mã phiếu ticketId.' }, { status: 400 });
      }

      const [existing, technicians] = await Promise.all([
        getTicketByIdDb(ticketId),
        guard.session.role === 'TECHNICIAN' ? listTechniciansDb() : Promise.resolve([]),
      ]);

      if (!existing) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu' }, { status: 404 });
      }

      const mappedAction = stateActions[action];
      const ctx = buildTransitionContext(
        existing,
        guard.session,
        technicians,
        Boolean(afterImage || existing.after_image)
      );
      const decision = evaluateTicketTransition(mappedAction, ctx);

      if (!decision.allowed) {
        return NextResponse.json(
          { success: false, message: decision.reason },
          { status: decision.httpStatus || 409 }
        );
      }

      const actor = actorMeta(guard.session);

      if (mappedAction === 'ASSIGN') {
        if (!body.technicianId) {
          return NextResponse.json({ success: false, message: 'Thiếu technicianId' }, { status: 400 });
        }
        const updated = await assignTicketRpcDb({
          ticketId: existing.id,
          technicianId: String(body.technicianId),
          scheduledTime: body.scheduledTime,
          autoDispatched: Boolean(body.autoDispatched),
          aiDispatchReason: body.aiDispatchReason,
          ...actor,
        });
        return NextResponse.json({
          success: true,
          message: 'Phân công kỹ thuật viên thành công',
          ticket: updated,
        });
      }

      if (mappedAction === 'START_WORK') {
        const updated = await startTicketWorkRpcDb({
          ticketId: existing.id,
          ...actor,
        });
        return NextResponse.json({
          success: true,
          message: 'Đã nhận việc và bắt đầu xử lý',
          ticket: updated,
        });
      }

      if (mappedAction === 'RESOLVE') {
        const updated = await resolveTicketRpcDb({
          ticketId: existing.id,
          afterImage: afterImage ?? existing.after_image ?? null,
          note: body.resolutionNotes || body.note,
          ...actor,
        });
        return NextResponse.json({
          success: true,
          message: 'Nghiệm thu thành công',
          ticket: updated,
        });
      }

      if (mappedAction === 'REJECT_RESOLUTION') {
        const updated = await rejectTicketResolutionRpcDb({
          ticketId: existing.id,
          note: body.reason || body.note,
          ...actor,
        });
        return NextResponse.json({
          success: true,
          message: 'Đã yêu cầu làm lại',
          ticket: updated,
        });
      }

      if (mappedAction === 'CONFIRM_RESOLUTION') {
        const now = new Date().toISOString();
        const updated = await updateTicketDb(existing.id, {
          rating: body.rating ?? existing.rating ?? 5,
          resident_feedback: body.resident_feedback ?? body.feedback ?? existing.resident_feedback ?? null,
          rated_at: now,
        });
        await insertTicketEventDb({
          ticketId: existing.id,
          eventType: 'RATED',
          oldStatus: existing.status,
          newStatus: decision.nextStatus,
          ...actor,
          note: body.resident_feedback || 'Cư dân xác nhận nghiệm thu hoàn tất',
        });
        return NextResponse.json({
          success: true,
          message: 'Cư dân đã xác nhận nghiệm thu',
          ticket: updated,
        });
      }

      if (mappedAction === 'ADMIN_REPLY') {
        if (!replyText || !String(replyText).trim()) {
          return NextResponse.json({ success: false, message: 'Nội dung phản hồi không được để trống' }, { status: 400 });
        }
        const now = new Date().toISOString();
        const shouldCloseInquiry = decision.nextStatus !== existing.status;
        const updated = await updateTicketDb(existing.id, {
          admin_reply: String(replyText).trim(),
          admin_replied_at: now,
          admin_replied_by: adminName || actor.actorName || 'VinHomes Manager',
          assigned_technician_name: engineername?.trim() || existing.assigned_technician || null,
          ...(shouldCloseInquiry
            ? { status: decision.nextStatus, resolved_at: existing.resolved_at || now }
            : {}),
        });
        await insertTicketEventDb({
          ticketId: existing.id,
          eventType: shouldCloseInquiry ? 'RESOLVED' : 'ADMIN_REPLIED',
          oldStatus: existing.status,
          newStatus: decision.nextStatus,
          ...actor,
          note: String(replyText).trim(),
        });
        return NextResponse.json({
          success: true,
          message: shouldCloseInquiry ? 'Đã phản hồi và đóng phiếu tư vấn/góp ý' : 'Đã gửi phản hồi BQL',
          ticket: updated,
        });
      }
    }

    if (action === 'DELETE' && ticketId) {
      const adminGuard = await requireAuth(['ADMIN']);
      if (!adminGuard.ok) return adminGuard.response;
      await deleteTicketDb(ticketId);
      return NextResponse.json({ success: true, message: 'Đã xóa phiếu' });
    }

    // 3. Tạo phiếu mới -> ADMIN, OWNER, TENANT (cư dân buộc dùng apartment_code của mình)
    const createGuard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!createGuard.ok) return createGuard.response;

    const isAdmin = createGuard.session.role === 'ADMIN';
    const createActor = actorMeta(createGuard.session);

    if (action === 'CREATE' && ticket) {
      const safeTicket = isAdmin
        ? ticket
        : {
            ...ticket,
            apt_code: createGuard.session.apartment_code || ticket.apt_code,
            resident_name: createGuard.session.profile.fullname || ticket.resident_name,
            resident_phone: createGuard.session.profile.phone || ticket.resident_phone,
          };
      const inserted = await insertTicketDb(safeTicket);
      await insertTicketEventDb({
        ticketId: inserted.id,
        eventType: 'CREATED',
        oldStatus: null,
        newStatus: inserted.status,
        ...createActor,
        note: 'Tạo phiếu hỗ trợ',
      });
      return NextResponse.json({
        success: true,
        message: 'Tạo phiếu thành công',
        ticket: inserted,
      });
    }

    const textContent = content || ticket?.content;
    if (!textContent || !textContent.trim()) {
      return NextResponse.json({ success: false, message: 'Nội dung phiếu không được để trống' }, { status: 400 });
    }

    const resolvedApt = (isAdmin ? apt_code : createGuard.session.apartment_code)?.trim();
    if (!resolvedApt) {
      return NextResponse.json({ success: false, message: 'Thiếu mã căn hộ hợp lệ.' }, { status: 400 });
    }

    const created = await createTicketFromFormDb({
      apt_code: resolvedApt,
      resident_name: isAdmin ? (resident_name || 'Cư Dân Skyline') : (createGuard.session.profile.fullname || 'Cư Dân Skyline'),
      resident_phone: isAdmin ? (resident_phone || '') : (createGuard.session.profile.phone || ''),
      content: textContent.trim(),
      ai_category: service || 'Khác',
      before_image: before_image || undefined,
    });
    await insertTicketEventDb({
      ticketId: created.id,
      eventType: 'CREATED',
      oldStatus: null,
      newStatus: created.status,
      ...createActor,
      note: 'Tạo phiếu hỗ trợ từ form',
    });

    return NextResponse.json({
      success: true,
      message: 'Tạo phiếu hỗ trợ thành công',
      ticket: created,
    });
  } catch (error: unknown) {
    if (error instanceof TicketRpcError) {
      return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: error.status });
    }
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

/**
 * PUT /api/tickets - Cập nhật phiếu (phân quyền theo vai trò)
 */
export async function PUT(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN', 'TECHNICIAN', 'OWNER', 'TENANT']);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const {
      id,
      status,
      admin_reply,
      assigned_technician_id,
      assigned_technician,
      rating,
      resident_feedback,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu ID phiếu' }, { status: 400 });
    }

    const existing = await getTicketByIdDb(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu yêu cầu' }, { status: 404 });
    }

    const isResident = guard.session.role === 'OWNER' || guard.session.role === 'TENANT';
    if (isResident && existing.apt_code !== guard.session.apartment_code) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu yêu cầu' }, { status: 404 });
    }

    const technicians = guard.session.role === 'TECHNICIAN' ? await listTechniciansDb() : [];
    const ctx = buildTransitionContext(
      existing,
      guard.session,
      technicians,
      Boolean(body.after_image || existing.after_image)
    );
    const actor = actorMeta(guard.session);

    // Nếu PUT yêu cầu đổi status -> bắt buộc đi qua máy trạng thái và trả 409/403 nếu sai
    if (status && status !== existing.status) {
      const mappedAction = mapDirectStatusChangeToAction(
        (existing.status || 'Open') as TicketStatus,
        status as TicketStatus
      );
      if (!mappedAction) {
        return NextResponse.json(
          {
            success: false,
            message: `Chuyển trạng thái từ ${existing.status} sang ${status} không hợp lệ.`,
          },
          { status: 409 }
        );
      }

      const decision = evaluateTicketTransition(mappedAction, ctx);
      if (!decision.allowed) {
        return NextResponse.json(
          { success: false, message: decision.reason },
          { status: decision.httpStatus || 409 }
        );
      }

      let updatedViaRpc = existing;
      if (mappedAction === 'ASSIGN') {
        const techId = assigned_technician_id;
        if (!techId) {
          return NextResponse.json({ success: false, message: 'Thiếu assigned_technician_id để phân công' }, { status: 409 });
        }
        updatedViaRpc =
          (await assignTicketRpcDb({
            ticketId: existing.id,
            technicianId: String(techId),
            ...actor,
          })) || existing;
      } else if (mappedAction === 'START_WORK') {
        updatedViaRpc =
          (await startTicketWorkRpcDb({ ticketId: existing.id, ...actor })) || existing;
      } else if (mappedAction === 'RESOLVE') {
        updatedViaRpc =
          (await resolveTicketRpcDb({
            ticketId: existing.id,
            afterImage: body.after_image ?? existing.after_image ?? null,
            ...actor,
          })) || existing;
      } else if (mappedAction === 'REJECT_RESOLUTION') {
        updatedViaRpc =
          (await rejectTicketResolutionRpcDb({ ticketId: existing.id, ...actor })) || existing;
      }

      return NextResponse.json({
        success: true,
        message: 'Cập nhật phiếu thành công',
        ticket: updatedViaRpc,
      });
    }

    const patch: Record<string, unknown> = {};
    let eventToLog: Parameters<typeof insertTicketEventDb>[0] | null = null;

    if (guard.session.role === 'ADMIN') {
      if (admin_reply !== undefined) {
        const replyDecision = evaluateTicketTransition('ADMIN_REPLY', ctx);
        const now = new Date().toISOString();
        patch.admin_reply = admin_reply;
        if (!existing.admin_replied_at) {
          patch.admin_replied_at = now;
          patch.admin_replied_by = actor.actorName || 'VinHomes Manager';
        }
        const shouldCloseInquiry = replyDecision.nextStatus !== existing.status;
        if (shouldCloseInquiry) {
          patch.status = replyDecision.nextStatus;
          patch.resolved_at = existing.resolved_at || now;
        }
        eventToLog = {
          ticketId: existing.id,
          eventType: shouldCloseInquiry ? 'RESOLVED' : 'ADMIN_REPLIED',
          oldStatus: existing.status,
          newStatus: replyDecision.nextStatus,
          ...actor,
          note: String(admin_reply),
        };
      }
      if (assigned_technician !== undefined) patch.assigned_technician_name = assigned_technician;
    } else if (guard.session.role === 'TECHNICIAN') {
      if (!ctx.isAssignedTechnician) {
        return NextResponse.json({ success: false, message: 'Không có quyền sửa phiếu của KTV khác.' }, { status: 403 });
      }
    } else {
      // Cư dân chỉ được đánh giá/gửi feedback cho phiếu căn hộ mình
      if (rating !== undefined) {
        const confirmDecision = evaluateTicketTransition('CONFIRM_RESOLUTION', ctx);
        if (!confirmDecision.allowed) {
          return NextResponse.json(
            { success: false, message: confirmDecision.reason },
            { status: confirmDecision.httpStatus || 409 }
          );
        }
        patch.rating = rating;
        patch.rated_at = new Date().toISOString();
        eventToLog = {
          ticketId: existing.id,
          eventType: 'RATED',
          oldStatus: existing.status,
          newStatus: existing.status,
          ...actor,
          note: resident_feedback || `Đánh giá ${rating} sao`,
        };
      }
      if (resident_feedback !== undefined) patch.resident_feedback = resident_feedback;
    }

    const updated = Object.keys(patch).length > 0 ? await updateTicketDb(existing.id, patch) : existing;
    if (eventToLog) {
      await insertTicketEventDb(eventToLog);
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật phiếu thành công',
      ticket: updated,
    });
  } catch (error: unknown) {
    if (error instanceof TicketRpcError) {
      return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: error.status });
    }
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

/**
 * DELETE /api/tickets - Hủy phiếu (Chỉ ADMIN)
 */
export async function DELETE(req: Request) {
  try {
    const guard = await requireAuth(['ADMIN']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu ID phiếu' }, { status: 400 });
    }

    await deleteTicketDb(id);

    return NextResponse.json({
      success: true,
      message: 'Đã hủy phiếu thành công',
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
