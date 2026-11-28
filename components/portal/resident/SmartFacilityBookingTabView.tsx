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

import type { FacilityContext } from './smartFacilityTypes';

export default function SmartFacilityBookingTabView({ ctx }: { ctx: FacilityContext }) {
  const { t, isEn, currentUser, onNavigateModule, aptCode, missingApartment, isOwner, userName, activeTab, setActiveTab, filterCategory, setFilterCategory, logFilter, setLogFilter, showSmartCardModal, setShowSmartCardModal, turnstileModalFac, setTurnstileModalFac, turnstileMethod, setTurnstileMethod, isTurnstileScanning, setIsTurnstileScanning, turnstileSuccessMsg, setTurnstileSuccessMsg, accessLogs, setAccessLogs, bookings, setBookings, quota, setQuota, bookingFacilityId, setBookingFacilityId, bookingDate, setBookingDate, bookingTimeSlot, setBookingTimeSlot, bookingGuestCount, setBookingGuestCount, bookingDurationHours, setBookingDurationHours, bookingPaymentMethod, setBookingPaymentMethod, bookingNotes, setBookingNotes, bookingSuccessMsg, setBookingSuccessMsg, bookingErrorMsg, setBookingErrorMsg, refundModalBooking, setRefundModalBooking, refundReason, setRefundReason, isProcessingRefund, setIsProcessingRefund, refundResultAlert, setRefundResultAlert, amenitiesList, todayStr, facilityTimeSlots, currentSlotStatus, currentLimitRule, handleExecuteTurnstileCheckin, handleCheckinTicket, handleCreateBooking, handleOpenRefundModal, handleConfirmRefund, filteredAmenities, filteredLogs } = ctx;
  return (
    <>
      {activeTab === 'BOOKING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bên Trái: Form Đăng Ký Đặt Chỗ (6 Cột - Cân Xứng) */}
          <div className="lg:col-span-6">
            <form onSubmit={handleCreateBooking} className="p-4 sm:p-5 bg-[#121820] border border-[#2A374A] rounded-none space-y-3.5 shadow-xl">
              <div className="border-b border-[#222B35] pb-2.5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
                  {isEn ? `Advance Amenity Reservation • Apt ${aptCode}` : `Dịch Vụ Tiện Ích Đặt Trước • Căn Hộ ${aptCode}`}
                </div>
                <h3 className="font-serif text-lg text-white font-bold">
                  {isEn ? 'VIP Amenity Reservation Registration' : 'Đăng Ký Đặt Chỗ Tiện Ích VIP'}
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
                      {isEn ? 'Cannot Complete Reservation:' : 'Không Thể Hoàn Tất Giữ Chỗ:'}
                    </div>
                    <div>{bookingErrorMsg}</div>
                  </div>
                </div>
              )}

              {/* Bước 1: Tiện ích */}
              <div className="space-y-1">
                <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                  {isEn ? '1. Select facility to reserve:' : '1. Chọn tiện ích muốn đặt:'}
                </label>
                <select
                  value={bookingFacilityId}
                  onChange={(e) => setBookingFacilityId(e.target.value)}
                  className="w-full bg-[#161D26] border border-[#2A374A] p-2.5 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="fac-bbq">
                    {isEn ? 'Panoramic Rooftop BBQ Garden (25F) • 600,000 VND/slot' : 'Vườn Tiệc Nướng BBQ Panoramic (Sân Thượng Tầng 25) • 600.000 đ/ca'}
                  </option>
                  <option value="fac-sports-malibu">
                    {isEn ? 'Malibu Sports Court (Tennis & Basketball) • Free for Residents' : 'Sân Thể Thao Malibu (Tennis & Bóng Rổ) • Miễn Phí Cư Dân'}
                  </option>
                  <option value="fac-yoga">
                    {isEn ? 'Outdoor Yoga & Meditation Lawn BS-07 • Free for Residents' : 'Sân Yoga Ngoài Trời & Thiền Tĩnh BS-07 • Miễn Phí Cư Dân'}
                  </option>
                  <option value="fac-cabana">
                    {isEn ? 'Cabana Lounge by Resort Pool BS-09 • Free for Residents' : 'Chòi Nghỉ Cabana Ven Hồ Bơi Resort BS-09 • Miễn Phí Cư Dân'}
                  </option>
                  <option value="fac-multipurpose-lawn">
                    {isEn ? 'Multipurpose Lawn Y-01 Malibu (Mini-football/Pickleball) • Free for Residents' : 'Sân Cỏ Đa Năng Y-01 Malibu (Bóng đá/Pickleball) • Miễn Phí Cư Dân'}
                  </option>
                  <option value="fac-sauna">
                    {isEn ? 'Himalayan Rock Salt Sauna (VIP 3F) • 500,000 VND/hr' : 'Phòng Xông Hơi Đá Muối Himalaya (VIP Tầng 3) • 500.000 đ/giờ'}
                  </option>
                </select>
              </div>

              {/* Thông báo phòng riêng tư VIP nếu chọn Xông hơi */}
              {bookingFacilityId === 'fac-sauna' && (
                <div className="p-2.5 bg-gradient-to-r from-[#C5A880]/15 to-transparent border-l-2 border-[#C5A880] rounded-none space-y-1 text-xs text-gray-200 animate-fadeIn">
                  <div className="font-bold text-[#C5A880] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEn ? 'VIP Private Family Suite' : 'Dịch Vụ Phòng Riêng Tư Gia Đình VIP'}</span>
                  </div>
                  <div className="text-[11px] text-gray-300 leading-relaxed">
                    {isEn
                      ? '100% private, pre-heated Himalayan rock salt sauna, premium plush towels and natural aromatherapy prepared for your appointment.'
                      : 'Khép kín 100%, được bật lò gia nhiệt đá muối Himalaya, chuẩn bị khăn bông cao cấp và tinh dầu thảo mộc tự nhiên theo đúng giờ hẹn.'}
                  </div>
                </div>
              )}

              {/* Chọn số tiếng sử dụng nếu là phòng xông hơi riêng tư */}
              {bookingFacilityId === 'fac-sauna' && (
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? 'VIP Room Duration:' : 'Số tiếng đặt phòng VIP:'}
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
                        <span>{h} {isEn ? (h > 1 ? 'Hours' : 'Hour') : 'Tiếng'}</span>
                        <span className="text-[10px] font-mono font-normal">{(h * 500000).toLocaleString('vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bước 2: Ngày & Giờ */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? '2. Reservation Date:' : '2. Ngày đặt:'}
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
                    {isEn ? 'Time Slot:' : 'Khung giờ:'}
                  </label>
                  <select
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                  >
                    {facilityTimeSlots.map((slot: string) => {
                      const st = getFacilitySlotStatus(bookingFacilityId, bookingDate, slot, aptCode, isEn);
                      return (
                        <option
                          key={slot}
                          value={slot}
                          disabled={st.isFull || st.isUserBooked || st.isPast}
                        >
                          {slot} • [{st.statusBadge}]
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* HUD Báo Sức Chứa & Tình Trạng Giữ Chỗ Realtime */}
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
                    <span>{isEn ? 'Building Reservation Status:' : 'Trạng Thái Giữ Chỗ Toàn Khu:'}</span>
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
                    ? (isEn ? 'This time slot has already passed today. Please select a later time slot.' : 'Khung giờ này đã trôi qua trong ngày hôm nay. Quý cư dân vui lòng chọn khung giờ kế tiếp.')
                    : currentSlotStatus.isUserBooked
                    ? (isEn ? `Apartment ${aptCode} already has an active reservation in this slot. Duplicate bookings are not allowed.` : `Căn hộ ${aptCode} đã có phiếu giữ chỗ đang có hiệu lực trong khung giờ này. Hệ thống không cho phép tạo phiếu trùng lặp.`)
                    : currentSlotStatus.isFull
                    ? (isEn ? `This facility has reached maximum building capacity (${currentLimitRule.maxSlotsPerTime} reservations) in this time slot. Please choose another slot.` : `Tiện ích đã đạt tối đa sức chứa của toàn tòa nhà (${currentLimitRule.maxSlotsPerTime} lượt) trong khung giờ này. Vui lòng chọn khung giờ khác để giữ chỗ thành công.`)
                    : (isEn ? `${currentLimitRule.descriptionEn || currentLimitRule.description}. System instantly locks the slot to prevent conflicts upon confirmation.` : `${currentLimitRule.description}. Hệ thống lập tức khóa chỗ chống trùng giờ toàn bộ cư dân ngay sau khi xác nhận.`)}
                </div>
              </div>

              {/* Chọn phương thức thanh toán giữ chỗ nếu tiện ích có phí */}
              {(bookingFacilityId === 'fac-sauna' || bookingFacilityId === 'fac-bbq') && (
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? 'Reservation deposit payment method:' : 'Phương thức thanh toán giữ chỗ:'}
                  </label>
                  <select
                    value={bookingPaymentMethod}
                    onChange={(e) => setBookingPaymentMethod(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="Trừ vào hóa đơn sinh hoạt tháng tới">
                      {isEn ? 'Deduct from next month utility invoice' : 'Trừ vào hóa đơn sinh hoạt tháng tới của căn hộ'}
                    </option>
                    <option value="Quét mã QR chuyển khoản ngân hàng">
                      {isEn ? 'Scan QR code for bank transfer' : 'Quét mã QR chuyển khoản ngân hàng BQL'}
                    </option>
                    <option value="Trừ vào số dư ví cư dân">
                      {isEn ? 'Deduct from resident wallet balance' : 'Trừ vào số dư ví cư dân'}
                    </option>
                  </select>
                </div>
              )}

              {/* Bước 3: Số người & Ghi chú */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    {isEn ? '3. Number of participants:' : '3. Số người tham gia:'}
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
                    {isEn ? 'Representative booker:' : 'Người đại diện đặt:'}
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
                  {isEn ? 'Special requests (optional):' : 'Ghi chú yêu cầu phục vụ (tùy chọn):'}
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
                          ? 'VD: Cần thêm khăn nhung, tinh dầu sả chanh...' 
                          : bookingFacilityId === 'fac-bbq'
                          ? 'VD: Cần 2 bếp nướng Weber, dụng cụ kẹp BBQ...'
                          : 'VD: Mượn vợt tennis, bóng tập...')
                  }
                  className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Chi phí & Chính sách */}
              <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-none space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">{isEn ? 'Reservation Fee:' : 'Chi phí đặt giữ chỗ:'}</span>
                  <span className="text-[#C5A880] font-bold text-sm font-mono">
                    {bookingFacilityId === 'fac-sauna'
                      ? `${(bookingDurationHours * 500000).toLocaleString('vi-VN')} ${isEn ? `VND (${bookingDurationHours} hours VIP room)` : `đ (${bookingDurationHours} tiếng phòng VIP)`}`
                      : bookingFacilityId === 'fac-bbq'
                      ? (isEn ? '600,000 VND / slot (Weber grill set & cleanup)' : '600.000 đ / ca tiệc (Set bếp Weber & dọn sau tiệc)')
                      : (isEn ? '0 VND (Free with Skyline Resident Pass)' : '0 đ (Miễn phí theo Thẻ Cư Dân Skyline)')}
                  </span>
                </div>

                {(bookingFacilityId === 'fac-sauna' || bookingFacilityId === 'fac-bbq') ? (
                  <div className="pt-2 border-t border-[#1F2937] space-y-1 text-[11px] leading-relaxed">
                    <div className="text-[#C5A880] font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Refund Policy for Unforeseen Circumstances:' : 'Chính sách hoàn tiền khi có việc bận đột xuất:'}</span>
                    </div>
                    <div className="space-y-0.5 text-gray-300">
                      <div className="flex items-start gap-1.5 text-emerald-400">
                        <span className="font-bold">✓</span>
                        <span><strong>{isEn ? '> 30 mins before appointment:' : 'Trước giờ hẹn > 30 phút:'}</strong>{isEn ? <> REFUND <strong>100%</strong> slot deposit.</> : <> Hoàn trả <strong>100%</strong> tiền giữ chỗ.</>}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-amber-300">
                        <span className="font-bold">⚡</span>
                        <span><strong>{isEn ? 'Upcoming (within 30 mins):' : 'Cận giờ (trong 30 phút):'}</strong>{isEn ? <> REFUND <strong>50%</strong> (50% compensation for preparation costs).</> : <> Hoàn trả <strong>50%</strong> (50% bù đắp chi phí chuẩn bị).</>}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-gray-400">
                        <span className="font-bold">✕</span>
                        <span><strong>{isEn ? 'Appointment overtime starts:' : 'Quá giờ hẹn bắt đầu:'}</strong>{isEn ? ' No refund; amenity is reserved.' : ' Không hoàn tiền do tiện ích đã khóa giữ chỗ.'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#1F2937] space-y-1 text-[11px] text-gray-400 leading-relaxed">
                    <div className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Exclusive resident amenity privilege' : 'Đặc quyền tiện ích thể thao miễn phí dành riêng cho Cư Dân'}</span>
                    </div>
                    <p>
                      {isEn
                        ? 'QR electronic pass is generated automatically for turnstile access. If your plans change, please cancel in the pass list to release the slot for other residents.'
                        : 'Vé điện tử QR sẽ được tạo tự động để quét tại cổng kiểm soát. Nếu có thay đổi lịch, vui lòng bấm hủy vé trong danh sách để nhường khung giờ cho cư dân khác.'}
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
                    ? (isEn ? 'Time Slot Has Passed' : 'Khung Giờ Đã Qua')
                    : currentSlotStatus.isUserBooked
                    ? (isEn ? 'Already Reserved By Your Apt' : 'Căn Hộ Đã Đặt Khung Giờ Này')
                    : currentSlotStatus.isFull
                    ? (isEn ? 'Time Slot Fully Booked' : 'Khung Giờ Đã Hết Chỗ (Kín Lịch)')
                    : (isEn ? 'Confirm Reservation & Generate QR Pass' : 'Xác Nhận Đặt Giữ Chỗ & Tạo Vé QR')}
                </span>
              </button>
            </form>
          </div>

          {/* Bên Phải: Quản Lý Vé Điện Tử Của Căn Hộ (6 Cột - Cân Xứng) */}
          <div className="lg:col-span-6 space-y-3.5">
            {/* Thông báo kết quả hoàn tiền nếu có */}
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
                  <span>{isEn ? `Digital Passes Wallet Unit ${aptCode} (${bookings.length} Passes)` : `Ví Vé Điện Tử Tiện Ích Căn Hộ ${aptCode} (${bookings.length} Vé)`}</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Quét vé tại cổng tiện ích
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="p-8 text-center bg-[#0D1117] border border-[#222B35] rounded-none space-y-2">
                  <div className="w-10 h-10 rounded-none bg-[#161D26] border border-[#2A374A] flex items-center justify-center mx-auto text-gray-400">
                    <Calendar className="w-5 h-5 text-[#C5A880]" />
                  </div>
                  <div className="text-xs font-bold text-white">{isEn ? 'No booking passes yet' : 'Chưa có vé đặt chỗ nào'}</div>
                  <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Hãy điền thông tin bên trái để đăng ký Phòng xông hơi VIP hoặc Vườn tiệc nướng BBQ Panoramic cho gia đình.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {bookings.map((b: FacilityBooking) => {
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
                                  (Đã quét vé vào cửa)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-300 mt-0.5">
                              Ngày: <strong className="text-white">{b.bookingDate}</strong> • Khung: <strong className="text-white">{b.timeSlot}</strong>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Người đặt: {b.bookerName} • Số lượng: {b.guestCount || 2} người {b.notes ? `• Ghi chú: ${b.notes}` : ''}
                            </div>

                            {/* Thông tin phòng riêng tư & số tiền đặt giữ chỗ */}
                            {(b.isPrivate || b.facilityId === 'fac-sauna' || b.depositAmount) && (
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-[#C5A880]/15 text-[#C5A880] text-[9.5px] font-bold rounded-none">
                                  👑 TIỆN ÍCH VIP • {b.durationHours ? `${b.durationHours} TIẾNG` : 'THEO CA'}
                                </span>
                                <span className="text-[10px] text-gray-300 font-mono">
                                  {isEn ? 'Reserved deposit:' : 'Đã giữ chỗ:'} <strong className="text-[#C5A880]">{(b.depositAmount || 1000000).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</strong>
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
                            {isConfirmed ? 'ĐÃ XÁC NHẬN' : isCheckedIn ? '✓ ĐÃ CHECK-IN' : '✕ ĐÃ HỦY LỊCH'}
                          </span>
                        </div>

                        {/* Mã QR & Code Strip */}
                        <div className="p-2.5 bg-[#161D26] border border-[#222B35] rounded-none flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-[9px] text-gray-400 uppercase font-mono">{isEn ? 'Digital Pass Check-in Code:' : 'Mã Vé Điện Tử Check-in:'}</div>
                            <div className="text-sm font-mono font-bold text-[#C5A880]">{b.ticketCode}</div>
                            <div className="text-[10px] text-gray-400">
                              {isCancelled ? 'Vé này đã được hủy và thanh lý' : 'Xuất trình tại đầu đọc mã QR cổng vào tiện ích'}
                            </div>
                          </div>

                          <div className={`p-1 bg-white rounded-none shrink-0 shadow ${isCancelled ? 'opacity-30' : ''}`}>
                            <QrImage
                              value={b.ticketCode}
                              size={70}
                              alt="Ticket QR"
                              className="w-14 h-14 object-contain"
                            />
                          </div>
                        </div>

                        {/* Chi tiết hoàn tiền nếu vé đã hủy */}
                        {isCancelled && (
                          <div className="p-2.5 bg-[#141B24] border border-[#222B35] rounded-none text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold">
                              {b.refundRate && b.refundRate > 0 ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isEn ? `Refunded ${b.refundRate}% (+${(b.refundAmount || 0).toLocaleString('en-US')} VND)` : `Đã hoàn tiền ${b.refundRate}% (+${(b.refundAmount || 0).toLocaleString('vi-VN')} đ)`}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5 text-gray-500" />
                                  <span>{isEn ? 'No refund applicable' : 'Không áp dụng hoàn tiền'}</span>
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
                                <span className="truncate">{isEn ? 'Cancel & Refund' : 'Hủy Lịch & Hoàn Tiền'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCheckinTicket(b.ticketCode)}
                                className="w-full sm:w-auto h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none transition-colors flex items-center justify-center gap-1.5 shadow active:scale-95 truncate"
                              >
                                <DoorOpen className="w-3.5 h-3.5 shrink-0" /> 
                                <span className="truncate">{isEn ? 'Scan Gate Pass Now' : 'Quẹt Vé Vào Cổng Ngay'}</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-500 italic">
                              {isCheckedIn ? 'Vé đã được sử dụng thành công.' : 'Lịch đặt đã được thanh lý theo quy chế.'}
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
    </>
  );
}
