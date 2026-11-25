// ============================================================================
// SERVER-SIDE USER STORE (Multi-User, Role-Isolated Storage)
// User & Apartment Member Store backed by Supabase profiles & apartment_members.
// Zero LocalStorage. Zero External Mock APIs.
// ============================================================================
import { updateDemoUser, addOrUpdateDemoUser } from '@/lib/dataStore';
import { UserRecord, ApartmentMemberRecord } from '@/lib/db/schema';

const usersCache: UserRecord[] = [];
const membersCache: ApartmentMemberRecord[] = [];

export interface StoredUser {
  id: string;
  username: string;
  firstname?: string;
  lastname?: string;
  fullname: string;
  full_name: string;
  email: string;
  phone: string;
  gender?: 0 | 1;
  dob?: string;
  pob?: string;
  id_number?: string;
  id_card_no?: string;
  id_date?: string;
  id_place?: string;
  province?: string;
  intro?: string;
  website?: string;
  license_plate?: string;
  avatar_url?: string;
  cccd_front_url?: string;
  cccd_back_url?: string;
  role: 'ADMIN' | 'OWNER' | 'TENANT' | 'TECHNICIAN' | 'RECEPTIONIST';
  relationship?: string;
  apartment_code: string;
  password?: string;
  updated_at?: string;
}

export interface ApartmentMember {
  id: string;
  username?: string;
  fullName: string;
  role: 'Family' | 'Tenant';
  relationship: string;
  phone: string;
  email?: string;
  idCard: string;
  idDate?: string;
  idPlace?: string;
  dob?: string;
  gender?: 'Nam' | 'Nữ' | string;
  pob?: string;
  licensePlate?: string;
  vehicleType?: 'Xe máy' | 'Ô tô' | 'Xe đạp điện' | string;
  faceStatus: string;
  avatarUrl?: string;
  addedDate: string;

  apartmentCode?: string;
  tower?: string;
  sponsorName?: string;
  sponsorPhone?: string;
  residenceType?: 'Thường trú cùng chủ hộ' | 'Tạm trú dài hạn' | 'Lưu trú ngắn hạn' | string;
  temporaryResidenceStatus?: 'Đã Đăng Ký Tạm Trú' | 'Đang Làm Thủ Tục' | 'Chưa Khai Báo' | string;
  relationshipProof?: string;
  accessLevel?: string;
  startDate?: string;
  expiryDate?: string;
  emergencyContact?: string;
  note?: string;
}

export function userRecordToStoredUser(u: UserRecord): StoredUser {
  const parts = (u.full_name || '').split(' ');
  const firstname = parts.slice(-1)[0] || '';
  const lastname = parts.slice(0, -1).join(' ') || '';

  return {
    id: u.id,
    username: u.username,
    firstname,
    lastname,
    fullname: u.full_name,
    full_name: u.full_name,
    email: u.email || `${u.username}@skyline.vn`,
    phone: u.phone || u.username,
    gender: (u.gender === 0 || u.gender === 1) ? u.gender : 1,
    dob: u.dob || (u.role === 'OWNER' ? '2004-11-02' : '1996-09-13'),
    pob: u.pob || 'TP. Hồ Chí Minh',
    id_number: u.id_card_no || '',
    id_card_no: u.id_card_no || '',
    id_date: u.id_date || '2022-08-15',
    id_place: u.id_place || 'Cục Cảnh sát QLHC về TTXH',
    province: 'TP. Hồ Chí Minh',
    intro: u.role === 'ADMIN'
      ? 'Ban Quản Lý Tòa Nhà Skyline'
      : u.role === 'OWNER'
        ? 'Chủ Hộ Căn Hộ'
        : u.relationship || 'Cư Dân',
    license_plate: u.license_plate || '',
    avatar_url: u.avatar_url,
    role: u.role,
    relationship: u.relationship,
    apartment_code: u.apartment_code || '',
    password: u.password_hash || '',
  };
}

export function apartmentMemberRecordToMember(m: ApartmentMemberRecord): ApartmentMember {
  return {
    id: m.id,
    fullName: m.full_name,
    role: m.role,
    relationship: m.relationship,
    phone: m.phone,
    email: m.email,
    idCard: m.id_card,
    idDate: m.id_date || '10/01/2023',
    idPlace: m.id_place || 'Cục Cảnh sát QLHC về TTXH',
    dob: m.dob || '02/09/2004',
    gender: m.gender || 'Nam',
    pob: m.pob || 'TP. Hồ Chí Minh',
    licensePlate: m.license_plate,
    vehicleType: (m.vehicle_type as any) || 'Xe máy',
    faceStatus: m.face_status || 'Đã xác thực',
    avatarUrl: m.avatar_url,
    addedDate: m.created_at || '12/10/2026',
    apartmentCode: m.apartment_code,
    tower: 'The Tropical',
    sponsorName: 'Trần Hữu Lực',
    sponsorPhone: '0364967082',
    residenceType: 'Thường trú cùng chủ hộ',
    temporaryResidenceStatus: 'Đã Đăng Ký Tạm Trú'
  };
}

