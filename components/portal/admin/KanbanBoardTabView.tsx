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


export default function KanbanBoardTabView({ ctx }: { ctx: any }) {
  const { t, isEn, isValidPhoneNumber, getPhoneValidationError, activeTab, setActiveTabState, tickets, setTickets, technicians, setTechnicians, payrollList, setPayrollList, categoryFilter, setCategoryFilter, searchQuery, setSearchQuery, viewMode, setViewMode, isCreateModalOpen, setIsCreateModalOpen, apartmentUnits, setApartmentUnits, newAptCode, setNewAptCode, newResidentName, setNewResidentName, newResidentPhone, setNewResidentPhone, newCategory, setNewCategory, newTicketType, setNewTicketType, newContent, setNewContent, isSubmittingNewTicket, setIsSubmittingNewTicket, isAutoDispatching, setIsAutoDispatching, assigningTicket, setAssigningTicket, selectedTechId, setSelectedTechId, scheduledTimeInput, setScheduledTimeInput, feedbackReplyTicket, setFeedbackReplyTicket, feedbackReplyContent, setFeedbackReplyContent, replyEngineerName, setReplyEngineerName, isGeneratingAiReply, setIsGeneratingAiReply, resolvingTicket, setResolvingTicket, afterImageBase64, setAfterImageBase64, resolutionNotes, setResolutionNotes, isReadingAfterImage, setIsReadingAfterImage, isVerifyingAfterImage, setIsVerifyingAfterImage, allowOverrideVerification, setAllowOverrideVerification, aiVerificationResult, setAiVerificationResult, inspectingTicket, setInspectingTicket, viewingPayrollTech, setViewingPayrollTech, actionSuccessMsg, setActionSuccessMsg, ticketToDelete, setTicketToDelete, isSyncing, setIsSyncing, isAutoResolving, setIsAutoResolving, setActiveTab, feedbackReplyAdminName, handleGenerateAiAdminReply, afterFileInputRef, refreshAllData, handleSyncTickets, handleDeleteTicket, confirmDeleteTicket, handleOneClickAutoDispatch, handleAutoDispatchOne, handleAiAutoResolveSingle, handleAiAutoResolveAll, handleVerifyResolutionImage, handleOpenResolveModal, handleAptCodeChange, handleCreateTicketSubmit, repairCount, feedbackCount, filteredTickets, openTickets, inProgressTickets, resolvedTickets, handleConfirmAdminReply, handleAiAutoAnswerInquiry, handleConfirmAssign, handleApproveAiRecommendation, handleAfterFileChange, handleConfirmResolve, handleRejectResolution, totalFund, totalCompletedMonth, ticketsResource } = ctx;
  return (
    <>
      {activeTab === 'KANBAN' && (
        <div className="space-y-5">
          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0E131B] p-2 border border-[#1E2630]">
            {/* Category Filter Pills (Clean Luxury, No Horiz Scrollbar, No Rainbow Colors) */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider pr-1">
                {t('Phân loại:', 'Filter:')}
              </span>

              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 text-xs transition-colors rounded-none font-medium flex items-center gap-1.5 ${
                  categoryFilter === 'ALL'
                    ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                    : 'bg-[#141B24] text-gray-400 hover:text-white border border-[#222B35]'
                }`}
              >
                <span>{t('Tất Cả', 'All')}</span>
                <span className="font-mono text-[10px] opacity-75">{tickets.length}</span>
              </button>

              <button
                onClick={() => setCategoryFilter('REPAIR')}
                className={`px-3 py-1.5 text-xs transition-colors rounded-none font-medium flex items-center gap-1.5 ${
                  categoryFilter === 'REPAIR'
                    ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                    : 'bg-[#141B24] text-gray-400 hover:text-white border border-[#222B35]'
                }`}
              >
                <Wrench className="w-3 h-3 opacity-80" />
                <span>{t('Sửa Chữa', 'Repairs')}</span>
                <span className="font-mono text-[10px] opacity-75">{repairCount}</span>
              </button>

              <button
                onClick={() => setCategoryFilter('FEEDBACK')}
                className={`px-3 py-1.5 text-xs transition-colors rounded-none font-medium flex items-center gap-1.5 ${
                  categoryFilter === 'FEEDBACK'
                    ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                    : 'bg-[#141B24] text-gray-400 hover:text-white border border-[#222B35]'
                }`}
              >
                <MessageSquare className="w-3 h-3 opacity-80" />
                <span>{t('Phản Ánh & Ý Kiến', 'Feedback & Requests')}</span>
                <span className="font-mono text-[10px] opacity-75">{feedbackCount}</span>
              </button>
            </div>

            {/* Keyword Search Input & View Mode Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Tìm căn hộ, cư dân, KTV...', 'Search apt, resident, tech...')}
                  className="w-full pl-8 pr-7 py-1.5 bg-[#0A0E14] border border-[#222B35] focus:border-[#C5A880] text-xs text-white placeholder-gray-500 rounded-none outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-[#222B35] bg-[#0A0E14] p-0.5 shrink-0">
                <button
                  onClick={() => setViewMode('KANBAN')}
                  className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 rounded-none transition-colors whitespace-nowrap ${
                    viewMode === 'KANBAN'
                      ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={t('Chế độ bảng Kanban', 'Kanban Board View')}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{t('Bảng', 'Board')}</span>
                </button>
                <button
                  onClick={() => setViewMode('LIST')}
                  className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 rounded-none transition-colors whitespace-nowrap ${
                    viewMode === 'LIST'
                      ? 'bg-[#C5A880] text-[#0A0E14] font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={t('Chế độ danh sách / bảng chi tiết', 'Table/List View')}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>{t('Danh Sách', 'List')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Operations Progression Ribbon (Quiet, Luxury, Minimal) */}
          <div className="bg-[#0E131B] border border-[#1E2630] px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-none"></span>
              <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
                {t('Tiến Trình Nghiệp Vụ', 'Operations Pipeline')}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-gray-400">
                <span>1. {t('Tiếp nhận:', 'Intake:')}</span>
                <span className="text-white font-bold">{openTickets.length}</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">/</span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span>2. {t('Hiện trường:', 'In Progress:')}</span>
                <span className="text-amber-400 font-bold">{inProgressTickets.length}</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">/</span>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span>3. {t('Đã nghiệm thu:', 'Closed:')}</span>
                <span className="text-emerald-400 font-bold">{resolvedTickets.length}</span>
              </div>
            </div>
          </div>

          {/* Main Requests View (Kanban Board vs Structured List) */}
          {viewMode === 'KANBAN' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Chờ tiếp nhận */}
            <div className="bg-[#121820] border border-[#222B35] flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 bg-blue-500 shrink-0"></span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-200 whitespace-nowrap">
                    {t('1. Chờ Tiếp Nhận', '1. Pending Assignment')}
                  </span>
                  <span className="px-1.5 py-0.5 bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono text-[10px] font-bold shrink-0">
                    {openTickets.length}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-[#C5A880] bg-[#141B24] border border-[#C5A880]/30 px-2 py-0.5 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-none animate-ping shrink-0"></span>
                  <span>{t('AI Phân Công 24/7', 'AI Auto-Dispatch 24/7')}</span>
                </span>
              </div>

              <div className="p-4 space-y-3.5 flex-1 min-h-[420px] overflow-y-auto flex flex-col justify-start">
                {openTickets.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-16">
                    Không có phiếu nào đang chờ tiếp nhận.
                  </div>
                ) : (
                  openTickets.map((ticket: any) => {
                    const isFeedback = ticket.ticket_type !== 'REPAIR';
                    const isRepair = !isFeedback;

                    return (
                      <div 
                        key={ticket.id} 
                        className="group p-3.5 bg-[#0E131B] border border-[#1E2630] hover:border-[#C5A880]/50 transition-colors space-y-2.5 rounded-none"
                      >
                        {/* Header: ID, Time, Unit & Actions */}
                        <div className="flex items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#C5A880] font-bold">
                              {`#${ticket.id.replace('TICK-', '')}`}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#141B24] border border-[#222B35] text-gray-300">
                              {ticket.apt_code.startsWith('Khu') || ticket.apt_code.startsWith('Block') || ticket.apt_code.startsWith('Tiện') ? ticket.apt_code : `Căn ${ticket.apt_code}`}
                            </span>
                            <button
                              onClick={() => handleDeleteTicket(ticket)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-0.5 transition-opacity"
                              title={t('Xóa phiếu')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Resident Name & Phone */}
                        <div className="text-xs text-gray-300 font-medium flex items-center justify-between">
                          <span className="text-white">{ticket.resident_name}</span>
                          {ticket.resident_phone && (
                            <span className="font-mono text-gray-500 text-[11px]">{ticket.resident_phone}</span>
                          )}
                        </div>

                        {/* Cảnh báo sự vụ nghiêm trọng nếu là Feedback cần BQL trực tiếp */}
                        {isFeedback && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-300 bg-rose-950/50 border border-rose-500/40 px-2 py-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{t('Sự vụ nghiêm trọng - Cần Ban Quản Lý thụ lý trực tiếp')}</span>
                          </div>
                        )}

                        {/* Issue Content & Inline Photo */}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {ticket.content}
                        </p>

                        {ticket.before_image && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <img 
                              src={ticket.before_image} 
                              alt="Before" 
                              className="w-10 h-10 object-cover border border-[#222B35] cursor-pointer hover:border-[#C5A880] transition-colors"
                              onClick={() => setInspectingTicket(ticket)}
                            />
                            <span className="text-[11px] text-gray-500">{t('Ảnh hiện trường')}</span>
                          </div>
                        )}

                        {/* Operational Details (Clean Text Line, Zero Boxes) */}
                        {isRepair && ticket.suggested_technician && (
                          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                            <span className="flex items-center gap-1.5 text-gray-300 truncate">
                              <Sparkles className="w-3 h-3 text-[#C5A880] shrink-0" />
                              <span className="truncate">{t('Gợi ý:')} <strong className="text-white font-medium">{ticket.suggested_technician}</strong></span>
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">ETA 30p</span>
                          </div>
                        )}

                        {isFeedback && (ticket.ai_suggested_reply || ticket.admin_reply) && (
                          <div className="text-[11px] text-gray-400 italic line-clamp-1 pt-0.5">
                            <span className="text-gray-300 not-italic font-medium">{t('Dự thảo:')} </span>"{ticket.admin_reply || ticket.ai_suggested_reply}"
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="pt-2 border-t border-[#1E2630] flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400/80" />
                            <span>{isFeedback ? t('BQL cần thụ lý') : t('Chờ phân công')}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isFeedback ? (
                              <button
                                onClick={() => {
                                  setFeedbackReplyTicket(ticket);
                                  setFeedbackReplyContent(ticket.admin_reply || ticket.ai_suggested_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category, ticket.resident_name, ticket.apt_code));
                                  setReplyEngineerName(ticket.assigned_technician || '');
                                }}
                                className="h-7 px-2.5 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-semibold rounded-none transition-colors flex items-center gap-1 shadow"
                              >
                                <MessageSquare className="w-3 h-3 text-[#0A0E14]" />
                                <span>{t('Phản Hồi / Đáp Lại')}</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {ticket.suggested_technician && (
                                  <button
                                    onClick={() => handleApproveAiRecommendation(ticket)}
                                    className="h-7 px-2.5 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-semibold rounded-none transition-colors flex items-center gap-1"
                                    title={t('Duyệt phân công KTV theo đề xuất của AI')}
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>{t('Duyệt KTV')}</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setAssigningTicket(ticket);
                                    setSelectedTechId(ticket.suggested_technician_id || 'KTV-01');
                                  }}
                                  className="h-7 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-400 hover:text-white text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                                  title={t('Chỉ định hoặc thay đổi thợ KTV phụ trách')}
                                >
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span>{ticket.suggested_technician ? t('Đổi') : t('Chỉ Định')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 2: Đang xử lý */}
            <div className="bg-[#121820] border border-[#222B35] flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-none animate-pulse shrink-0"></span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-white whitespace-nowrap">
                    {t('2. Đang Xử Lý', '2. In Progress')}
                  </span>
                  <span className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold shrink-0">
                    {inProgressTickets.length}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0"></span>
                  <span>{t('Hiện Trường', 'On-Site')}</span>
                </span>
              </div>

              <div className="p-4 space-y-3.5 flex-1 min-h-[420px] overflow-y-auto flex flex-col justify-start">
                {inProgressTickets.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-16">
                    Không có phiếu nào đang xử lý.
                  </div>
                ) : (
                  inProgressTickets.map((ticket: any) => {
                    const isFeedback = ticket.ticket_type !== 'REPAIR';

                    return (
                      <div 
                        key={ticket.id} 
                        className="group p-3.5 bg-[#0E131B] border border-[#1E2630] hover:border-[#C5A880]/50 transition-colors space-y-2.5 rounded-none"
                      >
                        {/* Header: ID, Time, Badge & Actions */}
                        <div className="flex items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#C5A880] font-bold">
                              {`#${ticket.id.replace('TICK-', '')}`}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-[#141B24] text-gray-300 border border-[#222B35] text-[10px] font-mono">
                              {ticket.ai_category || (isFeedback ? 'Ý Kiến' : 'Kỹ Thuật')}
                            </span>
                            <button
                              onClick={() => handleDeleteTicket(ticket)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-0.5 transition-opacity"
                              title={t('Xóa phiếu')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Apartment & Resident Info */}
                        <div className="text-xs text-gray-300 font-medium flex items-center justify-between">
                          <span className="text-white font-semibold">
                            {ticket.apt_code.startsWith('Khu') || ticket.apt_code.startsWith('Block') || ticket.apt_code.startsWith('Tiện') ? ticket.apt_code : `Căn ${ticket.apt_code}`} • {ticket.resident_name}
                          </span>
                          {ticket.resident_phone && (
                            <span className="font-mono text-gray-500 text-[11px] font-normal">{ticket.resident_phone}</span>
                          )}
                        </div>

                        {/* Issue Content */}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {ticket.content}
                        </p>

                        {/* Rework Reason Alert (if previously rejected) */}
                        {ticket.rework_reason && (
                          <div className="text-[11px] text-rose-300 bg-rose-950/50 border border-rose-500/40 p-1.5 flex items-start gap-1.5 leading-relaxed rounded-none">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-rose-400">{t('Yêu Cầu Làm Lại:')} </span>
                              <span>{ticket.rework_reason}</span>
                            </div>
                          </div>
                        )}

                        {/* Operational Status (Clean Line, Zero Boxes) */}
                        {isFeedback ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-0.5">
                            <MessageSquare className="w-3 h-3 text-[#C5A880] shrink-0" />
                            <span className="truncate">{t('BQL CSKH đang kiểm tra & xử lý hiện trường')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                            <span className="flex items-center gap-1.5 text-gray-300 truncate">
                              <Wrench className="w-3 h-3 text-[#C5A880] shrink-0" />
                              <span className="truncate text-white font-medium">{ticket.assigned_technician || t('KTV Chưa Chỉ Định')}</span>
                              {ticket.assigned_technician_phone && (
                                <span className="text-[10px] text-gray-500 font-mono">({ticket.assigned_technician_phone})</span>
                              )}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">{ticket.scheduled_time || 'SLA 45p'}</span>
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="pt-2 border-t border-[#1E2630] flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/40 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0"></span>
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{isFeedback ? t('24h') : t('SLA 45p')}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isFeedback ? (
                              <button
                                onClick={() => {
                                  setFeedbackReplyTicket(ticket);
                                  setFeedbackReplyContent(ticket.admin_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category));
                                  setReplyEngineerName(ticket.assigned_technician || '');
                                }}
                                className="h-7 px-2.5 bg-[#141B24] hover:bg-[#1E2631] border border-[#222B35] text-gray-300 hover:text-white text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                              >
                                <Send className="w-3 h-3 text-[#C5A880]" />
                                <span>{t('Phản Hồi')}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenResolveModal(ticket)}
                                  className="h-7 px-2.5 bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/50 text-[#10B981] text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                                  title={t('BQL nghiệm thu và ghi nhận hồ sơ kỹ thuật')}
                                >
                                  <Check className="w-3.5 h-3.5 shrink-0" />
                                  <span>{t('Nghiệm Thu')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setAssigningTicket(ticket);
                                    setSelectedTechId(ticket.assigned_technician_id || 'KTV-01');
                                  }}
                                  className="h-7 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-400 hover:text-white text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                                  title={t('Đổi KTV')}
                                >
                                  <Users className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span>{t('Đổi')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setFeedbackReplyTicket(ticket);
                                    setFeedbackReplyContent(ticket.admin_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category));
                                    setReplyEngineerName(ticket.assigned_technician || '');
                                  }}
                                  className="h-7 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-400 hover:text-white text-xs font-medium rounded-none transition-colors flex items-center gap-1"
                                  title={t('Ghi chú / phản hồi cư dân')}
                                >
                                  <MessageSquare className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span>{t('Phản Hồi')}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Đã nghiệm thu / Đã đóng */}
            <div className="bg-[#121820] border border-[#222B35] flex flex-col shadow-xl">
              <div className="p-3.5 border-b border-[#222B35] flex items-center justify-between bg-[#161B22]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-none shrink-0"></span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-gray-200 whitespace-nowrap">
                    {t('3. Đã Xử Lý Xong', '3. Audited & Closed')}
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                    {resolvedTickets.length}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{t('Hoàn Tất', 'Completed')}</span>
                </span>
              </div>

              <div className="p-4 space-y-3.5 flex-1 min-h-[420px] overflow-y-auto flex flex-col justify-start">
                {resolvedTickets.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-16">
                    Chưa có phiếu hoàn thành.
                  </div>
                ) : (
                  resolvedTickets.map((ticket: any) => {
                    const isFeedback = ticket.ticket_type !== 'REPAIR';

                    return (
                      <div 
                        key={ticket.id} 
                        className="group p-3.5 bg-[#0E131B] border border-[#1E2630] hover:border-[#C5A880]/50 transition-colors space-y-2.5 rounded-none"
                      >
                        {/* Header: ID, Time, Badge & Actions */}
                        <div className="flex items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#C5A880] font-bold">
                              {`#${ticket.id.replace('TICK-', '')}`}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {ticket.rating ? (
                              <span className="px-1.5 py-0.5 bg-[#141B24] text-amber-400 border border-[#222B35] text-[10px] font-mono flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current text-amber-400" /> {ticket.rating}★
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-mono">
                                {t('Đã Nghiệm Thu')}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteTicket(ticket)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-0.5 transition-opacity"
                              title={t('Xóa phiếu')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Apartment & Resident Info */}
                        <div className="text-xs text-gray-300 font-medium flex items-center justify-between">
                          <span className="text-white font-semibold">
                            {ticket.apt_code.startsWith('Khu') || ticket.apt_code.startsWith('Block') || ticket.apt_code.startsWith('Tiện') ? ticket.apt_code : `Căn ${ticket.apt_code}`} • {ticket.resident_name}
                          </span>
                          {ticket.resident_phone && (
                            <span className="font-mono text-gray-500 text-[11px] font-normal">{ticket.resident_phone}</span>
                          )}
                        </div>

                        {/* Issue Content */}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {ticket.content}
                        </p>

                        {/* Feedback Response Summary (Subtle Line, No Boxes) */}
                        {isFeedback && ticket.admin_reply && (
                          <div className="text-[11px] text-gray-400 italic line-clamp-2 pt-0.5 space-y-0.5">
                            <div className="flex items-center gap-1.5 not-italic font-medium text-xs">
                              {ticket.admin_replied_by?.includes('AI') ? (
                                <span className="text-[#C5A880] flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 bg-[#C5A880]/10 border border-[#C5A880]/30">
                                  <Sparkles className="w-2.5 h-2.5" /> AI Tự Động Giải Quyết
                                </span>
                              ) : (
                                <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                                  <Check className="w-3 h-3" /> BQL Đã Phản Hồi
                                </span>
                              )}
                            </div>
                            <div>"{ticket.admin_reply}"</div>
                          </div>
                        )}

                        {/* Repair Resolution & Visual Inspection (Clean Inline Preview, Zero Boxes) */}
                        {!isFeedback && (ticket.before_image || ticket.after_image || ticket.ai_verification || ticket.resolution_notes) && (
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div className="flex items-center gap-1.5">
                              {ticket.before_image && (
                                <img 
                                  src={ticket.before_image} 
                                  alt="Before" 
                                  className="w-8 h-8 object-cover border border-[#222B35] cursor-pointer hover:border-[#C5A880] transition-colors"
                                  onClick={() => setInspectingTicket(ticket)}
                                  title={t('Trước sửa')}
                                />
                              )}
                              {ticket.after_image && (
                                <img 
                                  src={ticket.after_image} 
                                  alt="After" 
                                  className="w-8 h-8 object-cover border border-[#10B981]/50 cursor-pointer hover:border-[#10B981] transition-colors"
                                  onClick={() => setInspectingTicket(ticket)}
                                  title={t('Sau sửa')}
                                />
                              )}
                              {ticket.resolution_notes && (
                                <span className="text-[11px] text-gray-400 italic line-clamp-1 max-w-[140px]">
                                  "{ticket.resolution_notes}"
                                </span>
                              )}
                            </div>

                            {ticket.ai_verification ? (
                              <span className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>AI {ticket.ai_verification.confidence_score}%</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t('Đã lưu')}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-[#1E2630] flex items-center justify-between text-[11px] text-gray-400">
                          <span className="truncate text-gray-500">
                            {isEn ? 'Tech:' : 'KTV:'} <span className="text-gray-300 font-medium">{ticket.assigned_technician || (isEn ? 'Technician' : 'Kỹ thuật viên')}</span>
                          </span>
                          <button
                            onClick={() => setInspectingTicket(ticket)}
                            className="h-6 px-2.5 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-[#C5A880] text-[10px] font-medium rounded-none transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{t('Biên Bản')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
            /* STRUCTURED TABLE / LIST VIEW */
            <div className="bg-[#121820] border border-[#222B35] shadow-xl overflow-hidden rounded-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#161B22] border-b border-[#222B35] text-[11px] text-gray-400 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Mã Vé & Ngày', 'Ticket ID & Date')}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Căn Hộ & Cư Dân', 'Unit & Resident')}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Phân Loại', 'Category')}</th>
                      <th className="py-3 px-3.5 min-w-[240px] max-w-[320px]">{t('Nội Dung Sự Cố', 'Incident Description')}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Kỹ Thuật Viên', 'Technician')}</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">{t('Tiến Độ', 'Stage & SLA')}</th>
                      <th className="py-3 px-3.5 text-right whitespace-nowrap">{t('Thao Tác BQL', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222B35]/60">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500 italic">
                          {t('Không có yêu cầu nào phù hợp với bộ lọc hiện tại.', 'No service requests match the current filters.')}
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket: any) => {
                        const isFeedback = ticket.ticket_type !== 'REPAIR';

                        return (
                          <tr key={ticket.id} className="hover:bg-[#161B22]/70 transition-colors">
                            <td className="py-3 px-3.5 whitespace-nowrap font-mono">
                              <div className="text-[#C5A880] font-bold">
                                {`#${ticket.id.replace('TICK-', '')}`}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(ticket.created_at).toLocaleDateString('vi-VN')} {new Date(ticket.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="font-semibold text-white">
                                {ticket.apt_code.startsWith('Khu') || ticket.apt_code.startsWith('Block') || ticket.apt_code.startsWith('Tiện') ? ticket.apt_code : `Căn ${ticket.apt_code}`}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {ticket.resident_name} {ticket.resident_phone ? `(${ticket.resident_phone})` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {isFeedback ? (
                                <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-500/60 text-[10px] font-bold">
                                  {t('Phản Ánh')}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-[#0E131B] text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                                  🔧 {ticket.ai_category}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 max-w-[320px]">
                              <p className="line-clamp-2 text-xs text-gray-200 leading-relaxed">
                                {ticket.content}
                              </p>
                              {ticket.before_image && (
                                <button
                                  onClick={() => setInspectingTicket(ticket)}
                                  className="text-[10px] text-[#C5A880] hover:underline mt-0.5 inline-flex items-center gap-1"
                                >
                                  {t('Xem ảnh hiện trường')}
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {ticket.assigned_technician ? (
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{ticket.assigned_technician}</span>
                                  </div>
                                  {ticket.assigned_technician_phone && (
                                    <div className="text-[10px] text-gray-400 font-mono">
                                      {ticket.assigned_technician_phone}
                                    </div>
                                  )}
                                </div>
                              ) : ticket.suggested_technician ? (
                                <div className="text-[11px] text-[#C5A880]">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>AI: {ticket.suggested_technician} ({ticket.suggested_match_score || 95}%)</span>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 italic text-[11px]">{t('Chưa chỉ định')}</span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {ticket.status === 'Open' ? (
                                <span className="px-2 py-0.5 bg-[#141B24] border border-[#222B35] text-blue-300 text-[10px] font-mono">
                                  {t('1. Tiếp Nhận')}
                                </span>
                              ) : ticket.status === 'In_Progress' || ticket.status === 'Assigned' ? (
                                <span className="px-2 py-0.5 bg-[#141B24] border border-[#222B35] text-amber-300 text-[10px] font-mono">
                                  {t('2. Đang Xử Lý')}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] font-mono">
                                  {t('3. Nghiệm Thu')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {ticket.status === 'Open' && (
                                  <>
                                    {isFeedback ? (
                                      <button
                                        onClick={() => {
                                          setFeedbackReplyTicket(ticket);
                                          setFeedbackReplyContent(ticket.admin_reply || ticket.ai_suggested_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category, ticket.resident_name, ticket.apt_code));
                                          setReplyEngineerName(ticket.assigned_technician || '');
                                        }}
                                        className="h-6 px-2.5 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-[11px] font-semibold rounded-none transition-colors flex items-center gap-1"
                                      >
                                        <MessageSquare className="w-3 h-3 text-[#0A0E14]" />
                                        <span>{t('Phản Hồi')}</span>
                                      </button>
                                    ) : (
                                      <>
                                        {ticket.suggested_technician && (
                                          <button
                                            onClick={() => handleApproveAiRecommendation(ticket)}
                                            className="h-6 px-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-[11px] font-semibold rounded-none transition-colors"
                                            title={t('Duyệt KTV')}
                                          >
                                            <Check className="w-3 h-3 inline mr-1 stroke-[2.5]" />
                                            {t('Duyệt KTV')}
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            setAssigningTicket(ticket);
                                            setSelectedTechId(ticket.suggested_technician_id || 'KTV-01');
                                          }}
                                          className="h-6 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-300 hover:text-white text-[11px] rounded-none transition-colors"
                                        >
                                          {t('Chỉ Định')}
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                                {(ticket.status === 'In_Progress' || ticket.status === 'Assigned') && (
                                  <>
                                    <button
                                      onClick={() => handleOpenResolveModal(ticket)}
                                      className="h-6 px-2 bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/50 text-[#10B981] text-[11px] font-medium rounded-none transition-colors"
                                      title={t('BQL nghiệm thu')}
                                    >
                                      <Check className="w-3 h-3 inline mr-1" />
                                      {t('Nghiệm Thu')}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setAssigningTicket(ticket);
                                        setSelectedTechId(ticket.assigned_technician_id || 'KTV-01');
                                      }}
                                      className="h-6 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-300 hover:text-white text-[11px] rounded-none transition-colors"
                                    >
                                      {t('Đổi KTV')}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setFeedbackReplyTicket(ticket);
                                        setFeedbackReplyContent(ticket.admin_reply || generateSuggestedAdminReply(ticket.content, ticket.ai_category));
                                        setReplyEngineerName(ticket.assigned_technician || '');
                                      }}
                                      className="h-6 px-2 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-gray-300 hover:text-white text-[11px] rounded-none transition-colors"
                                    >
                                      {t('Phản Hồi')}
                                    </button>
                                  </>
                                )}
                                {ticket.status === 'Resolved' && (
                                  <button
                                    onClick={() => setInspectingTicket(ticket)}
                                    className="h-6 px-2.5 bg-transparent hover:bg-[#141B24] border border-[#222B35] hover:border-[#C5A880] text-[#C5A880] text-[11px] font-medium rounded-none transition-colors flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{t('Hồ Sơ')}</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTicket(ticket)}
                                  className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                                  title={t('Xóa phiếu')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </>
  );
}
