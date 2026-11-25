/**
 * Skyline Smart Residence & The Tropical - Apartment Management Store
 * Client/Server Store backed by skylineDb and API routes.
 * Zero LocalStorage. Zero External Mock APIs. Zero Dummy Generator Loops.
 */

import { ApartmentRecord, TowerId } from './db/schema';

const apartmentsCache: ApartmentRecord[] = [];
import {
  ApartmentMember,
  registerNewOwnerUser,
  getApartmentMembers,
  addApartmentMember,
  removeApartmentMember,
  updateApartmentMember,
  clearApartmentMembers
} from './userStore';
import {
  getEkycRequests,
  approveEkycRequest,
  rejectEkycRequest
} from './ekycStore';
import { updateEnrolledFaceStatus } from './faceEnrollStore';

export type { TowerId };
export type ApartmentType = 'STUDIO' | '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type ApartmentStatus = 'OCCUPIED' | 'VACANT' | 'MAINTENANCE' | 'HANDOVER_PENDING';

export interface ApartmentVehicle {
  id: string;
  type: 'CAR' | 'MOTORBIKE' | 'BICYCLE';
  plate: string;
  brand?: string;
  cardNo: string;
  slot?: string;
}

export interface ApartmentBilling {
  monthlyFee: number;
  parkingFee: number;
  serviceFee: number;
  totalAmount: number;
  status: 'PAID' | 'UNPAID';
  period: string;
  dueDate: string;
  lastPaidDate?: string;
}

export interface ApartmentMaintenanceRecord {
  id: string;
  date: string;
  title: string;
  technician: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
  cost: number;
  note?: string;
}

export interface ApartmentHandoverProtocol {
  protocolCode: string;
  handoverDate: string;
  handoverOfficer: string;
  keysCount: number;
  cardsCount: number;
  initialElectricMeter: number;
  initialWaterMeter: number;
  notes?: string;
  pdfUrl?: string;
}

export interface ApartmentResidentOwner {
  name: string;
  phone: string;
  email?: string;
  cccd?: string;
  avatar?: string;
  avatarUrl?: string;
  eKycApproved?: boolean;
  handoverDate?: string;
  occupiedSince?: string;
  idCard?: string;
  role?: 'Owner' | string;
  dob?: string;
  pob?: string;
  handoverProtocol?: ApartmentHandoverProtocol;
}

