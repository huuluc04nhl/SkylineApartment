'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  Activity, 
  Receipt, 
  Car, 
  Flame, 
  Eye, 
  Radio, 
  CheckCircle2, 
  TrendingUp,
  Building,
  ShieldCheck,
  Clock,
  Sliders
} from 'lucide-react';
import { getApartmentUnits } from '@/lib/apartmentStore';
import type { GeneratedVisitorPass, GateAuditLog } from '@/lib/visitorStore';
import { getBills } from '@/lib/billingStore';
import { useLanguage } from '@/lib/languageContext';

// Cáº¥u trÃºc dá»¯ liá»‡u phÃ¢n táº§ng an ninh vÃ  cáº£nh bÃ¡o BMS
interface FloorThreatData {
  floor: 'B2' | 'B1' | 'L1' | '20' | '30' | '34';
  floorName: string;
  threatLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  activeNodes: number;
  threats: {
    id: string;
    type: 'FIRE' | 'WATER' | 'INTRUSION' | 'PARKING';
    title: string;
    location: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
    snapshot: string;
    time: string;
    coords: { x: number; y: number };
    actionHint: string;
  }[];
}

const FLOOR_THREAT_DATABASE: Record<string, FloorThreatData> = {
  B2: {
    floor: 'B2',
    floorName: 'Háº§m B2 â€¢ Tráº¡m BÆ¡m & Bá»ƒ PCCC',
    threatLevel: 'NORMAL',
    activeNodes: 22,
    threats: [
      {
        id: 'T-B2-01',
        type: 'WATER',
        title: 'Ãp lá»±c nÆ°á»›c PCCC á»•n Ä‘á»‹nh (6.2 bar)',
        location: 'Tráº¡m bÆ¡m Grundfos Háº§m B2',
        severity: 'LOW',
        confidence: 0.99,
        snapshot: '/masterplan/the-tropical-masterplan.png',
        time: '00:55',
        coords: { x: 28, y: 32 },
        actionHint: 'Ãp lá»±c 6.2 bar, bá»ƒ nÆ°á»›c Ä‘áº¡t 94% dung tÃ­ch.'
      }
    ]
  },
  B1: {
    floor: 'B1',
    floorName: 'Háº§m B1 â€¢ BÃ£i Äá»— Xe & Tráº¡m Biáº¿n Ãp',
    threatLevel: 'WARNING',
    activeNodes: 32,
    threats: [
      {
        id: 'T-B1-01',
        type: 'FIRE',
        title: 'Nhiá»‡t Ä‘á»™ tá»§ Ä‘iá»‡n trung tháº¿: 42Â°C',
        location: 'Tráº¡m biáº¿n Ã¡p Háº§m B1',
        severity: 'MEDIUM',
        confidence: 0.94,
        snapshot: '/masterplan/the-tropical-masterplan.png',
        time: '00:52',
        coords: { x: 26, y: 72 },
        actionHint: 'Tá»± Ä‘á»™ng kÃ­ch hoáº¡t quáº¡t táº£n nhiá»‡t.'
      },
      {
        id: 'T-B1-02',
        type: 'PARKING',
        title: 'Xe Ä‘á»— cháº¯n há»ng nÆ°á»›c cá»©u há»a',
        location: 'HÃ nh lang lá»‘i thoÃ¡t hiá»ƒm (Cá»™t B1-08)',
        severity: 'MEDIUM',
        confidence: 0.91,
        snapshot: '/masterplan/the-tropical-masterplan.png',
        time: '00:45',
        coords: { x: 74, y: 30 },
        actionHint: 'Báº£o vá»‡ ca trá»±c Ä‘Ã£ tiáº¿p cáº­n xá»­ lÃ½.'
      }
    ]
  },
  L1: {
    floor: 'L1',
    floorName: 'Táº§ng 1 â€¢ Sáº£nh Grand Lobby & Lá»… TÃ¢n',
    threatLevel: 'NORMAL',
    activeNodes: 26,
    threats: [
      {
        id: 'T-L1-01',
        type: 'INTRUSION',
        title: 'Cá»•ng FaceID lá»… tÃ¢n váº­n hÃ nh tá»‘t',
        location: 'Sáº£nh chÃ­nh Táº§ng 1',
        severity: 'LOW',
        confidence: 0.98,
        snapshot: '/masterplan/the-tropical-masterplan.png',
        time: '00:58',
        coords: { x: 74, y: 72 },
        actionHint: 'Nháº­n diá»‡n má»Ÿ cá»­a tá»©c thÃ¬ < 0.2s.'
      }
    ]
  },
  '20': {
    floor: '20',
    floorName: 'Táº§ng 20 â€¢ Gian LÃ¡nh Náº¡n PCCC',
    threatLevel: 'NORMAL',
    activeNodes: 18,
    threats: [
      {
        id: 'T-20-01',
        type: 'FIRE',
        title: 'Ãp suáº¥t dÆ°Æ¡ng buá»“ng Ä‘á»‡m an toÃ n',
        location: 'Gian lÃ¡nh náº¡n Táº§ng 20',
        severity: 'LOW',
        confidence: 0.97,
        snapshot: '/masterplan/the-tropical-masterplan.png',
        time: '00:42',
        coords: { x: 50, y: 50 },
        actionHint: 'Há»‡ thá»‘ng liÃªn láº¡c kháº©n cáº¥p sáºµn sÃ ng 100%.'
      }
    ]
  },
  '30': {
    floor: '30',
    floorName: 'Táº§ng 30 â€¢ HÃ nh Lang CÄƒn Há»™',
    threatLevel: 'NORMAL',
    activeNodes: 20,
    threats: [
      {
        id: 'T-30-01',
        type: 'WATER',
        title: 'Cáº£m biáº¿n rÃ² rá»‰ nÆ°á»›c bÃ¬nh thÆ°á»ng',
        location: 'Há»™p ká»¹ thuáº­t táº§ng 30 (Khu cÄƒn CH-06)',
        severity: 'LOW',
        confidence: 0.96,
        snapshot: '/masterplan/the-tropical-masterplan.png',
        time: '00:50',
        coords: { x: 74, y: 30 },
        actionHint: 'Ãp lá»±c 2.8 bar, khÃ´ng ghi nháº­n rÃ² rá»‰.'
      }
    ]
  },
  '34': {
    floor: '34',
    floorName: 'Táº§ng 34 â€¢ PhÃ²ng MÃ¡y KÃ©o & MÃ¡i',
    threatLevel: 'NORMAL',
    activeNodes: 16,
    threats: [
      {
        id: 'T-34-01',
        type: 'FIRE',
        title: 'Quáº¡t tÄƒng Ã¡p hÃºt khÃ³i sáºµn sÃ ng',
        location: 'Trá»¥c ká»¹ thuáº­t táº§ng mÃ¡i BS-07',
        severity: 'LOW',
        confidence: 0.99,
        snapshot: '/masterplan/the-tropical-masterplan.png',
        time: '00:40',
        coords: { x: 28, y: 32 },
        actionHint: 'Ãp suáº¥t 50 Pa, van cháº·n lá»­a má»Ÿ sáºµn sÃ ng.'
      }
    ]
  }
};

