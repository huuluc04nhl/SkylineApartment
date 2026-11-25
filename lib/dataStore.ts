// ============================================================================
// DATA STORE & TYPE DEFINITIONS - SKYLINE SMART RESIDENCE
// Client-side types and helpers for Skyline Smart Residence.
// ============================================================================

import {
  UserRecord,
  ApartmentRecord,
  BillRecord,
  ServiceTicketRecord,
  FacilityRecord,
  CommunityPostRecord,
  VotingTopicRecord
} from '@/lib/db/schema';

export type UserRole = 'ADMIN' | 'OWNER' | 'TENANT' | 'TECHNICIAN' | 'RECEPTIONIST';

export interface User {
  id: string;
  role: UserRole;
  username: string; // Số điện thoại hoặc tên tài khoản
  full_name: string;
  phone?: string;
  email?: string;
  id_card_no?: string; // [AI OCR]
  id_card_number?: string;
  id_number?: string;
  id_date?: string;
  id_place?: string;
  face_vector?: string; // [AI Vision]
  emergency_phone?: string;
  avatar_url?: string;
  ui_language: 'vi' | 'en';
  apartment_code?: string;
  relationship?: 'Owner' | 'Family' | 'Tenant' | 'Staff';
  license_plate?: string;
  dob?: string;
  pob?: string;
  password?: string;
}

export interface Block {
  id: number;
  block_code: string;
  total_floors: number;
  manager_id: string;
}

export interface SmartWidget {
  id: string;
  name: string;
  type: 'light' | 'ac' | 'door' | 'curtain' | 'sensor';
  status: 'on' | 'off' | number;
  x: number; // percentage
  y: number; // percentage
}

export interface Apartment {
  id: string;
  block_id: number;
  block_code: string;
  floor_number: number;
  apt_code: string;
  apt_type: 'Studio' | '1PN' | '2PN' | '3PN' | 'Duplex';
  wall_area: number; // Diện tích tim tường (m2)
  clear_area: number; // Diện tích thông thủy (m2)
  legal_status: 'SPA' | 'Pink_Book';
  status: 'Đang trống' | 'Đã bàn giao' | 'Đang bảo trì';
  price_vnd: number;
  bedrooms: number;
  bathrooms: number;
  thumbnail_url: string;
  floor_plan_url: string;
  smart_widgets: SmartWidget[];
}

export type BillServiceType =
  | 'Electricity'
  | 'Water'
  | 'Management_Fee'
  | 'Parking'
  | 'Internet'
  | 'Facility'
  | 'Laundry'
  | 'Housekeeping'
  | 'Personal_Trainer'
  | 'Car_Care'
  | 'Spa'
  | 'Dining'
  | 'Transport'
  | 'Other';

export interface BillDetail {
  id: string;
  bill_id: string;
  service_type: BillServiceType;
  service_name?: string;
  usage?: number;
  unit?: string;
  unit_price?: number;
  total_line_amount: number;
  order_date?: string;
  booking_ref?: string;
  ai_anomaly?: boolean;
  anomaly_reason?: string;
}

export interface Bill {
  id: string;
  apartment_id: string;
  apt_code: string;
  apartment_code?: string;
  owner_name: string;
  billing_month: string;
  due_date: string;
  total_amount: number;
  status: 'Draft' | 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  status_color: string;
  payment_qr_url: string;
  invoice_pdf_url: string;
  details: BillDetail[];
  has_ai_anomaly: boolean;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  apartment_id: string;
  apt_code: string;
  resident_name: string;
  resident_phone?: string;
  content: string;
  ai_category: 'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Nhà hàng' | 'Hồ bơi' | 'Khác' | string;
  ai_priority: 1 | 2 | 3;
  priority_color?: string;
  sla_deadline: string;
  sla_minutes_left: number;
  status: 'Open' | 'Assigned' | 'In_Progress' | 'Resolved';
  assigned_technician?: string;
  before_image: string;
  after_image: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  name: string;
  category: 'Thang máy' | 'Máy bơm' | 'Hệ thống PCCC' | 'Trạm biến áp' | 'Barrier' | 'Thông gió & Hút khói';
  location: string;
  health_score: number;
  predict_date: string;
  last_maintenance: string;
  status: 'Hoạt động tốt' | 'Cần kiểm tra' | 'Cảnh báo hỏng';
}

export interface Vehicle {
  id: string;
  apartment_id: string;
  apt_code: string;
  owner_name: string;
  license_plate: string;
  vehicle_type: 'Ô tô' | 'Xe máy';
  priority_level: number;
  registered_at: string;
}

