/**
 * Skyline Smart Residence - Centralized Maintenance Ticket & Technician Payroll Store
 * Client Ticket Store backed by /api/tickets & Supabase Postgres.
 * Syncs with Supabase Postgres via /api/tickets.
 */

import { ServiceRequest } from './dataStore';
import { addApartmentMaintenanceRecord } from './apartmentStore';
import {
  TicketCategoryType,
  TicketHandlerRole,
  classifyTicket,
  findInquiryAnswer
} from './ticketClassification';
import { ServiceTicketRecord, TechnicianRecord } from './db/schema';

const ticketsCache: ServiceTicketRecord[] = [];
const techniciansCache: TechnicianRecord[] = [];

export type { TicketCategoryType, TicketHandlerRole };

export interface TechnicianProfile {
  id: string; // 'KTV-01', 'KTV-02', 'KTV-03'
  name: string;
  phone: string;
  email: string;
  specialty: 'Cơ Điện & Nước' | 'Điện Lạnh & Kỹ Thuật Tòa Nhà' | 'Vệ Sinh & Cảnh Quan Chung Cư' | 'Đa Năng' | string;
  baseSalary: number; // Lương cơ bản tháng (VNĐ)
  payPerTicket: number; // Tiền công định mức theo ca sửa (VNĐ)
  bonusPerFiveStar: number; // Thưởng khi cư dân chấm 5 sao (VNĐ)
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
}

export interface ExtendedServiceRequest extends Omit<ServiceRequest, 'after_image' | 'ai_category' | 'apartment_id' | 'sla_deadline' | 'sla_minutes_left' | 'before_image'> {
  apartment_id?: string;
  sla_deadline?: string;
  sla_minutes_left?: number;
  before_image?: string;
  ai_category?: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác' | string;

  ticket_type?: TicketCategoryType;
  ticket_type_label?: string;
  handled_by?: TicketHandlerRole;

  ai_reply?: string;
  ai_replied_at?: string;

  admin_reply?: string;
  admin_replied_at?: string;
  admin_replied_by?: string;

  after_image?: string;
  assigned_technician_id?: string;
  assigned_technician_phone?: string;
  scheduled_time?: string;
  resolution_notes?: string;
  rating?: number;
  resident_feedback?: string;
  rated_at?: string;
  resolved_at?: string;

  suggested_technician?: string;
  suggested_technician_id?: string;
  suggested_technician_phone?: string;
  suggested_match_score?: number;
  ai_suggested_reply?: string;

  auto_dispatched?: boolean;
  ai_dispatch_reason?: string;

  area?: string;
  urgency?: 'HIGH' | 'NORMAL' | string;

  ai_verification?: {
    status: 'VERIFIED' | 'INCOMPLETE' | 'SUSPICIOUS';
    confidence_score?: number;
    score?: number;
    verification_title?: string;
    title?: string;
    verification_detail?: string;
    detail?: string;
    timestamp?: string;
    is_genuine?: boolean;
    risk_warning?: string;
  };

  rework_reason?: string;
  rework_count?: number;
}

export interface TechnicianPayrollSummary {
  technician: TechnicianProfile;
  completedTicketsCount: number;
  fiveStarCount: number;
  averageRating: number;
  baseSalary: number;
  ticketBonusTotal: number;
  fiveStarBonusTotal: number;
  totalIncome: number;
  recentTickets: ExtendedServiceRequest[];
}

export function technicianRecordToProfile(rec: TechnicianRecord): TechnicianProfile {
  return {
    id: rec.id,
    name: rec.name,
    phone: rec.phone,
    email: rec.email,
    specialty: rec.specialty,
    baseSalary: rec.base_salary,
    payPerTicket: rec.pay_per_ticket,
    bonusPerFiveStar: rec.bonus_per_fivestar,
    status: rec.status,
  };
}

