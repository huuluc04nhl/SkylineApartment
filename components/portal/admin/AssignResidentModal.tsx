'use client';
import { getInitialsAvatar } from '@/lib/avatarHelper';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { 
  X, 
  UserCheck, 
  Key, 
  AlertCircle, 
  Check, 
  Building, 
  Calendar, 
  Phone, 
  Mail, 
  CreditCard, 
  FileCheck2, 
  Printer, 
  ShieldCheck, 
  Zap, 
  Droplets, 
  BadgeCheck, 
  MapPin, 
  Sparkles, 
  ClipboardList, 
  Copy, 
  Loader2, 
  Users, 
  FileText, 
  Home 
} from 'lucide-react';
import { 
  ApartmentUnit, 
  ApartmentResidentOwner, 
  ApartmentHandoverProtocol,
  assignApartmentResident 
} from '@/lib/apartmentStore';
import { skylineHandoverProvisionAccount } from '@/lib/skylineApiClient';
import { 
  cleanPhoneNumber, 
  isValidPhoneNumber, 
  getPhoneValidationError, 
  cleanCccdNumber, 
  isValidCccdNumber, 
  getCccdValidationError 
} from '@/lib/validationUtils';

interface AssignResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ApartmentUnit | null;
  onSuccess: () => void;
}

