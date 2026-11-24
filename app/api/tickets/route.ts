import { NextResponse } from 'next/server';
import { 
  getTickets, 
  getTicketById, 
  getTechnicians, 
  createTicket, 
  deleteTicket,
  ExtendedServiceRequest,
  serviceTicketRecordToRequest,
  extendedServiceRequestToRecord
} from '@/lib/ticketStore';
import { skylineDb } from '@/lib/db';
import { ServiceTicketRecord } from '@/lib/db/schema';
import { evaluateBestTechnicianWithAI } from '@/lib/aiDispatchService';
import { 
  classifyTicket, 
  findInquiryAnswer, 
  generateSuggestedAdminReply 
} from '@/lib/ticketClassification';

/**
 * GET /api/tickets - Lấy danh sách phiếu từ skylineDb
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const aptCode = searchParams.get('aptCode');
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');

    let tickets = getTickets(aptCode || undefined, phone || undefined);
    const technicians = getTechnicians();

    if (status) {
      tickets = tickets.filter(t => t.status === status);
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
 * POST /api/tickets - Tạo phiếu mới hoặc xử lý các action
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
      resolutionNotes,
      aiVerification,
      reason,
      apt_code, 
      resident_name, 
      resident_phone, 
      content, 
      service, 
      before_image,
      ticket
    } = body;

    // 1. Phân công KTV
    if (action === 'ASSIGN' && ticketId && body.technicianId) {
      const existing = skylineDb.tickets.findById(ticketId);
      const tech = skylineDb.technicians.findById(body.technicianId);
      if (existing && tech) {
        skylineDb.tickets.update(existing.id, {
          status: 'In_Progress',
          assigned_technician_id: tech.id,
          assigned_technician_name: tech.name,
          assigned_technician_phone: tech.phone,
          scheduled_time: body.scheduledTime || 'Có mặt trong vòng 30 phút',
          updated_at: new Date().toISOString()
        });
        skylineDb.technicians.update(tech.id, { status: 'BUSY' });
        return NextResponse.json({ success: true, message: 'Phân công kỹ thuật viên thành công' });
      }
      return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu hoặc KTV' }, { status: 404 });
    }

    // 2. Phản hồi BQL
    if (action === 'ADMIN_REPLY' && ticketId && replyText) {
      const existing = skylineDb.tickets.findById(ticketId);
      if (existing) {
        skylineDb.tickets.update(existing.id, {
          admin_reply: replyText.trim(),
          admin_replied_at: new Date().toISOString(),
          admin_replied_by: adminName || 'VinHomes Manager',
          assigned_technician_name: engineername?.trim() || existing.assigned_technician_name,
          status: 'Resolved',
          updated_at: new Date().toISOString()
        });
        return NextResponse.json({ success: true, message: 'Đã gửi phản hồi BQL' });
      }
      return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    // 3. Nghiệm thu phiếu
    if (action === 'RESOLVE' && ticketId) {
      const existing = skylineDb.tickets.findById(ticketId);
      if (existing) {
        skylineDb.tickets.update(existing.id, {
          status: 'Resolved',
          after_image: afterImage,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        if (existing.assigned_technician_id) {
          skylineDb.technicians.update(existing.assigned_technician_id, { status: 'AVAILABLE' });
        }
        return NextResponse.json({ success: true, message: 'Nghiệm thu thành công' });
      }
      return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    // 4. Từ chối nghiệm thu
    if (action === 'REJECT_RESOLUTION' && ticketId) {
      const existing = skylineDb.tickets.findById(ticketId);
      if (existing) {
        skylineDb.tickets.update(existing.id, {
          status: 'In_Progress',
          after_image: undefined,
          updated_at: new Date().toISOString()
        });
        return NextResponse.json({ success: true, message: 'Đã yêu cầu làm lại' });
      }
      return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    // 5. Xóa phiếu
    if (action === 'DELETE' && ticketId) {
      deleteTicket(ticketId);
      return NextResponse.json({ success: true, message: 'Đã xóa phiếu' });
    }

    // 6. Tạo trực tiếp từ object ticket
    if (action === 'CREATE' && ticket) {
      const rec = extendedServiceRequestToRecord(ticket);
      const inserted = skylineDb.tickets.insert(rec);
      return NextResponse.json({
        success: true,
        message: 'Tạo phiếu thành công',
        ticket: serviceTicketRecordToRequest(inserted)
      });
    }

    // 7. Tạo phiếu từ form người dùng
    const textContent = content || ticket?.content;
    if (!textContent || !textContent.trim()) {
      return NextResponse.json({ success: false, message: 'Nội dung phiếu không được để trống' }, { status: 400 });
    }

    const created = createTicket({
      apt_code: apt_code || 'CH-06',
      resident_name: resident_name || 'Cư Dân Skyline',
      resident_phone: resident_phone || '',
      content: textContent.trim(),
      ai_category: (service as any) || 'Khác',
      before_image: before_image || undefined
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
 * PUT /api/tickets - Cập nhật phiếu
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, 
      status, 
      admin_reply, 
      assigned_technician_id, 
      assigned_technician, 
      resolution_notes,
      rating,
      resident_feedback
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu ID phiếu' }, { status: 400 });
    }

    const existing = skylineDb.tickets.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy phiếu yêu cầu' }, { status: 404 });
    }

    const patch: Partial<ServiceTicketRecord> = {
      updated_at: new Date().toISOString()
    };
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
    if (rating !== undefined) {
      patch.rating = rating;
      patch.rated_at = new Date().toISOString();
    }
    if (resident_feedback !== undefined) patch.resident_feedback = resident_feedback;
    if (status === 'Resolved' && !existing.resolved_at) {
      patch.resolved_at = new Date().toISOString();
    }

    const updated = skylineDb.tickets.update(existing.id, patch);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật phiếu thành công',
      ticket: updated ? serviceTicketRecordToRequest(updated) : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/tickets - Hủy phiếu
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu ID phiếu' }, { status: 400 });
    }

    deleteTicket(id);

    return NextResponse.json({
      success: true,
      message: 'Đã hủy phiếu thành công',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
