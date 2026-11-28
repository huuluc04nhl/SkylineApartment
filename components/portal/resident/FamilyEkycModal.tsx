'use client';
import { getInitialsAvatar } from '@/lib/avatarHelper';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  CreditCard, 
  Car, 
  Phone, 
  ScanFace, 
  User, 
  Sparkles, 
  Lock,
  Search,
  Check,
  CheckCircle,
  Clock,
  Camera,
  Upload,
  Calendar,
  MapPin,
  FileText,
  Eye,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Scan,
  Edit2,
  ZoomIn,
  Info,
  Mail,
  Crown,
  Filter
} from 'lucide-react';
import { User as UserType } from '@/lib/dataStore';
import { 
  skylineGetFamilyMembers, 
  skylineAddFamilyMember, 
  skylineUpdateFamilyMember,
  skylineRemoveFamilyMember, 
  skylineSearchFamilyAccount,
  skylineConfirmFamilyFaceIdByOwner 
} from '@/lib/skylineApiClient';
import { 
  getEkycForUser, 
  submitEkycRequest, 
  EkycRequest 
} from '@/lib/ekycStore';
import { validateCccdCard, verifyFaceWithCccd } from '@/lib/ekycValidator';
import CccdOcrScannerModal from './CccdOcrScannerModal';
import { OcrCccdResult, formatToDateInput } from '@/lib/ocrParser';
import FaceEnrollModal from './FaceEnrollModal';
import { getEnrolledFaceProfile } from '@/lib/faceEnrollStore';
import { useLanguage } from '@/lib/languageContext';
import { toast } from '@/components/ui/Toast';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';
import { ResourceSkeleton, ResourceError, ResourceEmpty } from '@/components/ui/ResourceState';
import ConfirmDeleteModal from '@/components/portal/shared/ConfirmDeleteModal';
import { clearApartmentMembers } from '@/lib/userStore';
import { 
  cleanPhoneNumber, 
  isValidPhoneNumber, 
  getPhoneValidationError, 
  cleanCccdNumber, 
  isValidCccdNumber, 
  getCccdValidationError 
} from '@/lib/validationUtils';