export default function AdminDashboard() {
  const { t, isEn } = useLanguage();
  const [selectedFloor, setSelectedFloor] = useState<'B2' | 'B1' | 'L1' | '20' | '30' | '34'>('B1');
  const [selectedThreatId, setSelectedThreatId] = useState<string>('T-B1-01');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  
  // Realtime clock display
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour12: false }) + ' â€¢ ' + now.toLocaleDateString(isEn ? 'en-US' : 'vi-VN'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isEn]);

  // Láº¥y dá»¯ liá»‡u tháº­t tá»« apartmentStore & visitorStore
  const apartments = useMemo(() => {
    try {
      return getApartmentUnits();
    } catch {
      return [];
    }
  }, []);

  const [visitorPasses, setVisitorPasses] = useState<GeneratedVisitorPass[]>([]);
  const [auditLogs, setAuditLogs] = useState<GateAuditLog[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/visitor', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active || !json) return;
        if (Array.isArray(json.passes)) setVisitorPasses(json.passes);
        if (Array.isArray(json.gateLogs)) setAuditLogs(json.gateLogs);
      })
      .catch((err) => {
        console.warn('Lỗi tải dữ liệu khách thăm cho Dashboard:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  const occupiedUnits = useMemo(() => {
    return apartments.filter(u => u.status === 'OCCUPIED').length;
  }, [apartments]);

  const maintenanceUnits = useMemo(() => {
    return apartments.filter(u => u.status === 'MAINTENANCE' || u.status === 'HANDOVER_PENDING').length;
  }, [apartments]);

  const vacantUnits = useMemo(() => {
    return apartments.filter(u => u.status === 'VACANT').length;
  }, [apartments]);

  const totalUnits = apartments.length;
  const occupiedPct = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0';
  const maintPct = totalUnits > 0 ? ((maintenanceUnits / totalUnits) * 100).toFixed(1) : '0';
  const vacantPct = totalUnits > 0 ? ((vacantUnits / totalUnits) * 100).toFixed(1) : '0';

  // Láº¥y dá»¯ liá»‡u tháº­t tá»« billingStore
  const bills = useMemo(() => {
    try {
      return getBills();
    } catch {
      return [];
    }
  }, []);

  const totalPaidRevenue = useMemo(() => {
    return bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.total_amount || 0), 0);
  }, [bills]);

  const totalExpectedRevenue = useMemo(() => {
    return bills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  }, [bills]);

  const collectionRate = useMemo(() => {
    return totalExpectedRevenue > 0 ? ((totalPaidRevenue / totalExpectedRevenue) * 100).toFixed(1) : '100';
  }, [totalPaidRevenue, totalExpectedRevenue]);

  // Láº¥y dá»¯ liá»‡u phÆ°Æ¡ng tiá»‡n xe thá»±c táº¿ tá»« apartmentStore
  const registeredCars = useMemo(() => {
    return apartments.reduce((sum, apt) => sum + (apt.vehicles?.filter(v => v.type === 'CAR').length || 0), 0);
  }, [apartments]);

  const registeredMotos = useMemo(() => {
    return apartments.reduce((sum, apt) => sum + (apt.vehicles?.filter(v => v.type === 'MOTORBIKE').length || 0), 0);
  }, [apartments]);

  const currentFloorData = FLOOR_THREAT_DATABASE[selectedFloor] || FLOOR_THREAT_DATABASE['B1'];
  const activeThreat = currentFloorData.threats.find(t => t.id === selectedThreatId) || currentFloorData.threats[0];

  const handleDispatchSecurity = () => {
    setDispatchStatus(isEn ? `Security team dispatched to ${currentFloorData.floorName}.` : `ÄÃ£ Ä‘iá»u Ä‘á»™ng báº£o vá»‡ tá»›i ${currentFloorData.floorName}.`);
    setTimeout(() => setDispatchStatus(null), 3500);
  };

  return (
    <div className="space-y-5 animate-fadeIn select-none text-white">
      
      {/* 1. HEADER CHá»ˆ HUY TRUNG TÃ‚M Váº¬N HÃ€NH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-[#0C121B] via-[#121A26] to-[#0C121B] border border-[#222B35] shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-mono font-bold">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>{t('TRUNG TÃ‚M Váº¬N HÃ€NH BMS', 'BMS OPERATIONS COMMAND')}</span>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5 tracking-wide flex items-center gap-2.5">
            <span>{t('GiÃ¡m SÃ¡t Váº­n HÃ nh', 'Operations Monitoring')}</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/80 font-mono font-normal">
              {t('TRá»°C TUYáº¾N', 'ONLINE')}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 bg-[#16202D] border border-[#2B394E] text-gray-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{currentTimeStr || t('Äang cáº­p nháº­t...', 'Updating...')}</span>
          </div>
          <button 
            type="button"
            onClick={() => setIsEmergencyActive(!isEmergencyActive)}
            className={`px-3 py-1.5 font-bold flex items-center gap-1.5 border transition-all ${
              isEmergencyActive 
                ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]' 
                : 'bg-[#1C161D] text-red-400 border-red-900/60 hover:border-red-600'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isEmergencyActive ? t('BÃO Äá»˜NG Báº¬T', 'ALARM ACTIVE') : t('DIá»„N Táº¬P PCCC', 'FIRE DRILL')}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 THáºº KPI CHá»ˆ Sá» Cá»T LÃ•I */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Doanh thu thá»±c thu */}
        <div className="p-3.5 bg-[#121820] border border-[#222B35] space-y-1.5 hover:border-[#C5A880]/60 transition-all shadow">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">{t('Doanh Thu ÄÃ£ Thu', 'Collected Revenue')}</span>
            <Receipt className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide">
            {totalPaidRevenue.toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-xs font-sans text-gray-400 font-normal">{isEn ? 'VND' : 'Ä‘'}</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span>{t('ÄÃ£ thu', 'Collected')} {bills.filter(b => b.status === 'Paid').length}/{bills.length} {t('cÄƒn', 'units')}</span>
            <span className="text-gray-400">{t('Äáº¡t', 'Rate')} {collectionRate}%</span>
          </div>
        </div>

        {/* KPI 2: Tá»· lá»‡ láº¥p Ä‘áº§y */}
        <div className="p-3.5 bg-[#121820] border border-[#222B35] space-y-1.5 hover:border-[#C5A880]/60 transition-all shadow">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">{t('Tá»· Lá»‡ Láº¥p Äáº§y', 'Occupancy Rate')}</span>
            <Building className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide flex items-baseline gap-2">
            <span>{occupiedPct}%</span>
            <span className="text-xs font-sans text-gray-400 font-normal">/ {totalUnits} {t('CÄƒn', 'Units')}</span>
          </div>
          <div className="w-full bg-[#1C2533] h-1.5 flex overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${occupiedPct}%` }} title={`${t('ÄÃ£ á»Ÿ', 'Occupied')}: ${occupiedUnits}`} />
            <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${maintPct}%` }} title={`${t('Nghiá»‡m thu', 'Handover')}: ${maintenanceUnits}`} />
            <div className="bg-gray-600 h-full transition-all duration-500" style={{ width: `${vacantPct}%` }} title={`${t('Trá»‘ng', 'Vacant')}: ${vacantUnits}`} />
          </div>
          <div className="text-[10.5px] text-gray-400 flex items-center justify-between font-mono pt-0.5 border-t border-[#1C2533]">
            <span className="text-emerald-400">â— {occupiedUnits} {t('á»ž', 'Occ')}</span>
            <span className="text-amber-400">â— {maintenanceUnits} {t('BÃ n Giao', 'Handover')}</span>
            <span className="text-gray-400">â— {vacantUnits} {t('Trá»‘ng', 'Vacant')}</span>
          </div>
        </div>

        {/* KPI 3: KhÃ¡ch thÄƒm */}
        <div className="p-3.5 bg-[#121820] border border-[#222B35] space-y-1.5 hover:border-[#C5A880]/60 transition-all shadow">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">{t('KhÃ¡ch ThÄƒm Chung CÆ°', 'Building Visitors')}</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide flex items-baseline gap-2">
            <span>{visitorPasses.length} {t('Tháº»', 'Passes')}</span>
            <span className="text-xs font-sans text-gray-400 font-normal">â€¢ {auditLogs.length} {t('LÆ°á»£t QuÃ©t', 'Scans')}</span>
          </div>
          <div className="text-[11px] text-cyan-400 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span>{t('Äang hoáº¡t Ä‘á»™ng', 'Active now')}</span>
            <span className="text-gray-400">{t('Cá»•ng L1 & B1', 'Gate L1 & B1')}</span>
          </div>
        </div>

        {/* KPI 4: PhÆ°Æ¡ng tiá»‡n */}
        <div className="p-3.5 bg-[#121820] border border-[#222B35] space-y-1.5 hover:border-[#C5A880]/60 transition-all shadow">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">{t('PhÆ°Æ¡ng Tiá»‡n CÆ° DÃ¢n', 'Resident Vehicles')}</span>
            <Car className="w-4 h-4 text-[#C5A880]" />
          </div>
          <div className="font-serif text-2xl text-white font-bold tracking-wide">
            {registeredCars + registeredMotos} <span className="text-xs font-sans text-gray-400 font-normal">{t('Xe ÄÄƒng KÃ½', 'Vehicles')}</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center justify-between font-mono pt-1 border-t border-[#1C2533]">
            <span>â— {registeredCars} {t('Ã” tÃ´', 'Cars')}</span>
            <span>â— {registeredMotos} {t('Xe mÃ¡y', 'Bikes')}</span>
          </div>
        </div>
      </div>

      {/* 3. KHU Vá»°C CHÃNH: Báº¢N Äá»’ & CAMERA AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Cá»˜T TRÃI (7 COLS): SÆ  Äá»’ Máº¶T Báº°NG Táº¦NG */}
        <div className="lg:col-span-7 bg-[#0E141E] border border-[#222B35] p-4 space-y-3 shadow-xl">
          
          {/* Thanh chuyá»ƒn táº§ng nhanh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#222B35] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>{t('SÆ  Äá»’ PHÃ‚N Táº¦NG BMS', 'BMS FLOOR MAP')}</span>
            </div>

            {/* Switch táº§ng: B2, B1, L1, 20, 30, 34 */}
            <div className="flex items-center gap-1 bg-[#16202D] border border-[#2B394E] p-1 text-xs font-mono overflow-x-auto no-scrollbar whitespace-nowrap">
              {(['B2', 'B1', 'L1', '20', '30', '34'] as const).map((fl) => {
                const fData = FLOOR_THREAT_DATABASE[fl];
                const isCrit = fData.threatLevel === 'CRITICAL';
                const isWarn = fData.threatLevel === 'WARNING';
                const isSel = selectedFloor === fl;

                return (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => {
                      setSelectedFloor(fl);
                      if (fData.threats.length > 0) {
                        setSelectedThreatId(fData.threats[0].id);
                      }
                    }}
                    className={`px-2 py-0.5 transition-all border relative ${
                      isSel
                        ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880] shadow'
                        : 'bg-transparent text-gray-300 border-transparent hover:bg-[#1E2C3D] hover:text-white'
                    }`}
                  >
                    <span>{fl === 'L1' ? t('Táº§ng 1', 'Floor 1') : fl === 'B1' ? t('Háº§m B1', 'Basement B1') : fl === 'B2' ? t('Háº§m B2', 'Basement B2') : fl === '34' ? t('Táº§ng 34', 'Floor 34') : `${t('Táº§ng', 'Floor')} ${fl}`}</span>
                    {isCrit && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    )}
                    {isWarn && !isCrit && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Banner táº§ng Ä‘ang chá»n */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#141C28] border border-[#243244] text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <Building className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
              <span className="text-white font-bold truncate">
                {selectedFloor === 'B2' ? (isEn ? 'Basement B2 â€¢ Pump Station & Fire Tank' : currentFloorData.floorName)
                  : selectedFloor === 'B1' ? (isEn ? 'Basement B1 â€¢ Parking & Transformer' : currentFloorData.floorName)
                  : selectedFloor === 'L1' ? (isEn ? 'Floor 1 â€¢ Grand Lobby & Reception' : currentFloorData.floorName)
                  : selectedFloor === '20' ? (isEn ? 'Floor 20 â€¢ Fire Refuge Area' : currentFloorData.floorName)
                  : selectedFloor === '30' ? (isEn ? 'Floor 30 â€¢ Residential Corridor' : currentFloorData.floorName)
                  : (isEn ? 'Floor 34 â€¢ Elevator Motor & Rooftop' : currentFloorData.floorName)}
              </span>
            </div>
            <span className={`px-2 py-0.5 text-[9px] font-bold shrink-0 border ${
              currentFloorData.threatLevel === 'CRITICAL'
                ? 'bg-red-950 text-red-300 border-red-500'
                : currentFloorData.threatLevel === 'WARNING'
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}>
              {currentFloorData.threatLevel === 'CRITICAL' ? t('NGUY HIá»‚M', 'CRITICAL') : currentFloorData.threatLevel === 'WARNING' ? t('Cáº¢NH BÃO', 'WARNING') : t('BÃŒNH THÆ¯á»œNG', 'NORMAL')}
            </span>
          </div>

          {/* SÆ  Äá»’ Báº¢N Äá»’ Máº¶T Báº°NG */}
          <div className="relative h-[250px] bg-[#070A0F] border border-[#222B35] flex items-center justify-center overflow-hidden">
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            <div className="relative z-10 w-[96%] h-[92%] border border-gray-800/80 bg-[#0A0F17]/95 p-2 flex flex-col justify-between shadow-xl">
              {/* Header sÆ¡ Ä‘á»“ sÃ n */}
              <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 border-b border-gray-800/60 pb-1">
                <span className="text-[#C5A880] font-bold">{t('Máº¶T Báº°NG SÃ€N', 'FLOOR BLUEPRINT')} â€¢ {selectedFloor}</span>
                <span className="text-gray-400">{currentFloorData.activeNodes} {t('Cáº£m Biáº¿n Hoáº¡t Äá»™ng', 'Active Sensors')}</span>
              </div>

              {/* CÃ¡c phÃ¢n khu kiáº¿n trÃºc */}
              <div className="relative flex-1 my-1">
                <div className="absolute top-1 left-2 px-1.5 py-0.5 border border-dashed border-emerald-700/50 bg-[#0E1722]/40 text-[8px] font-mono text-emerald-400/80 pointer-events-none">
                  {t('THANG Bá»˜ 01', 'STAIRWELL 01')}
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 py-1.5 border border-[#2B3B4F] bg-[#111924]/80 text-center shadow pointer-events-none">
                  <div className="font-bold text-gray-200 text-[8.5px] tracking-wide flex items-center justify-center gap-1">
                    <Sliders className="w-2.5 h-2.5 text-[#C5A880]" /> {t('LÃ•I THANG MÃY', 'ELEVATOR CORE')}
                  </div>
                </div>

                <div className="absolute bottom-1 right-2 px-1.5 py-0.5 border border-dashed border-emerald-700/50 bg-[#0E1722]/40 text-[8px] font-mono text-emerald-400/80 pointer-events-none">
                  {t('THANG Bá»˜ 02', 'STAIRWELL 02')}
                </div>

                <div className="absolute top-1 right-2 px-1.5 py-0.5 border border-dashed border-gray-700/50 bg-[#0E1722]/40 text-[8px] font-mono text-gray-400/80 pointer-events-none">
                  {t('Há»ŒNG PCCC', 'FIRE HYDRANT')}
                </div>

                <div className="absolute bottom-1 left-2 px-1.5 py-0.5 border border-dashed border-gray-700/50 bg-[#0E1722]/40 text-[8px] font-mono text-gray-400/80 pointer-events-none">
                  {t('TRá»¤C M&E', 'MEP SHAFT')}
                </div>

                {/* CÃ¡c Ä‘iá»ƒm radar cáº£nh bÃ¡o */}
                {currentFloorData.threats.map((threat, idx) => {
                  const isSelected = activeThreat?.id === threat.id;
                  const isHigh = threat.severity === 'HIGH';
                  const isMed = threat.severity === 'MEDIUM';

                  return (
                    <button
                      key={threat.id}
                      type="button"
                      onClick={() => setSelectedThreatId(threat.id)}
                      style={{ left: `${threat.coords.x}%`, top: `${threat.coords.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group focus:outline-none flex items-center gap-1"
                    >
                      <span className="relative flex items-center justify-center">
                        <span className={`w-3.5 h-3.5 rounded-full absolute ${
                          isHigh 
                            ? 'bg-red-500/25 animate-ping' 
                            : isMed 
                            ? 'bg-amber-500/25 animate-pulse' 
                            : 'bg-emerald-500/20'
                        }`} />
                        <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-mono font-bold transition-all border ${
                          isHigh 
                            ? 'bg-red-600/60 border-red-400 text-white' 
                            : isMed 
                            ? 'bg-amber-600/60 border-amber-400 text-white' 
                            : 'bg-emerald-600/60 border-emerald-400 text-white'
                        } ${isSelected ? 'scale-125 ring-2 ring-[#C5A880] ring-offset-1 ring-offset-black !bg-opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                          !
                        </span>
                      </span>

                      <span className={`text-[8px] font-mono px-1 py-0.2 border transition-all ${
                        isSelected 
                          ? 'bg-[#0E1520] border-[#C5A880] text-[#C5A880] font-bold' 
                          : 'bg-[#0A0F17]/80 border-gray-800 text-gray-400 group-hover:text-white'
                      }`}>
                        T{idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Status Footer Legend Bar */}
              <div className="flex justify-between items-center text-[8px] text-gray-400 font-mono pt-1 border-t border-gray-800/60">
                <span className="text-emerald-400">â— {t('Há»‡ thá»‘ng an toÃ n', 'Safe System')}</span>
                <span className="text-amber-400">â— {t('Äiá»ƒm cáº£nh bÃ¡o T1/T2', 'Warning Point T1/T2')}</span>
                <span className="text-cyan-400">â— {t('BMS káº¿t ná»‘i trá»±c tiáº¿p', 'Direct BMS connection')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cá»˜T PHáº¢I (5 COLS): CAMERA & THÃ”NG BÃO Xá»¬ LÃ */}
        <div className="lg:col-span-5 bg-[#0E141E] border border-[#222B35] p-4 space-y-3 flex flex-col justify-between shadow-xl">
          <div className="space-y-2.5">
            {/* Header Camera */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
              <span className="text-xs uppercase tracking-wider text-[#C5A880] font-mono font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> {t('CAMERA AN NINH LIVE', 'LIVE SECURITY CAM')}
              </span>
              <span className="px-1.5 py-0.5 bg-red-950/80 border border-red-500 text-red-300 text-[9px] font-mono font-bold">
                AI: {(activeThreat.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Live Camera Frame */}
            <div className="relative border border-red-500/40 h-36 overflow-hidden shadow-lg bg-black">
              <Image
                src={activeThreat.snapshot}
                alt={activeThreat.title}
                width={400}
                height={240}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 left-1.5 bg-black/80 px-1.5 py-0.5 text-[8.5px] font-mono text-red-400 border border-red-800">
                CAM-{selectedFloor} â€¢ {activeThreat.id}
              </div>
              <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 text-[8.5px] font-mono text-gray-300">
                {activeThreat.time}
              </div>
            </div>

            {/* ThÃ´ng sá»‘ chi tiáº¿t cáº£nh bÃ¡o - Tinh gá»n, rÃµ rÃ ng */}
            <div className="space-y-1.5 text-xs text-gray-300 bg-[#131A26] p-2.5 border border-[#222B35] font-mono">
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 shrink-0">{t('Sá»± viá»‡c:', 'Event:')}</span>
                <strong className="text-red-400 font-semibold text-right truncate">{t(activeThreat.title)}</strong>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 shrink-0">{t('Vá»‹ trÃ­:', 'Location:')}</span>
                <span className="text-white text-right truncate">{t(activeThreat.location)}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-400 shrink-0">{t('Xá»­ lÃ½:', 'Response:')}</span>
                <span className="text-emerald-300 text-right truncate">{t(activeThreat.actionHint)}</span>
              </div>
            </div>

            {/* Feedback Dispatch Toast */}
            {dispatchStatus && (
              <div className="p-2 bg-blue-950/90 border border-blue-500 text-blue-300 text-xs font-mono animate-fadeIn shadow">
                {dispatchStatus}
              </div>
            )}
          </div>

          {/* Action Control Buttons */}
          <div className="pt-2 border-t border-[#222B35] space-y-1.5 font-mono">
            <button
              type="button"
              onClick={() => setIsEmergencyActive(!isEmergencyActive)}
              className={`w-full py-2 text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 shadow ${
                isEmergencyActive
                  ? 'bg-red-600 text-white animate-pulse shadow-red-500/50'
                  : 'bg-red-950/80 border border-red-500/80 text-red-300 hover:bg-red-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isEmergencyActive ? t('Táº¯t BÃ¡o Äá»™ng', 'Dismiss Alarm') : t('BÃ¡o Äá»™ng Kháº©n Cáº¥p', 'Emergency Alarm')}</span>
            </button>

            <button 
              type="button"
              onClick={handleDispatchSecurity}
              className="w-full py-2 bg-[#1C2533] hover:bg-[#C5A880] text-gray-200 hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('Äiá»u Äá»™ng Báº£o Vá»‡', 'Dispatch Security')}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. NHáº¬T KÃ Sá»° KIá»†N Váº¬N HÃ€NH THá»œI GIAN THá»°C */}
      <div className="p-3 bg-[#0E141E] border border-[#222B35] space-y-2 shadow font-mono">
        <div className="flex items-center justify-between text-xs text-gray-400 border-b border-[#1E293B] pb-1.5">
          <div className="flex items-center gap-2 font-bold text-white text-xs">
            <Activity className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{t('NHáº¬T KÃ Sá»° KIá»†N Váº¬N HÃ€NH', 'OPERATIONS EVENT LOG')}</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('Trá»±c tiáº¿p', 'Live')}
          </span>
        </div>

        {/* 3 DÃ²ng sá»± kiá»‡n ngáº¯n gá»n, Ä‘Ãºng nghiá»‡p vá»¥ */}
        <div className="space-y-1">
          {[
            {
              time: '01:00',
              type: 'FaceID T1',
              text: t('XÃ¡c thá»±c thÃ nh cÃ´ng - CÆ° dÃ¢n CÄƒn CH-06 má»Ÿ thang mÃ¡y', 'Verification success - Resident Unit CH-06 calls elevator'),
              badge: t('BÃŒNH THÆ¯á»œNG', 'NORMAL'),
              badgeColor: 'text-emerald-400 border-emerald-800/80 bg-emerald-950/40'
            },
            {
              time: '00:52',
              type: 'Barrier B1',
              text: t('Má»Ÿ tá»± Ä‘á»™ng - Xe Ã´ tÃ´ 51K-889.99 vÃ o háº§m', 'Auto gate open - Car 51K-889.99 enters basement'),
              badge: t('Há»¢P Lá»†', 'VALID'),
              badgeColor: 'text-cyan-400 border-cyan-800/80 bg-cyan-950/40'
            },
            {
              time: '00:45',
              type: 'Tráº¡m BÆ¡m B2',
              text: t('Ãp suáº¥t duy trÃ¬ á»•n Ä‘á»‹nh 6.2 bar (Bá»ƒ 94%)', 'Pressure maintained stably at 6.2 bar (Tank 94%)'),
              badge: t('CHUáº¨N', 'OPTIMAL'),
              badgeColor: 'text-blue-400 border-blue-800/80 bg-blue-950/40'
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="px-2.5 py-1.5 bg-[#121822] border border-[#1A2536] flex items-center justify-between gap-2.5 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-500 text-[10px] shrink-0">{item.time}</span>
                <span className="text-[#C5A880] shrink-0 font-semibold text-[11px]">[{item.type}]</span>
                <span className="text-gray-300 truncate text-[11px]">{item.text}</span>
              </div>
              <span className={`px-1.5 py-0.2 text-[8.5px] border shrink-0 font-bold ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