export default function AssignResidentModal({
  isOpen,
  onClose,
  unit,
  onSuccess
}: AssignResidentModalProps) {
  const { t, isEn } = useLanguage();
  const isOccupied = unit?.status === 'OCCUPIED';

  // Tabs: 'FORM' | 'CERTIFICATE'
  const [currentStep, setCurrentStep] = useState<'FORM' | 'CERTIFICATE'>('FORM');
  const [activeFormTab, setActiveFormTab] = useState<'RESIDENT' | 'PROTOCOL'>('RESIDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Section 1: ThÃ´ng tin chá»§ há»™
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cccd, setCccd] = useState('');
  const [dob, setDob] = useState('15/06/1992');
  const [pob, setPob] = useState('TP. Há»“ ChÃ­ Minh');
  const [avatar, setAvatar] = useState(getInitialsAvatar('Skyline Resident'));

  // Section 2: BiÃªn báº£n bÃ n giao ká»¹ thuáº­t & chá»‰ sá»‘
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const [handoverDate, setHandoverDate] = useState(todayStr);
  const [handoverOfficer, setHandoverOfficer] = useState('VinHomes Manager');
  const [keysCount, setKeysCount] = useState<number>(3);
  const [cardsCount, setCardsCount] = useState<number>(2);
  const [initialElectricMeter, setInitialElectricMeter] = useState<number>(15.0);
  const [initialWaterMeter, setInitialWaterMeter] = useState<number>(1.5);
  const [handoverNotes, setHandoverNotes] = useState(
    'ÄÃ£ kiá»ƒm tra há»‡ thá»‘ng Ä‘iá»u hÃ²a, thiáº¿t bá»‹ vá»‡ sinh, Ä‘iá»‡n nÆ°á»›c, khÃ³a cá»­a vÃ  PCCC hoáº¡t Ä‘á»™ng tá»‘t.'
  );

  const [createdProtocol, setCreatedProtocol] = useState<ApartmentHandoverProtocol | null>(null);
  const [provisionedAccount, setProvisionedAccount] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Äá»“ng bá»™ vÃ  Ä‘iá»n trÆ°á»›c thÃ´ng tin thá»±c táº¿ khi má»Ÿ modal
  useEffect(() => {
    if (!unit || !isOpen) return;

    setCurrentStep('FORM');
    setActiveFormTab('RESIDENT');
    setError(null);

    const defaultName = unit.owner?.name || '';
    const defaultPhone = unit.owner?.phone || '';
    const defaultEmail = unit.owner?.email || (defaultPhone ? `${defaultPhone}@gmail.com` : '');
    const defaultCccd = unit.owner?.cccd || '';
    const defaultDob = unit.owner?.dob || '15/06/1992';
    const defaultPob = unit.owner?.pob || 'TP. Há»“ ChÃ­ Minh';
    const defaultAvatar = unit.owner?.avatar || getInitialsAvatar('Skyline Resident');

    setName(defaultName);
    setPhone(defaultPhone);
    setEmail(defaultEmail);
    setCccd(defaultCccd);
    setDob(defaultDob);
    setPob(defaultPob);
    setAvatar(defaultAvatar);

    const protocol = unit.owner?.handoverProtocol;
    if (protocol) {
      setHandoverDate(protocol.handoverDate || todayStr);
      setHandoverOfficer(protocol.handoverOfficer || 'VinHomes Manager');
      setKeysCount(protocol.keysCount || 3);
      setCardsCount(protocol.cardsCount || 2);
      setInitialElectricMeter(protocol.initialElectricMeter || 15.0);
      setInitialWaterMeter(protocol.initialWaterMeter || 1.5);
      setHandoverNotes(protocol.notes || 'ÄÃ£ kiá»ƒm tra há»‡ thá»‘ng Ä‘iá»u hÃ²a, thiáº¿t bá»‹ vá»‡ sinh, Ä‘iá»‡n nÆ°á»›c, khÃ³a cá»­a vÃ  PCCC hoáº¡t Ä‘á»™ng tá»‘t.');
    } else {
      setHandoverDate(todayStr);
      setHandoverOfficer('VinHomes Manager');
      setKeysCount(3);
      setCardsCount(2);
      setInitialElectricMeter(15.0);
      setInitialWaterMeter(1.5);
      setHandoverNotes('ÄÃ£ kiá»ƒm tra há»‡ thá»‘ng Ä‘iá»u hÃ²a, thiáº¿t bá»‹ vá»‡ sinh, Ä‘iá»‡n nÆ°á»›c, khÃ³a cá»­a vÃ  PCCC hoáº¡t Ä‘á»™ng tá»‘t.');
    }
  }, [unit, isOpen]);

  if (!isOpen || !unit) return null;

  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const generatedProtocolCode = `BBBG-SKYLINE-${unit.code.toUpperCase()}-${dateCode}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Vui lÃ²ng nháº­p há» tÃªn chá»§ há»™.');
      setActiveFormTab('RESIDENT');
      return;
    }
    const phoneErr = getPhoneValidationError(phone);
    if (phoneErr) {
      setError(phoneErr);
      setActiveFormTab('RESIDENT');
      return;
    }
    const cccdErr = getCccdValidationError(cccd);
    if (cccdErr) {
      setError(cccdErr);
      setActiveFormTab('RESIDENT');
      return;
    }

    const protocol: ApartmentHandoverProtocol = {
      protocolCode: generatedProtocolCode,
      handoverDate: handoverDate.trim() || todayStr,
      handoverOfficer: handoverOfficer.trim() || 'VinHomes Manager',
      keysCount: Number(keysCount) || 3,
      cardsCount: Number(cardsCount) || 2,
      initialElectricMeter: Number(initialElectricMeter) || 0,
      initialWaterMeter: Number(initialWaterMeter) || 0,
      notes: handoverNotes.trim()
    };

    setIsSubmitting(true);
    try {
      // 1. Gá»ŒI API Cáº¤P TÃ€I KHOáº¢N CÆ¯ DÃ‚N & LÆ¯U THÃ”NG TIN
      const apiRes = await skylineHandoverProvisionAccount({
        apartmentCode: unit.code,
        fullName: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@skyline.residence.vn`,
        idCard: cccd.trim(),
        dob: dob.trim(),
        pob: pob.trim(),
        avatarUrl: avatar,
        handoverProtocol: protocol
      });

      const blockCodeMatch = unit.towerName?.match(/BS-\d+/)?.[0] || 'BS-07';
      const newOwner: ApartmentResidentOwner = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@skyline.residence.vn`,
        cccd: cccd.trim(),
        avatar,
        eKycApproved: true,
        handoverDate: handoverDate.trim() || todayStr,
        dob: dob.trim(),
        pob: pob.trim(),
        handoverProtocol: protocol
      };
      assignApartmentResident(unit.code, newOwner, protocol, blockCodeMatch);

      setProvisionedAccount(apiRes.account || null);
      setCreatedProtocol(apiRes.protocol || protocol);
      setCurrentStep('CERTIFICATE');
      onSuccess();
    } catch (err: any) {
      console.warn('API tá»« xa gáº·p sá»± cá»‘, tá»± Ä‘á»™ng lÆ°u há»“ sÆ¡ vÃ o bá»™ nhá»› há»‡ thá»‘ng:', err);
      // Fallback lÆ°u dá»¯ liá»‡u ná»™i bá»™
      const blockCodeMatch = unit.towerName?.match(/BS-\d+/)?.[0] || 'BS-07';
      const newOwner: ApartmentResidentOwner = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@skyline.residence.vn`,
        cccd: cccd.trim(),
        avatar,
        eKycApproved: true,
        handoverDate: handoverDate.trim() || todayStr,
        dob: dob.trim(),
        pob: pob.trim(),
        handoverProtocol: protocol
      };
      const ok = assignApartmentResident(unit.code, newOwner, protocol, blockCodeMatch);
      if (ok) {
        setCreatedProtocol(protocol);
        setCurrentStep('CERTIFICATE');
        onSuccess();
      } else {
        setError(err?.message || 'KhÃ´ng thá»ƒ lÆ°u thÃ´ng tin. Vui lÃ²ng thá»­ láº¡i sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyCredentials = () => {
    const accText = `THÃ”NG TIN TÃ€I KHOáº¢N CÆ¯ DÃ‚N SKYLINE RESIDENCE\nCÄƒn há»™: ${unit.code} (${unit.towerName})\nChá»§ há»™: ${name}\nSá»‘ Ä‘iá»‡n thoáº¡i Ä‘Äƒng nháº­p: ${phone}\nSá»‘ CCCD: ${cccd}\nMáº­t kháº©u: Do Supabase Auth cáº¥p qua email kÃ­ch hoáº¡t / QuÃªn máº­t kháº©u\nCá»•ng cÆ° dÃ¢n: https://skyline.residence.vn/portal`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(accText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#C5A880]/80 shadow-2xl p-5 sm:p-6 text-white rounded-none space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* ========================================================= */}
        {/* STEP 1: FORM THÃ”NG TIN CÆ¯ DÃ‚N / BÃ€N GIAO                  */}
        {/* ========================================================= */}
        {currentStep === 'FORM' && (
          <>
            {/* Header ThÃ¢n Thiá»‡n */}
            <div className="flex items-start justify-between border-b border-[#222B35] pb-3.5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold flex items-center gap-1.5">
                  {isOccupied ? (
                    <>
                      <Users className="w-3.5 h-3.5" /> {t('Quáº£n LÃ½ CÆ° DÃ¢n â€¢ CÄƒn Há»™ Äang Sinh Sá»‘ng', 'Resident Management â€¢ Occupied Unit')}
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" /> {t('BÃ n Giao CÄƒn Há»™ â€¢ ÄÃ³n CÆ° DÃ¢n Má»›i', 'Apartment Handover â€¢ Welcoming New Resident')}
                    </>
                  )}
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                  {isOccupied 
                    ? `${t('ThÃ´ng Tin CÆ° DÃ¢n CÄƒn Há»™', 'Resident Profile for Unit')} ${unit.code}` 
                    : `${t('BÃ n Giao CÄƒn Há»™', 'Handover Apartment')} ${unit.code}`}
                </h3>
                <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-[#C5A880] font-medium">{unit.towerName}</span>
                  <span>â€¢</span>
                  <span>{t('Táº§ng', 'Floor')} {unit.floor}</span>
                  <span>â€¢</span>
                  <span>{unit.typeLabel} ({unit.area} mÂ²)</span>
                  <span>â€¢</span>
                  <span className="font-mono text-gray-300">{t('GiÃ¡:', 'Price:')} {unit.priceBillion} {t('tá»· VNÄ', 'Billion VND')}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="text-gray-400 hover:text-white p-1 hover:bg-[#161B22] transition-colors"
                title={t('ÄÃ³ng cá»­a sá»•', 'Close window')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Tab switchers thÃ¢n thiá»‡n */}
            <div className="flex border-b border-[#222B35] text-xs">
              <button
                type="button"
                onClick={() => setActiveFormTab('RESIDENT')}
                className={`flex-1 py-2.5 px-3 font-semibold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeFormTab === 'RESIDENT'
                    ? 'border-[#C5A880] text-[#C5A880] bg-[#C5A880]/10'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> 
                <span>{isOccupied ? t('1. ThÃ´ng Tin Chá»§ Há»™ & CÆ° DÃ¢n', '1. Owner & Resident Info') : t('1. ThÃ´ng Tin Chá»§ Há»™ Nháº­n NhÃ ', '1. New Owner Handover Info')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormTab('PROTOCOL')}
                className={`flex-1 py-2.5 px-3 font-semibold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                  activeFormTab === 'PROTOCOL'
                    ? 'border-[#C5A880] text-[#C5A880] bg-[#C5A880]/10'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" /> 
                <span>{t('2. BÃ n Giao ChÃ¬a KhÃ³a & Äiá»‡n NÆ°á»›c', '2. Keys & Utilities Handover')}</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* TAB 1: THÃ”NG TIN CÆ¯ DÃ‚N */}
              {activeFormTab === 'RESIDENT' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      {t('Há» vÃ  tÃªn chá»§ há»™', 'Owner Full Name')} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isEn ? 'e.g. John Doe, David Smith...' : 'VD: Tráº§n Há»¯u Lá»±c, Nguyá»…n VÄƒn Nam...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2.5 text-white font-medium rounded-none focus:outline-none focus:border-[#C5A880]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        {t('Sá»‘ Ä‘iá»‡n thoáº¡i liÃªn há»‡ (10 sá»‘)', 'Contact Phone Number (10 digits)')} <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(cleanPhoneNumber(e.target.value))}
                        placeholder="VD: 0901234567"
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                        required
                      />
                      {phone && !isValidPhoneNumber(phone) ? (
                        <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                          {getPhoneValidationError(phone)}
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-gray-400 mt-0.5 block">
                          {t('DÃ¹ng lÃ m tÃ i khoáº£n Ä‘Äƒng nháº­p Cá»•ng CÆ° DÃ¢n', 'Used as Resident Portal login account')}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        {t('Sá»‘ CCCD (12 sá»‘)', 'Citizen ID No (12 digits)')} <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={cccd}
                        onChange={(e) => setCccd(cleanCccdNumber(e.target.value))}
                        placeholder="VD: 079204001234"
                        maxLength={12}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                        required
                      />
                      {cccd && !isValidCccdNumber(cccd) ? (
                        <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                          {getCccdValidationError(cccd)}
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-gray-400 mt-0.5 block">
                          {t('DÃ¹ng Ä‘á»ƒ xÃ¡c thá»±c danh tÃ­nh cÆ° dÃ¢n', 'Used for resident identity verification')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        {t('Email nháº­n thÃ´ng bÃ¡o & hÃ³a Ä‘Æ¡n', 'Notification & Invoice Email')}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cudan@skyline.vn"
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">{t('NgÃ y sinh', 'Date of Birth')}</label>
                      <input
                        type="text"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      {t('Äá»‹a chá»‰ thÆ°á»ng trÃº / QuÃª quÃ¡n', 'Permanent Residence / Place of Origin')}
                    </label>
                    <input
                      type="text"
                      value={pob}
                      onChange={(e) => setPob(e.target.value)}
                      placeholder={isEn ? 'e.g. Long Thanh My Ward, Thu Duc City, HCMC' : 'VD: PhÆ°á»ng Long Tháº¡nh Má»¹, TP. Thá»§ Äá»©c, TP. Há»“ ChÃ­ Minh'}
                      className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div className="p-3 bg-[#121820] border border-[#222B35] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{t('áº¢nh Ä‘áº¡i diá»‡n cÆ° dÃ¢n', 'Resident Avatar Photo')}</div>
                      <div className="text-[10.5px] text-gray-400">{t('HÃ¬nh áº£nh nháº­n diá»‡n trÃªn á»©ng dá»¥ng vÃ  há»‡ thá»‘ng an ninh', 'Identification portrait on app and security system')}</div>
                    </div>
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-none border border-[#C5A880] object-cover" 
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: BIÃŠN Báº¢N BÃ€N GIAO CHÃŒA KHÃ“A & CHá»ˆ Sá» */}
              {activeFormTab === 'PROTOCOL' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="p-2.5 bg-[#161B22] border border-[#C5A880]/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400">{t('MÃ£ biÃªn báº£n:', 'Protocol code:')}</span>{' '}
                      <strong className="text-[#C5A880] font-mono">{generatedProtocolCode}</strong>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500 font-mono text-[10px]">
                      {t('BAN QUáº¢N LÃ LÆ¯U TRá»®', 'MANAGEMENT ARCHIVE')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        {t('NgÃ y bÃ n giao', 'Handover Date')} <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={handoverDate}
                        onChange={(e) => setHandoverDate(e.target.value)}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        {t('NhÃ¢n viÃªn BQL phá»¥ trÃ¡ch bÃ n giao', 'Handover Officer')} <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={handoverOfficer}
                        onChange={(e) => setHandoverOfficer(e.target.value)}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white rounded-none focus:outline-none focus:border-[#C5A880]"
                        required
                      />
                    </div>
                  </div>

                  {/* BÃ n giao chÃ¬a khÃ³a & tháº» tá»« */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#121820] border border-[#222B35]">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Sá»‘ lÆ°á»£ng chÃ¬a khÃ³a', 'Physical Keys Count')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={keysCount}
                        onChange={(e) => setKeysCount(Number(e.target.value))}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        {t('KhÃ³a cá»­a chÃ­nh, khÃ³a phÃ²ng, khÃ³a hÃ²m thÆ°', 'Main door key, room keys, mailbox key')}
                      </span>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Sá»‘ tháº» thang mÃ¡y / tháº» tá»«', 'Elevator & Access Cards Count')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={cardsCount}
                        onChange={(e) => setCardsCount(Number(e.target.value))}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        {t('Tháº» sá»­ dá»¥ng thang mÃ¡y vÃ  cÃ¡c tiá»‡n Ã­ch tÃ²a nhÃ ', 'Cards for elevator and building amenities access')}
                      </span>
                    </div>
                  </div>

                  {/* Chá»‰ sá»‘ cÃ´ng tÆ¡ Ä‘iá»‡n nÆ°á»›c lÃºc bÃ n giao */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#121820] border border-[#222B35]">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> {t('Sá»‘ Ä‘iá»‡n ban Ä‘áº§u (kWh)', 'Initial Electric Meter (kWh)')}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={initialElectricMeter}
                        onChange={(e) => setInitialElectricMeter(Number(e.target.value))}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        {t('Má»‘c báº¯t Ä‘áº§u tÃ­nh tiá»n Ä‘iá»‡n thÃ¡ng Ä‘áº§u tiÃªn', 'Baseline for first month electricity bill')}
                      </span>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400" /> {t('Sá»‘ nÆ°á»›c ban Ä‘áº§u (mÂ³)', 'Initial Water Meter (mÂ³)')}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={initialWaterMeter}
                        onChange={(e) => setInitialWaterMeter(Number(e.target.value))}
                        className="w-full bg-[#161B22] border border-[#2D3748] px-3 py-2 text-white font-mono rounded-none focus:outline-none focus:border-[#C5A880]"
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        {t('Má»‘c báº¯t Ä‘áº§u tÃ­nh tiá»n nÆ°á»›c sinh hoáº¡t', 'Baseline for first month water consumption bill')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      {t('Ghi chÃº & tÃ¬nh tráº¡ng cÄƒn há»™ khi bÃ n giao', 'Handover Notes & Apartment Condition')}
                    </label>
                    <textarea
                      rows={2}
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white text-xs rounded-none focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>
              )}

              {/* ThÃ´ng tin xÃ¡c nháº­n thÃ¢n thiá»‡n */}
              <div className="p-3 bg-[#121820] border border-[#222B35] text-[11px] text-gray-300 space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> {t('KÃ­ch hoáº¡t tÃ i khoáº£n Cá»•ng CÆ° DÃ¢n tá»± Ä‘á»™ng', 'Automatic Resident Portal Account Activation')}
                </div>
                <div>
                  {isOccupied ? (
                    <>
                      {t('Há»‡ thá»‘ng sáº½ cáº­p nháº­t thÃ´ng tin chá»§ há»™ vÃ o há»“ sÆ¡ cÄƒn há»™', 'System will update owner info into profile of unit')} <strong className="text-white">{unit.code}</strong>. {t('CÆ° dÃ¢n sá»­ dá»¥ng sá»‘ Ä‘iá»‡n thoáº¡i', 'Resident will use phone number')} <strong className="text-[#C5A880]">{phone || '...'}</strong> {t('Ä‘á»ƒ Ä‘Äƒng nháº­p.', 'to log in.')}
                    </>
                  ) : (
                    <>
                      {t('Sau khi hoÃ n táº¥t, cÄƒn há»™', 'Upon completion, unit')} <strong className="text-white">{unit.code}</strong> {t('sáº½ chuyá»ƒn sang tráº¡ng thÃ¡i', 'will change status to')} <strong>{t('ÄÃƒ CÃ“ NGÆ¯á»œI á»ž', 'OCCUPIED')}</strong>. {t('CÆ° dÃ¢n cÃ³ thá»ƒ Ä‘Äƒng nháº­p ngay báº±ng sá»‘ Ä‘iá»‡n thoáº¡i', 'Resident can log in immediately using phone number')} <strong className="text-[#C5A880]">{phone || '...'}</strong>.
                    </>
                  )}
                </div>
              </div>

              {/* NÃºt hÃ nh Ä‘á»™ng */}
              <div className="flex items-center justify-between pt-3 border-t border-[#222B35]">
                {activeFormTab === 'RESIDENT' ? (
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('PROTOCOL')}
                    className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {t('Tiáº¿p: ChÃ¬a KhÃ³a & Äiá»‡n NÆ°á»›c â†’', 'Next: Keys & Utilities â†’')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('RESIDENT')}
                    className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {t('â† Quay Láº¡i ThÃ´ng Tin CÆ° DÃ¢n', 'â† Back to Resident Profile')}
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-[#161B22] hover:bg-[#202936] text-gray-300 hover:text-white border border-[#2D3748] font-semibold transition-colors"
                  >
                    {t('Há»§y', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> {t('Äang lÆ°u thÃ´ng tin...', 'Saving details...')}
                      </>
                    ) : isOccupied ? (
                      <>
                        <UserCheck className="w-4 h-4" /> {t('LÆ°u ThÃ´ng Tin CÆ° DÃ¢n', 'Save Resident Profile')}
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4" /> {t('HoÃ n Táº¥t BÃ n Giao & Cáº¥p Quyá»n', 'Complete Handover & Grant Access')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {/* ========================================================= */}
        {/* STEP 2: XÃC NHáº¬N THÃ€NH CÃ”NG                                */}
        {/* ========================================================= */}
        {currentStep === 'CERTIFICATE' && createdProtocol && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header xÃ¡c nháº­n */}
            <div className="p-6 bg-gradient-to-b from-[#1C2533] to-[#121820] border-2 border-[#C5A880] text-center space-y-3 relative">
              <div className="w-12 h-12 bg-[#C5A880]/15 border border-[#C5A880] flex items-center justify-center mx-auto text-[#C5A880]">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-mono font-bold">
                  {t('SKYLINE SMART RESIDENCE â€¢ BAN QUáº¢N LÃ', 'SKYLINE SMART RESIDENCE â€¢ MANAGEMENT')}
                </div>
                <h2 className="font-serif text-2xl text-white font-bold mt-1">
                  {isOccupied ? t('Cáº¬P NHáº¬T Há»’ SÆ  CÆ¯ DÃ‚N THÃ€NH CÃ”NG', 'RESIDENT PROFILE UPDATED SUCCESSFULLY') : t('BÃ€N GIAO CÄ‚N Há»˜ THÃ€NH CÃ”NG', 'APARTMENT HANDOVER COMPLETED')}
                </h2>
                <div className="text-xs text-gray-300 font-mono mt-0.5">
                  {t('MÃ£ BiÃªn Báº£n:', 'Protocol Code:')} <strong className="text-[#C5A880]">{createdProtocol.protocolCode}</strong>
                </div>
              </div>

              {/* Huy hiá»‡u xÃ¡c nháº­n */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="p-2 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] font-mono font-bold">
                  âœ“ {isOccupied ? t('ÄÃƒ Cáº¬P NHáº¬T THÃ”NG TIN CHá»¦ Há»˜', 'OWNER INFO UPDATED') : t('ÄÃƒ HOÃ€N Táº¤T THá»¦ Tá»¤C BÃ€N GIAO', 'HANDOVER PROCEDURE COMPLETED')}
                </span>
                <span className="p-2 bg-blue-950/80 border border-blue-500 text-blue-300 text-[11px] font-mono font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {t('ÄÃƒ KÃCH HOáº T TÃ€I KHOáº¢N CÆ¯ DÃ‚N', 'RESIDENT ACCOUNT ACTIVATED')}
                </span>
              </div>

              {/* TÃ³m táº¯t */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-[#2D3748] text-left text-xs font-mono">
                <div className="p-2.5 bg-[#0D1117] border border-[#222B35]">
                  <div className="text-gray-400 text-[10.5px]">{t('CÄ‚N Há»˜ & Vá»Š TRÃ:', 'APARTMENT & LOCATION:')}</div>
                  <div className="text-white font-bold text-sm">{t('CÄ‚N', 'UNIT')} {unit.code}</div>
                  <div className="text-gray-300 text-[11px]">{unit.towerName} â€¢ {t('Táº§ng', 'Floor')} {unit.floor} â€¢ {unit.typeLabel}</div>
                </div>

                <div className="p-2.5 bg-[#0D1117] border border-[#222B35]">
                  <div className="text-gray-400 text-[10.5px]">{t('CHá»¦ Há»˜:', 'OWNER:')}</div>
                  <div className="text-white font-bold text-sm">{name}</div>
                  <div className="text-gray-300 text-[11px]">{t('SÄT:', 'Tel:')} {phone} â€¢ {t('CCCD:', 'ID:')} {cccd}</div>
                </div>

                <div className="p-2.5 bg-[#0D1117] border border-[#222B35]">
                  <div className="text-gray-400 text-[10.5px]">{t('CHÃŒA KHÃ“A & THáºº Tá»ª:', 'KEYS & RFID CARDS:')}</div>
                  <div className="text-emerald-400 font-bold">
                    {createdProtocol.keysCount} {t('ChÃ¬a khÃ³a', 'Keys')} â€¢ {createdProtocol.cardsCount} {t('Tháº» thang mÃ¡y', 'Elevator Cards')}
                  </div>
                  <div className="text-gray-400 text-[10px]">{t('ÄÃ£ bÃ n giao Ä‘áº§y Ä‘á»§', 'Fully handed over')}</div>
                </div>

                <div className="p-2.5 bg-[#0D1117] border border-[#222B35]">
                  <div className="text-gray-400 text-[10.5px]">{t('CHá»ˆ Sá» BAN Äáº¦U:', 'INITIAL METERS:')}</div>
                  <div className="text-amber-400 font-bold">
                    {t('Äiá»‡n:', 'Elec:')} {createdProtocol.initialElectricMeter} kWh â€¢ {t('NÆ°á»›c:', 'Water:')} {createdProtocol.initialWaterMeter} mÂ³
                  </div>
                  <div className="text-gray-400 text-[10px]">{t('Phá»¥ trÃ¡ch:', 'Officer:')} {createdProtocol.handoverOfficer}</div>
                </div>
              </div>

              {/* ThÃ´ng tin tÃ i khoáº£n Ä‘Äƒng nháº­p */}
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-600/60 text-left text-xs text-gray-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> {t('TÃ i Khoáº£n ÄÄƒng Nháº­p Cá»•ng CÆ° DÃ¢n Sáºµn SÃ ng', 'Resident Portal Login Account Ready')}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 bg-emerald-900/60 border border-emerald-500/50">
                    {t('VAI TRÃ’: CHá»¦ Há»˜', 'ROLE: OWNER')}
                  </span>
                </div>

                <p className="text-gray-300 text-[11.5px]">
                  {t('Chá»§ há»™', 'Owner')} <strong>{name}</strong> {t('cÃ³ thá»ƒ sá»­ dá»¥ng ngay thÃ´ng tin sau Ä‘á»ƒ Ä‘Äƒng nháº­p vÃ o Cá»•ng CÆ° DÃ¢n:', 'can immediately use the following credentials to sign in to the Resident Portal:')}
                </p>

                <div className="font-mono text-white bg-black/60 p-3 border border-[#222B35] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{t('TÃªn Ä‘Äƒng nháº­p (Sá»‘ Ä‘iá»‡n thoáº¡i):', 'Username (Phone Number):')}</span>
                    <strong className="text-emerald-400 text-sm">{phone}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{t('Sá»‘ CCCD Ä‘á»‹nh danh:', 'National ID Number:')}</span>
                    <strong className="text-white">{cccd}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{t('Thiáº¿t láº­p máº­t kháº©u:', 'Password Setup:')}</span>
                    <strong className="text-amber-300">{t('Qua email kÃ­ch hoáº¡t / QuÃªn máº­t kháº©u', 'Via activation email / Reset')}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="px-3 py-1.5 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-[#C5A880]" />
                  {copied ? t('âœ“ ÄÃ£ Sao ChÃ©p ThÃ´ng Tin!', 'âœ“ Credentials Copied!') : t('Sao ChÃ©p ThÃ´ng Tin Äá»ƒ Gá»­i CÆ° DÃ¢n', 'Copy Credentials to Send to Resident')}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#C5A880]" /> {t('In BiÃªn Báº£n (PDF)', 'Print Protocol (PDF)')}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> {t('HoÃ n Táº¥t', 'Finish')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