export default function FamilyEkycModal({ ctx }: { ctx: any }) {
  const { t, isEn, currentUser, aptCode, isOwner, getEnrolledFaceProfile, skylineConfirmFamilyFaceIdByOwner, members, setMembers, bqlAccounts, setBqlAccounts, isLoading, setIsLoading, showAddModal, setShowAddModal, modalMode, setModalMode, isSubmitting, setIsSubmitting, actionSuccess, setActionSuccess, actionError, setActionError, faceEnrollTarget, setfaceEnrollTarget, confirmTargetMember, setConfirmTargetMember, isConfirmingFace, setIsConfirmingFace, ownerData, setOwnerData, memberSearchTerm, setMemberSearchTerm, memberFilterStatus, setMemberFilterStatus, directFullName, setDirectFullName, directPhone, setDirectPhone, directIdCard, setDirectIdCard, directRelationship, setDirectRelationship, directLicensePlate, setDirectLicensePlate, selectedAccount, setSelectedAccount, newRelationship, setNewRelationship, newLicensePlate, setNewLicensePlate, searchQuery, setSearchQuery, isSearchingApi, setIsSearchingApi, searchResult, setSearchResult, searchResults, setSearchResults, searchNotFound, setSearchNotFound, preApprovedFilter, setPreApprovedFilter, newResidenceType, setNewResidenceType, newRelationshipProof, setNewRelationshipProof, newTemporaryResidenceStatus, setNewTemporaryResidenceStatus, directDob, setDirectDob, directGender, setDirectGender, directPob, setDirectPob, directResidenceType, setDirectResidenceType, directRelationshipProof, setDirectRelationshipProof, directTemporaryResidenceStatus, setDirectTemporaryResidenceStatus, directVehicleType, setDirectVehicleType, removeTargetMember, setRemoveTargetMember, isRemoving, setIsRemoving, isClearDataConfirmOpen, setIsClearDataConfirmOpen, selectedAnglePreview, setSelectedAnglePreview, showEkycModal, setShowEkycModal, ekycTargetMember, setEkycTargetMember, ekycFullName, setEkycFullName, ekycRelationship, setEkycRelationship, ekycPhone, setEkycPhone, ekycIdCard, setEkycIdCard, ekycDob, setEkycDob, ekycPob, setEkycPob, ekycIdDate, setEkycIdDate, ekycIdPlace, setEkycIdPlace, ekycLicensePlate, setEkycLicensePlate, ekycAvatarUrl, setEkycAvatarUrl, ekycFrontImage, setEkycFrontImage, ekycBackImage, setEkycBackImage, isSubmittingEkyc, setIsSubmittingEkyc, ekycModalError, setEkycModalError, isMemberOcrModalOpen, setIsMemberOcrModalOpen, isCameraActive, setIsCameraActive, ownerName, handleClearLocalData, executeClearLocalData, handleApplyMemberOcrData, videoRef, streamRef, fileInputFrontRef, fileInputBackRef, fileInputAvatarRef, getMemberEkyc, getMemberStatus, fetchMembers, startCamera, stopCamera, captureCamera, handleFileUpload, handleCccdUpload, handleOpenEkycModal, handleCloseEkycModal, handleSubmitMemberEkyc, handleSelectPreApproved, handleSearchApi, handleAddMember, handlePromptRemoveMember, handleConfirmRemoveMember, handleDirectAddMember, totalApproved, totalPendingOwner, totalPendingBql, totalVehicles, totalResidents, filteredMembers, familyResource } = ctx;
  return (
    <>
      {showEkycModal && ekycTargetMember && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseEkycModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="bg-[#0D1117] border border-[#C5A880]/80 max-w-3xl w-full p-5 sm:p-7 text-white space-y-5 shadow-2xl rounded-none max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222B35] pb-3 gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-[#C5A880]/15 border border-[#C5A880] flex items-center justify-center text-[#C5A880] flex-shrink-0">
                  <ScanFace className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                    Thông Tin Thẻ & Khuôn Mặt Người Thân
                  </h3>
                  <p className="text-xs text-gray-400">
                    Căn {aptCode} • Chủ hộ {ownerName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMemberOcrModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#C5A880] to-[#E2C799] hover:brightness-110 text-[#0D1117] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow rounded-none active:scale-95"
                >
                  <Scan className="w-3.5 h-3.5 text-[#0D1117]" /> Tải Ảnh CCCD
                </button>
                <button
                  type="button"
                  onClick={handleCloseEkycModal}
                  className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161D26] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legal Representation Guarantee Box */}
            <div className="p-2.5 bg-[#121820] border border-[#C5A880]/50 rounded-none text-xs text-gray-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
              <span>{t('Chủ hộ', 'Owner')} <strong className="text-white">{ownerName}</strong> {t('bảo lãnh thông tin cho', 'guarantees information for')} <strong className="text-white">{ekycFullName || ekycTargetMember.fullName}</strong> {t('gửi BQL duyệt FaceID.', 'to submit for BQL FaceID approval.')}</span>
            </div>

            {/* Error Message */}
            {ekycModalError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 rounded-none">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{ekycModalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitMemberEkyc} className="space-y-4 text-xs">
              
              {/* SECTION 1: THÔNG TIN PHÁP LÝ NHÂN THÂN */}
              <div className="space-y-2.5 p-3.5 bg-[#121820] border border-[#222B35] rounded-none">
                <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-2">
                    <User className="w-4 h-4" /> 1. Thông Tin Người Thân
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Họ và Tên (Theo CCCD): *
                    </label>
                    <input
                      type="text"
                      required
                      value={ekycFullName}
                      onChange={(e) => setEkycFullName(e.target.value)}
                      placeholder={isEn ? 'Enter full name as on ID card' : 'Nhập họ và tên theo CCCD'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      {t('Mối Quan Hệ Với Chủ Hộ:', 'Relationship to Owner:')} *
                    </label>
                    <select
                      value={ekycRelationship}
                      onChange={(e) => setEkycRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Vợ / Chồng', 'Spouse')}">{t('Vợ / Chồng', 'Spouse')}</option>
                      <option value="{t('Con Cái', 'Children')}">{t('Con Cái', 'Children')}</option>
                      <option value="{t('Bố / Mẹ', 'Parents')}">{t('Bố / Mẹ', 'Parents')}</option>
                      <option value="{t('Anh / Chị / Em', 'Siblings')}">{t('Anh / Chị / Em', 'Siblings')}</option>
                      <option value="{t('Người Thân Cùng Căn Hộ', 'Co-resident Relatives')}">{t('Người Thân Cùng Căn Hộ', 'Co-resident Relatives')}</option>
                      <option value="{t('Người Nhà / Thành Viên Khác', 'Other Family Members')}">{t('Người Nhà / Thành Viên Khác', 'Other Family Members')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Số Điện Thoại Liên Hệ (10 số): *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={ekycPhone}
                      onChange={(e) => setEkycPhone(cleanPhoneNumber(e.target.value))}
                      placeholder={isEn ? 'Enter 10-digit phone number' : 'Nhập 10 số điện thoại'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {ekycPhone && !isValidPhoneNumber(ekycPhone) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getPhoneValidationError(ekycPhone)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Số CCCD / Định Danh (12 số): *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={ekycIdCard}
                      onChange={(e) => setEkycIdCard(cleanCccdNumber(e.target.value))}
                      placeholder={isEn ? 'Enter 12-digit ID card number' : 'Nhập 12 số CCCD'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-[#C5A880] font-mono font-bold rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {ekycIdCard && !isValidCccdNumber(ekycIdCard) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getCccdValidationError(ekycIdCard)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Ngày Sinh:
                    </label>
                    <input
                      type="date"
                      value={ekycDob}
                      onChange={(e) => setEkycDob(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Nơi Thường Trú / Quê Quán:
                    </label>
                    <input
                      type="text"
                      value={ekycPob}
                      onChange={(e) => setEkycPob(e.target.value)}
                      placeholder={isEn ? 'Enter hometown / permanent address' : 'Nhập quê quán / nơi thường trú'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Ngày Cấp CCCD:
                    </label>
                    <input
                      type="date"
                      value={ekycIdDate}
                      onChange={(e) => setEkycIdDate(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">
                      Biển Số Xe Đăng Ký (Nếu có):
                    </label>
                    <input
                      type="text"
                      value={ekycLicensePlate}
                      onChange={(e) => setEkycLicensePlate(e.target.value)}
                      placeholder={isEn ? 'Enter license plate (if any)' : 'Nhập biển số xe (nếu có)'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-cyan-300 font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ẢNH ĐẠI DIỆN HỒ SƠ & CCCD 2 MẶT */}
              <div className="space-y-4 p-4 bg-[#121820] border border-[#222B35] rounded-none">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between border-b border-[#222B35] pb-2.5">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" /> 2. {t('Ảnh Đại Diện (Avatar)', 'Profile Avatar')} & CCCD 2 Mặt Gửi BQL
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Photo 1: Ảnh Đại Diện Hồ Sơ */}
                  <div className="p-3 bg-[#161B22] border border-[#2D3748] rounded-none space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{t('Ảnh Đại Diện (Avatar)', 'Profile Avatar')}</span>
                        <span className="text-[10px] text-[#C5A880]">{t('Hồ sơ cá nhân', 'Personal Profile')}</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Ảnh chân dung hiển thị trang cá nhân. Mở cửa dùng tính năng Quét FaceID 4 mẫu độc lập.
                      </p>
                    </div>

                    {/* Camera or Image Preview */}
                    <div className="relative w-full h-44 bg-[#0D1117] rounded-none border border-gray-700 overflow-hidden flex items-center justify-center group shadow-inner">
                      {isCameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <img
                            src={ekycAvatarUrl || getInitialsAvatar('Skyline Resident')}
                            alt="Resident Avatar"
                            onError={(e) => {
                              e.currentTarget.src = getInitialsAvatar('Skyline Resident');
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-[#C5A880] border border-[#C5A880]/30">
                            ẢNH ĐẠI DIỆN • AVATAR
                          </div>
                          {ekycAvatarUrl && !ekycAvatarUrl.includes('default.png') && (
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                              ✓ Đã Có Avatar
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {isCameraActive ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={captureCamera}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" /> Chụp Ngay
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-none cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="flex-1 py-2 bg-[#1C2533] hover:bg-[#253245] border border-[#C5A880]/70 text-[#C5A880] font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" /> Camera
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputAvatarRef.current?.click()}
                              className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" /> Chọn Tệp
                            </button>
                            <input
                              ref={fileInputAvatarRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, setEkycAvatarUrl)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo 2: {t('CCCD Mặt Trước', 'National ID Front')} */}
                  <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-none space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{t('CCCD Mặt Trước', 'National ID Front')}</span>
                        <span className="text-[10px] text-cyan-400">{t('Mặt có ảnh', 'Photo side')}</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Chụp đủ 4 góc thẻ, không lóa sáng hoặc mất góc.
                      </p>
                    </div>

                    <div className="relative w-full h-44 bg-[#0D1117] rounded-none border border-gray-700 overflow-hidden flex items-center justify-center group shadow-inner">
                      {ekycFrontImage ? (
                        <img
                          src={ekycFrontImage}
                          alt="{t('CCCD Mặt Trước', 'National ID Front')}"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                          <CreditCard className="w-7 h-7 text-cyan-500/60" />
                          <span className="text-[11px] text-gray-400 font-medium">{t('Chưa có ảnh mặt trước thẻ CCCD', 'No ID front photo yet')}</span>
                          <span className="text-[9.5px] text-gray-600">{t('Bấm "Tải Lên Mặt Trước" bên dưới', 'Click "Upload Front Photo" below')}</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-cyan-300 border border-cyan-500/30">
                        VỊ TRÍ 1 • MẶT TRƯỚC
                      </div>
                      {ekycFrontImage && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                          ✓ Đã Tự Động Điền
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputFrontRef.current?.click()}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Tải Lên Mặt Trước
                      </button>
                      <input
                        ref={fileInputFrontRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCccdUpload(e, 'FRONT', setEkycFrontImage)}
                      />
                    </div>
                  </div>

                  {/* Photo 3: {t('CCCD Mặt Sau', 'National ID Back')} */}
                  <div className="p-3 bg-[#161D26] border border-[#2D3748] rounded-none space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{t('CCCD Mặt Sau', 'National ID Back')}</span>
                        <span className="text-[10px] text-purple-400">{t('Chip & Vân tay', 'Chip & Fingerprint side')}</span>
                      </div>
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        Chụp rõ chip điện tử, mã QR và ngày cấp.
                      </p>
                    </div>

                    <div className="relative w-full h-44 bg-[#0D1117] rounded-none border border-gray-700 overflow-hidden flex items-center justify-center group shadow-inner">
                      {ekycBackImage ? (
                        <img
                          src={ekycBackImage}
                          alt="{t('CCCD Mặt Sau', 'National ID Back')}"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3 text-gray-500 space-y-1">
                          <CreditCard className="w-7 h-7 text-purple-500/60" />
                          <span className="text-[11px] text-gray-400 font-medium">{t('Chưa có ảnh mặt sau thẻ CCCD (Chip)', 'No ID back photo (Chip) yet')}</span>
                          <span className="text-[9.5px] text-gray-600">{t('Bấm "Tải Lên Mặt Sau" bên dưới', 'Click "Upload Back Photo" below')}</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded-none text-[9.5px] font-mono text-purple-300 border border-purple-500/30">
                        VỊ TRÍ 2 • MẶT SAU
                      </div>
                      {ekycBackImage && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-mono font-bold rounded-none">
                          ✓ Đã Tự Động Điền
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputBackRef.current?.click()}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Tải Lên Mặt Sau
                      </button>
                      <input
                        ref={fileInputBackRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCccdUpload(e, 'BACK', setEkycBackImage)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#222B35]">
                <div className="text-[11px] text-gray-400">
                  Hồ sơ sẽ được chuyển tới Ban Quản Lý để xác nhận ngay lập tức.
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEkyc}
                  className="w-full sm:w-auto px-7 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSubmittingEkyc ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Đang Gửi...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Gửi BQL Duyệt Hồ Sơ
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