export function serviceTicketRecordToRequest(rec: ServiceTicketRecord): ExtendedServiceRequest {
  return {
    id: rec.id,
    apt_code: rec.apartment_code,
    apartment_id: rec.apartment_code,
    resident_name: rec.resident_name,
    resident_phone: rec.resident_phone,
    content: rec.content,
    ticket_type: rec.ticket_type as any,
    ticket_type_label: rec.ticket_type_label,
    ai_category: rec.ai_category,
    ai_priority: rec.ai_priority,
    priority_color: rec.priority_color,
    status: rec.status as any,
    handled_by: rec.handled_by as any,
    ai_reply: rec.ai_reply,
    ai_replied_at: rec.ai_replied_at,
    admin_reply: rec.admin_reply,
    admin_replied_at: rec.admin_replied_at,
    admin_replied_by: rec.admin_replied_by,
    assigned_technician_id: rec.assigned_technician_id,
    assigned_technician: rec.assigned_technician_name,
    assigned_technician_phone: rec.assigned_technician_phone,
    scheduled_time: rec.scheduled_time,
    auto_dispatched: rec.auto_dispatched,
    ai_dispatch_reason: rec.ai_dispatch_reason,
    rating: rec.rating,
    resident_feedback: rec.resident_feedback,
    rated_at: rec.rated_at,
    before_image: rec.before_image,
    after_image: rec.after_image,
    created_at: rec.created_at,
    resolved_at: rec.resolved_at,
    updated_at: rec.updated_at || rec.created_at,
    sla_deadline: rec.sla_deadline,
  };
}

export function extendedServiceRequestToRecord(req: ExtendedServiceRequest): ServiceTicketRecord {
  return {
    id: req.id,
    apartment_code: req.apt_code || req.apartment_id || '',
    resident_name: req.resident_name || 'Cư Dân Skyline',
    resident_phone: req.resident_phone || '',
    content: req.content,
    ai_category: req.ai_category || 'Khác',
    ai_priority: (req.ai_priority as 1 | 2 | 3) || 2,
    priority_color: req.priority_color || '#D97706',
    sla_deadline: req.sla_deadline,
    status: req.status as any,
    ticket_type: (req.ticket_type || 'REPAIR') as any,
    ticket_type_label: req.ticket_type_label,
    handled_by: (req.handled_by || 'TECHNICIAN') as any,
    ai_reply: req.ai_reply,
    ai_replied_at: req.ai_replied_at,
    admin_reply: req.admin_reply,
    admin_replied_at: req.admin_replied_at,
    admin_replied_by: req.admin_replied_by,
    assigned_technician_id: req.assigned_technician_id,
    assigned_technician_name: req.assigned_technician,
    assigned_technician_phone: req.assigned_technician_phone,
    scheduled_time: req.scheduled_time,
    auto_dispatched: req.auto_dispatched,
    ai_dispatch_reason: req.ai_dispatch_reason,
    rating: req.rating,
    resident_feedback: req.resident_feedback,
    rated_at: req.rated_at,
    before_image: req.before_image,
    after_image: req.after_image,
    created_at: req.created_at,
    resolved_at: req.resolved_at,
    updated_at: req.updated_at || new Date().toISOString()
  };
}

export const DEFAULT_TECHNICIANS: TechnicianProfile[] = [];
export const INITIAL_TICKETS: ExtendedServiceRequest[] = [];

function notifyTicketsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_tickets_updated'));
  }
}

export function getTechnicians(): TechnicianProfile[] {
  return techniciansCache.map(technicianRecordToProfile);
}

export function saveTechnicians(techs: TechnicianProfile[]): void {
  techs.forEach(t => {
    const existing = techniciansCache.find(item => item.id === t.id);
    if (existing) {
      existing.name = t.name;
      existing.phone = t.phone;
      existing.email = t.email;
      existing.specialty = t.specialty;
      existing.base_salary = t.baseSalary;
      existing.pay_per_ticket = t.payPerTicket;
      existing.bonus_per_fivestar = t.bonusPerFiveStar;
      existing.status = t.status;
    }
  });
  notifyTicketsUpdated();
}

export function getTechnicianById(id: string): TechnicianProfile | undefined {
  const rec = techniciansCache.find(item => item.id === id);
  return rec ? technicianRecordToProfile(rec) : undefined;
}

export function getTickets(aptCode?: string, phone?: string): ExtendedServiceRequest[] {
  const allTickets = ticketsCache.map(serviceTicketRecordToRequest);

  if (aptCode || phone) {
    const cleanCode = aptCode ? aptCode.trim().toUpperCase() : '';
    const cleanPhone = phone ? phone.trim() : '';

    return allTickets.filter(t => {
      const matchApt = cleanCode && t.apt_code && t.apt_code.trim().toUpperCase() === cleanCode;
      const matchPhone = cleanPhone && t.resident_phone && t.resident_phone.trim() === cleanPhone;
      return Boolean(matchApt || matchPhone);
    });
  }
  return allTickets;
}