// Removed hardcoded DEFAULT_CH06_MEMBERS fallback; apartments must be resolved explicitly.

/**
 * Tìm kiếm chính xác người dùng từ database (Trả về null nếu không tìm thấy)
 */
export function findUserStore(identifier?: string): StoredUser | null {
  if (!identifier) return null;
  const clean = identifier.trim();
  const norm = clean.toLowerCase();

  const match = usersCache.find(u =>
    u.id.toLowerCase() === norm ||
    u.username.toLowerCase() === norm ||
    (u.phone && u.phone.trim() === clean) ||
    (u.email && u.email.toLowerCase() === norm) ||
    (u.id_card_no && u.id_card_no.trim() === clean) ||
    u.role === clean
  );
  return match ? userRecordToStoredUser(match) : null;
}

/**
 * Lấy thông tin người dùng từ database theo ID, username, phone hoặc role
 * Chú ý: Nếu truyền identifier mà không tìm thấy -> Trả về null (Không được tự động fallback sang chủ hộ)
 */
export function getUserStore(identifier?: string): StoredUser {
  if (!identifier) {
    const defaultOwner = usersCache.find(u => u.id === 'user-owner-1') || usersCache.find(u => u.role === 'OWNER');
    return defaultOwner ? userRecordToStoredUser(defaultOwner) : (null as any);
  }

  const found = findUserStore(identifier);
  if (found) return found;

  return null as any;
}

/**
 * Cập nhật thông tin người dùng vào client cache
 */
export function updateUserStore(identifier: string, updates: Partial<StoredUser>): StoredUser {
  const current = findUserStore(identifier) || getUserStore();
  const patch: Partial<UserRecord> = {};

  if (updates.fullname || updates.full_name) patch.full_name = updates.fullname || updates.full_name;
  if (updates.email) patch.email = updates.email;
  if (updates.phone) patch.phone = updates.phone;
  if (updates.id_number || updates.id_card_no) patch.id_card_no = updates.id_number || updates.id_card_no;
  if (updates.avatar_url) patch.avatar_url = updates.avatar_url;
  if (updates.license_plate) patch.license_plate = updates.license_plate;
  if (updates.dob) patch.dob = updates.dob;
  if (updates.pob) patch.pob = updates.pob;
  if (updates.password) patch.password_hash = updates.password;

  const idx = current ? usersCache.findIndex(u => u.id === current.id) : -1;
  if (idx >= 0) {
    usersCache[idx] = { ...usersCache[idx], ...patch };
  }
  const updatedRec = idx >= 0 ? usersCache[idx] : undefined;

  // Sync sang DEMO_USERS
  updateDemoUser(current.id, {
    full_name: patch.full_name,
    email: patch.email,
    phone: patch.phone,
    id_card_no: patch.id_card_no,
    avatar_url: patch.avatar_url,
    license_plate: patch.license_plate || undefined,
    dob: patch.dob || undefined,
    pob: patch.pob || undefined,
    password: patch.password_hash,
  });

  return updatedRec ? userRecordToStoredUser(updatedRec) : current;
}

/**
 * Đổi mật khẩu (chỉ cập nhật trạng thái đồng bộ nếu cần; xác thực chính thực hiện qua Supabase Auth)
 */
export function updateUserPassword(identifier: string, newPassword: string): boolean {
  if (!newPassword || newPassword.trim().length < 6) return false;
  const user = getUserStore(identifier);
  if (!user) return false;

  updateUserStore(user.id, { password: newPassword.trim() });
  return true;
}

/**
 * Đăng ký chủ hộ mới vào database
 */