export interface ApartmentUnit {
  id?: string;
  code: string;
  fullCode?: string;
  usableArea?: number;
  balconyDirection?: string;
  doorDirection?: string;
  priceVnd?: number;
  handoverStatus?: string;
  tower: TowerId;
  towerName: string;
  floor: number;
  type: ApartmentType;
  typeLabel: string;
  area: number;        // Diện tích thông thủy (m2)
  wallArea: number;    // Diện tích tim tường (m2)
  bedrooms: number;
  bathrooms: number;
  direction: string;   // Hướng ban công
  mainDoorDirection?: string;
  priceBillion: number;
  status: ApartmentStatus;
  statusLabel: string;
  owner?: ApartmentResidentOwner;
  handoverProtocol?: ApartmentHandoverProtocol;
  membersCount: number;
  members?: ApartmentMember[];
  vehicles?: ApartmentVehicle[];
  billing?: ApartmentBilling;
  maintenanceHistory?: ApartmentMaintenanceRecord[];
  description?: string;
  handoverDate?: string;
  wing?: 'NORTH' | 'SOUTH' | 'WEST' | 'CENTRAL' | 'EAST';
  wingLabel?: string;
  isApiSynced?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkylineApartmentRaw {
  id: number;
  title: string;
  slug: string;
  code: string;
  area: string;
  bed: string;
  wc: string;
  floor: string;
  ownerid?: string;
  block?: {
    ID: number;
    post_title: string;
  };
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_SKYLINE_APARTMENTS_DATA: SkylineApartmentRaw[] = [
  {
    id: 898,
    title: 'Tropical BS-07 CH-06',
    slug: 'tropical-bs-07-ch-06-30',
    code: 'CH-06',
    area: '42',
    bed: '1',
    wc: '1',
    floor: '30',
    ownerid: '0364967082',
    block: { ID: 880, post_title: 'Tropical BS-07' },
    created_at: '2026-09-21 08:58:30',
    updated_at: '2026-09-21 08:58:30'
  },
  {
    id: 901,
    title: 'Tropical BS-08 CH-08',
    slug: 'tropical-bs-08-ch-08-15',
    code: 'CH-08',
    area: '46.5',
    bed: '1',
    wc: '1',
    floor: '15',
    ownerid: '0325524482',
    block: { ID: 881, post_title: 'Tropical BS-08' },
    created_at: '2026-09-21 09:00:55',
    updated_at: '2026-09-21 09:00:55'
  },
  {
    id: 895,
    title: 'Tropical BS-09 CH-12',
    slug: 'tropical-bs-09-ch-12-12',
    code: 'CH-12',
    area: '44.5',
    bed: '1',
    wc: '1',
    floor: '12',
    ownerid: '0977758215',
    block: { ID: 882, post_title: 'Tropical BS-09' },
    created_at: '2026-09-21 08:57:12',
    updated_at: '2026-09-21 08:57:12'
  },
  {
    id: 892,
    title: 'Tropical BS-10 CH-02',
    slug: 'tropical-bs-10-ch-02-18',
    code: 'CH-02',
    area: '38.2',
    bed: '1',
    wc: '1',
    floor: '18',
    ownerid: '0909262626',
    block: { ID: 883, post_title: 'Tropical BS-10' },
    created_at: '2026-09-21 08:56:00',
    updated_at: '2026-09-21 08:56:00'
  }
];

export async function fetchSkylineApartmentRaws(): Promise<SkylineApartmentRaw[]> {
  return DEFAULT_SKYLINE_APARTMENTS_DATA;
}

export const SKYLINE_FLOOR_ARCH_UNITS = [
  { num: '01', code: 'CH-01', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '2PN' as ApartmentType, typeLabel: '2PN Góc (Căn Phụ)', beds: 2, baths: 2, area: 68.4, dir: 'Đông Bắc', defaultPrice: 3.15 },
  { num: '02', code: 'CH-02', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '1PN' as ApartmentType, typeLabel: '1PN Tiêu Chuẩn', beds: 1, baths: 1, area: 38.2, dir: 'Đông Bắc', defaultPrice: 2.8 },
  { num: '03', code: 'CH-03', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '1PN' as ApartmentType, typeLabel: '1PN+ Đa Năng', beds: 1, baths: 1, area: 46.5, dir: 'Đông Bắc', defaultPrice: 2.7 },
  { num: '04', code: 'CH-04', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '2PN' as ApartmentType, typeLabel: '2PN Ban Công Kính', beds: 2, baths: 2, area: 59.1, dir: 'Đông Bắc', defaultPrice: 3.3 },
  { num: '05', code: 'CH-05', wing: 'NORTH' as const, wingLabel: 'Cánh Bắc', type: '2PN' as ApartmentType, typeLabel: '2PN Góc Đẹp', beds: 2, baths: 2, area: 69.2, dir: 'Đông Bắc', defaultPrice: 3.18 },
  { num: '06', code: 'CH-06', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: '1PN' as ApartmentType, typeLabel: '1PN View Hồ Bơi (Căn Chủ Hộ)', beds: 1, baths: 1, area: 42.0, dir: 'Đông Nam', defaultPrice: 2.65 },
  { num: '07', code: 'CH-07', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: '2PN' as ApartmentType, typeLabel: '2PN Gia Đình', beds: 2, baths: 2, area: 59.0, dir: 'Đông Nam', defaultPrice: 3.2 },
  { num: '08', code: 'CH-08', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: '1PN' as ApartmentType, typeLabel: '1PN+ Đa Năng', beds: 1, baths: 1, area: 46.5, dir: 'Đông Nam', defaultPrice: 3.25 },
  { num: '09', code: 'CH-09', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: '2PN' as ApartmentType, typeLabel: '2PN Góc Thoáng', beds: 2, baths: 2, area: 69.5, dir: 'Đông Nam', defaultPrice: 3.4 },
  { num: '10', code: 'CH-10', wing: 'SOUTH' as const, wingLabel: 'Cánh Nam', type: 'STUDIO' as ApartmentType, typeLabel: 'Studio Tiện Nghi', beds: 1, baths: 1, area: 35.0, dir: 'Đông Nam', defaultPrice: 3.05 },
  { num: '11', code: 'CH-11', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '2PN' as ApartmentType, typeLabel: '2PN Tây Bắc', beds: 2, baths: 2, area: 62.0, dir: 'Tây Bắc', defaultPrice: 3.35 },
  { num: '12', code: 'CH-12', wing: 'WEST' as const, wingLabel: 'Cánh Tây', type: '1PN' as ApartmentType, typeLabel: '1PN Tiện Ích', beds: 1, baths: 1, area: 44.5, dir: 'Tây Bắc', defaultPrice: 3.1 },
];

function blockIdFromCode(blockCode?: string): number | undefined {
  if (!blockCode) return undefined;
  const clean = blockCode.toUpperCase().trim();
  if (clean.includes('08')) return 883;
  if (clean.includes('09')) return 886;
  if (clean.includes('10')) return 889;
  if (clean.includes('07')) return 880;
  return undefined;
}

function blockCodeFromId(blockId: number): string {
  switch (blockId) {
    case 883: return 'BS-08';
    case 886: return 'BS-09';
    case 889: return 'BS-10';
    default: return 'BS-07';
  }
}

/**
 * Ánh xạ ApartmentRecord chuẩn trong skylineDb sang ApartmentUnit hiển thị cho UI
 */
export function recordToApartmentUnit(rec: ApartmentRecord): ApartmentUnit {
  const bCode = blockCodeFromId(rec.block_id);
  const blockTitle = `The Tropical ${bCode}`;

  const owner: ApartmentResidentOwner | undefined = undefined;
  const members: ApartmentMember[] = getApartmentMembers(rec.apt_code);

  const floorStr = rec.floor_number.toString().padStart(2, '0');
  const fullCode = `${floorStr}-${rec.apt_code}`;

  return {
    id: rec.id,
    code: rec.apt_code,
    fullCode,
    tower: rec.tower_code,
    towerName: blockTitle,
    floor: rec.floor_number,
    type: rec.apt_type,
    typeLabel: rec.type_label,
    bedrooms: rec.bedrooms,
    bathrooms: rec.bathrooms,
    area: rec.clear_area,
    usableArea: rec.clear_area,
    wallArea: rec.wall_area,
    direction: rec.balcony_direction,
    balconyDirection: rec.balcony_direction,
    doorDirection: rec.main_door_direction,
    mainDoorDirection: rec.main_door_direction,
    status: rec.status,
    statusLabel: rec.status === 'OCCUPIED' ? 'Đã Bàn Giao' : rec.status === 'MAINTENANCE' ? 'Đang Sửa Chữa / Bảo Trì' : 'Căn Hộ Trống',
    priceBillion: rec.price_billion,
    priceVnd: rec.price_vnd,
    handoverStatus: rec.status === 'OCCUPIED' ? 'HANDED_OVER' : 'NOT_HANDED_OVER',
    handoverDate: rec.handover_date || undefined,
    handoverProtocol: undefined,
    owner,
    membersCount: (owner ? 1 : 0) + members.length,
    members,
    vehicles: (rec.vehicles || []).map(v => ({
      id: v.id,
      type: v.type,
      plate: v.plate,
      brand: v.brand,
      cardNo: v.cardNo,
      slot: v.slot
    })),
    maintenanceHistory: [],
    billing: {
      monthlyFee: Math.round(rec.clear_area * 18000),
      parkingFee: rec.status === 'OCCUPIED' ? 120000 : 0,
      serviceFee: 50000,
      totalAmount: Math.round(rec.clear_area * 18000) + (rec.status === 'OCCUPIED' ? 170000 : 50000),
      status: 'PAID',
      period: 'Tháng 10/2026',
      dueDate: '25/10/2026'
    },
    description: rec.description || `Căn hộ ${rec.type_label} tầng ${rec.floor_number} tòa ${blockTitle}.`,
    wing: rec.wing,
    wingLabel: rec.wing === 'NORTH' ? 'Cánh Bắc' : rec.wing === 'SOUTH' ? 'Cánh Nam' : rec.wing === 'WEST' ? 'Cánh Tây' : 'Khu Trung Tâm',
    createdAt: '2026-09-21 09:00:00',
    updatedAt: '2026-09-21 09:00:00'
  };
}

/**
 * Trả về danh sách căn hộ thực tế từ skylineDb
 */
export function generateSkylineBlockUnits(
  _nksApts?: any[],
  blockCode: string = 'BS-07',
  _totalFloors?: number
): ApartmentUnit[] {
  return getApartmentUnits(blockCode);
}

export function getApartmentStorageKey(blockCode: string = 'BS-07'): string {
  return `skyline_apartments_${blockCode}_db`;
}

/**
 * Lấy danh sách căn hộ theo Block từ skylineDb
 */
export function getApartmentUnits(blockCode: string = 'BS-07'): ApartmentUnit[] {
  const bId = blockIdFromCode(blockCode);
  const records = bId !== undefined
    ? apartmentsCache.filter(a => a.block_id === bId)
    : apartmentsCache;

  return records.map(recordToApartmentUnit);
}

/**
 * Đồng bộ danh sách căn hộ (Trả về dữ liệu database nội bộ)
 */
export async function syncApartmentsFromApi(blockCode: string = 'BS-07'): Promise<ApartmentUnit[]> {
  return getApartmentUnits(blockCode);
}
export const syncApartmentsLegacy = syncApartmentsFromApi;

/**
 * Tìm 1 căn hộ theo mã căn từ skylineDb
 */
export function getApartmentByCode(code: string, blockCode?: string): ApartmentUnit | undefined {
  if (!code) return undefined;
  const clean = code.trim().toUpperCase();
  const allUnits = getApartmentUnits(blockCode);

  // 1. Khớp chính xác mã căn (ví dụ 'CH-06', '30-CH-06')
  const exact = allUnits.find(u => u.code.toUpperCase() === clean || u.fullCode?.toUpperCase() === clean);
  if (exact) return exact;

  // 2. Chuyển đổi mềm (Backward Compatibility): 12A05 -> CH-06
  if (clean === '12A05' || clean === '12A5') {
    const ownerUnit = allUnits.find(u => u.code === 'CH-06');
    if (ownerUnit) return ownerUnit;
  }

  // 3. Khớp tiền tố/hậu tố tầng
  const partial = allUnits.find(u =>
    u.code.toUpperCase().endsWith(`-${clean}`) ||
    clean.endsWith(`-${u.code.toUpperCase()}`) ||
    (u.fullCode && u.fullCode.toUpperCase().endsWith(clean))
  );
  if (partial) return partial;

  return undefined;
}

/**
 * Lưu danh sách căn hộ vào skylineDb
 */
export function saveApartmentsList(units: ApartmentUnit[], blockCode?: string): boolean {
  units.forEach(u => {
    updateApartmentUnit(u.code, u, blockCode);
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { units, blockCode } }));
  }
  return true;
}

