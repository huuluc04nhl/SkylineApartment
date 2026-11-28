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


export default function FamilyFaceReviewModal({ ctx }: { ctx: any }) {
  const { t, isEn, currentUser, aptCode, isOwner, getEnrolledFaceProfile, skylineConfirmFamilyFaceIdByOwner, members, setMembers, bqlAccounts, setBqlAccounts, isLoading, setIsLoading, showAddModal, setShowAddModal, modalMode, setModalMode, isSubmitting, setIsSubmitting, actionSuccess, setActionSuccess, actionError, setActionError, faceEnrollTarget, setfaceEnrollTarget, confirmTargetMember, setConfirmTargetMember, isConfirmingFace, setIsConfirmingFace, ownerData, setOwnerData, memberSearchTerm, setMemberSearchTerm, memberFilterStatus, setMemberFilterStatus, directFullName, setDirectFullName, directPhone, setDirectPhone, directIdCard, setDirectIdCard, directRelationship, setDirectRelationship, directLicensePlate, setDirectLicensePlate, selectedAccount, setSelectedAccount, newRelationship, setNewRelationship, newLicensePlate, setNewLicensePlate, searchQuery, setSearchQuery, isSearchingApi, setIsSearchingApi, searchResult, setSearchResult, searchResults, setSearchResults, searchNotFound, setSearchNotFound, preApprovedFilter, setPreApprovedFilter, newResidenceType, setNewResidenceType, newRelationshipProof, setNewRelationshipProof, newTemporaryResidenceStatus, setNewTemporaryResidenceStatus, directDob, setDirectDob, directGender, setDirectGender, directPob, setDirectPob, directResidenceType, setDirectResidenceType, directRelationshipProof, setDirectRelationshipProof, directTemporaryResidenceStatus, setDirectTemporaryResidenceStatus, directVehicleType, setDirectVehicleType, removeTargetMember, setRemoveTargetMember, isRemoving, setIsRemoving, isClearDataConfirmOpen, setIsClearDataConfirmOpen, selectedAnglePreview, setSelectedAnglePreview, showEkycModal, setShowEkycModal, ekycTargetMember, setEkycTargetMember, ekycFullName, setEkycFullName, ekycRelationship, setEkycRelationship, ekycPhone, setEkycPhone, ekycIdCard, setEkycIdCard, ekycDob, setEkycDob, ekycPob, setEkycPob, ekycIdDate, setEkycIdDate, ekycIdPlace, setEkycIdPlace, ekycLicensePlate, setEkycLicensePlate, ekycAvatarUrl, setEkycAvatarUrl, ekycFrontImage, setEkycFrontImage, ekycBackImage, setEkycBackImage, isSubmittingEkyc, setIsSubmittingEkyc, ekycModalError, setEkycModalError, isMemberOcrModalOpen, setIsMemberOcrModalOpen, isCameraActive, setIsCameraActive, ownerName, handleClearLocalData, executeClearLocalData, handleApplyMemberOcrData, videoRef, streamRef, fileInputFrontRef, fileInputBackRef, fileInputAvatarRef, getMemberEkyc, getMemberStatus, fetchMembers, startCamera, stopCamera, captureCamera, handleFileUpload, handleCccdUpload, handleOpenEkycModal, handleCloseEkycModal, handleSubmitMemberEkyc, handleSelectPreApproved, handleSearchApi, handleAddMember, handlePromptRemoveMember, handleConfirmRemoveMember, handleDirectAddMember, totalApproved, totalPendingOwner, totalPendingBql, totalVehicles, totalResidents, filteredMembers, familyResource } = ctx;
  return (
    <>
      {confirmTargetMember && (() => {
        const enrolled = getEnrolledFaceProfile(confirmTargetMember.phone || confirmTargetMember.id || confirmTargetMember.username || '');
        const samples = enrolled?.samples;

        const handleConfirmAndSendToBql = async () => {
          setIsConfirmingFace(true);
          try {
            // 1. Xác nhận FaceID trong hồ sơ sinh trắc học
            await skylineConfirmFamilyFaceIdByOwner(
              confirmTargetMember.id || confirmTargetMember.phone || '', 
              aptCode,
              confirmTargetMember.phone
            );

            // 2. Đồng bộ trạng thái e-KYC sang PENDING trên máy chủ để BQL nhận hồ sơ thẩm duyệt ngay
            try {
              await fetch('/api/ekyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'CONFIRM_BY_OWNER',
                  userId: confirmTargetMember.id || confirmTargetMember.phone,
                  phone: confirmTargetMember.phone,
                }),
              });
            } catch (ekycSyncErr) {
              console.warn('Sync confirm to ekyc api error:', ekycSyncErr);
            }

            setActionSuccess(`✓ Đã xác nhận bảo lãnh hồ sơ FaceID cho thành viên "${confirmTargetMember.fullName}" và gửi Ban Quản Lý phê duyệt thành công!`);
            setTimeout(() => setActionSuccess(null), 5000);
            setConfirmTargetMember(null);
            fetchMembers();
          } catch (err: any) {
            setActionError(err?.message || 'Lỗi khi xác nhận hồ sơ FaceID.');
            setTimeout(() => setActionError(null), 5000);
          } finally {
            setIsConfirmingFace(false);
          }
        };

        return (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmTargetMember(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
          >
            <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#C5A880] text-white shadow-2xl p-5 sm:p-6 space-y-5 rounded-none max-h-[95vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#161D26] border border-[#C5A880] flex items-center justify-center text-[#C5A880]">
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#C5A880] font-bold">
                      Quyền Phê Duyệt Chủ Hộ • Căn Hộ {aptCode}
                    </div>
                    <h3 className="text-base font-serif font-bold text-white">
                      Xác Nhận 4 Mẫu FaceID Của Người Nhà: {confirmTargetMember.fullName}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmTargetMember(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161D26] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Member Brief Info */}
              <div className="p-3 bg-[#161B22] border border-[#222B35] text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-gray-400 block text-[11px]">{t('Thành viên:', 'Member:')}</span>
                  <strong className="text-white">{confirmTargetMember.fullName}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">{t('Quan hệ:', 'Relationship:')}</span>
                  <span className="text-[#C5A880] font-semibold">{confirmTargetMember.relationship}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">{t('SĐT:', 'Phone:')}</span>
                  <span className="font-mono text-gray-200">{confirmTargetMember.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">CCCD:</span>
                  <span className="font-mono text-gray-200">{confirmTargetMember.idCard || t('Đang cập nhật', 'Updating')}</span>
                </div>
              </div>

              {/* 4 Angle Samples Display */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#C5A880]" /> 4 Góc Khuôn Mặt:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Độ khớp: {enrolled?.faceScore ? `${enrolled.faceScore}%` : 'Chưa quét'}
                  </span>
                </div>

                {samples ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div 
                      onClick={() => setSelectedAnglePreview({ title: isEn ? '1. Front View' : '1. Chính Diện', src: samples.front })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>{t('1. Chính Diện', '1. Front View')}</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.front} alt="Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedAnglePreview({ title: isEn ? '2. Turn Left' : '2. Quay Trái', src: samples.left })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>{t('2. Quay Trái', '2. Turn Left')}</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.left} alt="Left" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedAnglePreview({ title: isEn ? '3. Turn Right' : '3. Quay Phải', src: samples.right })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>{t('3. Quay Phải', '3. Turn Right')}</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.right} alt="Right" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedAnglePreview({ title: isEn ? '4. Smile' : '4. Mỉm Cười', src: samples.smile })}
                      className="p-1.5 bg-[#121820] border border-gray-700 hover:border-[#C5A880] text-center space-y-1 group cursor-pointer transition-all relative"
                    >
                      <div className="text-[10px] font-mono text-[#C5A880] flex items-center justify-between">
                        <span>{t('4. Mỉm Cười', '4. Smile')}</span>
                        <ZoomIn className="w-3 h-3 text-gray-500 group-hover:text-[#C5A880]" />
                      </div>
                      <div className="aspect-square bg-black border border-gray-800 overflow-hidden relative">
                        <img src={samples.smile} alt="Smile" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-[#161B22] border border-gray-800 text-center text-xs text-gray-400">
                    Chưa có mẫu ảnh quét của thành viên này.
                  </div>
                )}
              </div>

              {/* Owner Legal Responsibility Notice */}
              <div className="p-2.5 bg-[#121820] border border-[#C5A880]/50 rounded-none text-xs text-gray-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                <span>{t('Xác nhận thành viên', 'Confirm Member')} <strong>{confirmTargetMember.fullName}</strong> thuộc căn <strong>{aptCode}</strong> để gửi BQL kích hoạt FaceID.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2.5 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmTargetMember(null);
                    setfaceEnrollTarget(confirmTargetMember);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] text-xs font-semibold rounded-none transition-colors cursor-pointer"
                >
                  Quét Lại
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSendToBql}
                  disabled={isConfirmingFace || !samples}
                  className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-[#C5A880] hover:brightness-110 text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 transition-all shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isConfirmingFace ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang Gửi...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Xác Nhận & Gửi BQL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}



      {/* =================================================================== */}
      {/* MODAL: XÁC NHẬN HỦY PHÂN QUYỀN CƯ DÂN CAO CẤP                       */}
      {/* =================================================================== */}
      {removeTargetMember && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setRemoveTargetMember(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn select-none"
        >
          <div className="bg-[#0D1117] border border-rose-600/80 max-w-md w-full p-4 sm:p-5 text-white space-y-3.5 shadow-2xl rounded-none">
            <div className="flex items-center gap-2.5 border-b border-[#222B35] pb-2.5">
              <div className="w-8 h-8 bg-rose-950 border border-rose-500 text-rose-300 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-white">
                  {t('Xác Nhận Xóa Thành Viên', 'Confirm Remove Member')}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {t('Căn hộ', 'Apartment')} {aptCode} • {t('Chủ hộ', 'Owner')} {ownerName}
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3 bg-rose-950/40 border border-rose-900/80 text-rose-200 text-xs space-y-1">
              <p>
                {t(
                  `Bạn có chắc chắn muốn xóa thành viên ${removeTargetMember.fullName} khỏi danh sách căn hộ ${aptCode}?`,
                  `Are you sure you want to remove ${removeTargetMember.fullName} from unit ${aptCode}?`
                )}
              </p>
              <p className="text-gray-300 text-[11px]">
                {t(
                  'Quyền ra vào sảnh và thang máy của người thân sẽ tạm ngừng. Bạn có thể thêm lại bất cứ lúc nào.',
                  'Access privileges will be revoked. You can add this member back at any time.'
                )}
              </p>
            </div>

            {/* Target Member Mini Summary */}
            <div className="p-2.5 bg-[#161D26] border border-[#222B35] flex items-center gap-2.5 text-xs">
              <div className="w-9 h-9 rounded-none overflow-hidden border border-gray-700 bg-black flex-shrink-0">
                <img
                  src={removeTargetMember.avatarUrl || getInitialsAvatar('Skyline Resident')}
                  alt={removeTargetMember.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="font-bold text-white">{removeTargetMember.fullName}</div>
                <div className="text-gray-400 font-mono text-[11px]">{t('SĐT:', 'Phone:')} {removeTargetMember.phone} • {removeTargetMember.relationship}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setRemoveTargetMember(null)}
                className="px-3.5 py-1.5 bg-transparent hover:bg-[#161D26] text-gray-400 hover:text-white rounded-none transition-colors cursor-pointer text-xs"
              >
                {t('Giữ Lại', 'Cancel')}
              </button>

              <button
                type="button"
                disabled={isRemoving}
                onClick={handleConfirmRemoveMember}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-none shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isRemoving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('Đang Xóa...', 'Removing...')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> {t('Xóa Thành Viên', 'Remove Member')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: LIGHTBOX PHÓNG TO MẪU ẢNH FACEID GÓC QUÉT                   */}
      {/* =================================================================== */}
      {selectedAnglePreview && (
        <div 
          onClick={() => setSelectedAnglePreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0D1117] border border-[#C5A880] p-4 max-w-lg w-full text-white shadow-2xl rounded-none space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
              <div className="text-xs font-bold font-mono text-[#C5A880] uppercase tracking-wider">
                {selectedAnglePreview.title}
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnglePreview(null)}
                className="text-gray-400 hover:text-white p-1 rounded-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-square bg-black border border-gray-800 overflow-hidden flex items-center justify-center shadow-inner">
              <img
                src={selectedAnglePreview.src}
                alt={selectedAnglePreview.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

    </>
  );
}
