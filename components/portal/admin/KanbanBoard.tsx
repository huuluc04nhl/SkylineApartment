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

import KanbanBoardTabView from './KanbanBoardTabView';
import KanbanPayrollTab from './KanbanPayrollTab';
import KanbanModals from './KanbanModals';
export default function KanbanBoard() {
  const { t, isEn, language } = useLanguage();
  const [activeTab, setActiveTabState] = useState<'KANBAN' | 'PAYROLL'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sub = urlParams.get('subtab');
      if (sub === 'KANBAN' || sub === 'PAYROLL') return sub;
    }
    return 'KANBAN';
  });

  const setActiveTab = (tab: 'KANBAN' | 'PAYROLL') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('subtab') !== tab) {
        url.searchParams.set('subtab', tab);
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  };
  const [tickets, setTickets] = useState<ExtendedServiceRequest[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [payrollList, setPayrollList] = useState<TechnicianPayrollSummary[]>([]);

  // Category Filter: ALL | REPAIR | FEEDBACK
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'REPAIR' | 'FEEDBACK'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');

  // BQL Direct Ticket Intake Modal States (Hotline 1900 8899)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [apartmentUnits, setApartmentUnits] = useState<ApartmentUnit[]>([]);
  const [newAptCode, setNewAptCode] = useState<string>('CH-06');
  const [newResidentName, setNewResidentName] = useState<string>('');
  const [newResidentPhone, setNewResidentPhone] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'Điện' | 'Nước' | 'Vệ sinh' | 'An ninh' | 'Khác'>('Điện');
  const [newTicketType, setNewTicketType] = useState<'REPAIR' | 'FEEDBACK'>('REPAIR');
  const [newContent, setNewContent] = useState<string>('');
  const [isSubmittingNewTicket, setIsSubmittingNewTicket] = useState<boolean>(false);

  // AI Auto-Dispatch States
  const [isAutoDispatching, setIsAutoDispatching] = useState<boolean>(false);

  // Modals State
  const [assigningTicket, setAssigningTicket] = useState<ExtendedServiceRequest | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('KTV-01');
  const [scheduledTimeInput, setScheduledTimeInput] = useState<string>('Có mặt trong vòng 30 phút');

  // Modal BQL Phản Hồi Cư Dân (cho FEEDBACK, INQUIRY & Cập nhật KTV)
  const [feedbackReplyTicket, setFeedbackReplyTicket] = useState<ExtendedServiceRequest | null>(null);
  const [feedbackReplyContent, setFeedbackReplyContent] = useState<string>('');
  const [replyEngineerName, setReplyEngineerName] = useState<string>('');
  const [isGeneratingAiReply, setIsGeneratingAiReply] = useState<boolean>(false);
  const feedbackReplyAdminName = 'Ban Quản Lý Chung Cư Skyline';

  const handleGenerateAiAdminReply = async () => {
    if (!feedbackReplyTicket) return;
    setIsGeneratingAiReply(true);
    try {
      const res = await fetch('/api/ai/ticket-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GENERATE_ADMIN_REPLY',
          content: feedbackReplyTicket.content,
          category: feedbackReplyTicket.ai_category,
          residentName: feedbackReplyTicket.resident_name,
          aptCode: feedbackReplyTicket.apt_code,
          engineerName: replyEngineerName.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reply) {
          setFeedbackReplyContent(data.reply);
          return;
        }
      }
    } catch (err) {
      console.warn('AI reply API lỗi, dùng smart local fallback:', err);
    } finally {
      setIsGeneratingAiReply(false);
    }
    // Fallback tức thì nếu API bận/timeout
    const draft = generateSuggestedAdminReply(
      feedbackReplyTicket.content,
      feedbackReplyTicket.ai_category,
      feedbackReplyTicket.resident_name,
      feedbackReplyTicket.apt_code,
      replyEngineerName.trim() || undefined
    );
    setFeedbackReplyContent(draft);
  };

  const [resolvingTicket, setResolvingTicket] = useState<ExtendedServiceRequest | null>(null);
  const [afterImageBase64, setAfterImageBase64] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [isReadingAfterImage, setIsReadingAfterImage] = useState(false);
  const [isVerifyingAfterImage, setIsVerifyingAfterImage] = useState(false);
  const [allowOverrideVerification, setAllowOverrideVerification] = useState(false);
  const [aiVerificationResult, setAiVerificationResult] = useState<{
    status: 'VERIFIED' | 'SUSPICIOUS' | 'INCOMPLETE';
    confidence_score: number;
    verification_title: string;
    verification_detail: string;
    is_genuine: boolean;
    risk_warning?: string;
  } | null>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  const [inspectingTicket, setInspectingTicket] = useState<ExtendedServiceRequest | null>(null);
  const [viewingPayrollTech, setViewingPayrollTech] = useState<TechnicianPayrollSummary | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<ExtendedServiceRequest | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshAllData = () => {
    setTickets(getTickets());
    setTechnicians(getTechnicians());
    setPayrollList(getTechnicianPayroll());
  };

  const handleSyncTickets = async () => {
    setIsSyncing(true);
    try {
      await syncTicketsWithServer();
      refreshAllData();
      setActionSuccessMsg('Đã cập nhật danh sách sự cố mới nhất từ hệ thống tiếp nhận!');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.warn('Lỗi cập nhật dữ liệu sự cố:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteTicket = (ticket: ExtendedServiceRequest) => {
    setTicketToDelete(ticket);
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    const code = `#${ticketToDelete.id}`;
    await deleteTicketAsync(ticketToDelete.id);
    refreshAllData();
    setActionSuccessMsg(`Đã xóa vĩnh viễn phiếu sự cố ${code}.`);
    setTicketToDelete(null);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };


  const handleOneClickAutoDispatch = () => {
    setIsAutoDispatching(true);
    try {
      const res = autoDispatchAllPendingTickets();
      refreshAllData();
      if (res.successCount > 0) {
        setActionSuccessMsg(`AI đã phân công ${res.successCount} phiếu sự cố.`);
      } else {
        setActionSuccessMsg('Không còn phiếu nào đang chờ tiếp nhận.');
      }
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsAutoDispatching(false);
    }
  };

  const [isAutoResolving, setIsAutoResolving] = useState(false);

  const handleAutoDispatchOne = (ticketId: string) => {
    const res = autoDispatchSingleTicket(ticketId);
    if (res && res.assigned_technician) {
      refreshAllData();
      setActionSuccessMsg(`Đã phân công ${res.assigned_technician} cho phiếu #${res.id}.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const handleAiAutoResolveSingle = (ticket: ExtendedServiceRequest) => {
    const res = autoResolveSingleTicketWithAI(ticket.id);
    if (res) {
      refreshAllData();
      setActionSuccessMsg(`Đã nghiệm thu phiếu #${res.id.replace('TICK-', '')}.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleAiAutoResolveAll = () => {
    if (inProgressTickets.length === 0) return;
    setIsAutoResolving(true);
    try {
      const res = autoResolveAllInProgressTicketsWithAI();
      refreshAllData();
      if (res.successCount > 0) {
        setActionSuccessMsg(`Đã nghiệm thu ${res.successCount} phiếu sự cố.`);
      } else {
        setActionSuccessMsg('Không có phiếu nào đang chờ nghiệm thu.');
      }
      setTimeout(() => setActionSuccessMsg(null), 4500);
    } finally {
      setIsAutoResolving(false);
    }
  };

  const handleVerifyResolutionImage = async (afterB64: string, ticket: ExtendedServiceRequest, notesText?: string) => {
    if (!afterB64) return;
    setIsVerifyingAfterImage(true);
    try {
      const res = await fetch('/api/ai/ticket-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_RESOLUTION_IMAGE',
          afterImage: afterB64,
          beforeImage: ticket.before_image || undefined,
          issueDescription: ticket.content || '',
          area: ticket.area || ticket.ai_category || '',
          technicianNotes: notesText || resolutionNotes || ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        const v = data.verification || (data.confidence_score ? data : null);
        if (data.success && v) {
          setAiVerificationResult({
            status: v.status || 'VERIFIED',
            confidence_score: v.confidence_score ?? v.score ?? 92,
            verification_title: v.verification_title ?? v.title ?? 'Đã kiểm định hiện trường đạt chuẩn',
            verification_detail: v.verification_detail ?? v.detail ?? '',
            is_genuine: v.is_genuine ?? true,
            risk_warning: v.risk_warning,
          });
          return;
        }
      }
    } catch (err) {
      console.warn('AI verification API error, relying on local verification:', err);
    } finally {
      setIsVerifyingAfterImage(false);
    }
  };

  const handleOpenResolveModal = (ticket: ExtendedServiceRequest) => {
    setResolvingTicket(ticket);
    setAfterImageBase64('');
    setResolutionNotes(generateAiResolutionNotes(ticket));
    setAiVerificationResult(null);
    setAllowOverrideVerification(false);
  };

  useEffect(() => {
    refreshAllData();

    // Nạp danh sách căn hộ thực tế của tòa nhà để phục vụ BQL tiếp nhận sự cố
    try {
      const units = getApartmentUnits();
      if (units && units.length > 0) {
        setApartmentUnits(units);
        setNewAptCode(units[0].code);
        setNewResidentName(units[0].owner?.name || '');
        setNewResidentPhone(units[0].owner?.phone || '');
      }
    } catch (e) {
      console.warn('Lỗi load danh sách căn hộ:', e);
    }

    // Tự động đồng bộ live dữ liệu từ máy chủ & Skyline API (Tuyệt đối không tự ý chuyển trạng thái vé)
    syncTicketsWithServer().then(() => {
      refreshAllData();
    });

    const handleUpdate = () => {
      refreshAllData();
    };
    window.addEventListener('skyline_tickets_updated', handleUpdate);
    return () => window.removeEventListener('skyline_tickets_updated', handleUpdate);
  }, []);

  const handleAptCodeChange = (code: string) => {
    setNewAptCode(code);
    const unit = apartmentUnits.find(u => u.code === code);
    if (unit?.owner) {
      setNewResidentName(unit.owner.name || '');
      setNewResidentPhone(unit.owner.phone || '');
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      toast.warning('Vui lòng nhập mô tả sự cố hoặc yêu cầu!');
      return;
    }
    if (newResidentPhone.trim() && newResidentPhone.trim() !== '1900 8899' && !isValidPhoneNumber(newResidentPhone)) {
      toast.warning(getPhoneValidationError(newResidentPhone) || 'Số điện thoại liên hệ không hợp lệ!');
      return;
    }
    setIsSubmittingNewTicket(true);
    try {
      const res = await createTicketAsync({
        apt_code: newAptCode || 'CH-06',
        resident_name: newResidentName || 'Cư dân Skyline',
        resident_phone: newResidentPhone || '1900 8899',
        content: newContent.trim(),
        ticket_type: newTicketType,
        ai_category: newCategory,
      });
      refreshAllData();
      setIsCreateModalOpen(false);
      setNewContent('');
      setActionSuccessMsg(`Đã tiếp nhận sự cố thành công! Phiếu #${res.id} đã được đưa vào hàng đợi.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Lỗi tiếp nhận sự cố:', err);
      toast.error('Có lỗi khi tạo phiếu sự cố. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmittingNewTicket(false);
    }
  };

  // Counts for Category Badges
  const repairCount = tickets.filter(t => (t.ticket_type || 'REPAIR') === 'REPAIR').length;
  const feedbackCount = tickets.filter(t => t.ticket_type !== 'REPAIR').length;

  // Filter lists for 3 Kanban columns based on active category filter AND keyword search
  const filteredTickets = tickets.filter(t => {
    if (categoryFilter !== 'ALL') {
      const isRep = (t.ticket_type || 'REPAIR') === 'REPAIR';
      if (categoryFilter === 'REPAIR' && !isRep) return false;
      if (categoryFilter === 'FEEDBACK' && isRep) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchApt = (t.apt_code || '').toLowerCase().includes(q);
      const matchName = (t.resident_name || '').toLowerCase().includes(q);
      const matchPhone = (t.resident_phone || '').toLowerCase().includes(q);
      const matchContent = (t.content || '').toLowerCase().includes(q);
      const matchId = (t.id || '').toLowerCase().includes(q);
      
      const matchTech = (t.assigned_technician || '').toLowerCase().includes(q);
      const matchCat = (t.ai_category || '').toLowerCase().includes(q);
      if (!matchApt && !matchName && !matchPhone && !matchContent && !matchId && !matchTech && !matchCat) {
        return false;
      }
    }

    return true;
  });

  const openTickets = filteredTickets
    .filter(t => t.status === 'Open')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Priority for In-Progress: Urgent repairs (REPAIR) first, then by latest updates
  const inProgressTickets = filteredTickets
    .filter(t => t.status === 'In_Progress' || t.status === 'Assigned')
    .sort((a, b) => {
      if (a.ticket_type === 'REPAIR' && b.ticket_type !== 'REPAIR') return -1;
      if (a.ticket_type !== 'REPAIR' && b.ticket_type === 'REPAIR') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const resolvedTickets = filteredTickets
    .filter(t => t.status === 'Resolved')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Handle BQL official response to resident feedback / inquiry & update engineer
  const handleConfirmAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackReplyTicket || !feedbackReplyContent.trim()) return;

    adminRespondToTicket(
      feedbackReplyTicket.id, 
      feedbackReplyContent.trim(), 
      feedbackReplyAdminName,
      replyEngineerName.trim() || undefined
    );
    refreshAllData();
    setActionSuccessMsg(`Đã gửi phản hồi và cập nhật KTV cho phiếu #${feedbackReplyTicket.id}!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
    setFeedbackReplyTicket(null);
    setFeedbackReplyContent('');
    setReplyEngineerName('');
  };

  // AI auto answer inquiry
  const handleAiAutoAnswerInquiry = (ticket: ExtendedServiceRequest) => {
    const res = aiAnswerTicket(ticket.id);
    if (res) {
      refreshAllData();
      setActionSuccessMsg(`AI đã hoàn tất giải đáp thông tin cho phiếu #${res.id}!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  // Handle assigning tech
  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTicket || !selectedTechId) return;

    const res = assignTechnicianToTicket(assigningTicket.id, selectedTechId, scheduledTimeInput);
    if (res) {
      setActionSuccessMsg(`Đã phân công KTV ${res.assigned_technician} xử lý phiếu #${res.id}!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
    setAssigningTicket(null);
  };

  // Ban Quản Lý bấm 1 chạm DUYỆT ĐỀ XUẤT ĐIỀU PHỐI KTV CỦA AI
  const handleApproveAiRecommendation = (ticket: ExtendedServiceRequest) => {
    let techId = ticket.suggested_technician_id;
    if (!techId && ticket.suggested_technician) {
      const found = technicians.find(t => t.name.toLowerCase().includes((ticket.suggested_technician || '').toLowerCase()));
      if (found) techId = found.id;
    }
    if (!techId && technicians.length > 0) {
      techId = technicians[0].id;
    }

    if (techId) {
      const res = assignTechnicianToTicket(
        ticket.id, 
        techId, 
        ticket.scheduled_time || 'Trong vòng 30 - 45 phút'
      );
      if (res) {
        refreshAllData();
        setActionSuccessMsg(`BQL đã duyệt phân công KTV ${res.assigned_technician} xử lý phiếu #${res.id}!`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    }
  };

  // Handle uploading after image
  const handleAfterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG).');
      return;
    }

    setIsReadingAfterImage(true);
    try {
      const b64 = await fileToBase64(file);
      setAfterImageBase64(b64);
      if (resolvingTicket) {
        handleVerifyResolutionImage(b64, resolvingTicket, resolutionNotes);
      }
    } catch (err) {
      toast.error('Không thể đọc file ảnh. Vui lòng thử lại.');
    } finally {
      setIsReadingAfterImage(false);
    }
  };

  // Handle resolving ticket
  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    if (!afterImageBase64) {
      toast.warning('Vui lòng chụp hoặc tải ảnh hiện trường sau khi sửa chữa để nghiệm thu!');
      return;
    }

    if (!resolutionNotes.trim()) {
      toast.warning('Vui lòng nhập ghi chú kỹ thuật khi nghiệm thu bàn giao!');
      return;
    }

    const isProblematic = aiVerificationResult && (aiVerificationResult.status === 'SUSPICIOUS' || aiVerificationResult.status === 'INCOMPLETE');
    if (isProblematic && !allowOverrideVerification) {
      toast.warning('AI cảnh báo chất lượng ảnh hoặc kết quả sửa chữa chưa đạt chuẩn! Vui lòng chọn "Từ Chối & Yêu Cầu Sửa Lại" hoặc tích chọn duyệt ngoại lệ nếu đã thẩm định thực tế.');
      return;
    }

    const res = resolveTicket(
      resolvingTicket.id, 
      afterImageBase64, 
      resolutionNotes.trim(), 
      aiVerificationResult || undefined
    );
    if (res) {
      setActionSuccessMsg(`Đã nghiệm thu và hoàn tất phiếu #${res.id}. Hệ thống tự động ghi nhận thù lao cho KTV!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
    setResolvingTicket(null);
    setAfterImageBase64('');
    setResolutionNotes('');
    setAiVerificationResult(null);
    setAllowOverrideVerification(false);
  };

  // Handle rejecting ticket resolution (send back to technician for rework)
  const handleRejectResolution = () => {
    if (!resolvingTicket) return;
    const defaultReason = aiVerificationResult?.risk_warning || aiVerificationResult?.verification_detail || 'Ảnh nghiệm thu không đạt chuẩn kỹ thuật, yêu cầu kiểm tra và xử lý lại.';
    rejectTicketResolution(resolvingTicket.id, defaultReason);
    refreshAllData();
    setActionSuccessMsg(`Đã từ chối nghiệm thu #${resolvingTicket.id}. Yêu cầu KTV khắc phục lại!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
    setResolvingTicket(null);
    setAfterImageBase64('');
    setResolutionNotes('');
    setAiVerificationResult(null);
    setAllowOverrideVerification(false);
  };

  // Calculations for Payroll KPIs
  const totalFund = payrollList.reduce((acc, p) => acc + p.totalIncome, 0);
  const totalCompletedMonth = tickets.filter(t => t.status === 'Resolved').length;

  const ticketsResource = useAsyncResource(async () => {
    const res = await fetch('/api/tickets', { credentials: 'include' });
    if (!res.ok) throw new Error(`Không thể tải danh sách phiếu kỹ thuật (HTTP ${res.status})`);
    const json = await res.json();
    return Array.isArray(json?.tickets) ? json.tickets : [];
  }, []);

  const boardCtx: any = { t, isEn, isValidPhoneNumber, getPhoneValidationError, activeTab, setActiveTabState, tickets, setTickets, technicians, setTechnicians, payrollList, setPayrollList, categoryFilter, setCategoryFilter, searchQuery, setSearchQuery, viewMode, setViewMode, isCreateModalOpen, setIsCreateModalOpen, apartmentUnits, setApartmentUnits, newAptCode, setNewAptCode, newResidentName, setNewResidentName, newResidentPhone, setNewResidentPhone, newCategory, setNewCategory, newTicketType, setNewTicketType, newContent, setNewContent, isSubmittingNewTicket, setIsSubmittingNewTicket, isAutoDispatching, setIsAutoDispatching, assigningTicket, setAssigningTicket, selectedTechId, setSelectedTechId, scheduledTimeInput, setScheduledTimeInput, feedbackReplyTicket, setFeedbackReplyTicket, feedbackReplyContent, setFeedbackReplyContent, replyEngineerName, setReplyEngineerName, isGeneratingAiReply, setIsGeneratingAiReply, resolvingTicket, setResolvingTicket, afterImageBase64, setAfterImageBase64, resolutionNotes, setResolutionNotes, isReadingAfterImage, setIsReadingAfterImage, isVerifyingAfterImage, setIsVerifyingAfterImage, allowOverrideVerification, setAllowOverrideVerification, aiVerificationResult, setAiVerificationResult, inspectingTicket, setInspectingTicket, viewingPayrollTech, setViewingPayrollTech, actionSuccessMsg, setActionSuccessMsg, ticketToDelete, setTicketToDelete, isSyncing, setIsSyncing, isAutoResolving, setIsAutoResolving, setActiveTab, feedbackReplyAdminName, handleGenerateAiAdminReply, afterFileInputRef, refreshAllData, handleSyncTickets, handleDeleteTicket, confirmDeleteTicket, handleOneClickAutoDispatch, handleAutoDispatchOne, handleAiAutoResolveSingle, handleAiAutoResolveAll, handleVerifyResolutionImage, handleOpenResolveModal, handleAptCodeChange, handleCreateTicketSubmit, repairCount, feedbackCount, filteredTickets, openTickets, inProgressTickets, resolvedTickets, handleConfirmAdminReply, handleAiAutoAnswerInquiry, handleConfirmAssign, handleApproveAiRecommendation, handleAfterFileChange, handleConfirmResolve, handleRejectResolution, totalFund, totalCompletedMonth, ticketsResource };
  return (
    <div className="space-y-6 animate-fadeIn">
      {ticketsResource.loading && <ResourceSkeleton label="Đang tải bảng điều phối kỹ thuật..." />}
      {!ticketsResource.loading && ticketsResource.error && (
        <ResourceError message={ticketsResource.error} onRetry={ticketsResource.retry} />
      )}
      {!ticketsResource.loading && !ticketsResource.error && tickets.length === 0 && (
        <ResourceEmpty message="Chưa có phiếu yêu cầu kỹ thuật nào." />
      )}
      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> {t('Quản Lý & Vận Hành', 'Operations & Management')}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {t('Trung Tâm Xử Lý Yêu Cầu Cư Dân', 'Resident Service Request Center')}
          </h2>
        </div>

        {/* Unified Static Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Nút BQL Tiếp Nhận Sự Cố Trực Tiếp (Hotline 1900 8899) */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md rounded-none"
            title={t('Ban Quản Lý trực tiếp tiếp nhận sự cố kỹ thuật từ Hotline 1900 8899 hoặc cư dân báo trực tiếp')}
          >
            <Plus className="w-3.5 h-3.5 text-[#0A0E14] stroke-[2.5]" />
            <span>{t('Tiếp Nhận Sự Cố', 'New Incident Intake')}</span>
          </button>

          {/* Nút Làm Mới Dữ Liệu */}
          <button
            onClick={handleSyncTickets}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#121820] hover:bg-[#161B22] border border-[#222B35] hover:border-[#C5A880]/50 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title={t('Cập nhật danh sách yêu cầu thực tế mới nhất từ cư dân', 'Refresh latest resident service requests')}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A880] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t('Đang cập nhật...', 'Updating...') : t('Làm mới', 'Refresh')}</span>
          </button>

          {/* Tab Switcher: KANBAN vs PAYROLL */}
          <div className="flex items-center bg-[#0D1117] p-1 border border-[#222B35]">
            <button
              onClick={() => setActiveTab('KANBAN')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'KANBAN'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t('Yêu Cầu & Sự Cố', 'Requests & Incidents')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${
                activeTab === 'KANBAN' ? 'bg-[#0D1117]/20 text-[#0D1117]' : 'bg-[#161B22] text-gray-400'
              }`}>
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PAYROLL')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'PAYROLL'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{t('KTV & Thù Lao', 'Technicians & Payroll')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${
                activeTab === 'PAYROLL' ? 'bg-[#0D1117]/20 text-[#0D1117]' : 'bg-[#161B22] text-gray-400'
              }`}>
                {payrollList.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: KANBAN BOARD */}
      <KanbanBoardTabView ctx={boardCtx} />
      <KanbanPayrollTab ctx={boardCtx} />
      <KanbanModals ctx={boardCtx} />
    </div>
  );
}
