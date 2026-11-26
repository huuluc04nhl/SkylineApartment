/**
 * Skyline Smart Residence - Resident Services Store
 * Quáº£n lÃ½ danh má»¥c & Ä‘Æ¡n Ä‘áº·t dá»‹ch vá»¥ Ä‘á»i sá»‘ng cao cáº¥p cho CÆ° DÃ¢n:
 * - Giáº·t á»§i & Giáº·t háº¥p cao cáº¥p (Giao nháº­n táº­n cá»­a)
 * - Cho thuÃª ngÆ°á»i giÃºp viá»‡c & Dá»n dáº¹p cÄƒn há»™ theo giá»
 * - ThuÃª Huáº¥n luyá»‡n viÃªn cÃ¡ nhÃ¢n PT BÆ¡i lá»™i (Sky Pool Táº§ng 25) & PT Gym (Táº§ng 3)
 * - ChÄƒm sÃ³c xe & Rá»­a xe cao cáº¥p táº¡i Háº§m B2
 * - Spa & Wellness (Massage thÆ° giÃ£n, ChÄƒm sÃ³c da máº·t, XÃ´ng hÆ¡i trá»‹ liá»‡u)
 * - NhÃ  HÃ ng & Suáº¥t Ä‚n (Skyline Kitchen & CafÃ©, Giao suáº¥t Äƒn táº­n cÄƒn há»™)
 * - Di Chuyá»ƒn ThÃ´ng Minh (Xe Ä‘iá»‡n buggey ná»™i khu, ÄÆ°a Ä‘Ã³n sÃ¢n bay VIP, VÃ© thÃ¡ng VinBus)
 * 
 * LÆ°u Ã½: CÃ¡c tiá»‡n Ã­ch khÃ´ng gian (Há»“ bÆ¡i, Gym, SÃ¢n Tennis/BÃ³ng rá»•, Yoga, VÆ°á»n BBQ) 
 * Ä‘Æ°á»£c quáº£n lÃ½ riÃªng biá»‡t táº¡i SmartFacilityPass (Tiá»‡n Ãch & Tháº» ThÃ´ng Minh).
 */

import { addServiceChargeToBill } from './billingStore';

export type ServiceCategory =
  | 'LAUNDRY'
  | 'HOUSEKEEPING'
  | 'PERSONAL_TRAINER'
  | 'CAR_CARE'
  | 'SPA_WELLNESS'
  | 'RESTAURANT'
  | 'TRANSPORT';

export interface ServicePackageOption {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  description: string;
  estimatedDuration?: string;
}

export interface ResidentServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  tagline: string;
  description: string;
  rating: number;
  reviewCount: number;
  location: string;
  imageUrl: string;
  badge?: string;
  packages: ServicePackageOption[];
  operatingHours: string;
}

export interface ServiceBooking {
  id: string;
  bookingCode: string;
  aptCode: string;
  residentName: string;
  residentPhone: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  packageName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTimeSlot: string;
  notes?: string;
  paymentChoice: 'ADD_TO_BILL' | 'PAY_NOW';
  paymentStatus: 'PENDING_BILL' | 'PAID';
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedStaff?: string;
  staffPhone?: string;
  createdAt: string;
}