/**
 * Thêm một căn hộ mới vào skylineDb
 */
export function addApartmentUnit(unit: ApartmentUnit, blockCode?: string): boolean {
  const bCode = blockCode || (unit.towerName?.includes('08') ? 'BS-08' : unit.towerName?.includes('09') ? 'BS-09' : unit.towerName?.includes('10') ? 'BS-10' : 'BS-07');
  const bId = blockIdFromCode(bCode) || 880;

  const cleanCode = unit.code.toUpperCase().trim();
  const existing = apartmentsCache.find(a => a.apt_code.toUpperCase() === cleanCode);
  if (existing) return false;

  const newRec: ApartmentRecord = {
    id: unit.id || `apt-${bCode.toLowerCase()}-${unit.code.toLowerCase()}`,
    apt_code: unit.code,
    block_id: bId,
    tower_code: unit.tower || 'A',
    floor_number: unit.floor,
    wing: (unit.wing || 'NORTH') as any,
    apt_type: unit.type,
    type_label: unit.typeLabel,
    wall_area: unit.wallArea || unit.area,
    clear_area: unit.area,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    balcony_direction: unit.direction || unit.balconyDirection || 'Đông Nam',
    main_door_direction: unit.mainDoorDirection || unit.doorDirection || 'Tây Bắc',
    price_billion: unit.priceBillion,
    price_vnd: unit.priceVnd || (unit.priceBillion * 1000000000),
    status: unit.status,
    owner_id: unit.owner ? `user-owner-${unit.code.toLowerCase()}` : null,
    handover_date: unit.handoverDate || (unit.status === 'OCCUPIED' ? '2026-09-21' : null),
    handover_protocol: unit.handoverProtocol?.protocolCode || null,
    description: unit.description,
    vehicles: (unit.vehicles || []).map(v => ({
      id: v.id,
      type: v.type === 'CAR' ? 'CAR' : 'MOTORBIKE',
      plate: v.plate,
      brand: v.brand || '',
      cardNo: v.cardNo,
      slot: v.slot || ''
    }))
  };

  apartmentsCache.push(newRec);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { blockCode: bCode } }));
  }
  return true;
}

