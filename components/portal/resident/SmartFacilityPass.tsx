'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import QrImage from '@/components/ui/QrImage';
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

import type { FacilityAmenityItem, FacilityContext } from './smartFacilityTypes';
import SmartFacilityBookingTabView from './SmartFacilityBookingTabView';
import SmartFacilityLogsAndModals from './SmartFacilityLogsAndModals';
export default function SmartFacilityPass({ currentUser, onNavigateModule }: SmartFacilityPassProps) {
  const { t, isEn } = useLanguage();
  const { aptCode, missing: missingApartment } = useResidentApartment(currentUser);
  const isOwner = currentUser.role === 'OWNER';
  const userName = currentUser?.full_name || 'Cư Dân';

  // 3 Chức năng rõ ràng
  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'BOOKING' | 'LOGS'>('DISCOVER');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SPORTS' | 'WELLNESS' | 'PARTY' | 'PARK'>('ALL');
  const [logFilter, setLogFilter] = useState<string>('ALL');

  // Modal State
  const [showSmartCardModal, setShowSmartCardModal] = useState(false);
  const [turnstileModalFac, setTurnstileModalFac] = useState<FacilityAmenityItem | null>(null);
  const [turnstileMethod, setTurnstileMethod] = useState<'NFC' | 'FACE_ID'>('NFC');
  const [isTurnstileScanning, setIsTurnstileScanning] = useState(false);
  const [turnstileSuccessMsg, setTurnstileSuccessMsg] = useState<string | null>(null);

  // 14 tiện ích chuẩn phân khu The Tropical Vinhomes Grand Park
  const amenitiesList = [
    // ===== SPORTS =====
    {
      id: 'fac-pool-resort',
      name: 'Bể Bơi Nhiệt Đới Resort',
      category: 'SPORTS',
      location: 'Trung Tâm Phân Khu (Giữa BS-08/BS-09)',
      hours: '06:00 - 22:00',
      density: 'Ozone xử lý • 29°C',
      temp: 'Chuẩn Resort 5★',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Waves,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Vào Tự Do (NFC / FaceID)',
      price: 'Miễn phí theo Thẻ Cư Dân'
    },
    {
      id: 'fac-pool-malibu',
      name: 'Bể Bơi Malibu California',
      category: 'SPORTS',
      location: 'Cụm Phía Tây (Cạnh Sân Thể Thao BS-10)',
      hours: '06:00 - 21:30',
      density: 'Phong cách Bờ Tây nước Mỹ',
      temp: 'Ozone lọc 3 cấp',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Waves,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Vào Tự Do (NFC / FaceID)',
      price: 'Miễn phí theo Thẻ Cư Dân'
    },
    {
      id: 'fac-gym',
      name: 'Phòng Gym Technogym',
      category: 'SPORTS',
      location: 'Tầng 3 (Khu Thể Thao)',
      hours: 'Mở cửa 24/7',
      density: '38% (Bình thường)',
      temp: '22°C • Điều hòa ion',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Dumbbell,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Vào Tự Do 24/7',
      price: 'Miễn phí theo Thẻ Cư Dân'
    },
    {
      id: 'fac-gym-outdoor',
      name: 'Sân Gym Ngoài Trời',
      category: 'SPORTS',
      location: 'Cạnh BS-09 (Phía Đông Hồ Bơi)',
      hours: '06:00 - 21:30',
      density: 'Máy tập đa năng ngoài trời',
      temp: 'Trời thoáng mát',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Dumbbell,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Vào Tự Do (Không cần thẻ)',
      price: 'Hoàn toàn miễn phí'
    },
    {
      id: 'fac-sports-malibu',
      name: 'Sân Thể Thao Malibu (Tennis & Bóng Rổ)',
      category: 'SPORTS',
      location: 'Cụm Malibu Phía Tây (BS-10)',
      hours: '06:00 - 21:30',
      density: 'Sân Tennis ATP + Sân Bóng Rổ FIBA',
      temp: 'Đèn chiếu sáng ban đêm',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Flame,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Đặt Sân Giữ Chỗ (Tab Đặt Chỗ)',
      price: 'Miễn phí theo Thẻ Cư Dân (Tối đa 2 ca/tuần)'
    },
    {
      id: 'fac-yoga',
      name: 'Sân Yoga Ngoài Trời & Thiền',
      category: 'WELLNESS',
      location: 'Cạnh BS-07 (Liền kề Phố Cọ Rodeo)',
      hours: '06:00 - 20:00',
      density: 'Không gian tĩnh lặng, thảm tập outdoor',
      temp: 'Cây xanh bóng mát tự nhiên',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Smile,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Đăng Ký Khung Giờ (Tab Đặt Chỗ)',
      price: 'Miễn phí theo Thẻ Cư Dân'
    },
    {
      id: 'fac-sauna',
      name: 'Phòng Xông Hơi Đá Muối VIP',
      category: 'WELLNESS',
      location: 'Tầng 3 (Khu Chăm Sóc Sức Khỏe)',
      hours: '09:00 - 21:00 (Theo giờ đặt)',
      density: 'Phòng riêng gia đình',
      temp: '48°C • Tinh dầu thảo mộc Himalaya',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Flame,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Đặt Phòng VIP (Tối Đa 2 Người)',
      price: 'Phòng riêng tư VIP • 500.000 đ/giờ'
    },
    {
      id: 'fac-kids',
      name: 'Khu Vui Chơi Trẻ Em',
      category: 'WELLNESS',
      location: 'Tầng 1 (Sảnh Chung Cư A) & Ngoài Trời',
      hours: '07:00 - 21:00',
      density: '30% (Vừa)',
      temp: '24°C • Sàn kháng khuẩn nhập khẩu',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Smile,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Vào Tự Do (Trẻ Em & Gia Đình)',
      price: 'Miễn phí theo Thẻ Cư Dân'
    },
    // ===== PARK & GARDEN =====
    {
      id: 'fac-rodeo-street',
      name: 'Phố Cọ Rodeo & Dạo Bộ',
      category: 'PARK',
      location: 'Liền Kề BS-07 (Trục Phía Tây)',
      hours: '00:00 - 24:00 (Mở cửa cả ngày)',
      density: 'Shophouse & Cà phê nhiệt đới',
      temp: 'Bóng cọ tự nhiên thoáng mát',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: UtensilsCrossed,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Không Gian Công Cộng',
      price: 'Tự do ra vào cả ngày'
    },
    {
      id: 'fac-california-garden',
      name: 'Vườn California & Dạo Bộ',
      category: 'PARK',
      location: 'Giữa BS-07 & BS-08 (Trung Tâm)',
      hours: '06:00 - 22:00',
      density: 'Cảnh quan cây xanh Bờ Tây',
      temp: 'Hệ thống tưới nhỏ giọt tự động',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Trees,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Không Gian Xanh Công Cộng',
      price: 'Tự do ra vào cả ngày'
    },
    {
      id: 'fac-stream-waterfall',
      name: 'Suối Bậc Thang & Thác Cảnh Quan',
      category: 'PARK',
      location: 'Trung Tâm Phân Khu (Ven Hồ Bơi)',
      hours: '06:00 - 23:00',
      density: 'Hệ thống thác nước tự động',
      temp: 'Âm thanh suối tự nhiên',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Waves,
      accessType: 'FREE_ENTRY',
      accessBadge: 'Không Gian Công Cộng',
      price: 'Tự do ngắm cảnh & chụp ảnh'
    },
    {
      id: 'fac-cabana',
      name: 'Chòi Nghỉ Cabana Ven Hồ',
      category: 'PARK',
      location: 'Ven Hồ Bơi Resort BS-09',
      hours: '08:00 - 21:00 (Đặt trước)',
      density: 'Chòi riêng tư, view hồ bơi',
      temp: 'Mái lá tự nhiên chống nắng',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Smile,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Đặt Chòi Riêng (Tối Đa 4 Người)',
      price: 'Miễn phí • Đặt trước qua Thẻ Cư Dân'
    },
    // ===== PARTY =====
    {
      id: 'fac-bbq',
      name: 'Vườn Tiệc Nướng BBQ Sân Thượng',
      category: 'PARTY',
      location: 'Tầng 25 (Khu Vườn Nướng Ngoài Trời)',
      hours: '17:00 - 23:00 (Theo ca)',
      density: 'Sẵn sàng 4/6 khu bếp Weber',
      temp: 'View Panorama 360° toàn khu',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: UtensilsCrossed,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Đăng Ký Theo Ca Tiệc',
      price: 'Bếp Weber & dọn sau tiệc • 600.000 đ/ca (Ca 3 giờ)'
    },
    {
      id: 'fac-multipurpose-lawn',
      name: 'Sân Cỏ Đa Năng Y-01 (Malibu)',
      category: 'PARTY',
      location: 'Cụm Malibu Phía Tây (Cạnh BS-10)',
      hours: '07:00 - 21:00',
      density: '800m² cỏ nhân tạo thế hệ 4',
      temp: 'Hệ thống thoát nước tự động',
      image: '/masterplan/vinhomes-amenities-map.jpg',
      icon: Flame,
      accessType: 'BOOKING_REQUIRED',
      accessBadge: 'Đặt Sân Nhóm (≤ 20 Người)',
      price: 'Miễn phí theo Thẻ Cư Dân (Đăng ký ca 2 giờ)'
    },
  ];

  // Dữ liệu thực tế từ Store (Không dữ liệu ảo)
  const [accessLogs, setAccessLogs] = useState<FacilityCheckinLog[]>(() => getFacilityCheckinLogs(aptCode));
  const [bookings, setBookings] = useState<FacilityBooking[]>(() => getFacilityBookings(aptCode));
  const [quota, setQuota] = useState(() => getFacilityMonthlyQuota(aptCode));

  // State Form đặt chỗ
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingFacilityId, setBookingFacilityId] = useState('fac-sauna');
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('18:00 - 20:00 (Buổi tối - Giờ đẹp)');
  const [bookingGuestCount, setBookingGuestCount] = useState(2);
  const [bookingDurationHours, setBookingDurationHours] = useState(2);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('Trừ vào hóa đơn sinh hoạt tháng tới');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);

  // Danh sách khung giờ tối ưu theo từng loại tiện ích (Hỗ trợ chuyển ngữ VI / EN)
  const facilityTimeSlots = useMemo(() => {
    if (bookingFacilityId === 'fac-bbq') {
      return isEn ? [
        '17:00 - 19:30 (Sunset Rooftop BBQ Session)',
        '19:30 - 22:00 (Starlight Night BBQ Session)',
      ] : [
        '17:00 - 19:30 (Ca Tiệc Hoàng Hôn Sân Thượng)',
        '19:30 - 22:00 (Ca Tiệc Đêm Ánh Sao Sân Thượng)',
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
        '09:00 - 11:00 (Buổi sáng thanh lọc)',
        '11:00 - 13:00 (Trưa thư giãn)',
        '14:00 - 16:00 (Đầu giờ chiều)',
        '16:00 - 18:00 (Hoàng hôn phục hồi)',
        '18:00 - 20:00 (Buổi tối VIP - Giờ đẹp)',
        '20:00 - 21:30 (Đêm thư thái)',
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
      '06:00 - 08:00 (Sáng sớm bình minh)',
      '08:00 - 10:00 (Buổi sáng thư giãn)',
      '10:00 - 12:00 (Trưa thanh tịnh)',
      '14:00 - 16:00 (Đầu giờ chiều)',
      '16:00 - 18:00 (Hoàng hôn)',
      '18:00 - 20:00 (Buổi tối - Giờ đẹp)',
      '20:00 - 22:00 (Phục hồi thể lực đêm)',
    ];
  }, [bookingFacilityId, isEn]);

  // Tự động chuyển khung giờ hợp lệ khi đổi tiện ích
  useEffect(() => {
    if (!facilityTimeSlots.includes(bookingTimeSlot)) {
      setBookingTimeSlot(facilityTimeSlots[0] || '18:00 - 20:00');
    }
  }, [facilityTimeSlots, bookingTimeSlot]);

  // Tra cứu trạng thái số chỗ khả dụng trong thời gian thực (Bilingual)
  const currentSlotStatus = useMemo(() => {
    return getFacilitySlotStatus(bookingFacilityId, bookingDate, bookingTimeSlot, aptCode, isEn);
  }, [bookingFacilityId, bookingDate, bookingTimeSlot, aptCode, bookings, isEn]);

  const currentLimitRule = FACILITY_LIMIT_RULES[bookingFacilityId] || {
    facilityId: bookingFacilityId,
    facilityName: 'Tiện ích',
    facilityNameEn: 'Facility',
    maxSlotsPerTime: 2,
    maxGuests: 10,
    isPrivate: false,
    description: 'Tiện ích chung cư (Tối đa 2 lượt / khung giờ)',
    descriptionEn: 'Apartment facility (Max 2 slots / time slot)'
  };

  // State Modal Hoàn Tiền Khi Bận Đột Xuất
  const [refundModalBooking, setRefundModalBooking] = useState<FacilityBooking | null>(null);
  const [refundReason, setRefundReason] = useState('Bận đột xuất không thể sắp xếp tham gia');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundResultAlert, setRefundResultAlert] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  useEffect(() => {
    syncFacilityBookingsFromDb(aptCode)
      .then((list) => {
        setBookings(list);
        setQuota(getFacilityMonthlyQuota(aptCode));
      })
      .catch((err) => console.error('Lỗi đồng bộ lịch sử đặt tiện ích:', err));

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
            .catch(() => { });
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('skyline_facility_log_added', handleLogAdded);
      window.removeEventListener('skyline_facility_booked', handleBooked);
      supabase.removeChannel(channel);
    };
  }, [aptCode]);

  // Xử lý xác nhận check-in qua cổng Turnstile
  const handleExecuteTurnstileCheckin = () => {
    if (!turnstileModalFac || isTurnstileScanning) return;
    setIsTurnstileScanning(true);

    setTimeout(() => {
      setIsTurnstileScanning(false);
      const methodText = turnstileMethod === 'NFC' ? 'Thẻ Cư Dân' : 'Nhận Diện Khuôn Mặt';

      // Ghi log thực tế vào Store
      const updated = addFacilityCheckinLog(aptCode, {
        facilityId: turnstileModalFac.id,
        facilityName: turnstileModalFac.name,
        userName: userName,
        role: isOwner ? 'Chủ Hộ (Master)' : 'Người Nhà',
        method: turnstileMethod === 'NFC' ? 'NFC_CARD' : 'FACE_ID',
        cardUid: `NFC-SKY-${aptCode}-01`,
        status: 'SUCCESS',
        detail: `Xác thực thành công bằng ${methodText} tại cổng kiểm soát ${turnstileModalFac.name} (${turnstileModalFac.location}) • Cổng mở 0.3s`
      });
      setAccessLogs(updated);

      setTurnstileSuccessMsg(`🎉 BÍP! Cổng kiểm soát ${turnstileModalFac.name} đã mở tự động (0.28s). Xin chào cư dân ${userName}!`);
      setTimeout(() => {
        setTurnstileSuccessMsg(null);
        setTurnstileModalFac(null);
      }, 2500);
    }, 700);
  };

  // Quẹt vé điện tử QR để vào cửa qua server
  const handleCheckinTicket = async (ticketCode: string) => {
    try {
      const res = await fetch('/api/facilities/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'CHECK_IN_FACILITY_TICKET', ticketCode }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success) {
        toast.success(json.message || 'Check-in vé tiện ích thành công.');
        const synced = await syncFacilityBookingsFromDb(aptCode);
        setBookings(synced);
      } else {
        toast.error(json?.message || 'Không thể check-in vé tiện ích.');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ khi check-in vé tiện ích.');
    }
  };

  // Tạo đặt chỗ mới - Đã tích hợp bẫy lỗi trùng giờ, duplicate và giới hạn sức chứa
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingErrorMsg(null);
    setBookingSuccessMsg(null);

    const fac = amenitiesList.find(f => f.id === bookingFacilityId) || amenitiesList[0];
    const isPrivate = fac.id === 'fac-sauna';
    const isBbq = fac.id === 'fac-bbq';
    const depositAmount = isPrivate ? bookingDurationHours * 500000 : (isBbq ? 600000 : 0);
    const pricingText = isPrivate
      ? `${(bookingDurationHours * 500000).toLocaleString('vi-VN')} đ (${bookingDurationHours} tiếng phòng VIP)`
      : (isBbq ? '600.000 đ / ca tiệc BBQ' : 'Miễn phí theo Thẻ Cư Dân');

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
      setBookingErrorMsg(result.error || 'Đặt chỗ không thành công. Vui lòng kiểm tra lại khung giờ và giới hạn sức chứa.');
      return;
    }

    setBookings(result.bookings);
    setQuota(getFacilityMonthlyQuota(aptCode));
    setBookingNotes('');
    setBookingSuccessMsg(
      `🎉 Đặt chỗ thành công! Mã vé điện tử: [${result.newBooking.ticketCode}]. ` +
      (depositAmount > 0
        ? `Đã xác nhận thanh toán giữ chỗ ${depositAmount.toLocaleString('vi-VN')} đ (${bookingPaymentMethod}). `
        : '') +
      `Quý cư dân có thể quẹt vé QR tại cổng hoặc hủy hoàn tiền nếu có việc bận đột xuất.`
    );
    setTimeout(() => setBookingSuccessMsg(null), 8000);
  };

  // Mở modal hoàn tiền khi bận đột xuất
  const handleOpenRefundModal = (booking: FacilityBooking) => {
    setRefundModalBooking(booking);
    setRefundReason('Bận việc gia đình đột xuất không thể tham gia');
  };

  // Xác nhận xử lý hoàn tiền
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

  const facilityCtx: FacilityContext = {
    t, isEn, currentUser, onNavigateModule, aptCode, missingApartment, isOwner, userName,
    activeTab, setActiveTab, filterCategory, setFilterCategory, logFilter, setLogFilter,
    showSmartCardModal, setShowSmartCardModal, turnstileModalFac, setTurnstileModalFac,
    turnstileMethod, setTurnstileMethod, isTurnstileScanning, setIsTurnstileScanning,
    turnstileSuccessMsg, setTurnstileSuccessMsg, accessLogs, setAccessLogs,
    bookings, setBookings, quota, setQuota, bookingFacilityId, setBookingFacilityId,
    bookingDate, setBookingDate, bookingTimeSlot, setBookingTimeSlot,
    bookingGuestCount, setBookingGuestCount, bookingDurationHours, setBookingDurationHours,
    bookingPaymentMethod, setBookingPaymentMethod, bookingNotes, setBookingNotes,
    bookingSuccessMsg, setBookingSuccessMsg, bookingErrorMsg, setBookingErrorMsg,
    refundModalBooking, setRefundModalBooking, refundReason, setRefundReason,
    isProcessingRefund, setIsProcessingRefund, refundResultAlert, setRefundResultAlert,
    amenitiesList, todayStr, facilityTimeSlots, currentSlotStatus, currentLimitRule,
    handleExecuteTurnstileCheckin, handleCheckinTicket, handleCreateBooking,
    handleOpenRefundModal, handleConfirmRefund, filteredAmenities, filteredLogs,
  };

  if (missingApartment) return <MissingApartmentNotice />;
  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* ============================================================= */}
      {/* 1. HEADER CHÍNH: ĐỊNH DANH & THỐNG KÊ QUYỀN LỢI THỰC TẾ       */}
      {/* ============================================================= */}
      <div className="p-5 bg-gradient-to-r from-[#121820] via-[#161F2C] to-[#121820] border border-[#2A374A] rounded-none shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <span>{isEn ? 'Resident Amenities • Unit' : 'Tiện Ích Cư Dân • Căn'} {aptCode}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
            <span>{isEn ? 'Internal Amenities' : 'Tiện Ích Nội Khu'}</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono flex flex-wrap items-center gap-2">
            <span>{isEn ? 'Host Resident:' : 'Chủ Hộ:'} <strong className="text-white">{userName}</strong></span>
            <span className="text-gray-600">•</span>
            <span className="text-emerald-400">{isEn ? 'Gym, Pool, Malibu Court: Free for Residents' : 'Gym, Bể bơi, Sân Malibu: Miễn phí Cư Dân'}</span>
            <span className="text-gray-600">•</span>
            <span>{isEn ? 'Fast gate unlock 0.28s' : 'Mở cổng 0.28s'}</span>
          </p>
        </div>

        {/* Quick Actions & Metrics */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <div className="h-11 px-3 bg-[#0D1117] border border-[#2A374A] rounded-none text-xs flex items-center justify-center gap-2 sm:gap-2.5 truncate">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="leading-tight truncate">
              <div className="text-[9px] uppercase tracking-wider text-gray-400 font-mono truncate">{isEn ? 'Monthly BBQ Quota' : 'Hạn Mức BBQ Tháng'}</div>
              <div className="font-mono font-bold text-[#C5A880] text-xs truncate">{quota.remaining} / {quota.max} {isEn ? 'turns' : 'lượt'}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSmartCardModal(true)}
            className="h-11 px-3 sm:px-4 bg-[#1A2332] hover:bg-[#253247] border border-[#C5A880]/50 hover:border-[#C5A880] text-white text-xs font-bold uppercase rounded-none transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 truncate"
          >
            <CreditCard className="w-4 h-4 text-[#C5A880] shrink-0" />
            <span className="truncate">{isEn ? '3D Resident Card' : 'Thẻ Cư Dân 3D'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. THANH ĐIỀU HƯỚNG 3 CHỨC NĂNG (WORKFLOW TABS)               */}
      {/* ============================================================= */}
      <div className="flex items-center gap-2 border-b border-[#222B35] pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        {/* Chức năng 1 */}
        <button
          type="button"
          onClick={() => setActiveTab('DISCOVER')}
          className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${activeTab === 'DISCOVER'
            ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
            : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
            }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span><span className="sm:hidden">{isEn ? 'Amenities' : 'Tiện Ích'}</span><span className="hidden sm:inline">{isEn ? '1. Amenities Catalog' : '1. Danh Mục Tiện Ích'}</span> ({amenitiesList.length})</span>
        </button>

        {/* Chức năng 2 */}
        <button
          type="button"
          onClick={() => setActiveTab('BOOKING')}
          className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${activeTab === 'BOOKING'
            ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
            : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
            }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span><span className="sm:hidden">{isEn ? 'Bookings' : 'Đặt Chỗ'}</span><span className="hidden sm:inline">{isEn ? '2. Bookings & Passes' : '2. Đặt Chỗ & Vé Vào'}</span> ({bookings.filter(b => b.status === 'CONFIRMED').length})</span>
        </button>

        {/* Chức năng 3 */}
        <button
          type="button"
          onClick={() => setActiveTab('LOGS')}
          className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${activeTab === 'LOGS'
            ? 'bg-[#C5A880] text-[#0D1117] shadow-lg'
            : 'bg-[#121820] text-gray-400 hover:text-white border border-[#222B35]'
            }`}
        >
          <History className="w-4 h-4" />
          <span><span className="sm:hidden">{isEn ? 'History' : 'Lịch Sử'}</span><span className="hidden sm:inline">{isEn ? '3. Access Log' : '3. Nhật Ký Ra Vào'}</span> ({accessLogs.length})</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* CHỨC NĂNG 1: KHÁM PHÁ TIỆN ÍCH & CHECK-IN CỔNG TURNSTILE      */}
      {/* ============================================================= */}
      {activeTab === 'DISCOVER' && (
        <div className="space-y-4">
          {/* Bộ lọc loại tiện ích */}
          <div className="flex items-center gap-1.5 bg-[#121820] p-2 border border-[#222B35] rounded-none overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              type="button"
              onClick={() => setFilterCategory('ALL')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${filterCategory === 'ALL' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
            >
              {isEn ? `All (${amenitiesList.length})` : `Tất Cả (${amenitiesList.length})`}
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('SPORTS')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${filterCategory === 'SPORTS' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
            >
              <span className="sm:hidden">{isEn ? 'Sports' : 'Thể Thao'}</span>
              <span className="hidden sm:inline">{isEn ? 'Sports & Swimming Pool' : 'Thể Thao & Hồ Bơi'}</span> ({amenitiesList.filter(a => a.category === 'SPORTS').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('WELLNESS')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${filterCategory === 'WELLNESS' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
            >
              <span className="sm:hidden">{isEn ? 'Wellness' : 'Sức Khỏe'}</span>
              <span className="hidden sm:inline">{isEn ? 'Wellness & Children' : 'Sức Khỏe & Trẻ Em'}</span> ({amenitiesList.filter(a => a.category === 'WELLNESS').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('PARK')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${filterCategory === 'PARK' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
            >
              <span className="sm:hidden">{isEn ? 'Parks' : 'Công Viên'}</span>
              <span className="hidden sm:inline">{isEn ? 'Parks & Landscape' : 'Công Viên & Cảnh Quan'}</span> ({amenitiesList.filter(a => a.category === 'PARK').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('PARTY')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-none transition-colors shrink-0 ${filterCategory === 'PARTY' ? 'bg-[#C5A880] text-[#0D1117]' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
            >
              <span className="sm:hidden">{isEn ? 'BBQ' : 'Tiệc BBQ'}</span>
              <span className="hidden sm:inline">{isEn ? 'BBQ Party & Social Area' : 'Tiệc BBQ & Sân Nhóm'}</span> ({amenitiesList.filter(a => a.category === 'PARTY').length})
            </button>
          </div>

          {/* Lưới hiển thị các tiện ích */}
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
                    <Image
                      src={fac.image}
                      alt={fac.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121820] via-[#121820]/30 to-transparent" />

                    {/* Badge Giờ Hoạt Động */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-[#222B35] px-2.5 py-1 text-[10px] text-white flex items-center gap-1.5 font-mono rounded-none">
                      <Clock className="w-3 h-3 text-[#C5A880]" />
                      <span>{fac.hours}</span>
                    </div>

                    {/* Badge Quyền Truy Cập */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-none border ${isFreeEntry
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                        : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                        }`}>
                        {isFreeEntry ? t('CỔNG TỰ ĐỘNG') : t('CẦN ĐẶT LỊCH')}
                      </span>
                    </div>

                    {/* Tên & Vị trí */}
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

                  {/* Body Thông số chi tiết */}
                  <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0D1117] p-2.5 rounded-none border border-[#1F2937]">
                        <div>
                          <div className="text-[9.5px] text-gray-400 uppercase">{t('Mật độ hiện tại:')}</div>
                          <div className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {t(fac.density)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] text-gray-400 uppercase">{t('Môi trường:')}</div>
                          <div className="font-semibold text-gray-200 mt-0.5">{t(fac.temp)}</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                        <span>{t('Biểu phí:')}</span>
                        <strong className="text-[#C5A880]">{t(fac.price)}</strong>
                      </div>
                    </div>

                    {/* Nút hành động rõ ràng theo loại tiện ích */}
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
                          <span className="truncate">{isEn ? 'Check-in Amenity' : 'Vào Cửa Tiện Ích (Check-in)'}</span>
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
                          <span className="truncate">{isEn ? 'Book Amenity Slot' : 'Đăng Ký Đặt Lịch Giữ Chỗ'}</span>
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

      <SmartFacilityBookingTabView ctx={facilityCtx} />
      <SmartFacilityLogsAndModals ctx={facilityCtx} />
    </div>
  );
}
