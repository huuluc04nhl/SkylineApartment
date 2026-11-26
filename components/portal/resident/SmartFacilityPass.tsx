'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useResidentApartment } from '@/lib/hooks/useResidentApartment';
import MissingApartmentNotice from '@/components/portal/resident/MissingApartmentNotice';
import { 
  CreditCard, 
  QrCode, 
  ScanFace, 
  CheckCircle2, 
  Sparkles, 
  Star, 
  Users, 
  Clock, 
  ShieldCheck, 
  Waves, 
  Dumbbell, 
  Flame, 
  Smile, 
  UtensilsCrossed, 
  History,
  DoorOpen,
  CalendarCheck,
  Calendar,
  XCircle,
  Plus,
  ArrowRight,
  Check,
  Wifi,
  Eye,
  X,
  Radio,
  SlidersHorizontal,
  Info,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Coins,
  Trees
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import SkylineLogo from '@/components/shared/SkylineLogo';
import ResidentSmartCard from './ResidentSmartCard';
import { useLanguage } from '@/lib/languageContext';
import { toast } from '@/components/ui/Toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { 
  getFacilityCheckinLogs, 
  addFacilityCheckinLog, 
  getFacilityBookings, 
  syncFacilityBookingsFromDb,
  createFacilityBooking, 
  cancelFacilityBooking,
  cancelFacilityBookingWithRefund,
  calculateRefundEstimate,
  checkinWithTicket,
  getFacilityMonthlyQuota,
  getFacilitySlotStatus,
  FACILITY_LIMIT_RULES,
  FacilityCheckinLog,
  FacilityBooking
} from '@/lib/facilityStore';

interface SmartFacilityPassProps {
  currentUser: User;
  onNavigateModule?: (moduleId: string) => void;
}

