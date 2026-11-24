/**
 * Skyline Smart Residence - Centralized Maintenance Ticket & Technician Payroll Store
 * Pure In-Database Architecture. Powered by skylineDb.
 * Zero LocalStorage. Zero External Mock APIs. Zero Dummy Tickets (No Sunny/Sunn fake tickets).
 */

import { ServiceRequest } from './dataStore';
import { addApartmentMaintenanceRecord } from './apartmentStore';
import { 
  TicketCategoryType, 
  TicketHandlerRole, 
  classifyTicket, 
  findInquiryAnswer 
} from './ticketClassification';
import { skylineDb } from './db';
import { ServiceTicketRecord, TechnicianRecord } from './db/schema';

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
    apartment_code: req.apt_code || req.apartment_id || 'CH-06',
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

export const DEFAULT_TECHNICIANS: TechnicianProfile[] = skylineDb.technicians.find().map(technicianRecordToProfile);
export const INITIAL_TICKETS: ExtendedServiceRequest[] = skylineDb.tickets.find().map(serviceTicketRecordToRequest);

function notifyTicketsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_tickets_updated'));
  }
}

// -----------------------------------------------------------------------------
// GET / SAVE TECHNICIANS - FROM SKYLINE DATABASE
// -----------------------------------------------------------------------------
export function getTechnicians(): TechnicianProfile[] {
  return skylineDb.technicians.find().map(technicianRecordToProfile);
}

export function saveTechnicians(techs: TechnicianProfile[]): void {
  techs.forEach(t => {
    skylineDb.technicians.update(t.id, {
      name: t.name,
      phone: t.phone,
      email: t.email,
      specialty: t.specialty,
      base_salary: t.baseSalary,
      pay_per_ticket: t.payPerTicket,
      bonus_per_fivestar: t.bonusPerFiveStar,
      status: t.status,
    });
  });
  notifyTicketsUpdated();
}

export function getTechnicianById(id: string): TechnicianProfile | undefined {
  const rec = skylineDb.technicians.findById(id);
  return rec ? technicianRecordToProfile(rec) : undefined;
}

// -----------------------------------------------------------------------------
// GET / SAVE TICKETS - FROM SKYLINE DATABASE
// -----------------------------------------------------------------------------
export function getTickets(aptCode?: string, phone?: string): ExtendedServiceRequest[] {
  const allTickets = skylineDb.tickets.find().map(serviceTicketRecordToRequest);

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
  const rec = skylineDb.tickets.findById(id);
  return rec ? serviceTicketRecordToRequest(rec) : undefined;
}

export function saveTickets(tickets: ExtendedServiceRequest[]): void {
  tickets.forEach(t => {
    const existing = skylineDb.tickets.findById(t.id);
    const record = extendedServiceRequestToRecord(t);
    if (existing) {
      skylineDb.tickets.update(existing.id, record);
    } else {
      skylineDb.tickets.insert(record);
    }
  });
  notifyTicketsUpdated();
}

export async function syncTicketsWithServer(aptCode?: string, phone?: string): Promise<ExtendedServiceRequest[]> {
  notifyTicketsUpdated();
  return getTickets(aptCode, phone);
}

/**
 * Tạo phiếu mới
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
  return createTicket(payload);
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
  skylineDb.tickets.insert(rec);
  notifyTicketsUpdated();
  return newTicket;
}

/**
 * Phản hồi chính thức của BQL
 */
export function adminRespondToTicket(
  ticketId: string,
  replyText: string,
  adminName: string = 'Ban Quản Lý Chung Cư',
  engineername?: string
): ExtendedServiceRequest | null {
  const existing = skylineDb.tickets.findById(ticketId);
  if (!existing) return null;

  const patch: Partial<ServiceTicketRecord> = {
    admin_reply: replyText.trim(),
    admin_replied_at: new Date().toISOString(),
    admin_replied_by: adminName,
    status: 'Resolved',
    updated_at: new Date().toISOString()
  };
  if (engineername) {
    patch.assigned_technician_name = engineername.trim();
  }

  const updatedRec = skylineDb.tickets.update(existing.id, patch);
  notifyTicketsUpdated();
  return updatedRec ? serviceTicketRecordToRequest(updatedRec) : null;
}

/**
 * AI trả lời tự động câu hỏi
 */
export function aiAnswerTicket(
  ticketId: string,
  customAnswer?: string
): ExtendedServiceRequest | null {
  const existing = skylineDb.tickets.findById(ticketId);
  if (!existing) return null;

  const answer = customAnswer || findInquiryAnswer(existing.content);
  const updatedRec = skylineDb.tickets.update(existing.id, {
    handled_by: 'AI',
    ai_reply: answer,
    ai_replied_at: new Date().toISOString(),
    status: 'Resolved',
    updated_at: new Date().toISOString()
  });

  notifyTicketsUpdated();
  return updatedRec ? serviceTicketRecordToRequest(updatedRec) : null;
}

