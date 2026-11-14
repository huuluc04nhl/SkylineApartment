// ============================================================================
// SKYLINE SMART RESIDENCE - UNIFIED DATABASE REPOSITORY
// Pure In-Database Architecture. Zero LocalStorage. Zero External Mock APIs.
// Single Source of Truth for all Portal & Backend APIs
// ============================================================================

import {
  CondominiumRecord,
  BlockRecord,
  FloorRecord,
  ApartmentRecord,
  UserRecord,
  ApartmentMemberRecord,
  TechnicianRecord,
  ServiceTicketRecord,
  BillRecord,
  SmartDeviceRecord,
  SmartAutomationRuleRecord,
  SmartGuestPinRecord,
  SmartDoorAccessLogRecord,
  FacilityRecord,
  FacilityBookingRecord,
  ResidentServiceBookingRecord,
  VisitorPassRecord,
  VisitorGateLogRecord,
  CommunityPostRecord,
  VotingTopicRecord,
  VotingRecordItem,
  FaceEnrollmentRecord,
  EkycSubmissionRecord,
  MeterReadingRecord
} from './schema';

// Generic Table Repository
export class DatabaseTable<T extends Record<string, any>> {
  private items: T[];
  private idKey: string;

  constructor(initialData: T[] = [], idKey: string = 'id') {
    this.items = [...initialData];
    this.idKey = idKey;
  }

