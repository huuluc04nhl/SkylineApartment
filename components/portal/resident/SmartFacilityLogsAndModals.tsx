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

export default function SmartFacilityLogsAndModals({ ctx }: { ctx: FacilityContext }) {
  const { t, isEn, currentUser, onNavigateModule, aptCode, missingApartment, isOwner, userName, activeTab, setActiveTab, filterCategory, setFilterCategory, logFilter, setLogFilter, showSmartCardModal, setShowSmartCardModal, turnstileModalFac, setTurnstileModalFac, turnstileMethod, setTurnstileMethod, isTurnstileScanning, setIsTurnstileScanning, turnstileSuccessMsg, setTurnstileSuccessMsg, accessLogs, setAccessLogs, bookings, setBookings, quota, setQuota, bookingFacilityId, setBookingFacilityId, bookingDate, setBookingDate, bookingTimeSlot, setBookingTimeSlot, bookingGuestCount, setBookingGuestCount, bookingDurationHours, setBookingDurationHours, bookingPaymentMethod, setBookingPaymentMethod, bookingNotes, setBookingNotes, bookingSuccessMsg, setBookingSuccessMsg, bookingErrorMsg, setBookingErrorMsg, refundModalBooking, setRefundModalBooking, refundReason, setRefundReason, isProcessingRefund, setIsProcessingRefund, refundResultAlert, setRefundResultAlert, amenitiesList, todayStr, facilityTimeSlots, currentSlotStatus, currentLimitRule, handleExecuteTurnstileCheckin, handleCheckinTicket, handleCreateBooking, handleOpenRefundModal, handleConfirmRefund, filteredAmenities, filteredLogs } = ctx;
  return (
    <>
      {activeTab === 'LOGS' && (
        <div className="p-4 sm:p-5 bg-[#121820] border border-[#2A374A] rounded-none space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>{isEn ? `Real-Time Facility Access Log Unit ${aptCode}` : `Nhật Ký Ra Vào Tiện Ích Thời Gian Thực Căn Hộ ${aptCode}`}</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Dữ liệu ghi nhận tự động theo thời gian thực khi cư dân qua cổng tiện ích
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
                Tất Cả ({accessLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('fac-pool')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-none font-bold transition-colors ${
                  logFilter === 'fac-pool' ? 'bg-cyan-600 text-white' : 'bg-[#161D26] text-gray-400 hover:text-white'
                }`}
              >
                Hồ Bơi
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
              <div className="text-xs font-bold text-white">{isEn ? 'No facility access events yet' : 'Chưa có lượt ra vào tiện ích nào'}</div>
              <div className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                Khi cư dân quẹt thẻ hoặc dùng nhận diện khuôn mặt qua cổng tại Hồ bơi, Gym, BBQ, hệ thống sẽ tự động hiển thị nhật ký tại đây.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#222B35] max-h-[460px] overflow-y-auto pr-1">
              {filteredLogs.map((log: FacilityCheckinLog) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-none bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{log.facilityName}</div>
                      <div className="text-[11px] text-gray-400">
                        {isEn ? 'Resident:' : 'Cư dân:'} <strong className="text-gray-200">{log.userName}</strong> ({log.role}) • {isEn ? 'Auth:' : 'Xác thực:'} <span className="text-[#C5A880]">{log.method === 'NFC_CARD' ? (isEn ? 'Resident Card' : 'Thẻ Cư Dân') : (isEn ? 'Face Recognition' : 'Nhận Diện Khuôn Mặt')}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {log.detail}
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0 font-mono text-[11px]">
                    <div className="text-[#C5A880] font-bold">{log.timestamp}</div>
                    <div className="text-[9.5px] text-emerald-400 uppercase">{isEn ? '✓ GATE UNLOCKED SUCCESSFULLY' : '✓ CỔNG MỞ THÀNH CÔNG'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: CỔNG VÀO TIỆN ÍCH THÔNG MINH (QUẸT THẺ / KHUÔN MẶT) */}
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
                    Cổng Vào Tiện Ích: {turnstileModalFac.name}
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
                    Chọn cách mở cửa để vào tiện ích:
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
                      <span>{isEn ? 'Tap Resident Card' : 'Quẹt Thẻ Cư Dân'}</span>
                      <span className="text-[9px] font-mono font-normal">{isEn ? 'Tap card to sensor' : 'Chạm thẻ vào máy quét'}</span>
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
                      <span>{isEn ? 'Face Recognition' : 'Nhận Diện Khuôn Mặt'}</span>
                      <span className="text-[9px] font-mono font-normal">{isEn ? 'Look at camera' : 'Nhìn vào camera'}</span>
                    </button>
                  </div>

                  {/* Visual Card / Biometric Preview */}
                  <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-none text-xs font-mono text-gray-300 space-y-1">
                    <div className="text-white font-bold">{userName} ({isEn ? 'Unit' : 'Căn'} {aptCode})</div>
                    <div className="text-[10px] text-gray-400">
                      {turnstileMethod === 'NFC' ? 'Thẻ cư dân chính của căn hộ' : 'Khuôn mặt cư dân đã kích hoạt'}
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
                        <span>{isEn ? 'Unlocking Amenity Gate...' : 'Đang Mở Cửa Vào Tiện Ích...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isEn ? 'Unlock Amenity Gate' : 'Mở Cửa Vào Tiện Ích'}</span>
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
      {/* MODAL 2: XEM THẺ CƯ DÂN KIM LOẠI VIP 3D                       */}
      {/* ============================================================= */}
      {showSmartCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-[#121820] border-2 border-[#C5A880] rounded-none shadow-2xl max-w-lg w-full overflow-hidden space-y-4">
            <div className="p-4 bg-[#161F2C] border-b border-[#2A374A] flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-[#C5A880] font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C5A880]" />
                <span>{isEn ? `Gold-Plated Resident Card Unit ${aptCode}` : `Thẻ Cư Dân Kim Loại Mạ Vàng Căn ${aptCode}`}</span>
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
                  toast.success(`Cổng ${fac} đã mở tự động cho cư dân Căn ${aptCode}!`);
                  setAccessLogs(getFacilityCheckinLogs(aptCode));
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* ============================================================= */}
      {/* MODAL 3: HỦY LỊCH TIỆN ÍCH & HOÀN TIỀN KHI BẬN ĐỘT XUẤT       */}
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
                  <span>{isEn ? 'Refund Request For Schedule Conflict' : 'Yêu Cầu Hoàn Tiền Khi Bận Đột Xuất'}</span>
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
                {/* Thông tin vé đặt */}
                <div className="p-3 bg-[#0D1117] border border-[#222B35] rounded-none space-y-1.5">
                  <div className="text-white font-bold text-sm flex items-center justify-between">
                    <span>{refundModalBooking.facilityName}</span>
                    <span className="text-[10px] text-[#C5A880] font-mono">{refundModalBooking.ticketCode}</span>
                  </div>
                  <div className="text-gray-300">
                    Thời gian hẹn: <strong className="text-white">{refundModalBooking.bookingDate} ({refundModalBooking.timeSlot})</strong>
                  </div>
                  <div className="text-gray-400">
                    {isEn ? 'Deposit amount paid:' : 'Số tiền đã đặt giữ chỗ:'} <strong className="text-[#C5A880]">{(refundModalBooking.depositAmount || 500000).toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'VNĐ'}</strong> ({refundModalBooking.paymentMethod || (isEn ? 'Next month bill' : 'Hóa đơn tháng tới')})
                  </div>
                </div>

                {/* Phân tích tỷ lệ hoàn tiền thời gian thực */}
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
                      HOÀN {refundEstimate.refundRate}%
                    </span>
                  </div>

                  <div className="text-[11px] leading-relaxed opacity-90">
                    {refundEstimate.reason}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between font-mono">
                    <span className="text-gray-400">{isEn ? 'Refund credited to unit:' : 'Số tiền hoàn trả về căn hộ:'}</span>
                    <span className={`text-base font-bold ${
                      isFull ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      +{refundEstimate.refundAmount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>

                {/* Chọn hoặc nhập lý do bận */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] text-gray-300 font-semibold uppercase block">
                    Lý do hủy lịch (tùy chọn):
                  </label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#2A374A] p-2 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="Bận việc gia đình đột xuất không thể tham gia">{isEn ? 'Family emergency' : 'Bận việc gia đình đột xuất'}</option>
                    <option value="Lịch công tác / đi xa phát sinh ngoài dự kiến">{isEn ? 'Unexpected business trip' : 'Lịch công tác / đi xa đột xuất'}</option>
                    <option value="Sức khỏe không đảm bảo, cần nghỉ ngơi">{isEn ? 'Health condition, needing rest' : 'Sức khỏe không đảm bảo, cần nghỉ ngơi'}</option>
                    <option value="Thay đổi kế hoạch khác cùng bạn bè/người thân">{isEn ? 'Schedule changed' : 'Thay đổi kế hoạch khác'}</option>
                  </select>
                </div>

                <div className="text-[10.5px] text-gray-400 italic">
                  * Số tiền hoàn trả sẽ được VinHomes Manager tự động kết chuyển và giảm trừ trực tiếp vào hóa đơn sinh hoạt kỳ kế tiếp của căn hộ {aptCode}.
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRefundModalBooking(null)}
                    disabled={isProcessingRefund}
                    className="h-10 px-3 bg-[#161D26] hover:bg-[#1E2633] text-gray-300 text-xs font-bold rounded-none border border-[#2A374A] transition-colors flex items-center justify-center active:scale-95"
                  >
                    <span>{isEn ? 'Keep Booking' : 'Giữ Lại Lịch Đặt'}</span>
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
                        <span className="truncate">{isEn ? 'Processing Refund...' : 'Đang Xử Lý Hoàn Tiền...'}</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{isEn ? 'Confirm Cancel & Refund' : 'Xác Nhận Hủy & Hoàn Tiền'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
