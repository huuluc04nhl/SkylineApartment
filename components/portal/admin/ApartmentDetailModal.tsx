'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React, { useState } from 'react';
import { 
  X, 
  Building, 
  Layers, 
  Home, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Phone, 
  Mail, 
  CreditCard, 
  Car, 
  Users, 
  Wrench, 
  ShieldCheck, 
  Sparkles, 
  Key, 
  Compass, 
  Maximize2, 
  Calendar, 
  FileText, 
  Edit, 
  UserPlus, 
  Check, 
  RefreshCw,
  Eye,
  AlertTriangle,
  FileCheck2,
  Zap,
  Droplets,
  Trash2,
  ShieldAlert,
  ScanFace
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/languageContext';
import { 
  ApartmentUnit, 
  updateApartmentBillingStatus, 
  evictApartmentResident,
  approveFamilyMemberByBql,
  rejectFamilyMemberByBql,
  addFamilyMemberByBql,
  removeFamilyMemberByBql,
  getApartmentByCode
} from '@/lib/apartmentStore';
import { ApartmentMember, getApartmentMembers } from '@/lib/userStore';
import ConfirmDeleteModal from '@/components/portal/shared/ConfirmDeleteModal';
import { getPhoneValidationError, getCccdValidationError } from '@/lib/validationUtils';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';

interface ApartmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ApartmentUnit | null;
  onEditUnit: (unit: ApartmentUnit) => void;
  onAssignResident: (unit: ApartmentUnit) => void;
  onRefresh: () => void;
}

type DetailTab = 'OVERVIEW_3D' | 'RESIDENT_MEMBERS' | 'VEHICLES' | 'BILLING' | 'MAINTENANCE';