export const RESIDENT_SERVICES_CATALOG: ResidentServiceItem[] = [
  // 1. GIáº¶T á»¦I & GIáº¶T Háº¤P
  {
    id: 'srv-laundry',
    name: 'Giáº·t á»¦i & Giáº·t Háº¥p Cao Cáº¥p',
    category: 'LAUNDRY',
    tagline: 'Nháº­n & giao Ä‘á»“ táº­n cá»­a cÄƒn há»™ trong 24h',
    description: 'Quy trÃ¬nh giáº·t sáº¥y cÃ´ng nghá»‡ Nháº­t Báº£n, báº£o vá»‡ sá»£i váº£i, dung mÃ´i giáº·t háº¥p há»¯u cÆ¡ sinh há»c cao cáº¥p khÃ´ng mÃ¹i hÃ³a cháº¥t.',
    rating: 4.9,
    reviewCount: 142,
    location: 'Sáº£nh ÄÃ³n & Táº§ng B1',
    imageUrl: '/masterplan/vinhomes-amenities-map.jpg',
    badge: 'Giao Nháº­n Táº­n Cá»­a',
    operatingHours: '07:30 - 21:30 HÃ ng NgÃ y',
    packages: [
      {
        id: 'pkg-laundry-wash',
        name: 'Giáº·t Sáº¥y ThÆ¡m & Gáº¥p Gá»n',
        unit: 'kg',
        unitPrice: 20000,
        description: 'PhÃ¢n loáº¡i mÃ u sáº¯c, sáº¥y khÃ´ má»m máº¡i, tiá»‡t trÃ¹ng tia UV.',
        estimatedDuration: 'Giao sau 12 giá»',
      },
      {
        id: 'pkg-laundry-dryclean-suit',
        name: 'Giáº·t Háº¥p Veston & Trang Phá»¥c Cao Cáº¥p',
        unit: 'bá»™',
        unitPrice: 80000,
        description: 'Giáº·t khÃ´ báº±ng dung mÃ´i Hydrocarbon há»¯u cÆ¡ chuyÃªn dá»¥ng, á»§i hÆ¡i form chuáº©n.',
        estimatedDuration: 'Giao sau 24 giá»',
      },
      {
        id: 'pkg-laundry-bedding',
        name: 'Giáº·t Háº¥p ChÄƒn Ga Gá»‘i & Topper',
        unit: 'bá»™',
        unitPrice: 120000,
        description: 'Khá»­ khuáº©n máº¡t bá»¥i, thÆ¡m hÆ°Æ¡ng lavender tá»± nhiÃªn.',
        estimatedDuration: 'Giao sau 24 giá»',
      },
    ],
  },

  // 2. GIÃšP VIá»†C & Dá»ŒN Dáº¸P THEO GIá»œ
  {
    id: 'srv-cleaning',
    name: 'Cho ThuÃª GiÃºp Viá»‡c & Dá»n Dáº¹p NhÃ ',
    category: 'HOUSEKEEPING',
    tagline: 'NhÃ¢n viÃªn kiá»ƒm Ä‘á»‹nh lÃ½ lá»‹ch e-KYC, tay nghá» 5 sao',
    description: 'Dá»‹ch vá»¥ buá»“ng phÃ²ng tiÃªu chuáº©n khÃ¡ch sáº¡n 5 sao. NhÃ¢n viÃªn mang Ä‘áº§y Ä‘á»§ hÃ³a cháº¥t sinh há»c táº©y rá»­a, mÃ¡y hÃºt bá»¥i chuyÃªn dá»¥ng.',
    rating: 5.0,
    reviewCount: 218,
    location: 'Äá»™i Buá»“ng PhÃ²ng Skyline',
    imageUrl: '/masterplan/vinhomes-amenities-map.jpg',
    badge: 'ÄÆ°á»£c Äáº·t Nhiá»u Nháº¥t',
    operatingHours: '08:00 - 20:00 HÃ ng NgÃ y',
    packages: [
      {
        id: 'pkg-clean-2h',
        name: 'Dá»n Dáº¹p TiÃªu Chuáº©n (Ca 2 Giá»)',
        unit: 'ca',
        unitPrice: 180000,
        description: 'Lau dá»n phÃ²ng khÃ¡ch, phÃ²ng ngá»§, nhÃ  vá»‡ sinh, rá»­a chÃ©n bÃ¡t vÃ  gom rÃ¡c.',
        estimatedDuration: '2 giá» lÃ m viá»‡c',
      },
      {
        id: 'pkg-clean-3h',
        name: 'Dá»n Dáº¹p ChuyÃªn SÃ¢u (Ca 3 Giá»)',
        unit: 'ca',
        unitPrice: 260000,
        description: 'Dá»n toÃ n diá»‡n cÄƒn há»™ 2-3 phÃ²ng ngá»§, lau cá»­a kÃ­nh, hÃºt bá»¥i sofa & ban cÃ´ng.',
        estimatedDuration: '3 giá» lÃ m viá»‡c',
      },
      {
        id: 'pkg-clean-postparty',
        name: 'Tá»•ng Vá»‡ Sinh Sau Tiá»‡c / Tiá»‡c BBQ',
        unit: 'láº§n',
        unitPrice: 450000,
        description: 'Dá»n sáº¡ch váº¿t dáº§u má»¡ báº¿p, gom rá»­a Ä‘á»“ tiá»‡c, khá»­ mÃ¹i thá»©c Äƒn vÃ  lÃ m sÃ¡ng bÃ³ng sÃ n nhÃ .',
        estimatedDuration: '3.5 - 4 giá»',
      },
      {
        id: 'pkg-clean-sofa-steam',
        name: 'Giáº·t Gháº¿ Sofa HÆ¡i NÆ°á»›c NÃ³ng Diá»‡t Khuáº©n',
        unit: 'bá»™',
        unitPrice: 350000,
        description: 'CÃ´ng nghá»‡ hÆ¡i nÆ°á»›c nÃ³ng 140Â°C diá»‡t 99.9% vi khuáº©n, bá» rá»‡p vÃ  náº¥m má»‘c ná»‡m/sofa.',
        estimatedDuration: '1.5 giá»',
      },
    ],
  },

  // 3. THUÃŠ PT BÆ I & PT GYM
  {
    id: 'srv-pt-sports',
    name: 'ThuÃª Huáº¥n Luyá»‡n ViÃªn CÃ¡ NhÃ¢n (PT)',
    category: 'PERSONAL_TRAINER',
    tagline: 'KÃ¨m riÃªng 1-1 táº¡i Há»“ bÆ¡i Táº§ng 25 & Gym Táº§ng 3',
    description: 'Äá»™i ngÅ© HLV cÃ³ chá»©ng chá»‰ quá»‘c táº¿ ACE / NASM / Cá»­ nhÃ¢n TDTT. Lá»™ trÃ¬nh cÃ¡ nhÃ¢n hÃ³a cho tráº» em, ngÆ°á»i lá»›n, chá»‰nh dÃ¡ng bÆ¡i & tÄƒng cÆ¡ giáº£m má»¡.',
    rating: 4.95,
    reviewCount: 96,
    location: 'Há»“ BÆ¡i Táº§ng 25 & Gym Táº§ng 3',
    imageUrl: '/masterplan/vinhomes-amenities-map.jpg',
    badge: 'ChuyÃªn Gia 1-KÃ¨m-1',
    operatingHours: '06:00 - 21:00 HÃ ng NgÃ y',
    packages: [
      {
        id: 'pkg-pt-swim-single',
        name: 'PT BÆ¡i Lá»™i KÃ¨m RiÃªng (1 Buá»•i 60 PhÃºt)',
        unit: 'buá»•i',
        unitPrice: 350000,
        description: 'KÃ¨m trá»±c tiáº¿p táº¡i Há»“ bÆ¡i vÃ´ cá»±c Táº§ng 25: há»c bÆ¡i áº¿ch/sáº£i/ngá»­a, chá»‰nh ká»¹ thuáº­t thá»Ÿ nÆ°á»›c & an toÃ n bÆ¡i.',
        estimatedDuration: '60 phÃºt',
      },
      {
        id: 'pkg-pt-swim-10',
        name: 'GÃ³i PT BÆ¡i Lá»™i Cáº¥p Tá»‘c (10 Buá»•i)',
        unit: 'khÃ³a',
        unitPrice: 3150000,
        description: 'Cam káº¿t biáº¿t bÆ¡i chuáº©n ká»¹ thuáº­t sau 10 buá»•i. Tiáº¿t kiá»‡m 10% so vá»›i há»c láº».',
        estimatedDuration: '10 buá»•i (60 phÃºt/buá»•i)',
      },
      {
        id: 'pkg-pt-gym-single',
        name: 'PT Gym Technogym (1 Buá»•i 60 PhÃºt)',
        unit: 'buá»•i',
        unitPrice: 300000,
        description: 'Äo chá»‰ sá»‘ InBody miá»…n phÃ­, hÆ°á»›ng dáº«n ká»¹ thuáº­t táº­p mÃ¡y an toÃ n, lÃªn giÃ¡o trÃ¬nh dinh dÆ°á»¡ng.',
        estimatedDuration: '60 phÃºt',
      },
      {
        id: 'pkg-pt-gym-10',
        name: 'GÃ³i PT Gym Giáº£m Má»¡ / TÄƒng CÆ¡ (10 Buá»•i)',
        unit: 'khÃ³a',
        unitPrice: 2700000,
        description: 'Lá»™ trÃ¬nh siáº¿t cÆ¡ hoáº·c tÄƒng cÃ¢n khoa há»c theo sÃ¡t tiáº¿n Ä‘á»™ hÃ ng tuáº§n.',
        estimatedDuration: '10 buá»•i (60 phÃºt/buá»•i)',
      },
    ],
  },

  // 4. CHÄ‚M SÃ“C & Rá»¬A XE Háº¦M B2
  {
    id: 'srv-car-detailing',
    name: 'ChÄƒm SÃ³c & Rá»­a Xe ThÃ´ng Minh',
    category: 'CAR_CARE',
    tagline: 'Rá»­a bá»t tuyáº¿t & hÃºt bá»¥i ná»™i tháº¥t táº¡i Háº§m B2',
    description: 'Khu vá»±c dá»‹ch vá»¥ chÄƒm sÃ³c xe thÃ´ng minh táº¡i Háº§m B2. Tiá»‡n lá»£i nháº­n vÃ  tráº£ xe ngay vá»‹ trÃ­ Ä‘á»— cá»§a cÆ° dÃ¢n.',
    rating: 4.88,
    reviewCount: 84,
    location: 'Khu Vá»±c Ká»¹ Thuáº­t Háº§m B2',
    imageUrl: '/masterplan/vinhomes-amenities-map.jpg',
    badge: 'Tiá»‡n Lá»£i DÆ°á»›i Háº§m',
    operatingHours: '07:00 - 19:30 HÃ ng NgÃ y',
    packages: [
      {
        id: 'pkg-car-moto',
        name: 'Rá»­a Xe MÃ¡y Bá»t Tuyáº¿t & DÆ°á»¡ng Lá»‘p',
        unit: 'xe',
        unitPrice: 30000,
        description: 'Rá»­a gáº§m, xá»‹t bá»t tuyáº¿t bÃ³ng sÆ¡n vÃ  phá»§ dÆ°á»¡ng chá»‘ng oxy hÃ³a lá»‘p xe.',
        estimatedDuration: '25 phÃºt',
      },
      {
        id: 'pkg-car-auto-standard',
        name: 'Rá»­a Ã” TÃ´ & HÃºt Bá»¥i Ná»™i Tháº¥t (Sedan/Hatchback)',
        unit: 'xe',
        unitPrice: 100000,
        description: 'Rá»­a ngoáº¡i tháº¥t sáº¡ch bÃ³ng, hÃºt bá»¥i sÃ n gháº¿, khá»­ khuáº©n Ä‘iá»u hÃ²a báº±ng tinh dáº§u sáº£ chanh.',
        estimatedDuration: '45 phÃºt',
      },
      {
        id: 'pkg-car-auto-suv',
        name: 'Rá»­a Ã” TÃ´ SUV / 7 Chá»— ChuyÃªn SÃ¢u',
        unit: 'xe',
        unitPrice: 130000,
        description: 'Rá»­a sáº¡ch gáº§m, vá»‡ sinh khoang hÃ nh lÃ½, lau dÆ°á»¡ng da ná»™i tháº¥t chuyÃªn dá»¥ng.',
        estimatedDuration: '60 phÃºt',
      },
    ],
  },

  // 5. SPA & WELLNESS â€” PhÃ²ng XÃ´ng HÆ¡i ÄÃ¡ Muá»‘i & Massage Cao Cáº¥p Táº§ng 3
  {
    id: 'srv-spa-wellness',
    name: 'Spa & Wellness Cao Cáº¥p',
    category: 'SPA_WELLNESS',
    tagline: 'Massage thÆ° giÃ£n & xÃ´ng hÆ¡i muá»‘i Ä‘Ã¡ táº§ng 3',
    description: 'Tráº£i nghiá»‡m thÆ° giÃ£n 5 sao ngay trong khuÃ´n viÃªn Skyline. Äá»™i ngÅ© chuyÃªn viÃªn spa Ä‘Æ°á»£c Ä‘Ã o táº¡o bÃ i báº£n táº¡i ThÃ¡i Lan, sá»­ dá»¥ng tinh dáº§u há»¯u cÆ¡ thiÃªn nhiÃªn vÃ  Ä‘Ã¡ nÃ³ng Himalaya.',
    rating: 4.97,
    reviewCount: 163,
    location: 'Táº§ng 3 (Khu Wellness & Spa)',
    imageUrl: '/masterplan/vinhomes-amenities-map.jpg',
    badge: 'ÄÆ°á»£c YÃªu ThÃ­ch Nháº¥t',
    operatingHours: '09:00 - 21:00 HÃ ng NgÃ y',
    packages: [
      {
        id: 'pkg-spa-massage-60',
        name: 'Massage ThÆ° GiÃ£n ToÃ n ThÃ¢n (60 PhÃºt)',
        unit: 'láº§n',
        unitPrice: 450000,
        description: 'Káº¿t há»£p ká»¹ thuáº­t massage Thá»¥y Äiá»ƒn & Balinese, giáº£m cÄƒng cÆ¡, cáº£i thiá»‡n tuáº§n hoÃ n mÃ¡u.',
        estimatedDuration: '60 phÃºt',
      },
      {
        id: 'pkg-spa-massage-90',
        name: 'Massage ÄÃ¡ NÃ³ng Himalaya Cao Cáº¥p (90 PhÃºt)',
        unit: 'láº§n',
        unitPrice: 680000,
        description: 'ÄÃ¡ nÃ³ng basalt káº¿t há»£p tinh dáº§u sáº£ gá»«ng giáº£i Ä‘á»™c, phá»¥c há»“i nÄƒng lÆ°á»£ng sÃ¢u cÆ¡ báº¯p sau ngÃ y dÃ i.',
        estimatedDuration: '90 phÃºt',
      },
      {
        id: 'pkg-spa-sauna-family',
        name: 'XÃ´ng HÆ¡i ÄÃ¡ Muá»‘i PhÃ²ng Gia ÄÃ¬nh (2 NgÆ°á»i)',
        unit: 'ca',
        unitPrice: 550000,
        description: 'PhÃ²ng xÃ´ng riÃªng tÆ° cho cáº·p Ä‘Ã´i/gia Ä‘Ã¬nh. ÄÃ¡ muá»‘i Himalaya 48Â°C, tinh dáº§u tháº£o má»™c khá»­ Ä‘á»™c.',
        estimatedDuration: '60 phÃºt/ca',
      },
      {
        id: 'pkg-spa-facial',
        name: 'ChÄƒm SÃ³c Da Máº·t ChuyÃªn SÃ¢u (Facial Treatment)',
        unit: 'láº§n',
        unitPrice: 380000,
        description: 'LÃ m sáº¡ch sÃ¢u lá»— chÃ¢n lÃ´ng, Ä‘áº¯p máº·t náº¡ collagen thá»§y phÃ¢n, tÄƒng Ä‘á»™ áº©m vÃ  Ä‘Ã n há»“i da.',
        estimatedDuration: '60 phÃºt',
      },
    ],
  },

  // 6. NHÃ€ HÃ€NG & SUáº¤T Ä‚N â€” Skyline Kitchen & Giao Táº­n CÄƒn Há»™
  {
    id: 'srv-restaurant',
    name: 'NhÃ  HÃ ng & Giao Suáº¥t Ä‚n Táº­n Cá»­a',
    category: 'RESTAURANT',
    tagline: 'Äáº·t bÃ n nhÃ  hÃ ng Skyline & giao cÆ¡m báº¿p Viá»‡t táº­n cÄƒn há»™',
    description: 'NhÃ  hÃ ng Skyline Kitchen & CafÃ© phá»¥c vá»¥ áº©m thá»±c Ã-Ã‚u tinh táº¿ ngay táº§ng 1. Giao suáº¥t Äƒn Ä‘Ã³ng gÃ³i tÆ°Æ¡i nÃ³ng tá»« báº¿p trÆ°á»Ÿng chuyÃªn nghiá»‡p, giao trong 30 phÃºt, Ä‘Ãºng giá» táº­n cá»­a cÄƒn há»™.',
    rating: 4.88,
    reviewCount: 211,
    location: 'Táº§ng 1 (Skyline Kitchen & CafÃ©)',
    imageUrl: '/masterplan/vinhomes-amenities-map.jpg',
    badge: 'Giao Trong 30 PhÃºt',
    operatingHours: '06:30 - 22:00 HÃ ng NgÃ y',
    packages: [
      {
        id: 'pkg-rest-combo-lunch',
        name: 'Combo CÆ¡m Pháº§n TrÆ°a Báº¿p Viá»‡t (1 NgÆ°á»i)',
        unit: 'pháº§n',
        unitPrice: 85000,
        description: 'CÆ¡m tráº¯ng + 1 mÃ³n máº·n + canh + trÃ¡ng miá»‡ng. Giao nÃ³ng Ä‘áº¿n cá»­a cÄƒn há»™ trong 30 phÃºt.',
        estimatedDuration: 'Giao trong 30 phÃºt',
      },
      {
        id: 'pkg-rest-dim-sum',
        name: 'Set Dim Sum SÃ¡ng (2 NgÆ°á»i)',
        unit: 'set',
        unitPrice: 160000,
        description: 'TrÃ  TÃ u nÃ³ng + 5 loáº¡i bÃ¡nh dim sum Ä‘áº·c trÆ°ng Há»“ng KÃ´ng tá»« báº¿p trÆ°á»Ÿng 5 sao.',
        estimatedDuration: 'Giao trong 25 phÃºt',
      },
      {
        id: 'pkg-rest-book-table',
        name: 'Äáº·t BÃ n NhÃ  HÃ ng (Tá»‘i Ä‘a 6 ngÆ°á»i)',
        unit: 'bÃ n',
        unitPrice: 0,
        description: 'Äáº·t bÃ n Æ°u tiÃªn táº¡i nhÃ  hÃ ng Skyline Kitchen. Miá»…n phÃ­ giá»¯ chá»—. Menu A-la-carte táº¡i chá»—.',
        estimatedDuration: 'LiÃªn há»‡ xÃ¡c nháº­n khung giá»',
      },
      {
        id: 'pkg-rest-amenities-basket',
        name: 'Giá» QuÃ  TrÃ¡i CÃ¢y Cao Cáº¥p & BÃ¡nh Ngá»t Táº§ng Cao',
        unit: 'giá»',
        unitPrice: 280000,
        description: 'Hoa quáº£ nháº­p kháº©u HÃ n Quá»‘c tÆ°Æ¡i, bÃ¡nh Macaron & Ã‰clair tá»« báº¿p bÃ¡nh cá»§a nhÃ  hÃ ng. PhÃ¹ há»£p táº·ng quÃ  cÆ° dÃ¢n má»›i.',
        estimatedDuration: 'Giao trong 45 phÃºt',
      },
    ],
  },

  // 7. DI CHUYá»‚N THÃ”NG MINH â€” VinBus, Xe Ä‘iá»‡n, ÄÆ°a Ä‘Ã³n sÃ¢n bay
  {
    id: 'srv-transport',
    name: 'Di Chuyá»ƒn ThÃ´ng Minh Ná»™i Khu',
    category: 'TRANSPORT',
    tagline: 'VinBus Ä‘iá»‡n, xe buggey ná»™i khu & Ä‘Æ°a Ä‘Ã³n sÃ¢n bay TÃ¢n SÆ¡n Nháº¥t',
    description: 'Dá»‹ch vá»¥ di chuyá»ƒn xanh â€“ thÃ´ng minh trong vÃ  ngoÃ i Vinhomes Grand Park. Tá»« xe buggey Ä‘iá»‡n káº¿t ná»‘i ná»™i khu Ä‘áº¿n Ä‘áº·t xe Ä‘Æ°a Ä‘Ã³n sÃ¢n bay TÃ¢n SÆ¡n Nháº¥t tiÃªu chuáº©n VIP.',
    rating: 4.82,
    reviewCount: 129,
    location: 'Sáº£nh ÄÃ³n Táº§ng 1 / Tráº¡m VinBus Ná»™i Khu',
    imageUrl: '/masterplan/vinhomes-amenities-map.jpg',
    badge: 'Di Chuyá»ƒn Xanh',
    operatingHours: '05:30 - 23:30 HÃ ng NgÃ y',
    packages: [
      {
        id: 'pkg-trans-buggy-intra',
        name: 'Xe Buggey Äiá»‡n Ná»™i Khu (1 Chiá»u)',
        unit: 'chuyáº¿n',
        unitPrice: 20000,
        description: 'ÄÆ°a Ä‘Ã³n trong pháº¡m vi Vinhomes Grand Park: Vincom Mega Mall, Báº¿n xe Ä‘iá»‡n, Vinmec, Vinschool.',
        estimatedDuration: '10 - 20 phÃºt',
      },
      {
        id: 'pkg-trans-airport',
        name: 'ÄÆ°a ÄÃ³n SÃ¢n Bay TÃ¢n SÆ¡n Nháº¥t (Ã” TÃ´ 4 Chá»—)',
        unit: 'chuyáº¿n',
        unitPrice: 350000,
        description: 'Äáº·t lá»‹ch trÆ°á»›c 2 giá». LÃ¡i xe chuyÃªn nghiá»‡p trang phá»¥c lá»‹ch sá»±, xe sáº¡ch & Ä‘Ãºng giá».',
        estimatedDuration: '45 - 60 phÃºt (tÃ¹y giá» cao Ä‘iá»ƒm)',
      },
      {
        id: 'pkg-trans-airport-suv',
        name: 'ÄÆ°a ÄÃ³n SÃ¢n Bay VIP (SUV 7 Chá»—)',
        unit: 'chuyáº¿n',
        unitPrice: 480000,
        description: 'Dá»‹ch vá»¥ cao cáº¥p xe Innova/Fortuner, há»— trá»£ hÃ nh lÃ½, theo dÃµi chuyáº¿n bay & Ä‘Ã³n Ä‘Ãºng cá»­a xuáº¥t.',
        estimatedDuration: '45 - 60 phÃºt',
      },
      {
        id: 'pkg-trans-vinbus-monthly',
        name: 'VÃ© ThÃ¡ng VinBus Äiá»‡n D4 (Trung TÃ¢m TP)',
        unit: 'tháº»/thÃ¡ng',
        unitPrice: 230000,
        description: 'VÃ© thÃ¡ng VinBus tuyáº¿n D4 káº¿t ná»‘i trá»±c tiáº¿p Quáº­n 1, Báº¿n ThÃ nh & cÃ¡c tiá»‡n Ã­ch Vinhomes.',
        estimatedDuration: 'Hiá»‡u lá»±c 30 ngÃ y',
      },
    ],
  },
];

