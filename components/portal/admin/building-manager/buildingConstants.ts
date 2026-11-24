import { ApartmentUnit } from '@/lib/apartmentStore';

export type OccupancyFilter = 'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
export type ApartmentTypeFilter = 'ALL' | '1PN' | '2PN' | '3PN' | 'DUPLEX_PENTHOUSE';
export type FloorRangeFilter = 'ALL' | 'LOW' | 'MID' | 'HIGH';
export type ViewPerspective = 'BUILDING_3D_FLOOR' | 'MASTER_PLAN' | 'GRID' | '3D' | 'BUILDING_ELEVATION' | 'FLOOR_PLAN';
export type BuildingColorTone = 'GOLD_LUXURY';

export interface TropicalAmenity {
  id: string;
  displayNumber?: string;
  name: string;
  category: 'POOL' | 'PARK' | 'SPORT' | 'ACCESS';
  desc: string;
  x: number;
  y: number;
  distance: string;
  isGoldBadge?: boolean;
}

export const THE_TROPICAL_AMENITIES: TropicalAmenity[] = [
  // Cột trái (Số tròn đen 01 - 12)
  { id: '01', displayNumber: '01', name: 'Phố cọ Rodeo', category: 'PARK', desc: 'Tuyến phố thương mại shophouse & dạo bộ rợp bóng cọ nhiệt đới', x: 22, y: 84, distance: 'Liền kề BS-7' },
  { id: '02', displayNumber: '02', name: 'Bể bơi nhiệt đới', category: 'POOL', desc: 'Cụm hồ bơi phong cách resort nhiệt đới trung tâm phân khu', x: 42, y: 20, distance: 'Cách BS-7: ~60m' },
  { id: '03', displayNumber: '03', name: 'Bể bơi ốc đảo', category: 'POOL', desc: 'Khu bơi lội thư giãn cảnh quan ốc đảo sinh thái trong lành', x: 48, y: 22, distance: 'Cách BS-7: ~85m' },
  { id: '04', displayNumber: '04', name: 'Bể bơi Malibu', category: 'POOL', desc: 'Bể bơi Malibu chuẩn phong cách resort miền nhiệt đới California', x: 12, y: 14, distance: 'Cụm phía Tây phân khu' },
  { id: '05', displayNumber: '05', name: 'Nhà phụ trợ bể bơi', category: 'POOL', desc: 'Khu thay đồ, tắm tráng & quầy cứu hộ vận hành chuyên nghiệp', x: 44, y: 24, distance: 'Cạnh bể bơi nhiệt đới' },
  { id: '06', displayNumber: '06', name: 'Sân chơi trẻ em', category: 'SPORT', desc: 'Khu vận động vui chơi liên hoàn an toàn cho cư dân nhí', x: 62, y: 22, distance: 'Cách BS-7: ~75m' },
  { id: '07', displayNumber: '07', name: 'Sân Gym ngoài trời', category: 'SPORT', desc: 'Trang thiết bị máy tập thể lực đa năng ngoài trời hiện đại', x: 56, y: 18, distance: 'Cách BS-7: ~50m' },
  { id: '08', displayNumber: '08', name: 'Sân yoga', category: 'SPORT', desc: 'Không gian tĩnh lặng râm mát rèn luyện thể chất & tái tạo năng lượng', x: 26, y: 20, distance: 'Cách BS-7: ~40m' },
  { id: '09', displayNumber: '09', name: 'Suối bậc cảnh quan', category: 'PARK', desc: 'Thác nước bậc thang & dòng chảy sinh thái điều hòa nhiệt độ', x: 45, y: 18, distance: 'Khu vườn trung tâm' },
  { id: '10', displayNumber: '10', name: 'Vườn cọ nhiệt đới Honolulu', category: 'PARK', desc: 'Đại cảnh quan công viên cọ xanh ngát trung tâm The Tropical', x: 49, y: 27, distance: 'Cách BS-7: ~40m' },
  { id: '11', displayNumber: '11', name: 'Vườn California', category: 'PARK', desc: 'Khu vườn dạo bộ phong cách Bờ Tây nước Mỹ sang trọng', x: 30, y: 24, distance: 'Cách BS-7: ~50m' },
  { id: '12', displayNumber: '12', name: 'Vườn San Mario', category: 'PARK', desc: 'Tiểu cảnh hoa cỏ & đường dạo dưỡng sinh cho người cao tuổi', x: 74, y: 29, distance: 'Khu phía Đông phân khu' },

  // Cột phải (Số tròn đen 13 - 16)
  { id: '13', displayNumber: '13', name: 'Biển tên', category: 'ACCESS', desc: 'Cổng chào nhận diện thương hiệu phân khu The Tropical biểu tượng', x: 90, y: 29, distance: 'Cổng đón phân khu' },
  { id: '14', displayNumber: '14', name: 'Chòi nghỉ', category: 'PARK', desc: 'Khu vực dừng chân ngắm cảnh râm mát bên hồ cảnh quan sinh thái', x: 52, y: 18, distance: 'Ven hồ bơi resort' },
  { id: '15', displayNumber: '15', name: 'Giàn cảnh quan', category: 'PARK', desc: 'Điểm nhấn kiến trúc biểu tượng chụp ảnh check-in sống ảo', x: 57, y: 23, distance: 'Cách BS-7: ~65m' },
  { id: '16', displayNumber: '16', name: 'Ghế nghỉ Sunken', category: 'PARK', desc: 'Không gian phòng khách chìm thư thái độc bản giữa làn nước xanh', x: 25, y: 22, distance: 'Ven hồ cảnh quan' },

  // Số tròn vàng (Tiện ích điểm nhấn 01 - 04)
  { id: 'Y-01', displayNumber: '01', isGoldBadge: true, name: 'Sân cỏ đa năng', category: 'PARK', desc: 'Thảm cỏ mở rộng tổ chức sự kiện cộng đồng & dã ngoại gia đình ngoài trời', x: 13, y: 31, distance: 'Cạnh bể bơi Malibu' },
  { id: 'Y-02', displayNumber: '02', isGoldBadge: true, name: 'Thác nước điểm nhấn', category: 'PARK', desc: 'Thác nước trang trí tạo âm thanh róc rách thư giãn tinh thần', x: 13, y: 33, distance: 'Khu Malibu' },
  { id: 'Y-03', displayNumber: '03', isGoldBadge: true, name: 'Artwork điểm nhấn', category: 'PARK', desc: 'Tác phẩm điêu khắc nghệ thuật biểu tượng phong cách nhiệt đới', x: 13, y: 29, distance: 'Khu cảnh quan Tây' },
  { id: 'Y-04', displayNumber: '04', isGoldBadge: true, name: 'Sân thể thao', category: 'SPORT', desc: 'Cụm sân tennis, bóng rổ tiêu chuẩn quốc tế cho cư dân', x: 12, y: 20, distance: 'Khu thể thao Malibu' },

  // Ký hiệu chữ & biểu tượng hạ tầng
  { id: 'P', displayNumber: 'P', name: 'Bãi đỗ xe', category: 'ACCESS', desc: 'Khu vực gửi xe thông minh và lối đón trả khách thuận tiện', x: 77, y: 32, distance: 'Gần Chung Cư BS-10' },
  { id: 'D', displayNumber: 'D', name: 'Lối vào sảnh (Drop off)', category: 'ACCESS', desc: 'Sảnh đón trả khách có mái che trang trọng tại từng chung cư', x: 70, y: 29, distance: 'Sảnh chính chung cư' },
  { id: 'H', displayNumber: '▼', name: 'Lối xuống hầm', category: 'ACCESS', desc: 'Ram dốc kết nối trực tiếp 2 tầng hầm để xe B1/B2 thông minh', x: 47, y: 31, distance: 'Lối xe xuống hầm trung tâm' },
];