export default function ApartmentDetailModal({
  isOpen,
  onClose,
  unit,
  onEditUnit,
  onAssignResident,
  onRefresh
}: ApartmentDetailModalProps) {
  useEscapeKey(isOpen, onClose);
  const { t, isEn } = useLanguage();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<DetailTab>('OVERVIEW_3D');
  const [isUpdatingBill, setIsUpdatingBill] = useState(false);
  const [isConfirmingEvict, setIsConfirmingEvict] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Realtime Family Members State
  const [membersList, setMembersList] = useState<ApartmentMember[]>(() => {
    return unit ? getApartmentMembers(unit.code) : [];
  });

  // Modal thÃªm ngÆ°á»i nhÃ  tá»« BQL
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemName, setNewMemName] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemCccd, setNewMemCccd] = useState('');
  const [newMemRel, setNewMemRel] = useState('Vá»£ / Chá»“ng');
  const [newMemPlate, setNewMemPlate] = useState('');
  const [newMemAutoApprove, setNewMemAutoApprove] = useState(true);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Modal tá»« chá»‘i / yÃªu cáº§u bá»• sung
  const [rejectingMember, setRejectingMember] = useState<ApartmentMember | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('áº¢nh chá»¥p CCCD bá»‹ má»/lÃ³a sÃ¡ng, Ä‘á» nghá»‹ quÃ©t láº¡i rÃµ nÃ©t');
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<{ id: string; name: string } | null>(null);

  // Äá»“ng bá»™ danh sÃ¡ch ngÆ°á»i nhÃ  thá»i gian thá»±c
  const refreshMembers = () => {
    if (!unit) return;
    const currentMems = getApartmentMembers(unit.code);
    setMembersList(currentMems);
  };

  React.useEffect(() => {
    if (!unit) return;
    refreshMembers();

    const handleSync = () => {
      refreshMembers();
    };

    window.addEventListener('skyline_family_updated', handleSync);
    window.addEventListener('skyline_ekyc_updated', handleSync);
    window.addEventListener('skyline_apartments_updated', handleSync);

    return () => {
      window.removeEventListener('skyline_family_updated', handleSync);
      window.removeEventListener('skyline_ekyc_updated', handleSync);
      window.removeEventListener('skyline_apartments_updated', handleSync);
    };
  }, [unit?.code]);

  if (!isOpen || !unit) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // 1. BQL Duyá»‡t NgÆ°á»i NhÃ 
  const handleApproveMember = (memberId: string, memberName: string) => {
    approveFamilyMemberByBql(unit.code, memberId, 'VinHomes Manager');
    refreshMembers();
    onRefresh();
    showToast(`âœ“ ÄÃ£ phÃª duyá»‡t vÃ  kÃ­ch hoáº¡t quyá»n FaceID cho "${memberName}" thÃ nh cÃ´ng!`);
  };

  // 2. BQL YÃªu Cáº§u Chá»¥p Láº¡i / Tá»« Chá»‘i
  const handleConfirmRejectMember = () => {
    if (!rejectingMember) return;
    rejectFamilyMemberByBql(unit.code, rejectingMember.id, rejectReasonInput, 'VinHomes Manager');
    showToast(`âœ“ ÄÃ£ gá»­i yÃªu cáº§u bá»• sung há»“ sÆ¡ tá»›i "${rejectingMember.fullName}".`);
    setRejectingMember(null);
    refreshMembers();
    onRefresh();
  };

  // 3. BQL Thu há»“i quyá»n cÆ° trÃº / XÃ³a ngÆ°á»i nhÃ 
  const handleRemoveMember = (memberId: string, memberName: string) => {
    setDeleteMemberTarget({ id: memberId, name: memberName });
  };

  const confirmDeleteMember = () => {
    if (!deleteMemberTarget) return;
    removeFamilyMemberByBql(unit.code, deleteMemberTarget.id);
    refreshMembers();
    onRefresh();
    showToast(`âœ“ ÄÃ£ xÃ³a thÃ nh viÃªn "${deleteMemberTarget.name}" khá»i cÄƒn há»™.`);
    setDeleteMemberTarget(null);
  };

  // 4. BQL ThÃªm NgÆ°á»i NhÃ  Trá»±c Tiáº¿p
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemName.trim()) {
      setAddMemberError('Vui lÃ²ng nháº­p há» vÃ  tÃªn thÃ nh viÃªn.');
      return;
    }
    const phoneErr = getPhoneValidationError(newMemPhone);
    if (phoneErr) {
      setAddMemberError(phoneErr);
      return;
    }
    if (newMemCccd.trim()) {
      const cccdErr = getCccdValidationError(newMemCccd);
      if (cccdErr) {
        setAddMemberError(cccdErr);
        return;
      }
    }

    const newMemberItem: ApartmentMember = {
      id: `mem-${Date.now()}`,
      username: newMemPhone.trim(),
      fullName: newMemName.trim(),
      role: 'Family',
      relationship: newMemRel,
      phone: newMemPhone.trim(),
      idCard: newMemCccd.trim(),
      licensePlate: newMemPlate.trim(),
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newMemName.trim())}&background=1C2533&color=C5A880`,
      faceStatus: newMemAutoApprove ? 'ÄÃ£ KÃ­ch Hoáº¡t FaceID' : 'Äang Chá» BQL PhÃª Duyá»‡t',
      addedDate: new Date().toLocaleDateString('vi-VN'),

      // ThÃ´ng tin Ä‘á»“ng bá»™ chuáº©n phÃ¹ há»£p vá»›i Chá»§ Há»™ báº£o lÃ£nh:
      apartmentCode: unit.code,
      tower: unit.tower,
      sponsorName: unit.owner?.name || 'Chá»§ Há»™',
      sponsorPhone: unit.owner?.phone || '',
      residenceType: 'ThÆ°á»ng trÃº cÃ¹ng chá»§ há»™',
      temporaryResidenceStatus: newMemAutoApprove ? 'ÄÃ£ ÄÄƒng KÃ½ Táº¡m TrÃº' : 'Äang LÃ m Thá»§ Tá»¥c',
      relationshipProof: 'VÄƒn báº£n báº£o lÃ£nh chá»§ há»™ tiáº¿p nháº­n táº¡i quáº§y BQL',
      accessLevel: 'ToÃ n quyá»n (CÄƒn há»™ + Thang mÃ¡y + Tiá»‡n Ã­ch VIP)',
      startDate: new Date().toLocaleDateString('vi-VN'),
    };

    addFamilyMemberByBql(unit.code, newMemberItem, newMemAutoApprove);
    setShowAddMemberModal(false);
    setNewMemName('');
    setNewMemPhone('');
    setNewMemCccd('');
    setNewMemRel('Vá»£ / Chá»“ng');
    setNewMemPlate('');
    setAddMemberError(null);
    refreshMembers();
    onRefresh();
    showToast(
      newMemAutoApprove 
        ? `âœ“ ÄÃ£ thÃªm "${newMemberItem.fullName}" & cáº¥p quyá»n FaceID thÃ nh cÃ´ng!`
        : `âœ“ ÄÃ£ tiáº¿p nháº­n há»“ sÆ¡ "${newMemberItem.fullName}" vÃ o danh sÃ¡ch chá» duyá»‡t.`
    );
  };

  const handleToggleBilling = () => {
    if (!unit.billing) return;
    setIsUpdatingBill(true);
    const newStatus = unit.billing.status === 'PAID' ? 'UNPAID' : 'PAID';
    updateApartmentBillingStatus(unit.code, newStatus);
    setIsUpdatingBill(false);
    showToast(newStatus === 'PAID' ? 'âœ“ ÄÃ£ xÃ¡c nháº­n thanh toÃ¡n phÃ­ quáº£n lÃ½ thÃ nh cÃ´ng!' : 'âœ“ ÄÃ£ chuyá»ƒn tráº¡ng thÃ¡i hÃ³a Ä‘Æ¡n vá» ChÆ°a Thanh ToÃ¡n.');
    onRefresh();
  };

  const handleEvict = () => {
    const blockCodeMatch = unit.towerName?.match(/BS-\d+/)?.[0] || 'BS-07';
    evictApartmentResident(unit.code, blockCodeMatch);
    setIsConfirmingEvict(false);
    showToast(`âœ“ ÄÃ£ thu há»“i cÄƒn há»™ ${unit.code} vá» tráº¡ng thÃ¡i CÄƒn Trá»‘ng.`);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0D1117] border border-[#C5A880]/80 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white rounded-none">
        
        {/* ============================================================= */}
        {/* 1. MODAL HEADER                                               */}
        {/* ============================================================= */}
        <div className="p-4 sm:p-5 bg-[#121820] border-b border-[#222B35] flex items-start justify-between gap-4 select-none">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold">
              <Building className="w-3.5 h-3.5" />
              <span>{t('Há»“ SÆ¡ CÄƒn Há»™ â€¢ Chung CÆ° Skyline', 'Apartment Profile â€¢ Skyline Residence')}</span>
              <span>â€¢</span>
              <span>{t('Táº§ng', 'Floor')} {unit.floor}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
                {t('CÄƒn Há»™', 'Apartment')} {unit.code}
              </h2>
              
              {/* Badges */}
              <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-none border shadow-sm flex items-center gap-1 font-mono ${
                unit.status === 'OCCUPIED'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : unit.status === 'MAINTENANCE'
                  ? 'bg-purple-950 text-purple-300 border-purple-500'
                  : 'bg-amber-950 text-amber-300 border-amber-500'
              }`}>
                {unit.status === 'OCCUPIED' ? <CheckCircle2 className="w-3 h-3" /> : <Key className="w-3 h-3" />}
                {t(unit.statusLabel)}
              </span>

              <span className="px-2 py-0.5 text-xs bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-semibold">
                {t(unit.typeLabel)}
              </span>

              <span className="text-xs text-gray-400">
                {t('Diá»‡n tÃ­ch:', 'Area:')} <strong className="text-white font-mono">{unit.area} mÂ²</strong> ({t('ThÃ´ng thá»§y', 'Net usable')})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onEditUnit(unit)}
                className="px-3 py-1.5 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] text-xs font-semibold rounded-none transition-all flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">{t('Chá»‰nh Sá»­a', 'Edit')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#161B22] transition-colors rounded-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================= */}
        {/* 2. TAB SELECTOR BAR                                           */}
        {/* ============================================================= */}
        <div className="flex items-center gap-1 px-4 sm:px-5 bg-[#0F141C] border-b border-[#222B35] overflow-x-auto text-xs font-mono select-none">
          {[
            { id: 'OVERVIEW_3D', label: t('1. Phá»‘i Cáº£nh & ThÃ´ng Sá»‘', '1. 3D View & Specs'), icon: Maximize2 },
            { id: 'RESIDENT_MEMBERS', label: `${t('2. CÆ° DÃ¢n & NhÃ¢n Kháº©u', '2. Residents & Occupants')} (${unit.membersCount})`, icon: Users },
            { id: 'VEHICLES', label: `${t('3. Xe Cá»™ & Tháº» Háº§m', '3. Vehicles & Parking Passes')} (${unit.vehicles?.length || 0})`, icon: Car },
            { id: 'BILLING', label: t('4. PhÃ­ Quáº£n LÃ½ & HÃ³a ÄÆ¡n', '4. Management Fees & Invoices'), icon: CreditCard },
            { id: 'MAINTENANCE', label: `${t('5. Lá»‹ch Sá»­ Ká»¹ Thuáº­t', '5. Technical & Maintenance History')} (${unit.maintenanceHistory?.length || 0})`, icon: Wrench }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3 whitespace-nowrap font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#121820]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/80 px-4 py-2 text-xs text-emerald-200 font-medium flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {successToast}
            </span>
            <button type="button" onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* 3. TAB CONTENTS BODY                                          */}
        {/* ============================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ----------------------------------------------------------- */}
          {/* TAB 1: SÆ  Äá»’ 3D Máº¶T Báº°NG & THÃ”NG Sá» Ká»¸ THUáº¬T               */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'OVERVIEW_3D' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Khá»‘i nhÃºng trá»±c quan 3D Floor Plan Viewer */}
              <div className="border border-[#222B35] bg-[#05070A] overflow-hidden">
                <div className="p-3 bg-[#121820] border-b border-[#222B35] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#C5A880] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> {t('Phá»‘i Cáº£nh KhÃ´ng Gian Ná»™i Tháº¥t CÄƒn Há»™', '3D Interior Perspective of Apartment')} {unit.code}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {t('Phá»‘i cáº£nh phÃ²ng khÃ¡ch, phÃ²ng ngá»§ Master, báº¿p, ban cÃ´ng', 'Perspective of living room, master bedroom, kitchen, balcony')}
                  </span>
                </div>
                <div className="h-[360px] sm:h-[420px] w-full relative">
                  <ApartmentModel3DViewer
                    apartmentCode={unit.code}
                    apartmentType={unit.typeLabel}
                    clearArea={unit.area}
                    interactive={true}
                  />
                </div>
              </div>

              {/* Báº£ng thÃ´ng sá»‘ chi tiáº¿t & tiÃªu chuáº©n ká»¹ thuáº­t */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#121820] border border-[#222B35]">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">{t('Diá»‡n TÃ­ch ThÃ´ng Thá»§y', 'Net Usable Area')}</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{unit.area} mÂ²</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{t('Tim tÆ°á»ng:', 'Gross area:')} {unit.wallArea} mÂ²</div>
                </div>

                <div className="p-3.5 bg-[#121820] border border-[#222B35]">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">{t('Cáº¥u TrÃºc PhÃ²ng', 'Room Configuration')}</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{unit.bedrooms} {t('PN', 'Beds')} â€¢ {unit.bathrooms} {t('WC', 'Baths')}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{t('Báº¿p má»Ÿ + Ban cÃ´ng riÃªng', 'Open kitchen + Private balcony')}</div>
                </div>

                <div className="p-3.5 bg-[#121820] border border-[#222B35]">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">{t('HÆ°á»›ng Ban CÃ´ng / Cá»­a', 'Balcony / Door Orientation')}</div>
                  <div className="text-xl font-bold font-mono text-[#C5A880] mt-0.5">{t(unit.direction)}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{t('Cá»­a chÃ­nh:', 'Main entrance:')} {t(unit.mainDoorDirection || 'TÃ¢y Báº¯c')}</div>
                </div>

                <div className="p-3.5 bg-[#121820] border border-[#222B35]">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">{t('Äá»‹nh GiÃ¡ Báº¥t Äá»™ng Sáº£n', 'Real Estate Valuation')}</div>
                  <div className="text-xl font-bold font-mono text-[#C5A880] mt-0.5">{unit.priceBillion} {t('Tá»· VNÄ', 'Billion VND')}</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">{t('PhÃ¡p lÃ½:', 'Legal:')} {t('Sá»• há»“ng lÃ¢u dÃ i', 'Long-term Pink Book Ownership')}</div>
                </div>
              </div>

              {/* MÃ´ táº£ cÄƒn há»™ & ghi chÃº ká»¹ thuáº­t */}
              <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
                <div className="text-xs uppercase tracking-wider text-gray-300 font-bold font-mono">
                  {t('MÃ´ Táº£ Tiá»‡n Ãch BÃ n Giao', 'Handover Amenities & Specifications')}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {unit.description || t('CÄƒn há»™ trang bá»‹ Smart Home Hub, khÃ³a FaceID, chuÃ´ng hÃ¬nh cáº£m á»©ng vÃ  kÃ­nh cÃ¡ch Ã¢m.', 'Apartment equipped with Smart Home Hub, FaceID door lock, video intercom, and soundproof glass.')}
                </p>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 2: CÆ¯ DÃ‚N & NHÃ‚N KHáº¨U                                   */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'RESIDENT_MEMBERS' && (
            <div className="space-y-5 animate-fadeIn">
              
              {unit.status === 'OCCUPIED' && unit.owner ? (
                <>
                  {/* Tháº» thÃ´ng tin chá»§ há»™ chÃ­nh thá»©c */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161D26] to-[#121820] border border-emerald-500/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        {t('Chá»§ Sá»Ÿ Há»¯u / Chá»§ Há»™ Äang Sinh Sá»‘ng', 'Primary Owner / Currently Living')}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500">
                          {t('e-KYC ÄÃ£ XÃ¡c Thá»±c âœ“', 'e-KYC Verified âœ“')}
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setIsConfirmingEvict(true)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600 transition-colors"
                          >
                            {t('Thu Há»“i / CÆ° DÃ¢n Chuyá»ƒn Äi', 'Revoke / Resident Relocation')}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <img
                        src={unit.owner.avatar || unit.owner.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(unit.owner.name)}&background=1C2533&color=C5A880`}
                        alt={unit.owner.name}
                        className="w-16 h-16 object-cover border-2 border-emerald-500/80 shadow-md"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-serif text-xl font-bold text-white">
                          {unit.owner.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#C5A880]" /> {unit.owner.phone}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#C5A880]" /> {unit.owner.email}
                          </span>
                          <span className="flex items-center gap-1.5 font-mono">
                            <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" /> {t('CCCD:', 'ID:')} {unit.owner.cccd}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#222B35] text-xs">
                      <div>
                        <span className="text-gray-400">{t('NgÃ y BÃ n Giao:', 'Handover Date:')}</span>{' '}
                        <strong className="text-white font-mono">{unit.owner.handoverDate || t('ChÆ°a cáº­p nháº­t', 'Not updated')}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('NgÃ y Sinh:', 'Date of Birth:')}</span>{' '}
                        <strong className="text-white">{unit.owner.dob || t('ChÆ°a cáº­p nháº­t', 'Not updated')}</strong>
                      </div>
                      <div className="truncate">
                        <span className="text-gray-400">{t('NÆ¡i Cáº¥p:', 'Issue Place:')}</span>{' '}
                        <strong className="text-white">{unit.owner.pob || t('ChÆ°a cáº­p nháº­t', 'Not updated')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* BiÃªn Báº£n BÃ n Giao Ká»¹ Thuáº­t (Smart Handover Protocol) */}
                  {(unit.handoverProtocol || unit.owner?.handoverProtocol) && (
                    <div className="p-4 bg-[#161B22] border border-[#C5A880]/60 space-y-2.5">
                      <div className="font-mono text-xs text-[#C5A880] uppercase tracking-wider flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-[#C5A880]" /> {t('Há»“ SÆ¡ BiÃªn Báº£n BÃ n Giao CÄƒn Há»™', 'Apartment Handover Protocol Dossier')}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500 text-[10px] font-mono">
                          {t('âœ“ ÄÃƒ NGHIá»†M THU', 'âœ“ ACCEPTED')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 bg-[#0D1117] border border-[#222B35]">
                          <span className="text-gray-400 block text-[10px]">{t('MÃ£ BiÃªn Báº£n BQL:', 'Management Protocol Code:')}</span>
                          <strong className="text-[#C5A880]">
                            {unit.handoverProtocol?.protocolCode || unit.owner?.handoverProtocol?.protocolCode}
                          </strong>
                        </div>
                        <div className="p-2 bg-[#0D1117] border border-[#222B35]">
                          <span className="text-gray-400 block text-[10px]">{t('CÃ¡n Bá»™ BÃ n Giao:', 'Handover Officer:')}</span>
                          <strong className="text-white">
                            {unit.handoverProtocol?.handoverOfficer || unit.owner?.handoverProtocol?.handoverOfficer || t('BQL Chung CÆ°', 'Building Management')}
                          </strong>
                        </div>
                        <div className="p-2 bg-[#0D1117] border border-[#222B35]">
                          <span className="text-gray-400 block text-[10px]">{t('ChÃ¬a KhÃ³a CÆ¡ & Tháº» Tá»«:', 'Keys & RFID Cards:')}</span>
                          <strong className="text-emerald-400">
                            {unit.handoverProtocol?.keysCount ?? 3} {t('ChÃ¬a cÆ¡', 'Keys')} â€¢ {unit.handoverProtocol?.cardsCount ?? 2} {t('Tháº» tá»« RFID', 'RFID Cards')}
                          </strong>
                        </div>
                        <div className="p-2 bg-[#0D1117] border border-[#222B35]">
                          <span className="text-gray-400 block text-[10px]">{t('Chá»‰ Sá»‘ BÃ n Giao Ban Äáº§u:', 'Initial Handover Meters:')}</span>
                          <strong className="text-amber-400">
                            âš¡ {unit.handoverProtocol?.initialElectricMeter ?? 0} kWh â€¢ ðŸ’§ {unit.handoverProtocol?.initialWaterMeter ?? 0} mÂ³
                          </strong>
                        </div>
                      </div>

                      {(unit.handoverProtocol?.notes || unit.owner?.handoverProtocol?.notes) && (
                        <div className="text-[11px] text-gray-300 p-2 bg-[#0D1117] border border-[#222B35] leading-relaxed">
                          <span className="text-gray-400">{t('Ghi chÃº hiá»‡n tráº¡ng nghiá»‡m thu:', 'Handover inspection notes:')}</span>{' '}
                          {unit.handoverProtocol?.notes || unit.owner?.handoverProtocol?.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Há»™p xÃ¡c nháº­n thu há»“i cÄƒn há»™ */}
                  {isConfirmingEvict && (
                    <div className="p-4 bg-rose-950/90 border border-rose-500 text-rose-200 text-xs space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        {t('XÃ¡c Nháº­n Thu Há»“i CÄƒn Há»™', 'Confirm Revoking Apartment')} {unit.code} & {t('Chuyá»ƒn Vá» CÄƒn Trá»‘ng?', 'Reset to Vacant?')}
                      </div>
                      <p className="leading-relaxed">
                        {t('Thao tÃ¡c nÃ y sáº½ giáº£i phÃ³ng tráº¡ng thÃ¡i cÆ° trÃº cá»§a cÄƒn há»™, gá»¡ bá» thÃ´ng tin cÆ° dÃ¢n hiá»‡n táº¡i vÃ  chuyá»ƒn mÃ£ cÄƒn sang tráº¡ng thÃ¡i CÄ‚N Há»˜ TRá»NG sáºµn sÃ ng bÃ n giao cho chá»§ má»›i.', 'This action will release the residency status, detach the current resident info and set the unit to VACANT ready for handover to a new owner.')}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleEvict}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase text-[11px] transition-colors"
                        >
                          {t('XÃ¡c Nháº­n Thu Há»“i CÄƒn Há»™', 'Confirm Revoking Apartment')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingEvict(false)}
                          className="px-3 py-1.5 bg-black/50 hover:bg-black text-gray-300 hover:text-white border border-gray-600 text-[11px] transition-colors"
                        >
                          {t('Há»§y Bá»', 'Cancel')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Danh sÃ¡ch thÃ nh viÃªn gia Ä‘Ã¬nh (nhÃ¢n kháº©u) */}
                  <div className="space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#222B35]">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-cyan-400" />
                          {t('NhÃ¢n Kháº©u & NgÆ°á»i NhÃ  CÃ¹ng CÆ° TrÃº', 'Co-occupants & Family Members')} ({membersList.length} {t('ngÆ°á»i thÃ¢n', 'members')})
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 font-mono">
                          <span>{t('Tá»•ng sá»‘:', 'Total:')} <strong className="text-white">{1 + membersList.length}</strong></span>
                          <span>â€¢</span>
                          <span className="text-emerald-400">{t('ÄÃ£ cáº¥p FaceID:', 'FaceID Active:')} <strong>{1 + membersList.filter(m => m.faceStatus.includes('ÄÃ£')).length}</strong></span>
                          <span>â€¢</span>
                          <span className="text-amber-400">{t('Chá» BQL duyá»‡t:', 'Pending BQL:')} <strong>{membersList.filter(m => m.faceStatus.includes('Chá» BQL') || m.faceStatus.includes('Chá»') || !m.faceStatus.includes('ÄÃ£')).length}</strong></span>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddMemberModal(true);
                            setAddMemberError(null);
                          }}
                          className="px-3 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all shadow active:scale-95 cursor-pointer self-start sm:self-auto"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#0D1117]" />
                          <span>{t('ÄÄƒng KÃ½ NgÆ°á»i NhÃ ', 'Add Family Member')}</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {membersList && membersList.length > 0 ? (
                        membersList.map(member => {
                          const isApproved = member.faceStatus.includes('ÄÃ£');
                          const isPending = member.faceStatus.includes('Chá»') || !isApproved;
                          const isRejected = member.faceStatus.includes('YÃªu Cáº§u') || member.faceStatus.includes('Tá»« Chá»‘i');

                          return (
                            <div key={member.id} className="p-3.5 bg-[#121820] border border-[#222B35] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#C5A880]/50 transition-colors">
                              <div className="flex items-start sm:items-center gap-3 min-w-0">
                                <img
                                  src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=1C2533&color=C5A880`}
                                  alt={member.fullName}
                                  className="w-12 h-12 object-cover border border-[#2D3748] flex-shrink-0"
                                />
                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-white text-sm">
                                      {member.fullName}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-600/60 font-semibold uppercase tracking-wider">
                                      {t(member.relationship)}
                                    </span>
                                    
                                    {/* Status Badge */}
                                    <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider flex items-center gap-1 border ${
                                      isApproved
                                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                                        : isRejected
                                        ? 'bg-rose-950 text-rose-300 border-rose-500'
                                        : 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                                    }`}>
                                      {isApproved ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                                      {t(member.faceStatus)}
                                    </span>
                                  </div>

                                  <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono">
                                    <span>{t('SÄT:', 'Tel:')} <strong className="text-gray-200">{member.phone}</strong></span>
                                    {member.idCard && <span>â€¢ {t('CCCD:', 'ID:')} <strong className="text-[#C5A880]">{member.idCard}</strong></span>}
                                    {member.licensePlate && <span>â€¢ {t('Biá»ƒn sá»‘:', 'Plate:')} <strong className="text-cyan-400">{member.licensePlate}</strong></span>}
                                    {member.dob && <span>â€¢ {t('Sinh:', 'DOB:')} <strong className="text-gray-300">{member.dob}</strong></span>}
                                  </div>

                                  <div className="text-[11px] text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-0.5">
                                    <span>{t('CÆ° trÃº:', 'Residence:')} <strong className="text-gray-200">{member.residenceType || 'ThÆ°á»ng trÃº cÃ¹ng chá»§ há»™'}</strong></span>
                                    <span>â€¢ {t('Táº¡m trÃº:', 'Status:')} <strong className="text-emerald-400">{member.temporaryResidenceStatus || 'Äang lÃ m thá»§ tá»¥c'}</strong></span>
                                    {member.addedDate && <span className="text-gray-400 font-mono">â€¢ {t('NgÃ y thÃªm:', 'Added:')} {member.addedDate}</span>}
                                  </div>
                                </div>
                              </div>

                              {/* BQL Controls */}
                              {isAdmin && (
                                <div className="flex items-center gap-2 self-start md:self-center flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-[#222B35] w-full md:w-auto justify-end">
                                  {isPending && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveMember(member.id, member.fullName)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all shadow active:scale-95 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{t('Duyá»‡t FaceID', 'Approve FaceID')}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setRejectingMember(member)}
                                        className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 font-semibold text-xs rounded-none transition-colors cursor-pointer"
                                        title={t('YÃªu cáº§u chá»¥p láº¡i / Tá»« chá»‘i')}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        <span>{t('Tá»« Chá»‘i', 'Reject')}</span>
                                      </button>
                                    </>
                                  )}

                                  {isApproved && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRejectingMember(member);
                                        setRejectReasonInput('VinHomes Manager táº¡m khÃ³a / thu há»“i quyá»n FaceID theo quy Ä‘á»‹nh');
                                      }}
                                      className="px-2.5 py-1.5 bg-[#161B22] hover:bg-[#1E2631] text-amber-400 border border-amber-600/60 font-semibold text-xs rounded-none transition-colors cursor-pointer"
                                    >
                                      {t('Táº¡m KhÃ³a Quyá»n', 'Suspend Access')}
                                    </button>
                                  )}

                                  {isRejected && (
                                    <button
                                      type="button"
                                      onClick={() => handleApproveMember(member.id, member.fullName)}
                                      className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>{t('Duyá»‡t Láº¡i', 'Re-approve')}</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(member.id, member.fullName)}
                                    className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-950 border border-rose-900/40 rounded-none transition-colors cursor-pointer"
                                    title={t('XÃ³a thÃ nh viÃªn khá»i cÄƒn há»™', 'Remove from apartment')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-gray-500 text-xs bg-[#121820] border border-[#222B35] space-y-2">
                          <Users className="w-8 h-8 text-gray-600 mx-auto" />
                          <p>{t('ChÆ°a Ä‘Äƒng kÃ½ thÃªm thÃ nh viÃªn gia Ä‘Ã¬nh cho cÄƒn há»™ nÃ y.', 'No family members registered for this apartment yet.')}</p>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setShowAddMemberModal(true)}
                              className="text-[#C5A880] underline hover:text-white font-bold cursor-pointer"
                            >
                              + {t('ÄÄƒng kÃ½ ngÆ°á»i nhÃ  ngay', 'Register family member now')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* TRÆ¯á»œNG Há»¢P CÄ‚N TRá»NG */
                <div className="p-6 bg-[#161B22] border border-amber-500/40 text-center space-y-4">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{t('CÄƒn Há»™ Hiá»‡n Äang Trá»‘ng', 'Apartment is Currently Vacant')}</h4>
                    <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                      {t('CÄƒn há»™ chÆ°a cÃ³ cÆ° dÃ¢n nháº­n bÃ n giao hoáº·c Ä‘Äƒng kÃ½ sinh sá»‘ng. Báº¡n cÃ³ thá»ƒ tiáº¿n hÃ nh bÃ n giao vÃ  gÃ¡n chá»§ sá»Ÿ há»¯u má»›i ngay bÃ¢y giá».', 'Apartment has not been handed over. You can perform handover and assign a new owner now.')}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onAssignResident(unit)}
                      className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-lg"
                    >
                      <UserPlus className="w-4 h-4" /> {t('BÃ n Giao ChÃ¬a KhÃ³a Cho Chá»§ Há»™ Má»›i', 'Handover Keys to New Owner')}
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 3: PHÆ¯Æ NG TIá»†N & THáºº Háº¦M                                */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'VEHICLES' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-[#C5A880]" />
                  {t('Danh SÃ¡ch PhÆ°Æ¡ng Tiá»‡n ÄÄƒng KÃ½ Äáº­u Táº§ng Háº§m (B1/B2)', 'Basement (B1/B2) Parking Vehicle Registry')}
                </span>
              </div>

              {unit.vehicles && unit.vehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {unit.vehicles.map(v => (
                    <div key={v.id} className="p-4 bg-[#121820] border border-[#222B35] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#161B22] border border-[#2D3748] flex items-center justify-center text-[#C5A880]">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-mono text-base font-bold text-white">
                            {v.plate}
                          </div>
                          <div className="text-xs text-gray-400">
                            {v.brand || (v.type === 'CAR' ? t('Xe Ã” tÃ´', 'Car') : t('Xe MÃ¡y', 'Motorbike'))} â€¢ {t('Vá»‹ trÃ­:', 'Slot:')} <strong className="text-[#C5A880]">{v.slot || t('Tá»± do', 'Open slot')}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono text-gray-400">
                        <div className="text-emerald-400 font-bold">{t('Äang Hoáº¡t Äá»™ng', 'Active')}</div>
                        <div className="text-[10px] text-gray-500">{v.cardNo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs bg-[#121820] border border-[#222B35] space-y-2">
                  <Car className="w-8 h-8 text-gray-600 mx-auto" />
                  <div>{t('CÄƒn há»™ chÆ°a Ä‘Äƒng kÃ½ phÆ°Æ¡ng tiá»‡n Ä‘áº­u táº¡i táº§ng háº§m.', 'No registered vehicles for basement parking.')}</div>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 4: PHÃ QUáº¢N LÃ & HÃ“A ÄÆ N                                */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'BILLING' && (
            <div className="space-y-4 animate-fadeIn">
              {unit.billing ? (
                <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-mono">{t('Ká»³ PhÃ­ Quáº£n LÃ½ & Dá»‹ch Vá»¥', 'Management Fee & Service Period')}</span>
                      <h4 className="text-lg font-bold font-serif text-white">{unit.billing.period}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-bold uppercase rounded-none border ${
                        unit.billing.status === 'PAID'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-amber-950 text-amber-300 border-amber-500'
                      }`}>
                        {unit.billing.status === 'PAID' ? t('âœ“ ÄÃ£ Thanh ToÃ¡n', 'âœ“ Paid') : t('ChÆ°a Thanh ToÃ¡n', 'Unpaid')}
                      </span>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleToggleBilling}
                          disabled={isUpdatingBill}
                          className={`px-3 py-1 text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                            unit.billing.status === 'PAID'
                              ? 'bg-[#161B22] hover:bg-[#202936] text-amber-400 border border-amber-500/50'
                              : 'bg-[#C5A880] hover:bg-white text-[#0D1117]'
                          }`}
                        >
                          {isUpdatingBill ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          {unit.billing.status === 'PAID' ? t('Äá»•i ThÃ nh ChÆ°a Ná»™p', 'Mark as Unpaid') : t('XÃ¡c Nháº­n ÄÃ£ Thu Tiá»n', 'Confirm Payment')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Báº£ng chi tiáº¿t tá»«ng khoáº£n thu */}
                  <div className="border border-[#222B35] divide-y divide-[#222B35] text-xs">
                    <div className="p-3 flex items-center justify-between bg-[#161B22]/50">
                      <span className="text-gray-300">{t('PhÃ­ quáº£n lÃ½ váº­n hÃ nh chung cÆ°', 'Building operational management fee')} ({unit.area} mÂ² x 18.500Ä‘)</span>
                      <span className="font-mono font-bold text-white">{unit.billing.monthlyFee.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'Ä‘'}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between bg-[#161B22]/50">
                      <span className="text-gray-300">{t('PhÃ­ trÃ´ng giá»¯ phÆ°Æ¡ng tiá»‡n táº§ng háº§m', 'Basement vehicle parking fee')}</span>
                      <span className="font-mono font-bold text-white">{unit.billing.parkingFee.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'Ä‘'}</span>
                    </div>
                    <div className="p-3 flex items-center justify-between bg-[#161B22]/50">
                      <span className="text-gray-300">{t('PhÃ­ dá»‹ch vá»¥ tiá»‡n Ã­ch phÃ¡t sinh', 'Incidental utility service fees')}</span>
                      <span className="font-mono font-bold text-white">{unit.billing.serviceFee.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'Ä‘'}</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between bg-[#1C2533] font-bold">
                      <span className="text-white uppercase tracking-wider font-mono">{t('Tá»•ng Cá»™ng Cáº§n Thu', 'Total Due')}</span>
                      <span className="font-mono text-base text-[#C5A880]">{unit.billing.totalAmount.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'Ä‘'}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                    <span>{t('Háº¡n ná»™p Ä‘á»‹nh ká»³:', 'Due date:')} <strong className="text-white font-mono">{unit.billing.dueDate}</strong></span>
                    {unit.billing.lastPaidDate && (
                      <span>{t('NgÃ y ná»™p gáº§n nháº¥t:', 'Last payment date:')} <strong className="text-emerald-400 font-mono">{unit.billing.lastPaidDate}</strong></span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 text-xs bg-[#121820] border border-[#222B35]">
                  {t('ChÆ°a phÃ¡t sinh báº£ng kÃª hÃ³a Ä‘Æ¡n cho cÄƒn há»™ nÃ y.', 'No billing invoices generated yet for this apartment.')}
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 5: Lá»ŠCH Sá»¬ Ká»¸ THUáº¬T & Báº¢O TRÃŒ                           */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'MAINTENANCE' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-[#C5A880]" />
                  {t('Nháº­t KÃ½ Kiá»ƒm Tra Ká»¹ Thuáº­t & Báº£o TrÃ¬ Äá»‹nh Ká»³', 'Technical Inspection & Maintenance Log')}
                </span>
              </div>

              {unit.maintenanceHistory && unit.maintenanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {unit.maintenanceHistory.map(rec => (
                    <div key={rec.id} className="p-4 bg-[#121820] border border-[#222B35] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{t(rec.title)}</span>
                          <span className={`text-[10px] px-2 py-0.5 uppercase font-mono border ${
                            rec.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-amber-950 text-amber-300 border-amber-600'
                          }`}>
                            {rec.status === 'COMPLETED' ? t('ÄÃ£ HoÃ n ThÃ nh', 'Completed') : t('Äang Xá»­ LÃ½', 'In Progress')}
                          </span>
                        </div>
                        <div className="font-mono text-gray-400 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {rec.date}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-gray-400 pt-1 border-t border-[#222B35]">
                        <div>{t('Ká»¹ thuáº­t viÃªn phá»¥ trÃ¡ch:', 'Technician in charge:')} <strong className="text-gray-200">{rec.technician}</strong></div>
                        <div>{t('Chi phÃ­:', 'Cost:')} <strong className="text-[#C5A880] font-mono">{rec.cost > 0 ? `${rec.cost.toLocaleString('vi-VN')} Ä‘` : t('Miá»…n phÃ­ báº£o hÃ nh', 'Free under warranty')}</strong></div>
                      </div>

                      {rec.note && (
                        <div className="text-[11px] text-gray-400 italic">
                          {t('Ghi chÃº:', 'Note:')} {t(rec.note)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs bg-[#121820] border border-[#222B35]">
                  {t('ChÆ°a ghi nháº­n lá»‹ch sá»­ báº£o trÃ¬ cho cÄƒn há»™ nÃ y.', 'No maintenance history recorded for this apartment.')}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ============================================================= */}
        {/* 4. MODAL FOOTER                                               */}
        {/* ============================================================= */}
        <div className="p-3 sm:p-4 bg-[#121820] border-t border-[#222B35] flex items-center justify-between select-none">
          <div className="text-xs text-gray-400 font-mono">
            {t('MÃ£ Ä‘á»‹nh danh:', 'ID Code:')} <strong className="text-white">SKYLINE-{unit.tower}-{unit.code}</strong>
          </div>
          <div className="text-[11px] text-[#C5A880]/80 font-mono tracking-wider hidden sm:block">
            {t('Há»† THá»NG QUáº¢N LÃ DÃ‚N CÆ¯', 'RESIDENT MANAGEMENT SYSTEM')}
          </div>
        </div>

      </div>

      {/* ============================================================= */}
      {/* 5. SUB-MODAL: BQL THÃŠM NGÆ¯á»œI NHÃ€ TRá»°C TIáº¾P                    */}
      {/* ============================================================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0E131B] border border-[#C5A880]/40 w-full max-w-lg shadow-2xl rounded-none overflow-hidden">
            <div className="p-4 bg-[#161D26] border-b border-[#222B35] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C5A880]" />
                <h3 className="font-bold text-white text-sm">
                  {t('BQL ÄÄƒng KÃ½ NgÆ°á»i NhÃ  Má»›i', 'BQL Register New Family Member')} - CÄƒn {unit.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddMemberModal(false);
                  setAddMemberError(null);
                }}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-5 space-y-4">
              {addMemberError && (
                <div className="p-3 bg-rose-950/80 border border-rose-600/70 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{addMemberError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300">
                  {t('Há» vÃ  TÃªn ThÃ nh ViÃªn', 'Full Name')} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMemName}
                  onChange={(e) => setNewMemName(e.target.value)}
                  placeholder={isEn ? 'e.g. John Doe' : 'VÃ­ dá»¥: Nguyá»…n VÄƒn An'}
                  className="w-full bg-[#141B24] border border-[#2A3644] focus:border-[#C5A880] px-3 py-2 text-white text-xs rounded-none outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">
                    {t('Sá»‘ Äiá»‡n Thoáº¡i', 'Phone Number')} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={newMemPhone}
                    onChange={(e) => setNewMemPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full bg-[#141B24] border border-[#2A3644] focus:border-[#C5A880] px-3 py-2 text-white text-xs rounded-none outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">
                    {t('Sá»‘ CCCD / Há»™ Chiáº¿u', 'Citizen ID / Passport')}
                  </label>
                  <input
                    type="text"
                    value={newMemCccd}
                    onChange={(e) => setNewMemCccd(e.target.value)}
                    placeholder={isEn ? '12-digit ID card' : '12 chá»¯ sá»‘ CCCD'}
                    className="w-full bg-[#141B24] border border-[#2A3644] focus:border-[#C5A880] px-3 py-2 text-white text-xs rounded-none outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">
                    {t('Quan Há»‡ Vá»›i Chá»§ Há»™', 'Relationship')}
                  </label>
                  <select
                    value={newMemRel}
                    onChange={(e) => setNewMemRel(e.target.value)}
                    className="w-full bg-[#141B24] border border-[#2A3644] focus:border-[#C5A880] px-3 py-2 text-white text-xs rounded-none outline-none"
                  >
                    <option value="Vá»£ / Chá»“ng">{t('Vá»£ / Chá»“ng', 'Spouse')}</option>
                    <option value="Con ruá»™t / Con nuÃ´i">{t('Con ruá»™t / Con nuÃ´i', 'Child')}</option>
                    <option value="Bá»‘ / Máº¹">{t('Bá»‘ / Máº¹', 'Parent')}</option>
                    <option value="Anh / Chá»‹ / Em">{t('Anh / Chá»‹ / Em', 'Sibling')}</option>
                    <option value="NgÆ°á»i thÃ¢n khÃ¡c">{t('NgÆ°á»i thÃ¢n khÃ¡c', 'Other Relative')}</option>
                    <option value="NgÆ°á»i giÃºp viá»‡c">{t('NgÆ°á»i giÃºp viá»‡c', 'Helper / Maid')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">
                    {t('Biá»ƒn Sá»‘ Xe (Náº¿u cÃ³)', 'License Plate')}
                  </label>
                  <input
                    type="text"
                    value={newMemPlate}
                    onChange={(e) => setNewMemPlate(e.target.value)}
                    placeholder="59A-123.45"
                    className="w-full bg-[#141B24] border border-[#2A3644] focus:border-[#C5A880] px-3 py-2 text-white text-xs rounded-none outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#141B24] border border-[#222B35] flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="bqlAutoApprove"
                  checked={newMemAutoApprove}
                  onChange={(e) => setNewMemAutoApprove(e.target.checked)}
                  className="w-4 h-4 accent-[#C5A880] cursor-pointer"
                />
                <label htmlFor="bqlAutoApprove" className="text-xs text-gray-300 cursor-pointer select-none">
                  {t('PhÃª duyá»‡t & kÃ­ch hoáº¡t quyá»n FaceID ngay láº­p tá»©c (BQL cáº¥p trá»±c tiáº¿p)', 'Approve & activate FaceID access immediately (Direct BQL issue)')}
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setAddMemberError(null);
                  }}
                  className="px-4 py-2 bg-[#1A232E] hover:bg-[#222D3A] text-gray-300 text-xs font-semibold rounded-none cursor-pointer"
                >
                  {t('Há»§y Bá»', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0A0E14] text-xs font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer shadow active:scale-95"
                >
                  {t('XÃ¡c Nháº­n ThÃªm NgÆ°á»i NhÃ ', 'Confirm Add Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 6. SUB-MODAL: BQL Tá»ª CHá»I / Táº M KHÃ“A QUYá»€N                    */}
      {/* ============================================================= */}
      {rejectingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0E131B] border border-rose-500/40 w-full max-w-md shadow-2xl rounded-none overflow-hidden">
            <div className="p-4 bg-[#1B1215] border-b border-rose-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-rose-300 text-sm">
                  {t('Tá»« Chá»‘i / Táº¡m KhÃ³a FaceID', 'Reject / Suspend FaceID')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingMember(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-gray-300">
                {t('ThÃ nh viÃªn: ', 'Member: ')}
                <strong className="text-white font-bold">{rejectingMember.fullName}</strong> ({t(rejectingMember.relationship)})
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-300">
                  {t('LÃ½ do yÃªu cáº§u bá»• sung / tá»« chá»‘i:', 'Reason for rejection/suspension:')}
                </label>
                
                {/* Gá»£i Ã½ lÃ½ do nhanh */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'áº¢nh chá»¥p CCCD bá»‹ má»/lÃ³a sÃ¡ng, Ä‘á» nghá»‹ quÃ©t láº¡i rÃµ nÃ©t',
                    'áº¢nh chÃ¢n dung nghiÃªng/khÃ´ng khá»›p vá»›i tháº» CCCD',
                    'ChÆ°a Ä‘á»§ giáº¥y tá» chá»©ng minh quan há»‡ cÆ° trÃº theo quy Ä‘á»‹nh',
                    'VinHomes Manager táº¡m khÃ³a / thu há»“i quyá»n FaceID theo quy Ä‘á»‹nh'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectReasonInput(preset)}
                      className={`text-[10px] px-2 py-1 text-left border rounded-none cursor-pointer transition-colors ${
                        rejectReasonInput === preset
                          ? 'bg-rose-950 text-rose-200 border-rose-600'
                          : 'bg-[#141B24] text-gray-400 border-[#222B35] hover:text-gray-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder={isEn ? 'Enter detailed reason...' : 'Nháº­p lÃ½ do chi tiáº¿t...'}
                  className="w-full bg-[#141B24] border border-[#2A3644] focus:border-rose-500 p-2.5 text-white text-xs rounded-none outline-none resize-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setRejectingMember(null)}
                  className="px-4 py-2 bg-[#1A232E] hover:bg-[#222D3A] text-gray-300 text-xs font-semibold rounded-none cursor-pointer"
                >
                  {t('Há»§y', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejectMember}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer shadow active:scale-95"
                >
                  {t('XÃ¡c Nháº­n Quyáº¿t Äá»‹nh', 'Confirm Decision')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal XÃ¡c Nháº­n XÃ³a ThÃ nh ViÃªn */}
      {deleteMemberTarget && (
        <ConfirmDeleteModal
          isOpen={!!deleteMemberTarget}
          onClose={() => setDeleteMemberTarget(null)}
          onConfirm={confirmDeleteMember}
          title={t('XÃ¡c nháº­n xÃ³a thÃ nh viÃªn cÆ° trÃº', 'Confirm Removing Resident Member')}
          itemName={deleteMemberTarget.name}
          itemCode={unit.code}
          message={t(
            `Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a thÃ nh viÃªn "${deleteMemberTarget.name}" khá»i cÄƒn há»™ ${unit.code}? Quyá»n FaceID vÃ  quyá»n ra vÃ o thang mÃ¡y, tiá»‡n Ã­ch sáº½ bá»‹ thu há»“i ngay láº­p tá»©c.`,
            `Are you sure you want to remove member "${deleteMemberTarget.name}" from apartment ${unit.code}? FaceID access and building amenity permissions will be revoked immediately.`
          )}
          confirmText={t('XÃ¡c Nháº­n XÃ³a ThÃ nh ViÃªn', 'Confirm Remove Member')}
          cancelText={t('Há»§y Bá»', 'Cancel')}
          isDanger={true}
        />
      )}

    </div>
  );
}