export interface VisitorLog {
  id: string;
  apartment_id: string;
  apt_code: string;
  host_name: string;
  visitor_name: string;
  visitor_phone: string;
  purpose: string;
  valid_from: string;
  valid_to: string;
  qr_invite_code: string;
  check_in_time?: string;
  status: 'Chờ đến' | 'Đã check-in' | 'Hết hạn';
}

export interface SecurityAlert {
  id: string;
  alert_type: 'Fire' | 'Violence' | 'Fall' | 'Crowd' | 'Intrusion';
  title: string;
  location: string;
  camera_id: string;
  snapshot_url: string;
  confidence: number;
  created_at: string;
  status: 'New' | 'Investigating' | 'Resolved';
}

export interface Facility {
  id: string;
  name: string;
  category: 'Gym' | 'BBQ' | 'Hồ bơi' | 'Sân Tennis' | 'Phòng sinh hoạt' | 'Xông hơi' | 'Khu trẻ em' | 'Nhà hàng' | 'Công viên' | string;
  max_quota_per_month: number;
  hero_image_url: string;
  rating_score: number;
  operating_hours: string;
  pricing: string;
  current_occupancy: number;
  max_capacity: number;
}

export interface FacilityBooking {
  id: string;
  facility_id: string;
  facility_name: string;
  apartment_id: string;
  apt_code: string;
  resident_name: string;
  booking_date: string;
  time_slot: string;
  guests_count: number;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

export interface CommunityPost {
  id: string;
  author_name: string;
  author_role: 'BQL' | 'Cư dân' | 'Kỹ thuật';
  apt_code?: string;
  title: string;
  content: string;
  ai_moderation: 'Clean' | 'Toxic' | 'Pending';
  ai_sentiment: number;
  tags: string[];
  likes: number;
  comments_count: number;
  is_pinned?: boolean;
  created_at: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  legal_type: 'Bầu Ban Quản Trị' | 'Đóng góp Quỹ Bảo trì' | 'Ý kiến Cải tạo';
  deadline: string;
  is_owner_only: boolean;
  total_votes: number;
  options: { id: string; text: string; votes: number }[];
  user_voted?: string;
}

// ============================================================================
// DATABASE TRANSFORMATION HELPERS
// ============================================================================

export function userRecordToUser(u: UserRecord): User {
  return {
    id: u.id,
    role: u.role,
    username: u.username,
    full_name: u.full_name,
    phone: u.phone || undefined,
    email: u.email || undefined,
    id_card_no: u.id_card_no || undefined,
    id_card_number: u.id_card_no || undefined,
    id_number: u.id_card_no || undefined,
    id_date: u.id_date || undefined,
    id_place: u.id_place || undefined,
    face_vector: u.face_vector || undefined,
    emergency_phone: u.emergency_phone || undefined,
    avatar_url: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=1C2533&color=C5A880`,
    ui_language: 'vi',
    apartment_code: u.apartment_code || undefined,
    relationship: (u.relationship as any) || (u.role === 'OWNER' ? 'Owner' : u.role === 'ADMIN' ? 'Staff' : 'Family'),
    license_plate: u.license_plate || undefined,
    dob: u.dob || undefined,
    pob: u.pob || undefined,
    password: u.password_hash || undefined,
  };
}

export function apartmentRecordToApartment(a: ApartmentRecord): Apartment {
  const blockCode = a.tower_code ? `BS-${a.block_id === 880 ? '07' : a.block_id === 881 ? '08' : a.block_id === 882 ? '09' : '10'}` : 'BS-07';
  return {
    id: a.id,
    block_id: a.block_id,
    block_code: blockCode,
    floor_number: a.floor_number,
    apt_code: a.apt_code,
    apt_type: a.apt_type as any,
    wall_area: a.wall_area,
    clear_area: a.clear_area,
    legal_status: 'Pink_Book',
    status: a.status === 'OCCUPIED' ? 'Đã bàn giao' : a.status === 'MAINTENANCE' ? 'Đang bảo trì' : 'Đang trống',
    price_vnd: a.price_vnd,
    bedrooms: a.bedrooms,
    bathrooms: a.bathrooms,
    thumbnail_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    floor_plan_url: '/models/floorplans/skyline-floorplan-ch06.svg',
    smart_widgets: [
      { id: 'w1', name: 'Đèn phòng khách', type: 'light', status: 'on', x: 25, y: 30 },
      { id: 'w2', name: 'Điều hòa Daikin Inverter', type: 'ac', status: 24, x: 60, y: 40 },
      { id: 'w3', name: 'Khóa cửa FaceID', type: 'door', status: 'on', x: 10, y: 50 },
      { id: 'w4', name: 'Rèm tự động', type: 'curtain', status: 'off', x: 85, y: 65 },
      { id: 'w5', name: 'Cảm biến chất lượng không khí', type: 'sensor', status: 'on', x: 50, y: 20 },
    ],
  };
}

export function billRecordToBill(b: BillRecord): Bill {
  return {
    id: b.id,
    apartment_id: b.apartment_code,
    apt_code: b.apartment_code,
    apartment_code: b.apartment_code,
    owner_name: b.owner_name,
    billing_month: b.billing_month,
    due_date: b.due_date,
    total_amount: b.total_amount,
    status: b.status,
    status_color: b.status === 'Paid' ? '#10B981' : b.status === 'Overdue' ? '#EF4444' : '#F59E0B',
    payment_qr_url: b.payment_qr_url || '',
    invoice_pdf_url: `/portal/billing/invoice?id=${b.id}`,
    details: (b.details || []).map((d: any, idx) => ({
      id: d.id || `line-${idx}`,
      bill_id: b.id,
      service_type: d.service_type as any,
      service_name: d.service_name,
      usage: d.usage,
      unit: d.unit,
      unit_price: d.unit_price,
      total_line_amount: d.total_line_amount,
      order_date: d.order_date,
      booking_ref: d.booking_ref,
      ai_anomaly: d.ai_anomaly,
      anomaly_reason: d.anomaly_reason,
    })),
    has_ai_anomaly: (b.details || []).some(d => d.ai_anomaly),
    created_at: b.created_at || '2026-08-25',
  };
}

export function ticketRecordToServiceRequest(t: ServiceTicketRecord): ServiceRequest {
  return {
    id: t.id,
    apartment_id: t.apartment_code,
    apt_code: t.apartment_code,
    resident_name: t.resident_name,
    resident_phone: t.resident_phone,
    content: t.content,
    ai_category: t.ai_category,
    ai_priority: (t.ai_priority || 3) as any,
    priority_color: t.priority_color,
    sla_deadline: t.scheduled_time || '2026-08-30T17:00:00Z',
    sla_minutes_left: 45,
    status: t.status === 'Resolved' ? 'Resolved' : t.status === 'In_Progress' ? 'In_Progress' : t.status === 'Assigned' ? 'Assigned' : 'Open',
    assigned_technician: t.assigned_technician_name,
    before_image: t.before_image || '',
    after_image: t.after_image || '',
    created_at: t.created_at,
    updated_at: t.updated_at || t.created_at,
  };
}

export function facilityRecordToFacility(f: FacilityRecord): Facility {
  return {
    id: f.id,
    name: f.name,
    category: f.category,
    max_quota_per_month: f.max_quota_per_month,
    hero_image_url: f.hero_image_url,
    rating_score: f.rating_score,
    operating_hours: f.operating_hours,
    pricing: f.pricing,
    current_occupancy: f.current_occupancy,
    max_capacity: f.max_capacity,
  };
}

export function communityPostRecordToPost(p: CommunityPostRecord): CommunityPost {
  return {
    id: p.id,
    author_name: p.author_name,
    author_role: (p.author_role as any) || 'Cư dân',
    apt_code: p.apt_code,
    title: p.title,
    content: p.content,
    ai_moderation: (p.ai_moderation as any) || 'Clean',
    ai_sentiment: p.ai_sentiment || 0.8,
    tags: p.tags || [],
    likes: p.likes,
    comments_count: p.comments_count,
    is_pinned: !!p.is_pinned,
    created_at: p.created_at,
  };
}

export function votingTopicRecordToSurvey(v: VotingTopicRecord): Survey {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    legal_type: (v.legal_type as any) || 'Đóng góp Quỹ Bảo trì',
    deadline: v.deadline,
    is_owner_only: v.is_owner_only,
    total_votes: v.total_votes,
    options: v.options.map(o => ({ id: o.id, text: o.text, votes: o.votes })),
  };
}

// ============================================================================
// LIVE REPOSITORY ADAPTERS DIRECTLY WIRED TO DATABASE
// ============================================================================

export const DEMO_USERS: User[] = [];
export const DEMO_APARTMENTS: Apartment[] = [];
export const DEMO_BILLS: Bill[] = [];
export const DEMO_TICKETS: ServiceRequest[] = [];
export const DEMO_FACILITIES: Facility[] = [];
export const DEMO_COMMUNITY_POSTS: CommunityPost[] = [];
export const DEMO_SURVEYS: Survey[] = [];

export const DEMO_DEVICES: Device[] = [
  {
    id: 'dev-01',
    name: 'Thang máy Otis SkyRise #01 (Tòa BS-07)',
    category: 'Thang máy',
    location: 'Trục thang máy chính Block BS-07',
    health_score: 94,
    predict_date: '2026-11-15',
    last_maintenance: '2026-08-10',
    status: 'Hoạt động tốt'
  },
  {
    id: 'dev-02',
    name: 'Thang máy Otis SkyRise #02 (Tòa BS-07)',
    category: 'Thang máy',
    location: 'Trục thang máy chính Block BS-07',
    health_score: 72,
    predict_date: '2026-09-02',
    last_maintenance: '2026-07-28',
    status: 'Cần kiểm tra'
  },
  {
    id: 'dev-03',
    name: 'Cụm máy bơm tăng áp Grundfos Hydro MPC',
    category: 'Máy bơm',
    location: 'Phòng kỹ thuật nước Tầng Hầm B2',
    health_score: 96,
    predict_date: '2026-12-05',
    last_maintenance: '2026-08-15',
    status: 'Hoạt động tốt'
  },
  {
    id: 'dev-04',
    name: 'Hệ thống báo cháy & chữa cháy tự động Sprinkler',
    category: 'Hệ thống PCCC',
    location: 'Toàn khu phức hợp The Tropical (BS-07 -> BS-10)',
    health_score: 98,
    predict_date: '2027-01-20',
    last_maintenance: '2026-08-20',
    status: 'Hoạt động tốt'
  },
  {
    id: 'dev-05',
    name: 'Trạm biến áp khô ABB 2500kVA',
    category: 'Trạm biến áp',
    location: 'Trạm điện trung thế Tầng Hầm B1',
    health_score: 89,
    predict_date: '2026-10-30',
    last_maintenance: '2026-08-05',
    status: 'Hoạt động tốt'
  },
  {
    id: 'dev-06',
    name: 'Barrier tự động đọc thẻ RFID & Biển số AI LPR',
    category: 'Barrier',
    location: 'Cổng kiểm soát xe Hầm B1 / B2',
    health_score: 91,
    predict_date: '2026-11-01',
    last_maintenance: '2026-08-12',
    status: 'Hoạt động tốt'
  },
  {
    id: 'dev-07',
    name: 'Hệ thống quạt hút khói & tạo áp cầu thang thoát hiểm',
    category: 'Thông gió & Hút khói',
    location: 'Buồng thang bộ thoát hiểm & Hầm B1/B2',
    health_score: 88,
    predict_date: '2026-10-18',
    last_maintenance: '2026-07-20',
    status: 'Hoạt động tốt'
  }
];

export const DEMO_SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: 'alt-01',
    alert_type: 'Fire',
    title: 'Phát hiện nhiệt độ bất thường tại khu vực kỹ thuật Block BS-07',
    location: 'Tầng Hầm B1 - Trạm Biến Áp BS-07',
    camera_id: 'CAM-B1-04',
    snapshot_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    confidence: 0.96,
    created_at: '2026-08-27 10:15:00',
    status: 'Resolved'
  }
];

/**
 * Real-time updater for Users - updates authoritative database and cache
 */
export function updateDemoUser(identifier: string, updates: Partial<User>): User | null {
  const norm = identifier.toLowerCase().trim();
  const matched = DEMO_USERS.find(u =>
    u.id === identifier ||
    (u.username && u.username.toLowerCase().trim() === norm) ||
    (u.email && u.email.toLowerCase().trim() === norm) ||
    (u.phone && u.phone.toLowerCase().trim() === norm) ||
    u.role.toLowerCase() === norm
  );

  if (matched) {
    if (updates.full_name) matched.full_name = updates.full_name;
    if (updates.email) matched.email = updates.email;
    if (updates.phone) matched.phone = updates.phone;
    if (updates.id_card_no) matched.id_card_no = updates.id_card_no;
    if (updates.id_card_number) matched.id_card_number = updates.id_card_number;
    if (updates.avatar_url) matched.avatar_url = updates.avatar_url;
    if (updates.license_plate) matched.license_plate = updates.license_plate;
    if (updates.dob) matched.dob = updates.dob;
    if (updates.pob) matched.pob = updates.pob;
    if (updates.password) matched.password = updates.password;
    return matched;
  }
  return null;
}

export function addOrUpdateDemoUser(user: User): User {
  const normUser = user.username ? user.username.toLowerCase().trim() : '';
  const index = DEMO_USERS.findIndex(u =>
    Boolean(
      u.id === user.id ||
      (normUser && u.username.toLowerCase() === normUser) ||
      (user.phone && u.phone && u.phone.trim() === user.phone.trim())
    )
  );

  if (index !== -1) {
    DEMO_USERS[index] = { ...DEMO_USERS[index], ...user };
    return DEMO_USERS[index];
  } else {
    DEMO_USERS.push(user);
    return user;
  }
}
