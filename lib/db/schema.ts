// ============================================================================
// SKYLINE SMART RESIDENCE - DATABASE TYPES & SCHEMA DEFINITIONS
// 100% Aligned with PostgreSQL / Supabase Schema (skyline_smart_residence_schema.sql)
// Pure Database Architecture - Zero LocalStorage - Zero External Mock APIs
// ============================================================================

export type TowerId = 'BS-07' | 'BS-08' | 'BS-09' | 'BS-10' | 'A' | 'B';
export type ApartmentType = 'STUDIO' | '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type ApartmentStatus = 'OCCUPIED' | 'VACANT' | 'MAINTENANCE' | 'HANDOVER_PENDING';
export type UserRole = 'ADMIN' | 'OWNER' | 'TENANT' | 'TECHNICIAN' | 'RECEPTIONIST';
export type TicketType = 'REPAIR' | 'INQUIRY' | 'FEEDBACK' | 'SERVICE';
export type TicketStatus = 'Open' | 'Assigned' | 'In_Progress' | 'Resolved';
export type TicketHandler = 'AI' | 'MANAGEMENT' | 'TECHNICIAN';

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

export interface CondominiumRecord {
  id: number;
  condo_code: string;
  condo_name: string;
  address: string;
  total_floors: number;
  basement_floors: number;
  total_apartments: number;
  investor: string;
  management_company: string;
  hotline: string;
  handover_year: number;
  description: string;
}

export interface BlockRecord {
  id: number;
  condo_id: number;
  block_code: string; // BS-07, BS-08, BS-09, BS-10
  block_name: string;
  total_floors: number;
  manager_name: string;
  manager_phone: string;
}

export interface FloorRecord {
  floor_number: number;
  floor_code: string;
  floor_name: string;
  floor_type: 'BASEMENT' | 'COMMERCIAL_AMENITY' | 'RESIDENTIAL' | 'ROOFTOP_AMENITY';
  floor_function: string;
  units_count: number;
  condo_id: number;
}

export interface ApartmentRecord {
  id: string;
  apt_code: string;
  block_id: number; // 880, 883, 886, 889
  tower_code: TowerId;
  floor_number: number;
  wing: 'NORTH' | 'SOUTH' | 'WEST' | 'CENTRAL' | 'EAST';
  apt_type: ApartmentType;
  type_label: string;
  wall_area: number;
  clear_area: number;
  bedrooms: number;
  bathrooms: number;
  balcony_direction: string;
  main_door_direction: string;
  price_billion: number;
  price_vnd: number;
  status: ApartmentStatus;
  owner_id?: string | null;
  handover_date?: string | null;
  handover_protocol?: string | null;
  description?: string;
  vehicles?: Array<{
    id: string;
    type: 'CAR' | 'MOTORBIKE';
    plate: string;
    brand: string;
    cardNo: string;
    slot: string;
  }>;
}

export interface UserRecord {
  id: string;
  username: string;
  role: UserRole;
  full_name: string;
  phone: string;
  email: string;
  password_hash: string;
  id_card_no: string;
  id_date?: string;
  id_place?: string;
  dob?: string;
  pob?: string;
  gender: number; // 1: Nam, 0: Nữ
  apartment_code?: string | null;
  relationship?: 'Owner' | 'Family' | 'Tenant' | 'Staff';
  license_plate?: string | null;
  avatar_url?: string;
  face_vector?: string | null;
  emergency_phone?: string;
}

export interface ApartmentMemberRecord {
  id: string;
  apartment_code: string;
  user_id?: string | null;
  full_name: string;
  phone: string;
  email?: string;
  id_card: string;
  id_date?: string;
  id_place?: string;
  dob?: string;
  gender?: 'Nam' | 'Nữ' | string;
  pob?: string;
  relationship: string;
  role: 'Family' | 'Tenant';
  license_plate?: string;
  vehicle_type?: string;
  face_status: string;
  avatar_url?: string;
  created_at?: string;
}