/**
 * Phân công Kỹ thuật viên
 */
export function assignTechnicianToTicket(
  ticketId: string, 
  technicianId: string,
  scheduledTime?: string
): ExtendedServiceRequest | null {
  const existing = skylineDb.tickets.findById(ticketId);
  const tech = getTechnicianById(technicianId);
  if (!existing || !tech) return null;

  const updatedRec = skylineDb.tickets.update(existing.id, {
    status: 'In_Progress',
    assigned_technician_id: tech.id,
    assigned_technician_name: tech.name,
    assigned_technician_phone: tech.phone,
    scheduled_time: scheduledTime || 'Có mặt trong vòng 30 phút',
    updated_at: new Date().toISOString()
  });

  // Đổi trạng thái KTV thành BUSY
  skylineDb.technicians.update(tech.id, { status: 'BUSY' });
  notifyTicketsUpdated();
  return updatedRec ? serviceTicketRecordToRequest(updatedRec) : null;
}

/**
 * Nghiệm thu và đóng phiếu
 */
export function resolveTicket(
  ticketId: string,
  afterImage: string,
  resolutionNotes?: string,
  aiVerification?: ExtendedServiceRequest['ai_verification']
): ExtendedServiceRequest | null {
  const existing = skylineDb.tickets.findById(ticketId);
  if (!existing) return null;

  const assignedTechId = existing.assigned_technician_id;

  const updatedRec = skylineDb.tickets.update(existing.id, {
    status: 'Resolved',
    after_image: afterImage,
    resolved_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Chuyển KTV về AVAILABLE nếu không còn phiếu nào đang làm
  if (assignedTechId) {
    const busyRemaining = skylineDb.tickets.findOne(t => t.assigned_technician_id === assignedTechId && t.status === 'In_Progress' && t.id !== existing.id);
    if (!busyRemaining) {
      skylineDb.technicians.update(assignedTechId, { status: 'AVAILABLE' });
    }
  }

  // Ghi nhận vào lý lịch bảo trì căn hộ
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
  return updatedRec ? serviceTicketRecordToRequest(updatedRec) : null;
}

/**
 * Từ chối nghiệm thu
 */
export function rejectTicketResolution(
  ticketId: string,
  reason: string
): ExtendedServiceRequest | null {
  const existing = skylineDb.tickets.findById(ticketId);
  if (!existing) return null;

  const updatedRec = skylineDb.tickets.update(existing.id, {
    status: 'In_Progress',
    after_image: undefined,
    updated_at: new Date().toISOString()
  });

  notifyTicketsUpdated();
  return updatedRec ? serviceTicketRecordToRequest(updatedRec) : null;
}

/**
 * Cập nhật API Async
 */
export async function updateTicketApiAsync(payload: {
  id: string | number;
  reply?: string;
  engineername?: string;
}): Promise<boolean> {
  const idStr = String(payload.id);
  const existing = skylineDb.tickets.findById(idStr);
  if (!existing) return false;

  const patch: Partial<ServiceTicketRecord> = {};
  if (payload.reply) {
    patch.admin_reply = payload.reply.trim();
    patch.admin_replied_at = new Date().toISOString();
    patch.status = 'Resolved';
  }
  if (payload.engineername) {
    patch.assigned_technician_name = payload.engineername.trim();
    if (existing.status === 'Open') patch.status = 'In_Progress';
  }
  patch.updated_at = new Date().toISOString();

  skylineDb.tickets.update(existing.id, patch);
  notifyTicketsUpdated();
  return true;
}

/**
 * Cư Dân chấm điểm 5 sao & phản hồi
 */
export function rateTicket(
  ticketId: string,
  rating: number,
  feedback?: string
): ExtendedServiceRequest | null {
  const existing = skylineDb.tickets.findById(ticketId);
  if (!existing) return null;

  const updatedRec = skylineDb.tickets.update(existing.id, {
    rating: Math.max(1, Math.min(5, Math.round(rating))),
    resident_feedback: feedback?.trim() || 'Cư dân hài lòng với dịch vụ.',
    rated_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  notifyTicketsUpdated();
  return updatedRec ? serviceTicketRecordToRequest(updatedRec) : null;
}

/**
 * Xóa phiếu
 */
export async function deleteTicketAsync(ticketId: string | number): Promise<boolean> {
  deleteTicket(ticketId);
  return true;
}

export function deleteTicket(ticketId: string | number): void {
  const idStr = String(ticketId);
  const existing = skylineDb.tickets.findById(idStr);
  if (existing) {
    skylineDb.tickets.delete(existing.id);
    notifyTicketsUpdated();
  }
}

/**
 * Bảng lương KTV tính từ các ca sửa thực tế trong skylineDb
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