  find(predicate?: (item: T) => boolean): T[] {
    if (!predicate) return [...this.items];
    return this.items.filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  findById(id: any): T | undefined {
    if (id === undefined || id === null) return undefined;
    const strId = String(id).toLowerCase().trim();
    return this.items.find(item => {
      const val = (item as any)[this.idKey] || (item as any).id || (item as any).apt_code || (item as any).code || (item as any).userId;
      return val !== undefined && String(val).toLowerCase().trim() === strId;
    });
  }

  insert(record: T): T {
    this.items.push(record);
    return record;
  }

  update(id: any, patch: Partial<T>): T | undefined {
    const strId = String(id).toLowerCase().trim();
    const index = this.items.findIndex(item => {
      const val = (item as any)[this.idKey] || (item as any).id || (item as any).apt_code || (item as any).code || (item as any).userId;
      return val !== undefined && String(val).toLowerCase().trim() === strId;
    });
    if (index === -1) return undefined;
    this.items[index] = { ...this.items[index], ...patch };
    return this.items[index];
  }

  delete(id: any): boolean {
    const strId = String(id).toLowerCase().trim();
    const initialLen = this.items.length;
    this.items = this.items.filter(item => {
      const val = (item as any)[this.idKey] || (item as any).id || (item as any).apt_code || (item as any).code || (item as any).userId;
      return val === undefined || String(val).toLowerCase().trim() !== strId;
    });
    return this.items.length < initialLen;
  }

  replaceItems(newItems: T[]): void {
    this.items = [...newItems];
  }

  count(predicate?: (item: T) => boolean): number {
    return this.find(predicate).length;
  }
}

// ----------------------------------------------------------------------------
// AUTHORITATIVE SEED DATA (FROM skyline_smart_residence_schema.sql)
// ----------------------------------------------------------------------------

const INITIAL_CONDOMINIUMS: CondominiumRecord[] = [
  {
    id: 1,
    condo_code: 'SKYLINE_RESIDENCE',
    condo_name: 'Chung Cư Cao Cấp Skyline Smart Residence',
    address: 'Phân khu The Tropical (BS-07 đến BS-10), Beverly Solari, Vinhomes Grand Park, TP. Thủ Đức, TP. Hồ Chí Minh',
    total_floors: 39,
    basement_floors: 2,
    total_apartments: 850,
    investor: 'Skyline Group Corporation',
    management_company: 'VinHomes Manager',
    hotline: '1900 8899',
    handover_year: 2026,
    description: 'Tổ hợp chung cư thông minh 5 sao The Tropical (BS-07 đến BS-10) phân khu Beverly Solari cao 34-39 tầng với hệ thống Smart Home, nhận diện FaceID và tiện ích đặc quyền.'
  }
];

const INITIAL_BLOCKS: BlockRecord[] = [
  { id: 880, condo_id: 1, block_code: 'BS-07', block_name: 'Chung Cư Tropical BS-07', total_floors: 34, manager_name: 'VinHomes Manager', manager_phone: '0901888999' },
  { id: 883, condo_id: 1, block_code: 'BS-08', block_name: 'Chung Cư Tropical BS-08', total_floors: 39, manager_name: 'VinHomes Manager', manager_phone: '0901888999' },
  { id: 886, condo_id: 1, block_code: 'BS-09', block_name: 'Chung Cư Tropical BS-09', total_floors: 34, manager_name: 'VinHomes Manager', manager_phone: '0901888999' },
  { id: 889, condo_id: 1, block_code: 'BS-10', block_name: 'Chung Cư Tropical BS-10', total_floors: 34, manager_name: 'VinHomes Manager', manager_phone: '0901888999' }
];

const INITIAL_FLOORS: FloorRecord[] = [
  { floor_number: -2, floor_code: 'B2', floor_name: 'Tầng Hầm B2 - Bãi Đỗ Xe Ô Tô Định Danh', floor_type: 'BASEMENT', floor_function: 'Bãi đỗ xe ô tô RFID, máy bơm PCCC & trạm biến áp', units_count: 0, condo_id: 1 },
  { floor_number: -1, floor_code: 'B1', floor_name: 'Tầng Hầm B1 - Bãi Đỗ Xe Máy & Trạm Sạc Xe Điện', floor_type: 'BASEMENT', floor_function: 'Bãi đỗ xe máy RFID, trạm sạc xe điện thông minh', units_count: 0, condo_id: 1 },
  { floor_number: 1, floor_code: 'T1', floor_name: 'Tầng 1 - Sảnh Đón Khách Grand Lobby & Sky Kids', floor_type: 'COMMERCIAL_AMENITY', floor_function: 'Sảnh lễ tân đón khách 5 sao, quầy BQL tiếp dân, Sky Kids Zone', units_count: 0, condo_id: 1 },
  { floor_number: 2, floor_code: 'T2', floor_name: 'Tầng 2 - Khối Thương Mại & Văn Phòng Điều Hành', floor_type: 'COMMERCIAL_AMENITY', floor_function: 'Văn phòng điều hành BQL tòa nhà, phòng an ninh camera AI', units_count: 0, condo_id: 1 },
  { floor_number: 3, floor_code: 'T3', floor_name: 'Tầng 3 - Khu Tiện Ích Thể Thao & Chăm Sóc Sức Khỏe', floor_type: 'COMMERCIAL_AMENITY', floor_function: 'Trung Tâm Thể Hình Technogym 24/7 và Phòng Xông Hơi Đá Muối Himalaya VIP', units_count: 0, condo_id: 1 },
  { floor_number: 4, floor_code: 'T4', floor_name: 'Tầng 4 - Sinh Hoạt Cộng Đồng & Vườn Treo Thảo Mộc', floor_type: 'COMMERCIAL_AMENITY', floor_function: 'Hội trường sinh hoạt cộng đồng, thư viện số cư dân', units_count: 0, condo_id: 1 },
  { floor_number: 12, floor_code: 'T12', floor_name: 'Tầng 12 - Căn Hộ Cư Dân Tiêu Chuẩn', floor_type: 'RESIDENTIAL', floor_function: 'Khu căn hộ ở tiêu chuẩn The Tropical', units_count: 10, condo_id: 1 },
  { floor_number: 15, floor_code: 'T15', floor_name: 'Tầng 15 - Căn Hộ Cư Dân Cao Cấp', floor_type: 'RESIDENTIAL', floor_function: 'Khu căn hộ ở cao cấp thiết kế tối ưu', units_count: 10, condo_id: 1 },
  { floor_number: 16, floor_code: 'T16', floor_name: 'Tầng 16 - Căn Hộ Cư Dân Cao Cấp', floor_type: 'RESIDENTIAL', floor_function: 'Khu căn hộ ở cao cấp view công viên', units_count: 10, condo_id: 1 },
  { floor_number: 18, floor_code: 'T18', floor_name: 'Tầng 18 - Căn Hộ Cư Dân Tầng Trung', floor_type: 'RESIDENTIAL', floor_function: 'Khu căn hộ tầng trung thoáng mát', units_count: 10, condo_id: 1 },
  { floor_number: 20, floor_code: 'T20', floor_name: 'Tầng 20 - Căn Hộ 3PN Gia Đình Đa Thế Hệ', floor_type: 'RESIDENTIAL', floor_function: 'Khu căn hộ cao cấp diện tích lớn (Căn 20B01 3PN)', units_count: 10, condo_id: 1 },
  { floor_number: 22, floor_code: 'T22', floor_name: 'Tầng 22 - Căn Hộ Cư Dân Sky Suite', floor_type: 'RESIDENTIAL', floor_function: 'Khu căn hộ cao cấp view toàn cảnh', units_count: 10, condo_id: 1 },
  { floor_number: 24, floor_code: 'T24', floor_name: 'Tầng 24 - Căn Hộ Áp Mái Cao Cấp', floor_type: 'RESIDENTIAL', floor_function: 'Khu căn hộ áp mái sang trọng Sky Suite (Căn 24A01, 24A02)', units_count: 8, condo_id: 1 },
  { floor_number: 25, floor_code: 'T25', floor_name: 'Tầng 25 - Sân Thượng Panoramic, Hồ Bơi Vô Cực, BBQ & Penthouse', floor_type: 'ROOFTOP_AMENITY', floor_function: 'Hồ Bơi Vô Cực Chân Mây, Vườn BBQ và Duplex Penthouse 5 sao (25PH-01, 25PH-02)', units_count: 2, condo_id: 1 },
  { floor_number: 28, floor_code: 'T28', floor_name: 'Tầng 28 - Căn Hộ Tầng Cao View Sông', floor_type: 'RESIDENTIAL', floor_function: 'Khu căn hộ tầng cao đón gió sông', units_count: 10, condo_id: 1 },
  { floor_number: 30, floor_code: 'T30', floor_name: 'Tầng 30 - Căn Hộ Cư Dân Tầng Cao Đẳng Cấp', floor_type: 'RESIDENTIAL', floor_function: 'Khu căn hộ tầng 30 Tòa Tropical BS-07 (Trọn vẹn 21 căn hộ CAD CH-01 đến CH-21)', units_count: 21, condo_id: 1 }
];

// CHỈ CHỨA CÁC CĂN HỘ THẬT THUỘC 4 KHỐI TÒA VÀ PENTHOUSE (ZERO DUMMY GENERATOR LOOPS)
const INITIAL_APARTMENTS: ApartmentRecord[] = [
  // ==========================================================================
  // TÒA TROPICAL BS-07 (Block 880) - TẦNG 30 (TRỌN VẸN 21 CĂN HỘ MẶT BẰNG CAD)
  // ==========================================================================
  // CÁNH 1: CÁNH BẮC (NORTH WING - Căn 01 đến 05)
  {
    id: 'apt-ch01',
    apt_code: 'CH-01',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'NORTH',
    apt_type: '2PN',
    type_label: '2PN Góc Đẹp',
    wall_area: 68.4,
    clear_area: 64.0,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Đông Bắc',
    main_door_direction: 'Tây Nam',
    price_billion: 3.15,
    price_vnd: 3150000000,
    status: 'OCCUPIED',
    owner_id: 'user-mai',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS07-CH01-20260921',
    description: 'Căn hộ 2PN góc tầng 30 Tòa Tropical BS-07 của Chủ hộ Nguyễn Thị Mai.',
    vehicles: [
      { id: 'veh-bs07-ch01', type: 'MOTORBIKE', plate: '59F2-688.88', brand: 'Honda SH Mode', cardNo: 'RFID-BS07-01', slot: 'B1-M12' }
    ]
  },
  {
    id: 'apt-ch02',
    apt_code: 'CH-02',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'NORTH',
    apt_type: '1PN',
    type_label: '1PN Tiêu Chuẩn',
    wall_area: 42.0,
    clear_area: 38.2,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Bắc',
    main_door_direction: 'Tây Nam',
    price_billion: 2.80,
    price_vnd: 2800000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 1PN tiêu chuẩn hiện đại tầng 30 Tòa Tropical BS-07 đón gió Đông Bắc.'
  },
  {
    id: 'apt-ch03',
    apt_code: 'CH-03',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'NORTH',
    apt_type: '1PN',
    type_label: '1PN+ Đa Năng',
    wall_area: 51.0,
    clear_area: 46.5,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Bắc',
    main_door_direction: 'Tây Nam',
    price_billion: 3.20,
    price_vnd: 3200000000,
    status: 'OCCUPIED',
    owner_id: 'user-thanh',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS07-CH03-20260921',
    description: 'Căn hộ 1PN+ đa năng của Chủ hộ Bùi Văn Thành tại Tòa Tropical BS-07 Tầng 30.'
  },
  {
    id: 'apt-ch04',
    apt_code: 'CH-04',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'NORTH',
    apt_type: '2PN',
    type_label: '2PN Ban Công Kính',
    wall_area: 64.0,
    clear_area: 59.1,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Đông Bắc',
    main_door_direction: 'Tây Nam',
    price_billion: 4.10,
    price_vnd: 4100000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN ban công kính hướng Đông Bắc đón gió mát tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch05',
    apt_code: 'CH-05',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'NORTH',
    apt_type: '2PN',
    type_label: '2PN Góc Đẹp',
    wall_area: 75.0,
    clear_area: 69.2,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Đông Bắc',
    main_door_direction: 'Tây Nam',
    price_billion: 4.80,
    price_vnd: 4800000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN góc đẹp hai mặt thoáng tầng 30 Tòa Tropical BS-07.'
  },

  // CÁNH 2: CÁNH NAM (SOUTH WING - Căn 06 đến 10)
  {
    id: 'apt-ch06',
    apt_code: 'CH-06',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'SOUTH',
    apt_type: '1PN',
    type_label: '1PN View Hồ Bơi (Căn Chủ Hộ)',
    wall_area: 46.0,
    clear_area: 42.0,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Nam',
    price_billion: 2.65,
    price_vnd: 2650000000,
    status: 'OCCUPIED',
    owner_id: 'user-owner-1',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-CH06-20260921',
    description: 'Căn hộ thông minh thực tế của Chủ hộ Trần Hữu Lực tại Tòa Tropical BS-07 Tầng 30 tích hợp FaceID, IoT Daikin và cảm biến rò rỉ nước AI.',
    vehicles: [
      { id: 'veh-ch06-01', type: 'CAR', plate: '51K-889.99', brand: 'Mercedes-Benz C300 AMG', cardNo: 'RFID-A1205-01', slot: 'B2-A15' },
      { id: 'veh-ch06-02', type: 'MOTORBIKE', plate: '59P1-886.79', brand: 'Honda SH 150i ABS', cardNo: 'RFID-A1205-02', slot: 'B1-M88' }
    ]
  },
  {
    id: 'apt-ch07',
    apt_code: 'CH-07',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'SOUTH',
    apt_type: '2PN',
    type_label: '2PN Gia Đình',
    wall_area: 64.0,
    clear_area: 59.0,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 4.10,
    price_vnd: 4100000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN gia đình view hồ bơi tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch08',
    apt_code: 'CH-08',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'SOUTH',
    apt_type: '1PN',
    type_label: '1PN+ Đa Năng',
    wall_area: 51.0,
    clear_area: 46.5,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 3.25,
    price_vnd: 3250000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 1PN+ đa năng đón nắng mai tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch09',
    apt_code: 'CH-09',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'SOUTH',
    apt_type: '2PN',
    type_label: '2PN Góc Thoáng',
    wall_area: 75.0,
    clear_area: 69.5,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 4.90,
    price_vnd: 4900000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN góc thoáng view nội khu The Tropical tầng 30 Tòa BS-07.'
  },
  {
    id: 'apt-ch10',
    apt_code: 'CH-10',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'SOUTH',
    apt_type: 'STUDIO',
    type_label: 'Studio Tiện Nghi',
    wall_area: 38.0,
    clear_area: 35.0,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 2.45,
    price_vnd: 2450000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ Studio tiện nghi đầy đủ công năng tầng 30 Tòa Tropical BS-07.'
  },

  // CÁNH 3: CÁNH TÂY (WEST WING - Dãy căn 11 đến 21 đối xứng qua hành lang)
  {
    id: 'apt-ch11',
    apt_code: 'CH-11',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: '2PN',
    type_label: '2PN Tây Bắc',
    wall_area: 67.0,
    clear_area: 62.0,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Tây Bắc',
    main_door_direction: 'Đông Nam',
    price_billion: 4.20,
    price_vnd: 4200000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN Tây Bắc thiết kế mở tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch12',
    apt_code: 'CH-12',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: '1PN',
    type_label: '1PN Tiện Ích',
    wall_area: 49.0,
    clear_area: 44.5,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Tây Bắc',
    main_door_direction: 'Đông Nam',
    price_billion: 3.10,
    price_vnd: 3100000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 1PN tiện ích tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch13',
    apt_code: 'CH-13',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: 'STUDIO',
    type_label: 'Studio Hiện Đại',
    wall_area: 36.5,
    clear_area: 33.5,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Tây Bắc',
    main_door_direction: 'Đông Nam',
    price_billion: 2.30,
    price_vnd: 2300000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ Studio hiện đại tối ưu diện tích tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch14',
    apt_code: 'CH-14',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: '2PN',
    type_label: '2PN Ban Công Rộng',
    wall_area: 63.5,
    clear_area: 58.5,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Tây Bắc',
    main_door_direction: 'Đông Nam',
    price_billion: 4.00,
    price_vnd: 4000000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN ban công rộng ngắm hoàng hôn tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch15',
    apt_code: 'CH-15',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: '2PN',
    type_label: '2PN Góc Tây',
    wall_area: 72.5,
    clear_area: 67.0,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Tây Bắc',
    main_door_direction: 'Đông Nam',
    price_billion: 4.50,
    price_vnd: 4500000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN góc Tây thông thoáng tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch16',
    apt_code: 'CH-16',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: '2PN',
    type_label: '2PN Tây Nam',
    wall_area: 73.5,
    clear_area: 68.0,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Tây Nam',
    main_door_direction: 'Đông Bắc',
    price_billion: 4.60,
    price_vnd: 4600000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN Tây Nam đón gió sông tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch17',
    apt_code: 'CH-17',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: '1PN',
    type_label: '1PN View Cây Xanh',
    wall_area: 47.0,
    clear_area: 43.0,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Tây Nam',
    main_door_direction: 'Đông Bắc',
    price_billion: 3.00,
    price_vnd: 3000000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 1PN view cây xanh mát mẻ tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch18',
    apt_code: 'CH-18',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: '2PN',
    type_label: '2PN Tiêu Chuẩn',
    wall_area: 66.5,
    clear_area: 61.5,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Tây Nam',
    main_door_direction: 'Đông Bắc',
    price_billion: 4.15,
    price_vnd: 4150000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN tiêu chuẩn The Tropical tầng 30 Tòa BS-07.'
  },
  {
    id: 'apt-ch19',
    apt_code: 'CH-19',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: 'STUDIO',
    type_label: 'Studio Nhỏ Gọn',
    wall_area: 37.0,
    clear_area: 34.0,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Tây Nam',
    main_door_direction: 'Đông Bắc',
    price_billion: 2.40,
    price_vnd: 2400000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ Studio nhỏ gọn thông minh tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch20',
    apt_code: 'CH-20',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: '1PN',
    type_label: '1PN Đón Gió',
    wall_area: 49.0,
    clear_area: 45.0,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Tây Nam',
    main_door_direction: 'Đông Bắc',
    price_billion: 3.15,
    price_vnd: 3150000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 1PN đón gió tầng 30 Tòa Tropical BS-07.'
  },
  {
    id: 'apt-ch21',
    apt_code: 'CH-21',
    block_id: 880,
    tower_code: 'A',
    floor_number: 30,
    wing: 'WEST',
    apt_type: '2PN',
    type_label: '2PN Góc Nam',
    wall_area: 76.0,
    clear_area: 70.0,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Tây Nam',
    main_door_direction: 'Đông Bắc',
    price_billion: 4.95,
    price_vnd: 4950000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 2PN góc Nam cao cấp tầng 30 Tòa Tropical BS-07.'
  },

  // ==========================================================================
  // CĂN HỘ THUỘC 3 CHUNG CƯ CÒN LẠI (BS-08, BS-09, BS-10)
  // ==========================================================================
  // --- TÒA BS-08 (Block 883) ---
  {
    id: 'apt-bs08-ch08',
    apt_code: 'BS08-CH08',
    block_id: 883,
    tower_code: 'A',
    floor_number: 15,
    wing: 'SOUTH',
    apt_type: '1PN',
    type_label: '1PN+ Đa Năng',
    wall_area: 46.5,
    clear_area: 42.5,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 3.25,
    price_vnd: 3250000000,
    status: 'OCCUPIED',
    owner_id: 'user-member-1',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS08-CH08-20260921',
    description: 'Căn hộ của Chủ hộ Nguyễn Văn Cường tại Tòa Tropical BS-08 Tầng 15 (ở 1 mình, không có người nhà).'
  },
  {
    id: 'apt-bs08-ch04',
    apt_code: 'BS08-CH04',
    block_id: 883,
    tower_code: 'A',
    floor_number: 12,
    wing: 'NORTH',
    apt_type: '2PN',
    type_label: '2 Phòng Ngủ View Công Viên',
    wall_area: 69.2,
    clear_area: 65.0,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Đông Bắc',
    main_door_direction: 'Tây Nam',
    price_billion: 3.30,
    price_vnd: 3300000000,
    status: 'OCCUPIED',
    owner_id: 'user-nam',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS08-CH04-20260921',
    description: 'Căn hộ của Chủ hộ Lê Hoàng Nam tại Tòa Tropical BS-08 Tầng 12.',
    vehicles: [
      { id: 'veh-bs08-ch04', type: 'CAR', plate: '30H-992.34', brand: 'Mazda CX-5 Premium', cardNo: 'RFID-BS08-01', slot: 'B2-A08' }
    ]
  },
  {
    id: 'apt-bs08-ch07',
    apt_code: 'BS08-CH07',
    block_id: 883,
    tower_code: 'B',
    floor_number: 20,
    wing: 'SOUTH',
    apt_type: '1PN',
    type_label: '1PN+ Đa Năng',
    wall_area: 47.0,
    clear_area: 43.0,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 3.20,
    price_vnd: 3200000000,
    status: 'OCCUPIED',
    owner_id: 'user-ha',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS08-CH07-20260921',
    description: 'Căn hộ của Chủ hộ Đỗ Thu Hà tại Tòa Tropical BS-08 Tầng 20.',
    vehicles: [
      { id: 'veh-bs08-ch07', type: 'CAR', plate: '51H-665.23', brand: 'Hyundai Tucson 2.0', cardNo: 'RFID-BS08-02', slot: 'B2-A09' }
    ]
  },

  // --- TÒA BS-09 (Block 886) ---
  {
    id: 'apt-bs09-ch12',
    apt_code: 'BS09-CH12',
    block_id: 886,
    tower_code: 'B',
    floor_number: 12,
    wing: 'WEST',
    apt_type: '1PN',
    type_label: '1PN Tiện Ích',
    wall_area: 44.5,
    clear_area: 40.5,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Tây Bắc',
    main_door_direction: 'Đông Nam',
    price_billion: 3.10,
    price_vnd: 3100000000,
    status: 'OCCUPIED',
    owner_id: 'user-member-2',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS09-CH12-20260921',
    description: 'Căn hộ của Chủ hộ Lê Đức Hải tại Tòa Tropical BS-09 Tầng 12 (ở 1 mình, không có người nhà).'
  },
  {
    id: 'apt-bs09-ch05',
    apt_code: 'BS09-CH05',
    block_id: 886,
    tower_code: 'A',
    floor_number: 16,
    wing: 'WEST',
    apt_type: '2PN',
    type_label: '2 Phòng Ngủ Tiện Nghi',
    wall_area: 68.0,
    clear_area: 63.5,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Tây Bắc',
    main_door_direction: 'Đông Nam',
    price_billion: 3.18,
    price_vnd: 3180000000,
    status: 'OCCUPIED',
    owner_id: 'user-tuan',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS09-CH05-20260921',
    description: 'Căn hộ của Chủ hộ Phạm Minh Tuấn tại Tòa Tropical BS-09 Tầng 16.',
    vehicles: [
      { id: 'veh-bs09-ch05', type: 'CAR', plate: '51G-771.88', brand: 'Toyota Camry 2.5Q', cardNo: 'RFID-BS09-01', slot: 'B2-A04' }
    ]
  },
  {
    id: 'apt-bs09-ch10',
    apt_code: 'BS09-CH10',
    block_id: 886,
    tower_code: 'B',
    floor_number: 22,
    wing: 'EAST',
    apt_type: '1PN',
    type_label: '1PN Tiêu Chuẩn',
    wall_area: 45.0,
    clear_area: 41.0,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 3.05,
    price_vnd: 3050000000,
    status: 'OCCUPIED',
    owner_id: 'user-huy',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS09-CH10-20260921',
    description: 'Căn hộ của Chủ hộ Vũ Quang Huy tại Tòa Tropical BS-09 Tầng 22.',
    vehicles: [
      { id: 'veh-bs09-ch10', type: 'CAR', plate: '29A-888.66', brand: 'Mercedes-Benz C200', cardNo: 'RFID-BS09-02', slot: 'B2-A10' }
    ]
  },

  // --- TÒA BS-10 (Block 889) ---
  {
    id: 'apt-bs10-ch02',
    apt_code: 'BS10-CH02',
    block_id: 889,
    tower_code: 'B',
    floor_number: 18,
    wing: 'NORTH',
    apt_type: '1PN',
    type_label: '1PN Tiêu Chuẩn',
    wall_area: 38.2,
    clear_area: 35.0,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Bắc',
    main_door_direction: 'Tây Nam',
    price_billion: 2.80,
    price_vnd: 2800000000,
    status: 'OCCUPIED',
    owner_id: 'user-member-3',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS10-CH02-20260921',
    description: 'Căn hộ của Chủ hộ Vũ Cát Thịnh tại Tòa Tropical BS-10 Tầng 18 (ở 1 mình, không có người nhà).'
  },
  {
    id: 'apt-bs10-ch09',
    apt_code: 'BS10-CH09',
    block_id: 889,
    tower_code: 'A',
    floor_number: 25,
    wing: 'NORTH',
    apt_type: '2PN',
    type_label: '2 Phòng Ngủ Tầng Cao',
    wall_area: 70.0,
    clear_area: 65.5,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Đông Bắc',
    main_door_direction: 'Tây Nam',
    price_billion: 3.40,
    price_vnd: 3400000000,
    status: 'OCCUPIED',
    owner_id: 'user-dung',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS10-CH09-20260921',
    description: 'Căn hộ của Chủ hộ Hoàng Anh Dũng tại Tòa Tropical BS-10 Tầng 25.',
    vehicles: [
      { id: 'veh-bs10-ch09', type: 'MOTORBIKE', plate: '59P1-889.12', brand: 'Yamaha Grande Hybrid', cardNo: 'RFID-BS10-01', slot: 'B1-M01' }
    ]
  },
  {
    id: 'apt-bs10-ch11',
    apt_code: 'BS10-CH11',
    block_id: 889,
    tower_code: 'B',
    floor_number: 28,
    wing: 'SOUTH',
    apt_type: '1PN',
    type_label: '1PN Panorama',
    wall_area: 48.0,
    clear_area: 44.0,
    bedrooms: 1,
    bathrooms: 1,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 3.35,
    price_vnd: 3350000000,
    status: 'OCCUPIED',
    owner_id: 'user-linh',
    handover_date: '2026-09-21',
    handover_protocol: 'BBBG-TROPICAL-BS10-CH11-20260921',
    description: 'Căn hộ của Chủ hộ Đặng Phương Linh tại Tòa Tropical BS-10 Tầng 28.',
    vehicles: [
      { id: 'veh-bs10-ch11', type: 'CAR', plate: '51A-981.45', brand: 'VinFast VF8 Plus', cardNo: 'RFID-BS10-02', slot: 'B2-A11' }
    ]
  },

  // --- SKY SUITE & DUPLEX PENTHOUSE (TÒA A, 880) ---
  {
    id: 'apt-25ph01',
    apt_code: '25PH-01',
    block_id: 880,
    tower_code: 'A',
    floor_number: 25,
    wing: 'CENTRAL',
    apt_type: 'DUPLEX_PENTHOUSE',
    type_label: 'Duplex Penthouse 5 Sao',
    wall_area: 232.0,
    clear_area: 215.0,
    bedrooms: 4,
    bathrooms: 4,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 18.50,
    price_vnd: 18500000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Tuyệt tác Penthouse thông tầng tầng 25, hồ bơi riêng Sky Garden và thang máy đặc quyền.'
  },
  {
    id: 'apt-25ph02',
    apt_code: '25PH-02',
    block_id: 880,
    tower_code: 'A',
    floor_number: 25,
    wing: 'CENTRAL',
    apt_type: 'DUPLEX_PENTHOUSE',
    type_label: 'Duplex Penthouse 5 Sao',
    wall_area: 232.0,
    clear_area: 215.0,
    bedrooms: 4,
    bathrooms: 4,
    balcony_direction: 'Tây Nam',
    main_door_direction: 'Đông Bắc',
    price_billion: 18.20,
    price_vnd: 18200000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Penthouse tầng 25 hướng hoàng hôn, sân thượng Sky Lounge 45m2 ngắm trọn thành phố.'
  },
  {
    id: 'apt-24a01',
    apt_code: '24A01',
    block_id: 880,
    tower_code: 'A',
    floor_number: 24,
    wing: 'NORTH',
    apt_type: '3PN',
    type_label: '3 Phòng Ngủ - 3WC',
    wall_area: 119.5,
    clear_area: 112.0,
    bedrooms: 3,
    bathrooms: 3,
    balcony_direction: 'Đông Nam',
    main_door_direction: 'Tây Bắc',
    price_billion: 8.50,
    price_vnd: 8500000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn hộ 3PN cao cấp áp mái tầng 24 với tầm nhìn triệu đô ôm trọn sông Sài Gòn.'
  },
  {
    id: 'apt-24a02',
    apt_code: '24A02',
    block_id: 880,
    tower_code: 'A',
    floor_number: 24,
    wing: 'NORTH',
    apt_type: '2PN',
    type_label: '2 Phòng Ngủ - 2WC',
    wall_area: 83.2,
    clear_area: 78.5,
    bedrooms: 2,
    bathrooms: 2,
    balcony_direction: 'Tây Nam',
    main_door_direction: 'Đông Bắc',
    price_billion: 5.60,
    price_vnd: 5600000000,
    status: 'VACANT',
    owner_id: null,
    description: 'Căn 2PN tầng cao thoáng đãng đón gió tự nhiên, hoàn thiện nội thất cơ bản cao cấp.'
  },
  {
    id: 'apt-20b01',
    apt_code: '20B01',
    block_id: 880,
    tower_code: 'A',
    floor_number: 20,
    wing: 'SOUTH',
    apt_type: '3PN',
    type_label: '3 Phòng Ngủ - 3WC',
    wall_area: 115.8,
    clear_area: 108.2,
    bedrooms: 3,
    bathrooms: 3,
    balcony_direction: 'Nam',
    main_door_direction: 'Bắc',
    price_billion: 7.20,
    price_vnd: 7200000000,
    status: 'OCCUPIED',
    owner_id: null,
    handover_date: '2026-02-10',
    handover_protocol: 'BBBG-SKYLINE-20B01-20260210',
    description: 'Căn hộ 3PN rộng rãi diện tích thông thủy 108.2 m2 dành cho gia đình đa thế hệ.'
  }
];

const INITIAL_USERS: UserRecord[] = [
  // 1. Trưởng BQL (Admin)
  {
    id: 'user-manager-1',
    username: 'admin@skyline.vn',
    role: 'ADMIN',
    full_name: 'VinHomes Manager',
    phone: '0901888999',
    email: 'admin@skyline.vn',
    password_hash: 'admin123',
    id_card_no: '079204000888',
    id_date: '2021-05-10',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1988-04-12',
    pob: 'TP. Hồ Chí Minh',
    gender: 1,
    apartment_code: 'BQL_OFFICE',
    relationship: 'Staff',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    emergency_phone: '19008899'
  },
  // 2. KTV 1: Điện Lạnh & Kỹ Thuật Tòa Nhà
  {
    id: 'user-tech-1',
    username: '0901888998',
    role: 'TECHNICIAN',
    full_name: 'Trần Đình Trọng',
    phone: '0901888998',
    email: 'manager02@skyline.vn',
    password_hash: '12345678',
    id_card_no: '079201009999',
    id_date: '2020-05-18',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1990-09-12',
    pob: 'Đà Nẵng',
    gender: 1,
    apartment_code: 'TECH_ROOM',
    relationship: 'Staff',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    emergency_phone: '0901888998'
  },
  // 3. KTV 2: Cơ Điện & Nước
  {
    id: 'user-tech-2',
    username: '0909888777',
    role: 'TECHNICIAN',
    full_name: 'Lê Quốc Tuấn',
    phone: '0909888777',
    email: 'tech.skyline@gmail.com',
    password_hash: '12345678',
    id_card_no: '079201009988',
    id_date: '2020-03-20',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1992-07-25',
    pob: 'Hà Nội',
    gender: 1,
    apartment_code: 'TECH_ROOM',
    relationship: 'Staff',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    emergency_phone: '0909888777'
  },
  // 4. KTV 3: Vệ Sinh & Vận Hành
  {
    id: 'user-tech-3',
    username: '0908777666',
    role: 'TECHNICIAN',
    full_name: 'Nguyễn Huy Hoàng',
    phone: '0908777666',
    email: 'hoang.vesinh@skyline.vn',
    password_hash: '12345678',
    id_card_no: '079201007766',
    id_date: '2021-04-15',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1993-06-18',
    pob: 'Bình Định',
    gender: 1,
    apartment_code: 'TECH_ROOM',
    relationship: 'Staff',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    emergency_phone: '0908777666'
  },
  // 5. Lễ Tân Sảnh A
  {
    id: 'user-reception-1',
    username: '0901234567',
    role: 'RECEPTIONIST',
    full_name: 'Hoàng Thảo My',
    phone: '0901234567',
    email: 'reception.skyline@gmail.com',
    password_hash: '12345678',
    id_card_no: '079302008877',
    id_date: '2022-11-10',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1998-09-18',
    pob: 'Đà Nẵng',
    gender: 0,
    apartment_code: 'RECEPTION_DESK',
    relationship: 'Staff',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    emergency_phone: '0901234567'
  },
  // 6. Lễ Tân Sảnh B
  {
    id: 'user-reception-2',
    username: '0901234568',
    role: 'RECEPTIONIST',
    full_name: 'Nguyễn Mai Anh',
    phone: '0901234568',
    email: 'reception.tropical@gmail.com',
    password_hash: '12345678',
    id_card_no: '079302008878',
    id_date: '2023-01-15',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1999-04-20',
    pob: 'TP. Hồ Chí Minh',
    gender: 0,
    apartment_code: 'RECEPTION_DESK',
    relationship: 'Staff',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    emergency_phone: '0901234568'
  },
  // 7. Chủ Hộ Căn CH-06: Trần Hữu Lực
  {
    id: 'user-owner-1',
    username: 'huuluc04@gmail.com',
    role: 'OWNER',
    full_name: 'Trần Hữu Lực',
    phone: '0364967082',
    email: 'huuluc04@gmail.com',
    password_hash: '12345678',
    id_card_no: '067204000961',
    id_date: '2022-08-15',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '2004-08-18',
    pob: 'Triệu Trạch, Triệu Phong, Quảng Trị',
    gender: 1,
    apartment_code: 'CH-06',
    relationship: 'Owner',
    license_plate: '51K-889.99',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    emergency_phone: '0364967082'
  },
  // 8. Cư Dân Người Nhà Căn CH-06: Nguyễn Hữu Nhựt
  {
    id: 'user-tenant-1',
    username: 'nguyenhuunhut1309@gmail.com',
    role: 'TENANT',
    full_name: 'Nguyễn Hữu Nhựt',
    phone: '0917795211',
    email: 'nguyenhuunhut1309@gmail.com',
    password_hash: '12345678',
    id_card_no: '079198005678',
    id_date: '2022-09-02',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '2004-09-02',
    pob: 'TP. Hồ Chí Minh',
    gender: 1,
    apartment_code: 'CH-06',
    relationship: 'Family',
    license_plate: '59P1-886.79',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    emergency_phone: '0917795211'
  },
  // 9. Chủ Hộ Căn CH-08: Nguyễn Văn Cường
  {
    id: 'user-member-1',
    username: 'vanncuong1614@gmail.com',
    role: 'OWNER',
    full_name: 'Nguyễn Văn Cường',
    phone: '0325524482',
    email: 'vanncuong1614@gmail.com',
    password_hash: '12345678',
    id_card_no: '074204001708',
    id_date: '2022-11-20',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '2004-01-16',
    pob: 'Tỉnh Thanh Hóa',
    gender: 1,
    apartment_code: 'BS08-CH08',
    relationship: 'Owner',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  },
  // 10. Chủ Hộ Căn CH-12: Lê Đức Hải
  {
    id: 'user-member-2',
    username: 'lehai17082004@gmail.com',
    role: 'OWNER',
    full_name: 'Lê Đức Hải',
    phone: '0977758215',
    email: 'lehai17082004@gmail.com',
    password_hash: '12345678',
    id_card_no: '070204001704',
    id_date: '2023-04-12',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '2004-08-17',
    pob: 'Xuân Thọ, Triệu Sơn, Thanh Hóa',
    gender: 1,
    apartment_code: 'BS09-CH12',
    relationship: 'Owner',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  // 11. Chủ Hộ Căn CH-02: Vũ Cát Thịnh
  {
    id: 'user-member-3',
    username: '26vucatthinh@gmail.com',
    role: 'OWNER',
    full_name: 'Vũ Cát Thịnh',
    phone: '0909262626',
    email: '26vucatthinh@gmail.com',
    password_hash: '12345678',
    id_card_no: '079201002626',
    id_date: '2023-06-18',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '2001-05-26',
    pob: 'TP. Hồ Chí Minh',
    gender: 1,
    apartment_code: 'BS10-CH02',
    relationship: 'Owner',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'
  },
  // 12. Cư dân: Nguyễn Thị Mai (CH-01, BS-07)
  {
    id: 'user-mai',
    username: '0364967081',
    role: 'OWNER',
    full_name: 'Nguyễn Thị Mai',
    phone: '0364967081',
    email: 'mainguyen@gmail.com',
    password_hash: '12345678',
    id_card_no: '079198002341',
    id_date: '2021-06-10',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1992-05-12',
    pob: 'Hải Phòng',
    gender: 0,
    apartment_code: 'CH-01',
    relationship: 'Owner',
    license_plate: '59F2-688.88',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'
  },
  // 13. Cư dân: Lê Hoàng Nam (CH-04, BS-08)
  {
    id: 'user-nam',
    username: '0364967080',
    role: 'OWNER',
    full_name: 'Lê Hoàng Nam',
    phone: '0364967080',
    email: 'namle@gmail.com',
    password_hash: '12345678',
    id_card_no: '001090004521',
    id_date: '2020-08-15',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1988-11-25',
    pob: 'Hà Nội',
    gender: 1,
    apartment_code: 'BS08-CH04',
    relationship: 'Owner',
    license_plate: '30H-992.34',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'
  },
  // 14. Cư dân: Phạm Minh Tuấn (CH-05, BS-09)
  {
    id: 'user-tuan',
    username: '0364967084',
    role: 'OWNER',
    full_name: 'Phạm Minh Tuấn',
    phone: '0364967084',
    email: 'tuanpham@gmail.com',
    password_hash: '12345678',
    id_card_no: '079085001234',
    id_date: '2020-03-12',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1985-03-08',
    pob: 'TP. Hồ Chí Minh',
    gender: 1,
    apartment_code: 'BS09-CH05',
    relationship: 'Owner',
    license_plate: '51G-771.88',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'
  },
  // 15. Cư dân: Hoàng Anh Dũng (CH-09, BS-10)
  {
    id: 'user-dung',
    username: '0364967085',
    role: 'OWNER',
    full_name: 'Hoàng Anh Dũng',
    phone: '0364967085',
    email: 'dunghoang@gmail.com',
    password_hash: '12345678',
    id_card_no: '079093005678',
    id_date: '2022-01-20',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1995-09-15',
    pob: 'Đà Nẵng',
    gender: 1,
    apartment_code: 'BS10-CH09',
    relationship: 'Owner',
    license_plate: '59P1-889.12',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'
  },
  // 16. Cư dân: Đỗ Thu Hà (CH-07, BS-08)
  {
    id: 'user-ha',
    username: '0364967086',
    role: 'OWNER',
    full_name: 'Đỗ Thu Hà',
    phone: '0364967086',
    email: 'hadothu@gmail.com',
    password_hash: '12345678',
    id_card_no: '031191007890',
    id_date: '2021-09-18',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1991-04-20',
    pob: 'Hải Dương',
    gender: 0,
    apartment_code: 'BS08-CH07',
    relationship: 'Owner',
    license_plate: '51H-665.23',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'
  },
  // 17. Cư dân: Vũ Quang Huy (CH-10, BS-09)
  {
    id: 'user-huy',
    username: '0364967087',
    role: 'OWNER',
    full_name: 'Vũ Quang Huy',
    phone: '0364967087',
    email: 'huyvu@gmail.com',
    password_hash: '12345678',
    id_card_no: '036089003412',
    id_date: '2020-10-05',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1990-10-10',
    pob: 'Nam Định',
    gender: 1,
    apartment_code: 'BS09-CH10',
    relationship: 'Owner',
    license_plate: '29A-888.66',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'
  },
  // 18. Cư dân: Đặng Phương Linh (CH-11, BS-10)
  {
    id: 'user-linh',
    username: '0364967088',
    role: 'OWNER',
    full_name: 'Đặng Phương Linh',
    phone: '0364967088',
    email: 'linhdang@gmail.com',
    password_hash: '12345678',
    id_card_no: '079196008912',
    id_date: '2022-12-10',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1996-08-22',
    pob: 'TP. Hồ Chí Minh',
    gender: 0,
    apartment_code: 'BS10-CH11',
    relationship: 'Owner',
    license_plate: '51A-981.45',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'
  },
  // 19. Cư dân: Bùi Văn Thành (CH-03, BS-07)
  {
    id: 'user-thanh',
    username: '0364967083',
    role: 'OWNER',
    full_name: 'Bùi Văn Thành',
    phone: '0364967083',
    email: 'thanhbui@gmail.com',
    password_hash: '12345678',
    id_card_no: '038090001122',
    id_date: '2020-02-18',
    id_place: 'Cục Cảnh sát QLHC về TTXH',
    dob: '1983-07-05',
    pob: 'Thanh Hóa',
    gender: 1,
    apartment_code: 'CH-03',
    relationship: 'Owner',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'
  }
];

const INITIAL_MEMBERS: ApartmentMemberRecord[] = [
  {
    id: 'mem-1',
    apartment_code: 'CH-06',
    user_id: 'user-tenant-1',
    full_name: 'Nguyễn Hữu Nhựt',
    phone: '0917795211',
    id_card: '079198005678',
    relationship: 'Em Trai / Người Nhà',
    role: 'Family',
    license_plate: '59P1-886.79',
    face_status: 'Đã xác thực',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
  }
];

const INITIAL_TECHNICIANS: TechnicianRecord[] = [
  {
    id: 'KTV-01',
    user_id: 'user-tech-1',
    name: 'Trần Đình Trọng',
    phone: '0901.888.998',
    email: 'manager02@skyline.vn',
    specialty: 'Điện Lạnh & Kỹ Thuật Tòa Nhà',
    base_salary: 9500000,
    pay_per_ticket: 180000,
    bonus_per_fivestar: 50000,
    status: 'AVAILABLE'
  },
  {
    id: 'KTV-02',
    user_id: 'user-tech-2',
    name: 'Lê Quốc Tuấn',
    phone: '0909.888.777',
    email: 'tech.skyline@gmail.com',
    specialty: 'Cơ Điện & Nước',
    base_salary: 8500000,
    pay_per_ticket: 150000,
    bonus_per_fivestar: 50000,
    status: 'AVAILABLE'
  },
  {
    id: 'KTV-03',
    user_id: 'user-tech-3',
    name: 'Nguyễn Huy Hoàng',
    phone: '0908.777.666',
    email: 'hoang.vesinh@skyline.vn',
    specialty: 'Vệ Sinh & Cảnh Quan Chung Cư',
    base_salary: 8000000,
    pay_per_ticket: 120000,
    bonus_per_fivestar: 50000,
    status: 'AVAILABLE'
  }
];

// CHỈ LƯU TRỮ PHIẾU THẬT CỦA CƯ DÂN (KHÔNG DỮ LIỆU ẢO SUNNY/SUNN)
const INITIAL_TICKETS: ServiceTicketRecord[] = [
  // 1. TICKET 925 (API THẬT): Nhà hàng - Vệ sinh bàn ghế tầng 1
  {
    id: 'TICK-925',
    apartment_code: 'CH-06',
    resident_name: 'Trần Hữu Lực',
    resident_phone: '0364967082',
    content: 'Nhà hàng - Vệ sinh bàn ghế nhà hàng tầng 1 sau sự kiện tiệc tối.',
    ticket_type: 'FEEDBACK',
    ticket_type_label: 'Phản Ánh & Dịch Vụ',
    ai_category: 'Nhà hàng',
    ai_priority: 2,
    priority_color: '#3B82F6',
    status: 'Resolved',
    handled_by: 'MANAGEMENT',
    admin_reply: 'VinHomes Manager đã tiếp nhận phản ánh và đội ngũ tạp vụ đã hoàn tất vệ sinh, sắp xếp lại không gian nhà hàng tầng 1 sạch sẽ.',
    admin_replied_at: '2026-08-28 16:30:00',
    admin_replied_by: 'VinHomes Manager',
    assigned_technician_id: 'user-tech-1',
    assigned_technician_name: 'Trần Đình Trọng',
    assigned_technician_phone: '0901888998',
    rating: 5,
    resident_feedback: 'Khu vực nhà hàng đã được dọn sạch sẽ, cảm ơn BQL.',
    rated_at: '2026-08-28 17:00:00',
    created_at: '2026-08-27T10:00:00.000Z',
    resolved_at: '2026-08-28T16:30:00.000Z',
  },
  // 2. TICKET 924 (API THẬT): Hồ bơi - Kiểm tra chất lượng nước & lọc
  {
    id: 'TICK-924',
    apartment_code: 'CH-06',
    resident_name: 'Trần Hữu Lực',
    resident_phone: '0364967082',
    content: 'Hồ bơi - Kiểm tra chất lượng nước hồ bơi định kỳ và bảo dưỡng hệ thống lọc.',
    ticket_type: 'REPAIR',
    ticket_type_label: 'Bảo Trì Kỹ Thuật',
    ai_category: 'Hồ bơi',
    ai_priority: 2,
    priority_color: '#06B6D4',
    status: 'Resolved',
    handled_by: 'TECHNICIAN',
    assigned_technician_id: 'user-tech-1',
    assigned_technician_name: 'Trần Đình Trọng',
    assigned_technician_phone: '0901888998',
    scheduled_time: 'Định kỳ 08:00 sáng',
    auto_dispatched: true,
    ai_dispatch_reason: 'AI chọn Trần Đình Trọng: Kỹ thuật viên bảo trì hệ thống lọc tuần hoàn nước hồ bơi.',
    rating: 5,
    resident_feedback: 'Nước hồ bơi sạch và trong lành, quy trình bảo dưỡng rất chuẩn.',
    rated_at: '2026-08-28 11:30:00',
    created_at: '2026-08-27T08:30:00.000Z',
    resolved_at: '2026-08-28T11:00:00.000Z',
  },
  // 3. TICKET 921 (API THẬT): Vệ sinh Block 07 - Tập kết rác & khử khuẩn
  {
    id: 'TICK-921',
    apartment_code: 'CH-06',
    resident_name: 'Trần Hữu Lực',
    resident_phone: '0364967082',
    content: 'Vệ sinh Block 07 - Tập kết rác thải Block 07 và phun khử khuẩn khu kỹ thuật.',
    ticket_type: 'REPAIR',
    ticket_type_label: 'Vệ Sinh Môi Trường',
    ai_category: 'Vệ sinh',
    ai_priority: 3,
    priority_color: '#10B981',
    status: 'Resolved',
    handled_by: 'TECHNICIAN',
    assigned_technician_id: 'user-tech-2',
    assigned_technician_name: 'Lê Quốc Tuấn',
    assigned_technician_phone: '0909888777',
    scheduled_time: 'Thực hiện ngay trong ca sáng',
    auto_dispatched: true,
    ai_dispatch_reason: 'AI chọn Lê Quốc Tuấn: Trực kỹ thuật vệ sinh môi trường khu vực Block 07.',
    rating: 5,
    resident_feedback: 'Khu gom rác sạch sẽ, không còn mùi hôi, khử khuẩn chu đáo.',
    rated_at: '2026-08-27 16:00:00',
    created_at: '2026-08-26T14:00:00.000Z',
    resolved_at: '2026-08-27T15:30:00.000Z',
  }
];

const INITIAL_BILLS: BillRecord[] = [
  // CĂN HỘ CH-06 (Chủ hộ: Trần Hữu Lực - 3 kỳ liên tiếp để Cư Dân so sánh chi tiết A2)
  {
    id: 'bill-2026-08-ch06',
    apartment_code: 'CH-06',
    owner_name: 'Trần Hữu Lực',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-30 23:59:59+07',
    total_amount: 2505000,
    status: 'Unpaid',
    payment_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_CH06_2505000',
    has_ai_anomaly: true,
    created_at: '2026-08-05 08:00:00+07',
    paid_at: null,
    details: [
      { id: 'bd-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý Vận Hành Tiêu Chuẩn (42.0 m2 x 18.000 đ)', usage: 42.0, unit: 'm²', unit_price: 18000, total_line_amount: 756000, ai_anomaly: false },
      { id: 'bd-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt Căn Hộ (285 kWh theo bậc thang EVN)', usage: 285, unit: 'kWh', unit_price: 2650, total_line_amount: 755250, ai_anomaly: false },
      { id: 'bd-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt (AI Cảnh Báo: 38m³ - Tăng đột biến 110% do rò rỉ van vòi rửa)', usage: 38, unit: 'm³', unit_price: 17700, total_line_amount: 672600, ai_anomaly: true, anomaly_reason: 'Lưu lượng tiêu thụ nước tăng 110% so với trung bình 3 tháng trước (18 m³). AI xác định có rò rỉ vòi rửa chén.' },
      { id: 'bd-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Ô Tô Định Danh Hầm B2 (51K-889.99)', usage: 1, unit: 'xe', unit_price: 1200000, total_line_amount: 1200000, ai_anomaly: false },
      { id: 'bd-05', service_type: 'Parking', service_name: 'Phí Giữ Xe Máy RFID Hầm B1 (59P1-886.79)', usage: 1, unit: 'xe', unit_price: 120000, total_line_amount: 120000, ai_anomaly: false }
    ]
  },
  {
    id: 'bill-2026-07-ch06',
    apartment_code: 'CH-06',
    owner_name: 'Trần Hữu Lực',
    billing_month: 'Tháng 07/2026',
    due_date: '2026-07-30 23:59:59+07',
    total_amount: 2370000,
    status: 'Paid',
    payment_method: 'VNPAY',
    transaction_ref: 'VNP98321045',
    payment_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_CH06_PAID_07',
    has_ai_anomaly: false,
    created_at: '2026-07-05 08:00:00+07',
    paid_at: '2026-07-28 14:20:00+07',
    details: [
      { id: 'bd-07-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý Vận Hành (42.0 m2 x 18.000 đ)', usage: 42.0, unit: 'm²', unit_price: 18000, total_line_amount: 756000, ai_anomaly: false },
      { id: 'bd-07-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt Căn Hộ (260 kWh)', usage: 260, unit: 'kWh', unit_price: 2650, total_line_amount: 689000, ai_anomaly: false },
      { id: 'bd-07-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt Căn Hộ (17 m³)', usage: 17, unit: 'm³', unit_price: 17700, total_line_amount: 300900, ai_anomaly: false },
      { id: 'bd-07-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Ô Tô Định Danh Hầm B2 (51K-889.99)', usage: 1, unit: 'xe', unit_price: 1200000, total_line_amount: 1200000, ai_anomaly: false },
      { id: 'bd-07-05', service_type: 'Parking', service_name: 'Phí Giữ Xe Máy RFID Hầm B1 (59P1-886.79)', usage: 1, unit: 'xe', unit_price: 120000, total_line_amount: 120000, ai_anomaly: false }
    ]
  },
  {
    id: 'bill-2026-06-ch06',
    apartment_code: 'CH-06',
    owner_name: 'Trần Hữu Lực',
    billing_month: 'Tháng 06/2026',
    due_date: '2026-06-30 23:59:59+07',
    total_amount: 2320000,
    status: 'Paid',
    payment_method: 'VIETQR',
    transaction_ref: 'BIDV-FT-884219',
    payment_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?data=VNPAY_SKYLINE_CH06_PAID_06',
    has_ai_anomaly: false,
    created_at: '2026-06-05 08:00:00+07',
    paid_at: '2026-06-25 10:15:00+07',
    details: [
      { id: 'bd-06-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý Vận Hành (42.0 m2 x 18.000 đ)', usage: 42.0, unit: 'm²', unit_price: 18000, total_line_amount: 756000, ai_anomaly: false },
      { id: 'bd-06-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt Căn Hộ (250 kWh)', usage: 250, unit: 'kWh', unit_price: 2650, total_line_amount: 662500, ai_anomaly: false },
      { id: 'bd-06-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt Căn Hộ (16 m³)', usage: 16, unit: 'm³', unit_price: 17700, total_line_amount: 283200, ai_anomaly: false },
      { id: 'bd-06-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Ô Tô Định Danh Hầm B2 (51K-889.99)', usage: 1, unit: 'xe', unit_price: 1200000, total_line_amount: 1200000, ai_anomaly: false },
      { id: 'bd-06-05', service_type: 'Parking', service_name: 'Phí Giữ Xe Máy RFID Hầm B1 (59P1-886.79)', usage: 1, unit: 'xe', unit_price: 120000, total_line_amount: 120000, ai_anomaly: false }
    ]
  },

  // CÁC CĂN HỘ TÒA BS-07 (The Tropical Beverly Solari)
  {
    id: 'bill-2026-08-ch01',
    apartment_code: 'CH-01',
    owner_name: 'Phạm Nhật Vượng',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-30 23:59:59+07',
    total_amount: 4250000,
    status: 'Paid',
    payment_method: 'BANK_TRANSFER',
    transaction_ref: 'BQL-REC-108291',
    has_ai_anomaly: false,
    created_at: '2026-08-05 08:00:00+07',
    paid_at: '2026-08-10 16:30:00+07',
    details: [
      { id: 'bd-ch01-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý Vận Hành (85.0 m2 x 18.000 đ)', usage: 85.0, unit: 'm²', unit_price: 18000, total_line_amount: 1530000, ai_anomaly: false },
      { id: 'bd-ch01-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt Căn Hộ (420 kWh)', usage: 420, unit: 'kWh', unit_price: 2650, total_line_amount: 1113000, ai_anomaly: false },
      { id: 'bd-ch01-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt Căn Hộ (22 m³)', usage: 22, unit: 'm³', unit_price: 17700, total_line_amount: 389400, ai_anomaly: false },
      { id: 'bd-ch01-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Ô Tô 2 Vị Trí Hầm B2', usage: 2, unit: 'xe', unit_price: 1200000, total_line_amount: 2400000, ai_anomaly: false }
    ]
  },
  {
    id: 'bill-2026-08-ch02',
    apartment_code: 'CH-02',
    owner_name: 'Lê Thị Mai',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-02 23:59:59+07', // Quá hạn 12 ngày -> Phục vụ B3 Tone 2 (Chuẩn mực)
    total_amount: 1850000,
    status: 'Unpaid',
    has_ai_anomaly: false,
    created_at: '2026-08-05 08:00:00+07',
    details: [
      { id: 'bd-ch02-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý Vận Hành (45.0 m2 x 18.000 đ)', usage: 45.0, unit: 'm²', unit_price: 18000, total_line_amount: 810000, ai_anomaly: false },
      { id: 'bd-ch02-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt Căn Hộ (210 kWh)', usage: 210, unit: 'kWh', unit_price: 2650, total_line_amount: 556500, ai_anomaly: false },
      { id: 'bd-ch02-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt Căn Hộ (14 m³)', usage: 14, unit: 'm³', unit_price: 17700, total_line_amount: 247800, ai_anomaly: false },
      { id: 'bd-ch02-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Máy RFID', usage: 1, unit: 'xe', unit_price: 120000, total_line_amount: 120000, ai_anomaly: false }
    ]
  },
  {
    id: 'bill-2026-08-ch03',
    apartment_code: 'CH-03',
    owner_name: 'Nguyễn Văn An',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-07-20 23:59:59+07', // Quá hạn 25 ngày -> Phục vụ B3 Tone 3 (Nghiêm khắc)
    total_amount: 3120000,
    status: 'Unpaid',
    has_ai_anomaly: false,
    created_at: '2026-08-05 08:00:00+07',
    details: [
      { id: 'bd-ch03-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý Vận Hành (58.0 m2 x 18.000 đ)', usage: 58.0, unit: 'm²', unit_price: 18000, total_line_amount: 1044000, ai_anomaly: false },
      { id: 'bd-ch03-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt Căn Hộ (290 kWh)', usage: 290, unit: 'kWh', unit_price: 2650, total_line_amount: 768500, ai_anomaly: false },
      { id: 'bd-ch03-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt Căn Hộ (18 m³)', usage: 18, unit: 'm³', unit_price: 17700, total_line_amount: 318600, ai_anomaly: false },
      { id: 'bd-ch03-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Ô Tô Hầm B2', usage: 1, unit: 'xe', unit_price: 1200000, total_line_amount: 1200000, ai_anomaly: false }
    ]
  },

  // CÁC CĂN HỘ TÒA BS-08
  {
    id: 'bill-2026-08-bs08-1205',
    apartment_code: 'BS08-1205',
    owner_name: 'Hoàng Minh Tuấn',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-11 23:59:59+07', // Quá hạn 3 ngày -> Phục vụ B3 Tone 1 (Nhẹ nhàng)
    total_amount: 2890000,
    status: 'Unpaid',
    has_ai_anomaly: false,
    created_at: '2026-08-05 08:00:00+07',
    details: [
      { id: 'bd-bs08-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý (62.0 m2 x 18.000 đ)', usage: 62.0, unit: 'm²', unit_price: 18000, total_line_amount: 1116000, ai_anomaly: false },
      { id: 'bd-bs08-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt (280 kWh)', usage: 280, unit: 'kWh', unit_price: 2650, total_line_amount: 742000, ai_anomaly: false },
      { id: 'bd-bs08-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt (18 m³)', usage: 18, unit: 'm³', unit_price: 17700, total_line_amount: 318600, ai_anomaly: false },
      { id: 'bd-bs08-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Ô Tô', usage: 1, unit: 'xe', unit_price: 1200000, total_line_amount: 1200000, ai_anomaly: false }
    ]
  },
  {
    id: 'bill-2026-08-bs08-0803',
    apartment_code: 'BS08-0803',
    owner_name: 'Trịnh Hoài Nam',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-06-30 23:59:59+07', // Quá hạn 45 ngày -> Nợ lâu nhất BS-08
    total_amount: 4560000,
    status: 'Unpaid',
    has_ai_anomaly: false,
    created_at: '2026-08-05 08:00:00+07',
    details: [
      { id: 'bd-bs08-0803-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý (78.0 m2 x 18.000 đ)', usage: 78.0, unit: 'm²', unit_price: 18000, total_line_amount: 1404000, ai_anomaly: false },
      { id: 'bd-bs08-0803-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt (410 kWh)', usage: 410, unit: 'kWh', unit_price: 2650, total_line_amount: 1086500, ai_anomaly: false },
      { id: 'bd-bs08-0803-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt (24 m³)', usage: 24, unit: 'm³', unit_price: 17700, total_line_amount: 424800, ai_anomaly: false },
      { id: 'bd-bs08-0803-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Ô Tô & Xe Máy', usage: 2, unit: 'xe', unit_price: 1320000, total_line_amount: 1320000, ai_anomaly: false }
    ]
  },
  {
    id: 'bill-2026-08-bs08-0501',
    apartment_code: 'BS08-0501',
    owner_name: 'Đặng Thu Thảo',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-30 23:59:59+07',
    total_amount: 2150000,
    status: 'Paid',
    payment_method: 'VNPAY',
    transaction_ref: 'VNP7718290',
    has_ai_anomaly: false,
    created_at: '2026-08-05 08:00:00+07',
    paid_at: '2026-08-08 11:20:00+07',
    details: [
      { id: 'bd-bs08-0501-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý (50.0 m2 x 18.000 đ)', usage: 50.0, unit: 'm²', unit_price: 18000, total_line_amount: 900000, ai_anomaly: false },
      { id: 'bd-bs08-0501-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt (240 kWh)', usage: 240, unit: 'kWh', unit_price: 2650, total_line_amount: 636000, ai_anomaly: false },
      { id: 'bd-bs08-0501-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt (15 m³)', usage: 15, unit: 'm³', unit_price: 17700, total_line_amount: 265500, ai_anomaly: false },
      { id: 'bd-bs08-0501-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Máy (2 xe)', usage: 2, unit: 'xe', unit_price: 120000, total_line_amount: 240000, ai_anomaly: false }
    ]
  },

  // CÁC CĂN HỘ TÒA BS-09
  {
    id: 'bill-2026-08-bs09-0402',
    apartment_code: 'BS09-0402',
    owner_name: 'Bùi Phương Nga',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-30 23:59:59+07',
    total_amount: 2400000,
    status: 'Paid',
    payment_method: 'MOMO',
    transaction_ref: 'MM9910482',
    has_ai_anomaly: false,
    created_at: '2026-08-05 08:00:00+07',
    paid_at: '2026-08-09 15:40:00+07',
    details: [
      { id: 'bd-bs09-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý (55.0 m2 x 18.000 đ)', usage: 55.0, unit: 'm²', unit_price: 18000, total_line_amount: 990000, ai_anomaly: false },
      { id: 'bd-bs09-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt (250 kWh)', usage: 250, unit: 'kWh', unit_price: 2650, total_line_amount: 662500, ai_anomaly: false },
      { id: 'bd-bs09-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt (16 m³)', usage: 16, unit: 'm³', unit_price: 17700, total_line_amount: 283200, ai_anomaly: false },
      { id: 'bd-bs09-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Ô Tô', usage: 1, unit: 'xe', unit_price: 1200000, total_line_amount: 1200000, ai_anomaly: false }
    ]
  },
  {
    id: 'bill-2026-08-bs09-1104',
    apartment_code: 'BS09-1104',
    owner_name: 'Phan Thanh Sơn',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-30 23:59:59+07',
    total_amount: 1950000,
    status: 'Unpaid',
    has_ai_anomaly: false,
    created_at: '2026-08-05 08:00:00+07',
    details: [
      { id: 'bd-bs09-1104-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý (48.0 m2 x 18.000 đ)', usage: 48.0, unit: 'm²', unit_price: 18000, total_line_amount: 864000, ai_anomaly: false },
      { id: 'bd-bs09-1104-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt (220 kWh)', usage: 220, unit: 'kWh', unit_price: 2650, total_line_amount: 583000, ai_anomaly: false },
      { id: 'bd-bs09-1104-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt (14 m³)', usage: 14, unit: 'm³', unit_price: 17700, total_line_amount: 247800, ai_anomaly: false },
      { id: 'bd-bs09-1104-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Máy (2 xe)', usage: 2, unit: 'xe', unit_price: 120000, total_line_amount: 240000, ai_anomaly: false }
    ]
  },

  // CÁC CĂN HỘ TÒA BS-10
  {
    id: 'bill-2026-08-bs10-1801',
    apartment_code: 'BS10-1801',
    owner_name: 'Vũ Đức Đam',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-30 23:59:59+07',
    total_amount: 3800000,
    status: 'Paid',
    payment_method: 'BANK_TRANSFER',
    transaction_ref: 'BQL-REC-884102',
    has_ai_anomaly: false,
    created_at: '2026-08-05 08:00:00+07',
    paid_at: '2026-08-07 09:15:00+07',
    details: [
      { id: 'bd-bs10-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý (82.0 m2 x 18.000 đ)', usage: 82.0, unit: 'm²', unit_price: 18000, total_line_amount: 1476000, ai_anomaly: false },
      { id: 'bd-bs10-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt (390 kWh)', usage: 390, unit: 'kWh', unit_price: 2650, total_line_amount: 1033500, ai_anomaly: false },
      { id: 'bd-bs10-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt (20 m³)', usage: 20, unit: 'm³', unit_price: 17700, total_line_amount: 354000, ai_anomaly: false },
      { id: 'bd-bs10-04', service_type: 'Parking', service_name: 'Phí Giữ Xe Ô Tô Hầm B2', usage: 1, unit: 'xe', unit_price: 1200000, total_line_amount: 1200000, ai_anomaly: false }
    ]
  },
  {
    // Căn hộ mẫu phát hiện lỗi sai đơn giá và giảm chỉ số (phục vụ B1 phát hiện bất thường!)
    id: 'bill-2026-08-bs10-0902',
    apartment_code: 'BS10-0902',
    owner_name: 'Ngô Bảo Châu',
    billing_month: 'Tháng 08/2026',
    due_date: '2026-08-30 23:59:59+07',
    total_amount: 2650000,
    status: 'Draft',
    has_ai_anomaly: true,
    created_at: '2026-08-05 08:00:00+07',
    details: [
      { id: 'bd-bs10-0902-01', service_type: 'Management_Fee', service_name: 'Phí Quản Lý Vận Hành (50.0 m2 x 12.000 đ - Sai đơn giá)', usage: 50.0, unit: 'm²', unit_price: 12000, total_line_amount: 600000, ai_anomaly: true, anomaly_reason: 'Sai đơn giá định mức: Đơn giá phí quản lý chuẩn là 18.000 đ/m², hệ thống đang ghi 12.000 đ/m².' },
      { id: 'bd-bs10-0902-02', service_type: 'Electricity', service_name: 'Điện Sinh Hoạt Căn Hộ (25 kWh - Giảm đột biến 90%)', usage: 25, unit: 'kWh', unit_price: 2650, total_line_amount: 66250, ai_anomaly: true, anomaly_reason: 'Chỉ số điện giảm bất thường 90% so với kỳ trước (260 kWh). Cần kiểm tra công tơ kẹt số.' },
      { id: 'bd-bs10-0902-03', service_type: 'Water', service_name: 'Nước Sinh Hoạt Căn Hộ (14 m³)', usage: 14, unit: 'm³', unit_price: 17700, total_line_amount: 247800, ai_anomaly: false }
    ]
  }
];

const INITIAL_METER_READINGS: MeterReadingRecord[] = [
  {
    id: 'mr-elec-2026-08-ch06',
    apartment_code: 'CH-06',
    meter_type: 'ELECTRIC',
    reading: 4285,
    previous_reading: 4000,
    consumption: 285,
    period: 'Tháng 08/2026',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    confidence: 0.96,
    verified_by: 'Lê Quốc Tuấn (KTV)',
    recorded_at: '2026-08-01T09:30:00+07:00',
    status: 'CONFIRMED'
  },
  {
    id: 'mr-water-2026-08-ch06',
    apartment_code: 'CH-06',
    meter_type: 'WATER',
    reading: 156,
    previous_reading: 118,
    consumption: 38,
    period: 'Tháng 08/2026',
    image_url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800',
    confidence: 0.94,
    verified_by: 'Lê Quốc Tuấn (KTV)',
    recorded_at: '2026-08-01T09:35:00+07:00',
    status: 'CONFIRMED'
  },
  {
    id: 'mr-elec-2026-07-ch06',
    apartment_code: 'CH-06',
    meter_type: 'ELECTRIC',
    reading: 4000,
    previous_reading: 3740,
    consumption: 260,
    period: 'Tháng 07/2026',
    confidence: 0.98,
    verified_by: 'Trần Đình Trọng (KTV)',
    recorded_at: '2026-07-01T09:30:00+07:00',
    status: 'CONFIRMED'
  },
  {
    id: 'mr-water-2026-07-ch06',
    apartment_code: 'CH-06',
    meter_type: 'WATER',
    reading: 118,
    previous_reading: 101,
    consumption: 17,
    period: 'Tháng 07/2026',
    confidence: 0.97,
    verified_by: 'Trần Đình Trọng (KTV)',
    recorded_at: '2026-07-01T09:35:00+07:00',
    status: 'CONFIRMED'
  },
  {
    id: 'mr-elec-2026-06-ch06',
    apartment_code: 'CH-06',
    meter_type: 'ELECTRIC',
    reading: 3740,
    previous_reading: 3490,
    consumption: 250,
    period: 'Tháng 06/2026',
    confidence: 0.99,
    verified_by: 'Lê Quốc Tuấn (KTV)',
    recorded_at: '2026-06-01T09:30:00+07:00',
    status: 'CONFIRMED'
  },
  {
    id: 'mr-water-2026-06-ch06',
    apartment_code: 'CH-06',
    meter_type: 'WATER',
    reading: 101,
    previous_reading: 85,
    consumption: 16,
    period: 'Tháng 06/2026',
    confidence: 0.98,
    verified_by: 'Lê Quốc Tuấn (KTV)',
    recorded_at: '2026-06-01T09:35:00+07:00',
    status: 'CONFIRMED'
  }
];

const INITIAL_SMART_DEVICES: SmartDeviceRecord[] = [
  { id: 'dev-lock-01', apartment_code: 'CH-06', name: 'Khóa Thông Minh FaceID Cửa Chính', device_type: 'door', status: 'locked', set_value: 0, location_x: 15.5, location_y: 85.0 },
  { id: 'dev-light-01', apartment_code: 'CH-06', name: 'Hệ Thống Đèn Phòng Khách Luxury', device_type: 'light', status: 'on', set_value: 100, location_x: 45.0, location_y: 50.0 },
  { id: 'dev-light-02', apartment_code: 'CH-06', name: 'Đèn Phòng Ngủ Master', device_type: 'light', status: 'on', set_value: 80, location_x: 70.0, location_y: 35.0 },
  { id: 'dev-light-03', apartment_code: 'CH-06', name: 'Đèn Không Gian Bếp', device_type: 'light', status: 'on', set_value: 100, location_x: 30.0, location_y: 65.0 },
  { id: 'dev-ac-01', apartment_code: 'CH-06', name: 'Điều Hòa Daikin Inverter 24°C', device_type: 'ac', status: 'on', set_value: 24.0, location_x: 60.0, location_y: 30.0 },
  { id: 'dev-curtain-01', apartment_code: 'CH-06', name: 'Rèm Cửa Tự Động Ban Công', device_type: 'curtain', status: 'on', set_value: 100, location_x: 85.0, location_y: 50.0 },
  { id: 'dev-sensor-01', apartment_code: 'CH-06', name: 'Cảm Biến Dòng Chảy & Rò Rỉ Nước AI', device_type: 'sensor', status: 'active', set_value: 0, location_x: 25.0, location_y: 20.0 },
  { id: 'dev-sensor-02', apartment_code: 'CH-06', name: 'Cảm Biến Bụi Mịn AQI Daikin Streamer', device_type: 'sensor', status: 'active', set_value: 32, location_x: 50.0, location_y: 45.0 }
];

const INITIAL_RULES: SmartAutomationRuleRecord[] = [
  { id: 'rule_morning', apartment_code: 'CH-06', title: 'Bình Minh Thức Giấc & Nắng Sớm', trigger_time: '06:30', trigger_type: 'TIME', trigger_label: 'Hẹn giờ 06:30 sáng', description: 'Tự động mở rèm ban công đón ánh sáng tự nhiên, tắt điều hòa và tắt đèn phòng ngủ.', action_summary: 'Mở rèm 100% • Tắt Đèn PN Master • Tắt AC', enabled: true, repeat_days: 'Hàng ngày', icon: 'sun' },
  { id: 'rule_sunset', apartment_code: 'CH-06', title: 'Hoàng Hôn & Chiếu Sáng Chào Đón', trigger_time: '18:30', trigger_type: 'TIME', trigger_label: 'Hẹn giờ 18:30 chiều', description: 'Tự động bật hệ thống đèn phòng khách và đèn bếp đón các thành viên trở về nhà.', action_summary: 'Bật Đèn PK 100% • Bật Đèn Bếp • Bật AC 24°C', enabled: true, repeat_days: 'Hàng ngày', icon: 'moon' },
  { id: 'rule_night_secure', apartment_code: 'CH-06', title: 'An Ninh Chốt Khóa Đêm & Chế Độ Ngủ', trigger_time: '23:00', trigger_type: 'TIME', trigger_label: 'Hẹn giờ 23:00 đêm', description: 'Tự động kiểm tra chốt an toàn FaceID cửa chính, đóng kín rèm và chuyển điều hòa sang 26°C.', action_summary: 'Khóa Chốt FaceID • Đóng Rèm • AC 26°C (Sleep) • Tắt Đèn PK', enabled: true, repeat_days: 'Hàng ngày', icon: 'shield' },
  { id: 'rule_water_guard', apartment_code: 'CH-06', title: 'AI Canh Gác Rò Rỉ Nước Ban Đêm', trigger_time: '02:00 - 04:00', trigger_type: 'SENSOR', trigger_label: 'Cảm biến lưu lượng AI đêm', description: 'Tự động giám sát lưu lượng dòng chảy van cấp nước. Cảnh báo khẩn nếu có thất thoát vòi rửa.', action_summary: 'Quét lưu lượng 0.00 L/h • Cảnh báo loa Hub & App', enabled: true, repeat_days: 'Khung giờ ngủ sâu (02:00 - 04:00)', icon: 'droplet' }
];

const INITIAL_GUEST_PINS: SmartGuestPinRecord[] = [
  { id: 'pin-01', apartment_code: 'CH-06', pin_code: '482910', label: 'Shipper Giao Hàng Shopee', created_by: 'Trần Hữu Lực', status: 'ACTIVE', max_uses: 1, used_count: 0, expires_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString() },
  { id: 'pin-02', apartment_code: 'CH-06', pin_code: '718293', label: 'Khách Bạn Thân Cuối Tuần', created_by: 'Trần Hữu Lực', status: 'ACTIVE', max_uses: 5, used_count: 2, expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString() }
];

const INITIAL_DOOR_LOGS: SmartDoorAccessLogRecord[] = [
  { id: 'log-01', apartment_code: 'CH-06', user_name: 'Trần Hữu Lực', role: 'Chủ hộ', method: 'FACE_ID', status: 'SUCCESS', detail: 'Nhận diện khuôn mặt FaceID 3D độ khớp 99.8%', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'log-02', apartment_code: 'CH-06', user_name: 'Nguyễn Hữu Nhựt', role: 'Thành viên', method: 'NFC_CARD', status: 'SUCCESS', detail: 'Quẹt thẻ cư dân Skyline RFID chip mifare', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }
];

const INITIAL_FACILITIES: FacilityRecord[] = [
  { id: 'fac-1', name: 'Hồ Bơi Vô Cực Chân Mây (Skyline Horizon Pool)', category: 'Hồ bơi', floor_number: 25, location_detail: 'Tầng 25 (Sân Thượng Chung Cư)', operating_hours: '06:00 - 22:00', pricing: 'Miễn phí theo Thẻ cư dân (20 lượt/tháng)', max_quota_per_month: 20, rating_score: 4.9, current_occupancy: 14, max_capacity: 40, hero_image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800' },
  { id: 'fac-resort-pool', name: 'Bể Bơi Nhiệt Đới & Ốc Đảo Resort (Nội Khu The Tropical)', category: 'Hồ bơi', floor_number: 1, location_detail: 'Tầng 1 (Công Viên Nội Khu The Tropical)', operating_hours: '06:00 - 22:00', pricing: 'Miễn phí theo Thẻ cư dân (Vào tự do FaceID / Thẻ)', max_quota_per_month: 30, rating_score: 5.0, current_occupancy: 18, max_capacity: 60, hero_image_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800' },
  { id: 'fac-3', name: 'Trung Tâm Thể Hình Technogym (Fitness & Yoga)', category: 'Gym', floor_number: 3, location_detail: 'Tầng 3 (Khu Thể Thao Đa Năng)', operating_hours: 'Mở cửa 24/7', pricing: 'Miễn phí theo Thẻ cư dân', max_quota_per_month: 30, rating_score: 5.0, current_occupancy: 8, max_capacity: 35, hero_image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' },
  { id: 'fac-sport-court', name: 'Cụm Sân Thể Thao Đa Năng (Pickleball & Tennis - Công Viên Nội Khu)', category: 'Sân thể thao', floor_number: 1, location_detail: 'Tầng 1 (Công Viên Thể Thao Ngoài Trời)', operating_hours: '06:00 - 22:00', pricing: 'Miễn phí theo Thẻ cư dân (Đặt lịch trước 2 giờ)', max_quota_per_month: 15, rating_score: 4.95, current_occupancy: 4, max_capacity: 16, hero_image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800' },
  { id: 'fac-sauna', name: 'Phòng Xông Hơi Đá Muối Himalaya (Private VIP)', category: 'Xông hơi', floor_number: 3, location_detail: 'Tầng 3 (Khu Chăm Sóc Sức Khỏe Riêng Tư)', operating_hours: '08:00 - 22:00', pricing: '500.000 đ / giờ (Phòng gia đình VIP)', max_quota_per_month: 10, rating_score: 5.0, current_occupancy: 1, max_capacity: 4, hero_image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800' },
  { id: 'fac-kids', name: 'Khu Vui Chơi Trẻ Em Sky Kids Zone', category: 'Khu trẻ em', floor_number: 1, location_detail: 'Tầng 1 (Sảnh Thương Mại Tòa Chung Cư)', operating_hours: '07:00 - 21:00', pricing: 'Miễn phí theo Thẻ cư dân (Có người lớn đi kèm)', max_quota_per_month: 30, rating_score: 4.9, current_occupancy: 6, max_capacity: 25, hero_image_url: 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=800' },
  { id: 'fac-2', name: 'Vườn Tiệc Nướng BBQ Panoramic', category: 'BBQ', floor_number: 25, location_detail: 'Tầng 25 (Sân Thượng Khu Vườn Nhật Bản)', operating_hours: '17:00 - 23:00', pricing: '600.000 đ / ca (Bao gồm set bếp Weber & dọn dẹp)', max_quota_per_month: 4, rating_score: 4.8, current_occupancy: 2, max_capacity: 6, hero_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800' },
  { id: 'fac-restaurant', name: 'Nhà Hàng Ẩm Thực Skyline (Tầng 1 - Sảnh The Tropical BS-07)', category: 'Nhà hàng', floor_number: 1, location_detail: 'Tầng 1 (Sảnh Thương Mại The Tropical BS-07)', operating_hours: '06:30 - 22:30', pricing: 'Phục vụ cư dân & Khách theo thực đơn (Ưu đãi 10% thẻ cư dân)', max_quota_per_month: 50, rating_score: 4.9, current_occupancy: 22, max_capacity: 80, hero_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' }
];

const INITIAL_FACILITY_BOOKINGS: FacilityBookingRecord[] = [
  {
    id: 'BK-SAUNA-9821',
    apartment_code: 'CH-06',
    facility_id: 'fac-sauna',
    booker_id: 'user-owner-1',
    booker_name: 'Trần Hữu Lực',
    ticket_code: 'SKY-SAUNA-CH06-7799',
    booking_date: new Date().toISOString().split('T')[0],
    time_slot: '18:00 - 20:00 (2 Tiếng - Tối nay)',
    guest_count: 2,
    duration_hours: 2,
    deposit_amount: 1000000,
    pricing: '500.000 đ / giờ',
    payment_method: 'Trừ vào hóa đơn sinh hoạt tháng tới',
    status: 'CONFIRMED',
    notes: 'Gia đình 2 người, chuẩn bị trước tinh dầu sả chanh',
    created_at: new Date().toISOString()
  }
];

const INITIAL_RESIDENT_BOOKINGS: ResidentServiceBookingRecord[] = [];

const INITIAL_VISITOR_PASSES: VisitorPassRecord[] = [
  {
    id: 'SKY-PASS-8492',
    apartment_code: 'CH-06',
    host_user_id: 'user-owner-1',
    host_name: 'Trần Hữu Lực',
    host_phone: '0364967082',
    tower_name: 'Tropical BS-07',
    visitor_name: 'Trần Quốc Bảo',
    visitor_phone: '0903123456',
    license_plate: '51G-888.88',
    entry_type: 'MULTI',
    purpose: 'VISITOR',
    purpose_label: 'Khách Thăm Căn Hộ',
    valid_hours: 8,
    qr_data: '{"skyline_pass":true,"passId":"SKY-PASS-8492","aptCode":"CH-06","hostName":"Trần Hữu Lực","visitorName":"Trần Quốc Bảo"}',
    pin_code: '849201',
    status: 'CHECKED_IN',
    note: 'Khách đối tác công việc lên căn CH-06 (Tòa BS-07)',
    valid_until: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    checked_in_at: '10:15 02/10/2026'
  },
  {
    id: 'SKY-PASS-6521',
    apartment_code: 'CH-06',
    host_user_id: 'user-owner-1',
    host_name: 'Trần Hữu Lực',
    host_phone: '0364967082',
    tower_name: 'Tropical BS-07',
    visitor_name: 'Phạm Minh Tuấn',
    visitor_phone: '0918765432',
    license_plate: '59P1-999.99',
    entry_type: 'MULTI',
    purpose: 'VISITOR',
    purpose_label: 'Khách Thăm Căn Hộ',
    valid_hours: 4,
    qr_data: '{"skyline_pass":true,"passId":"SKY-PASS-6521","aptCode":"CH-06","hostName":"Trần Hữu Lực","visitorName":"Phạm Minh Tuấn"}',
    pin_code: '652190',
    status: 'ACTIVE',
    note: 'Bạn bè đến thăm gia đình',
    valid_until: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString()
  }
];

const INITIAL_VISITOR_GATE_LOGS: VisitorGateLogRecord[] = [
  {
    id: 'vgl-01',
    pass_id: 'SKY-PASS-8492',
    apartment_code: 'CH-06',
    host_name: 'Trần Hữu Lực',
    visitor_name: 'Trần Quốc Bảo',
    license_plate: '51G-888.88',
    action: 'CHECK_IN',
    result: 'VALID',
    checkpoint: 'Cổng Barrier Hầm B1',
    notes: 'Khách đối tác đã check-in thành công qua mã QR',
    timestamp: new Date().toISOString()
  }
];

const INITIAL_COMMUNITY_POSTS: CommunityPostRecord[] = [
  {
    id: 'post-1',
    author_id: 'user-manager-1',
    author_name: 'Ban Quản Lý Tòa Nhà SKYLINE',
    author_role: 'BQL',
    title: 'Thông báo lịch bảo dưỡng định kỳ hệ thống thang máy Otis Tòa BS-07',
    content: 'Ban Quản lý xin thông báo kế hoạch kiểm tra kỹ thuật định kỳ thang máy số 02 vào ngày 28/08/2026 từ 09:00 - 11:30. Kính mong Quý cư dân sử dụng thang số 01 và 03 trong thời gian trên.',
    category: 'Bảo trì',
    ai_moderation: 'Clean',
    ai_sentiment: 0.85,
    tags: ['Bảo trì', 'Thông báo BQL', 'Thang máy'],
    likes: 42,
    comments_count: 5,
    is_pinned: true,
    created_at: '2026-08-25 10:00:00+07'
  },
  {
    id: 'post-2',
    author_id: 'user-owner-1',
    author_name: 'Trần Hữu Lực (Căn CH-06)',
    author_role: 'Cư dân',
    apt_code: 'CH-06',
    title: 'Trao đổi lại bộ bàn ghế đọc sách ban công bằng gỗ sồi còn mới 95%',
    content: 'Gia đình mình vừa thay đổi nội thất nên muốn nhượng lại bộ bàn ghế ban công gọn nhẹ cho bác nào có nhu cầu, có thể qua xem trực tiếp tại căn CH-06.',
    category: 'Cộng đồng',
    ai_moderation: 'Clean',
    ai_sentiment: 0.92,
    tags: ['Rao vặt', 'Nội thất', 'Cộng đồng'],
    likes: 18,
    comments_count: 3,
    is_pinned: false,
    created_at: '2026-08-26 11:30:00+07'
  }
];

const INITIAL_VOTING_TOPICS: VotingTopicRecord[] = [
  {
    id: 'vote-01',
    code: 'BQ-2026-01',
    title: 'Biểu quyết Thông qua Phương án Nâng cấp Hệ thống Kiểm soát Xe Tự Động Hầm B1 - B2',
    description: 'Chiến dịch lấy ý kiến hợp pháp của các Chủ sở hữu căn hộ về việc trích Quỹ Bảo trì để trang bị camera AI LPR đọc biển số tự động tốc độ cao và mở rộng làn xe máy giờ cao điểm tại Hầm B1/B2 Tòa BS-07.',
    legal_type: 'Đóng góp Quỹ Bảo trì',
    created_by: 'Ban Quản Trị & Kỹ Thuật Tòa Nhà',
    deadline: '2026-10-15 23:59:59+07',
    status: 'OPEN',
    is_owner_only: true,
    total_eligible_apartments: 200,
    total_votes: 1,
    summary_report: 'Nâng cấp cảm biến RFID tầm xa và camera AI giúp giải phóng xe trong dưới 0.3s/lượt.',
    created_at: '2026-08-20 08:00:00+07',
    options: [
      { id: 'opt-1', text: 'Đồng ý phương án nâng cấp (Dự toán 150 triệu VNĐ từ Quỹ Bảo trì)', votes: 1 },
      { id: 'opt-2', text: 'Không đồng ý, giữ nguyên hiện trạng kiểm soát thủ công', votes: 0 },
      { id: 'opt-3', text: 'Đồng ý nhưng yêu cầu điều chỉnh giảm dự toán xuống dưới 120 triệu VNĐ', votes: 0 }
    ]
  }
];

const INITIAL_VOTING_RECORDS: VotingRecordItem[] = [
  {
    id: 'vr-01',
    topic_id: 'vote-01',
    user_id: 'user-owner-1',
    apartment_code: 'CH-06',
    option_id: 'opt-1',
    voted_at: '2026-08-21 14:30:00+07'
  }
];

const INITIAL_FACE_PROFILES: FaceEnrollmentRecord[] = [];
const INITIAL_EKYC_SUBMISSIONS: EkycSubmissionRecord[] = [
  {
    id: 'EKYC-120',
    userId: 'user-owner-1',
    fullName: 'Trần Hữu Lực',
    roleLabel: 'Chủ Hộ (Căn CH-06 - Tòa BS-07)',
    apartmentCode: 'CH-06',
    phone: '0364967082',
    email: 'huuluc04@gmail.com',
    idCardNo: '067204000961',
    idDate: '18/08/2022',
    idPlace: 'Cục Cảnh sát QLHC về TTXH',
    dob: '18/08/2004',
    pob: 'Triệu Trạch, Triệu Phong, Quảng Trị',
    faceScore: 99.50,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    submittedAt: '2026-09-02 14:30:00+07',
    status: 'APPROVED',
    reviewedAt: '2026-09-02 15:10:00+07',
    reviewedBy: 'Ban Quản Lý Skyline (Trực Ban)'
  }
];

// ----------------------------------------------------------------------------
// SINGLETON DATABASE ENGINE CLASS
// ----------------------------------------------------------------------------

export class SkylineDatabase {
  public condominiums: DatabaseTable<CondominiumRecord>;
  public blocks: DatabaseTable<BlockRecord>;
  public floors: DatabaseTable<FloorRecord>;
  public apartments: DatabaseTable<ApartmentRecord>;
  public users: DatabaseTable<UserRecord>;
  public apartmentMembers: DatabaseTable<ApartmentMemberRecord>;
  public technicians: DatabaseTable<TechnicianRecord>;
  public tickets: DatabaseTable<ServiceTicketRecord>;
  public bills: DatabaseTable<BillRecord>;
  public smartDevices: DatabaseTable<SmartDeviceRecord>;
  public automationRules: DatabaseTable<SmartAutomationRuleRecord>;
  public smartGuestPins: DatabaseTable<SmartGuestPinRecord>;
  public smartDoorLogs: DatabaseTable<SmartDoorAccessLogRecord>;
  public facilities: DatabaseTable<FacilityRecord>;
  public facilityBookings: DatabaseTable<FacilityBookingRecord>;
  public residentBookings: DatabaseTable<ResidentServiceBookingRecord>;
  public visitorPasses: DatabaseTable<VisitorPassRecord>;
  public visitorGateLogs: DatabaseTable<VisitorGateLogRecord>;
  public communityPosts: DatabaseTable<CommunityPostRecord>;
  public votingTopics: DatabaseTable<VotingTopicRecord>;
  public votingRecords: DatabaseTable<VotingRecordItem>;
  public faceEnrollments: DatabaseTable<FaceEnrollmentRecord>;
  public ekycSubmissions: DatabaseTable<EkycSubmissionRecord>;
  public meterReadings: DatabaseTable<MeterReadingRecord>;

  constructor() {
    this.condominiums = new DatabaseTable(INITIAL_CONDOMINIUMS, 'id');
    this.blocks = new DatabaseTable(INITIAL_BLOCKS, 'id');
    this.floors = new DatabaseTable(INITIAL_FLOORS, 'floor_number');
    this.apartments = new DatabaseTable(INITIAL_APARTMENTS, 'apt_code');
    this.users = new DatabaseTable(INITIAL_USERS, 'id');
    this.apartmentMembers = new DatabaseTable(INITIAL_MEMBERS, 'id');
    this.technicians = new DatabaseTable(INITIAL_TECHNICIANS, 'id');
    this.tickets = new DatabaseTable(INITIAL_TICKETS, 'id');
    this.bills = new DatabaseTable(INITIAL_BILLS, 'id');
    this.smartDevices = new DatabaseTable(INITIAL_SMART_DEVICES, 'id');
    this.automationRules = new DatabaseTable(INITIAL_RULES, 'id');
    this.smartGuestPins = new DatabaseTable(INITIAL_GUEST_PINS, 'id');
    this.smartDoorLogs = new DatabaseTable(INITIAL_DOOR_LOGS, 'id');
    this.facilities = new DatabaseTable(INITIAL_FACILITIES, 'id');
    this.facilityBookings = new DatabaseTable(INITIAL_FACILITY_BOOKINGS, 'id');
    this.residentBookings = new DatabaseTable(INITIAL_RESIDENT_BOOKINGS, 'id');
    this.visitorPasses = new DatabaseTable(INITIAL_VISITOR_PASSES, 'id');
    this.visitorGateLogs = new DatabaseTable(INITIAL_VISITOR_GATE_LOGS, 'id');
    this.communityPosts = new DatabaseTable(INITIAL_COMMUNITY_POSTS, 'id');
    this.votingTopics = new DatabaseTable(INITIAL_VOTING_TOPICS, 'id');
    this.votingRecords = new DatabaseTable(INITIAL_VOTING_RECORDS, 'id');
    this.faceEnrollments = new DatabaseTable(INITIAL_FACE_PROFILES, 'userId');
    this.ekycSubmissions = new DatabaseTable(INITIAL_EKYC_SUBMISSIONS, 'id');
    this.meterReadings = new DatabaseTable(INITIAL_METER_READINGS, 'id');
  }

  /**
   * Reset database to clean production schema state
   */
  resetToSchema(): void {
    this.apartments.replaceItems(INITIAL_APARTMENTS);
    this.users.replaceItems(INITIAL_USERS);
    this.apartmentMembers.replaceItems(INITIAL_MEMBERS);
    this.technicians.replaceItems(INITIAL_TECHNICIANS);
    this.tickets.replaceItems(INITIAL_TICKETS);
    this.bills.replaceItems(INITIAL_BILLS);
    this.smartDevices.replaceItems(INITIAL_SMART_DEVICES);
    this.automationRules.replaceItems(INITIAL_RULES);
    this.smartGuestPins.replaceItems(INITIAL_GUEST_PINS);
    this.smartDoorLogs.replaceItems(INITIAL_DOOR_LOGS);
    this.facilities.replaceItems(INITIAL_FACILITIES);
    this.facilityBookings.replaceItems(INITIAL_FACILITY_BOOKINGS);
    this.residentBookings.replaceItems(INITIAL_RESIDENT_BOOKINGS);
    this.visitorPasses.replaceItems(INITIAL_VISITOR_PASSES);
    this.visitorGateLogs.replaceItems(INITIAL_VISITOR_GATE_LOGS);
    this.communityPosts.replaceItems(INITIAL_COMMUNITY_POSTS);
    this.votingTopics.replaceItems(INITIAL_VOTING_TOPICS);
    this.votingRecords.replaceItems(INITIAL_VOTING_RECORDS);
    this.faceEnrollments.replaceItems(INITIAL_FACE_PROFILES);
    this.ekycSubmissions.replaceItems(INITIAL_EKYC_SUBMISSIONS);
    this.meterReadings.replaceItems(INITIAL_METER_READINGS);
  }
}

// Global Singleton Instance
declare global {
  // eslint-disable-next-line no-var
  var __SKYLINE_DB_INSTANCE: SkylineDatabase | undefined;
}

export function getDatabase(): SkylineDatabase {
  if (!globalThis.__SKYLINE_DB_INSTANCE) {
    globalThis.__SKYLINE_DB_INSTANCE = new SkylineDatabase();
  }
  return globalThis.__SKYLINE_DB_INSTANCE;
}

export const skylineDb = getDatabase();
export const db = skylineDb;
export default skylineDb;