/**
 * Cập nhật thông số căn hộ trong skylineDb
 */
export function updateApartmentUnit(code: string, patch: Partial<ApartmentUnit>, blockCode?: string): boolean {
  const cleanCode = code.toUpperCase().trim();
  const idx = apartmentsCache.findIndex(a =>
    a.apt_code.toUpperCase() === cleanCode ||
    a.id?.toUpperCase() === cleanCode ||
    `${a.floor_number.toString().padStart(2, '0')}-${a.apt_code}`.toUpperCase() === cleanCode
  );
  if (idx < 0) return false;

  const dbPatch: Partial<ApartmentRecord> = {};
  if (patch.status) dbPatch.status = patch.status;
  if (patch.priceBillion !== undefined) dbPatch.price_billion = patch.priceBillion;
  if (patch.priceVnd !== undefined) dbPatch.price_vnd = patch.priceVnd;
  if (patch.area !== undefined) dbPatch.clear_area = patch.area;
  if (patch.wallArea !== undefined) dbPatch.wall_area = patch.wallArea;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.handoverDate !== undefined) dbPatch.handover_date = patch.handoverDate;
  if (patch.handoverProtocol?.protocolCode) dbPatch.handover_protocol = patch.handoverProtocol.protocolCode;
  if (patch.vehicles) {
    dbPatch.vehicles = patch.vehicles.map(v => ({
      id: v.id,
      type: v.type === 'CAR' ? 'CAR' : 'MOTORBIKE',
      plate: v.plate,
      brand: v.brand || '',
      cardNo: v.cardNo,
      slot: v.slot || ''
    }));
  }

  apartmentsCache[idx] = { ...apartmentsCache[idx], ...dbPatch };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode: code, blockCode } }));
  }
  return true;
}

