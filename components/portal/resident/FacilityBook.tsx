'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SKYLINE_FACILITIES, Facility, User } from '@/lib/dataStore';
import { CalendarCheck, Clock, Users, CheckCircle2, Star, ShieldCheck, QrCode } from 'lucide-react';
import { 
  createFacilityBooking, 
  getFacilityMonthlyQuota, 
  getFacilityBookings,
  syncFacilityBookingsFromDb,
  FacilityBooking 
} from '@/lib/facilityStore';
import { useLanguage } from '@/lib/languageContext';
import { toast } from '@/components/ui/Toast';

interface FacilityBookProps {
  currentUser?: User;
}

export default function FacilityBook({ currentUser }: FacilityBookProps) {
  const { t, isEn } = useLanguage();
  const aptCode = currentUser?.apartment_code || '';
  const userName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân';

  const [selectedFacility, setSelectedFacility] = useState<Facility>(SKYLINE_FACILITIES[0]);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('18:00 - 20:00 (Buổi tối)');
  const [guestCount, setGuestCount] = useState(2);
  const [quota, setQuota] = useState(() => getFacilityMonthlyQuota(aptCode));
  const [createdTicket, setCreatedTicket] = useState<FacilityBooking | null>(null);

  useEffect(() => {
    setQuota(getFacilityMonthlyQuota(aptCode));
    syncFacilityBookingsFromDb(aptCode)
      .then(() => setQuota(getFacilityMonthlyQuota(aptCode)))
      .catch((err) => console.error('Lỗi đồng bộ tiện ích:', err));
  }, [aptCode]);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (quota.remaining <= 0) {
      toast.warning(t('Căn hộ của Quý cư dân đã sử dụng hết hạn mức tiện ích trong tháng!', 'Your apartment has used up its monthly amenity booking quota!'));
      return;
    }

    const result = createFacilityBooking(
      aptCode,
      selectedFacility.id,
      selectedFacility.name,
      bookingDate,
      timeSlot,
      userName,
      selectedFacility.pricing,
      guestCount,
      'Đặt qua cổng cư dân',
      2,
      0,
      false,
      'Miễn phí theo hạn mức sinh hoạt'
    );

    if (!result.success || !result.newBooking) {
      toast.error(t(`Không thể đặt chỗ: ${result.error || 'Khung giờ này đã kín hoặc bị trùng lịch.'}`, `Booking failed: ${result.error || 'This time slot is full or has a scheduling conflict.'}`));
      return;
    }

    setCreatedTicket(result.newBooking);
    setQuota(getFacilityMonthlyQuota(aptCode));
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold">
            {t('Tiện Ích Cao Cấp • Dành Cho Cư Dân', 'Luxury Amenities • Exclusive for Residents')}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {t('Đặt Chỗ Tiện Ích Đặc Quyền', 'Reserve Exclusive Amenities')}
          </h2>
        </div>

        <div className="text-xs text-gray-300">
          {t('Hạn Mức Tháng Căn', 'Monthly Quota Unit')} {aptCode}:{' '}
          <strong className="text-[#C5A880] font-mono">
            {quota.remaining} / {quota.max} {t('lượt còn lại', 'slots remaining')}
          </strong>
        </div>
      </div>

      {createdTicket && (
        <div className="p-4 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{t('Đặt chỗ thành công! Mã vé điện tử:', 'Booking successful! Electronic ticket code:')} {createdTicket.ticketCode}</span>
          </div>
          <p className="text-gray-300 text-xs">
            {t('Tiện ích:', 'Facility:')} <strong>{t(createdTicket.facilityName)}</strong> • {t('Ngày:', 'Date:')} <strong>{createdTicket.bookingDate}</strong> • {t('Khung giờ:', 'Time slot:')} <strong>{t(createdTicket.timeSlot)}</strong>.
            {' '}{t('Vé đã được lưu vào hệ thống kiểm soát ra vào của Ban Quản Lý.', 'Pass has been recorded into the Management Access Control system.')}
          </p>
        </div>
      )}

      {/* Facilities Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SKYLINE_FACILITIES.map((f) => {
          const isSelected = selectedFacility.id === f.id;
          return (
            <div
              key={f.id}
              onClick={() => setSelectedFacility(f)}
              className={`p-4 bg-[#121820] border cursor-pointer transition-all space-y-3 ${
                isSelected ? 'border-[#C5A880] ring-1 ring-[#C5A880]' : 'border-[#222B35] hover:border-gray-600'
              }`}
            >
              <div className="relative h-28 overflow-hidden bg-black">
                <Image src={f.hero_image_url} alt={f.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 text-[10px] text-[#C5A880] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#C5A880]" /> {f.rating_score}
                </div>
              </div>
              <h4 className="font-serif text-sm font-bold text-white line-clamp-1">{t(f.name)}</h4>
              <div className="text-[11px] text-gray-400">{t('Hạn mức:', 'Quota:')} {f.max_quota_per_month} {t('lượt/tháng', 'slots/month')}</div>
            </div>
          );
        })}
      </div>

      {/* Booking Form */}
      <form onSubmit={handleBooking} className="p-6 bg-[#121820] border border-[#222B35] space-y-4">
        <h3 className="font-serif text-lg font-bold text-white border-b border-[#222B35] pb-2">
          {t('Xác Nhận Đặt Chỗ:', 'Confirm Reservation:')} {t(selectedFacility.name)}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-gray-400">{t('Chọn ngày sử dụng:', 'Select Date:')}</label>
            <input
              type="date"
              value={bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-400">{t('Khung giờ đặt:', 'Select Time Slot:')}</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
            >
              <option value="06:00 - 08:00 (Buổi sáng)">{t('06:00 - 08:00 (Sáng sớm)', '06:00 - 08:00 (Early Morning)')}</option>
              <option value="16:00 - 18:00 (Buổi chiều)">{t('16:00 - 18:00 (Buổi chiều)', '16:00 - 18:00 (Afternoon)')}</option>
              <option value="18:00 - 20:00 (Buổi tối)">{t('18:00 - 20:00 (Buổi tối - Giờ đẹp)', '18:00 - 20:00 (Evening - Prime Time)')}</option>
              <option value="20:00 - 22:00 (Đêm muộn)">{t('20:00 - 22:00 (Đêm muộn)', '20:00 - 22:00 (Late Night)')}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-400">{t('Số lượng người tham gia:', 'Number of Guests:')}</label>
            <input
              type="number"
              min={1}
              max={10}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white focus:outline-none focus:border-[#C5A880]"
              required
            />
          </div>
        </div>

        <div className="p-3 bg-[#161B22] border border-[#222B35] flex items-center justify-between text-xs">
          <span className="text-gray-400">{t('Biểu phí áp dụng:', 'Applicable Pricing:')}</span>
          <span className="text-[#C5A880] font-bold">{t(selectedFacility.pricing)}</span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
          >
            {t('Xác Nhận Đặt Tiện Ích', 'Confirm Amenity Reservation')}
          </button>
        </div>
      </form>
    </div>
  );
}
