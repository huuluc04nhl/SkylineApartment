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


export default function KanbanPayrollTab({ ctx }: { ctx: any }) {
  const { t, isEn, isValidPhoneNumber, getPhoneValidationError, activeTab, setActiveTabState, tickets, setTickets, technicians, setTechnicians, payrollList, setPayrollList, categoryFilter, setCategoryFilter, searchQuery, setSearchQuery, viewMode, setViewMode, isCreateModalOpen, setIsCreateModalOpen, apartmentUnits, setApartmentUnits, newAptCode, setNewAptCode, newResidentName, setNewResidentName, newResidentPhone, setNewResidentPhone, newCategory, setNewCategory, newTicketType, setNewTicketType, newContent, setNewContent, isSubmittingNewTicket, setIsSubmittingNewTicket, isAutoDispatching, setIsAutoDispatching, assigningTicket, setAssigningTicket, selectedTechId, setSelectedTechId, scheduledTimeInput, setScheduledTimeInput, feedbackReplyTicket, setFeedbackReplyTicket, feedbackReplyContent, setFeedbackReplyContent, replyEngineerName, setReplyEngineerName, isGeneratingAiReply, setIsGeneratingAiReply, resolvingTicket, setResolvingTicket, afterImageBase64, setAfterImageBase64, resolutionNotes, setResolutionNotes, isReadingAfterImage, setIsReadingAfterImage, isVerifyingAfterImage, setIsVerifyingAfterImage, allowOverrideVerification, setAllowOverrideVerification, aiVerificationResult, setAiVerificationResult, inspectingTicket, setInspectingTicket, viewingPayrollTech, setViewingPayrollTech, actionSuccessMsg, setActionSuccessMsg, ticketToDelete, setTicketToDelete, isSyncing, setIsSyncing, isAutoResolving, setIsAutoResolving, setActiveTab, feedbackReplyAdminName, handleGenerateAiAdminReply, afterFileInputRef, refreshAllData, handleSyncTickets, handleDeleteTicket, confirmDeleteTicket, handleOneClickAutoDispatch, handleAutoDispatchOne, handleAiAutoResolveSingle, handleAiAutoResolveAll, handleVerifyResolutionImage, handleOpenResolveModal, handleAptCodeChange, handleCreateTicketSubmit, repairCount, feedbackCount, filteredTickets, openTickets, inProgressTickets, resolvedTickets, handleConfirmAdminReply, handleAiAutoAnswerInquiry, handleConfirmAssign, handleApproveAiRecommendation, handleAfterFileChange, handleConfirmResolve, handleRejectResolution, totalFund, totalCompletedMonth, ticketsResource } = ctx;
  return (
    <>
      {activeTab === 'PAYROLL' && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-1">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#C5A880]" /> Đội Ngũ KTV Trực Ca
              </div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {technicians.length} <span className="text-xs text-gray-400 font-normal">{isEn ? 'Technicians' : 'Kỹ thuật viên'}</span>
              </div>
              <div className="text-[11px] text-emerald-400 pt-1">{isEn ? '100% Certified & Credentialed' : '100% Đã được cấp thẻ nghiệp vụ'}</div>
            </div>

            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-1">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tổng Ca Sửa Đã Nghiệm Thu
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {totalCompletedMonth} <span className="text-xs text-gray-400 font-normal">{isEn ? 'jobs this month' : 'ca trong tháng'}</span>
              </div>
              <div className="text-[11px] text-gray-400 pt-1">
                {totalCompletedMonth > 0 ? '100% đúng quy trình nghiệm thu thực tế' : 'Chưa có ca nào hoàn tất'}
              </div>
            </div>

            <div className="p-5 bg-[#121820] border border-[#222B35] space-y-1">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" /> Tổng Quỹ Lương & Thù Lao Tháng
              </div>
              <div className="text-2xl font-bold font-mono text-[#C5A880] mt-1">
                {totalFund.toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-xs text-gray-400 font-normal">{isEn ? 'VND' : 'VNĐ'}</span>
              </div>
              <div className="text-[11px] text-[#C5A880] pt-1">{isEn ? 'Includes base salary + job pay + 5⭐ bonus' : 'Bao gồm lương cơ bản + công ca + thưởng 5⭐'}</div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-[#121820] border border-[#222B35] space-y-4 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#C5A880]" />
                  Bảng Lương & Thù Lao Kỹ Thuật Viên Chung Cư (Tháng Này)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  <>{isEn ? 'Formula:' : 'Công thức:'} <strong>{isEn ? 'Total Pay = Base Salary + (Completed Jobs × Job Rate) + (5⭐ Jobs × 50,000 VND)' : 'Tổng Lương = Lương Cứng + (Số ca sửa × Tiền công) + (Số ca 5⭐ × Thưởng 50.000đ)'}</strong></>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> In Phiếu Lương
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#161B22] text-[#C5A880] uppercase tracking-wider font-semibold border-b border-[#222B35] text-[11px]">
                  <tr>
                    <th className="p-3">{isEn ? 'ID & Technician Name' : 'Mã & Họ Tên KTV'}</th>
                    <th className="p-3">{isEn ? 'Specialty' : 'Chuyên Môn'}</th>
                    <th className="p-3">{isEn ? 'Status' : 'Trạng Thái'}</th>
                    <th className="p-3 text-center">{isEn ? 'Completed' : 'Ca Đã Sửa'}</th>
                    <th className="p-3 text-center">{isEn ? 'Rating ⭐' : 'Đánh Giá ⭐'}</th>
                    <th className="p-3 text-right">{isEn ? 'Base Salary' : 'Lương Cơ Bản'}</th>
                    <th className="p-3 text-right">{isEn ? 'Job Pay' : 'Tiền Công Ca'}</th>
                    <th className="p-3 text-right">{isEn ? '5⭐ Bonus' : 'Thưởng 5⭐'}</th>
                    <th className="p-3 text-right text-[#C5A880]">{isEn ? 'Net Total Pay' : 'Tổng Lương Thực Nhận'}</th>
                    <th className="p-3 text-center">{isEn ? 'Details' : 'Chi Tiết'}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#222B35]">
                  {payrollList.map((item: any) => (
                    <tr key={item.technician.id} className="hover:bg-[#161B22]/60 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white text-xs">{item.technician.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{item.technician.id} • {item.technician.phone}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-[#1C2533] border border-gray-700 text-gray-200 text-[10px] font-semibold">
                          {item.technician.specialty}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.technician.status === 'AVAILABLE' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' 
                            : 'bg-amber-950 text-amber-400 border border-amber-600'
                        }`}>
                          {item.technician.status === 'AVAILABLE' ? 'Đang Rảnh' : 'Đang Xử Lý Ca'}
                        </span>
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-white">
                        {item.completedTicketsCount}
                      </td>

                      <td className="p-3 text-center">
                        <span className="text-yellow-400 font-bold font-mono">
                          {item.averageRating} ⭐
                        </span>
                        <div className="text-[10px] text-gray-400">({item.fiveStarCount} {isEn ? 'times 5⭐' : 'lượt 5⭐'})</div>
                      </td>

                      <td className="p-3 text-right font-mono text-gray-300">
                        {item.baseSalary.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="p-3 text-right font-mono text-emerald-400">
                        +{item.ticketBonusTotal.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="p-3 text-right font-mono text-yellow-400">
                        +{item.fiveStarBonusTotal.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-sm text-[#C5A880]">
                        {item.totalIncome.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setViewingPayrollTech(item)}
                          className="px-2.5 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] border border-[#2D3748] text-[11px] font-semibold transition-all"
                        >
                          Xem Phiếu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