// Danh sÃ¡ch Ä‘Æ¡n Ä‘áº·t dá»‹ch vá»¥ ban Ä‘áº§u hoÃ n toÃ n sáº¡ch, khÃ´ng cÃ³ dá»¯ liá»‡u áº£o/máº«u
const INITIAL_DEMO_BOOKINGS: ServiceBooking[] = [];

declare global {
  // eslint-disable-next-line no-var
  var __SKYLINE_RESIDENT_BOOKINGS: ServiceBooking[] | undefined;
}

function getBookingsStore(): ServiceBooking[] {
  if (!globalThis.__SKYLINE_RESIDENT_BOOKINGS) {
    globalThis.__SKYLINE_RESIDENT_BOOKINGS = [];
  }
  return globalThis.__SKYLINE_RESIDENT_BOOKINGS;
}

function notifyServicesUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skyline_services_updated'));
  }
}

/**
 * Láº¥y toÃ n bá»™ danh sÃ¡ch Ä‘Æ¡n Ä‘áº·t dá»‹ch vá»¥ thá»±c táº¿ (In-Memory Store - KhÃ´ng localStorage)
 */
export function getResidentBookings(aptCode?: string): ServiceBooking[] {
  let list = getBookingsStore().filter(
    b => b && b.bookingCode && !b.bookingCode.includes('LAUN-1201') && !b.bookingCode.includes('PTSW-1202')
  );

  if (aptCode) {
    const clean = aptCode.trim().toUpperCase();
    return list.filter(b => b.aptCode.trim().toUpperCase() === clean);
  }
  return list;
}

