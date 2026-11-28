'use client';

import React from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  Car,
  FileText,
  RefreshCw,
  Smartphone,
  Mail,
  Calendar,
  MapPin,
  Globe,
  Scan,
  Upload,
  Building,
  Users,
} from 'lucide-react';
import { cleanPhoneNumber, cleanCccdNumber, isValidPhoneNumber, getPhoneValidationError } from '@/lib/validationUtils';
import { formatToDisplayDate } from '@/lib/ocrParser';
import type { ProfileEkycContext } from './useProfileEkyc';

interface ProfileInfoTabViewProps {
  ctx: ProfileEkycContext;
}

export default function ProfileInfoTabView({ ctx }: ProfileInfoTabViewProps) {
  const {
    currentUser,
    t,
    isEn,
    isOwner,
    aptCode,
    fileInputRef,
    setIsOcrModalOpen,
    setIsAvatarModalOpen,
    ocrFilledNotice,
    setOcrFilledNotice,
    fullName,
    setFullName,
    phone,
    setPhone,
    email,
    setEmail,
    gender,
    setGender,
    idCardNumber,
    setIdCardNumber,
    idDate,
    setIdDate,
    idPlace,
    setIdPlace,
    birthday,
    setBirthday,
    pob,
    setPob,
    province,
    setProvince,
    intro,
    setIntro,
    licensePlate,
    setLicensePlate,
    avatarUrl,
    isSaving,
    savedSuccess,
    saveError,
    isUploadingAvatar,
    ekycStatus,
    handleSaveInfo,
    handleAvatarFileChange,
  } = ctx;

  return (
        <form onSubmit={handleSaveInfo} className="p-4 sm:p-8 bg-[#121820] border border-[#222B35] space-y-4 sm:space-y-6 shadow-2xl rounded-none">
          {/* Avatar & Fast Profile Header */}
          <div className="flex flex-row items-center gap-3.5 sm:gap-6 p-3 sm:p-4 bg-[#161D26] border border-[#222B35] rounded-none">
            {/* Clickable Avatar Circle */}
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              className="relative group cursor-pointer shrink-0"
              title={isEn ? 'Click here to change profile picture or edit avatar' : 'Nhấp vào đây để đổi ảnh đại diện hoặc tùy chỉnh ảnh'}
            >
              <img
                src={avatarUrl || currentUser.avatar_url || 'https://ui-avatars.com/api/?name=User&background=1C2533&color=C5A880&bold=true'}
                alt="Avatar"
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-none object-cover border-2 border-[#C5A880] group-hover:border-white shadow-lg transition-all group-hover:brightness-90"
              />
              {/* Desktop Hover Overlay */}
              <div
                className="hidden sm:flex absolute inset-0 bg-black/60 rounded-none flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold"
              >
                <Camera className="w-4 h-4 mb-0.5 text-[#C5A880]" />
                {t('Đổi Ảnh')}
              </div>
              {/* Mobile Persistent Touch Indicator Badge */}
              <div className="sm:hidden absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#C5A880] text-[#0D1117] rounded-none flex items-center justify-center shadow-lg border-2 border-[#161D26]">
                <Camera className="w-3 h-3 text-[#0D1117]" />
              </div>
            </div>

            <div className="space-y-0.5 sm:space-y-1 text-left flex-1 min-w-0">
              <div className="text-white font-bold text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">{fullName || t('Chưa cập nhật họ tên')}</span>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] bg-[#C5A880] text-[#0D1117] font-bold uppercase rounded-none shrink-0">
                  {t(currentUser.role)}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-gray-400 font-mono truncate">
                {t('Căn')} <strong className="text-white">{aptCode}</strong> • {t('SĐT')}: <strong className="text-gray-300">{phone || t('Chưa có')}</strong> • {t('Biển')}: <strong className="text-[#C5A880]">{licensePlate || t('Chưa có')}</strong>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {ocrFilledNotice && (
            <div className="p-4 bg-amber-950/90 border-2 border-amber-500 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fadeIn shadow-2xl rounded-none">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0 animate-pulse" />
                <div>
                  <strong className="text-white block text-sm font-semibold">
                    {isEn ? '✨ Information from Citizen ID filled into form!' : '✨ Đã điền thông tin từ thẻ Căn cước vào biểu mẫu!'}
                  </strong>
                  <span className="text-gray-300 text-[11px]">
                    {isEn
                      ? <>Please review the information and click <strong>[Save Contact Information Changes]</strong> at the bottom of the form.</>
                      : <>{isEn ? 'Please check information and click Save Contact Info at bottom of form.' : 'Vui lòng kiểm tra lại thông tin và nhấn nút [Lưu Thay Đổi Thông Tin Liên Hệ] ở cuối biểu mẫu để lưu dữ liệu.'}</>}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOcrFilledNotice(false)}
                className="px-2 py-1 bg-black/40 hover:bg-black/80 text-amber-300 hover:text-white text-[11px] font-bold rounded-none transition-colors"
              >
                {isEn ? 'Got it' : 'Đã Hiểu'}
              </button>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn shadow-lg rounded-none">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{isEn ? '✓ Personal profile information updated successfully!' : '✓ Đã cập nhật thành công thông tin hồ sơ cá nhân!'}</span>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn rounded-none">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* KHỐI 1: THÔNG TIN CĂN HỘ & CƯ DÂN                         */}
          {/* ========================================================= */}
          <div className="p-4 sm:p-6 bg-[#161D26] border border-[#2D3748] rounded-none space-y-4 sm:space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3 sm:pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
                  <Building className="w-3.5 h-3.5" /> {t('Không Gian Cư Trú')}
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                  1. {t('Thông Tin Căn Hộ & Cư Dân')}
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-[#121820] text-[#C5A880] border border-[#263140] text-xs font-mono rounded-none">
                {t('Căn hộ')} {aptCode} • The Tropical
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
              {/* Field: Mã Căn Hộ */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Căn Hộ Cư Trú:')}
                </label>
                <input
                  type="text"
                  value={`${t('Căn hộ')} ${aptCode} • ${t('Chung cư Skyline Smart Residence')}`}
                  readOnly
                  className="w-full bg-[#0D1117] border border-[#263140] p-2.5 sm:p-3 text-white font-semibold rounded-none cursor-not-allowed select-all"
                />
              </div>

              {/* Field: Tư Cách Cư Trú */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Tư Cách Cư Trú:')}
                </label>
                <input
                  type="text"
                  value={isOwner ? t('Chủ Sở Hữu Căn Hộ (Chính Chủ)') : t('Thành Viên Gia Đình (Được Bảo Lãnh)')}
                  readOnly
                  className="w-full bg-[#0D1117] border border-[#263140] p-2.5 sm:p-3 text-[#C5A880] font-semibold rounded-none cursor-not-allowed"
                />
              </div>

              {/* Field: Họ và Tên */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Họ và Tên:')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  readOnly
                  className="w-full bg-[#0D1117] border border-[#263140] p-2.5 sm:p-3 text-gray-200 font-semibold rounded-none cursor-not-allowed select-all"
                />
              </div>

              {/* Field: Giới Tính */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Giới Tính:')}
                </label>
                <input
                  type="text"
                  value={gender === '1' ? t('Nam') : t('Nữ')}
                  readOnly
                  className="w-full bg-[#0D1117] border border-[#263140] p-2.5 sm:p-3 text-gray-200 font-semibold rounded-none cursor-not-allowed"
                />
              </div>

              {/* Field: Ngày Sinh */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Ngày Sinh:')}
                </label>
                <input
                  type="text"
                  value={formatToDisplayDate(birthday) || birthday || t('Chưa cập nhật')}
                  readOnly
                  className="w-full bg-[#0D1117] border border-[#263140] p-2.5 sm:p-3 font-mono text-gray-200 rounded-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* KHỐI 2: THÔNG TIN LIÊN HỆ & PHƯƠNG TIỆN                   */}
          {/* ========================================================= */}
          <div className="p-4 sm:p-6 bg-[#161D26] border border-[#2D3748] rounded-none space-y-4 sm:space-y-5 shadow-lg">
            <div className="border-b border-[#222B35] pb-3 sm:pb-4">
              <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5 font-mono">
                <Smartphone className="w-3.5 h-3.5" /> {t('Liên Hệ & Phương Tiện')}
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                2. {t('Thông Tin Liên Hệ & Phương Tiện')}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 text-xs">
              {/* Field: Số Điện Thoại */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" /> {isEn ? 'Phone Number (Receive OTP):' : <>Số Điện Thoại <span className="hidden sm:inline">Liên Hệ (Nhận OTP)</span>:</>}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">{isEn ? '10 digits (03/05/07/08/09)' : '10 số (03/05/07/08/09)'}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneNumber(e.target.value))}
                  placeholder={isEn ? 'Enter phone number (10 digits)...' : 'Nhập số điện thoại (10 số)...'}
                  maxLength={10}
                  className={`w-full bg-[#161B22] border p-2.5 sm:p-3 text-white font-mono focus:outline-none transition-colors rounded-none ${
                    phone && !isValidPhoneNumber(phone)
                      ? 'border-amber-500/70 focus:border-amber-500'
                      : 'border-[#2D3748] focus:border-[#C5A880]'
                  }`}
                  required
                />
                {phone && !isValidPhoneNumber(phone) && (
                  <span className="text-[10.5px] text-amber-400 font-mono block">
                    {getPhoneValidationError(phone)}
                  </span>
                )}
              </div>

              {/* Field: Email */}
              <div className="space-y-1.5">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> {isEn ? 'Email (Receive Bills & Notices):' : <>Email <span className="hidden sm:inline">Nhận Hóa Đơn & Thông Báo</span>:</>}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEn ? 'Enter email address...' : 'Nhập địa chỉ email...'}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-white font-mono focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                  required
                />
              </div>

              {/* Field: Tỉnh / Thành Phố */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Globe className="w-3.5 h-3.5 text-[#C5A880]" /> {isEn ? 'Permanent City / Province:' : <>Tỉnh / Thành Phố <span className="hidden sm:inline">Thường Trú</span>:</>}
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder={isEn ? 'Enter city / province...' : 'Nhập tỉnh thành...'}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                />
              </div>

              {/* Field: Biển Số Xe */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <Car className="w-3.5 h-3.5 text-[#C5A880]" /> {isEn ? 'License Plate:' : 'Biển Số Xe Đăng Ký:'}
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-[#C5A880] font-mono font-bold focus:outline-none focus:border-[#C5A880] transition-colors rounded-none"
                  placeholder="VD: 51K-889.99"
                />
              </div>

              {/* Field: Tiểu Sử / Ghi Chú Căn Hộ */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-300 flex items-center gap-1.5 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#C5A880]" /> {isEn ? 'Apartment Notes:' : 'Ghi Chú Căn Hộ:'}
                </label>
                <textarea
                  rows={2}
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  placeholder={isEn ? 'E.g.: Small children at home, please call before ringing doorbell or delivery...' : 'Ví dụ: Căn hộ có trẻ nhỏ, vui lòng gọi điện trước khi bấm chuông hoặc giao bưu phẩm...'}
                  className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 sm:p-3 text-white focus:outline-none focus:border-[#C5A880] transition-colors rounded-none resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-3 sm:pt-4 border-t border-[#222B35]">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl rounded-none active:scale-[0.99] cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? (isEn ? 'Saving Changes...' : 'Đang Lưu...') : (isEn ? 'Save Changes' : 'Lưu Thay Đổi Thông Tin')}
              </button>
            </div>
          </div>
        </form>
  );
}
