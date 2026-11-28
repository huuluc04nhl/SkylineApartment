'use client';

import React from 'react';
import MissingApartmentNotice from '@/components/portal/resident/MissingApartmentNotice';
import { ResourceSkeleton, ResourceError, ResourceEmpty } from '@/components/ui/ResourceState';
import {
  User as UserIcon,
  ShieldCheck,
  ScanFace,
  Clock,
  XCircle,
  KeyRound,
  AlertCircle,
  Users,
  CheckCircle2,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { User } from '@/lib/dataStore';
import { skylineUpdateCccd } from '@/lib/skylineApiClient';
import CccdOcrScannerModal from './CccdOcrScannerModal';
import AvatarEditorModal from './AvatarEditorModal';
import CccdCardViewer from '@/components/portal/shared/CccdCardViewer';
import { updateEkycCardImages } from '@/lib/ekycStore';
import FaceEnrollModal from './FaceEnrollModal';
import AccountPasswordSection from '@/components/portal/shared/AccountPasswordSection';
import { useProfileEkyc } from './useProfileEkyc';
import ProfileInfoTabView from './ProfileInfoTabView';
import ProfileEkycTabView from './ProfileEkycTabView';

interface ProfileEkycProps {
  currentUser: User;
}

export default function ProfileEkyc({ currentUser }: ProfileEkycProps) {
  const ctx = useProfileEkyc(currentUser);
  const {
    t,
    isEn,
    updateUserInfo,
    refreshUser,
    isOwner,
    aptCode,
    missingApartment,
    activeTab,
    setActiveTab,
    isOcrModalOpen,
    setIsOcrModalOpen,
    isAvatarModalOpen,
    setIsAvatarModalOpen,
    isCardViewerOpen,
    setIsCardViewerOpen,
    isFaceEnrollOpen,
    setIsFaceEnrollOpen,
    enrolledFaceProfile,
    setEnrolledFaceProfile,
    isLoadingApi,
    fullName,
    phone,
    gender,
    idCardNumber,
    idDate,
    idPlace,
    birthday,
    pob,
    avatarUrl,
    setAvatarUrl,
    setSavedSuccess,
    ekycStatus,
    setIsEditingLegal,
    cccdImage,
    setCccdImage,
    cccdBackImage,
    setCccdBackImage,
    setEkycFeedback,
    handleApplyOcrData,
    profileResource,
  } = ctx;

  if (missingApartment) return <MissingApartmentNotice />;
  return (
    <div className="space-y-6 w-full animate-fadeIn select-none">
      {profileResource.loading && <ResourceSkeleton label="Đang tải hồ sơ cá nhân & e-KYC..." />}
      {!profileResource.loading && profileResource.error && (
        <ResourceError message={profileResource.error} onRetry={profileResource.retry} />
      )}
      {!profileResource.loading && !profileResource.error && !profileResource.data && !fullName && (
        <ResourceEmpty message="Chưa có dữ liệu hồ sơ cư dân." />
      )}
      {/* Header */}
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#222B35] pb-3 sm:pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5 truncate">
            <ScanFace className="w-3.5 h-3.5 shrink-0" /> Skyline Smart Residence • {isOwner ? t('Chủ Hộ') : t('Thành Viên')}
          </div>
          <h2 className="font-serif text-lg sm:text-2xl text-white font-bold mt-0.5 sm:mt-1 truncate">
            {t('Thông Tin Cá Nhân & Định Danh')}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
            {t('Căn hộ')}: <strong className="text-white font-mono">{aptCode}</strong> • {t('Thông tin cư dân và bảo mật tài khoản')}
          </p>
        </div>

        {/* Cụm Trạng Thái Căn Cước & e-KYC */}
        {isOwner ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            {ekycStatus === 'VERIFIED' && (
              <span className="px-2.5 sm:px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                <span>{isEn ? 'VERIFIED ID CARD ✓' : 'ĐÃ XÁC THỰC CĂN CƯỚC ✓'}</span>
              </span>
            )}

            {ekycStatus === 'PENDING' && (
              <span className="px-2.5 sm:px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span>{t('Chờ BQL Duyệt')}</span>
              </span>
            )}

            {ekycStatus === 'REJECTED' && (
              <span className="px-2.5 sm:px-3 py-1 bg-rose-950/80 border border-rose-500 text-rose-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                <span>{t('Yêu Cầu Chụp Lại')}</span>
              </span>
            )}

            {ekycStatus === 'DRAFT' && (
              <span className="px-2.5 sm:px-3 py-1 bg-[#161D26] border border-gray-600 text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A880] shrink-0" />
                <span>{t('Chưa Gửi Hồ Sơ')}</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <span className="px-2.5 sm:px-3 py-1 bg-[#161D26] border border-purple-500/50 text-purple-300 text-[11px] sm:text-xs font-semibold rounded-none flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" /> {t('Thành Viên')}
            </span>

            {enrolledFaceProfile?.status === 'ACTIVE' && (
              <span className="px-2.5 sm:px-3 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" /> {t('FaceID Kích Hoạt')}
              </span>
            )}

            {enrolledFaceProfile?.status === 'PENDING_OWNER' && (
              <span className="px-2.5 sm:px-3 py-1 bg-amber-950/80 border border-amber-500 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> {t('Chờ Chủ Hộ Duyệt')}
              </span>
            )}

            {enrolledFaceProfile?.status === 'PENDING' && (
              <span className="px-2.5 sm:px-3 py-1 bg-cyan-950/80 border border-cyan-500 text-cyan-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none animate-pulse">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" /> {t('Chờ BQL Duyệt')}
              </span>
            )}

            {!enrolledFaceProfile && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('EKYC');
                  setIsFaceEnrollOpen(true);
                }}
                className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all shadow"
              >
                <Camera className="w-3.5 h-3.5" /> {t('Đăng Ký FaceID')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation - App-like segmented bar */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-[#222B35] text-[11px] sm:text-xs font-semibold uppercase tracking-wider gap-1 sm:gap-2 whitespace-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab('INFO')}
          className={`pb-2.5 sm:pb-3 px-2.5 sm:px-4 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors shrink-0 active:scale-95 ${
            activeTab === 'INFO'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>{isEn ? '1. Personal Contacts' : '1. Thông Tin Cá Nhân'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EKYC')}
          className={`pb-2.5 sm:pb-3 px-2.5 sm:px-4 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors shrink-0 active:scale-95 ${
            activeTab === 'EKYC'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ScanFace className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>{isEn ? '2. Identity Card & Face Photo' : '2. Căn Cước & Khuôn Mặt'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PASSWORD')}
          className={`pb-2.5 sm:pb-3 px-2.5 sm:px-4 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors shrink-0 active:scale-95 ${
            activeTab === 'PASSWORD'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>{isEn ? '3. Change Password' : '3. Đổi Mật Khẩu'}</span>
        </button>
      </div>

      {/* Loading Indicator while fetching from API */}
      {isLoadingApi && (
        <div className="p-8 bg-[#121820] border border-[#222B35] flex items-center justify-center gap-3 text-xs text-[#C5A880] font-mono rounded-none">
          <RefreshCw className="w-5 h-5 animate-spin text-[#C5A880]" />
          <span>{t('Đang tải thông tin hồ sơ...')}</span>
        </div>
      )}


      {/* TAB 1: PERSONAL INFORMATION & VEHICLE REGISTRATION */}
      {!isLoadingApi && activeTab === 'INFO' && (
        <ProfileInfoTabView ctx={ctx} />
      )}

      {/* TAB 2: E-KYC BIOMETRIC IDENTIFICATION & SMART CARD */}
      {activeTab === 'EKYC' && (
        <ProfileEkycTabView ctx={ctx} />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ACCOUNT PASSWORD MANAGEMENT (ĐỔI MẬT KHẨU TÀI KHOẢN)    */}
      {/* ------------------------------------------------------------- */}
      {!isLoadingApi && activeTab === 'PASSWORD' && (
        <div className="space-y-6 animate-fadeIn">
          <AccountPasswordSection currentUser={currentUser} />
        </div>
      )}

      {/* Tesseract OCR Scanner Modal */}
      <CccdOcrScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onApplyOcrData={handleApplyOcrData}
        initialFrontImage={cccdImage}
        initialBackImage={cccdBackImage}
      />

      {/* Avatar Studio Editor Modal */}
      <AvatarEditorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdated={async (newAvatarUrl) => {
          setAvatarUrl(newAvatarUrl);
          updateUserInfo({ avatar_url: newAvatarUrl, avatar: newAvatarUrl } as any);
          const userKey = currentUser.phone || currentUser.email || currentUser.username || currentUser.id;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('skyline_avatar_updated', { detail: { avatar: newAvatarUrl } }));
          }
          await refreshUser();
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }}
      />

      {/* Exact Resident CCCD Card Viewer (Front & Back) */}
      <CccdCardViewer
        isOpen={isCardViewerOpen}
        onClose={() => setIsCardViewerOpen(false)}
        fullName={fullName || currentUser.full_name}
        idCardNo={idCardNumber || currentUser.id_card_no || '067204000961'}
        apartmentCode={aptCode}
        frontImage={cccdImage}
        backImage={cccdBackImage}
        idDate={idDate || '18/08/2022'}
        idPlace={idPlace || 'Cục Cảnh sát QLHC về TTXH'}
        dob={birthday || '18/08/2004'}
        gender={gender === '1' ? 'Nam' : 'Nữ'}
        pob={pob || 'Quảng Trị'}
        avatarUrl={avatarUrl || currentUser.avatar_url || ''}
        allowUpload={true}
        onUpdateImages={(front, back) => {
          const userKey = currentUser.phone || currentUser.email || currentUser.username || currentUser.id;
          if (front) {
            setCccdImage(front);
            
          }
          if (back) {
            setCccdBackImage(back);
            
          }
          updateEkycCardImages(userKey, front, back);
          skylineUpdateCccd({
            front,
            back,
            number: idCardNumber,
            date: idDate,
            place: idPlace,
          }).catch(e => console.warn('Sync CCCD error:', e));
        }}
      />

      {/* Official 4-Step FaceID Biometric Enrollment Modal */}
      <FaceEnrollModal
        isOpen={isFaceEnrollOpen}
        onClose={() => setIsFaceEnrollOpen(false)}
        userId={currentUser.phone || currentUser.email || currentUser.username || currentUser.id}
        fullName={fullName || currentUser.full_name}
        apartmentCode={aptCode}
        phone={phone || currentUser.phone || ''}
        email={currentUser.email || ''}
        isFamilyMemberSelfEnroll={!isOwner}
        submittedByRole={currentUser.role}
        onEnrollSuccess={(profile) => {
          setEnrolledFaceProfile(profile);
          setIsEditingLegal(true);
          setEkycFeedback({
            type: 'success',
            message: 'Đã lưu độc lập 4 góc mẫu FaceID vào thiết bị và hệ thống! Khi đã có đủ cả CCCD và FaceID, vui lòng nhấn "Gửi VinHomes Manager Xác Nhận Chốt Hồ Sơ" ở Bước 3.',
          });
          // TUYỆT ĐỐI KHÔNG cập nhật / ghi đè ảnh chân dung cá nhân (avatar) từ mẫu FaceID
          // Ảnh chân dung cư dân được giữ nguyên vẹn từ thẻ CCCD hoặc mục Đổi Avatar riêng biệt.
        }}
      />
    </div>
  );
}