/**
 * LÆ°u danh sÃ¡ch Ä‘Æ¡n Ä‘áº·t dá»‹ch vá»¥ vÃ o In-Memory Store
 */
export function saveResidentBookings(bookings: ServiceBooking[]): void {
  globalThis.__SKYLINE_RESIDENT_BOOKINGS = bookings;
  notifyServicesUpdated();
}

/**
 * Táº¡o má»›i Ä‘Æ¡n Ä‘áº·t dá»‹ch vá»¥
 */
export function createResidentBooking(params: {
  aptCode: string;
  residentName: string;
  residentPhone: string;
  serviceId: string;
  packageId: string;
  quantity: number;
  scheduledDate: string;
  scheduledTimeSlot: string;
  notes?: string;
  paymentChoice: 'ADD_TO_BILL' | 'PAY_NOW';
}): ServiceBooking | null {
  const service = RESIDENT_SERVICES_CATALOG.find(s => s.id === params.serviceId);
  if (!service) return null;

  const pkg = service.packages.find(p => p.id === params.packageId);
  if (!pkg) return null;

  const codePrefix = service.category === 'LAUNDRY' ? 'LAUN' :
                     service.category === 'HOUSEKEEPING' ? 'CLEAN' :
                     service.category === 'PERSONAL_TRAINER' ? 'PT' :
                     service.category === 'CAR_CARE' ? 'CAR' :
                     service.category === 'SPA_WELLNESS' ? 'SPA' :
                     service.category === 'RESTAURANT' ? 'REST' : 'TRANS';

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `SRV-${codePrefix}-${randomNum}`;
  const totalPrice = pkg.unitPrice * Math.max(1, params.quantity);

  // Chá»‰ Ä‘á»‹nh nhÃ¢n viÃªn phá»¥ trÃ¡ch tá»± Ä‘á»™ng theo ca
  let assignedStaff = 'Äá»™i Dá»‹ch Vá»¥ CÆ° DÃ¢n Skyline';
  let staffPhone = '1900 8899';
  if (service.category === 'LAUNDRY') {
    assignedStaff = 'LÃª Thá»‹ Thu (TrÆ°á»Ÿng nhÃ³m giáº·t á»§i BQL)';
    staffPhone = '0908 112 233';
  } else if (service.category === 'HOUSEKEEPING') {
    assignedStaff = 'Tráº§n Thá»‹ Má»¹ DuyÃªn (ChuyÃªn viÃªn buá»“ng phÃ²ng)';
    staffPhone = '0912 334 455';
  } else if (service.category === 'PERSONAL_TRAINER') {
    assignedStaff = 'HLV Phan Minh Háº£i (Chá»©ng chá»‰ ACE Táº§ng 25)';
    staffPhone = '0933 445 566';
  } else if (service.category === 'CAR_CARE') {
    assignedStaff = 'Nguyá»…n VÄƒn Äáº¡t (Ká»¹ thuáº­t viÃªn rá»­a xe B2)';
    staffPhone = '0944 556 677';
  } else if (service.category === 'SPA_WELLNESS') {
    assignedStaff = 'ChuyÃªn viÃªn Spa Nguyá»…n Thá»‹ Lan Anh (Táº§ng 3)';
    staffPhone = '0955 667 788';
  } else if (service.category === 'RESTAURANT') {
    assignedStaff = 'Báº¿p TrÆ°á»Ÿng Skyline Kitchen (Táº§ng 1)';
    staffPhone = '0977 889 900';
  } else if (service.category === 'TRANSPORT') {
    assignedStaff = 'Äiá»u Phá»‘i ViÃªn Di Chuyá»ƒn Ná»™i Khu';
    staffPhone = '0988 990 011';
  }

  const newBooking: ServiceBooking = {
    id: `srv-bk-${Date.now()}`,
    bookingCode,
    aptCode: params.aptCode,
    residentName: params.residentName,
    residentPhone: params.residentPhone,
    serviceId: service.id,
    serviceName: service.name,
    category: service.category,
    packageName: pkg.name,
    quantity: Math.max(1, params.quantity),
    unit: pkg.unit,
    unitPrice: pkg.unitPrice,
    totalPrice,
    scheduledDate: params.scheduledDate,
    scheduledTimeSlot: params.scheduledTimeSlot,
    notes: params.notes || '',
    paymentChoice: params.paymentChoice,
    paymentStatus: params.paymentChoice === 'ADD_TO_BILL' ? 'PENDING_BILL' : 'PAID',
    status: 'CONFIRMED',
    assignedStaff,
    staffPhone,
    createdAt: new Date().toISOString(),
  };

  const currentList = getResidentBookings();
  const nextList = [newBooking, ...currentList];
  saveResidentBookings(nextList);

  if (typeof window !== 'undefined') {
    fetch('/api/resident-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking),
    }).catch((err) => console.error('Lá»—i lÆ°u Ä‘áº·t dá»‹ch vá»¥ lÃªn Supabase:', err));
  }

  // Náº¿u chá»n "Gá»™p vÃ o hÃ³a Ä‘Æ¡n", tá»± Ä‘á»™ng chÃ¨n vÃ o hÃ³a Ä‘Æ¡n chÆ°a thanh toÃ¡n cá»§a cÄƒn há»™
  if (params.paymentChoice === 'ADD_TO_BILL') {
    const serviceType = service.category === 'LAUNDRY' ? 'Laundry' :
                        service.category === 'HOUSEKEEPING' ? 'Housekeeping' :
                        service.category === 'PERSONAL_TRAINER' ? 'Personal_Trainer' :
                        service.category === 'CAR_CARE' ? 'Car_Care' :
                        service.category === 'SPA_WELLNESS' ? 'Spa' :
                        service.category === 'RESTAURANT' ? 'Dining' : 'Transport';

    addServiceChargeToBill(params.aptCode, {
      service_type: serviceType,
      service_name: `${pkg.name} (${service.name})`,
      usage: params.quantity,
      unit: pkg.unit,
      unit_price: pkg.unitPrice,
      total_line_amount: totalPrice,
      order_date: new Date().toLocaleDateString('vi-VN'),
      booking_ref: bookingCode,
    });
  }

  return newBooking;
}

