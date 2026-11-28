'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';
import { useQrScanner } from '@/lib/hooks/useQrScanner';
import { ResourceSkeleton, ResourceError, ResourceEmpty } from '@/components/ui/ResourceState';
import { toast } from '@/components/ui/Toast';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Upload, 
  Zap, 
  Building2, 
  User, 
  Phone, 
  Car, 
  Clock, 
  KeyRound, 
  Search, 
  RefreshCw, 
  Check, 
  UserCheck, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  FileText,
  Home,
  Users,
  Info,
  Plus,
  QrCode,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  Trash2,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  Printer,
  X
} from 'lucide-react';
import {
  shouldProcessQrScan,
  type VerificationScanResult,
  type GeneratedVisitorPass,
  type GateAuditLog,
  type VisitorPassStatus,
} from '@/lib/visitorStore';
import { getApartmentUnits } from '@/lib/apartmentStore';
import { cleanPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from '@/lib/validationUtils';
import { useLanguage } from '@/lib/languageContext';
import ConfirmDeleteModal from '@/components/portal/shared/ConfirmDeleteModal';

export type VisitorTab = 'LIST' | 'SCANNER' | 'AUDIT_LOGS';

import VisitorListTabView from './VisitorListTabView';
import VisitorScannerTabView from './VisitorScannerTabView';
import VisitorAuditAndModals from './VisitorAuditAndModals';
export default function AdminVisitorControl() {
  const { t, isEn } = useLanguage();
  // 1. Tab chính điều khiển
  const [activeTab, setActiveTabState] = useState<VisitorTab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sub = urlParams.get('subtab');
      if (sub === 'LIST' || sub === 'SCANNER' || sub === 'AUDIT_LOGS') return sub as VisitorTab;
    }
    return 'LIST';
  });

  const setActiveTab = (tab: VisitorTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('subtab') !== tab) {
        url.searchParams.set('subtab', tab);
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  };

  // Chốt kiểm soát an ninh
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('Sảnh Tiếp Tân Tầng 1 (Chung Cư Skyline)');

  // Chế độ xem danh sách: 'TABLE' (dạng bảng) | 'CARDS' (dạng thẻ)
  const [viewLayout, setViewLayout] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Input & Scanner modes: CAMERA | UPLOAD | PIN_SEARCH
  const [scanMode, setScanMode] = useState<'CAMERA' | 'UPLOAD' | 'PIN_SEARCH'>('CAMERA');
  const [isScanning, setIsScanning] = useState(false);

  // Manual PIN / PassID search
  const [pinSearchInput, setPinSearchInput] = useState('');

  // Current Scan / Verification Result
  const [scanResult, setScanResult] = useState<VerificationScanResult | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Visitor Passes List & Filtering
  const [passesList, setPassesList] = useState<GeneratedVisitorPass[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [tableSearch, setTableSearch] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<GateAuditLog[]>([]);

  // Confirmation Modal State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemCode?: string;
    itemName?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [logSearch, setLogSearch] = useState('');

  // Modals
  const [isQuickPassModalOpen, setIsQuickPassModalOpen] = useState(false);
  const [selectedPassForDetail, setSelectedPassForDetail] = useState<GeneratedVisitorPass | null>(null);
  const [detailQrDataUrl, setDetailQrDataUrl] = useState<string>('');

  // Quick Pass Creation Form State (Cấp thẻ tại quầy)
  const [newPassApt, setNewPassApt] = useState('');
  const [newPassVisitorName, setNewPassVisitorName] = useState('');
  const [newPassVisitorPhone, setNewPassVisitorPhone] = useState('');
  const [newPassPlate, setNewPassPlate] = useState('');
  const [newPassHours, setNewPassHours] = useState('4');
  const [newPassNote, setNewPassNote] = useState('');
  const [createdQuickPass, setCreatedQuickPass] = useState<GeneratedVisitorPass | null>(null);
  const [createdQrUrl, setCreatedQrUrl] = useState<string>('');

  // Danh sách căn hộ từ apartmentStore để chọn khi cấp thẻ
  const apartments = useMemo(() => {
    try {
      return getApartmentUnits();
    } catch {
      return [];
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleVerifyRef = useRef<(rawInput: string) => Promise<void>>(async () => {});

  const {
    videoRef,
    canvasRef,
    animationFrameId,
    isCameraActive,
    setIsCameraActive,
    cameraError,
    setCameraError,
    scanVideoFrame,
    startCamera,
    stopCamera,
  } = useQrScanner({
    onScan: (data) => handleVerifyRef.current(data),
    cooldownMs: 4000,
  });

  const visitorResource = useAsyncResource<{ passes: GeneratedVisitorPass[]; gateLogs: GateAuditLog[] }>(async () => {
    const res = await fetch('/api/visitor', { credentials: 'include' });
    if (!res.ok) throw new Error(`Không thể tải dữ liệu kiểm soát khách (HTTP ${res.status})`);
    const json = await res.json();
    return {
      passes: Array.isArray(json?.passes) ? json.passes : [],
      gateLogs: Array.isArray(json?.gateLogs) ? json.gateLogs : [],
    };
  }, []);

  useEffect(() => {
    if (visitorResource.data) {
      setPassesList(visitorResource.data.passes);
      setAuditLogs(visitorResource.data.gateLogs);
    }
  }, [visitorResource.data]);

  const refreshData = () => {
    visitorResource.retry();
  };

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionFeedback({ type, message });
    if (type === 'error') toast.error(message);
    else if (type === 'info') toast.info(message);
    else toast.success(message);
    setTimeout(() => setActionFeedback(null), 3800);
  };

  // Perform Unified QR / PIN Verification via API (Thẻ cư dân, Vé tiện ích, Thẻ khách thăm)
  const handleVerify = async (rawInput: string) => {
    const clean = rawInput.trim();
    if (!clean || isScanning) return;
    setIsScanning(true);
    try {
      // 1. Thẻ cư dân động (HMAC token)
      if (clean.startsWith('SKYLINE_CARD_V1.')) {
        const res = await fetch('/api/access/verify-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: clean }),
        });
        const json = await res.json().catch(() => ({}));
        const valid = res.ok && json?.success;
        setScanResult({
          scanResult: valid ? 'VALID' : json?.status === 'EXPIRED' ? 'EXPIRED' : 'INVALID',
          title: valid ? 'THẺ CƯ DÂN HỢP LỆ' : 'THẺ CƯ DÂN KHÔNG HỢP LỆ',
          message: json?.message || (valid ? 'Xác thực thẻ cư dân thành công.' : 'Thẻ cư dân không hợp lệ.'),
          canEnter: valid,
          scannedAt: new Date().toISOString(),
          checkpoint: selectedCheckpoint,
          host: json?.resident
            ? {
                apartmentCode: json.resident.apartmentCode || 'BQL',
                hostName: json.resident.fullName,
                hostPhone: '',
                towerName: json.resident.role,
              }
            : undefined,
        });
        setActiveTab('SCANNER');
        showFeedback(json?.message || (valid ? 'Thẻ cư dân hợp lệ' : 'Thẻ cư dân không hợp lệ'), valid ? 'success' : 'error');
        return;
      }

      // 2. Vé tiện ích (FAC-... / SKY-FAC-...)
      if (/^(SKY-)?FAC-/i.test(clean)) {
        const res = await fetch('/api/facilities/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'CHECK_IN_FACILITY_TICKET', ticketCode: clean }),
        });
        const json = await res.json().catch(() => ({}));
        const valid = res.ok && json?.success;
        setScanResult({
          scanResult: valid ? 'VALID' : json?.status === 'EXPIRED' ? 'EXPIRED' : 'INVALID',
          title: valid ? 'VÉ TIỆN ÍCH HỢP LỆ' : 'VÉ TIỆN ÍCH KHÔNG HỢP LỆ',
          message: json?.message || (valid ? 'Xác thực vé tiện ích thành công.' : 'Vé tiện ích không hợp lệ.'),
          canEnter: valid,
          scannedAt: new Date().toISOString(),
          checkpoint: selectedCheckpoint,
          host: json?.booking
            ? {
                apartmentCode: json.booking.aptCode,
                hostName: json.booking.bookerName,
                hostPhone: '',
                towerName: json.booking.facilityName,
              }
            : undefined,
        });
        setActiveTab('SCANNER');
        showFeedback(json?.message || (valid ? 'Vé tiện ích hợp lệ' : 'Vé tiện ích không hợp lệ'), valid ? 'success' : 'error');
        return;
      }

      // 3. Thẻ khách thăm (/api/visitor)
      const res = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'VERIFY',
          qrCode: clean,
          checkpoint: selectedCheckpoint,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        showFeedback(result?.message || 'Lỗi xác thực mã thẻ khách.', 'error');
        return;
      }

      setScanResult(result);
      setActiveTab('SCANNER');
      refreshData();

      if (result.canEnter && result.scanResult === 'VALID') {
        showFeedback(`Xác thực thành công! Khách: ${result.visitor?.visitorName} • Điểm đến: Căn ${result.host?.apartmentCode}`);
      } else if (result.scanResult === 'EXPIRED') {
        showFeedback('Thẻ khách đã hết hạn sử dụng!', 'error');
      } else {
        showFeedback(result?.message || 'Mã thẻ không hợp lệ hoặc không tồn tại trong hệ thống!', 'error');
      }
    } catch {
      showFeedback('Không thể kết nối máy chủ để xác thực mã thẻ.', 'error');
    } finally {
      setIsScanning(false);
    }
  };
  handleVerifyRef.current = handleVerify;

  // Check-in Action via API
  const handleCheckIn = async (passId: string) => {
    try {
      const res = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'CHECK_IN',
          passId,
          checkpoint: selectedCheckpoint,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.pass) {
        showFeedback(json?.message || 'Không thể check-in thẻ khách.', 'error');
        return;
      }
      const updated: GeneratedVisitorPass = json.pass;
      showFeedback(`Đã đón tiếp và mời khách [${updated.visitorName}] lên Căn ${updated.apartmentCode}!`);
      if (scanResult && scanResult.visitor?.passId === passId) {
        setScanResult({
          ...scanResult,
          title: 'KHÁCH ĐANG Ở TRONG TÒA NHÀ',
          visitor: {
            ...scanResult.visitor,
            status: 'CHECKED_IN',
            checkedInAt: updated.checkedInAt,
          },
        });
      }
      if (selectedPassForDetail && selectedPassForDetail.id === passId) {
        setSelectedPassForDetail(updated);
      }
      refreshData();
    } catch {
      showFeedback('Không thể kết nối máy chủ khi check-in.', 'error');
    }
  };

  // Check-out Action via API
  const handleCheckOut = async (passId: string) => {
    try {
      const res = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'CHECK_OUT',
          passId,
          checkpoint: selectedCheckpoint,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.pass) {
        showFeedback(json?.message || 'Không thể check-out thẻ khách.', 'error');
        return;
      }
      const updated: GeneratedVisitorPass = json.pass;
      showFeedback(`Đã ghi nhận khách [${updated.visitorName}] rời tòa nhà an toàn!`, 'info');
      if (scanResult && scanResult.visitor?.passId === passId) {
        setScanResult({
          ...scanResult,
          title: 'KHÁCH ĐÃ RỜI TÒA NHÀ',
          visitor: {
            ...scanResult.visitor,
            status: 'COMPLETED',
            checkedOutAt: updated.checkedOutAt,
          },
        });
      }
      if (selectedPassForDetail && selectedPassForDetail.id === passId) {
        setSelectedPassForDetail(updated);
      }
      refreshData();
    } catch {
      showFeedback('Không thể kết nối máy chủ khi check-out.', 'error');
    }
  };

  // Delete / Revoke Pass Action via API
  const handleDeletePass = (pass: GeneratedVisitorPass) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Hủy & Thu Hồi Thẻ Khách',
      message: `Bạn có chắc chắn muốn hủy và thu hồi thẻ đón khách của cư dân căn hộ ${pass.apartmentCode}? Mã PIN và QR Code liên kết sẽ bị vô hiệu hóa ngay tức thì trên tất cả các cửa tự động.`,
      itemCode: pass.id,
      itemName: `${pass.visitorName} (Căn ${pass.apartmentCode})`,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/visitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'DELETE', passId: pass.id }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            showFeedback(json?.message || 'Không thể xóa thẻ khách.', 'error');
            return;
          }
          showFeedback(`Đã hủy thẻ khách [${pass.id}] thành công.`, 'info');
          if (selectedPassForDetail?.id === pass.id) {
            setSelectedPassForDetail(null);
          }
          if (scanResult?.visitor?.passId === pass.id) {
            setScanResult(null);
          }
          refreshData();
        } catch {
          showFeedback('Không thể kết nối máy chủ khi xóa thẻ khách.', 'error');
        }
      },
    });
  };

  // Xóa các thẻ khách đã hết hạn trong database (ADMIN)
  const handleClearAllData = () => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Dọn Dẹp Thẻ Khách Hết Hạn',
      message: 'Xác nhận xóa toàn bộ thẻ khách đã hết hạn khỏi cơ sở dữ liệu?',
      itemCode: 'EXPIRED_VISITORS',
      itemName: 'Các thẻ khách đã hết hạn',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/visitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'PURGE_EXPIRED' }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            showFeedback(json?.message || 'Không thể dọn dẹp thẻ hết hạn.', 'error');
            return;
          }
          showFeedback(json?.message || 'Đã dọn dẹp thẻ khách hết hạn.', 'info');
          setSelectedPassForDetail(null);
          setScanResult(null);
          refreshData();
        } catch {
          showFeedback('Không thể kết nối máy chủ khi dọn dẹp dữ liệu.', 'error');
        }
      },
    });
  };

  useEffect(() => {
    if (activeTab !== 'SCANNER') {
      stopCamera();
    }
  }, [activeTab, stopCamera]);

  // Handle Upload Image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleVerify(code.data);
        } else {
          handleVerify('INVALID_UNRECOGNIZED_IMAGE');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Open Pass Detail Modal
  const openPassDetail = async (pass: GeneratedVisitorPass) => {
    setSelectedPassForDetail(pass);
    try {
      const url = await QRCode.toDataURL(pass.qrData, {
        width: 240,
        margin: 1.5,
        color: { dark: '#0D1117', light: '#FFFFFF' }
      });
      setDetailQrDataUrl(url);
    } catch {
      setDetailQrDataUrl('');
    }
  };

  // Create Quick Pass at Reception Desk
  const handleCreateQuickPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassVisitorName.trim()) {
      showFeedback(isEn ? 'Please enter visitor name!' : 'Vui lòng nhập tên khách thăm!', 'error');
      return;
    }
    if (newPassVisitorPhone.trim() && !isValidPhoneNumber(newPassVisitorPhone)) {
      showFeedback(getPhoneValidationError(newPassVisitorPhone, isEn) || (isEn ? 'Invalid visitor phone number!' : 'Số điện thoại khách không hợp lệ!'), 'error');
      return;
    }

    const selectedUnitObj = apartments.find(u => u.code === newPassApt);
    const hostName = selectedUnitObj?.owner?.name || `Chủ Hộ Căn ${newPassApt}`;
    const hostPhone = selectedUnitObj?.owner?.phone || '0901234567';

    try {
      const res = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'CREATE',
          apartmentCode: newPassApt,
          hostName,
          hostPhone,
          visitorName: newPassVisitorName.trim(),
          phoneNumber: newPassVisitorPhone.trim(),
          licensePlate: newPassPlate.trim().toUpperCase(),
          validHours: parseInt(newPassHours, 10) || 4,
          note: newPassNote.trim() || 'Thẻ cấp trực tiếp tại quầy lễ tân',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.pass) {
        showFeedback(json?.message || 'Không thể cấp thẻ khách.', 'error');
        return;
      }

      const pass: GeneratedVisitorPass = json.pass;
      try {
        const url = await QRCode.toDataURL(pass.qrData, {
          width: 240,
          margin: 1.5,
          color: { dark: '#0D1117', light: '#FFFFFF' },
        });
        setCreatedQrUrl(url);
      } catch {
        setCreatedQrUrl('');
      }

      setCreatedQuickPass(pass);
      refreshData();
      showFeedback(`Đã cấp thẻ đón khách thành công! Mã PIN: ${pass.pinCode}`);
    } catch {
      showFeedback('Không thể kết nối máy chủ khi cấp thẻ khách.', 'error');
    }
  };

  // Reset Quick Pass Form
  const resetQuickPassForm = () => {
    setNewPassVisitorName('');
    setNewPassVisitorPhone('');
    setNewPassPlate('');
    setNewPassNote('');
    setCreatedQuickPass(null);
    setCreatedQrUrl('');
    setIsQuickPassModalOpen(false);
  };

  // Quick stats
  const totalPasses = passesList.length;
  const inBuildingCount = passesList.filter((p) => p.status === 'CHECKED_IN').length;
  const pendingCount = passesList.filter((p) => p.status === 'ACTIVE').length;
  const completedCount = passesList.filter((p) => p.status === 'COMPLETED').length;
  const expiredCount = passesList.filter((p) => p.status === 'EXPIRED').length;

  // Filtered passes for list
  const filteredPasses = passesList.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      const matchName = p.visitorName.toLowerCase().includes(q);
      const matchApt = p.apartmentCode.toLowerCase().includes(q);
      const matchHost = p.hostName.toLowerCase().includes(q);
      const matchPlate = (p.licensePlate || '').toLowerCase().includes(q);
      const matchPhone = (p.phoneNumber || '').toLowerCase().includes(q);
      const matchPin = p.pinCode.includes(q);
      const matchId = p.id.toLowerCase().includes(q);
      return matchName || matchApt || matchHost || matchPlate || matchPhone || matchPin || matchId;
    }
    return true;
  });

  // Filtered audit logs
  const filteredLogs = auditLogs.filter(log => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase().trim();
    return (
      (log.visitorName || '').toLowerCase().includes(q) ||
      (log.apartmentCode || '').toLowerCase().includes(q) ||
      (log.hostName || '').toLowerCase().includes(q) ||
      (log.licensePlate || '').toLowerCase().includes(q) ||
      (log.note || '').toLowerCase().includes(q)
    );
  });

  const visitorCtx: any = { t, isEn, isValidPhoneNumber, getPhoneValidationError, activeTab, setActiveTabState, selectedCheckpoint, setSelectedCheckpoint, viewLayout, setViewLayout, scanMode, setScanMode, isCameraActive, setIsCameraActive, cameraError, setCameraError, isScanning, setIsScanning, pinSearchInput, setPinSearchInput, scanResult, setScanResult, actionFeedback, setActionFeedback, passesList, setPassesList, filterStatus, setFilterStatus, tableSearch, setTableSearch, auditLogs, setAuditLogs, deleteModalConfig, setDeleteModalConfig, logSearch, setLogSearch, isQuickPassModalOpen, setIsQuickPassModalOpen, selectedPassForDetail, setSelectedPassForDetail, detailQrDataUrl, setDetailQrDataUrl, newPassApt, setNewPassApt, newPassVisitorName, setNewPassVisitorName, newPassVisitorPhone, setNewPassVisitorPhone, newPassPlate, setNewPassPlate, newPassHours, setNewPassHours, newPassNote, setNewPassNote, createdQuickPass, setCreatedQuickPass, createdQrUrl, setCreatedQrUrl, setActiveTab, apartments, videoRef, canvasRef, fileInputRef, animationFrameId, refreshData, showFeedback, handleVerify, handleCheckIn, handleCheckOut, handleDeletePass, handleClearAllData, scanVideoFrame, startCamera, stopCamera, handleImageUpload, openPassDetail, handleCreateQuickPass, resetQuickPassForm, totalPasses, inBuildingCount, pendingCount, completedCount, expiredCount, filteredPasses, filteredLogs, visitorResource };
  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {visitorResource.loading && <ResourceSkeleton label="Đang tải dữ liệu khách ra vào..." />}
      {!visitorResource.loading && visitorResource.error && (
        <ResourceError message={visitorResource.error} onRetry={visitorResource.retry} />
      )}
      {!visitorResource.loading && !visitorResource.error && (visitorResource.data?.passes?.length ?? 0) === 0 && (
        <ResourceEmpty message="Chưa có thẻ khách thăm nào trong hệ thống." />
      )}
      
      {/* Toast Feedback Notification */}
      {actionFeedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-none shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn border ${
          actionFeedback.type === 'error'
            ? 'bg-rose-950/95 border-rose-500 text-rose-200'
            : actionFeedback.type === 'info'
            ? 'bg-[#1E293B] border-sky-400 text-sky-200'
            : 'bg-[#121E19] border-emerald-500 text-emerald-200'
        }`}>
          {actionFeedback.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : actionFeedback.type === 'info' ? (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* 1. HEADER & CHỐT KIỂM SOÁT TIẾP ĐÓN                           */}
      {/* ============================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div className="min-w-0 flex-1 pr-2">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" /> {isEn ? 'Skyline Resident Care • Reception & Guest Services' : 'VinHomes Manager • Bộ Phận Lễ Tân & Tiếp Đón'}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {isEn ? 'Reception & Visitor Verification' : 'Đón Tiếp & Kiểm Tra Khách Thăm'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 max-w-2xl">
            {isEn ? 'Verify visitor access authorized by residents. Welcoming via QR code, PIN pass, or issue passes at the reception desk.' : 'Xác thực thông tin khách thăm theo bảo lãnh của cư dân. Tiếp đón thuận tiện qua mã QR, mã PIN hoặc cấp thẻ trực tiếp tại quầy lễ tân.'}
          </p>
        </div>

        {/* Nút hành động nhanh trên Header - KHÔNG WRAP ĐỂ KHÔNG BỊ RỚT NÚT LÀM MỚI */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Checkpoint selector */}
          <div className="flex items-center gap-2 bg-[#121820] border border-[#2D3748] px-3 py-1.5 text-xs shrink-0">
            <span className="text-gray-400 font-medium">{isEn ? 'Station:' : 'Chốt:'}</span>
            <select
              value={selectedCheckpoint}
              onChange={(e) => setSelectedCheckpoint(e.target.value)}
              className="bg-transparent text-[#C5A880] font-bold outline-none cursor-pointer"
            >
              <option value="Sảnh Tiếp Tân Tầng 1 (Chung Cư Skyline)" className="bg-[#121820] text-white">
                Sảnh Tiếp Tân Tầng 1
              </option>
              <option value="Cổng An Ninh Kiểm Soát Chính" className="bg-[#121820] text-white">
                Cổng An Ninh Kiểm Soát Chính
              </option>
              <option value="Trạm Kiểm Soát Hầm Xe B1" className="bg-[#121820] text-white">
                Trạm Kiểm Soát Hầm Xe B1
              </option>
              <option value="Trạm Kiểm Soát Hầm Xe B2" className="bg-[#121820] text-white">
                Trạm Kiểm Soát Hầm Xe B2
              </option>
            </select>
          </div>

          {/* Nút Cấp Thẻ Khách Nhanh */}
          <button
            type="button"
            onClick={() => setIsQuickPassModalOpen(true)}
            className="px-3.5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none shadow flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Cấp Thẻ Tại Quầy
          </button>

          {/* Nút Làm mới */}
          <button
            type="button"
            onClick={() => {
              refreshData();
              showFeedback('Đã làm mới dữ liệu khách thăm!');
            }}
            className="p-2 bg-[#121820] hover:bg-[#1C2533] text-gray-300 hover:text-[#C5A880] border border-[#2D3748] rounded-none transition-colors cursor-pointer shrink-0"
            title={isEn ? 'Refresh data' : 'Làm mới dữ liệu'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. 4 THẺ THỐNG KÊ NHANH (KPI STATS) - CLICK VÀO ĐỂ LỌC NHANH   */}
      {/* ============================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div 
          onClick={() => { setFilterStatus('ALL'); setActiveTab('LIST'); }}
          className={`p-3.5 border transition-all cursor-pointer ${
            filterStatus === 'ALL' && activeTab === 'LIST'
              ? 'bg-[#1C2533] border-[#C5A880] shadow-lg'
              : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
          }`}
        >
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C5A880]" /> Tổng Khách Thăm
            </span>
            <span className="text-[9.5px] font-mono text-gray-400">{isEn ? 'All' : 'Tất cả'}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalPasses}</div>
          <div className="text-[10.5px] text-gray-400 mt-0.5">{t('Nhấp để xem danh sách', 'Click to view list')}</div>
        </div>

        <div 
          onClick={() => { setFilterStatus('CHECKED_IN'); setActiveTab('LIST'); }}
          className={`p-3.5 border transition-all cursor-pointer relative overflow-hidden ${
            filterStatus === 'CHECKED_IN' && activeTab === 'LIST'
              ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-[#121820] border-[#222B35] hover:border-emerald-500/60'
          }`}
        >
          <div className="text-[11px] text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <LogIn className="w-3.5 h-3.5 text-emerald-400" /> Đang Trong Tòa Nhà
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{inBuildingCount}</div>
          <div className="text-[10.5px] text-emerald-400/80 mt-0.5">{t('Khách đang thăm căn hộ', 'Visitors currently in building')}</div>
        </div>

        <div 
          onClick={() => { setFilterStatus('ACTIVE'); setActiveTab('LIST'); }}
          className={`p-3.5 border transition-all cursor-pointer ${
            filterStatus === 'ACTIVE' && activeTab === 'LIST'
              ? 'bg-amber-950/60 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-[#121820] border-[#222B35] hover:border-amber-500/60'
          }`}
        >
          <div className="text-[11px] text-amber-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Chờ Khách Đến
            </span>
            <span className="text-[9.5px] font-mono text-amber-400">{isEn ? 'Expected' : 'Chưa đến'}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{pendingCount}</div>
          <div className="text-[10.5px] text-amber-400/80 mt-0.5">{t('Mã thẻ còn thời hạn hiệu lực', 'Active valid passes')}</div>
        </div>

        <div 
          onClick={() => { setFilterStatus('COMPLETED'); setActiveTab('LIST'); }}
          className={`p-3.5 border transition-all cursor-pointer ${
            filterStatus === 'COMPLETED' && activeTab === 'LIST'
              ? 'bg-[#1E293B] border-sky-400 shadow'
              : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
          }`}
        >
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5 text-gray-400" /> Đã Rời Đi
            </span>
            <span className="text-[9.5px] font-mono text-gray-400">{isEn ? 'Completed' : 'Hoàn tất'}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-gray-300 mt-1">{completedCount}</div>
          <div className="text-[10.5px] text-gray-400 mt-0.5">{t('Đã hoàn tất chuyến thăm', 'Visit concluded')}</div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. THANH TAB ĐIỀU HƯỚNG CHỨC NĂNG (DỄ DÀNG CHUYỂN ĐỔI)         */}
      {/* ============================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222B35] pt-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'LIST'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121820]'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>{t('Danh Sách Khách Thăm', 'Visitor List')} ({filteredPasses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SCANNER')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'SCANNER'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121820]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t('Kiểm Tra Mã QR & Tra Cứu PIN', 'Scan QR & Check PIN')}</span>
            {scanResult && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'AUDIT_LOGS'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121820]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('Lịch Sử Đón Tiếp', 'Access Logs')} ({auditLogs.length})</span>
          </button>
        </div>

        {/* Nút chuyển chế độ xem (Bảng / Thẻ) & Dọn dẹp dữ liệu */}
        {activeTab === 'LIST' && (
          <div className="flex items-center gap-2 pb-2 flex-wrap">
            <button
              type="button"
              onClick={handleClearAllData}
              className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-[11px] font-mono transition-all flex items-center gap-1"
              title={isEn ? 'Purge expired visitor passes from database' : 'Xóa toàn bộ thẻ khách đã hết hạn khỏi cơ sở dữ liệu'}
            >
              <span>🗑️ {t('Dọn Thẻ Hết Hạn', 'Purge Expired')}</span>
            </button>

            <div className="flex items-center gap-1.5 pl-1 border-l border-[#222B35]">
              <span className="text-[11px] text-gray-400 mr-1">{isEn ? 'View:' : 'Hiển thị:'}</span>
              <button
                type="button"
                onClick={() => setViewLayout('TABLE')}
                className={`p-1.5 border transition-all cursor-pointer ${
                  viewLayout === 'TABLE'
                    ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880]'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border-[#2D3748]'
                }`}
                title={isEn ? 'Detailed table view' : 'Dạng bảng chi tiết'}
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('CARDS')}
                className={`p-1.5 border transition-all cursor-pointer ${
                  viewLayout === 'CARDS'
                    ? 'bg-[#C5A880] text-[#0D1117] border-[#C5A880]'
                    : 'bg-[#161B22] text-gray-400 hover:text-white border-[#2D3748]'
                }`}
                title={isEn ? 'Card profile view' : 'Dạng thẻ hồ sơ trực quan'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* TAB 1: DANH SÁCH & QUẢN LÝ KHÁCH THĂM (TABLE / CARDS)          */}
      {/* ============================================================= */}
      <VisitorListTabView ctx={visitorCtx} />
      <VisitorScannerTabView ctx={visitorCtx} />
      <VisitorAuditAndModals ctx={visitorCtx} />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalConfig.onConfirm}
        title={deleteModalConfig.title}
        message={deleteModalConfig.message}
        itemCode={deleteModalConfig.itemCode}
        itemName={deleteModalConfig.itemName}
      />

    </div>
  );
}
