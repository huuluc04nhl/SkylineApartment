import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import type { ServiceTicketRecord, TechnicianRecord } from '@/lib/db/schema';
import {
  type ExtendedServiceRequest,
  type TechnicianProfile,
  serviceTicketRecordToRequest,
  extendedServiceRequestToRecord,
  technicianRecordToProfile,
} from '@/lib/ticketStore';
import { classifyTicket } from '@/lib/ticketClassification';

type TicketRow = Database['public']['Tables']['service_tickets']['Row'];
type TicketInsert = Database['public']['Tables']['service_tickets']['Insert'];
type TicketUpdate = Database['public']['Tables']['service_tickets']['Update'];
type TechRow = Database['public']['Tables']['technicians']['Row'];

function rowToTicketRecord(row: TicketRow): ServiceTicketRecord {
  return {
    id: row.id,
    apartment_code: row.apartment_code,
    resident_name: row.resident_name,
    resident_phone: row.resident_phone,
    content: row.content,
    ai_category: row.ai_category,
    ai_priority: ((row.ai_priority ?? 2) as 1 | 2 | 3),
    priority_color: row.priority_color ?? '#D97706',
    sla_deadline: row.sla_deadline ?? undefined,
    status: (row.status ?? 'Open') as ServiceTicketRecord['status'],
    ticket_type: row.ticket_type as ServiceTicketRecord['ticket_type'],
    ticket_type_label: row.ticket_type_label ?? undefined,
    handled_by: row.handled_by as ServiceTicketRecord['handled_by'],
    ai_reply: row.ai_reply ?? undefined,
    ai_replied_at: row.ai_replied_at ?? undefined,
    admin_reply: row.admin_reply ?? undefined,
    admin_replied_at: row.admin_replied_at ?? undefined,
    admin_replied_by: row.admin_replied_by ?? undefined,
    assigned_technician_id: row.assigned_technician_id ?? undefined,
    assigned_technician_name: row.assigned_technician_name ?? undefined,
    assigned_technician_phone: row.assigned_technician_phone ?? undefined,
    scheduled_time: row.scheduled_time ?? undefined,
    auto_dispatched: row.auto_dispatched ?? undefined,
    ai_dispatch_reason: row.ai_dispatch_reason ?? undefined,
    rating: row.rating ?? undefined,
    resident_feedback: row.resident_feedback ?? undefined,
    rated_at: row.rated_at ?? undefined,
    before_image: row.before_image ?? undefined,
    after_image: row.after_image ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    resolved_at: row.resolved_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

function rowToTechRecord(row: TechRow): TechnicianRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? '',
    specialty: row.specialty,
    base_salary: row.base_salary,
    pay_per_ticket: row.pay_per_ticket,
    bonus_per_fivestar: row.bonus_per_fivestar,
    status: (row.status ?? 'AVAILABLE') as TechnicianRecord['status'],
  };
}

export async function listTechniciansDb(): Promise<TechnicianProfile[]> {
  const { data, error } = await supabaseAdmin
    .from('technicians')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw new Error(`Supabase technicians select error: ${error.message}`);
  return (data ?? []).map((r) => technicianRecordToProfile(rowToTechRecord(r)));
}

export async function getTechnicianByIdDb(id: string): Promise<TechnicianProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('technicians')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Supabase technician select error: ${error.message}`);
  return data ? technicianRecordToProfile(rowToTechRecord(data)) : null;
}

export async function updateTechnicianStatusDb(
  id: string,
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY'
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('technicians')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(`Supabase technician update error: ${error.message}`);
}

export async function listTicketsDb(
  aptCode?: string,
  phone?: string,
  status?: string
): Promise<ExtendedServiceRequest[]> {
  let query = supabaseAdmin
    .from('service_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Supabase service_tickets select error: ${error.message}`);

  let list = (data ?? []).map((r) => serviceTicketRecordToRequest(rowToTicketRecord(r)));
  if (aptCode || phone) {
    const cleanCode = aptCode ? aptCode.trim().toUpperCase() : '';
    const cleanPhone = phone ? phone.trim() : '';
    list = list.filter((t) => {
      const matchApt = cleanCode && t.apt_code?.trim().toUpperCase() === cleanCode;
      const matchPhone = cleanPhone && t.resident_phone?.trim() === cleanPhone;
      return Boolean(matchApt || matchPhone);
    });
  }
  return list;
}

