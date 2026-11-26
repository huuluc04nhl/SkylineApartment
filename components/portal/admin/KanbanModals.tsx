'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  User, 
  Phone, 
  Wrench, 
  CheckCircle2, 
  ArrowRight, 
  Eye, 
  Sparkles, 
  Filter, 
  Upload, 
  Camera, 
  ShieldCheck,
  Star,
  DollarSign,
  Users,
  Award,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Check,
  X,
  Printer,
  ChevronRight,
  TrendingUp,
  FileText,
  BadgeCheck,
  RefreshCw,
  SlidersHorizontal,
  PhoneCall,
  Trash2,
  MessageSquare,
  HelpCircle,
  Send,
  MessageCircle,
  Plus,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  getTickets, 
  getTechnicians, 
  syncTicketsWithServer,
  deleteTicketAsync,
  createTicketAsync,
  assignTechnicianToTicket, 
  resolveTicket, 
  rejectTicketResolution,
  adminRespondToTicket,
  aiAnswerTicket,
  getTechnicianPayroll, 
  ExtendedServiceRequest, 
  TechnicianProfile,
  TechnicianPayrollSummary 
} from '@/lib/ticketStore';
import { getApartmentUnits, ApartmentUnit } from '@/lib/apartmentStore';
import { 
  isAutoDispatchEnabled, 
  autoDispatchSingleTicket, 
  autoDispatchAllPendingTickets,
  autoResolveSingleTicketWithAI,
  autoResolveAllInProgressTicketsWithAI,
  generateAiResolutionNotes,
  generateAiInspectionImage
} from '@/lib/aiDispatchService';
import { 
  generateSuggestedAdminReply, 
  classifyTicket 
} from '@/lib/ticketClassification';
import { fileToBase64 } from '@/lib/imageUtils';
import { useLanguage } from '@/lib/languageContext';
import { toast } from '@/components/ui/Toast';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';
import { ResourceSkeleton, ResourceError, ResourceEmpty } from '@/components/ui/ResourceState';
import ConfirmDeleteModal from '@/components/portal/shared/ConfirmDeleteModal';
import { cleanPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from '@/lib/validationUtils';


export default function KanbanModals({ ctx }: { ctx: any }) {
  const { t, isEn, isValidPhoneNumber, getPhoneValidationError, activeTab, setActiveTabState, tickets, setTickets, technicians, setTechnicians, payrollList, setPayrollList, categoryFilter, setCategoryFilter, searchQuery, setSearchQuery, viewMode, setViewMode, isCreateModalOpen, setIsCreateModalOpen, apartmentUnits, setApartmentUnits, newAptCode, setNewAptCode, newResidentName, setNewResidentName, newResidentPhone, setNewResidentPhone, newCategory, setNewCategory, newTicketType, setNewTicketType, newContent, setNewContent, isSubmittingNewTicket, setIsSubmittingNewTicket, isAutoDispatching, setIsAutoDispatching, assigningTicket, setAssigningTicket, selectedTechId, setSelectedTechId, scheduledTimeInput, setScheduledTimeInput, feedbackReplyTicket, setFeedbackReplyTicket, feedbackReplyContent, setFeedbackReplyContent, replyEngineerName, setReplyEngineerName, isGeneratingAiReply, setIsGeneratingAiReply, resolvingTicket, setResolvingTicket, afterImageBase64, setAfterImageBase64, resolutionNotes, setResolutionNotes, isReadingAfterImage, setIsReadingAfterImage, isVerifyingAfterImage, setIsVerifyingAfterImage, allowOverrideVerification, setAllowOverrideVerification, aiVerificationResult, setAiVerificationResult, inspectingTicket, setInspectingTicket, viewingPayrollTech, setViewingPayrollTech, actionSuccessMsg, setActionSuccessMsg, ticketToDelete, setTicketToDelete, isSyncing, setIsSyncing, isAutoResolving, setIsAutoResolving, setActiveTab, feedbackReplyAdminName, handleGenerateAiAdminReply, afterFileInputRef, refreshAllData, handleSyncTickets, handleDeleteTicket, confirmDeleteTicket, handleOneClickAutoDispatch, handleAutoDispatchOne, handleAiAutoResolveSingle, handleAiAutoResolveAll, handleVerifyResolutionImage, handleOpenResolveModal, handleAptCodeChange, handleCreateTicketSubmit, repairCount, feedbackCount, filteredTickets, openTickets, inProgressTickets, resolvedTickets, handleConfirmAdminReply, handleAiAutoAnswerInquiry, handleConfirmAssign, handleApproveAiRecommendation, handleAfterFileChange, handleConfirmResolve, handleRejectResolution, totalFund, totalCompletedMonth, ticketsResource } = ctx;
  return (
    <>
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTicketSubmit} className="bg-[#0E131B] border border-[#C5A880]/60 max-w-xl w-full p-6 space-y-4 shadow-2xl rounded-none animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" /> Hotline 1900 8899 • Trực Ban Kỹ Thuật
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  {t('Tiếp Nhận Sự Cố & Yêu Cầu Kỹ Thuật', 'Incident Intake & Maintenance Request')}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Căn hộ */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-semibold flex items-center justify-between">
                <span>{t('Căn Hộ Báo Sự Cố:', 'Apartment Unit:')}</span>
                <span className="text-[10px] text-[#C5A880] font-mono">*{isEn ? ' Auto-detected resident profile' : ' Tự động nhận diện hồ sơ cư dân'}</span>
              </label>
              <select
                value={newAptCode}
                onChange={(e) => handleAptCodeChange(e.target.value)}
                className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2.5 rounded-none outline-none font-mono"
              >
                {apartmentUnits.length > 0 ? (
                  apartmentUnits.map((u: any) => (
                    <option key={u.code} value={u.code}>
                      Căn {u.code} — Tòa {u.towerName} {u.owner?.name ? `(${u.owner.name})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="CH-06">{isEn ? 'Apt CH-06 — Tower BS-07' : 'Căn CH-06 — Tòa BS-07'}</option>
                )}
              </select>
            </div>

            {/* Thông tin người báo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('Họ Tên Cư Dân / Người Báo:', 'Resident Name:')}</label>
                <input
                  type="text"
                  value={newResidentName}
                  onChange={(e) => setNewResidentName(e.target.value)}
                  placeholder={isEn ? 'Nguyen Van A' : 'Nguyễn Văn A'}
                  className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2 rounded-none outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('Số Điện Thoại Liên Hệ (10 số):', 'Phone Number (10 digits):')}</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={newResidentPhone}
                  onChange={(e) => setNewResidentPhone(cleanPhoneNumber(e.target.value))}
                  placeholder="0912345678"
                  className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2 rounded-none outline-none font-mono"
                />
                {newResidentPhone && newResidentPhone !== '1900 8899' && !isValidPhoneNumber(newResidentPhone) && (
                  <span className="text-[10px] text-amber-400 font-mono block">
                    {getPhoneValidationError(newResidentPhone)}
                  </span>
                )}
              </div>
            </div>

            {/* Mục đích & Hạng mục */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('Mục Đích Yêu Cầu:', 'Request Purpose:')}</label>
                <select
                  value={newTicketType}
                  onChange={(e) => setNewTicketType(e.target.value as any)}
                  className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2 rounded-none outline-none"
                >
                  <option value="REPAIR">🔧 {t('Sự Cố Kỹ Thuật (Cần KTV Sửa)', 'Technical Repair')}</option>
                  <option value="FEEDBACK">📢 {t('Phản Ánh & Ý Kiến (BQL Đáp Lại)', 'Resident Feedback')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('Hạng Mục Kỹ Thuật:', 'Category:')}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2 rounded-none outline-none"
                >
                  <option value="Điện">⚡ {isEn ? 'Electrical / Appliances' : 'Điện dân dụng / Thiết bị'}</option>
                  <option value="Nước">💧 {isEn ? 'Plumbing / Sanitaries' : 'Cấp thoát nước / Thiết bị vệ sinh'}</option>
                  <option value="Vệ sinh">🧹 {isEn ? 'Housekeeping / Environment' : 'Vệ sinh hành lang / Môi trường'}</option>
                  <option value="An ninh">🛡️ {isEn ? 'Security / Keycard Access' : 'An ninh / Thẻ từ ra vào'}</option>
                  <option value="Khác">📦 {isEn ? 'Other / Building Infrastructure' : 'Khác / Cơ sở hạ tầng'}</option>
                </select>
              </div>
            </div>

            {/* Nội dung chi tiết */}
            <div className="space-y-1">
              <label className="text-xs text-gray-300 font-semibold">{t('Nội Dung Mô Tả Sự Cố / Hiện Trường:', 'Incident Description:')}</label>
              <textarea
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={t('Ví dụ: Cư dân báo rò rỉ van cấp nước máy giặt tràn ra sàn ban công, cần thợ kiểm tra gấp...', 'e.g., Water valve leaking, urgent check needed...')}
                className="w-full bg-[#141B24] border border-[#222B35] focus:border-[#C5A880] text-xs text-white p-2.5 rounded-none outline-none leading-relaxed"
                required
              />
            </div>

            {/* AI Assistant Info */}
            <div className="p-3 bg-[#141B24] border border-[#C5A880]/30 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="text-[11px] text-gray-300 leading-relaxed">
                <span className="font-semibold text-[#C5A880]">{t('Cơ Chế Phân Bổ AI Tự Động:')}</span>{' '}
                {t('Phiếu sẽ tức thì được đưa vào cột "1. Chờ Tiếp Nhận" kèm phân tích chấm điểm KTV tối ưu. Ban Quản Lý chỉ cần 1 chạm duyệt đề xuất hoặc linh hoạt chỉ định thợ khác.')}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-gray-700 text-xs text-gray-300 hover:text-white rounded-none"
              >
                {t('Hủy', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmittingNewTicket}
                className="px-5 py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5 rounded-none disabled:opacity-50"
              >
                <Plus className="w-4 h-4 text-[#0A0E14] stroke-[2.5]" />
                <span>{isSubmittingNewTicket ? t('Đang Tiếp Nhận...', 'Submitting...') : t('Tiếp Nhận & Đưa Vào Hàng Đợi', 'Confirm & Queue Incident')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PHÂN CÔNG KỸ THUẬT VIÊN                                         */}
      {/* ========================================================================= */}
      {assigningTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmAssign} className="bg-[#121820] border border-[#C5A880] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C5A880]" />
                Phân Công Kỹ Thuật Viên Xử Lý Phiếu #{assigningTicket.id}
              </h3>
              <button 
                type="button"
                onClick={() => setAssigningTicket(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#161B22] border border-[#222B35] text-xs space-y-1.5">
              <div><strong>{isEn ? 'Apartment:' : 'Căn hộ:'}</strong> <span className="text-[#C5A880] font-bold">{isEn ? 'Unit' : 'Căn'} {assigningTicket.apt_code} ({assigningTicket.resident_name})</span></div>
              <div><strong>{isEn ? 'Description:' : 'Nội dung:'}</strong> <span className="text-gray-200">{assigningTicket.content}</span></div>
              <div><strong>{isEn ? 'Category:' : 'Hạng mục:'}</strong> <span className="text-amber-400 font-semibold">{assigningTicket.ai_category}</span></div>
            </div>

            {/* Select Technician */}
            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-semibold">{isEn ? 'Select On-Duty Technician:' : 'Chọn Kỹ Thuật Viên Phụ Trách Trực Ca:'}</label>
              <div className="space-y-2">
                {technicians.map((tech: any) => (
                  <label
                    key={tech.id}
                    className={`p-3 border flex items-center justify-between cursor-pointer transition-all ${
                      selectedTechId === tech.id
                        ? 'border-[#C5A880] bg-[#1C2533]'
                        : 'border-[#222B35] hover:border-gray-600 bg-[#161B22]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="tech"
                        checked={selectedTechId === tech.id}
                        onChange={() => setSelectedTechId(tech.id)}
                        className="accent-[#C5A880]"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{tech.name} ({tech.id})</div>
                        <div className="text-[10px] text-gray-400">{isEn ? 'Specialty:' : 'Chuyên môn:'} {tech.specialty} • {isEn ? 'Phone:' : 'SĐT:'} {tech.phone}</div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-bold ${
                      tech.status === 'AVAILABLE' 
                        ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/60' 
                        : 'text-amber-400 bg-amber-950/80 border border-amber-500/60'
                    }`}>
                      {tech.status === 'AVAILABLE' ? 'Đang Rảnh' : 'Đang Xử Lý Ca'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-semibold">{isEn ? 'Scheduled Arrival Window:' : 'Thời Gian Hẹn Cư Dân Có Mặt:'}</label>
              <input
                type="text"
                value={scheduledTimeInput}
                onChange={(e) => setScheduledTimeInput(e.target.value)}
                placeholder={isEn ? 'e.g. Arriving within 20 mins...' : 'VD: Có mặt trong vòng 20 phút...'}
                className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-2.5 focus:outline-none focus:border-[#C5A880]"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => setAssigningTicket(null)}
                className="px-4 py-2 border border-gray-700 text-xs text-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
              >
                Xác Nhận & Báo Cư Dân
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NGHIỆM THU & TẢI ẢNH HOÀN TẤT                                    */}
      {/* ========================================================================= */}
      {resolvingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <form 
            onSubmit={handleConfirmResolve} 
            className="bg-[#121820] border border-[#C5A880] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl animate-fadeIn rounded-none"
          >
            {/* Modal Header (Fixed) */}
            <div className="flex items-center justify-between border-b border-[#222B35] px-5 py-3.5 shrink-0 bg-[#0E131B]">
              <h3 className="font-serif text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{isEn ? 'Accept & Close Ticket #' : 'Nghiệm Thu & Đóng Phiếu #'}{resolvingTicket.id}</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setResolvingTicket(null);
                  setAllowOverrideVerification(false);
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto px-5 py-3.5 space-y-3 flex-1 text-xs">
              {/* Ticket Info Compact */}
              <div className="p-2.5 bg-[#161B22] border border-[#222B35] space-y-1 text-xs leading-relaxed rounded-none">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span>{isEn ? 'Apartment:' : 'Căn hộ:'} <strong className="text-white">{isEn ? 'Unit' : 'Căn'} {resolvingTicket.apt_code} ({resolvingTicket.resident_name})</strong></span>
                  <span className="text-gray-400 font-mono text-[11px]">KTV: <strong className="text-[#C5A880]">{resolvingTicket.assigned_technician}</strong></span>
                </div>
                <div className="text-gray-400 line-clamp-2">
                  <span className="text-gray-500">{isEn ? 'Description:' : 'Nội dung:'}</span> {resolvingTicket.content}
                </div>
              </div>

              {/* Upload After Image */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 font-semibold flex items-center justify-between">
                  <span>{isEn ? 'Upload Acceptance Photo:' : 'Tải Ảnh Nghiệm Thu:'}</span>
                  <span className="text-[10px] text-gray-500 font-mono">*{isEn ? ' Sent to resident' : ' Gửi cư dân'}</span>
                </label>

                <input
                  type="file"
                  ref={afterFileInputRef}
                  onChange={handleAfterFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => afterFileInputRef.current?.click()}
                    disabled={isReadingAfterImage}
                    className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-300 hover:text-white text-xs flex items-center gap-2 transition-colors rounded-none"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#C5A880]" />
                    {isReadingAfterImage ? 'Đang nạp ảnh...' : afterImageBase64 ? 'Đổi Ảnh Nghiệm Thu' : 'Chụp / Chọn Ảnh Sửa Xong'}
                  </button>

                  {afterImageBase64 ? (
                    <div className="flex items-center gap-2">
                      <img 
                        src={afterImageBase64} 
                        alt="After Preview" 
                        className="w-8 h-8 object-cover border border-emerald-500"
                      />
                      <span className="text-xs text-emerald-400 font-medium">{isEn ? 'Photo loaded ✓' : 'Đã nạp ảnh ✓'}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-400 font-medium">*{isEn ? ' Photo after repair required' : ' Cần ảnh chụp sau sửa'}</span>
                  )}
                </div>
              </div>

              {/* Resolution Notes with AI recognition badge */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-300 font-semibold">{isEn ? 'Handover Technical Notes:' : 'Ghi Chú Kỹ Thuật Khi Bàn Giao:'}</label>
                  <span className="text-[10px] text-[#C5A880] font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#C5A880]" /> Đã tự động nhận diện
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={isEn ? 'e.g. Replaced flush valve rubber seal, tested water pressure at 2.5 bar...' : 'VD: Đã thay gioăng cao su van xả, kiểm tra áp lực nước 2.5 bar ổn định...'}
                  className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-2.5 focus:outline-none focus:border-[#C5A880] rounded-none resize-none leading-relaxed"
                  required
                />
              </div>

              {/* AI Verification Loading */}
              {isVerifyingAfterImage && (
                <div className="p-2.5 bg-[#0E131B] border border-[#C5A880]/40 text-xs flex items-center gap-2.5 text-[#C5A880] rounded-none">
                  <RefreshCw className="w-4 h-4 text-[#C5A880] animate-spin shrink-0" />
                  <div>
                    <div className="font-semibold text-[#C5A880]">{isEn ? 'AI Verifying Acceptance Photo...' : 'AI Đang Thẩm Định Ảnh Nghiệm Thu...'}</div>
                    <div className="text-[10px] text-gray-400">{isEn ? 'Cross-checking scene before & after repair' : 'Đối chiếu hiện trường trước & sau sửa'}</div>
                  </div>
                </div>
              )}

              {/* AI Verification Status Card (Unified Anti-Slop, No Nested Duplicate Boxes) */}
              {!isVerifyingAfterImage && aiVerificationResult && (
                <div className={`p-2.5 border text-xs space-y-1.5 rounded-none ${
                  aiVerificationResult.status === 'VERIFIED'
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                    : aiVerificationResult.status === 'SUSPICIOUS'
                      ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                      : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {aiVerificationResult.status === 'VERIFIED' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">✓ {isEn ? 'AI Verified: Valid photo' : 'AI Thẩm Định: Ảnh Đạt Chuẩn'} ({aiVerificationResult.confidence_score}%)</span>
                        </>
                      ) : aiVerificationResult.status === 'SUSPICIOUS' ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-rose-300">⚠️ {isEn ? 'AI Warning: Photo does not match' : 'Cảnh Báo AI: Ảnh Không Khớp'} ({aiVerificationResult.confidence_score}%)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-amber-300">⏳ {isEn ? 'AI Note: Incomplete repair' : 'AI: Chưa Khắc Phục Triệt Để'} ({aiVerificationResult.confidence_score}%)</span>
                        </>
                      )}
                    </span>
                    {afterImageBase64 && (
                      <button
                        type="button"
                        onClick={() => handleVerifyResolutionImage(afterImageBase64, resolvingTicket, resolutionNotes)}
                        className="text-[10px] text-gray-400 hover:text-white underline"
                      >
                        Thẩm định lại
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] font-medium leading-relaxed">
                    {aiVerificationResult.verification_title}
                  </div>
                  {aiVerificationResult.verification_detail && (
                    <div className="text-[10px] text-gray-300 leading-relaxed">
                      {aiVerificationResult.verification_detail}
                    </div>
                  )}
                  {aiVerificationResult.risk_warning && (
                    <div className="text-[10px] bg-rose-950/70 border border-rose-500/40 p-1.5 text-rose-200 font-medium rounded-none">
                      Rủi ro: {aiVerificationResult.risk_warning}
                    </div>
                  )}

                  {/* Manual Override Option inside AI Card */}
                  {(aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE') && (
                    <div className="pt-2 border-t border-rose-500/30 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-amber-300 hover:text-amber-200 select-none">
                        <input
                          type="checkbox"
                          checked={allowOverrideVerification}
                          onChange={(e) => setAllowOverrideVerification(e.target.checked)}
                          className="rounded-none bg-[#0E131B] border-gray-600 text-[#C5A880] focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>{isEn ? 'I have inspected on site, approving exception with responsibility' : 'Tôi đã kiểm tra thực tế, chịu trách nhiệm duyệt ngoại lệ'}</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer (Sticky Bottom, Never Cut Off) */}
            <div className="border-t border-[#222B35] px-5 py-3 bg-[#0E131B] shrink-0 flex items-center justify-between gap-2">
              <div>
                {aiVerificationResult && (aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE') && (
                  <button
                    type="button"
                    onClick={handleRejectResolution}
                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-none transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isEn ? 'Reject & Request Rework' : 'Từ Chối & Yêu Cầu Sửa Lại'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResolvingTicket(null);
                    setAllowOverrideVerification(false);
                  }}
                  className="px-3.5 py-1.5 border border-gray-700 text-xs text-gray-300 hover:text-white rounded-none transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={Boolean(
                    isVerifyingAfterImage ||
                    !afterImageBase64 ||
                    (aiVerificationResult && (aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE') && !allowOverrideVerification)
                  )}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none transition-colors shadow ${
                    (aiVerificationResult && (aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE') && !allowOverrideVerification) || isVerifyingAfterImage || !afterImageBase64
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400/40 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  Xác Nhận Nghiệm Thu
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XEM CHI TIẾT PHIẾU LƯƠNG KỸ THUẬT VIÊN                           */}
      {/* ========================================================================= */}
      {viewingPayrollTech && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1117] border border-[#C5A880] max-w-xl w-full p-6 text-white space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <span className="text-[10px] text-[#C5A880] font-mono uppercase font-bold tracking-wider">{isEn ? 'PROPERTY MANAGEMENT BOARD' : 'BAN QUẢN LÝ CHUNG CƯ'}</span>
                <h3 className="font-serif text-lg font-bold text-white">{isEn ? 'Technician Remuneration Slip' : 'Phiếu Thù Lao Kỹ Thuật Viên'}</h3>
              </div>
              <button onClick={() => setViewingPayrollTech(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2 text-xs">
              <div className="flex justify-between">
                <span>{isEn ? 'Full name:' : 'Họ và tên:'}</span>
                <strong className="text-white text-sm">{viewingPayrollTech.technician.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>{isEn ? 'Technician ID / Specialty:' : 'Mã số KTV / Chuyên môn:'}</span>
                <span className="font-mono text-[#C5A880]">{viewingPayrollTech.technician.id} • {viewingPayrollTech.technician.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span>{isEn ? 'Phone number:' : 'Số điện thoại:'}</span>
                <span className="font-mono text-gray-300">{viewingPayrollTech.technician.phone}</span>
              </div>
              <div className="flex justify-between">
                <span>{isEn ? 'Average resident rating:' : 'Đánh giá trung bình cư dân:'}</span>
                <span className="text-yellow-400 font-bold">{viewingPayrollTech.averageRating} ⭐ ({viewingPayrollTech.fiveStarCount} ca 5 sao)</span>
              </div>
            </div>

            {/* Breakdown lines */}
            <div className="space-y-2 text-xs border-t border-b border-[#222B35] py-3">
              <div className="flex justify-between text-gray-300">
                <span>{isEn ? '1. Monthly base salary:' : '1. Lương cứng cơ bản tháng:'}</span>
                <span className="font-mono">{viewingPayrollTech.baseSalary.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>{isEn ? `2. Completed job pay (${viewingPayrollTech.completedTicketsCount} jobs × ${viewingPayrollTech.technician.payPerTicket.toLocaleString('en-US')} VND):` : `2. Tiền công theo ca hoàn tất (${viewingPayrollTech.completedTicketsCount} ca × ${viewingPayrollTech.technician.payPerTicket.toLocaleString('vi-VN')}đ):`}</span>
                <span className="font-mono text-emerald-400">+{viewingPayrollTech.ticketBonusTotal.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>{isEn ? `3. Resident 5⭐ bonus (${viewingPayrollTech.fiveStarCount} jobs × ${viewingPayrollTech.technician.bonusPerFiveStar.toLocaleString('en-US')} VND):` : `3. Tiền thưởng cư dân chấm 5⭐ (${viewingPayrollTech.fiveStarCount} ca × ${viewingPayrollTech.technician.bonusPerFiveStar.toLocaleString('vi-VN')}đ):`}</span>
                <span className="font-mono text-yellow-400">+{viewingPayrollTech.fiveStarBonusTotal.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-[#222B35] text-sm">
                <span className="font-bold text-white">{isEn ? 'TOTAL NET EARNED THIS MONTH:' : 'TỔNG THỰC LĨNH THÁNG NÀY:'}</span>
                <span className="font-bold font-mono text-base text-[#C5A880]">
                  {viewingPayrollTech.totalIncome.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{isEn ? 'Confirmed:' : 'Xác nhận:'} <strong>{isEn ? 'Skyline Property Management' : 'Ban Quản Lý Chung Cư'}</strong></span>
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-[#C5A880] text-[#0D1117] text-xs font-bold uppercase tracking-wider hover:bg-white"
              >
                In Phiếu Chi Lương
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: XEM ẢNH HIỆN TRƯỜNG CỦA PHIẾU                                    */}
      {/* ========================================================================= */}
      {inspectingTicket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#C5A880]" />
                <h3 className="font-serif text-base font-bold text-white">
                  Ảnh Hiện Trường Phiếu #{inspectingTicket.id} - Căn {inspectingTicket.apt_code}
                </h3>
              </div>
              <button onClick={() => setInspectingTicket(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-gray-300">
                <strong>{isEn ? 'Resident note:' : 'Mô tả cư dân:'}</strong> {inspectingTicket.content}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inspectingTicket.before_image && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-red-400 font-semibold">{isEn ? 'Initial scene photo:' : 'Ảnh hiện trường lúc báo:'}</span>
                    <img 
                      src={inspectingTicket.before_image} 
                      alt={isEn ? 'Initial scene' : 'Hiện trường'} 
                      className="w-full h-56 object-cover border border-red-500/50"
                    />
                  </div>
                )}

                {inspectingTicket.after_image && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-emerald-400 font-semibold">{isEn ? 'Acceptance photo after repair:' : 'Ảnh nghiệm thu sau khi sửa:'}</span>
                    <img 
                      src={inspectingTicket.after_image} 
                      alt={isEn ? 'Acceptance photo' : 'Nghiệm thu'} 
                      className="w-full h-56 object-cover border border-emerald-500/50"
                    />
                  </div>
                )}
              </div>

              {/* AI Verification Report */}
              {inspectingTicket.ai_verification && (
                <div className={`p-3 border text-xs space-y-1.5 ${
                  inspectingTicket.ai_verification.status === 'VERIFIED'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                    : inspectingTicket.ai_verification.status === 'SUSPICIOUS'
                      ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                      : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {inspectingTicket.ai_verification.status === 'VERIFIED' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">✓ {isEn ? 'AI Verified: Valid photo' : 'AI Thẩm Định: Ảnh Đạt Chuẩn'} ({inspectingTicket.ai_verification.confidence_score}%)</span>
                        </>
                      ) : inspectingTicket.ai_verification.status === 'SUSPICIOUS' ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-rose-300">⚠️ {isEn ? 'AI Warning: Suspicious scene mismatch' : 'CẢNH BÁO AI: Ảnh Nghi Ngờ Không Khớp Hiện Trường'} ({inspectingTicket.ai_verification.confidence_score}%)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-amber-300">⏳ {isEn ? 'AI Note: Issue not completely fixed' : 'AI Nhận Định: Chưa Khắc Phục Triệt Để'} ({inspectingTicket.ai_verification.confidence_score}%)</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">BQL Audit System</span>
                  </div>
                  <div className="text-[11px] font-medium leading-relaxed">
                    {inspectingTicket.ai_verification.verification_title}
                  </div>
                  {inspectingTicket.ai_verification.verification_detail && (
                    <div className="text-[10px] text-gray-300 leading-relaxed">
                      {inspectingTicket.ai_verification.verification_detail}
                    </div>
                  )}
                  {inspectingTicket.ai_verification.risk_warning && (
                    <div className="text-[10px] bg-rose-950/80 border border-rose-500/50 p-2 text-rose-200 font-semibold">
                      Lưu ý rủi ro: {inspectingTicket.ai_verification.risk_warning}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#222B35]">
              <button 
                onClick={() => setInspectingTicket(null)}
                className="px-4 py-1.5 bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: BAN QUẢN LÝ PHẢN HỒI Ý KIẾN / KHIẾU NẠI CƯ DÂN                  */}
      {/* ========================================================================= */}
      {feedbackReplyTicket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-xl w-full p-6 text-white space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-400" />
                <h3 className="font-serif text-base font-bold text-white">
                  Phản Hồi Chính Thức Từ Ban Quản Lý
                </h3>
              </div>
              <button 
                onClick={() => setFeedbackReplyTicket(null)} 
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#161B22] border border-[#222B35] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">{isEn ? 'Ticket ID:' : 'Mã yêu cầu:'}</span>
                <strong className="text-[#C5A880] font-mono">
                  {`#${feedbackReplyTicket.id}`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isEn ? 'Resident:' : 'Cư dân:'}</span>
                <span className="text-white font-semibold">{feedbackReplyTicket.resident_name} • {isEn ? 'Unit' : 'Căn'} {feedbackReplyTicket.apt_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isEn ? 'Category:' : 'Hạng mục:'}</span>
                <span className="text-rose-300 font-bold">{feedbackReplyTicket.ai_category || (isEn ? 'Service Feedback' : 'Phản ánh dịch vụ')}</span>
              </div>
              <div className="pt-1 text-gray-300 border-t border-[#222B35]">
                <span className="text-gray-400 font-medium">{isEn ? 'Feedback content:' : 'Nội dung phản ánh:'}</span> "{feedbackReplyTicket.content}"
              </div>
            </div>

            {/* AI Assistant Suggested Draft */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs text-gray-300 font-semibold flex-shrink-0">{isEn ? 'Response to resident:' : 'Nội dung phản hồi cư dân:'}</label>
              <button
                type="button"
                onClick={handleGenerateAiAdminReply}
                disabled={isGeneratingAiReply}
                className="text-[11px] px-2.5 py-1 bg-[#141B24] border border-[#C5A880]/40 hover:border-[#C5A880] text-[#C5A880] hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0 rounded-none"
                title={isEn ? 'Gemini AI crafts intelligent responses tailored to request context' : 'AI Gemini soạn thảo phản hồi thông minh, phù hợp ngữ cảnh từng yêu cầu cụ thể'}
              >
                {isGeneratingAiReply ? (
                  <><RefreshCw className="w-3.5 h-3.5 text-[#C5A880] animate-spin" /><span>{isEn ? 'Drafting...' : 'Đang soạn...'}</span></>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /><span>{isEn ? 'AI Smart Drafting' : 'AI Soạn Thảo Thông Minh'}</span></>
                )}
              </button>
            </div>

            <form onSubmit={handleConfirmAdminReply} className="space-y-4">
              <textarea
                rows={5}
                value={feedbackReplyContent}
                onChange={(e) => setFeedbackReplyContent(e.target.value)}
                placeholder={isEn ? 'Enter response, acknowledgment, or resolution plan from Management...' : 'Nhập nội dung phản hồi, xin lỗi hoặc giải pháp xử lý từ BQL...'}
                className="w-full bg-[#161B22] border border-[#2D3748] text-xs text-white p-3 focus:outline-none focus:border-[#C5A880] leading-relaxed rounded-none"
                required
              />

              {/* Kỹ thuật viên xử lý (engineername) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isEn ? 'Assigned technician' : 'KTV phụ trách'}</span>
                  <span className="text-[10px] text-gray-500 font-normal italic">({isEn ? 'optional' : 'tuỳ chọn'})</span>
                </label>
                <div className="flex gap-2 items-stretch">
                  {technicians.length > 0 && (
                    <select
                      value={replyEngineerName}
                      onChange={(e) => setReplyEngineerName(e.target.value)}
                      className="bg-[#161B22] border border-[#2D3748] text-xs text-gray-300 px-2 py-2 focus:outline-none focus:border-[#C5A880] min-w-0 w-[160px] flex-shrink-0 rounded-none"
                    >
                      <option value="">{isEn ? '-- Select Technician --' : '-- Chọn KTV --'}</option>
                      {technicians.map((k: any) => (
                        <option key={k.id} value={k.name}>{k.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={replyEngineerName}
                    onChange={(e) => setReplyEngineerName(e.target.value)}
                    placeholder={isEn ? 'Or type technician name manually...' : 'Hoặc nhập tên KTV thủ công...'}
                    className="flex-1 min-w-0 bg-[#161B22] border border-[#2D3748] text-xs text-white px-3 py-2 focus:outline-none focus:border-[#C5A880] rounded-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-gray-400 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex-shrink-0">{isEn ? 'Signing department:' : 'Đơn vị ký duyệt:'}</span>
                  <div className="px-2.5 py-1 bg-[#161B22] border border-[#2D3748] text-white font-medium flex items-center gap-1.5 select-none flex-shrink-0 rounded-none">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span className="whitespace-nowrap">{isEn ? 'Skyline Property Management Office' : 'Ban Quản Lý Chung Cư Skyline'}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold whitespace-nowrap">{isEn ? '(Official)' : '(Chính thức)'}</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 italic">*{isEn ? ' Digital signature is automatically attached upon sending' : ' Chữ ký số tự động gắn kèm khi gửi văn bản'}</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setFeedbackReplyTicket(null)}
                  className="px-4 py-2 border border-gray-700 text-xs text-gray-300 hover:text-white rounded-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/70 text-rose-200 text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5 rounded-none"
                >
                  <Send className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isEn ? 'Send Response to Resident' : 'Gửi Phản Hồi Cho Cư Dân'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
