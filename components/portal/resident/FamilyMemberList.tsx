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


export default function FamilyMemberList({ ctx }: { ctx: any }) {
  const { t, isEn, currentUser, aptCode, isOwner, getEnrolledFaceProfile, skylineConfirmFamilyFaceIdByOwner, members, setMembers, bqlAccounts, setBqlAccounts, isLoading, setIsLoading, showAddModal, setShowAddModal, modalMode, setModalMode, isSubmitting, setIsSubmitting, actionSuccess, setActionSuccess, actionError, setActionError, faceEnrollTarget, setfaceEnrollTarget, confirmTargetMember, setConfirmTargetMember, isConfirmingFace, setIsConfirmingFace, ownerData, setOwnerData, memberSearchTerm, setMemberSearchTerm, memberFilterStatus, setMemberFilterStatus, directFullName, setDirectFullName, directPhone, setDirectPhone, directIdCard, setDirectIdCard, directRelationship, setDirectRelationship, directLicensePlate, setDirectLicensePlate, selectedAccount, setSelectedAccount, newRelationship, setNewRelationship, newLicensePlate, setNewLicensePlate, searchQuery, setSearchQuery, isSearchingApi, setIsSearchingApi, searchResult, setSearchResult, searchResults, setSearchResults, searchNotFound, setSearchNotFound, preApprovedFilter, setPreApprovedFilter, newResidenceType, setNewResidenceType, newRelationshipProof, setNewRelationshipProof, newTemporaryResidenceStatus, setNewTemporaryResidenceStatus, directDob, setDirectDob, directGender, setDirectGender, directPob, setDirectPob, directResidenceType, setDirectResidenceType, directRelationshipProof, setDirectRelationshipProof, directTemporaryResidenceStatus, setDirectTemporaryResidenceStatus, directVehicleType, setDirectVehicleType, removeTargetMember, setRemoveTargetMember, isRemoving, setIsRemoving, isClearDataConfirmOpen, setIsClearDataConfirmOpen, selectedAnglePreview, setSelectedAnglePreview, showEkycModal, setShowEkycModal, ekycTargetMember, setEkycTargetMember, ekycFullName, setEkycFullName, ekycRelationship, setEkycRelationship, ekycPhone, setEkycPhone, ekycIdCard, setEkycIdCard, ekycDob, setEkycDob, ekycPob, setEkycPob, ekycIdDate, setEkycIdDate, ekycIdPlace, setEkycIdPlace, ekycLicensePlate, setEkycLicensePlate, ekycAvatarUrl, setEkycAvatarUrl, ekycFrontImage, setEkycFrontImage, ekycBackImage, setEkycBackImage, isSubmittingEkyc, setIsSubmittingEkyc, ekycModalError, setEkycModalError, isMemberOcrModalOpen, setIsMemberOcrModalOpen, isCameraActive, setIsCameraActive, ownerName, handleClearLocalData, executeClearLocalData, handleApplyMemberOcrData, videoRef, streamRef, fileInputFrontRef, fileInputBackRef, fileInputAvatarRef, getMemberEkyc, getMemberStatus, fetchMembers, startCamera, stopCamera, captureCamera, handleFileUpload, handleCccdUpload, handleOpenEkycModal, handleCloseEkycModal, handleSubmitMemberEkyc, handleSelectPreApproved, handleSearchApi, handleAddMember, handlePromptRemoveMember, handleConfirmRemoveMember, handleDirectAddMember, totalApproved, totalPendingOwner, totalPendingBql, totalVehicles, totalResidents, filteredMembers, familyResource } = ctx;
  return (
    <>
      {/* Members List */}
      <div className="bg-[#121820] border border-[#222B35] rounded-none overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-[#222B35] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C5A880]" /> Thành Viên Căn Hộ ({members.length})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder={isEn ? "Search member, phone..." : "Tìm kiếm thành viên, SĐT..."}
                className="bg-[#161B22] border border-[#2D3748] pl-8 pr-7 py-1.5 text-white text-xs rounded-none focus:border-[#C5A880] outline-none w-36 sm:w-44 font-sans"
              />
              {memberSearchTerm && (
                <button
                  type="button"
                  onClick={() => setMemberSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Status */}
            <select
              value={memberFilterStatus}
              onChange={(e) => setMemberFilterStatus(e.target.value as any)}
              className="bg-[#161B22] border border-[#2D3748] px-2 py-1.5 text-xs text-gray-200 rounded-none focus:border-[#C5A880] outline-none cursor-pointer"
            >
              <option value="ALL">{isEn ? `All (${members.length})` : `Tất cả (${members.length})`}</option>
              <option value="APPROVED">{isEn ? `FaceID Active (${totalApproved})` : `Đã FaceID (${totalApproved})`}</option>
              <option value="PENDING">{isEn ? `Pending (${totalPendingOwner + totalPendingBql})` : `Chờ duyệt (${totalPendingOwner + totalPendingBql})`}</option>
              <option value="NO_FACE">{isEn ? 'No FaceID' : 'Chưa FaceID'}</option>
            </select>

            <button
              onClick={fetchMembers}
              disabled={isLoading}
              title={isEn ? "Refresh member list" : "Làm mới danh sách thành viên"}
              className="text-xs text-gray-300 hover:text-[#C5A880] flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-1.5 bg-[#161B22] border border-[#2D3748] rounded-none hover:border-[#C5A880]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> {isEn ? 'Refresh' : 'Làm mới'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-xs text-[#C5A880] font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải dữ liệu...
          </div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>{t('Chưa có thành viên nào trong căn hộ', 'No members found in unit')} {aptCode}.</p>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-[#C5A880] font-bold underline hover:text-white cursor-pointer"
              >
                + Thêm thành viên
              </button>
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs space-y-2">
            <Filter className="w-6 h-6 text-gray-600 mx-auto mb-1" />
            <p>{t('Không tìm thấy kết quả phù hợp.', 'No matching results found.')}</p>
            <button
              type="button"
              onClick={() => {
                setMemberSearchTerm('');
                setMemberFilterStatus('ALL');
              }}
              className="text-[#C5A880] font-bold underline hover:text-white cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#222B35]">
            {filteredMembers.map((m: any) => {
              const ekyc = getMemberEkyc(m);
              const ekycStatus = getMemberStatus(m);

              const avatarSrc =
                (ekyc?.avatarUrl && !ekyc.avatarUrl.startsWith('data:image/'))
                  ? ekyc.avatarUrl
                  : (m.avatarUrl && !m.avatarUrl.startsWith('data:image/'))
                    ? m.avatarUrl
                    : getInitialsAvatar('Skyline Resident');

              return (
                <div
                  key={m.id}
                  className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#161B22] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Member Avatar */}
                    <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-none overflow-hidden border border-[#C5A880]/70 shadow bg-[#161D26] flex-shrink-0">
                      <img
                        src={avatarSrc}
                        alt={m.fullName}
                        onError={(e) => {
                          e.currentTarget.src = getInitialsAvatar('Skyline Resident');
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm sm:text-base truncate">
                          {m.fullName}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-none border bg-purple-950/80 text-purple-300 border-purple-600/60 flex-shrink-0">
                          {m.relationship || 'Người Nhà'}
                        </span>

                        {/* Status Badges */}
                        {/* Trạng thái xác thực duy nhất, rõ ràng */}
                        {ekycStatus === 'APPROVED' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-emerald-950/90 text-emerald-300 border-emerald-500/80 flex items-center gap-1 flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {t('Đã Kích Hoạt FaceID', 'FaceID Active')}
                          </span>
                        )}
                        {ekycStatus === 'PENDING_OWNER' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-amber-950/90 text-amber-300 border-amber-500/80 flex items-center gap-1 animate-pulse flex-shrink-0">
                            <Clock className="w-3 h-3 text-amber-400" /> {t('Chờ Chủ Hộ Xác Nhận', 'Pending Owner')}
                          </span>
                        )}
                        {ekycStatus === 'PENDING' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-cyan-950/90 text-cyan-300 border-cyan-500/80 flex items-center gap-1 animate-pulse flex-shrink-0">
                            <Clock className="w-3 h-3 text-cyan-400" /> {t('Chờ Ban Quản Lý Duyệt', 'Pending BQL')}
                          </span>
                        )}
                        {ekycStatus === 'REJECTED' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-none border bg-rose-950/90 text-rose-300 border-rose-500/80 flex items-center gap-1 flex-shrink-0">
                            <XCircle className="w-3 h-3 text-rose-400" /> {t('Cần Gửi Lại Ảnh', 'Photo Resubmission Needed')}
                          </span>
                        )}
                        {ekycStatus === 'NOT_SUBMITTED' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-medium rounded-none border bg-gray-900/90 text-gray-300 border-gray-700 flex items-center gap-1 flex-shrink-0">
                            <AlertCircle className="w-3 h-3 text-gray-400" /> {t('Chưa Đăng Ký FaceID', 'Not Enrolled')}
                          </span>
                        )}
                      </div>

                      <div className="text-gray-400 text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>
                          SĐT: <strong className="font-mono text-gray-200">{m.phone}</strong>
                        </span>
                        {m.idCard && (
                          <span>
                            • CCCD: <strong className="font-mono text-[#C5A880]">{m.idCard}</strong>
                          </span>
                        )}
                        {m.licensePlate && (
                          <span>
                            • Biển số: <strong className="font-mono text-cyan-400">{m.licensePlate}</strong> {m.vehicleType ? `(${m.vehicleType})` : ''}
                          </span>
                        )}
                      </div>

                      {/* Thông tin cư trú & Pháp lý */}
                      <div className="text-[11px] text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        <span>{t('Hình thức:', 'Type:')} <strong className="text-gray-200">{m.residenceType || (isEn ? 'Permanent resident with owner' : 'Thường trú cùng chủ hộ')}</strong></span>
                        <span>• {t('Tạm trú:', 'Status:')} <strong className="text-emerald-400">{m.temporaryResidenceStatus || 'Đang làm thủ tục'}</strong></span>
                        {m.dob && <span>• {t('Sinh:', 'DOB:')} <strong className="font-mono text-gray-300">{m.dob}</strong></span>}
                        {m.gender && <span>({m.gender})</span>}
                      </div>

                      {/* Rejection Notice if any */}
                      {ekycStatus === 'REJECTED' && ekyc?.rejectionReason && (
                        <div className="p-1.5 bg-rose-950/50 border border-rose-800/80 rounded-none text-[11px] text-rose-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>{t('Lý do từ BQL:', 'Reason from Management:')}</strong> {ekyc.rejectionReason}
                          </span>
                        </div>
                      )}

                      {/* Privilege description & Legal proof */}
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0" />
                        <span className="truncate">
                          {m.accessLevel || 'Sảnh • Thang máy T12 • Hầm B1/B2 • Tiện ích cư dân'}
                        </span>
                        {m.relationshipProof && (
                          <span className="text-[10px] text-[#C5A880]/80 font-mono">
                            • Căn cứ: {m.relationshipProof}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Owner & Family Member */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#222B35]/60 flex-shrink-0">
                    {/* Owner Confirm Button when Member is PENDING_OWNER */}
                    {isOwner && ekycStatus === 'PENDING_OWNER' && (
                      <button
                        type="button"
                        onClick={() => setConfirmTargetMember(m)}
                        className="px-3 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 bg-gradient-to-r from-amber-500 to-[#C5A880] hover:brightness-110 text-[#0D1117]"
                        title={t('Xác nhận 4 mẫu ảnh và chuyển Ban Quản Lý phê duyệt')}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t('Xác Nhận Gửi BQL', 'Confirm & Send to BQL')}</span>
                      </button>
                    )}

                    {/* FaceID Scanning Button */}
                    {(isOwner || (m.id === currentUser.id || m.phone === currentUser.phone || m.username === currentUser.username)) && (
                      <button
                        type="button"
                        onClick={() => setfaceEnrollTarget(m)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 ${
                          getEnrolledFaceProfile(m.phone || m.id || m.username || '')
                            ? 'bg-[#121820] hover:bg-[#1E2631] border border-cyan-500/80 text-cyan-300'
                            : 'bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold'
                        }`}
                        title={t('Quét mẫu khuôn mặt')}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t('Quét Khuôn Mặt', 'Scan Face')}</span>
                      </button>
                    )}

                    {/* CCCD & Bio Details */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleOpenEkycModal(m)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-none flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95 bg-[#161D26] hover:bg-[#1F2937] border border-[#2D3748] hover:border-[#C5A880] text-gray-200"
                        title={t('Xem và cập nhật ảnh Căn cước công dân')}
                      >
                        <ScanFace className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>{t('Hồ Sơ & CCCD', 'Profile & ID')}</span>
                      </button>
                    )}

                    {/* Delete Member */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handlePromptRemoveMember(m)}
                        className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/60 rounded-none transition-colors flex items-center gap-1 cursor-pointer"
                        title={t('Xóa người thân khỏi căn hộ')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('Xóa', 'Delete')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </>
  );
}
