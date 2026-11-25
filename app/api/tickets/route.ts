import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import {
  listTicketsDb,
  getTicketByIdDb,
  listTechniciansDb,
  getTechnicianByIdDb,
  updateTechnicianStatusDb,
  insertTicketDb,
  createTicketFromFormDb,
  updateTicketDb,
  deleteTicketDb,
} from '@/lib/server/ticketDb';

export const dynamic = 'force-dynamic';

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
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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

    // 1. Phân công KTV / Phản hồi BQL / Xóa -> Chỉ ADMIN
    if (action === 'ASSIGN' || action === 'ADMIN_REPLY' || action === 'DELETE') {
      const adminGuard = await requireAuth(['ADMIN']);
      if (!adminGuard.ok) return adminGuard.response;

      if (action === 'ASSIGN' && ticketId && body.technicianId) {
        const [existing, tech] = await Promise.all([
          getTicketByIdDb(ticketId),
          getTechnicianByIdDb(body.technicianId),
        ]);
        if (existing && tech) {
          await Promise.all([
            updateTicketDb(existing.id, {
              status: 'In_Progress',
              assigned_technician_id: tech.id,
              assigned_technician_name: tech.name,
              assigned_technician_phone: tech.phone,
              scheduled_time: body.scheduledTime || new Date().toISOString(),
            }),
            updateTechnicianStatusDb(tech.id, 'BUSY'),
          ]);
          return NextResponse.json({ success: true, message: 'Phân công kỹ thuật viên thành công' });
        }
        return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu hoặc KTV' }, { status: 404 });
      }

      if (action === 'ADMIN_REPLY' && ticketId && replyText) {
        const existing = await getTicketByIdDb(ticketId);
        if (existing) {
          await updateTicketDb(existing.id, {
            admin_reply: replyText.trim(),
            admin_replied_at: new Date().toISOString(),
            admin_replied_by: adminName || adminGuard.session.profile.fullname || 'VinHomes Manager',
            assigned_technician_name: engineername?.trim() || existing.assigned_technician || null,
            status: 'Resolved',
          });
          return NextResponse.json({ success: true, message: 'Đã gửi phản hồi BQL' });
        }
        return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu' }, { status: 404 });
      }

      if (action === 'DELETE' && ticketId) {
        await deleteTicketDb(ticketId);
        return NextResponse.json({ success: true, message: 'Đã xóa phiếu' });
      }
    }

    // 2. Nghiệm thu / Từ chối nghiệm thu -> ADMIN hoặc TECHNICIAN được gán
    if ((action === 'RESOLVE' || action === 'REJECT_RESOLUTION') && ticketId) {
      const staffGuard = await requireAuth(['ADMIN', 'TECHNICIAN']);
      if (!staffGuard.ok) return staffGuard.response;

      const existing = await getTicketByIdDb(ticketId);
      if (!existing) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu' }, { status: 404 });
      }

      if (staffGuard.session.role === 'TECHNICIAN') {
        const technicians = await listTechniciansDb();
        const myTech = technicians.find((t) => t.phone === staffGuard.session.profile.phone || t.email === staffGuard.session.email);
        if (!myTech || existing.assigned_technician_id !== myTech.id) {
          return NextResponse.json({ success: false, message: 'Không có quyền thao tác phiếu của KTV khác.' }, { status: 403 });
        }
      }

      if (action === 'RESOLVE') {
        await updateTicketDb(existing.id, {
          status: 'Resolved',
          after_image: afterImage ?? null,
          resolved_at: new Date().toISOString(),
        });
        if (existing.assigned_technician_id) {
          await updateTechnicianStatusDb(existing.assigned_technician_id, 'AVAILABLE');
        }
        return NextResponse.json({ success: true, message: 'Nghiệm thu thành công' });
      }

      await updateTicketDb(existing.id, {
        status: 'In_Progress',
        after_image: null,
      });
      return NextResponse.json({ success: true, message: 'Đã yêu cầu làm lại' });
    }

    // 3. Tạo phiếu mới -> ADMIN, OWNER, TENANT (cư dân buộc dùng apartment_code của mình)
    const createGuard = await requireAuth(['ADMIN', 'OWNER', 'TENANT']);
    if (!createGuard.ok) return createGuard.response;

    const isAdmin = createGuard.session.role === 'ADMIN';

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

    const created = await createTicketFromFormDb({
      apt_code: isAdmin ? (apt_code || 'CH-06') : (createGuard.session.apartment_code || 'CH-06'),
      resident_name: isAdmin ? (resident_name || 'Cư Dân Skyline') : (createGuard.session.profile.fullname || 'Cư Dân Skyline'),
      resident_phone: isAdmin ? (resident_phone || '') : (createGuard.session.profile.phone || ''),
      content: textContent.trim(),
      ai_category: service || 'Khác',
      before_image: before_image || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Tạo phiếu hỗ trợ thành công',
      ticket: created,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
      return NextResponse.json({ success: false, message: 'Không có quyền sửa phiếu của căn hộ khác.' }, { status: 403 });
    }

    const patch: Record<string, any> = {};
    if (guard.session.role === 'ADMIN') {
      if (status) patch.status = status;
      if (admin_reply !== undefined) {
        patch.admin_reply = admin_reply;
        if (!existing.admin_replied_at) {
          patch.admin_replied_at = new Date().toISOString();
          patch.admin_replied_by = 'VinHomes Manager';
        }
      }
      if (assigned_technician_id !== undefined) patch.assigned_technician_id = assigned_technician_id;
      if (assigned_technician !== undefined) patch.assigned_technician_name = assigned_technician;
      if (status === 'Resolved' && !existing.resolved_at) {
        patch.resolved_at = new Date().toISOString();
      }
    } else if (guard.session.role === 'TECHNICIAN') {
      const technicians = await listTechniciansDb();
      const myTech = technicians.find((t) => t.phone === guard.session.profile.phone || t.email === guard.session.email);
      if (!myTech || existing.assigned_technician_id !== myTech.id) {
        return NextResponse.json({ success: false, message: 'Không có quyền sửa phiếu của KTV khác.' }, { status: 403 });
      }
      if (status) patch.status = status;
    } else {
      // Cư dân chỉ được đánh giá/gửi feedback cho phiếu căn hộ mình
      if (rating !== undefined) {
        patch.rating = rating;
        patch.rated_at = new Date().toISOString();
      }
      if (resident_feedback !== undefined) patch.resident_feedback = resident_feedback;
    }

    const updated = await updateTicketDb(existing.id, patch);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật phiếu thành công',
      ticket: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