export interface SurroundingAmenity {
  id: string;
  name: string;
  category: 'SHOPPING' | 'SCHOOL' | 'PARK' | 'HEALTH' | 'TRANSIT';
  categoryLabel: string;
  desc: string;
  distance: string;
  walkTime: string;
  x: number;
  y: number;
}

export const SURROUNDING_AMENITIES: SurroundingAmenity[] = [
  {
    id: 'SUR-01',
    name: 'Đại Trung Tâm Thương Mại Vincom Mega Mall',
    category: 'SHOPPING',
    categoryLabel: 'Mua Sắm & Giải Trí',
    desc: 'Thiên đường mua sắm 5 tầng nổi sầm uất bậc nhất khu Đông Sài Gòn, quy tụ hàng trăm thương hiệu xa xỉ và rạp chiếu phim IMAX.',
    distance: '~350m',
    walkTime: '4 phút đi bộ',
    x: 48,
    y: 78
  },
  {
    id: 'SUR-02',
    name: 'Quảng Trường Ánh Sáng Golden Eagle',
    category: 'PARK',
    categoryLabel: 'Cảnh Quan & Thư Giãn',
    desc: 'Quảng trường đại bàng biểu tượng phong cách Mỹ với hồ nước cảnh quan rộng lớn, đài phun nước nghệ thuật và đồi cọ ngắm hoàng hôn.',
    distance: '~150m',
    walkTime: '2 phút đi bộ',
    x: 22,
    y: 65
  },
  {
    id: 'SUR-03',
    name: 'Đại Công Viên Biển Hồ 36 Hecta',
    category: 'PARK',
    categoryLabel: 'Sinh Thái & Dã Ngoại',
    desc: 'Lá phổi xanh kỳ vĩ với bãi cát trắng trải dài, hàng dừa nhiệt đới, khu chèo thuyền Kayak và vườn nướng BBQ ven hồ thoáng đãng.',
    distance: '~500m',
    walkTime: '6 phút đi bộ',
    x: 82,
    y: 60
  },
  {
    id: 'SUR-04',
    name: 'Bệnh Viện Đa Khoa Quốc Tế Vinmec',
    category: 'HEALTH',
    categoryLabel: 'Y Tế & Chăm Sóc Sức Khỏe',
    desc: 'Hệ thống y tế chuẩn JCI quốc tế với dịch vụ cấp cứu tại nhà 24/7 và đội ngũ chuyên gia bác sĩ hàng đầu túc trực.',
    distance: '~650m',
    walkTime: '8 phút đi bộ / 2p xe điện',
    x: 75,
    y: 88
  },
  {
    id: 'SUR-05',
    name: 'Hệ Thống Trường Học Liên Cấp Quốc Tế Vinschool',
    category: 'SCHOOL',
    categoryLabel: 'Giáo Dục Quốc Tế',
    desc: 'Môi trường giáo dục chuẩn Cambridge toàn diện từ Mầm non đến Trung học phổ thông, nằm an toàn ngay trong khuôn viên đô thị.',
    distance: '~400m',
    walkTime: '5 phút đi bộ',
    x: 28,
    y: 35
  },
  {
    id: 'SUR-06',
    name: 'Đại Học VinUni & Các Trường Quốc Tế',
    category: 'SCHOOL',
    categoryLabel: 'Đại Học Tinh Hoa',
    desc: 'Quần thể viện nghiên cứu và trường đại học tinh hoa đào tạo nhân tài công nghệ, kinh doanh và khoa học sức khỏe.',
    distance: '~1.2km',
    walkTime: '4 phút xe điện VinBus',
    x: 88,
    y: 25
  },
  {
    id: 'SUR-07',
    name: 'Ga Depot Xe Buýt Điện VinBus Thông Minh',
    category: 'TRANSIT',
    categoryLabel: 'Giao Thông Xanh',
    desc: 'Điểm khởi hành các tuyến xe bus điện không phát thải kết nối trực tiếp đến trung tâm Quận 1 và tuyến Metro Bến Thành - Suối Tiên.',
    distance: '~300m',
    walkTime: '3.5 phút đi bộ',
    x: 35,
    y: 40
  },
  {
    id: 'SUR-08',
    name: 'Tháp Văn Phòng Thông Minh Cao Cấp 45 Tầng',
    category: 'TRANSIT',
    categoryLabel: 'Kinh Tế & Công Nghệ',
    desc: 'Biểu tượng kinh tế tài chính thế hệ mới với công nghệ IoT & FaceID, quy tụ các tập đoàn đa quốc gia.',
    distance: '~480m',
    walkTime: '6 phút đi bộ',
    x: 64,
    y: 20
  }
];

