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


export default function FamilyAddMemberModal({ ctx }: { ctx: any }) {
  const { t, isEn, currentUser, aptCode, isOwner, getEnrolledFaceProfile, skylineConfirmFamilyFaceIdByOwner, members, setMembers, bqlAccounts, setBqlAccounts, isLoading, setIsLoading, showAddModal, setShowAddModal, modalMode, setModalMode, isSubmitting, setIsSubmitting, actionSuccess, setActionSuccess, actionError, setActionError, faceEnrollTarget, setfaceEnrollTarget, confirmTargetMember, setConfirmTargetMember, isConfirmingFace, setIsConfirmingFace, ownerData, setOwnerData, memberSearchTerm, setMemberSearchTerm, memberFilterStatus, setMemberFilterStatus, directFullName, setDirectFullName, directPhone, setDirectPhone, directIdCard, setDirectIdCard, directRelationship, setDirectRelationship, directLicensePlate, setDirectLicensePlate, selectedAccount, setSelectedAccount, newRelationship, setNewRelationship, newLicensePlate, setNewLicensePlate, searchQuery, setSearchQuery, isSearchingApi, setIsSearchingApi, searchResult, setSearchResult, searchResults, setSearchResults, searchNotFound, setSearchNotFound, preApprovedFilter, setPreApprovedFilter, newResidenceType, setNewResidenceType, newRelationshipProof, setNewRelationshipProof, newTemporaryResidenceStatus, setNewTemporaryResidenceStatus, directDob, setDirectDob, directGender, setDirectGender, directPob, setDirectPob, directResidenceType, setDirectResidenceType, directRelationshipProof, setDirectRelationshipProof, directTemporaryResidenceStatus, setDirectTemporaryResidenceStatus, directVehicleType, setDirectVehicleType, removeTargetMember, setRemoveTargetMember, isRemoving, setIsRemoving, isClearDataConfirmOpen, setIsClearDataConfirmOpen, selectedAnglePreview, setSelectedAnglePreview, showEkycModal, setShowEkycModal, ekycTargetMember, setEkycTargetMember, ekycFullName, setEkycFullName, ekycRelationship, setEkycRelationship, ekycPhone, setEkycPhone, ekycIdCard, setEkycIdCard, ekycDob, setEkycDob, ekycPob, setEkycPob, ekycIdDate, setEkycIdDate, ekycIdPlace, setEkycIdPlace, ekycLicensePlate, setEkycLicensePlate, ekycAvatarUrl, setEkycAvatarUrl, ekycFrontImage, setEkycFrontImage, ekycBackImage, setEkycBackImage, isSubmittingEkyc, setIsSubmittingEkyc, ekycModalError, setEkycModalError, isMemberOcrModalOpen, setIsMemberOcrModalOpen, isCameraActive, setIsCameraActive, ownerName, handleClearLocalData, executeClearLocalData, handleApplyMemberOcrData, videoRef, streamRef, fileInputFrontRef, fileInputBackRef, fileInputAvatarRef, getMemberEkyc, getMemberStatus, fetchMembers, startCamera, stopCamera, captureCamera, handleFileUpload, handleCccdUpload, handleOpenEkycModal, handleCloseEkycModal, handleSubmitMemberEkyc, handleSelectPreApproved, handleSearchApi, handleAddMember, handlePromptRemoveMember, handleConfirmRemoveMember, handleDirectAddMember, totalApproved, totalPendingOwner, totalPendingBql, totalVehicles, totalResidents, filteredMembers, familyResource } = ctx;
  return (
    <>
      {showAddModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-[#0D1117] border border-[#C5A880]/70 max-w-2xl w-full p-4 sm:p-5 text-white space-y-3.5 shadow-2xl rounded-none max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-none bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-white">
                    Thêm Cư Dân • Căn {aptCode}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Thêm thành viên vào danh sách căn hộ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-none hover:bg-[#161D26] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error / Alert */}
            {actionError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 rounded-none">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Tab Selector Mode (3 Tabs) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#161B22] border border-[#222B35] rounded-none text-xs">
              <button
                type="button"
                onClick={() => {
                  setModalMode('PRE_APPROVED');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-1.5 px-2 rounded-none font-semibold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                  modalMode === 'PRE_APPROVED'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{t('Có Sẵn', 'Pre-registered')} ({bqlAccounts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalMode('SEARCH_API');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-1.5 px-2 rounded-none font-semibold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                  modalMode === 'SEARCH_API'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{t('Tra Cứu', 'Search')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalMode('DIRECT_INPUT');
                  setSelectedAccount(null);
                  setActionError(null);
                }}
                className={`py-1.5 px-2 rounded-none font-semibold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
                  modalMode === 'DIRECT_INPUT'
                    ? 'bg-[#C5A880] text-[#0D1117] shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{t('Nhập Mới', 'Add New')}</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* ------------------------------------------------------------- */}
            {/* MODE 1: CHỌN TỪ DANH SÁCH TÀI KHOẢN KHẢ DỤNG                   */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'PRE_APPROVED' && (() => {
              const filteredBqlAccounts = bqlAccounts.filter((acc: any) => {
                if (!preApprovedFilter.trim()) return true;
                const q = preApprovedFilter.toLowerCase().trim();
                const qDigits = q.replace(/\D/g, '');
                return (
                  acc.fullName.toLowerCase().includes(q) ||
                  acc.phone.includes(qDigits || q) ||
                  (acc.idCard && acc.idCard.toLowerCase().includes(q)) ||
                  (acc.username && acc.username.toLowerCase().includes(q))
                );
              });

              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{t('Tài khoản người nhà đã đăng ký trong hệ thống:', 'Registered family accounts in system:')}</span>
                    <span className="text-[#C5A880] font-mono font-bold">
                      {filteredBqlAccounts.length} / {bqlAccounts.length} tài khoản
                    </span>
                  </div>

                  {/* Quick filter search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={preApprovedFilter}
                      onChange={(e) => setPreApprovedFilter(e.target.value)}
                      placeholder={isEn ? 'Filter by name, phone or ID...' : 'Lọc nhanh theo họ tên, SĐT hoặc CCCD...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] pl-9 pr-8 py-2 text-white text-xs font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {preApprovedFilter && (
                      <button
                        type="button"
                        onClick={() => setPreApprovedFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {filteredBqlAccounts.length === 0 ? (
                    <div className="p-5 bg-[#161D26] border border-[#222B35] rounded-none text-center text-xs text-gray-400 space-y-1.5">
                      <p>{t('Không tìm thấy tài khoản phù hợp với từ khóa', 'No accounts found matching keyword')} "{preApprovedFilter}".</p>
                      <button
                        type="button"
                        onClick={() => setPreApprovedFilter('')}
                        className="text-[#C5A880] hover:underline text-xs"
                      >
                        Hiển thị lại tất cả tài khoản
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {filteredBqlAccounts.map((acc: any) => {
                        const isAlreadyInUnit = members.some(
                          (m: any) => m.id === acc.id || m.phone === acc.phone || m.username === acc.username
                        );
                        const isSelected = selectedAccount?.id === acc.id;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => !isAlreadyInUnit && handleSelectPreApproved(acc)}
                            className={`p-2.5 rounded-none border transition-all flex items-center justify-between gap-3 ${
                              isAlreadyInUnit
                                ? 'bg-[#161D26]/40 border-gray-800 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#1C2533] border-[#C5A880] shadow cursor-pointer'
                                : 'bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/60 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-none overflow-hidden border border-[#C5A880]/60 flex-shrink-0 bg-[#0D1117]">
                                <img
                                  src={acc.avatarUrl || getInitialsAvatar('Skyline Resident')}
                                  alt={acc.fullName}
                                  onError={(e) => {
                                    e.currentTarget.src = getInitialsAvatar('Skyline Resident');
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{acc.fullName}</span>
                                  {isAlreadyInUnit ? (
                                    <span className="text-[9px] px-1 py-0.5 bg-gray-800 text-gray-400 rounded-none flex-shrink-0">
                                      Đang ở căn này
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1 py-0.5 bg-[#C5A880]/15 border border-[#C5A880]/30 text-[#C5A880] rounded-none flex-shrink-0 font-mono">
                                      Người Nhà
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono flex-wrap">
                                  <span className="text-gray-300">{t('SĐT:', 'Phone:')} {acc.phone}</span>
                                  {acc.idCard && <span>• CCCD: {acc.idCard}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {isAlreadyInUnit ? (
                                <span className="text-[10px] text-gray-500 italic">{t('Đã có', 'Added')}</span>
                              ) : isSelected ? (
                                <span className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] text-[10px] font-bold rounded-none flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> Đã chọn
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 bg-[#141B24] hover:bg-[#C5A880] text-gray-300 hover:text-[#0D1117] border border-[#2D3748] hover:border-[#C5A880] text-[10px] font-semibold rounded-none transition-colors"
                                >
                                  Chọn
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ------------------------------------------------------------- */}
            {/* MODE 2: TRA CỨU TÀI KHOẢN QUA API BẰNG SĐT / CCCD             */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'SEARCH_API' && (
              <div className="space-y-3">
                <form onSubmit={handleSearchApi} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isEn ? 'Enter phone, ID or member name...' : 'Nhập SĐT, CCCD hoặc họ tên người nhà...'}
                    className="flex-1 bg-[#161B22] border border-[#2D3748] p-2 text-white text-xs font-mono rounded-none focus:border-[#C5A880] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingApi || !searchQuery.trim()}
                    className="px-3.5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {isSearchingApi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    Tra Cứu
                  </button>
                </form>

                {/* Quick Suggestion Pills */}
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400 font-mono">{t('Tài khoản mẫu có sẵn trong hệ thống:', 'Available sample accounts in system:')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Nguyễn Hữu Nhựt', q: '0917795211' },
                      { name: 'Nguyễn Văn Cường', q: '0325524482' },
                      { name: 'Lê Đức Hải', q: '0977758215' },
                      { name: 'Vũ Cát Thịnh', q: '0909262626' },
                    ].map((hint) => (
                      <button
                        key={hint.q}
                        type="button"
                        onClick={() => {
                          setSearchQuery(hint.q);
                          handleSearchApi(undefined, hint.q);
                        }}
                        className="px-2 py-0.5 bg-[#161D26] hover:bg-[#C5A880] text-gray-300 hover:text-[#0D1117] border border-[#2D3748] hover:border-[#C5A880] text-[10.5px] transition-colors rounded-none font-mono cursor-pointer"
                      >
                        {hint.name} ({hint.q})
                      </button>
                    ))}
                  </div>
                </div>

                {searchNotFound && (
                  <div className="p-2.5 bg-[#161D26] border border-rose-500/40 text-rose-300 text-xs rounded-none">
                    {searchNotFound}
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 border-b border-[#222B35] pb-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Kết Quả Tìm Thấy ({searchResults.length}):
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {searchResults.map((acc: any) => {
                        const isAlreadyInUnit = members.some(
                          (m: any) => m.id === acc.id || m.phone === acc.phone || m.username === acc.username
                        );
                        const isSelected = selectedAccount?.id === acc.id;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => !isAlreadyInUnit && handleSelectPreApproved(acc)}
                            className={`p-2.5 rounded-none border transition-all flex items-center justify-between gap-3 ${
                              isAlreadyInUnit
                                ? 'bg-[#161D26]/40 border-gray-800 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#1C2533] border-[#C5A880] shadow cursor-pointer'
                                : 'bg-[#161D26] border-[#222B35] hover:border-[#C5A880]/60 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-none overflow-hidden border border-[#C5A880]/60 flex-shrink-0 bg-[#0D1117]">
                                <img
                                  src={acc.avatarUrl || getInitialsAvatar('Skyline Resident')}
                                  alt={acc.fullName}
                                  onError={(e) => {
                                    e.currentTarget.src = getInitialsAvatar('Skyline Resident');
                                  }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate">{acc.fullName}</span>
                                  {isAlreadyInUnit && (
                                    <span className="text-[9px] px-1 py-0.5 bg-gray-800 text-gray-400 rounded-none flex-shrink-0">
                                      Đang ở căn này
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono flex-wrap">
                                  <span>{t('SĐT:', 'Phone:')} {acc.phone}</span>
                                  {acc.idCard && <span>• CCCD: {acc.idCard}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {isAlreadyInUnit ? (
                                <span className="text-[10px] text-gray-500 italic">{t('Đã có', 'Added')}</span>
                              ) : isSelected ? (
                                <span className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] text-[10px] font-bold rounded-none flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> Đã chọn
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] font-bold text-[10px] rounded-none hover:bg-white transition-colors"
                                >
                                  + Chọn
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* MODE 3: NHẬP TRỰC TIẾP THÔNG TIN NGƯỜI THÂN                     */}
            {/* ------------------------------------------------------------- */}
            {modalMode === 'DIRECT_INPUT' && (
              <form onSubmit={handleDirectAddMember} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Họ và Tên <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directFullName}
                      onChange={(e) => setDirectFullName(e.target.value)}
                      placeholder={isEn ? 'Enter full name...' : 'Nhập họ và tên...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Số Điện Thoại (10 số) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={directPhone}
                      onChange={(e) => setDirectPhone(cleanPhoneNumber(e.target.value))}
                      placeholder={isEn ? 'Enter 10-digit phone number...' : 'Nhập 10 số điện thoại...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {directPhone && !isValidPhoneNumber(directPhone) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getPhoneValidationError(directPhone)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Mối Quan Hệ Với Chủ Hộ <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={directRelationship}
                      onChange={(e) => setDirectRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Vợ / Chồng', 'Spouse')}">{t('Vợ / Chồng', 'Spouse')}</option>
                      <option value="{t('Con ruột', 'Biological child')}">{t('Con ruột', 'Biological child')}</option>
                      <option value="{t('Con nuôi', 'Adopted child')}">{t('Con nuôi', 'Adopted child')}</option>
                      <option value="{t('Bố / Mẹ', 'Parents')} ruột">{t('Bố / Mẹ', 'Parents')} ruột</option>
                      <option value="{t('Bố / Mẹ', 'Parents')} vợ / chồng">{t('Bố / Mẹ', 'Parents')} vợ / chồng</option>
                      <option value="{t('Anh / Chị / Em', 'Siblings')} ruột">{t('Anh / Chị / Em', 'Siblings')} ruột</option>
                      <option value="{t('Cháu ruột', 'Niece / Nephew')}">{t('Cháu ruột', 'Niece / Nephew')}</option>
                      <option value="{t('Người thân khác', 'Other relative')}">{t('Người thân khác', 'Other relative')}</option>
                      <option value="{t('Người giúp việc / Bảo mẫu', 'Housekeeper / Nanny')}">{t('Người giúp việc / Bảo mẫu', 'Housekeeper / Nanny')}</option>
                      <option value="{t('Lái xe riêng', 'Private driver')}">{t('Lái xe riêng', 'Private driver')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Số CCCD / Định Danh (12 số)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={directIdCard}
                      onChange={(e) => setDirectIdCard(cleanCccdNumber(e.target.value))}
                      placeholder={isEn ? 'Enter 12-digit ID card number...' : 'Nhập 12 số CCCD...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                    {directIdCard && !isValidCccdNumber(directIdCard) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                        {getCccdValidationError(directIdCard)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Hình Thức Cư Trú:', 'Residency Status:')}</label>
                    <select
                      value={directResidenceType}
                      onChange={(e) => setDirectResidenceType(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Thường trú cùng chủ hộ', 'Permanent resident with owner')}">{t('Thường trú cùng chủ hộ', 'Permanent resident with owner')}</option>
                      <option value="{t('Tạm trú dài hạn', 'Long-term temporary resident')}">{t('Tạm trú dài hạn', 'Long-term temporary resident')}</option>
                      <option value="{t('Lưu trú có thời hạn', 'Fixed-term stay')}">{t('Lưu trú có thời hạn', 'Fixed-term stay')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Căn Cứ Bảo Lãnh / Chứng Minh:', 'Proof of Relationship:')}</label>
                    <select
                      value={directRelationshipProof}
                      onChange={(e) => setDirectRelationshipProof(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Sổ Hộ Khẩu / Xác nhận CT07', 'Household Registry / CT07')}">{t('Sổ Hộ Khẩu / Xác nhận CT07', 'Household Registry / CT07')}</option>
                      <option value="{t('Giấy chứng nhận kết hôn', 'Marriage Certificate')}">{t('Giấy chứng nhận kết hôn', 'Marriage Certificate')}</option>
                      <option value="{t('Giấy khai sinh', 'Birth Certificate')}">{t('Giấy khai sinh', 'Birth Certificate')}</option>
                      <option value="{t('Hợp đồng lao động bảo mẫu / lái xe', 'Labor Contract for Nanny / Driver')}">{t('Hợp đồng lao động bảo mẫu / lái xe', 'Labor Contract for Nanny / Driver')}</option>
                      <option value="{t('Văn bản bảo lãnh của chủ hộ', 'Owner Sponsorship Letter')}">{t('Văn bản bảo lãnh của chủ hộ', 'Owner Sponsorship Letter')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Ngày Sinh (DOB):', 'Date of Birth (DOB):')}</label>
                    <input
                      type="date"
                      value={directDob}
                      onChange={(e) => setDirectDob(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Giới Tính:', 'Gender:')}</label>
                    <select
                      value={directGender}
                      onChange={(e) => setDirectGender(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="Nam">{t('Nam', 'Male')}</option>
                      <option value="Nữ">{t('Nữ', 'Female')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Nơi Sinh / Quê Quán:', 'Place of Birth / Origin:')}</label>
                    <input
                      type="text"
                      value={directPob}
                      onChange={(e) => setDirectPob(e.target.value)}
                      placeholder={isEn ? 'Enter place of birth / hometown...' : 'Nhập nơi sinh / quê quán...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-300 font-medium block mb-1">{t('Biển Số Xe:', 'License Plate:')}</label>
                      <input
                        type="text"
                        value={directLicensePlate}
                        onChange={(e) => setDirectLicensePlate(e.target.value)}
                        placeholder="VD: 59P1-123.45"
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-medium block mb-1">{t('Loại Phương Tiện:', 'Vehicle Type:')}</label>
                      <select
                        value={directVehicleType}
                        onChange={(e) => setDirectVehicleType(e.target.value)}
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                      >
                        <option value="Xe máy">{t('Xe máy', 'Motorcycle')}</option>
                        <option value="Ô tô">{t('Ô tô', 'Car')}</option>
                        <option value="Xe đạp điện">{t('Xe đạp điện', 'Electric bike')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-[#161D26] border border-[#C5A880]/30 text-[11px] text-[#C5A880] flex items-center gap-2">
                  <Crown className="w-4 h-4 flex-shrink-0 text-[#C5A880]" />
                  <span>{t('Chủ Hộ Bảo Lãnh:', 'Sponsoring Owner:')} <strong>{ownerName}</strong> (Căn {aptCode} - The Tropical BS-07)</span>
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 border-t border-[#222B35]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-transparent hover:bg-gray-800 text-gray-300 text-xs font-semibold rounded-none cursor-pointer text-center"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !directFullName.trim() || !directPhone.trim()}
                    className="w-full sm:w-auto px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang Thêm...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Thêm Thành Viên
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CONFIRMATION & ROLE ASSIGNMENT SECTION (CHO TAB 1 & 2)       */}
            {/* ------------------------------------------------------------- */}
            {selectedAccount && modalMode !== 'DIRECT_INPUT' ? (
              <form onSubmit={handleAddMember} className="pt-2.5 border-t border-[#222B35] space-y-2.5 text-xs">
                <div className="p-2.5 bg-[#161D26] border border-[#C5A880]/60 rounded-none flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#C5A880]" />
                    <span className="text-white font-bold text-xs">{selectedAccount.fullName}</span>
                    <span className="text-gray-400 font-mono text-xs">({selectedAccount.phone})</span>
                  </div>
                  <span className="text-[11px] text-[#C5A880] font-medium">
                    {t('Đăng ký vào căn', 'Registering to')} {aptCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Mối Quan Hệ Với Chủ Hộ:', 'Relationship to Owner:')}</label>
                    <select
                      value={newRelationship}
                      onChange={(e) => setNewRelationship(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Vợ / Chồng', 'Spouse')}">{t('Vợ / Chồng', 'Spouse')}</option>
                      <option value="{t('Con ruột', 'Biological child')}">{t('Con ruột', 'Biological child')}</option>
                      <option value="{t('Con nuôi', 'Adopted child')}">{t('Con nuôi', 'Adopted child')}</option>
                      <option value="{t('Bố / Mẹ', 'Parents')} ruột">{t('Bố / Mẹ', 'Parents')} ruột</option>
                      <option value="{t('Bố / Mẹ', 'Parents')} vợ / chồng">{t('Bố / Mẹ', 'Parents')} vợ / chồng</option>
                      <option value="{t('Anh / Chị / Em', 'Siblings')} ruột">{t('Anh / Chị / Em', 'Siblings')} ruột</option>
                      <option value="{t('Cháu ruột', 'Niece / Nephew')}">{t('Cháu ruột', 'Niece / Nephew')}</option>
                      <option value="{t('Người thân khác', 'Other relative')}">{t('Người thân khác', 'Other relative')}</option>
                      <option value="{t('Người giúp việc / Bảo mẫu', 'Housekeeper / Nanny')}">{t('Người giúp việc / Bảo mẫu', 'Housekeeper / Nanny')}</option>
                      <option value="{t('Lái xe riêng', 'Private driver')}">{t('Lái xe riêng', 'Private driver')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Hình Thức Cư Trú:', 'Residency Status:')}</label>
                    <select
                      value={newResidenceType}
                      onChange={(e) => setNewResidenceType(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Thường trú cùng chủ hộ', 'Permanent resident with owner')}">{t('Thường trú cùng chủ hộ', 'Permanent resident with owner')}</option>
                      <option value="{t('Tạm trú dài hạn', 'Long-term temporary resident')}">{t('Tạm trú dài hạn', 'Long-term temporary resident')}</option>
                      <option value="{t('Lưu trú có thời hạn', 'Fixed-term stay')}">{t('Lưu trú có thời hạn', 'Fixed-term stay')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Căn Cứ Bảo Lãnh:', 'Proof of Relationship:')}</label>
                    <select
                      value={newRelationshipProof}
                      onChange={(e) => setNewRelationshipProof(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white rounded-none focus:border-[#C5A880] outline-none"
                    >
                      <option value="{t('Sổ Hộ Khẩu / Xác nhận CT07', 'Household Registry / CT07')}">{t('Sổ Hộ Khẩu / Xác nhận CT07', 'Household Registry / CT07')}</option>
                      <option value="{t('Giấy chứng nhận kết hôn', 'Marriage Certificate')}">{t('Giấy chứng nhận kết hôn', 'Marriage Certificate')}</option>
                      <option value="{t('Giấy khai sinh', 'Birth Certificate')}">{t('Giấy khai sinh', 'Birth Certificate')}</option>
                      <option value="{t('Hợp đồng lao động bảo mẫu / lái xe', 'Labor Contract for Nanny / Driver')}">{t('Hợp đồng lao động bảo mẫu / lái xe', 'Labor Contract for Nanny / Driver')}</option>
                      <option value="{t('Văn bản bảo lãnh của chủ hộ', 'Owner Sponsorship Letter')}">{t('Văn bản bảo lãnh của chủ hộ', 'Owner Sponsorship Letter')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">{t('Biển Số Xe (tùy chọn):', 'License Plate (optional):')}</label>
                    <input
                      type="text"
                      value={newLicensePlate}
                      onChange={(e) => setNewLicensePlate(e.target.value)}
                      placeholder="VD: 59P1-886.79"
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2 text-white font-mono rounded-none focus:border-[#C5A880] outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 border-t border-[#222B35]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-transparent hover:bg-[#161D26] text-gray-400 hover:text-white rounded-none transition-colors cursor-pointer text-center text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Đang Xử Lý...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Thêm Thành Viên
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : null}

          </div>
        </div>
      )}
    </>
  );
}