export function getTicketById(id: string): ExtendedServiceRequest | undefined {
  const rec = ticketsCache.find(item => item.id === id);
  return rec ? serviceTicketRecordToRequest(rec) : undefined;
}

export function saveTickets(tickets: ExtendedServiceRequest[]): void {
  tickets.forEach(t => {
    const idx = ticketsCache.findIndex(item => item.id === t.id);
    const record = extendedServiceRequestToRecord(t);
    if (idx >= 0) {
      ticketsCache[idx] = record;
    } else {
      ticketsCache.push(record);
    }
  });
  notifyTicketsUpdated();
}

export async function syncTicketsWithServer(aptCode?: string, phone?: string): Promise<ExtendedServiceRequest[]> {
  if (typeof window === 'undefined') return getTickets(aptCode, phone);
  const params = new URLSearchParams();
  if (aptCode) params.set('aptCode', aptCode);
  if (phone) params.set('phone', phone);
  const res = await fetch(`/api/tickets${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) {
    throw new Error(`Không thể tải danh sách phiếu từ server (${res.status})`);
  }
  const data = await res.json();
  notifyTicketsUpdated();
  return Array.isArray(data?.tickets) ? data.tickets : [];
}

/**
 * Tạo phiếu mới qua API Supabase
 */
export async function createTicketAsync(payload: {
  apartment_id?: string;
  apt_code: string;
  resident_name: string;
  resident_phone: string;
  content: string;
  ticket_type?: TicketCategoryType;
  ticket_type_label?: string;
  ai_category?: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác' | string;
  before_image?: string;
}): Promise<ExtendedServiceRequest> {
  if (typeof window === 'undefined') return createTicket(payload);
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apt_code: payload.apt_code,
      resident_name: payload.resident_name,
      resident_phone: payload.resident_phone,
      content: payload.content,
      service: payload.ai_category,
      before_image: payload.before_image,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data?.success || !data?.ticket) {
    throw new Error(data?.message || `Lỗi tạo phiếu (${res.status})`);
  }
  notifyTicketsUpdated();
  return data.ticket;
}

export function createTicket(payload: {
  apartment_id?: string;
  apt_code: string;
  resident_name: string;
  resident_phone: string;
  content: string;
  ticket_type?: TicketCategoryType;
  ticket_type_label?: string;
  ai_category?: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác' | string;
  before_image?: string;
}): ExtendedServiceRequest {
  const cat = payload.ai_category || 'Khác';
  const isUrgent = cat === 'Nước' || cat === 'Điện';

  const classification = classifyTicket(payload.content, payload.ai_category);
  const ticketType = payload.ticket_type || classification.type;
  const handler = ticketType === 'REPAIR' ? 'TECHNICIAN' : 'MANAGEMENT';
  const isAutoResolved = ticketType === 'FEEDBACK' && Boolean(classification.canAutoResolve && classification.autoReplyText);

  let suggestedTech: TechnicianProfile | undefined = undefined;
  if (ticketType === 'REPAIR') {
    const techs = getTechnicians();
    if (techs.length > 0) {
      if (cat === 'Điện' || cat === 'Nước') {
        suggestedTech = techs.find(t => t.specialty.includes('Cơ Điện') || t.specialty.includes('Điện')) || techs[0];
      } else if (cat === 'Vệ sinh') {
        suggestedTech = techs.find(t => t.specialty.includes('Vệ Sinh')) || techs[0];
      } else {
        suggestedTech = techs.find(t => t.specialty.includes('Đa Năng')) || techs[0];
      }
    }
  }

  const newTicket: ExtendedServiceRequest = {
    id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
    apartment_id: payload.apartment_id || `apt-${payload.apt_code.toLowerCase()}`,
    apt_code: payload.apt_code,
    resident_name: payload.resident_name,
    resident_phone: payload.resident_phone,
    content: payload.content,
    ticket_type: ticketType === 'REPAIR' ? 'REPAIR' : 'FEEDBACK',
    ticket_type_label: ticketType === 'REPAIR' ? 'Sửa Chữa Kỹ Thuật' : 'Phản Ánh & Ý Kiến',
    handled_by: handler,
    ai_category: cat,
    ai_priority: isUrgent ? 1 : 2,
    priority_color: isUrgent ? '#DC2626' : '#D97706',
    sla_deadline: new Date(Date.now() + (isUrgent ? 45 : 120) * 60000).toISOString(),
    sla_minutes_left: isUrgent ? 45 : 120,
    status: isAutoResolved ? 'Resolved' : 'Open',
    admin_reply: isAutoResolved ? classification.autoReplyText : undefined,
    admin_replied_at: isAutoResolved ? new Date().toISOString() : undefined,
    admin_replied_by: isAutoResolved ? 'Hệ Thống Quản Lý Skyline (AI Tự Động)' : undefined,
    ai_suggested_reply: classification.suggestedAdminReply || classification.autoReplyText,
    suggested_technician: suggestedTech?.name,
    suggested_technician_id: suggestedTech?.id,
    suggested_technician_phone: suggestedTech?.phone,
    suggested_match_score: suggestedTech ? 95 : undefined,
    ai_dispatch_reason: suggestedTech ? `Kỹ thuật viên chuyên trách ${cat} phù hợp nhất.` : undefined,
    scheduled_time: isUrgent ? 'Có mặt trong vòng 30 phút' : 'Có mặt trong vòng 45 phút',
    before_image: payload.before_image || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const rec = extendedServiceRequestToRecord(newTicket);
  ticketsCache.unshift(rec);
  notifyTicketsUpdated();
  return newTicket;
}

export function adminRespondToTicket(
  ticketId: string,
  replyText: string,
  adminName: string = 'Ban Quản Lý Chung Cư',
  engineername?: string
): ExtendedServiceRequest | null {
  const existing = ticketsCache.find(item => item.id === ticketId);
  if (!existing) return null;

  existing.admin_reply = replyText.trim();
  existing.admin_replied_at = new Date().toISOString();
  existing.admin_replied_by = adminName;
  existing.status = 'Resolved';
  existing.updated_at = new Date().toISOString();
  if (engineername) {
    existing.assigned_technician_name = engineername.trim();
  }

  notifyTicketsUpdated();
  return serviceTicketRecordToRequest(existing);
}

export function aiAnswerTicket(
  ticketId: string,
  customAnswer?: string
): ExtendedServiceRequest | null {
  const existing = ticketsCache.find(item => item.id === ticketId);
  if (!existing) return null;

  const answer = customAnswer || findInquiryAnswer(existing.content);
  existing.handled_by = 'AI';
  existing.ai_reply = answer;
  existing.ai_replied_at = new Date().toISOString();
  existing.status = 'Resolved';
  existing.updated_at = new Date().toISOString();

  notifyTicketsUpdated();
  return serviceTicketRecordToRequest(existing);
}

export function assignTechnicianToTicket(
  ticketId: string,
  technicianId: string,
  scheduledTime?: string
): ExtendedServiceRequest | null {
  const existing = ticketsCache.find(item => item.id === ticketId);
  const tech = getTechnicianById(technicianId);
  if (!existing || !tech) return null;

  existing.status = 'In_Progress';
  existing.assigned_technician_id = tech.id;
  existing.assigned_technician_name = tech.name;
  existing.assigned_technician_phone = tech.phone;
  existing.scheduled_time = scheduledTime || 'Có mặt trong vòng 30 phút';
  existing.updated_at = new Date().toISOString();

  const techRec = techniciansCache.find(item => item.id === tech.id);
  if (techRec) techRec.status = 'BUSY';
  notifyTicketsUpdated();
  return serviceTicketRecordToRequest(existing);
}

export function resolveTicket(
  ticketId: string,
  afterImage: string,
  resolutionNotes?: string,
  _aiVerification?: ExtendedServiceRequest['ai_verification']
): ExtendedServiceRequest | null {
  const existing = ticketsCache.find(item => item.id === ticketId);
  if (!existing) return null;

  const assignedTechId = existing.assigned_technician_id;
  existing.status = 'Resolved';
  existing.after_image = afterImage;
  existing.resolved_at = new Date().toISOString();
  existing.updated_at = new Date().toISOString();

  if (assignedTechId) {
    const busyRemaining = ticketsCache.find(t => t.assigned_technician_id === assignedTechId && t.status === 'In_Progress' && t.id !== existing.id);
    if (!busyRemaining) {
      const techRec = techniciansCache.find(item => item.id === assignedTechId);
      if (techRec) techRec.status = 'AVAILABLE';
    }
  }

  if (existing.apartment_code) {
    try {
      addApartmentMaintenanceRecord(existing.apartment_code, {
        id: existing.id,
        date: new Date().toLocaleDateString('vi-VN'),
        title: existing.content.slice(0, 80),
        technician: existing.assigned_technician_name || 'Kỹ thuật viên Skyline',
        status: 'COMPLETED',
        cost: 150000,
        note: resolutionNotes || 'Nghiệm thu đạt chuẩn kỹ thuật.'
      });
    } catch (err) {
      console.warn('Lỗi ghi nhận lý lịch bảo trì căn hộ:', err);
    }
  }

  notifyTicketsUpdated();
  return serviceTicketRecordToRequest(existing);
}

export function rejectTicketResolution(
  ticketId: string,
  _reason: string
): ExtendedServiceRequest | null {
  const existing = ticketsCache.find(item => item.id === ticketId);
  if (!existing) return null;

  existing.status = 'In_Progress';
  existing.after_image = undefined;
  existing.updated_at = new Date().toISOString();

  notifyTicketsUpdated();
  return serviceTicketRecordToRequest(existing);
}

/**
 * Cập nhật API Async
 */
export async function updateTicketApiAsync(payload: {
  id: string | number;
  reply?: string;
  engineername?: string;
}): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/tickets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: String(payload.id),
        admin_reply: payload.reply?.trim(),
        assigned_technician: payload.engineername?.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || `Lỗi cập nhật phiếu (${res.status})`);
    }
    notifyTicketsUpdated();
    return true;
  }

  const idStr = String(payload.id);
  const existing = ticketsCache.find(item => item.id === idStr);
  if (!existing) return false;

  if (payload.reply) {
    existing.admin_reply = payload.reply.trim();
    existing.admin_replied_at = new Date().toISOString();
  }
  if (payload.engineername) {
    existing.assigned_technician_name = payload.engineername.trim();
  }
  existing.updated_at = new Date().toISOString();
  notifyTicketsUpdated();
  return true;
}

export function rateTicket(
  ticketId: string,
  rating: number,
  feedback?: string
): ExtendedServiceRequest | null {
  const existing = ticketsCache.find(item => item.id === ticketId);
  if (!existing) return null;

  existing.rating = Math.max(1, Math.min(5, Math.round(rating)));
  existing.resident_feedback = feedback?.trim() || 'Cư dân hài lòng với dịch vụ.';
  existing.rated_at = new Date().toISOString();
  existing.updated_at = new Date().toISOString();

  notifyTicketsUpdated();
  return serviceTicketRecordToRequest(existing);
}

/**
 * Xóa phiếu
 */
export async function deleteTicketAsync(ticketId: string | number): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/tickets?id=${encodeURIComponent(String(ticketId))}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || `Lỗi xóa phiếu (${res.status})`);
    }
    notifyTicketsUpdated();
    return true;
  }
  deleteTicket(ticketId);
  return true;
}

export function deleteTicket(ticketId: string | number): void {
  const idStr = String(ticketId);
  const idx = ticketsCache.findIndex(item => item.id === idStr);
  if (idx >= 0) {
    ticketsCache.splice(idx, 1);
    notifyTicketsUpdated();
  }
}

/**
 * Bảng lương KTV tính từ các ca sửa thực tế
 */
export function getTechnicianPayroll(): TechnicianPayrollSummary[] {
  const techs = getTechnicians();
  const allTickets = getTickets();

  return techs.map(tech => {
    const techResolvedTickets = allTickets.filter(
      t => t.assigned_technician_id === tech.id && t.status === 'Resolved'
    );

    const completedCount = techResolvedTickets.length;
    const fiveStarCount = techResolvedTickets.filter(t => t.rating === 5).length;

    const ratedTickets = techResolvedTickets.filter(t => typeof t.rating === 'number' && t.rating > 0);
    const sumRating = ratedTickets.reduce((acc, t) => acc + (t.rating || 0), 0);
    const averageRating = ratedTickets.length > 0
      ? Number((sumRating / ratedTickets.length).toFixed(1))
      : (completedCount > 0 ? 5.0 : 0);

    const ticketBonusTotal = completedCount * tech.payPerTicket;
    const fiveStarBonusTotal = fiveStarCount * tech.bonusPerFiveStar;
    const totalIncome = tech.baseSalary + ticketBonusTotal + fiveStarBonusTotal;

    return {
      technician: tech,
      completedTicketsCount: completedCount,
      fiveStarCount,
      averageRating,
      baseSalary: tech.baseSalary,
      ticketBonusTotal,
      fiveStarBonusTotal,
      totalIncome,
      recentTickets: techResolvedTickets.slice(0, 5),
    };
  });
}