export interface TechnicianRecord {
  id: string; // KTV-01, KTV-02, KTV-03
  user_id?: string | null;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  base_salary: number;
  pay_per_ticket: number;
  bonus_per_fivestar: number;
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
}

export interface ServiceTicketRecord {
  id: string;
  apartment_code: string;
  resident_name: string;
  resident_phone: string;
  content: string;
  ai_category: string;
  ai_priority: 1 | 2 | 3;
  priority_color: string;
  sla_deadline?: string;
  status: TicketStatus;
  ticket_type: TicketType;
  ticket_type_label?: string;
  handled_by: TicketHandler;
  ai_reply?: string;
  ai_replied_at?: string;
  admin_reply?: string;
  admin_replied_at?: string;
  admin_replied_by?: string;
  assigned_technician_id?: string;
  assigned_technician_name?: string;
  assigned_technician_phone?: string;
  scheduled_time?: string;
  auto_dispatched?: boolean;
  ai_dispatch_reason?: string;
  rating?: number;
  resident_feedback?: string;
  rated_at?: string;
  before_image?: string;
  after_image?: string;
  created_at: string;
  resolved_at?: string;
  updated_at?: string;
}

export interface BillRecord {
  id: string;
  apartment_code: string;
  owner_name: string;
  billing_month: string;
  due_date: string;
  total_amount: number;
  status: 'Draft' | 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  payment_method?: 'VNPAY' | 'MOMO' | 'VIETQR' | 'BANK_TRANSFER' | null;
  transaction_ref?: string | null;
  payment_qr_url?: string;
  invoice_pdf_url?: string;
  has_ai_anomaly: boolean;
  created_at?: string;
  paid_at?: string | null;
  details: Array<{
    id: string;
    bill_id?: string;
    service_type: BillServiceType | string;
    service_name: string;
    usage?: number;
    unit?: string;
    unit_price?: number;
    total_line_amount: number;
    ai_anomaly?: boolean;
    anomaly_reason?: string;
  }>;
}

export interface MeterReadingRecord {
  id: string;
  apartment_code: string;
  meter_type: 'ELECTRIC' | 'WATER';
  reading: number;
  previous_reading?: number;
  consumption?: number;
  period: string;
  image_url?: string;
  confidence: number;
  source?: 'manual' | 'ocr';
  verified_by?: string;
  recorded_at: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
}

export interface SmartDeviceRecord {
  id: string;
  apartment_code: string;
  name: string;
  device_type: 'door' | 'light' | 'ac' | 'curtain' | 'sensor';
  status: 'on' | 'off' | 'locked' | 'unlocked' | 'active' | 'open' | 'closed' | number;
  set_value: number;
  location_x: number;
  location_y: number;
}

export interface SmartAutomationRuleRecord {
  id: string;
  apartment_code: string;
  title: string;
  trigger_time: string;
  trigger_type: 'TIME' | 'SENSOR' | 'CLIMATE';
  trigger_label: string;
  description: string;
  action_summary: string;
  enabled: boolean;
  repeat_days: string;
  icon: string;
}

export interface SmartGuestPinRecord {
  id: string;
  apartment_code: string;
  pin_code: string;
  label: string;
  created_by: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  max_uses: number;
  used_count: number;
  expires_at: string;
}

export interface SmartDoorAccessLogRecord {
  id: string;
  apartment_code: string;
  user_name: string;
  role: string;
  method: 'FACE_ID' | 'NFC_CARD' | 'PIN_OTP' | 'REMOTE_APP' | 'PHYSICAL_KEY' | 'AUTO_LOCK';
  status: 'SUCCESS' | 'DENIED';
  detail: string;
  timestamp: string;
}

