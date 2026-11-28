'use client';

import React from 'react';
import {
  ShieldCheck,
  ScanFace,
  CreditCard,
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  RefreshCw,
  Scan,
  ArrowRight,
  Clock,
  XCircle,
  X,
  Check,
  Eye,
} from 'lucide-react';
import ResidentSmartCard from './ResidentSmartCard';
import { formatToDisplayDate, formatToApiDate } from '@/lib/ocrParser';
import { cleanCccdNumber } from '@/lib/validationUtils';
import type { ProfileEkycContext } from './useProfileEkyc';

interface ProfileEkycTabViewProps {
  ctx: ProfileEkycContext;
}

export default function ProfileEkycTabView({ ctx }: ProfileEkycTabViewProps) {
  const {
    currentUser,
    t,
    isEn,
    isOwner,
    aptCode,
    setIsOcrModalOpen,
    setIsCardViewerOpen,
    setIsFaceEnrollOpen,
    enrolledFaceProfile,
    fullName,
    phone,
    gender,
    idCardNumber,
    setIdCardNumber,
    idDate,
    setIdDate,
    idPlace,
    setIdPlace,
    birthday,
    pob,
    setPob,
    licensePlate,
    avatarUrl,
    ekycStatus,
    isEditingLegal,
    setIsEditingLegal,
    currentEkyc,
    isScanningOcr,
    cccdImage,
    cccdBackImage,
    matchScore,
    ekycFeedback,
    setEkycFeedback,
    handleSubmitEkycToBql,
  } = ctx;

  return (
        <div className="space-y-6">
          {/* Feedback Toast Notification */}
          {ekycFeedback && (
            <div className={`p-4 border text-xs font-semibold flex items-center justify-between gap-3 rounded-none animate-fadeIn shadow-xl ${
              ekycFeedback.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                : ekycFeedback.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                : 'bg-rose-950/90 border-rose-500 text-rose-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {ekycFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                )}
                <span>{ekycFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setEkycFeedback(null)}
                className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-black/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header & Trạng Thái e-KYC Tinh Gọn */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-4 bg-[#161D26] border border-[#2D3748] rounded-none shadow">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> {isEn ? `Resident Verification • Unit ${aptCode}` : `Xác Thực Cư Dân • Căn Hộ ${aptCode}`}
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5 truncate">
                {isEn ? 'National ID (CCCD) & Face Photo' : 'Căn Cước (CCCD) & Khuôn Mặt'}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-1 sm:line-clamp-none mt-0.5">
                {isEn ? 'Citizen identity card and face photo to authorize lobby entrance access.' : 'Thông tin căn cước công dân và khuôn mặt để cấp quyền mở cửa sảnh đón.'}
              </p>
            </div>

            {/* Trạng thái duyệt tổng thể */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {ekycStatus === 'VERIFIED' ? (
                <span className="px-2.5 sm:px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" /> {isEn ? 'Approved' : 'Đã Phê Duyệt'}
                </span>
              ) : ekycStatus === 'PENDING' ? (
                <span className="px-2.5 sm:px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> {isEn ? 'Pending Review' : 'Chờ BQL Duyệt'}
                </span>
              ) : ekycStatus === 'REJECTED' ? (
                <span className="px-2.5 sm:px-3 py-1 bg-rose-950/80 border border-rose-500 text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" /> {isEn ? 'Rescan Required' : 'Yêu Cầu Chụp Lại'}
                </span>
              ) : (
                <span className="px-2.5 sm:px-3 py-1 bg-[#121820] border border-gray-600 text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A880] shrink-0" /> {isEn ? 'Not Submitted' : 'Chưa Gửi Hồ Sơ'}
                </span>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* KHỐI 1: THẺ CĂN CƯỚC CÔNG DÂN (CCCD 2 MẶT)                */}
          {/* ========================================================= */}
          <div className="p-4 sm:p-5 bg-[#121820] border border-[#222B35] space-y-3 sm:space-y-4 rounded-none shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#C5A880]" /> {isEn ? '1. Citizen Identity Card (CCCD)' : '1. Thẻ Căn Cước Công Dân (CCCD)'}
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5 hidden sm:block">
                  {isEn ? 'Capture or upload both card sides for automatic information extraction.' : 'Chụp ảnh hoặc tải lên ảnh 2 mặt để hệ thống tự động điền thông tin thẻ.'}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsOcrModalOpen(true)}
                  className="flex-1 sm:flex-initial h-9 px-3.5 bg-[#1E2631] hover:bg-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] text-[#C5A880] text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
                >
                  <Scan className="w-3.5 h-3.5 shrink-0" />
                  <span>{cccdImage ? (isEn ? 'Change Card Photo' : 'Đổi Ảnh Thẻ') : (isEn ? 'Capture / Upload Card' : 'Chụp / Tải Ảnh Thẻ')}</span>
                </button>

                {cccdImage && (
                  <button
                    type="button"
                    onClick={() => setIsCardViewerOpen(true)}
                    className="flex-1 sm:flex-initial h-9 px-3.5 bg-[#161B22] hover:bg-[#1C2533] border border-gray-700 text-gray-300 hover:text-white text-[11px] sm:text-xs font-medium rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                    <span>{isEn ? 'View Card' : 'Xem Thẻ'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thông tin pháp lý trích xuất chuẩn API */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 text-xs">
              <div className="p-2 sm:p-2.5 bg-[#161B22] border border-[#263140] space-y-1">
                <span className="text-gray-400 block text-[10px] sm:text-[11px] font-semibold">{isEn ? '1. ID No. (12 digits):' : '1. Số CCCD (12 số):'}</span>
                <input
                  type="text"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(cleanCccdNumber(e.target.value))}
                  placeholder={isEn ? 'Not scanned yet' : 'Chưa quét CCCD'}
                  maxLength={12}
                  className="w-full bg-transparent text-emerald-300 font-mono font-bold focus:outline-none text-xs sm:text-sm"
                />
              </div>

              <div className="p-2 sm:p-2.5 bg-[#161B22] border border-[#263140] space-y-1">
                <span className="text-gray-400 block text-[10px] sm:text-[11px] font-semibold">{isEn ? '2. Issue Date:' : '2. Ngày Cấp (API):'}</span>
                <input
                  type="date"
                  value={formatToApiDate(idDate)}
                  onChange={(e) => setIdDate(e.target.value)}
                  className="w-full bg-transparent text-gray-200 font-mono focus:outline-none text-xs"
                />
              </div>

              <div className="p-2 sm:p-2.5 bg-[#161B22] border border-[#263140] space-y-1">
                <span className="text-gray-400 block text-[10px] sm:text-[11px] font-semibold">{isEn ? '3. Issue Place:' : '3. Nơi Cấp (API):'}</span>
                <input
                  type="text"
                  value={idPlace}
                  onChange={(e) => setIdPlace(e.target.value)}
                  placeholder={isEn ? 'Police Dept for Admin Mgmt' : 'Cục CS QLHC về TTXH'}
                  className="w-full bg-transparent text-gray-200 focus:outline-none text-xs truncate"
                />
              </div>

              <div className="p-2 sm:p-2.5 bg-[#161B22] border border-[#263140] space-y-1">
                <span className="text-gray-400 block text-[10px] sm:text-[11px] font-semibold">{isEn ? '4. Hometown / Domicile:' : '4. Quê Quán (API):'}</span>
                <input
                  type="text"
                  value={pob}
                  onChange={(e) => setPob(e.target.value)}
                  placeholder={isEn ? 'Hometown' : 'Quê quán'}
                  className="w-full bg-transparent text-gray-200 focus:outline-none text-xs truncate"
                />
              </div>
            </div>

            {/* 2 Vị trí ảnh CCCD: Tỉ lệ chuẩn 85.6mm x 54mm, không bị méo lệch trên mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
              {/* Mặt trước */}
              <div 
                onClick={() => {
                  if (cccdImage) setIsCardViewerOpen(true);
                  else setIsOcrModalOpen(true);
                }}
                className="p-2.5 sm:p-3 bg-[#0E131B] border border-[#263140] hover:border-[#C5A880]/60 transition-all rounded-none space-y-2 cursor-pointer group select-none"
                title={cccdImage ? (isEn ? 'Click to inspect card' : 'Bấm để phóng to xem thẻ') : (isEn ? 'Click to capture/upload card' : 'Bấm để chụp / tải ảnh thẻ')}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span> {isEn ? 'Front Side (Portrait Photo)' : 'Mặt Trước (Ảnh Chân Dung)'}
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono">{isEn ? 'Slot 1' : 'Vị Trí 1'}</span>
                </div>
                <div className="relative w-full aspect-[85.6/54] rounded-none overflow-hidden border border-gray-800 group-hover:border-[#C5A880]/40 transition-colors bg-[#0A0E14] flex items-center justify-center">
                  {cccdImage ? (
                    <>
                      <img src={cccdImage} alt="CCCD Front" className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-[#C5A880] font-bold">
                        <Eye className="w-4 h-4" /> {isEn ? 'Click for Details' : 'Bấm Xem Chi Tiết'}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                      <CreditCard className="w-6 h-6 text-cyan-500/50 group-hover:text-cyan-400 transition-colors" />
                      <span className="text-xs text-gray-400">{isEn ? 'No front photo yet' : 'Chưa có ảnh mặt trước'}</span>
                      <span className="text-[10px] text-[#C5A880] font-medium group-hover:underline">{isEn ? 'Click to scan / upload now' : 'Bấm để quét / tải lên ngay'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mặt sau */}
              <div 
                onClick={() => {
                  if (cccdBackImage) setIsCardViewerOpen(true);
                  else setIsOcrModalOpen(true);
                }}
                className="p-2.5 sm:p-3 bg-[#0E131B] border border-[#263140] hover:border-[#C5A880]/60 transition-all rounded-none space-y-2 cursor-pointer group select-none"
                title={cccdBackImage ? (isEn ? 'Click to inspect card' : 'Bấm để phóng to xem thẻ') : (isEn ? 'Click to capture/upload card' : 'Bấm để chụp / tải ảnh thẻ')}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> {isEn ? 'Back Side (Electronic Chip)' : 'Mặt Sau (Chip Điện Tử)'}
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono">{isEn ? 'Slot 2' : 'Vị Trí 2'}</span>
                </div>
                <div className="relative w-full aspect-[85.6/54] rounded-none overflow-hidden border border-gray-800 group-hover:border-[#C5A880]/40 transition-colors bg-[#0A0E14] flex items-center justify-center">
                  {cccdBackImage ? (
                    <>
                      <img src={cccdBackImage} alt="CCCD Back" className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-[#C5A880] font-bold">
                        <Eye className="w-4 h-4" /> {isEn ? 'Click for Details' : 'Bấm Xem Chi Tiết'}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                      <CreditCard className="w-6 h-6 text-amber-500/50 group-hover:text-amber-400 transition-colors" />
                      <span className="text-xs text-gray-400">{isEn ? 'No back photo yet' : 'Chưa có ảnh mặt sau'}</span>
                      <span className="text-[10px] text-[#C5A880] font-medium group-hover:underline">{isEn ? 'Click to scan / upload now' : 'Bấm để quét / tải lên ngay'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* e-KYC Visual Matcher & Smart Pass Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Biometric FaceID Bank-Grade 4-Step Card */}
            <div className="p-3.5 sm:p-5 bg-[#121820] border border-[#222B35] space-y-2.5 sm:space-y-4 rounded-none flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2 mb-2 sm:mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                    <ScanFace className="w-4 h-4 text-[#C5A880] shrink-0" /> <span className="truncate">{isEn ? 'Face Recognition (4 Steps)' : 'Nhận Diện Khuôn Mặt (4 Bước)'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFaceEnrollOpen(true)}
                    className="h-8 sm:h-7 px-2.5 sm:px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all shadow shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{enrolledFaceProfile ? (isEn ? 'Rescan' : 'Chụp Lại') : (isEn ? 'Scan Face' : 'Chụp Khuôn Mặt')}</span>
                  </button>
                </div>

                {enrolledFaceProfile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      {enrolledFaceProfile.status === 'PENDING_OWNER' ? (
                        <div className="font-semibold text-amber-400 flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" /> {isEn ? '4 Angles • Awaiting Owner Confirmation' : '4 Góc Mặt • Chờ Chủ Hộ Xác Nhận'}
                        </div>
                      ) : enrolledFaceProfile.status === 'PENDING' ? (
                        <div className="font-semibold text-cyan-400 flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" /> {isEn ? 'Awaiting Management Approval' : 'Chờ BQL Phê Duyệt'}
                        </div>
                      ) : (
                        <div className="font-semibold text-emerald-400 flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {isEn ? 'Activated 4 Angles' : 'Đã Kích Hoạt 4 Góc Mặt'}
                        </div>
                      )}
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">
                        {new Date(enrolledFaceProfile.enrolledAt).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}
                      </span>
                    </div>

                    {/* 4 Angle Samples Gallery */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      <div className="space-y-1">
                        <div className={`relative aspect-square border ${enrolledFaceProfile.status === 'PENDING' ? 'border-amber-500/60' : 'border-emerald-500/60'} bg-black overflow-hidden group`}>
                          <img 
                            src={enrolledFaceProfile.samples.front} 
                            alt="Front" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8.5px] sm:text-[9px] font-mono text-center py-0.5">
                            {isEn ? '1. Straight' : '1. Thẳng'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className={`relative aspect-square border ${enrolledFaceProfile.status === 'PENDING' ? 'border-amber-500/60' : 'border-emerald-500/60'} bg-black overflow-hidden group`}>
                          <img 
                            src={enrolledFaceProfile.samples.left} 
                            alt="Left" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8.5px] sm:text-[9px] font-mono text-center py-0.5">
                            {isEn ? '2. Left' : '2. Trái'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className={`relative aspect-square border ${enrolledFaceProfile.status === 'PENDING' ? 'border-amber-500/60' : 'border-emerald-500/60'} bg-black overflow-hidden group`}>
                          <img 
                            src={enrolledFaceProfile.samples.right} 
                            alt="Right" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8.5px] sm:text-[9px] font-mono text-center py-0.5">
                            {isEn ? '3. Right' : '3. Phải'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className={`relative aspect-square border ${enrolledFaceProfile.status === 'PENDING' ? 'border-amber-500/60' : 'border-emerald-500/60'} bg-black overflow-hidden group`}>
                          <img 
                            src={enrolledFaceProfile.samples.smile} 
                            alt="Closer" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8.5px] sm:text-[9px] font-mono text-center py-0.5">
                            {isEn ? '4. Closer' : '4. Tiến gần'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {enrolledFaceProfile.status === 'PENDING_OWNER' ? (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                          <Clock className="w-3.5 h-3.5 shrink-0" /> {isEn ? 'Awaiting Apartment Owner Confirmation' : 'Chờ Chủ Hộ Căn Hộ Xác Nhận'}
                        </div>
                        <p className="text-gray-300 text-[10.5px] line-clamp-2 sm:line-clamp-none">
                          {isEn
                            ? `4-angle facial profile saved. The owner of unit ${aptCode} will verify and endorse for Management activation.`
                            : `Hồ sơ 4 góc mặt đã được lưu. Chủ hộ căn hộ ${aptCode} sẽ kiểm tra và xác nhận để kích hoạt mở cửa.`}
                        </p>
                      </div>
                    ) : enrolledFaceProfile.status === 'PENDING' ? (
                      <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/40 text-[11px] text-cyan-200 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-cyan-300">
                          <Clock className="w-3.5 h-3.5 shrink-0" /> {isEn ? 'Awaiting Management Approval' : 'Đang Chờ Ban Quản Lý Phê Duyệt'}
                        </div>
                        <p className="text-gray-300 text-[10.5px] line-clamp-2 sm:line-clamp-none">
                          {isEn
                            ? '4-sample photo profile has been submitted to Management administration for verification and door access activation.'
                            : 'Hồ sơ 4 góc khuôn mặt đã gửi lên Ban Quản Lý để đối soát và kích hoạt quyền mở cửa.'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-200 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5 text-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> {isEn ? 'Face Access Activated' : 'Đã Kích Hoạt Nhận Diện Khuôn Mặt'}
                        </div>
                        <p className="text-gray-300 text-[10.5px] line-clamp-2 sm:line-clamp-none">
                          {isEn
                            ? 'Multi-angle facial profile approved. You can now use face recognition at the lobby gates and login screen.'
                            : 'Hình ảnh khuôn mặt đã được duyệt. Bạn có thể sử dụng mở cửa sảnh, thang máy và đăng nhập tài khoản.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 bg-[#0D1117] border border-[#222B35] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E2631] pb-3">
                      <div>
                        <div className="flex items-center gap-2 text-[#C5A880] text-xs font-bold uppercase tracking-wider">
                          <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
                          <span>{isEn ? 'Face Recognition Registration' : 'Đăng Ký Nhận Diện Khuôn Mặt'}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {isEn
                            ? 'Fast automated capture for door and elevator access.'
                            : 'Chụp 4 góc tự động • Mở cổng sảnh và thang máy nhanh chóng không cần chạm.'}
                        </p>
                      </div>
                      <span className="self-start sm:self-auto px-2 py-0.5 bg-[#16202C] border border-[#2D3A4B] text-[10px] text-cyan-300 font-medium">
                        {isEn ? 'Auto Detection' : 'Tự động nhận diện'}
                      </span>
                    </div>

                    {/* 4 Angle Step Preview Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2.5 bg-[#121820] border border-[#222B35] space-y-1">
                        <div className="text-[10px] font-mono font-bold text-[#C5A880] uppercase">1. {isEn ? 'Front' : 'Nhìn thẳng'}</div>
                        <div className="text-[10.5px] text-white font-medium">{isEn ? 'Straight' : 'Hướng thẳng'}</div>
                        <div className="text-[9.5px] text-gray-500">{isEn ? 'Keep steady' : 'Giữ yên đầu'}</div>
                      </div>
                      <div className="p-2.5 bg-[#121820] border border-[#222B35] space-y-1">
                        <div className="text-[10px] font-mono font-bold text-[#C5A880] uppercase">2. {isEn ? 'Turn Left' : 'Nghiêng trái'}</div>
                        <div className="text-[10.5px] text-white font-medium">{isEn ? 'Tilt left' : 'Nghiêng nhẹ mặt'}</div>
                        <div className="text-[9.5px] text-gray-500">{isEn ? 'Side view' : 'Góc bên trái'}</div>
                      </div>
                      <div className="p-2.5 bg-[#121820] border border-[#222B35] space-y-1">
                        <div className="text-[10px] font-mono font-bold text-[#C5A880] uppercase">3. {isEn ? 'Turn Right' : 'Nghiêng phải'}</div>
                        <div className="text-[10.5px] text-white font-medium">{isEn ? 'Tilt right' : 'Nghiêng nhẹ mặt'}</div>
                        <div className="text-[9.5px] text-gray-500">{isEn ? 'Side view' : 'Góc bên phải'}</div>
                      </div>
                      <div className="p-2.5 bg-[#121820] border border-[#222B35] space-y-1">
                        <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">4. {isEn ? 'Come Closer' : 'Tiến lại gần'}</div>
                        <div className="text-[10.5px] text-white font-medium">{isEn ? 'Closer view' : 'Gần camera hơn'}</div>
                        <div className="text-[9.5px] text-gray-500">{isEn ? 'Real person' : 'Xác nhận người thật'}</div>
                      </div>
                    </div>

                    {/* Prominent Scan Action Button */}
                    <button
                      type="button"
                      onClick={() => setIsFaceEnrollOpen(true)}
                      className="w-full py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-2 transition-all shadow cursor-pointer group"
                    >
                      <Scan className="w-4 h-4 text-[#0D1117] group-hover:scale-110 transition-transform" />
                      <span>{isEn ? 'Start 4-Step Face Capture (Auto)' : 'Bắt Đầu Chụp Khuôn Mặt (4 Bước Tự Động)'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs text-gray-300 bg-[#161B22] p-3 sm:p-3.5 border border-[#222B35] rounded-none mt-3 sm:mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">{isEn ? 'Door Opening Speed:' : 'Tốc độ mở cửa:'}</span>
                  <strong className="text-emerald-400 font-mono">{isEn ? '< 0.5s (Instant)' : '< 0.5s (Tức thì)'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{isEn ? 'Status:' : 'Trạng thái:'}</span>
                  <span className={
                    enrolledFaceProfile?.status === 'ACTIVE' 
                      ? 'text-emerald-400 font-bold' 
                      : enrolledFaceProfile?.status === 'PENDING_OWNER'
                      ? 'text-amber-400 font-bold'
                      : enrolledFaceProfile?.status === 'PENDING'
                      ? 'text-cyan-400 font-bold'
                      : 'text-gray-400 font-bold'
                  }>
                    {enrolledFaceProfile?.status === 'ACTIVE' 
                      ? (isEn ? 'Active ✓' : 'Đã Kích Hoạt ✓') 
                      : enrolledFaceProfile?.status === 'PENDING_OWNER'
                      ? (isEn ? 'Pending Owner ⏳' : 'Chờ Chủ Hộ ⏳')
                      : enrolledFaceProfile?.status === 'PENDING'
                      ? (isEn ? 'Pending BQL ⏳' : 'Chờ BQL Duyệt ⏳')
                      : (isEn ? 'Not Collected' : 'Chưa Thu Thập')}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-400 shrink-0">{isEn ? 'Permission to Apply:' : 'Quyền áp dụng:'}</span>
                  <span className="text-gray-200 text-right truncate max-w-[170px] sm:max-w-none">
                    {isEn ? 'Lobby gates, elevators, sign-in' : 'Sảnh đón, thang máy, đăng nhập'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{isEn ? 'License Plate:' : 'Biển số xe:'}</span>
                  <strong className="text-[#C5A880] font-mono">{licensePlate || '51K-889.99'}</strong>
                </div>
              </div>
            </div>

            {/* Render 3D Resident Smart Pass Card */}
            <div className="p-4 sm:p-5 bg-[#121820] border border-[#222B35] space-y-3 sm:space-y-4 rounded-none flex flex-col justify-between">
              <div>
                <div className="border-b border-[#222B35] pb-2 mb-3 sm:mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#C5A880]" /> {isEn ? 'Skyline Digital Resident Pass' : 'Thẻ Cư Dân Điện Tử Skyline'}
                  </span>
                </div>
                <ResidentSmartCard currentUser={currentUser} />
              </div>

              <div className="p-3 bg-[#161B22] border border-[#222B35] rounded-none text-[11px] text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? 'Resident Pass Activated' : 'Thẻ Cư Dân Đã Kích Hoạt'}
                </span>
                <span className="font-mono text-gray-400 text-[10px]">SKY-{aptCode}-PASS</span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* BƯỚC 3: XÁC NHẬN CHỐT 2 THÔNG TIN (CCCD & KHUÔN MẶT) GỬI BAN QUẢN LÝ  */}
          {/* =================================================================== */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border border-[#C5A880] rounded-none space-y-3.5 sm:space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#222B35] pb-3 sm:pb-4">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> {isEn ? 'Step 3: Confirm & Submit Dossier to Management' : 'Bước 3: Xác Nhận & Gửi Hồ Sơ Cho Ban Quản Lý'}
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white truncate">
                  {isEn ? 'Confirm & Submit to Management (ID & Face Photo)' : 'Xác Nhận & Gửi Hồ Sơ (CCCD & Khuôn Mặt)'}
                </h3>
                <p className="text-xs text-gray-400 max-w-2xl leading-relaxed hidden sm:block">
                  {isEn
                    ? 'When scanning ID or taking face photos, each record is saved independently. Once both steps are complete, click below to submit your dossier to Management for review and access authorization.'
                    : 'Thông tin CCCD và hình ảnh khuôn mặt được lưu tự động. Sau khi hoàn tất cả 2 mục, bạn chỉ cần bấm nút bên dưới để gửi VinHomes Manager kích hoạt quyền mở cửa.'}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {ekycStatus === 'VERIFIED' ? (
                  <span className="px-2.5 sm:px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" /> {isEn ? 'Management Approved' : 'BQL Đã Phê Duyệt'}
                  </span>
                ) : ekycStatus === 'PENDING' ? (
                  <span className="px-2.5 sm:px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> {isEn ? 'Awaiting Management Approval' : 'Chờ BQL Phê Duyệt'}
                  </span>
                ) : ekycStatus === 'REJECTED' ? (
                  <span className="px-2.5 sm:px-3 py-1 bg-rose-950/80 border border-rose-500 text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" /> {isEn ? 'Resubmission Required' : 'Cần Cập Nhật Lại'}
                  </span>
                ) : (
                  <span className="px-2.5 sm:px-3 py-1 bg-[#161B22] border border-gray-600 text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A880] shrink-0" /> {isEn ? 'Not Yet Submitted to BQL' : 'Chưa Chốt Gửi BQL'}
                  </span>
                )}
              </div>
            </div>

            {/* Checklist 2 điều kiện độc lập cần có */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
              {/* Check 1: Thẻ CCCD */}
              <div className={`p-2.5 sm:p-3 border flex items-center justify-between gap-2 rounded-none transition-colors ${
                idCardNumber.trim() && cccdImage && cccdBackImage
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : 'bg-[#161B22] border-amber-500/50 text-amber-200'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {idCardNumber.trim() && cccdImage && cccdBackImage ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-bold block text-white truncate">{isEn ? '1. Citizen Identity Card' : '1. Căn Cước Công Dân'}</span>
                    <span className="text-[10.5px] text-gray-400 truncate block">
                      {idCardNumber.trim() && cccdImage && cccdBackImage
                        ? (isEn ? `Saved (${idCardNumber.slice(0, 4)}...${idCardNumber.slice(-3)})` : `Đã lưu riêng (${idCardNumber.slice(0, 4)}...${idCardNumber.slice(-3)})`)
                        : (isEn ? 'Missing 2 card sides' : 'Chưa đủ 2 mặt thẻ CCCD')}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 uppercase font-bold rounded-none shrink-0 ${
                  idCardNumber.trim() && cccdImage && cccdBackImage
                    ? 'bg-emerald-900/60 text-emerald-300'
                    : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {idCardNumber.trim() && cccdImage && cccdBackImage 
                    ? (isEn ? 'READY ✓' : 'Sẵn sàng ✓') 
                    : (isEn ? 'INCOMPLETE' : 'Chưa đủ')}
                </span>
              </div>

              {/* Check 2: Khuôn mặt */}
              <div className={`p-2.5 sm:p-3 border flex items-center justify-between gap-2 rounded-none transition-colors ${
                enrolledFaceProfile?.samples?.front
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : 'bg-[#161B22] border-amber-500/50 text-amber-200'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {enrolledFaceProfile?.samples?.front ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-bold block text-white truncate">{isEn ? '2. Face Photo Registration' : '2. Nhận Diện Khuôn Mặt'}</span>
                    <span className="text-[10.5px] text-gray-400 truncate block">
                      {enrolledFaceProfile?.samples?.front
                        ? (isEn ? '4-angle photos saved' : 'Đã lưu đủ 4 góc khuôn mặt')
                        : (isEn ? 'Need 4 face angle photos' : 'Chưa chụp đủ 4 góc khuôn mặt')}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 uppercase font-bold rounded-none shrink-0 ${
                  enrolledFaceProfile?.samples?.front
                    ? 'bg-emerald-900/60 text-emerald-300'
                    : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {enrolledFaceProfile?.samples?.front 
                    ? (isEn ? 'READY ✓' : 'Sẵn sàng ✓') 
                    : (isEn ? 'INCOMPLETE' : 'Chưa đủ')}
                </span>
              </div>
            </div>

            {/* Chốt hồ sơ Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-gray-400 hidden sm:block">
                {isEn ? 'Management will receive instant notification to inspect and verify card photos.' : 'Ban Quản Lý sẽ nhận được thông báo ngay lập tức để thẩm định đối soát hình ảnh.'}
              </div>

              <button
                type="button"
                onClick={handleSubmitEkycToBql}
                disabled={isScanningOcr}
                className="w-full sm:w-auto px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl rounded-none active:scale-[0.99] flex-shrink-0 cursor-pointer"
              >
                {isScanningOcr ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isScanningOcr
                  ? (isEn ? 'Submitting Dossier...' : 'Đang Gửi Chốt Hồ Sơ...')
                  : ekycStatus === 'VERIFIED'
                  ? (isEn ? 'Resubmit Update to VinHomes Manager' : 'Gửi Cập Nhật Lại Cho VinHomes Manager')
                  : ekycStatus === 'REJECTED'
                  ? (isEn ? 'Resubmit for VinHomes Manager Review' : 'Gửi Lại VinHomes Manager Thẩm Định')
                  : ekycStatus === 'PENDING'
                  ? (isEn ? 'Resubmit / Update Dossier' : 'Gửi Lại / Cập Nhật Chốt Hồ Sơ')
                  : (isEn ? 'Submit Dossier to VinHomes Manager' : 'Gửi Hồ Sơ Cho VinHomes Manager Xác Nhận')}
              </button>
            </div>
          </div>
        </div>
  );
}