export async function getTicketByIdDb(id: string): Promise<ExtendedServiceRequest | null> {
  const { data, error } = await supabaseAdmin
    .from('service_tickets')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Supabase service_tickets getById error: ${error.message}`);
  return data ? serviceTicketRecordToRequest(rowToTicketRecord(data)) : null;
}

export async function insertTicketDb(req: ExtendedServiceRequest): Promise<ExtendedServiceRequest> {
  const rec = extendedServiceRequestToRecord(req);
  const payload: TicketInsert = {
    id: rec.id,
    apartment_code: rec.apartment_code,
    resident_name: rec.resident_name,
    resident_phone: rec.resident_phone,
    content: rec.content,
    ai_category: rec.ai_category,
    ai_priority: rec.ai_priority,
    priority_color: rec.priority_color,
    sla_deadline: rec.sla_deadline ?? null,
    status: rec.status,
    ticket_type: rec.ticket_type,
    ticket_type_label: rec.ticket_type_label ?? null,
    handled_by: rec.handled_by,
    ai_reply: rec.ai_reply ?? null,
    ai_replied_at: rec.ai_replied_at ?? null,
    admin_reply: rec.admin_reply ?? null,
    admin_replied_at: rec.admin_replied_at ?? null,
    admin_replied_by: rec.admin_replied_by ?? null,
    assigned_technician_id: rec.assigned_technician_id ?? null,
    assigned_technician_name: rec.assigned_technician_name ?? null,
    assigned_technician_phone: rec.assigned_technician_phone ?? null,
    scheduled_time: rec.scheduled_time ?? null,
    auto_dispatched: rec.auto_dispatched ?? false,
    ai_dispatch_reason: rec.ai_dispatch_reason ?? null,
    rating: rec.rating ?? null,
    resident_feedback: rec.resident_feedback ?? null,
    rated_at: rec.rated_at ?? null,
    before_image: rec.before_image || null,
    after_image: rec.after_image || null,
    created_at: rec.created_at,
    resolved_at: rec.resolved_at ?? null,
    updated_at: rec.updated_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('service_tickets')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw new Error(`Supabase service_tickets insert error: ${error.message}`);
  return serviceTicketRecordToRequest(rowToTicketRecord(data));
}

export async function createTicketFromFormDb(payload: {
  apartment_id?: string;
  apt_code: string;
  resident_name: string;
  resident_phone: string;
  content: string;
  ticket_type?: ExtendedServiceRequest['ticket_type'];
  ticket_type_label?: string;
  ai_category?: string;
  before_image?: string;
}): Promise<ExtendedServiceRequest> {
  const cat = payload.ai_category || 'Khác';
  const isUrgent = cat === 'Nước' || cat === 'Điện';
  const classification = classifyTicket(payload.content, payload.ai_category);
  const ticketType = payload.ticket_type || classification.type;
  const handler = ticketType === 'REPAIR' ? 'TECHNICIAN' : 'MANAGEMENT';
  const isAutoResolved =
    ticketType === 'FEEDBACK' &&
    Boolean(classification.canAutoResolve && classification.autoReplyText);

  let suggestedTech: TechnicianProfile | undefined;
  if (ticketType === 'REPAIR') {
    const techs = await listTechniciansDb();
    if (techs.length > 0) {
      if (cat === 'Điện' || cat === 'Nước') {
        suggestedTech =
          techs.find((t) => t.specialty.includes('Cơ Điện') || t.specialty.includes('Điện')) ||
          techs[0];
      } else if (cat === 'Vệ sinh') {
        suggestedTech = techs.find((t) => t.specialty.includes('Vệ Sinh')) || techs[0];
      } else {
        suggestedTech = techs.find((t) => t.specialty.includes('Đa Năng')) || techs[0];
      }
    }
  }

  const now = new Date().toISOString();
  const newTicket: ExtendedServiceRequest = {
    id: `TICK-${Date.now().toString().slice(-6)}`,
    apartment_id: payload.apartment_id || `apt-${payload.apt_code.toLowerCase()}`,
    apt_code: payload.apt_code,
    resident_name: payload.resident_name,
    resident_phone: payload.resident_phone,
    content: payload.content,
    ticket_type: ticketType === 'REPAIR' ? 'REPAIR' : 'FEEDBACK',
    ticket_type_label:
      payload.ticket_type_label ||
      (ticketType === 'REPAIR' ? 'Sửa Chữa Kỹ Thuật' : 'Phản Ánh & Ý Kiến'),
    handled_by: handler,
    ai_category: cat,
    ai_priority: isUrgent ? 1 : 2,
    priority_color: isUrgent ? '#DC2626' : '#D97706',
    sla_deadline: new Date(Date.now() + (isUrgent ? 45 : 120) * 60000).toISOString(),
    sla_minutes_left: isUrgent ? 45 : 120,
    status: isAutoResolved ? 'Resolved' : 'Open',
    admin_reply: isAutoResolved ? classification.autoReplyText : undefined,
    admin_replied_at: isAutoResolved ? now : undefined,
    admin_replied_by: isAutoResolved ? 'Hệ Thống Quản Lý Skyline (AI Tự Động)' : undefined,
    ai_suggested_reply: classification.suggestedAdminReply || classification.autoReplyText,
    suggested_technician: suggestedTech?.name,
    suggested_technician_id: suggestedTech?.id,
    suggested_technician_phone: suggestedTech?.phone,
    suggested_match_score: suggestedTech ? 95 : undefined,
    ai_dispatch_reason: suggestedTech
      ? `Kỹ thuật viên chuyên trách ${cat} phù hợp nhất.`
      : undefined,
    before_image: payload.before_image || undefined,
    created_at: now,
    updated_at: now,
  };

  return insertTicketDb(newTicket);
}

export async function updateTicketDb(
  id: string,
  patch: TicketUpdate
): Promise<ExtendedServiceRequest | null> {
  const { data, error } = await supabaseAdmin
    .from('service_tickets')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw new Error(`Supabase service_tickets update error: ${error.message}`);
  return data ? serviceTicketRecordToRequest(rowToTicketRecord(data)) : null;
}

export async function deleteTicketDb(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('service_tickets').delete().eq('id', id);
  if (error) throw new Error(`Supabase service_tickets delete error: ${error.message}`);
}