export interface FacilityRecord {
  id: string;
  name: string;
  category: string;
  floor_number: number;
  location_detail: string;
  operating_hours: string;
  pricing: string;
  max_quota_per_month: number;
  rating_score: number;
  current_occupancy: number;
  max_capacity: number;
  hero_image_url: string;
}

export interface FacilityBookingRecord {
  id: string;
  apartment_code: string;
  facility_id: string;
  booker_id: string;
  booker_name: string;
  ticket_code: string;
  booking_date: string;
  time_slot: string;
  guest_count: number;
  duration_hours: number;
  deposit_amount: number;
  pricing: string;
  payment_method: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  notes?: string;
  created_at: string;
}

export interface ResidentServiceBookingRecord {
  id: string;
  bookingCode: string;
  aptCode: string;
  serviceId: string;
  serviceName: string;
  category: string;
  residentName: string;
  residentPhone: string;
  scheduledTime: string;
  notes?: string;
  totalPrice: number;
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedStaff?: string;
  staffPhone?: string;
  createdAt: string;
}

export interface VisitorPassRecord {
  id: string;
  apartment_code: string;
  host_user_id?: string;
  host_name: string;
  host_phone?: string;
  tower_name?: string;
  visitor_name: string;
  visitor_phone?: string;
  phone_number?: string;
  license_plate?: string;
  entry_type: 'SINGLE' | 'MULTI';
  purpose?: string;
  purpose_label: string;
  valid_hours: number;
  qr_data: string;
  pin_code: string;
  status: 'ACTIVE' | 'CHECKED_IN' | 'COMPLETED' | 'EXPIRED';
  note?: string;
  valid_until: string;
  checked_in_at?: string;
  checked_out_at?: string;
  created_at?: string;
}

export interface VisitorGateLogRecord {
  id: string;
  pass_id?: string;
  apartment_code: string;
  host_name?: string;
  visitor_name?: string;
  license_plate?: string;
  action: 'CHECK_IN' | 'CHECK_OUT' | 'SCAN';
  result: 'VALID' | 'INVALID' | 'DENIED' | 'EXPIRED';
  checkpoint?: string;
  note?: string;
  notes?: string;
  timestamp?: string;
  created_at?: string;
}

export interface CommunityPostRecord {
  id: string;
  author_id?: string;
  author_name: string;
  author_role: string;
  apt_code?: string;
  avatar_url?: string;
  title: string;
  content: string;
  category: string;
  ai_moderation: 'Clean' | 'Toxic' | 'Pending' | 'Warning';
  ai_sentiment: number;
  tags?: string[];
  likes: number;
  comments_count: number;
  is_pinned?: boolean;
  created_at: string;
}

export interface VotingTopicRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  legal_type: string;
  created_by: string;
  deadline: string;
  status: 'OPEN' | 'CLOSED';
  is_owner_only: boolean;
  total_eligible_apartments: number;
  total_votes: number;
  summary_report?: string;
  created_at: string;
  options: Array<{ id: string; text: string; votes: number }>;
}

export interface VotingRecordItem {
  id: string;
  topic_id: string;
  user_id?: string;
  apartment_code: string;
  option_id: string;
  voted_at: string;
}

export interface FaceEnrollmentRecord {
  userId: string;
  phone?: string;
  fullName: string;
  apartmentCode?: string;
  avatarUrl?: string;
  descriptor: number[];
  faceScore?: number;
  status: 'ACTIVE' | 'APPROVED' | 'PENDING' | 'PENDING_OWNER' | 'REVOKED';
  enrolledAt: string;
  samples?: any;
  metadata?: any;
}

export interface EkycSubmissionRecord {
  id: string;
  userId: string;
  fullName: string;
  roleLabel: string;
  apartmentCode: string;
  phone: string;
  email?: string;
  idCardNo: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  pob?: string;
  faceScore: number;
  avatarUrl: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  faceSamples?: any;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED' | 'PENDING_OWNER';
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  isSimulation?: boolean;
  algorithm?: string;
}