export const CAD_FLOOR_UNITS_CONFIG = [
  // CÁNH 1: CÁNH BẮC (NORTH WING - Căn 01 đến 05)
  { num: '01', code: 'CH-01', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '2PN', typeLabel: '2PN Góc', beds: 2, baths: 2, area: 68.4, dir: 'Đông Bắc', defaultPrice: 4.6 },
  { num: '02', code: 'CH-02', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '1PN', typeLabel: '1PN Tiêu Chuẩn', beds: 1, baths: 1, area: 38.2, dir: 'Đông Bắc', defaultPrice: 2.8 },
  { num: '03', code: 'CH-03', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '1PN', typeLabel: '1PN+ Đa Năng', beds: 1, baths: 1, area: 46.5, dir: 'Đông Bắc', defaultPrice: 3.2 },
  { num: '04', code: 'CH-04', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '2PN', typeLabel: '2PN Ban Công Kính', beds: 2, baths: 2, area: 59.1, dir: 'Đông Bắc', defaultPrice: 4.1 },
  { num: '05', code: 'CH-05', wing: 'NORTH', wingLabel: 'Cánh Bắc', type: '2PN', typeLabel: '2PN Góc Đẹp', beds: 2, baths: 2, area: 69.2, dir: 'Đông Bắc', defaultPrice: 4.8 },

  // CÁNH 2: CÁNH NAM (SOUTH WING - Căn 06 đến 10)
  { num: '06', code: 'CH-06', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: '1PN', typeLabel: '1PN View Hồ Bơi', beds: 1, baths: 1, area: 42.0, dir: 'Đông Nam', defaultPrice: 3.4 },
  { num: '07', code: 'CH-07', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: '2PN', typeLabel: '2PN Gia Đình', beds: 2, baths: 2, area: 59.0, dir: 'Đông Nam', defaultPrice: 4.1 },
  { num: '08', code: 'CH-08', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: '1PN', typeLabel: '1PN+ Đa Năng', beds: 1, baths: 1, area: 46.5, dir: 'Đông Nam', defaultPrice: 3.25 },
  { num: '09', code: 'CH-09', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: '2PN', typeLabel: '2PN Góc Thoáng', beds: 2, baths: 2, area: 69.5, dir: 'Đông Nam', defaultPrice: 4.9 },
  { num: '10', code: 'CH-10', wing: 'SOUTH', wingLabel: 'Cánh Nam', type: 'STUDIO', typeLabel: 'Studio Tiện Nghi', beds: 1, baths: 1, area: 35.0, dir: 'Đông Nam', defaultPrice: 2.45 },

  // CÁNH 3: CÁNH TÂY (WEST WING - Dãy căn 11 đến 21 đối xứng qua hành lang 1.8m)
  { num: '11', code: 'CH-11', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Tây Bắc', beds: 2, baths: 2, area: 62.0, dir: 'Tây Bắc', defaultPrice: 4.2 },
  { num: '12', code: 'CH-12', wing: 'WEST', wingLabel: 'Cánh Tây', type: '1PN', typeLabel: '1PN Tiện Ích', beds: 1, baths: 1, area: 44.5, dir: 'Tây Bắc', defaultPrice: 3.1 },
  { num: '13', code: 'CH-13', wing: 'WEST', wingLabel: 'Cánh Tây', type: 'STUDIO', typeLabel: 'Studio Hiện Đại', beds: 1, baths: 1, area: 33.5, dir: 'Tây Bắc', defaultPrice: 2.3 },
  { num: '14', code: 'CH-14', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Ban Công Rộng', beds: 2, baths: 2, area: 58.5, dir: 'Tây Bắc', defaultPrice: 4.0 },
  { num: '15', code: 'CH-15', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Góc Tây', beds: 2, baths: 2, area: 67.0, dir: 'Tây Bắc', defaultPrice: 4.5 },
  { num: '16', code: 'CH-16', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Tây Nam', beds: 2, baths: 2, area: 68.0, dir: 'Tây Nam', defaultPrice: 4.6 },
  { num: '17', code: 'CH-17', wing: 'WEST', wingLabel: 'Cánh Tây', type: '1PN', typeLabel: '1PN View Cây Xanh', beds: 1, baths: 1, area: 43.0, dir: 'Tây Nam', defaultPrice: 3.0 },
  { num: '18', code: 'CH-18', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Tiêu Chuẩn', beds: 2, baths: 2, area: 61.5, dir: 'Tây Nam', defaultPrice: 4.15 },
  { num: '19', code: 'CH-19', wing: 'WEST', wingLabel: 'Cánh Tây', type: 'STUDIO', typeLabel: 'Studio Nhỏ Gọn', beds: 1, baths: 1, area: 34.0, dir: 'Tây Nam', defaultPrice: 2.4 },
  { num: '20', code: 'CH-20', wing: 'WEST', wingLabel: 'Cánh Tây', type: '1PN', typeLabel: '1PN Đón Gió', beds: 1, baths: 1, area: 45.0, dir: 'Tây Nam', defaultPrice: 3.15 },
  { num: '21', code: 'CH-21', wing: 'WEST', wingLabel: 'Cánh Tây', type: '2PN', typeLabel: '2PN Góc Nam', beds: 2, baths: 2, area: 70.0, dir: 'Tây Nam', defaultPrice: 4.95 },
];

export const BUILDING_3D_UNITS: {
  [code: string]: {
    name: string;
    totalFloors: number;
    floors: { floor: number; levelLabel: string; heightMeters: number; occupancyRate: number; totalUnits: number; occupiedUnits: number }[];
  };
} = {
  'BS-07': {
    name: 'Chung Cư BS-07 (The Tropical)',
    totalFloors: 34,
    floors: Array.from({ length: 34 }, (_, i) => {
      const f = i + 1;
      return {
        floor: f,
        levelLabel: f === 1 ? 'Tầng Sảnh (Lobby / G)' : `Tầng ${f.toString().padStart(2, '0')}`,
        heightMeters: Number((f * 3.4).toFixed(1)),
        occupancyRate: f === 1 ? 100 : (f === 12 ? 95 : Math.floor(75 + (f % 5) * 4)),
        totalUnits: f === 1 ? 0 : 21,
        occupiedUnits: f === 1 ? 0 : (f === 12 ? 20 : Math.floor(21 * (0.75 + (f % 5) * 0.04)))
      };
    })
  },
  'BS-08': {
    name: 'Chung Cư BS-08 (The Tropical)',
    totalFloors: 30,
    floors: Array.from({ length: 30 }, (_, i) => ({
      floor: i + 1,
      levelLabel: i === 0 ? 'Tầng Sảnh (Lobby / G)' : `Tầng ${(i + 1).toString().padStart(2, '0')}`,
      heightMeters: Number(((i + 1) * 3.4).toFixed(1)),
      occupancyRate: Math.floor(70 + (i % 6) * 4),
      totalUnits: i === 0 ? 0 : 21,
      occupiedUnits: i === 0 ? 0 : Math.floor(21 * (0.70 + (i % 6) * 0.04))
    }))
  },
  'BS-09': {
    name: 'Chung Cư BS-09 (The Tropical)',
    totalFloors: 39,
    floors: Array.from({ length: 39 }, (_, i) => ({
      floor: i + 1,
      levelLabel: i === 0 ? 'Tầng Sảnh (Lobby / G)' : `Tầng ${(i + 1).toString().padStart(2, '0')}`,
      heightMeters: Number(((i + 1) * 3.4).toFixed(1)),
      occupancyRate: Math.floor(82 + (i % 4) * 4),
      totalUnits: i === 0 ? 0 : 21,
      occupiedUnits: i === 0 ? 0 : Math.floor(21 * (0.82 + (i % 4) * 0.04))
    }))
  },
  'BS-10': {
    name: 'Chung Cư BS-10 (The Tropical)',
    totalFloors: 30,
    floors: Array.from({ length: 30 }, (_, i) => ({
      floor: i + 1,
      levelLabel: i === 0 ? 'Tầng Sảnh (Lobby / G)' : `Tầng ${(i + 1).toString().padStart(2, '0')}`,
      heightMeters: Number(((i + 1) * 3.4).toFixed(1)),
      occupancyRate: Math.floor(65 + (i % 7) * 4),
      totalUnits: i === 0 ? 0 : 21,
      occupiedUnits: i === 0 ? 0 : Math.floor(21 * (0.65 + (i % 7) * 0.04))
    }))
  }
};

export function getApartmentFinancialMetrics(unit: ApartmentUnit | null) {
  if (!unit) return null;

  const isOccupied = unit.status === 'OCCUPIED' && !!unit.owner;
  const isMaintenance = unit.status === 'MAINTENANCE';
  const area = unit.area || 73.2;

  // 1. Phí Quản Lý Vận Hành BQL (18.000 đ/m²/tháng chuẩn hạng sang Vinhomes)
  const managementFee = Math.round(area * 18000);

  // 2. Phí Gửi Xe Hầm B1-B2
  const vehicles = unit.vehicles || [];
  let parkingFee = 0;
  if (vehicles.length > 0) {
    vehicles.forEach(v => {
      if (v.type === 'CAR') parkingFee += 1200000;
      else if (v.type === 'MOTORBIKE') parkingFee += 120000;
      else parkingFee += 50000;
    });
  }

  // 3. Tiêu thụ điện sinh hoạt
  let electricKwh = 0;
  let electricCost = 0;
  let waterM3 = 0;
  let waterCost = 0;

  if (isOccupied) {
    electricKwh = Math.round(180 + (area * 1.4));
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = Math.max(12, Math.round(area * 0.22));
    waterCost = Math.round(waterM3 * 18000);
  } else if (isMaintenance) {
    electricKwh = 35;
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = 2;
    waterCost = Math.round(waterM3 * 18000);
  } else {
    electricKwh = 8;
    electricCost = Math.round(electricKwh * 3100);
    waterM3 = 0;
    waterCost = 0;
  }

  // Tổng doanh thu BQL thu về từ căn hộ
  const totalBqlRevenue = managementFee + parkingFee + (isOccupied ? (electricCost + waterCost) : 0);

  // Giá trị khai thác cho thuê tham chiếu thị trường
  let estimatedRentalPrice = 19500000;
  if (unit.type === '1PN') estimatedRentalPrice = 13500000;
  else if (unit.type === '2PN') estimatedRentalPrice = 19500000;
  else if (unit.type === '3PN') estimatedRentalPrice = 28000000;
  else if (unit.type === 'DUPLEX_PENTHOUSE') estimatedRentalPrice = 65000000;

  const propertyValue = (unit.priceBillion || 4.5) * 1000000000;
  const rentalYield = ((estimatedRentalPrice * 12) / propertyValue * 100).toFixed(1);

  return {
    isOccupied,
    isMaintenance,
    area,
    managementFee,
    parkingFee,
    electricKwh,
    electricCost,
    waterM3,
    waterCost,
    totalBqlRevenue,
    estimatedRentalPrice,
    rentalYield,
    paymentStatus: isOccupied ? (unit.billing?.status || 'PAID') : 'PAID_BY_DEVELOPER',
    meterElectricId: `EM-${unit.code}-IoT`,
    meterWaterId: `WM-${unit.code}-SKY`,
    lastSync: '12/09/2026 00:30'
  };
}

export const LOBBY_ZONES_DETAIL: Record<string, { title: string; status: string; desc: string; staff: string; hotline: string }> = {
  RECEPTION: {
    title: 'Quầy Đại Lễ Tân & Concierge 24/7',
    status: 'Trực 24/7',
    desc: 'Đón tiếp cư dân, hướng dẫn khách đến thăm, tiếp nhận bàn giao bưu phẩm và điều phối các yêu cầu hỗ trợ khẩn cấp.',
    staff: '2 Lễ tân chuyên nghiệp',
    hotline: '028.7300.8888 (Nhánh 1)'
  },
  BQL_OFFICE: {
    title: 'Văn Phòng Ban Quản Lý (BQL)',
    status: '08:00 - 17:30 (T2 - T7)',
    desc: 'Tiếp nhận ý kiến cư dân, cấp thẻ ra vào, đăng ký gửi xe hầm B1-B2, hỗ trợ thủ tục bàn giao căn hộ và hồ sơ thi công.',
    staff: 'Trưởng ban & 3 Chuyên viên BQL',
    hotline: '028.7300.8888 (Nhánh 2)'
  },
  ELEVATOR_LOBBY: {
    title: 'Sảnh Chờ 6 Thang Máy & Cổng FaceID',
    status: 'Hoạt động liên tục',
    desc: 'Hệ thống kiểm soát an ninh AI thông minh nhận diện khuôn mặt tự động gọi tầng thang máy cho cư dân, 6 thang khách tốc độ cao 3.5m/s.',
    staff: 'Hệ thống AI tự động',
    hotline: 'Kỹ Thuật Thang: 1900.6368'
  },
  LOUNGE: {
    title: 'Resident Lounge Tiếp Khách Sang Trọng',
    status: '06:00 - 22:30',
    desc: 'Không gian tiếp khách sang trọng chuẩn resort nhiệt đới, trang bị điều hòa trung tâm, wifi tốc độ cao và bàn ghế thư giãn.',
    staff: 'Nhân viên sảnh phục vụ',
    hotline: '028.7300.8888 (Nhánh 3)'
  },
  MAIL_LOCKER: {
    title: 'Phòng Hòm Thư & Tủ Smart Locker',
    status: 'Mở cửa 24/7',
    desc: 'Hòm thư bưu điện riêng cho từng căn hộ (T1 đến T34) và hệ thống tủ gửi đồ thông minh mở bằng mã QR hoặc mã OTP.',
    staff: 'Tự phục vụ bằng mã số',
    hotline: 'Hỗ trợ Locker: 1900.2244'
  },
  DROP_OFF: {
    title: 'Ram Dốc Lối Xuống Hầm Xe B1 - B2',
    status: 'Thông suốt 24/7',
    desc: 'Lối ram dốc 2 chiều rộng 7m dẫn xuống hầm B1 (xe máy & sạc xe điện) và hầm B2 (ô tô), barrier tự động nhận diện biển số.',
    staff: '2 Nhân viên điều phối giao thông',
    hotline: 'Đội An Ninh Hầm: Nhánh 4'
  }
};