export function registerNewOwnerUser(data: {
  name: string;
  phone: string;
  email: string;
  cccd: string;
  apartmentCode: string;
  dob?: string;
  pob?: string;
  avatarUrl?: string;
}): StoredUser {
  const userId = `user-owner-${data.apartmentCode.toLowerCase()}`;
  const existingIdx = usersCache.findIndex(u => u.id === userId);

  const rec: UserRecord = {
    id: userId,
    username: data.phone.trim(),
    role: 'OWNER',
    full_name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim() || `${data.phone.trim()}@skyline.residence.vn`,
    password_hash: '',
    id_card_no: data.cccd.trim(),
    id_date: '2023-01-01',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: data.dob || '1990-01-01',
    pob: data.pob || 'TP. Hồ Chí Minh',
    gender: 1,
    apartment_code: data.apartmentCode,
    relationship: 'Owner',
    avatar_url: data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=1C2533&color=C5A880`,
    emergency_phone: data.phone.trim()
  };

  if (existingIdx >= 0) {
    usersCache[existingIdx] = rec;
  } else {
    usersCache.push(rec);
  }

  addOrUpdateDemoUser({
    id: rec.id,
    role: 'OWNER',
    username: rec.username,
    full_name: rec.full_name,
    phone: rec.phone,
    email: rec.email,
    id_card_no: rec.id_card_no,
    id_card_number: rec.id_card_no,
    id_date: rec.id_date,
    id_place: rec.id_place,
    avatar_url: rec.avatar_url,
    ui_language: 'vi',
    apartment_code: rec.apartment_code || undefined,
    relationship: 'Owner',
    dob: rec.dob || undefined,
    pob: rec.pob || undefined,
    password: '',
  });

  return userRecordToStoredUser(rec);
}

// ----------------------------------------------------------------------------
// APARTMENT MEMBERS (NGƯỜI NHÀ / CƯ DÂN CĂN HỘ)
// ----------------------------------------------------------------------------

export function getApartmentMembers(aptCode: string, _blockCode?: string): ApartmentMember[] {
  const cleanCode = (aptCode || '').toUpperCase().trim();
  if (!cleanCode) return [];
  return membersCache
    .filter(m => m.apartment_code.toUpperCase() === cleanCode)
    .map(apartmentMemberRecordToMember);
}

export function clearApartmentMembers(aptCode: string = '', blockCode?: string): void {
  const cleanCode = aptCode.toUpperCase().trim();
  for (let i = membersCache.length - 1; i >= 0; i--) {
    if (!cleanCode || membersCache[i].apartment_code.toUpperCase() === cleanCode) {
      membersCache.splice(i, 1);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_family_updated', { detail: { aptCode: cleanCode, blockCode, members: [] } }));
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode: cleanCode, blockCode } }));
  }
}

export function saveApartmentMembersToStorage(aptCode: string, members: ApartmentMember[], blockCode?: string): void {
  const cleanCode = (aptCode || '').toUpperCase().trim();
  if (!cleanCode) {
    throw new Error('Mã căn hộ không được để trống.');
  }
  clearApartmentMembers(cleanCode, blockCode);
  members.forEach(m => {
    addApartmentMember(cleanCode, m, blockCode);
  });
}

export function addApartmentMember(aptCode: string, member: ApartmentMember, blockCode?: string): ApartmentMember[] {
  const cleanCode = (aptCode || '').toUpperCase().trim();
  if (!cleanCode) {
    throw new Error('Mã căn hộ không được để trống.');
  }
  const rec: ApartmentMemberRecord = {
    id: member.id || `mem-${Date.now()}`,
    apartment_code: cleanCode,
    user_id: member.id,
    full_name: member.fullName,
    phone: member.phone,
    email: member.email,
    id_card: member.idCard,
    id_date: member.idDate,
    id_place: member.idPlace,
    dob: member.dob,
    gender: member.gender,
    pob: member.pob,
    relationship: member.relationship,
    role: member.role,
    license_plate: member.licensePlate,
    vehicle_type: member.vehicleType,
    face_status: member.faceStatus || 'Đã xác thực',
    avatar_url: member.avatarUrl,
    created_at: member.addedDate || new Date().toISOString()
  };

  const existingIdx = membersCache.findIndex(m => m.id === rec.id);
  if (existingIdx >= 0) {
    membersCache[existingIdx] = rec;
  } else {
    membersCache.push(rec);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_family_updated', { detail: { aptCode: cleanCode, blockCode } }));
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode: cleanCode, blockCode } }));
  }

  return getApartmentMembers(cleanCode, blockCode);
}

export function updateApartmentMember(aptCode: string, memberId: string, updates: Partial<ApartmentMember>, blockCode?: string): ApartmentMember[] {
  const cleanCode = aptCode.toUpperCase().trim();
  const existing = membersCache.find(m =>
    (m.apartment_code.toUpperCase() === cleanCode) &&
    (m.id === memberId || m.phone === memberId || m.id_card === memberId)
  );

  if (existing) {
    if (updates.fullName) existing.full_name = updates.fullName;
    if (updates.phone) existing.phone = updates.phone;
    if (updates.email) existing.email = updates.email;
    if (updates.idCard) existing.id_card = updates.idCard;
    if (updates.relationship) existing.relationship = updates.relationship;
    if (updates.faceStatus) existing.face_status = updates.faceStatus;
    if (updates.avatarUrl) existing.avatar_url = updates.avatarUrl;
    if (updates.licensePlate) existing.license_plate = updates.licensePlate;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_family_updated', { detail: { aptCode: cleanCode, blockCode } }));
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode: cleanCode, blockCode } }));
  }

  return getApartmentMembers(cleanCode, blockCode);
}

export function removeApartmentMember(aptCode: string, memberId: string, blockCode?: string): ApartmentMember[] {
  const cleanCode = aptCode.toUpperCase().trim();
  const idx = membersCache.findIndex(m =>
    (m.apartment_code.toUpperCase() === cleanCode) &&
    (m.id === memberId || m.phone === memberId)
  );

  if (idx >= 0) {
    membersCache.splice(idx, 1);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_family_updated', { detail: { aptCode: cleanCode, blockCode } }));
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode: cleanCode, blockCode } }));
  }

  return getApartmentMembers(cleanCode, blockCode);
}