export default function SmartFacilityPass({ currentUser, onNavigateModule }: SmartFacilityPassProps) {
  const { t, isEn } = useLanguage();
  const { aptCode, missing: missingApartment } = useResidentApartment(currentUser);
  const isOwner = currentUser.role === 'OWNER';
  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'CÆ° DÃ¢n';

  // 3 Chá»©c nÄƒng rÃµ rÃ ng
  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'BOOKING' | 'LOGS'>('DISCOVER');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SPORTS' | 'WELLNESS' | 'PARTY' | 'PARK'>('ALL');
  const [logFilter, setLogFilter] = useState<string>('ALL');

  // Modal State
  const [showSmartCardModal, setShowSmartCardModal] = useState(false);
  const [turnstileModalFac, setTurnstileModalFac] = useState<any | null>(null);
  const [turnstileMethod, setTurnstileMethod] = useState<'NFC' | 'FACE_ID'>('NFC');
  const [isTurnstileScanning, setIsTurnstileScanning] = useState(false);
  const [turnstileSuccessMsg, setTurnstileSuccessMsg] = useState<string | null>(null);

  // 14 tiá»‡n Ã­ch chuáº©n phÃ¢n khu The Tropical Vinhomes Grand Park
  const amenitiesList = [
    // ===== SPORTS =====
    {
      id: 'fac-pool-resort',
      name: 'Bá»ƒ BÆ¡i Nhiá»‡t Äá»›i Resort',
      category: 'SPORTS',
      location: 'Trung TÃ¢m PhÃ¢n Khu (Giá»¯a BS-08/BS-09)',
      hours: '06:00 - 22:00',
      density: 'Ozone xá»­ lÃ½ â€¢ 29Â°C',
      temp: 'Chuáº©n Resort 5â˜…',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Waves,
      accessType: 'FREE_ENTRY',
      accessBadge: 'VÃ o Tá»± Do (NFC / FaceID)',
      price: 'Miá»…n phÃ­ theo Tháº» CÆ° DÃ¢n'
    },
    {
      id: 'fac-pool-malibu',
      name: 'Bá»ƒ BÆ¡i Malibu California',
      category: 'SPORTS',
      location: 'Cá»¥m PhÃ­a TÃ¢y (Cáº¡nh SÃ¢n Thá»ƒ Thao BS-10)',
      hours: '06:00 - 21:30',
      density: 'Phong cÃ¡ch Bá» TÃ¢y nÆ°á»›c Má»¹',
      temp: 'Ozone lá»c 3 cáº¥p',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Waves,
      accessType: 'FREE_ENTRY',
      accessBadge: 'VÃ o Tá»± Do (NFC / FaceID)',
      price: 'Miá»…n phÃ­ theo Tháº» CÆ° DÃ¢n'
    },
    {
      id: 'fac-gym',
      name: 'PhÃ²ng Gym Technogym',
      category: 'SPORTS',
      location: 'Táº§ng 3 (Khu Thá»ƒ Thao)',
      hours: 'Má»Ÿ cá»­a 24/7',
      density: '38% (BÃ¬nh thÆ°á»ng)',
      temp: '22Â°C â€¢ Äiá»u hÃ²a ion',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Dumbbell,
      accessType: 'FREE_ENTRY',
      accessBadge: 'VÃ o Tá»± Do 24/7',
      price: 'Miá»…n phÃ­ theo Tháº» CÆ° DÃ¢n'
    },
    {
      id: 'fac-gym-outdoor',
      name: 'SÃ¢n Gym NgoÃ i Trá»i',
      category: 'SPORTS',
      location: 'Cáº¡nh BS-09 (PhÃ­a ÄÃ´ng Há»“ BÆ¡i)',
      hours: '06:00 - 21:30',
      density: 'MÃ¡y táº­p Ä‘a nÄƒng ngoÃ i trá»i',
      temp: 'Trá»i thoÃ¡ng mÃ¡t',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Dumbbell,
      accessType: 'FREE_ENTRY',
      accessBadge: 'VÃ o Tá»± Do (KhÃ´ng cáº§n tháº»)',
      price: 'HoÃ n toÃ n miá»…n phÃ­'
    },
    {
      id: 'fac-sports-malibu',
      name: 'SÃ¢n Thá»ƒ Thao Malibu (Tennis & BÃ³ng Rá»•)',
      category: 'SPORTS',
      location: 'Cá»¥m Malibu PhÃ­a TÃ¢y (BS-10)',
      hours: '06:00 - 21:30',
      density: 'SÃ¢n Tennis ATP + SÃ¢n BÃ³ng Rá»• FIBA',
      temp: 'ÄÃ¨n chiáº¿u sÃ¡ng ban Ä‘Ãªm',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Flame,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Äáº·t SÃ¢n Giá»¯ Chá»— (Tab Äáº·t Chá»—)',
      price: 'Miá»…n phÃ­ theo Tháº» CÆ° DÃ¢n (Tá»‘i Ä‘a 2 ca/tuáº§n)'
    },
    {
      id: 'fac-yoga',
      name: 'SÃ¢n Yoga NgoÃ i Trá»i & Thiá»n',
      category: 'WELLNESS',
      location: 'Cáº¡nh BS-07 (Liá»n ká» Phá»‘ Cá» Rodeo)',
      hours: '06:00 - 20:00',
      density: 'KhÃ´ng gian tÄ©nh láº·ng, tháº£m táº­p outdoor',
      temp: 'CÃ¢y xanh bÃ³ng mÃ¡t tá»± nhiÃªn',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Smile,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'ÄÄƒng KÃ½ Khung Giá» (Tab Äáº·t Chá»—)',
      price: 'Miá»…n phÃ­ theo Tháº» CÆ° DÃ¢n'
    },
    {
      id: 'fac-sauna',
      name: 'PhÃ²ng XÃ´ng HÆ¡i ÄÃ¡ Muá»‘i VIP',
      category: 'WELLNESS',
      location: 'Táº§ng 3 (Khu ChÄƒm SÃ³c Sá»©c Khá»e)',
      hours: '09:00 - 21:00 (Theo giá» Ä‘áº·t)',
      density: 'PhÃ²ng riÃªng gia Ä‘Ã¬nh',
      temp: '48Â°C â€¢ Tinh dáº§u tháº£o má»™c Himalaya',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Flame,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Äáº·t PhÃ²ng VIP (Tá»‘i Äa 2 NgÆ°á»i)',
      price: 'PhÃ²ng riÃªng tÆ° VIP â€¢ 500.000 Ä‘/giá»'
    },
    {
      id: 'fac-kids',
      name: 'Khu Vui ChÆ¡i Tráº» Em',
      category: 'WELLNESS',
      location: 'Táº§ng 1 (Sáº£nh Chung CÆ° A) & NgoÃ i Trá»i',
      hours: '07:00 - 21:00',
      density: '30% (Vá»«a)',
      temp: '24Â°C â€¢ SÃ n khÃ¡ng khuáº©n nháº­p kháº©u',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Smile,
      accessType: 'FREE_ENTRY',
      accessBadge: 'VÃ o Tá»± Do (Tráº» Em & Gia ÄÃ¬nh)',
      price: 'Miá»…n phÃ­ theo Tháº» CÆ° DÃ¢n'
    },
    // ===== PARK & GARDEN =====
    {
      id: 'fac-rodeo-street',
      name: 'Phá»‘ Cá» Rodeo & Dáº¡o Bá»™',
      category: 'PARK',
      location: 'Liá»n Ká» BS-07 (Trá»¥c PhÃ­a TÃ¢y)',
      hours: '00:00 - 24:00 (Má»Ÿ cá»­a cáº£ ngÃ y)',
      density: 'Shophouse & CÃ  phÃª nhiá»‡t Ä‘á»›i',
      temp: 'BÃ³ng cá» tá»± nhiÃªn thoÃ¡ng mÃ¡t',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: UtensilsCrossed,
      accessType: 'FREE_ENTRY',
      accessBadge: 'KhÃ´ng Gian CÃ´ng Cá»™ng',
      price: 'Tá»± do ra vÃ o cáº£ ngÃ y'
    },
    {
      id: 'fac-california-garden',
      name: 'VÆ°á»n California & Dáº¡o Bá»™',
      category: 'PARK',
      location: 'Giá»¯a BS-07 & BS-08 (Trung TÃ¢m)',
      hours: '06:00 - 22:00',
      density: 'Cáº£nh quan cÃ¢y xanh Bá» TÃ¢y',
      temp: 'Há»‡ thá»‘ng tÆ°á»›i nhá» giá»t tá»± Ä‘á»™ng',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Trees,
      accessType: 'FREE_ENTRY',
      accessBadge: 'KhÃ´ng Gian Xanh CÃ´ng Cá»™ng',
      price: 'Tá»± do ra vÃ o cáº£ ngÃ y'
    },
    {
      id: 'fac-stream-waterfall',
      name: 'Suá»‘i Báº­c Thang & ThÃ¡c Cáº£nh Quan',
      category: 'PARK',
      location: 'Trung TÃ¢m PhÃ¢n Khu (Ven Há»“ BÆ¡i)',
      hours: '06:00 - 23:00',
      density: 'Há»‡ thá»‘ng thÃ¡c nÆ°á»›c tá»± Ä‘á»™ng',
      temp: 'Ã‚m thanh suá»‘i tá»± nhiÃªn',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Waves,
      accessType: 'FREE_ENTRY',
      accessBadge: 'KhÃ´ng Gian CÃ´ng Cá»™ng',
      price: 'Tá»± do ngáº¯m cáº£nh & chá»¥p áº£nh'
    },
    {
      id: 'fac-cabana',
      name: 'ChÃ²i Nghá»‰ Cabana Ven Há»“',
      category: 'PARK',
      location: 'Ven Há»“ BÆ¡i Resort BS-09',
      hours: '08:00 - 21:00 (Äáº·t trÆ°á»›c)',
      density: 'ChÃ²i riÃªng tÆ°, view há»“ bÆ¡i',
      temp: 'MÃ¡i lÃ¡ tá»± nhiÃªn chá»‘ng náº¯ng',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Smile,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Äáº·t ChÃ²i RiÃªng (Tá»‘i Äa 4 NgÆ°á»i)',
      price: 'Miá»…n phÃ­ â€¢ Äáº·t trÆ°á»›c qua Tháº» CÆ° DÃ¢n'
    },
    // ===== PARTY =====
    {
      id: 'fac-bbq',
      name: 'VÆ°á»n Tiá»‡c NÆ°á»›ng BBQ SÃ¢n ThÆ°á»£ng',
      category: 'PARTY',
      location: 'Táº§ng 25 (Khu VÆ°á»n NÆ°á»›ng NgoÃ i Trá»i)',
      hours: '17:00 - 23:00 (Theo ca)',
      density: 'Sáºµn sÃ ng 4/6 khu báº¿p Weber',
      temp: 'View Panorama 360Â° toÃ n khu',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: UtensilsCrossed,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'ÄÄƒng KÃ½ Theo Ca Tiá»‡c',
      price: 'Báº¿p Weber & dá»n sau tiá»‡c â€¢ 600.000 Ä‘/ca (Ca 3 giá»)'
    },
    {
      id: 'fac-multipurpose-lawn',
      name: 'SÃ¢n Cá» Äa NÄƒng Y-01 (Malibu)',
      category: 'PARTY',
      location: 'Cá»¥m Malibu PhÃ­a TÃ¢y (Cáº¡nh BS-10)',
      hours: '07:00 - 21:00',
      density: '800mÂ² cá» nhÃ¢n táº¡o tháº¿ há»‡ 4',
      temp: 'Há»‡ thá»‘ng thoÃ¡t nÆ°á»›c tá»± Ä‘á»™ng',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Flame,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Äáº·t SÃ¢n NhÃ³m (â‰¤ 20 NgÆ°á»i)',
      price: 'Miá»…n phÃ­ theo Tháº» CÆ° DÃ¢n (ÄÄƒng kÃ½ ca 2 giá»)'
    },
  ];

  // Dá»¯ liá»‡u thá»±c táº¿ tá»« Store (KhÃ´ng dá»¯ liá»‡u áº£o)
  const [accessLogs, setAccessLogs] = useState<FacilityCheckinLog[]>(() => getFacilityCheckinLogs(aptCode));
  const [bookings, setBookings] = useState<FacilityBooking[]>(() => getFacilityBookings(aptCode));
  const [quota, setQuota] = useState(() => getFacilityMonthlyQuota(aptCode));

  // State Form Ä‘áº·t chá»—
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingFacilityId, setBookingFacilityId] = useState('fac-sauna');
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('18:00 - 20:00 (Buá»•i tá»‘i - Giá» Ä‘áº¹p)');
  const [bookingGuestCount, setBookingGuestCount] = useState(2);
  const [bookingDurationHours, setBookingDurationHours] = useState(2);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('Trá»« vÃ o hÃ³a Ä‘Æ¡n sinh hoáº¡t thÃ¡ng tá»›i');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);

  // Danh sÃ¡ch khung giá» tá»‘i Æ°u theo tá»«ng loáº¡i tiá»‡n Ã­ch (Há»— trá»£ chuyá»ƒn ngá»¯ VI / EN)
  const facilityTimeSlots = useMemo(() => {
    if (bookingFacilityId === 'fac-bbq') {
      return isEn ? [
        '17:00 - 19:30 (Sunset Rooftop BBQ Session)',
        '19:30 - 22:00 (Starlight Night BBQ Session)',
      ] : [
        '17:00 - 19:30 (Ca Tiá»‡c HoÃ ng HÃ´n SÃ¢n ThÆ°á»£ng)',
        '19:30 - 22:00 (Ca Tiá»‡c ÄÃªm Ãnh Sao SÃ¢n ThÆ°á»£ng)',
      ];
    }
    if (bookingFacilityId === 'fac-sauna') {
      return isEn ? [
        '09:00 - 11:00 (Morning Detox)',
        '11:00 - 13:00 (Noon Relaxation)',
        '14:00 - 16:00 (Early Afternoon)',
        '16:00 - 18:00 (Sunset Recovery)',
        '18:00 - 20:00 (Evening VIP - Prime Time)',
        '20:00 - 21:30 (Night Serenity)',
      ] : [
        '09:00 - 11:00 (Buá»•i sÃ¡ng thanh lá»c)',
        '11:00 - 13:00 (TrÆ°a thÆ° giÃ£n)',
        '14:00 - 16:00 (Äáº§u giá» chiá»u)',
        '16:00 - 18:00 (HoÃ ng hÃ´n phá»¥c há»“i)',
        '18:00 - 20:00 (Buá»•i tá»‘i VIP - Giá» Ä‘áº¹p)',
        '20:00 - 21:30 (ÄÃªm thÆ° thÃ¡i)',
      ];
    }
    return isEn ? [
      '06:00 - 08:00 (Sunrise Dawn)',
      '08:00 - 10:00 (Morning Refresh)',
      '10:00 - 12:00 (Noon Serenity)',
      '14:00 - 16:00 (Early Afternoon)',
      '16:00 - 18:00 (Golden Sunset)',
      '18:00 - 20:00 (Evening Prime Time)',
      '20:00 - 22:00 (Night Workout & Recovery)',
    ] : [
      '06:00 - 08:00 (SÃ¡ng sá»›m bÃ¬nh minh)',
      '08:00 - 10:00 (Buá»•i sÃ¡ng thÆ° giÃ£n)',
      '10:00 - 12:00 (TrÆ°a thanh tá»‹nh)',
      '14:00 - 16:00 (Äáº§u giá» chiá»u)',
      '16:00 - 18:00 (HoÃ ng hÃ´n)',
      '18:00 - 20:00 (Buá»•i tá»‘i - Giá» Ä‘áº¹p)',
      '20:00 - 22:00 (Phá»¥c há»“i thá»ƒ lá»±c Ä‘Ãªm)',
    ];
  }, [bookingFacilityId, isEn]);

  // Tá»± Ä‘á»™ng chuyá»ƒn khung giá» há»£p lá»‡ khi Ä‘á»•i tiá»‡n Ã­ch
  useEffect(() => {
    if (!facilityTimeSlots.includes(bookingTimeSlot)) {
      setBookingTimeSlot(facilityTimeSlots[0] || '18:00 - 20:00');
    }
  }, [facilityTimeSlots, bookingTimeSlot]);

  // Tra cá»©u tráº¡ng thÃ¡i sá»‘ chá»— kháº£ dá»¥ng trong thá»i gian thá»±c (Bilingual)
  const currentSlotStatus = useMemo(() => {
    return getFacilitySlotStatus(bookingFacilityId, bookingDate, bookingTimeSlot, aptCode, isEn);
  }, [bookingFacilityId, bookingDate, bookingTimeSlot, aptCode, bookings, isEn]);

  const currentLimitRule = FACILITY_LIMIT_RULES[bookingFacilityId] || {
    facilityId: bookingFacilityId,
    facilityName: 'Tiá»‡n Ã­ch',
    facilityNameEn: 'Facility',
    maxSlotsPerTime: 2,
    maxGuests: 10,
    isPrivate: false,
    description: 'Tiá»‡n Ã­ch chung cÆ° (Tá»‘i Ä‘a 2 lÆ°á»£t / khung giá»)',
    descriptionEn: 'Apartment facility (Max 2 slots / time slot)'
  };

  // State Modal HoÃ n Tiá»n Khi Báº­n Äá»™t Xuáº¥t
  const [refundModalBooking, setRefundModalBooking] = useState<FacilityBooking | null>(null);
  const [refundReason, setRefundReason] = useState('Báº­n Ä‘á»™t xuáº¥t khÃ´ng thá»ƒ sáº¯p xáº¿p tham gia');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundResultAlert, setRefundResultAlert] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  useEffect(() => {
    syncFacilityBookingsFromDb(aptCode)
      .then((list) => {
        setBookings(list);
        setQuota(getFacilityMonthlyQuota(aptCode));
      })
      .catch((err) => console.error('Lá»—i Ä‘á»“ng bá»™ lá»‹ch sá»­ Ä‘áº·t tiá»‡n Ã­ch:', err));

    const handleLogAdded = () => setAccessLogs(getFacilityCheckinLogs(aptCode));
    const handleBooked = () => {
      setBookings(getFacilityBookings(aptCode));
      setQuota(getFacilityMonthlyQuota(aptCode));
    };

    window.addEventListener('skyline_facility_log_added', handleLogAdded);
    window.addEventListener('skyline_facility_booked', handleBooked);

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`facility_bookings_${aptCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'facility_bookings', filter: `apartment_code=eq.${aptCode}` },
        () => {
          syncFacilityBookingsFromDb(aptCode)
            .then((list) => {
              setBookings(list);
              setQuota(getFacilityMonthlyQuota(aptCode));
            })
            .catch(() => {});
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('skyline_facility_log_added', handleLogAdded);
      window.removeEventListener('skyline_facility_booked', handleBooked);
      supabase.removeChannel(channel);
    };
  }, [aptCode]);

  // Xá»­ lÃ½ xÃ¡c nháº­n check-in qua cá»•ng Turnstile
  const handleExecuteTurnstileCheckin = () => {
    if (!turnstileModalFac || isTurnstileScanning) return;
    setIsTurnstileScanning(true);

    setTimeout(() => {
      setIsTurnstileScanning(false);
      const methodText = turnstileMethod === 'NFC' ? 'Tháº» CÆ° DÃ¢n' : 'Nháº­n Diá»‡n KhuÃ´n Máº·t';
      
      // Ghi log thá»±c táº¿ vÃ o Store
      const updated = addFacilityCheckinLog(aptCode, {
        facilityId: turnstileModalFac.id,
        facilityName: turnstileModalFac.name,
        userName: userName,
        role: isOwner ? 'Chá»§ Há»™ (Master)' : 'NgÆ°á»i NhÃ ',
        method: turnstileMethod === 'NFC' ? 'NFC_CARD' : 'FACE_ID',
        cardUid: `NFC-SKY-${aptCode}-01`,
        status: 'SUCCESS',
        detail: `XÃ¡c thá»±c thÃ nh cÃ´ng báº±ng ${methodText} táº¡i cá»•ng kiá»ƒm soÃ¡t ${turnstileModalFac.name} (${turnstileModalFac.location}) â€¢ Cá»•ng má»Ÿ 0.3s`
      });
      setAccessLogs(updated);

      setTurnstileSuccessMsg(`ðŸŽ‰ BÃP! Cá»•ng kiá»ƒm soÃ¡t ${turnstileModalFac.name} Ä‘Ã£ má»Ÿ tá»± Ä‘á»™ng (0.28s). Xin chÃ o cÆ° dÃ¢n ${userName}!`);
      setTimeout(() => {
        setTurnstileSuccessMsg(null);
        setTurnstileModalFac(null);
      }, 2500);
    }, 700);
  };

  // Quáº¹t vÃ© Ä‘iá»‡n tá»­ QR Ä‘á»ƒ vÃ o cá»­a
  const handleCheckinTicket = (ticketCode: string) => {
    const result = checkinWithTicket(aptCode, ticketCode);
    if (result.success) {
      toast.success(result.message);
      setBookings(getFacilityBookings(aptCode));
      setAccessLogs(getFacilityCheckinLogs(aptCode));
    } else {
      toast.error(result.message);
    }
  };

  // Táº¡o Ä‘áº·t chá»— má»›i - ÄÃ£ tÃ­ch há»£p báº«y lá»—i trÃ¹ng giá», duplicate vÃ  giá»›i háº¡n sá»©c chá»©a
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingErrorMsg(null);
    setBookingSuccessMsg(null);

    const fac = amenitiesList.find(f => f.id === bookingFacilityId) || amenitiesList[0];
    const isPrivate = fac.id === 'fac-sauna';
    const isBbq = fac.id === 'fac-bbq';
    const depositAmount = isPrivate ? bookingDurationHours * 500000 : (isBbq ? 600000 : 0);
    const pricingText = isPrivate 
      ? `${(bookingDurationHours * 500000).toLocaleString('vi-VN')} Ä‘ (${bookingDurationHours} tiáº¿ng phÃ²ng VIP)` 
      : (isBbq ? '600.000 Ä‘ / ca tiá»‡c BBQ' : 'Miá»…n phÃ­ theo Tháº» CÆ° DÃ¢n');

    const result = createFacilityBooking(
      aptCode,
      fac.id,
      fac.name,
      bookingDate,
      bookingTimeSlot,
      userName,
      pricingText,
      bookingGuestCount,
      bookingNotes,
      bookingDurationHours,
      depositAmount,
      isPrivate,
      bookingPaymentMethod
    );

    if (!result.success || !result.newBooking) {
      setBookingErrorMsg(result.error || 'Äáº·t chá»— khÃ´ng thÃ nh cÃ´ng. Vui lÃ²ng kiá»ƒm tra láº¡i khung giá» vÃ  giá»›i háº¡n sá»©c chá»©a.');
      return;
    }

    setBookings(result.bookings);
    setQuota(getFacilityMonthlyQuota(aptCode));
    setBookingNotes('');
    setBookingSuccessMsg(
      `ðŸŽ‰ Äáº·t chá»— thÃ nh cÃ´ng! MÃ£ vÃ© Ä‘iá»‡n tá»­: [${result.newBooking.ticketCode}]. ` +
      (depositAmount > 0 
        ? `ÄÃ£ xÃ¡c nháº­n thanh toÃ¡n giá»¯ chá»— ${depositAmount.toLocaleString('vi-VN')} Ä‘ (${bookingPaymentMethod}). ` 
        : '') +
      `QuÃ½ cÆ° dÃ¢n cÃ³ thá»ƒ quáº¹t vÃ© QR táº¡i cá»•ng hoáº·c há»§y hoÃ n tiá»n náº¿u cÃ³ viá»‡c báº­n Ä‘á»™t xuáº¥t.`
    );
    setTimeout(() => setBookingSuccessMsg(null), 8000);
  };

  // Má»Ÿ modal hoÃ n tiá»n khi báº­n Ä‘á»™t xuáº¥t
  const handleOpenRefundModal = (booking: FacilityBooking) => {
    setRefundModalBooking(booking);
    setRefundReason('Báº­n viá»‡c gia Ä‘Ã¬nh Ä‘á»™t xuáº¥t khÃ´ng thá»ƒ tham gia');
  };

  // XÃ¡c nháº­n xá»­ lÃ½ hoÃ n tiá»n
  const handleConfirmRefund = () => {
    if (!refundModalBooking) return;
    setIsProcessingRefund(true);

    setTimeout(() => {
      const res = cancelFacilityBookingWithRefund(aptCode, refundModalBooking.id, refundReason);
      setBookings(res.bookings);
      setQuota(getFacilityMonthlyQuota(aptCode));
      setIsProcessingRefund(false);
      setRefundModalBooking(null);
      setRefundResultAlert({
        type: res.refundRate > 0 ? 'success' : 'warning',
        message: res.message
      });
      setTimeout(() => setRefundResultAlert(null), 8000);
    }, 600);
  };

  const filteredAmenities = amenitiesList.filter(item => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  const filteredLogs = accessLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.facilityId === logFilter;
  });

  if (missingApartment) return <MissingApartmentNotice />;
  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* ============================================================= */}
      {/* 1. HEADER CHÃNH: Äá»ŠNH DANH & THá»NG KÃŠ QUYá»€N Lá»¢I THá»°C Táº¾       */}
      {/* ============================================================= */}
      <div className="p-5 bg-gradient-to-r from-[#121820] via-[#161F2C] to-[#121820] border border-[#2A374A] rounded-none shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <span>{isEn ? 'Resident Amenities â€¢ Unit' : 'Tiá»‡n Ãch CÆ° DÃ¢n â€¢ CÄƒn'} {aptCode}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
            <span>{isEn ? 'Internal Amenities' : 'Tiá»‡n Ãch Ná»™i Khu'}</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono flex flex-wrap items-center gap-2">
            <span>{isEn ? 'Host Resident:' : 'Chá»§ Há»™:'} <strong className="text-white">{userName}</strong></span>
            <span className="text-gray-600">â€¢</span>
            <span className="text-emerald-400">{isEn ? 'Gym, Pool, Malibu Court: Free for Residents' : 'Gym, Bá»ƒ bÆ¡i, SÃ¢n Malibu: Miá»…n phÃ­ CÆ° DÃ¢n'}</span>
            <span className="text-gray-600">â€¢</span>
            <span>{isEn ? 'Fast gate unlock 0.28s' : 'Má»Ÿ cá»•ng 0.28s'}</span>
          </p>
        </div>

        {/* Quick Actions & Metrics */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <div className="h-11 px-3 bg-[#0D1117] border border-[#2A374A] rounded-none text-xs flex items-center justify-center gap-2 sm:gap-2.5 truncate">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="leading-tight truncate">
              <div className="text-[9px] uppercase tracking-wider text-gray-400 font-mono truncate">{isEn ? 'Monthly BBQ Quota' : 'Háº¡n Má»©c BBQ ThÃ¡ng'}</div>
              <div className="font-mono font-bold text-[#C5A880] text-xs truncate">{quota.remaining} / {quota.max} {isEn ? 'turns' : 'lÆ°á»£t'}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSmartCardModal(true)}
            className="h-11 px-3 sm:px-4 bg-[#1A2332] hover:bg-[#253247] border border-[#C5A880]/50 hover:border-[#C5A880] text-white text-xs font-bold uppercase rounded-none transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 truncate"
          >
            <CreditCard className="w-4 h-4 text-[#C5A880] shrink-0" />
            <span className="truncate">{isEn ? '3D Resident Card' : 'Tháº» CÆ° DÃ¢n 3D'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. THANH ÄIá»€U HÆ¯á»šNG 3 CHá»¨C NÄ‚NG (WORKFLOW TABS)               */}
      {/* ============================================================= */}
      <div className="flex items-center gap-2 border-b border-[#222B35] pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        {/* Chá»©c nÄƒng 1 */}
        <button
          type="button"
          onClick={() => setActiveTab('DISCOVER')}
          className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
            activeTab === 'DISCOVER'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span><span className="sm:hidden">{isEn ? 'Amenities' : 'Tiá»‡n Ãch'}</span><span className="hidden sm:inline">{isEn ? '1. Amenities Catalog' : '1. Danh Má»¥c Tiá»‡n Ãch'}</span> ({amenitiesList.length})</span>
        </button>

        {/* Chá»©c nÄƒng 2 */}
        <button
          type="button"
          onClick={() => setActiveTab('BOOKING')}
          className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
            activeTab === 'BOOKING'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span><span className="sm:hidden">{isEn ? 'Bookings' : 'Äáº·t Chá»—'}</span><span className="hidden sm:inline">{isEn ? '2. Bookings & Passes' : '2. Äáº·t Chá»— & VÃ© VÃ o'}</span> ({bookings.filter(b => b.status === 'CONFIRMED').length})</span>
        </button>

        {/* Chá»©c nÄƒng 3 */}
        <button
          type="button"
          onClick={() => setActiveTab('LOGS')}
          className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
            activeTab === 'LOGS'
              ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
              : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
          }`}
        >
          <History className="w-4 h-4" />
          <span><span className="sm:hidden">{isEn ? 'History' : 'Lá»‹ch Sá»­'}</span><span className="hidden sm:inline">{isEn ? '3. Access Log' : '3. Nháº­t KÃ½ Ra VÃ o'}</span> ({accessLogs.length})</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* CHá»¨C NÄ‚NG 1: KHÃM PHÃ TIá»†N ÃCH & CHECK-IN Cá»”NG TURNSTILE      */}
      {/* ============================================================= */}
      {activeTab === 'DISCOVER' && (
        <div className="space-y-4">
          {/* Bá»™ lá»c loáº¡i tiá»‡n Ã­ch */}
          <div className="flex items-center gap-1.5 bg-[#121820] p-2 border border-[#222B35] rounded-none overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              type="button"
              onClick={() => setFilterCategory('ALL')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${
                filterCategory === 'ALL' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
              }`}
            >
              {isEn ? `All (${amenitiesList.length})` : `Táº¥t Cáº£ (${amenitiesList.length})`}
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('SPORTS')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${
                filterCategory === 'SPORTS' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">{isEn ? 'Sports' : 'Thá»ƒ Thao'}</span>
              <span className="hidden sm:inline">{isEn ? 'Sports & Swimming Pool' : 'Thá»ƒ Thao & Há»“ BÆ¡i'}</span> ({amenitiesList.filter(a => a.category === 'SPORTS').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('WELLNESS')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${
                filterCategory === 'WELLNESS' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">{isEn ? 'Wellness' : 'Sá»©c Khá»e'}</span>
              <span className="hidden sm:inline">{isEn ? 'Wellness & Children' : 'Sá»©c Khá»e & Tráº» Em'}</span> ({amenitiesList.filter(a => a.category === 'WELLNESS').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('PARK')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${
                filterCategory === 'PARK' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">{isEn ? 'Parks' : 'CÃ´ng ViÃªn'}</span>
              <span className="hidden sm:inline">{isEn ? 'Parks & Landscape' : 'CÃ´ng ViÃªn & Cáº£nh Quan'}</span> ({amenitiesList.filter(a => a.category === 'PARK').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('PARTY')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${
                filterCategory === 'PARTY' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">{isEn ? 'BBQ' : 'Tiá»‡c BBQ'}</span>
              <span className="hidden sm:inline">{isEn ? 'BBQ Party & Social Area' : 'Tiá»‡c BBQ & SÃ¢n NhÃ³m'}</span> ({amenitiesList.filter(a => a.category === 'PARTY').length})
            </button>
          </div>

          {/* LÆ°á»›i hiá»ƒn thá»‹ cÃ¡c tiá»‡n Ã­ch */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAmenities.map((fac) => {
              const Icon = fac.icon;
              const isFreeEntry = fac.accessType === 'FREE_ENTRY';

              return (
                <div
                  key={fac.id}
                  className="bg-[#121820] border border-[#222B35] hover:border-[#C5A880]/60 transition-all rounded-none overflow-hidden flex flex-col justify-between group shadow-lg"
                >
                  {/* Image & Badges */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={fac.image}
                      alt={fac.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121820] via-[#121820]/30 to-transparent" />

                    {/* Badge Giá» Hoáº¡t Äá»™ng */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-[#222B35] px-2.5 py-1 text-[10px] text-white flex items-center gap-1.5 font-mono rounded-none">
                      <Clock className="w-3 h-3 text-[#C5A880]" />
                      <span>{fac.hours}</span>
                    </div>

                    {/* Badge Quyá»n Truy Cáº­p */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-none border ${
                        isFreeEntry 
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' 
                          : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                      }`}>
                        {isFreeEntry ? t('Cá»”NG Tá»° Äá»˜NG') : t('Cáº¦N Äáº¶T Lá»ŠCH')}
                      </span>
                    </div>

                    {/* TÃªn & Vá»‹ trÃ­ */}
                    <div className="absolute bottom-2.5 left-3.5 right-3 text-white">
                      <div className="text-sm font-bold font-serif flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-[#C5A880] shrink-0" />
                        <span className="line-clamp-1">{t(fac.name)}</span>
                      </div>
                      <div className="text-[10.5px] text-gray-300 font-mono mt-0.5">
                        {t(fac.location)}
                      </div>
                    </div>
                  </div>

                  {/* Body ThÃ´ng sá»‘ chi tiáº¿t */}
                  <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0D1117] p-2.5 rounded-none border border-[#1F2937]">
                        <div>
                          <div className="text-[9.5px] text-gray-400 uppercase">{t('Máº­t Ä‘á»™ hiá»‡n táº¡i:')}</div>
                          <div className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {t(fac.density)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] text-gray-400 uppercase">{t('MÃ´i trÆ°á»ng:')}</div>
                          <div className="font-semibold text-gray-200 mt-0.5">{t(fac.temp)}</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                        <span>{t('Biá»ƒu phÃ­:')}</span>
                        <strong className="text-[#C5A880]">{t(fac.price)}</strong>
                      </div>
                    </div>

                    {/* NÃºt hÃ nh Ä‘á»™ng rÃµ rÃ ng theo loáº¡i tiá»‡n Ã­ch */}
                    <div className="pt-2 border-t border-[#1F2937]">
                      {isFreeEntry ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTurnstileModalFac(fac);
                            setTurnstileSuccessMsg(null);
                          }}
                          className="w-full h-10 px-3 bg-gradient-to-r from-[#C5A880] to-[#E2D4BF] hover:from-[#d5b991] hover:to-white text-[#0D1117] text-xs font-bold uppercase rounded-none transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                        >
                          <DoorOpen className="w-4 h-4 shrink-0" />
                          <span className="truncate">{isEn ? 'Check-in Amenity' : 'VÃ o Cá»­a Tiá»‡n Ãch (Check-in)'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setBookingFacilityId(fac.id);
                            setActiveTab('BOOKING');
                          }}
                          className="w-full h-10 px-3 bg-[#1A2332] hover:bg-[#253247] border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-bold uppercase rounded-none transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                        >
                          <CalendarCheck className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate">{isEn ? 'Book Amenity Slot' : 'ÄÄƒng KÃ½ Äáº·t Lá»‹ch Giá»¯ Chá»—'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CHá»¨C NÄ‚NG 2: Äáº¶T CHá»– TIá»†N ÃCH & VÃ‰ ÄIá»†N Tá»¬ QR                   */}
      {/* ============================================================= */}
      {activeTab === 'BOOKING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* BÃªn TrÃ¡i: Form ÄÄƒng KÃ½ Äáº·t Chá»— (6 Cá»™t - CÃ¢n Xá»©ng) */}
          <div className="lg:col-span-6">
            <form onSubmit={handleCreateBooking} className="p-4 sm:p-5 bg-[#121820] border border-[#2A374A] rounded-none space-y-3.5 shadow-xl">
              <div className="border-b border-[#222B35] pb-2.5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
                  {isEn ? `Advance Amenity Reservation â€¢ Apt ${aptCode}` : `Dá»‹ch Vá»¥ Tiá»‡n Ãch Äáº·t TrÆ°á»›c â€¢ CÄƒn Há»™ ${aptCode}`}
                </div>
                <h3 className="font-serif text-lg text-white font-bold">
                  {isEn ? 'VIP Amenity Reservation Registration' : 'ÄÄƒng KÃ½ Äáº·t Chá»— Tiá»‡n Ãch VIP'}
                </h3>
              </div>

              {bookingSuccessMsg && (
                <div className="p-3 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs rounded-none leading-relaxed animate-fadeIn">
                  {bookingSuccessMsg}
                </div>
              )}

              {bookingErrorMsg && (
                <div className="p-3 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs rounded-none leading-relaxed flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-rose-300 uppercase tracking-wide text-[11px]">
                      {isEn ? 'Cannot Complete Reservation:' : 'KhÃ´ng Thá»ƒ HoÃ n Táº¥t Giá»¯ Chá»—:'}
                    </div>
                    <div>{bookingErrorMsg}</div>
                  </div>
                </div>
              )}

              {/* BÆ°á»›c 1: Tiá»‡n Ã­ch */}
              <div className="space-y-1">
                <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                  {isEn ? '1. Select facility to reserve:' : '1. Chá»n tiá»‡n Ã­ch muá»‘n Ä‘áº·t:'}
                </label>
                <select
                  value={bookingFacilityId}
                  onChange={(e) => setBookingFacilityId(e.target.value)}
                  className="w-full bg-[#161D26] border border-[#2A374A] p-2.5 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="fac-bbq">
                    {isEn ? 'Panoramic Rooftop BBQ Garden (25F) â€¢ 600,000 VND/slot' : 'VÆ°á»n Tiá»‡c NÆ°á»›ng BBQ Panoramic (SÃ¢n ThÆ°á»£ng Táº§ng 25) â€¢ 600.000 Ä‘/ca'}
                  </option>
                  <option value="fac-sports-malibu">
                    {isEn ? 'Malibu Sports Court (Tennis & Basketball) â€¢ Free for Residents' : 'SÃ¢n Thá»ƒ Thao Malibu (Tennis & BÃ³ng Rá»•) â€¢ Miá»…n PhÃ­ CÆ° DÃ¢n'}
                  </option>
                  <option value="fac-yoga">
                    {isEn ? 'Outdoor Yoga & Meditation Lawn BS-07 â€¢ Free for Residents' : 'SÃ¢n Yoga NgoÃ i Trá»i & Thiá»n TÄ©nh BS-07 â€¢ Miá»…n PhÃ­ CÆ° DÃ¢n'}
                  </option>
                  <option value="fac-cabana">
                    {isEn ? 'Cabana Lounge by Resort Pool BS-09 â€¢ Free for Residents' : 'ChÃ²i Nghá»‰ Cabana Ven Há»“ BÆ¡i Resort BS-09 â€¢ Miá»…n PhÃ­ CÆ° DÃ¢n'}
                  </option>
                  <option value="fac-multipurpose-lawn">
                    {isEn ? 'Multipurpose Lawn Y-01 Malibu (Mini-football/Pickleball) â€¢ Free for Residents' : 'SÃ¢n Cá» Äa NÄƒng Y-01 Malibu (BÃ³ng Ä‘Ã¡/Pickleball) â€¢ Miá»…n PhÃ­ CÆ° DÃ¢n'}
                  </option>
                  <option value="fac-sauna">
                    {isEn ? 'Himalayan Rock Salt Sauna (VIP 3F) â€¢ 500,000 VND/hr' : 'PhÃ²ng XÃ´ng HÆ¡i ÄÃ¡ Muá»‘i Himalaya (VIP Táº§ng 3) â€¢ 500.000 Ä‘/giá»'}
                  </option>
                </select>
              </div>

              {/* ThÃ´ng bÃ¡o phÃ²ng riÃªng tÆ° VIP náº¿u chá»n XÃ´ng hÆ¡i */}
              {bookingFacilityId === 'fac-sauna' && (
                <div className="p-2.5 bg-gradient-to-r from-[#C5A880]/15 to-transparent border-l-2 border-[#C5A880] rounded-none space-y-1 text-xs text-gray-200 animate-fadeIn">
                  <div className="font-bold text-[#C5A880] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEn ? 'VIP Private Family Suite' : 'Dá»‹ch Vá»¥ PhÃ²ng RiÃªng TÆ° Gia ÄÃ¬nh VIP'}</span>
                  </div>
                  <div className="text-[11px] text-gray-300 leading-relaxed">
                    {isEn
                      ? '100% private, pre-heated Himalayan rock salt sauna, premium plush towels and natural aromatherapy prepared for your appointment.'
                      : 'KhÃ©p kÃ­n 100%, Ä‘Æ°á»£c báº­t lÃ² gia nhiá»‡t Ä‘Ã¡ muá»‘i Himalaya, chuáº©n bá»‹ khÄƒn bÃ´ng cao cáº¥p vÃ  tinh dáº§u tháº£o má»™c tá»± nhiÃªn theo Ä‘Ãºng giá» háº¹n.'}
                  </div>
                </div>
              )}

              {/* Chá»n sá»‘ tiáº¿ng sá»­ dá»¥ng náº¿u lÃ  phÃ²ng xÃ´ng hÆ¡i riÃªng tÆ° */}
              {bookingFacilityId === 'fac-sauna' && (
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? 'VIP Room Duration:' : 'Sá»‘ tiáº¿ng Ä‘áº·t phÃ²ng VIP:'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setBookingDurationHours(h)}
                        className={`py-2 px-2 text-xs font-bold rounded-none transition-all flex flex-col items-center justify-center gap-0.5 border ${
                          bookingDurationHours === h
                            ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880] shadow'
                            : 'bg-[#161D26] text-gray-300 border-[#2A374A] hover:border-[#C5A880]/60'
                        }`}
                      >
                        <span>{h} {isEn ? (h > 1 ? 'Hours' : 'Hour') : 'Tiáº¿ng'}</span>
                        <span className="text-[10px] font-mono font-normal">{(h * 500000).toLocaleString('vi-VN')} {isEn ? 'VND' : 'Ä‘'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BÆ°á»›c 2: NgÃ y & Giá» */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? '2. Reservation Date:' : '2. NgÃ y Ä‘áº·t:'}
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? 'Time Slot:' : 'Khung giá»:'}
                  </label>
                  <select
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                  >
                    {facilityTimeSlots.map((slot) => {
                      const st = getFacilitySlotStatus(bookingFacilityId, bookingDate, slot, aptCode, isEn);
                      return (
                        <option
                          key={slot}
                          value={slot}
                          disabled={st.isFull || st.isUserBooked || st.isPast}
                        >
                          {slot} â€¢ [{st.statusBadge}]
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* HUD BÃ¡o Sá»©c Chá»©a & TÃ¬nh Tráº¡ng Giá»¯ Chá»— Realtime */}
              <div className={`p-3 border text-xs rounded-none space-y-1.5 transition-all ${
                currentSlotStatus.isPast
                  ? 'bg-[#141B24] border-gray-700 text-gray-400'
                  : currentSlotStatus.isUserBooked
                  ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                  : currentSlotStatus.isFull
                  ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                  : 'bg-[#141D29] border-[#C5A880]/40 text-[#C5A880]'
              }`}>
                <div className="flex items-center justify-between font-bold flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                    <span>{isEn ? 'Building Reservation Status:' : 'Tráº¡ng ThÃ¡i Giá»¯ Chá»— ToÃ n Khu:'}</span>
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border ${
                    currentSlotStatus.isPast
                      ? 'bg-gray-800 text-gray-400 border-gray-600'
                      : currentSlotStatus.isUserBooked
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : currentSlotStatus.isFull
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  }`}>
                    {currentSlotStatus.statusBadge}
                  </span>
                </div>
                <div className="text-[11px] text-gray-300 leading-relaxed">
                  {currentSlotStatus.isPast
                    ? (isEn ? 'This time slot has already passed today. Please select a later time slot.' : 'Khung giá» nÃ y Ä‘Ã£ trÃ´i qua trong ngÃ y hÃ´m nay. QuÃ½ cÆ° dÃ¢n vui lÃ²ng chá»n khung giá» káº¿ tiáº¿p.')
                    : currentSlotStatus.isUserBooked
                    ? (isEn ? `Apartment ${aptCode} already has an active reservation in this slot. Duplicate bookings are not allowed.` : `CÄƒn há»™ ${aptCode} Ä‘Ã£ cÃ³ phiáº¿u giá»¯ chá»— Ä‘ang cÃ³ hiá»‡u lá»±c trong khung giá» nÃ y. Há»‡ thá»‘ng khÃ´ng cho phÃ©p táº¡o phiáº¿u trÃ¹ng láº·p.`)
                    : currentSlotStatus.isFull
                    ? (isEn ? `This facility has reached maximum building capacity (${currentLimitRule.maxSlotsPerTime} reservations) in this time slot. Please choose another slot.` : `Tiá»‡n Ã­ch Ä‘Ã£ Ä‘áº¡t tá»‘i Ä‘a sá»©c chá»©a cá»§a toÃ n tÃ²a nhÃ  (${currentLimitRule.maxSlotsPerTime} lÆ°á»£t) trong khung giá» nÃ y. Vui lÃ²ng chá»n khung giá» khÃ¡c Ä‘á»ƒ giá»¯ chá»— thÃ nh cÃ´ng.`)
                    : (isEn ? `${currentLimitRule.descriptionEn || currentLimitRule.description}. System instantly locks the slot to prevent conflicts upon confirmation.` : `${currentLimitRule.description}. Há»‡ thá»‘ng láº­p tá»©c khÃ³a chá»— chá»‘ng trÃ¹ng giá» toÃ n bá»™ cÆ° dÃ¢n ngay sau khi xÃ¡c nháº­n.`)}
                </div>
              </div>

              {/* Chá»n phÆ°Æ¡ng thá»©c thanh toÃ¡n giá»¯ chá»— náº¿u tiá»‡n Ã­ch cÃ³ phÃ­ */}
              {(bookingFacilityId === 'fac-sauna' || bookingFacilityId === 'fac-bbq') && (
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? 'Reservation deposit payment method:' : 'PhÆ°Æ¡ng thá»©c thanh toÃ¡n giá»¯ chá»—:'}
                  </label>
                  <select
                    value={bookingPaymentMethod}
                    onChange={(e) => setBookingPaymentMethod(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="Trá»« vÃ o hÃ³a Ä‘Æ¡n sinh hoáº¡t thÃ¡ng tá»›i">
                      {isEn ? 'Deduct from next month utility invoice' : 'Trá»« vÃ o hÃ³a Ä‘Æ¡n sinh hoáº¡t thÃ¡ng tá»›i cá»§a cÄƒn há»™'}
                    </option>
                    <option value="QuÃ©t mÃ£ QR chuyá»ƒn khoáº£n ngÃ¢n hÃ ng">
                      {isEn ? 'Scan QR code for bank transfer' : 'QuÃ©t mÃ£ QR chuyá»ƒn khoáº£n ngÃ¢n hÃ ng BQL'}
                    </option>
                    <option value="Trá»« vÃ o sá»‘ dÆ° vÃ­ cÆ° dÃ¢n">
                      {isEn ? 'Deduct from resident wallet balance' : 'Trá»« vÃ o sá»‘ dÆ° vÃ­ cÆ° dÃ¢n'}
                    </option>
                  </select>
                </div>
              )}

              {/* BÆ°á»›c 3: Sá»‘ ngÆ°á»i & Ghi chÃº */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? '3. Number of participants:' : '3. Sá»‘ ngÆ°á»i tham gia:'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={bookingFacilityId === 'fac-sauna' ? 6 : 20}
                    value={bookingGuestCount}
                    onChange={(e) => setBookingGuestCount(Number(e.target.value))}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? 'Representative booker:' : 'NgÆ°á»i Ä‘áº¡i diá»‡n Ä‘áº·t:'}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    disabled
                    className="w-full bg-[#0D1117] border border-[#2A374A] p-2 text-gray-400 text-xs rounded-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                  {isEn ? 'Special requests (optional):' : 'Ghi chÃº yÃªu cáº§u phá»¥c vá»¥ (tÃ¹y chá»n):'}
                </label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder={
                    isEn
                      ? (bookingFacilityId === 'fac-sauna' 
                          ? 'e.g. Extra towels, lemongrass aromatherapy...' 
                          : bookingFacilityId === 'fac-bbq'
                          ? 'e.g. 2 Weber grills, BBQ tongs set...'
                          : 'e.g. Borrow tennis racquets, training balls...')
                      : (bookingFacilityId === 'fac-sauna' 
                          ? 'VD: Cáº§n thÃªm khÄƒn nhung, tinh dáº§u sáº£ chanh...' 
                          : bookingFacilityId === 'fac-bbq'
                          ? 'VD: Cáº§n 2 báº¿p nÆ°á»›ng Weber, dá»¥ng cá»¥ káº¹p BBQ...'
                          : 'VD: MÆ°á»£n vá»£t tennis, bÃ³ng táº­p...')
                  }
                  className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Chi phÃ­ & ChÃ­nh sÃ¡ch */}
              <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-none space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">{isEn ? 'Reservation Fee:' : 'Chi phÃ­ Ä‘áº·t giá»¯ chá»—:'}</span>
                  <span className="text-[#C5A880] font-bold text-sm font-mono">
                    {bookingFacilityId === 'fac-sauna'
                      ? `${(bookingDurationHours * 500000).toLocaleString('vi-VN')} ${isEn ? `VND (${bookingDurationHours} hours VIP room)` : `Ä‘ (${bookingDurationHours} tiáº¿ng phÃ²ng VIP)`}`
                      : bookingFacilityId === 'fac-bbq'
                      ? (isEn ? '600,000 VND / slot (Weber grill set & cleanup)' : '600.000 Ä‘ / ca tiá»‡c (Set báº¿p Weber & dá»n sau tiá»‡c)')
                      : (isEn ? '0 VND (Free with Skyline Resident Pass)' : '0 Ä‘ (Miá»…n phÃ­ theo Tháº» CÆ° DÃ¢n Skyline)')}
                  </span>
                </div>

                {(bookingFacilityId === 'fac-sauna' || bookingFacilityId === 'fac-bbq') ? (
                  <div className="pt-2 border-t border-[#1F2937] space-y-1 text-[11px] leading-relaxed">
                    <div className="text-[#C5A880] font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Refund Policy for Unforeseen Circumstances:' : 'ChÃ­nh sÃ¡ch hoÃ n tiá»n khi cÃ³ viá»‡c báº­n Ä‘á»™t xuáº¥t:'}</span>
                    </div>
                    <div className="space-y-0.5 text-gray-300">
                      <div className="flex items-start gap-1.5 text-emerald-400">
                        <span className="font-bold">âœ“</span>
                        <span><strong>{isEn ? '> 30 mins before appointment:' : 'TrÆ°á»›c giá» háº¹n > 30 phÃºt:'}</strong>{isEn ? <> REFUND <strong>100%</strong> slot deposit.</> : <> HoÃ n tráº£ <strong>100%</strong> tiá»n giá»¯ chá»—.</>}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-amber-300">
                        <span className="font-bold">âš¡</span>
                        <span><strong>{isEn ? 'Upcoming (within 30 mins):' : 'Cáº­n giá» (trong 30 phÃºt):'}</strong>{isEn ? <> REFUND <strong>50%</strong> (50% compensation for preparation costs).</> : <> HoÃ n tráº£ <strong>50%</strong> (50% bÃ¹ Ä‘áº¯p chi phÃ­ chuáº©n bá»‹).</>}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-gray-400">
                        <span className="font-bold">âœ•</span>
                        <span><strong>{isEn ? 'Appointment overtime starts:' : 'QuÃ¡ giá» háº¹n báº¯t Ä‘áº§u:'}</strong>{isEn ? ' No refund; amenity is reserved.' : ' KhÃ´ng hoÃ n tiá»n do tiá»‡n Ã­ch Ä‘Ã£ khÃ³a giá»¯ chá»—.'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#1F2937] space-y-1 text-[11px] text-gray-400 leading-relaxed">
                    <div className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Exclusive resident amenity privilege' : 'Äáº·c quyá»n tiá»‡n Ã­ch thá»ƒ thao miá»…n phÃ­ dÃ nh riÃªng cho CÆ° DÃ¢n'}</span>
                    </div>
                    <p>
                      {isEn
                        ? 'QR electronic pass is generated automatically for turnstile access. If your plans change, please cancel in the pass list to release the slot for other residents.'
                        : 'VÃ© Ä‘iá»‡n tá»­ QR sáº½ Ä‘Æ°á»£c táº¡o tá»± Ä‘á»™ng Ä‘á»ƒ quÃ©t táº¡i cá»•ng kiá»ƒm soÃ¡t. Náº¿u cÃ³ thay Ä‘á»•i lá»‹ch, vui lÃ²ng báº¥m há»§y vÃ© trong danh sÃ¡ch Ä‘á»ƒ nhÆ°á»ng khung giá» cho cÆ° dÃ¢n khÃ¡c.'}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={currentSlotStatus.isFull || currentSlotStatus.isUserBooked || currentSlotStatus.isPast}
                className={`w-full h-11 px-3 text-xs font-bold uppercase rounded-none transition-all flex items-center justify-center gap-2 shadow-lg truncate ${
                  currentSlotStatus.isFull || currentSlotStatus.isUserBooked || currentSlotStatus.isPast
                    ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed opacity-80'
                    : 'bg-[#C5A880] hover:bg-[#d5b991] text-[#0D1117] cursor-pointer active:scale-95'
                }`}
              >
                <Check className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {currentSlotStatus.isPast
                    ? (isEn ? 'Time Slot Has Passed' : 'Khung Giá» ÄÃ£ Qua')
                    : currentSlotStatus.isUserBooked
                    ? (isEn ? 'Already Reserved By Your Apt' : 'CÄƒn Há»™ ÄÃ£ Äáº·t Khung Giá» NÃ y')
                    : currentSlotStatus.isFull
                    ? (isEn ? 'Time Slot Fully Booked' : 'Khung Giá» ÄÃ£ Háº¿t Chá»— (KÃ­n Lá»‹ch)')
                    : (isEn ? 'Confirm Reservation & Generate QR Pass' : 'XÃ¡c Nháº­n Äáº·t Giá»¯ Chá»— & Táº¡o VÃ© QR')}
                </span>
              </button>
            </form>
          </div>

          {/* BÃªn Pháº£i: Quáº£n LÃ½ VÃ© Äiá»‡n Tá»­ Cá»§a CÄƒn Há»™ (6 Cá»™t - CÃ¢n Xá»©ng) */}
          <div className="lg:col-span-6 space-y-3.5">
            {/* ThÃ´ng bÃ¡o káº¿t quáº£ hoÃ n tiá»n náº¿u cÃ³ */}
            {refundResultAlert && (
              <div className={`p-3 rounded-none border text-xs leading-relaxed animate-fadeIn flex items-center justify-between gap-3 ${
                refundResultAlert.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-amber-950/80 border-amber-500 text-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{refundResultAlert.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRefundResultAlert(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="p-4 sm:p-5 bg-[#121820] border border-[#2A374A] rounded-none space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> 
                  <span>{isEn ? `Digital Passes Wallet Unit ${aptCode} (${bookings.length} Passes)` : `VÃ­ VÃ© Äiá»‡n Tá»­ Tiá»‡n Ãch CÄƒn Há»™ ${aptCode} (${bookings.length} VÃ©)`}</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  QuÃ©t vÃ© táº¡i cá»•ng tiá»‡n Ã­ch
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="p-8 text-center bg-[#0D1117] border border-[#222B35] rounded-none space-y-2">
                  <div className="w-10 h-10 rounded-none bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                    <Calendar className="w-5 h-5 text-[#C5A880]" />
                  </div>
                  <div className="text-xs font-bold text-white">{isEn ? 'No booking passes yet' : 'ChÆ°a cÃ³ vÃ© Ä‘áº·t chá»— nÃ o'}</div>
                  <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                    HÃ£y Ä‘iá»n thÃ´ng tin bÃªn trÃ¡i Ä‘á»ƒ Ä‘Äƒng kÃ½ PhÃ²ng xÃ´ng hÆ¡i VIP hoáº·c VÆ°á»n tiá»‡c nÆ°á»›ng BBQ Panoramic cho gia Ä‘Ã¬nh.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {bookings.map((b) => {
                    const isConfirmed = b.status === 'CONFIRMED';
                    const isCheckedIn = b.status === 'CHECKED_IN';
                    const isCancelled = b.status === 'CANCELLED';

                    return (
                      <div 
                        key={b.id}
                        className={`p-3.5 bg-[#0D1117] border rounded-none space-y-2.5 transition-all ${
                          isConfirmed ? 'border-[#2A374A]' : isCheckedIn ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-gray-800 opacity-70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{b.facilityName}</span>
                              {isCheckedIn && (
                                <span className="text-[10px] text-emerald-400 font-mono font-normal">
                                  (ÄÃ£ quÃ©t vÃ© vÃ o cá»­a)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-300 mt-0.5">
                              NgÃ y: <strong className="text-white">{b.bookingDate}</strong> â€¢ Khung: <strong className="text-white">{b.timeSlot}</strong>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              NgÆ°á»i Ä‘áº·t: {b.bookerName} â€¢ Sá»‘ lÆ°á»£ng: {b.guestCount || 2} ngÆ°á»i {b.notes ? `â€¢ Ghi chÃº: ${b.notes}` : ''}
                            </div>

                            {/* ThÃ´ng tin phÃ²ng riÃªng tÆ° & sá»‘ tiá»n Ä‘áº·t giá»¯ chá»— */}
                            {(b.isPrivate || b.facilityId === 'fac-sauna' || b.depositAmount) && (
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-[#C5A880]/15 text-[#C5A880] text-[9.5px] font-bold rounded-none">
                                  ðŸ‘‘ TIá»†N ÃCH VIP â€¢ {b.durationHours ? `${b.durationHours} TIáº¾NG` : 'THEO CA'}
                                </span>
                                <span className="text-[10px] text-gray-300 font-mono">
                                  {isEn ? 'Reserved deposit:' : 'ÄÃ£ giá»¯ chá»—:'} <strong className="text-[#C5A880]">{(b.depositAmount || 1000000).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'Ä‘'}</strong>
                                </span>
                              </div>
                            )}
                          </div>

                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-none uppercase border shrink-0 ${
                            isConfirmed 
                              ? 'bg-amber-950 text-amber-300 border-amber-500/40' 
                              : isCheckedIn
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-gray-800 text-gray-400 border-gray-600'
                          }`}>
                            {isConfirmed ? 'ÄÃƒ XÃC NHáº¬N' : isCheckedIn ? 'âœ“ ÄÃƒ CHECK-IN' : 'âœ• ÄÃƒ Há»¦Y Lá»ŠCH'}
                          </span>
                        </div>

                        {/* MÃ£ QR & Code Strip */}
                        <div className="p-2.5 bg-[#161D26] border border-[#222B35] rounded-none flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-gray-400 uppercase font-mono">{isEn ? 'Digital Pass Check-in Code:' : 'MÃ£ VÃ© Äiá»‡n Tá»­ Check-in:'}</div>
                            <div className="text-sm font-mono font-bold text-[#C5A880]">{b.ticketCode}</div>
                            <div className="text-[10px] text-gray-400">
                              {isCancelled ? 'VÃ© nÃ y Ä‘Ã£ Ä‘Æ°á»£c há»§y vÃ  thanh lÃ½' : 'Xuáº¥t trÃ¬nh táº¡i Ä‘áº§u Ä‘á»c mÃ£ QR cá»•ng vÃ o tiá»‡n Ã­ch'}
                            </div>
                          </div>

                          <div className={`p-1 bg-white rounded-none shrink-0 shadow ${isCancelled ? 'opacity-30' : ''}`}>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${b.ticketCode}`}
                              alt="Ticket QR"
                              className="w-14 h-14 object-contain"
                            />
                          </div>
                        </div>

                        {/* Chi tiáº¿t hoÃ n tiá»n náº¿u vÃ© Ä‘Ã£ há»§y */}
                        {isCancelled && (
                          <div className="p-2.5 bg-[#141B24] border border-[#222B35] rounded-none text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold">
                              {b.refundRate && b.refundRate > 0 ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isEn ? `Refunded ${b.refundRate}% (+${(b.refundAmount || 0).toLocaleString('en-US')} VND)` : `ÄÃ£ hoÃ n tiá»n ${b.refundRate}% (+${(b.refundAmount || 0).toLocaleString('vi-VN')} Ä‘)`}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5 text-gray-500" />
                                  <span>{isEn ? 'No refund applicable' : 'KhÃ´ng Ã¡p dá»¥ng hoÃ n tiá»n'}</span>
                                </span>
                              )}
                            </div>
                            {b.refundNote && (
                              <div className="text-[10.5px] text-gray-400 leading-relaxed">
                                {b.refundNote}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          {isConfirmed ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenRefundModal(b)}
                                className="w-full sm:w-auto h-9 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold rounded-none transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 truncate"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                <span className="truncate">{isEn ? 'Cancel & Refund' : 'Há»§y Lá»‹ch & HoÃ n Tiá»n'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCheckinTicket(b.ticketCode)}
                                className="w-full sm:w-auto h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none transition-colors flex items-center justify-center gap-1.5 shadow active:scale-95 truncate"
                              >
                                <DoorOpen className="w-3.5 h-3.5 shrink-0" /> 
                                <span className="truncate">{isEn ? 'Scan Gate Pass Now' : 'Quáº¹t VÃ© VÃ o Cá»•ng Ngay'}</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-500 italic">
                              {isCheckedIn ? 'VÃ© Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng thÃ nh cÃ´ng.' : 'Lá»‹ch Ä‘áº·t Ä‘Ã£ Ä‘Æ°á»£c thanh lÃ½ theo quy cháº¿.'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CHá»¨C NÄ‚NG 3: NHáº¬T KÃ Sá»¬ Dá»¤NG TIá»†N ÃCH THá»œI GIAN THá»°C          */}
      {/* ============================================================= */}
      {activeTab === 'LOGS' && (
        <div className="p-4 sm:p-5 bg-[#121820] border border-[#2A374A] rounded-none space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>{isEn ? `Real-Time Facility Access Log Unit ${aptCode}` : `Nháº­t KÃ½ Ra VÃ o Tiá»‡n Ãch Thá»i Gian Thá»±c CÄƒn Há»™ ${aptCode}`}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Dá»¯ liá»‡u ghi nháº­n tá»± Ä‘á»™ng theo thá»i gian thá»±c khi cÆ° dÃ¢n qua cá»•ng tiá»‡n Ã­ch
              </div>
            </div>

            {/* Filter by facility */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setLogFilter('ALL')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-none font-bold transition-colors ${
                  logFilter === 'ALL' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Táº¥t Cáº£ ({accessLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-pool')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-none font-bold transition-colors ${
                  logFilter === 'fac-pool' ? 'bg-cyan-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Há»“ BÆ¡i
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-gym')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-none font-bold transition-colors ${
                  logFilter === 'fac-gym' ? 'bg-blue-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Gym
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-bbq')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-none font-bold transition-colors ${
                  logFilter === 'fac-bbq' ? 'bg-amber-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                BBQ
              </button>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center bg-[#0D1117] border border-[#222B35] rounded-none space-y-2">
              <div className="w-10 h-10 rounded-none bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                <History className="w-5 h-5 text-[#C5A880]" />
              </div>
              <div className="text-xs font-bold text-white">{isEn ? 'No facility access events yet' : 'ChÆ°a cÃ³ lÆ°á»£t ra vÃ o tiá»‡n Ã­ch nÃ o'}</div>
              <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                Khi cÆ° dÃ¢n quáº¹t tháº» hoáº·c dÃ¹ng nháº­n diá»‡n khuÃ´n máº·t qua cá»•ng táº¡i Há»“ bÆ¡i, Gym, BBQ, há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng hiá»ƒn thá»‹ nháº­t kÃ½ táº¡i Ä‘Ã¢y.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#222B35] max-h-[460px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-none bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{log.facilityName}</div>
                      <div className="text-[11px] text-gray-400">
                        {isEn ? 'Resident:' : 'CÆ° dÃ¢n:'} <strong className="text-gray-200">{log.userName}</strong> ({log.role}) â€¢ {isEn ? 'Auth:' : 'XÃ¡c thá»±c:'} <span className="text-[#C5A880]">{log.method === 'NFC_CARD' ? (isEn ? 'Resident Card' : 'Tháº» CÆ° DÃ¢n') : (isEn ? 'Face Recognition' : 'Nháº­n Diá»‡n KhuÃ´n Máº·t')}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {log.detail}
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0 font-mono text-[11px]">
                    <div className="text-[#C5A880] font-bold">{log.timestamp}</div>
                    <div className="text-[9.5px] text-emerald-400 uppercase">{isEn ? 'âœ“ GATE UNLOCKED SUCCESSFULLY' : 'âœ“ Cá»”NG Má»ž THÃ€NH CÃ”NG'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: Cá»”NG VÃ€O TIá»†N ÃCH THÃ”NG MINH (QUáº¸T THáºº / KHUÃ”N Máº¶T) */}
      {/* ============================================================= */}
      {turnstileModalFac && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-[#121820] border-2 border-[#C5A880] rounded-none shadow-2xl max-w-md w-full overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="p-4 bg-[#161F2C] border-b border-[#2A374A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-[#C5A880]" />
                <div>
                  <h4 className="font-serif text-sm font-bold text-white">
                    Cá»•ng VÃ o Tiá»‡n Ãch: {turnstileModalFac.name}
                  </h4>
                  <div className="text-[10px] text-gray-400 font-mono">{turnstileModalFac.location}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTurnstileModalFac(null)}
                className="p-1 text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-center">
              {turnstileSuccessMsg ? (
                <div className="p-4 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-none text-xs font-mono space-y-2 animate-fadeIn">
                  <DoorOpen className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                  <div className="font-bold">{turnstileSuccessMsg}</div>
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-300 leading-relaxed">
                    Chá»n cÃ¡ch má»Ÿ cá»­a Ä‘á»ƒ vÃ o tiá»‡n Ã­ch:
                  </div>

                  {/* Method Switcher */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTurnstileMethod('NFC')}
                      className={`p-3 rounded-none border text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                        turnstileMethod === 'NFC'
                          ? 'bg-blue-950/80 border-blue-500 text-blue-300 ring-1 ring-blue-400'
                          : 'bg-[#161D26] border-[#2A374A] text-gray-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span>{isEn ? 'Tap Resident Card' : 'Quáº¹t Tháº» CÆ° DÃ¢n'}</span>
                      <span className="text-[9px] font-mono font-normal">{isEn ? 'Tap card to sensor' : 'Cháº¡m tháº» vÃ o mÃ¡y quÃ©t'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTurnstileMethod('FACE_ID')}
                      className={`p-3 rounded-none border text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                        turnstileMethod === 'FACE_ID'
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 ring-1 ring-cyan-400'
                          : 'bg-[#161D26] border-[#2A374A] text-gray-400 hover:text-white'
                      }`}
                    >
                      <ScanFace className="w-6 h-6" />
                      <span>{isEn ? 'Face Recognition' : 'Nháº­n Diá»‡n KhuÃ´n Máº·t'}</span>
                      <span className="text-[9px] font-mono font-normal">{isEn ? 'Look at camera' : 'NhÃ¬n vÃ o camera'}</span>
                    </button>
                  </div>

                  {/* Visual Card / Biometric Preview */}
                  <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-none text-xs font-mono text-gray-300 space-y-1">
                    <div className="text-white font-bold">{userName} ({isEn ? 'Unit' : 'CÄƒn'} {aptCode})</div>
                    <div className="text-[10px] text-gray-400">
                      {turnstileMethod === 'NFC' ? 'Tháº» cÆ° dÃ¢n chÃ­nh cá»§a cÄƒn há»™' : 'KhuÃ´n máº·t cÆ° dÃ¢n Ä‘Ã£ kÃ­ch hoáº¡t'}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleExecuteTurnstileCheckin}
                    disabled={isTurnstileScanning}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isTurnstileScanning ? (
                      <>
                        <Wifi className="w-4 h-4 animate-spin rotate-90" />
                        <span>{isEn ? 'Unlocking Amenity Gate...' : 'Äang Má»Ÿ Cá»­a VÃ o Tiá»‡n Ãch...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isEn ? 'Unlock Amenity Gate' : 'Má»Ÿ Cá»­a VÃ o Tiá»‡n Ãch'}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: XEM THáºº CÆ¯ DÃ‚N KIM LOáº I VIP 3D                       */}
      {/* ============================================================= */}
      {showSmartCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-[#121820] border-2 border-[#C5A880] rounded-none shadow-2xl max-w-lg w-full overflow-hidden space-y-4">
            <div className="p-4 bg-[#161F2C] border-b border-[#2A374A] flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A880]" />
                <span>{isEn ? `Gold-Plated Resident Card Unit ${aptCode}` : `Tháº» CÆ° DÃ¢n Kim Loáº¡i Máº¡ VÃ ng CÄƒn ${aptCode}`}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSmartCardModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <ResidentSmartCard 
                currentUser={currentUser} 
                onTapSuccess={(fac) => {
                  toast.success(`Cá»•ng ${fac} Ä‘Ã£ má»Ÿ tá»± Ä‘á»™ng cho cÆ° dÃ¢n CÄƒn ${aptCode}!`);
                  setAccessLogs(getFacilityCheckinLogs(aptCode));
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* ============================================================= */}
      {/* MODAL 3: Há»¦Y Lá»ŠCH TIá»†N ÃCH & HOÃ€N TIá»€N KHI Báº¬N Äá»˜T XUáº¤T       */}
      {/* ============================================================= */}
      {refundModalBooking && (() => {
        const refundEstimate = calculateRefundEstimate(refundModalBooking);
        const isFull = refundEstimate.policyTier === 'FULL_100';
        const isPartial = refundEstimate.policyTier === 'PARTIAL_50';
        const isNone = refundEstimate.policyTier === 'NO_REFUND_0';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn p-4">
            <div className="bg-[#121820] border border-[#C5A880] rounded-none shadow-2xl max-w-md w-full overflow-hidden space-y-4">
              {/* Header */}
              <div className="p-4 bg-[#161F2C] border-b border-[#2A374A] flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.15em] text-[#C5A880] font-bold flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#C5A880]" />
                  <span>{isEn ? 'Refund Request For Schedule Conflict' : 'YÃªu Cáº§u HoÃ n Tiá»n Khi Báº­n Äá»™t Xuáº¥t'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRefundModalBooking(null)}
                  disabled={isProcessingRefund}
                  className="p-1 text-gray-400 hover:text-white rounded-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs">
                {/* ThÃ´ng tin vÃ© Ä‘áº·t */}
                <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-none space-y-1.5">
                  <div className="text-white font-bold text-sm flex items-center justify-between">
                    <span>{refundModalBooking.facilityName}</span>
                    <span className="text-[10px] text-[#C5A880] font-mono">{refundModalBooking.ticketCode}</span>
                  </div>
                  <div className="text-gray-300">
                    Thá»i gian háº¹n: <strong className="text-white">{refundModalBooking.bookingDate} ({refundModalBooking.timeSlot})</strong>
                  </div>
                  <div className="text-gray-400">
                    {isEn ? 'Deposit amount paid:' : 'Sá»‘ tiá»n Ä‘Ã£ Ä‘áº·t giá»¯ chá»—:'} <strong className="text-[#C5A880]">{(refundModalBooking.depositAmount || 500000).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'VNÄ'}</strong> ({refundModalBooking.paymentMethod || (isEn ? 'Next month bill' : 'HÃ³a Ä‘Æ¡n thÃ¡ng tá»›i')})
                  </div>
                </div>

                {/* PhÃ¢n tÃ­ch tá»· lá»‡ hoÃ n tiá»n thá»i gian thá»±c */}
                <div className={`p-4 rounded-none border space-y-2 ${
                  isFull 
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200' 
                    : isPartial 
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200' 
                      : 'bg-gray-900 border-gray-700 text-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      {isFull && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {isPartial && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {isNone && <XCircle className="w-4 h-4 text-gray-400" />}
                      <span>{refundEstimate.title}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-none font-mono font-bold text-xs ${
                      isFull ? 'bg-emerald-600 text-white' : isPartial ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}>
                      HOÃ€N {refundEstimate.refundRate}%
                    </span>
                  </div>

                  <div className="text-[11px] leading-relaxed opacity-90">
                    {refundEstimate.reason}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between font-mono">
                    <span className="text-gray-400">{isEn ? 'Refund credited to unit:' : 'Sá»‘ tiá»n hoÃ n tráº£ vá» cÄƒn há»™:'}</span>
                    <span className={`text-base font-bold ${
                      isFull ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      +{refundEstimate.refundAmount.toLocaleString('vi-VN')} VNÄ
                    </span>
                  </div>
                </div>

                {/* Chá»n hoáº·c nháº­p lÃ½ do báº­n */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    LÃ½ do há»§y lá»‹ch (tÃ¹y chá»n):
                  </label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="Báº­n viá»‡c gia Ä‘Ã¬nh Ä‘á»™t xuáº¥t khÃ´ng thá»ƒ tham gia">{isEn ? 'Family emergency' : 'Báº­n viá»‡c gia Ä‘Ã¬nh Ä‘á»™t xuáº¥t'}</option>
                    <option value="Lá»‹ch cÃ´ng tÃ¡c / Ä‘i xa phÃ¡t sinh ngoÃ i dá»± kiáº¿n">{isEn ? 'Unexpected business trip' : 'Lá»‹ch cÃ´ng tÃ¡c / Ä‘i xa Ä‘á»™t xuáº¥t'}</option>
                    <option value="Sá»©c khá»e khÃ´ng Ä‘áº£m báº£o, cáº§n nghá»‰ ngÆ¡i">{isEn ? 'Health condition, needing rest' : 'Sá»©c khá»e khÃ´ng Ä‘áº£m báº£o, cáº§n nghá»‰ ngÆ¡i'}</option>
                    <option value="Thay Ä‘á»•i káº¿ hoáº¡ch khÃ¡c cÃ¹ng báº¡n bÃ¨/ngÆ°á»i thÃ¢n">{isEn ? 'Schedule changed' : 'Thay Ä‘á»•i káº¿ hoáº¡ch khÃ¡c'}</option>
                  </select>
                </div>

                <div className="text-[10.5px] text-gray-400 italic">
                  * Sá»‘ tiá»n hoÃ n tráº£ sáº½ Ä‘Æ°á»£c VinHomes Manager tá»± Ä‘á»™ng káº¿t chuyá»ƒn vÃ  giáº£m trá»« trá»±c tiáº¿p vÃ o hÃ³a Ä‘Æ¡n sinh hoáº¡t ká»³ káº¿ tiáº¿p cá»§a cÄƒn há»™ {aptCode}.
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRefundModalBooking(null)}
                    disabled={isProcessingRefund}
                    className="h-10 px-3 bg-[#161D26] hover:bg-[#1E2633] text-gray-300 text-xs font-bold rounded-none border border-[#2A374A] transition-colors flex items-center justify-center active:scale-95"
                  >
                    <span>{isEn ? 'Keep Booking' : 'Giá»¯ Láº¡i Lá»‹ch Äáº·t'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmRefund}
                    disabled={isProcessingRefund}
                    className="h-10 px-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-none transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
                  >
                    {isProcessingRefund ? (
                      <>
                        <Wifi className="w-3.5 h-3.5 animate-spin rotate-90 shrink-0" />
                        <span className="truncate">{isEn ? 'Processing Refund...' : 'Äang Xá»­ LÃ½ HoÃ n Tiá»n...'}</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{isEn ? 'Confirm Cancel & Refund' : 'XÃ¡c Nháº­n Há»§y & HoÃ n Tiá»n'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