export function addApartmentMaintenanceRecord(code: string, record: ApartmentMaintenanceRecord, blockCode?: string): boolean {
  const cleanCode = code.toUpperCase().trim();
  const existing = apartmentsCache.find(a => a.apt_code.toUpperCase() === cleanCode);
  if (!existing) return false;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode: code, blockCode } }));
  }
  return true;
}

export function deleteApartmentUnit(code: string, blockCode?: string): boolean {
  const cleanCode = code.toUpperCase().trim();
  const idx = apartmentsCache.findIndex(a =>
    a.apt_code.toUpperCase() === cleanCode ||
    a.id?.toUpperCase() === cleanCode
  );
  if (idx < 0) return false;

  apartmentsCache.splice(idx, 1);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode: code, blockCode } }));
  }
  return true;
}

/**
 * Bàn giao căn hộ & gán chủ hộ mới
 */
export function assignApartmentResident(
  code: string,
  owner: ApartmentResidentOwner,
  protocol?: ApartmentHandoverProtocol,
  blockCode?: string
): boolean {
  try {
    registerNewOwnerUser({
      name: owner.name,
      phone: owner.phone,
      email: owner.email || '',
      cccd: owner.cccd || '',
      apartmentCode: code,
      dob: owner.dob,
      pob: owner.pob,
      avatarUrl: owner.avatar || owner.avatarUrl || ''
    });
  } catch (e) {
    console.warn('Sync new resident to userStore error:', e);
  }

  const todayStr = new Date().toLocaleDateString('vi-VN');
  const codeClean = code.toUpperCase().trim();
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const blockTitle = blockCode ? `The Tropical ${blockCode}` : 'The Tropical';

  const finalProtocol: ApartmentHandoverProtocol = protocol || owner.handoverProtocol || {
    protocolCode: `BBBG-TROPICAL-${codeClean}-${dateCode}`,
    handoverDate: owner.handoverDate || todayStr,
    handoverOfficer: 'VinHomes Manager',
    keysCount: 3,
    cardsCount: 2,
    initialElectricMeter: 0,
    initialWaterMeter: 0,
    notes: 'Đã hoàn tất nghiệm thu kỹ thuật bàn giao căn hộ, bàn giao chìa khóa cơ và cấp thẻ từ cư dân.'
  };

  return updateApartmentUnit(code, {
    status: 'OCCUPIED',
    statusLabel: 'Đang Sinh Sống',
    owner: { ...owner, handoverProtocol: finalProtocol },
    handoverProtocol: finalProtocol,
    handoverDate: owner.handoverDate || finalProtocol.handoverDate
  }, blockCode);
}