/**
 * Há»§y Ä‘Æ¡n Ä‘áº·t dá»‹ch vá»¥
 */
export function cancelResidentBooking(bookingId: string): boolean {
  const currentList = getResidentBookings();
  let found = false;
  const nextList = currentList.map(b => {
    if (b.id === bookingId && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS')) {
      found = true;
      return { ...b, status: 'CANCELLED' as const };
    }
    return b;
  });

  if (found) {
    saveResidentBookings(nextList);
    if (typeof window !== 'undefined') {
      fetch('/api/resident-services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: 'CANCELLED' }),
      }).catch((err) => console.error('Lá»—i há»§y dá»‹ch vá»¥ trÃªn Supabase:', err));
    }
  }
  return found;
}

export async function syncResidentBookingsFromDb(aptCode?: string): Promise<ServiceBooking[]> {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams();
  if (aptCode) params.set('aptCode', aptCode);
  const res = await fetch(`/api/resident-services${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) {
    throw new Error(`KhÃ´ng thá»ƒ táº£i lá»‹ch sá»­ Ä‘áº·t dá»‹ch vá»¥ (${res.status})`);
  }
  const data = await res.json();
  const list: ServiceBooking[] = Array.isArray(data?.bookings) ? data.bookings : [];
  saveResidentBookings(list);
  return list;
}