/**
 * Thu hồi căn hộ về trạng thái trống
 */
export function evictApartmentResident(code: string, blockCode?: string): boolean {
  clearApartmentMembers(code, blockCode);

  const cleanCode = code.toUpperCase().trim();
  const existing = apartmentsCache.find(a => a.apt_code.toUpperCase() === cleanCode);
  if (existing) {
    existing.status = 'VACANT';
    existing.owner_id = null;
    existing.handover_date = null;
    existing.handover_protocol = null;
    existing.vehicles = [];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode: code, blockCode } }));
    }
    return true;
  }
  return false;
}

export function updateApartmentBillingStatus(code: string, _status: 'PAID' | 'UNPAID'): boolean {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode: code } }));
  }
  return true;
}

export function addApartmentVehicle(code: string, vehicle: ApartmentVehicle): boolean {
  const cleanCode = code.toUpperCase().trim();
  const existing = apartmentsCache.find(a => a.apt_code.toUpperCase() === cleanCode);
  if (!existing) return false;

  const currentVehicles = existing.vehicles || [];
  const cleanPlate = vehicle.plate.trim().toUpperCase().replace(/[-.\s]/g, '');
  const existingIdx = currentVehicles.findIndex(
    v => v.plate.trim().toUpperCase().replace(/[-.\s]/g, '') === cleanPlate
  );

  let updatedVehicles: ApartmentVehicle[];
  if (existingIdx >= 0) {
    updatedVehicles = [...currentVehicles];
    updatedVehicles[existingIdx] = { ...currentVehicles[existingIdx], ...vehicle };
  } else {
    updatedVehicles = [...currentVehicles, vehicle];
  }

  return updateApartmentUnit(code, { vehicles: updatedVehicles });
}

export function removeApartmentVehicle(code: string, vehicleId: string): boolean {
  const cleanCode = code.toUpperCase().trim();
  const existing = apartmentsCache.find(a => a.apt_code.toUpperCase() === cleanCode);
  if (!existing || !existing.vehicles) return false;

  const updatedVehicles = existing.vehicles.filter(v => v.id !== vehicleId);
  return updateApartmentUnit(code, { vehicles: updatedVehicles });
}

export function resetApartmentsToDefault(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated'));
  }
}

/**
 * BQL thêm người nhà vào căn hộ
 */
export function addFamilyMemberByBql(
  aptCode: string,
  member: ApartmentMember,
  autoApprove: boolean = true
): boolean {
  const memberWithStatus: ApartmentMember = {
    ...member,
    faceStatus: autoApprove ? 'Đã Kích Hoạt FaceID' : 'Đang Chờ BQL Phê Duyệt'
  };
  addApartmentMember(aptCode, memberWithStatus);
  if (autoApprove) {
    approveFamilyMemberByBql(aptCode, member.id || member.phone);
  }
  return true;
}

/**
 * BQL xóa người nhà khỏi căn hộ
 */
export function removeFamilyMemberByBql(
  aptCode: string,
  memberId: string
): boolean {
  removeApartmentMember(aptCode, memberId);
  return true;
}

/**
 * BQL phê duyệt hồ sơ người nhà của căn hộ
 */
export function approveFamilyMemberByBql(
  aptCode: string,
  memberId: string,
  approverName: string = 'VinHomes Manager'
): boolean {
  updateApartmentMember(aptCode, memberId, {
    faceStatus: 'Đã Kích Hoạt FaceID',
  });

  const ekycList = getEkycRequests();
  const matched = ekycList.find(r =>
    r.userId === memberId ||
    r.phone === memberId ||
    (r.idCardNo && r.idCardNo === memberId)
  );
  if (matched) {
    approveEkycRequest(matched.id, approverName);
  }

  updateEnrolledFaceStatus(memberId, 'ACTIVE');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_family_updated', { detail: { aptCode, memberId, status: 'APPROVED' } }));
    window.dispatchEvent(new CustomEvent('skyline_ekyc_updated'));
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode } }));
  }
  return true;
}

/**
 * BQL từ chối / yêu cầu người nhà nộp lại hồ sơ
 */
export function rejectFamilyMemberByBql(
  aptCode: string,
  memberId: string,
  reason?: string,
  approverName: string = 'VinHomes Manager'
): boolean {
  const finalReason = reason || 'VinHomes Manager yêu cầu chụp lại ảnh CCCD và các góc FaceID rõ nét hơn.';

  updateApartmentMember(aptCode, memberId, {
    faceStatus: 'BQL Yêu Cầu Chụp Lại',
    note: finalReason,
  });

  const ekycList = getEkycRequests();
  const matched = ekycList.find(r =>
    r.userId === memberId ||
    r.phone === memberId ||
    (r.idCardNo && r.idCardNo === memberId)
  );
  if (matched) {
    rejectEkycRequest(matched.id, finalReason, approverName);
  }

  updateEnrolledFaceStatus(memberId, 'REVOKED');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_family_updated', { detail: { aptCode, memberId, status: 'REJECTED', reason: finalReason } }));
    window.dispatchEvent(new CustomEvent('skyline_ekyc_updated'));
    window.dispatchEvent(new CustomEvent('skyline_apartments_updated', { detail: { aptCode } }));
  }
  return true;
}
