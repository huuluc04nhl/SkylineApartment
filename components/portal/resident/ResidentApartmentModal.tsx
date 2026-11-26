'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Wind, 
  Sun, 
  Lock, 
  Flame, 
  PhoneCall, 
  Wrench, 
  CheckCircle2, 
  FileText, 
  Compass, 
  Maximize2,
  Tv,
  Wifi,
  Droplets,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import ApartmentModel3DViewer from '@/components/portal/shared/ApartmentModel3DViewer';
import { getSmartHomeState, saveSmartHomeState } from '@/lib/smartHomeStore';
import { getApartmentByCode } from '@/lib/apartmentStore';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/languageContext';

interface ResidentApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentCode: string;
  onNavigateToSmartHome?: () => void;
}

type TabType = '3D_VIEWER' | 'EQUIPMENTS' | 'HANDBOOK';

export default function ResidentApartmentModal({
  isOpen,
  onClose,
  apartmentCode,
  onNavigateToSmartHome
}: ResidentApartmentModalProps) {
  useEscapeKey(isOpen, onClose);
  const { currentUser } = useAuth();
  const { t, isEn } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('3D_VIEWER');
  const [smartState, setSmartState] = useState(() => getSmartHomeState(apartmentCode));

  const aptData = getApartmentByCode(apartmentCode);

  // Láº¯ng nghe cáº­p nháº­t Smart Home
  useEffect(() => {
    const handleUpdate = () => {
      setSmartState({ ...getSmartHomeState(apartmentCode) });
    };
    window.addEventListener('skyline_smarthome_update', handleUpdate);
    return () => window.removeEventListener('skyline_smarthome_update', handleUpdate);
  }, [apartmentCode]);

  if (!isOpen) return null;

  // Toggle Ä‘Ã¨n tá»«ng phÃ²ng
  const handleToggleLight = (room: 'livingRoom' | 'bedroomMaster' | 'kitchen' | 'balcony') => {
    const nextLights = {
      ...smartState.lights,
      [room]: !smartState.lights[room]
    };
    saveSmartHomeState(apartmentCode, { lights: nextLights });
  };

  // Toggle AC
  const handleToggleAC = () => {
    saveSmartHomeState(apartmentCode, { acPower: !smartState.acPower });
  };

  // Thay Ä‘á»•i nhiá»‡t Ä‘á»™ AC
  const handleChangeTemp = (delta: number) => {
    const nextTemp = Math.min(Math.max(smartState.acTemp + delta, 18), 30);
    saveSmartHomeState(apartmentCode, { acTemp: nextTemp });
  };

  // Toggle RÃ¨m
  const handleToggleCurtains = () => {
    saveSmartHomeState(apartmentCode, { curtainsOpen: !smartState.curtainsOpen });
  };

  // Toggle KhÃ³a
  const handleToggleDoor = () => {
    saveSmartHomeState(apartmentCode, { doorLocked: !smartState.doorLocked });
  };

  // Danh má»¥c trang thiáº¿t bá»‹ bÃ n giao cao cáº¥p chuáº©n 5 sao
  const PREMIUM_EQUIPMENTS = [
    {
      id: 'eq-1',
      name: t('KhÃ³a Cá»­a ThÃ´ng Minh FaceID Skyline v4.2', 'FaceID Smart Door Lock Skyline v4.2'),
      brand: t('Skyline SmartSec / Nháº­p kháº©u Äá»©c', 'Skyline SmartSec / German Imported'),
      location: t('Cá»­a chÃ­nh cÄƒn há»™', 'Main apartment entrance'),
      specs: t('Nháº­n diá»‡n khuÃ´n máº·t 3D AI trong 0.2s, tháº» tá»« NFC, mÃ£ sá»‘ áº£o chá»‘ng nhÃ¬n trá»™m, káº¿t ná»‘i mÃ£ hÃ³a báº£o máº­t BQL.', '3D AI facial recognition in 0.2s, NFC keycard, anti-peeping virtual PIN, encrypted management connection.'),
      status: smartState.doorLocked ? t('Äang KhÃ³a Chá»‘t An ToÃ n', 'Securely Locked') : t('Äang Má»Ÿ KhÃ³a', 'Unlocked'),
      warranty: t('Báº£o hÃ nh 36 thÃ¡ng (Äáº¿n 08/2029)', '36-month warranty (Until 08/2029)'),
      icon: Lock,
      color: '#10B981'
    },
    {
      id: 'eq-2',
      name: t('Há»‡ Thá»‘ng Äiá»u HÃ²a Trung TÃ¢m Multi-Split Inverter', 'Multi-Split Inverter Central Air Conditioning'),
      brand: t('Daikin VRV-S Multi / Nháº­t Báº£n', 'Daikin VRV-S Multi / Japan'),
      location: t('PhÃ²ng KhÃ¡ch, PN Master, PN 2', 'Living Room, Master Bedroom, Bed 2'),
      specs: t('Gas R32 tiáº¿t kiá»‡m Ä‘iá»‡n 65%, cÃ´ng nghá»‡ lá»c ion Streamer diá»‡t 99% vi khuáº©n, Ä‘iá»u khiá»ƒn nhiá»‡t Ä‘á»™ Ä‘á»™c láº­p tá»«ng phÃ²ng.', 'R32 refrigerant saving 65% energy, Streamer ion filtration eliminating 99% bacteria, independent room controls.'),
      status: smartState.acPower ? `${t('Äang Báº­t', 'Running')} (${smartState.acTemp}Â°C)` : t('Äang Táº¯t Chá»', 'Standby Off'),
      warranty: t('Báº£o hÃ nh chÃ­nh hÃ£ng 5 nÄƒm mÃ¡y nÃ©n', '5-year manufacturer compressor warranty'),
      icon: Wind,
      color: '#0284C7'
    },
    {
      id: 'eq-3',
      name: t('Há»‡ Thá»‘ng RÃ¨m Cá»­a Tá»± Äá»™ng ThÃ´ng Minh', 'Smart Automatic Curtain System'),
      brand: t('Aqara Zigbee 3.0 / Äá»™ng cÆ¡ siÃªu Ãªm', 'Aqara Zigbee 3.0 / Ultra-quiet motor'),
      location: t('Ban cÃ´ng sinh thÃ¡i & PN Master', 'Eco Balcony & Master Bedroom'),
      specs: t('Äá»™ng cÆ¡ kÃ©o rÃ¨m chá»‹u táº£i 50kg, Ä‘á»™ á»“n < 25dB, tá»± Ä‘á»™ng Ä‘Ã³ng khi trá»i náº¯ng gáº¯t vÃ  má»Ÿ lÃºc bÃ¬nh minh.', '50kg load capacity, <25dB ultra-quiet operation, auto-close under high sunlight, auto-open at sunrise.'),
      status: smartState.curtainsOpen ? t('Äang Má»Ÿ ÄÃ³n Ãnh SÃ¡ng', 'Open for Sunlight') : t('Äang ÄÃ³ng Cháº¯n SÃ¡ng', 'Closed for Shading'),
      warranty: t('Báº£o hÃ nh 24 thÃ¡ng', '24-month warranty'),
      icon: Sun,
      color: '#F59E0B'
    },
    {
      id: 'eq-4',
      name: t('Báº¿p Tá»« ÄÃ´i & HÃºt MÃ¹i Cáº£m á»¨ng Ã‚m Tá»§', 'Double Induction Hob & Concealed Hood'),
      brand: t('Bosch Series 8 / CHLB Äá»©c', 'Bosch Series 8 / Germany'),
      location: t('Khu vá»±c báº¿p & bÃ n Äƒn', 'Kitchen & dining area'),
      specs: t('Máº·t kÃ­nh gá»‘m thá»§y tinh Schott Ceran chá»‹u nhiá»‡t 1000Â°C, chá»©c nÄƒng PowerBoost gia nhiá»‡t nhanh, cáº£m biáº¿n tá»± ngáº¯t an toÃ n.', 'Schott Ceran ceramic glass resisting 1000Â°C, PowerBoost rapid heating, auto safety shut-off sensors.'),
      status: t('Sáºµn sÃ ng sá»­ dá»¥ng 220V', 'Ready for use 220V'),
      warranty: t('Báº£o hÃ nh 36 thÃ¡ng', '36-month warranty'),
      icon: Flame,
      color: '#EF4444'
    },
    {
      id: 'eq-5',
      name: t('Thiáº¿t Bá»‹ Vá»‡ Sinh ThÃ´ng Minh & Buá»“ng Táº¯m KÃ­nh', 'Smart Sanitary Ware & Glass Shower Enclosure'),
      brand: t('Kohler & TOTO Neorest / Má»¹ - Nháº­t', 'Kohler & TOTO Neorest / USA - Japan'),
      location: t('WC Master & WC Chung', 'Master & Common Bathrooms'),
      specs: t('Bá»“n cáº§u thÃ´ng minh tá»± Ä‘Ã³ng má»Ÿ náº¯p & sÆ°á»Ÿi áº¥m náº¯p ngá»“i, sen cÃ¢y Ä‘iá»u nhiá»‡t Ã¢m tÆ°á»ng máº¡ Chrome chá»‘ng bÃ¡m cáº·n, kÃ­nh cÆ°á»ng lá»±c 12mm.', 'Smart auto lid-opening toilet with heated seat, concealed thermostatic shower mixer, 12mm tempered safety glass.'),
      status: t('Há»‡ thá»‘ng cáº¥p thoÃ¡t nÆ°á»›c á»•n Ä‘á»‹nh (6.2 Bar)', 'Stable plumbing pressure (6.2 Bar)'),
      warranty: t('Báº£o hÃ nh 5 nÄƒm', '5-year warranty'),
      icon: Droplets,
      color: '#06B6D4'
    },
    {
      id: 'eq-6',
      name: t('Há»‡ KÃ­nh Há»™p 3 Lá»›p Low-E CÃ¡ch Ã‚m Chá»‘ng UV', 'Triple-Glazed Low-E Acoustic & UV Glass'),
      brand: t('Eurowindow / KÃ­nh Saint-Gobain PhÃ¡p', 'Eurowindow / Saint-Gobain Glass France'),
      location: t('ToÃ n bá»™ cá»­a sá»• vÃ  vÃ¡ch kÃ­nh cÄƒn há»™', 'All windows & architectural glass panels'),
      specs: t('KÃ­nh Low-E cáº£n nhiá»‡t 95%, cáº£n tia UV 99%, cÃ¡ch Ã¢m 45dB triá»‡t tiÃªu tiáº¿ng á»“n Ä‘Ã´ thá»‹, khung nhÃ´m cáº§u cÃ¡ch nhiá»‡t.', 'Low-E blocks 95% heat, 99% UV radiation, 45dB sound reduction against urban noise, thermal-break aluminum frame.'),
      status: t('Äáº¡t chuáº©n an toÃ n bÃ£o cáº¥p 14', 'Certified for category 14 storms'),
      warranty: t('Báº£o hÃ nh káº¿t cáº¥u 10 nÄƒm', '10-year structural warranty'),
      icon: ShieldCheck,
      color: '#8B5CF6'
    },
    {
      id: 'eq-7',
      name: t('Háº¡ Táº§ng Máº¡ng FTTH CÃ¡p Quang & Wi-Fi 6 Mesh', 'FTTH Fiber Optic & Wi-Fi 6 Mesh Network'),
      brand: t('Skyline GigaFiber & Cisco Mesh', 'Skyline GigaFiber & Cisco Mesh'),
      location: t('Tá»§ Ä‘iá»‡n Ã¢m tÆ°á»ng & tráº§n tháº¡ch cao', 'Recessed electrical cabinet & ceiling'),
      specs: t('ÄÆ°á»ng truyá»n 1 Gbps khÃ´ng giá»›i háº¡n bÄƒng thÃ´ng, thiáº¿t bá»‹ phÃ¡t Wi-Fi 6 phá»§ sÃ³ng 100% cÄƒn há»™ khÃ´ng gÃ³c cháº¿t.', '1 Gbps unlimited fiber connection, Wi-Fi 6 coverage eliminating dead zones across entire apartment.'),
      status: t('Káº¿t ná»‘i liÃªn tá»¥c 100% Online', 'Continuous 100% Online status'),
      warranty: t('Há»— trá»£ ká»¹ thuáº­t 24/7', '24/7 Technical Support'),
      icon: Wifi,
      color: '#EC4899'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0D1117] border border-[#C5A880]/80 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[94vh] overflow-hidden text-white rounded-none">
        
        {/* ============================================================= */}
        {/* 1. HEADER Sá»” TAY CÄ‚N Há»˜ THÆ¯á»¢NG LÆ¯U                            */}
        {/* ============================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border-b border-[#222B35] flex items-start justify-between gap-4 select-none">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] text-[#C5A880] font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{t('Sá»• Tay CÄƒn Há»™', 'Apartment Handbook')}</span>
              <span>â€¢</span>
              <span>{t('Táº§ng 12', '12th Floor')}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-1.5">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
                {t('CÄƒn Há»™', 'Apartment')} {apartmentCode}
              </h2>
              
              <span className="px-2.5 py-0.5 text-xs bg-[#1C2533] text-[#C5A880] border border-[#C5A880]/40 font-semibold">
                {t('Loáº¡i CÄƒn:', 'Unit Type:')} 2PN - 2WC
              </span>

              <span className="px-2.5 py-0.5 text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {t('Diá»‡n TÃ­ch ThÃ´ng Thá»§y: 78.5 mÂ²', 'Carpet Area: 78.5 mÂ²')}
              </span>

              <span className="text-xs text-gray-300 hidden md:inline">
                {t('Chá»§ Há»™:', 'Owner:')} <strong className="text-white">{currentUser?.full_name || 'Tráº§n Há»¯u Lá»±c'}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1C2533] border border-transparent hover:border-gray-700 transition-colors"
            title={t('ÄÃ³ng cá»­a sá»•', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================= */}
        {/* 2. THANH CHUYá»‚N Äá»”I TAB TRáº¢I NGHIá»†M Sá» CÆ¯ DÃ‚N                  */}
        {/* ============================================================= */}
        <div className="flex items-center gap-1 px-4 sm:px-5 bg-[#0A0E17] border-b border-[#222B35] overflow-x-auto text-xs font-mono select-none">
          <button
            type="button"
            onClick={() => setActiveTab('3D_VIEWER')}
            className={`py-3 px-3.5 whitespace-nowrap font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === '3D_VIEWER'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#121820]'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{t('1. Phá»‘i Cáº£nh & Máº·t Báº±ng', '1. 3D & Floor Plan')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EQUIPMENTS')}
            className={`py-3 px-3.5 whitespace-nowrap font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'EQUIPMENTS'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#121820]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t('2. Thiáº¿t Bá»‹ BÃ n Giao', '2. Equipment List')} ({PREMIUM_EQUIPMENTS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HANDBOOK')}
            className={`py-3 px-3.5 whitespace-nowrap font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'HANDBOOK'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#161D26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#121820]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('3. Cáº©m Nang & Hotline', '3. Handbook & Hotline')}</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* 3. Ná»˜I DUNG CHÃNH Cá»¦A Tá»ªNG TAB                                */}
        {/* ============================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          
          {/* ----------------------------------------------------------- */}
          {/* TAB 1: PHá»I Cáº¢NH 3D & KÃCH THÆ¯á»šC PHÃ’NG                      */}
          {/* ----------------------------------------------------------- */}
          {activeTab === '3D_VIEWER' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Tháº» mÃ´ táº£ nhanh khÃ´ng gian */}
              <div className="p-3 bg-[#121820] border border-[#222B35] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-gray-300">
                    {t('HÆ°á»›ng Cá»­a ChÃ­nh:', 'Main Door Facing:')} <strong className="text-white">{t('TÃ¢y Báº¯c', 'Northwest')}</strong> â€¢ {t('HÆ°á»›ng Ban CÃ´ng:', 'Balcony Facing:')} <strong className="text-[#C5A880]">{t('ÄÃ´ng Nam (ÄÃ³n giÃ³ mÃ¡t & view sÃ´ng SÃ i GÃ²n)', 'Southeast (Cool breeze & Saigon River view)')}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-[#C5A880] font-mono">
                  {t('âœ¨ Cháº¡m vÃ o tá»«ng phÃ²ng Ä‘á»ƒ xem kÃ­ch thÆ°á»›c thá»±c táº¿ & Ä‘iá»u khiá»ƒn thiáº¿t bá»‹', 'âœ¨ Tap each room to view dimensions & control devices')}
                </span>
              </div>

              {/* Viewer MÃ´ HÃ¬nh KhÃ´ng Gian 3D ThÃ´ng Minh */}
              <ApartmentModel3DViewer
                apartmentCode={apartmentCode}
                apartmentType="2PN - 2WC"
                clearArea={78.5}
                lights={smartState.lights}
                acPower={smartState.acPower}
                acTemp={smartState.acTemp}
                curtainsOpen={smartState.curtainsOpen}
                doorLocked={smartState.doorLocked}
                waterLeakActive={false}
                onToggleLight={handleToggleLight}
                onToggleDoor={handleToggleDoor}
                onToggleCurtains={handleToggleCurtains}
                onToggleAC={handleToggleAC}
                onChangeTemp={handleChangeTemp}
                interactive={true}
              />

              {/* Báº£ng tá»•ng há»£p diá»‡n tÃ­ch chuáº©n kiáº¿n trÃºc */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { name: t('PhÃ²ng KhÃ¡ch & Ä‚n', 'Living & Dining Room'), area: '24.5 mÂ²', dim: '5.60m x 4.40m' },
                  { name: t('PhÃ²ng Ngá»§ Master', 'Master Bedroom'), area: '16.5 mÂ²', dim: '4.60m x 3.60m' },
                  { name: t('PhÃ²ng Ngá»§ 2', 'Bedroom 2'), area: '11.8 mÂ²', dim: '3.50m x 3.40m' },
                  { name: t('Khu Báº¿p Náº¥u', 'Kitchen Area'), area: '7.5 mÂ²', dim: '3.00m x 2.50m' },
                  { name: t('Ban CÃ´ng Sinh ThÃ¡i', 'Eco Balcony'), area: '6.7 mÂ²', dim: '4.50m x 1.50m' },
                  { name: t('WC Master', 'Master Bath'), area: '4.2 mÂ²', dim: '2.20m x 1.90m' },
                  { name: t('WC Chung', 'Common Bath'), area: '3.8 mÂ²', dim: '2.00m x 1.90m' },
                  { name: t('Sáº£nh ÄÃ³n Cá»­a VÃ o', 'Entry Foyer'), area: '3.5 mÂ²', dim: '1.90m x 1.80m' },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-[#121820] border border-[#222B35] rounded-none space-y-0.5">
                    <div className="text-[11px] text-gray-400 font-medium truncate">{item.name}</div>
                    <div className="text-sm font-bold text-white font-mono">{item.area}</div>
                    <div className="text-[10px] text-[#C5A880] font-mono">{item.dim}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 2: THIáº¾T Bá»Š BÃ€N GIAO CAO Cáº¤P                             */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'EQUIPMENTS' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-[#121820] border border-[#222B35] text-xs text-gray-300 flex items-center justify-between">
                <span>{t('Danh má»¥c thiáº¿t bá»‹ bÃ n giao cÄƒn há»™', 'Handover equipment catalog for apartment')} <strong>{apartmentCode}</strong>.</span>
                <span className="text-emerald-400 font-mono text-[11px] hidden sm:inline">{t('BÃ n giao chuáº©n âœ“', 'Standard Handover âœ“')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PREMIUM_EQUIPMENTS.map((eq) => {
                  const Icon = eq.icon;
                  return (
                    <div 
                      key={eq.id}
                      className="p-3.5 bg-[#121820] border border-[#222B35] hover:border-[#C5A880]/60 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-8 h-8 rounded-none border border-[#2D3748] flex items-center justify-center bg-[#161B22]"
                            style={{ color: eq.color }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-xs sm:text-sm">{eq.name}</h4>
                            <div className="text-[10px] text-gray-400 font-mono">{eq.brand}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#161B22] border border-[#2D3748] text-gray-300 whitespace-nowrap">
                          {eq.location}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                        {eq.specs}
                      </p>

                      <div className="pt-1.5 border-t border-[#1C2533] flex items-center justify-between text-[10.5px] font-mono">
                        <span className="text-emerald-400 font-semibold">{eq.status}</span>
                        <span className="text-gray-400">{eq.warranty}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 3: Cáº¨M NANG CÄ‚N Há»˜ & HOTLINE Há»– TRá»¢ 24/7                 */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'HANDBOOK' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Hotline Kháº©n Cáº¥p BQL & Ká»¹ Thuáº­t Chung CÆ° */}
              <div className="p-4 bg-gradient-to-r from-[#1C2533] to-[#121820] border border-[#C5A880]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        {t('ÄÆ°á»ng DÃ¢y NÃ³ng Ká»¹ Thuáº­t & Dá»‹ch Vá»¥ CÆ° DÃ¢n 24/7', '24/7 Technical & Resident Service Hotline')}
                      </h3>
                      <p className="text-[11px] text-gray-300">
                        {t('Äá»™i ngÅ© ká»¹ sÆ° chung cÆ° tÃºc trá»±c thÆ°á»ng trá»±c, há»— trá»£ xá»­ lÃ½ ká»¹ thuáº­t trong vÃ²ng 10 phÃºt.', 'Building technical engineers on standby 24/7, responding to requests within 10 minutes.')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{t('Tá»•ng ÄÃ i Ban Quáº£n LÃ½', 'Building Management Hotline')}</span>
                    <div className="text-base font-bold text-[#C5A880] font-mono">1900 8899 ({t('PhÃ­m 1', 'Ext 1')})</div>
                    <span className="text-[10px] text-emerald-400">{t('Trá»±c 24/7 Ä‘á»‘i soÃ¡t', '24/7 Support')}</span>
                  </div>

                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{t('Há»— Trá»£ Ká»¹ Thuáº­t & Äiá»‡n NÆ°á»›c', 'Technical & MEP Hotline')}</span>
                    <div className="text-base font-bold text-sky-400 font-mono">028 7300 9988</div>
                    <span className="text-[10px] text-sky-400">{t('Ká»¹ sÆ° táº§ng trá»±c tiáº¿p', 'Floor engineer on duty')}</span>
                  </div>

                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{t('Lá»… TÃ¢n & Dá»‹ch Vá»¥ Tiá»‡n Ãch', 'Concierge & Amenities Desk')}</span>
                    <div className="text-base font-bold text-emerald-400 font-mono">028 7300 9989</div>
                    <span className="text-[10px] text-gray-400">{t('Sáº£nh Ä‘Ã³n táº§ng 1', 'Main Lobby Level 1')}</span>
                  </div>
                </div>
              </div>

              {/* Cáº©m nang an toÃ n Ä‘iá»‡n nÆ°á»›c & thiáº¿t bá»‹ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    {t('Vá»‹ TrÃ­ Van KhÃ³a NÆ°á»›c & Tá»§ Äiá»‡n Tá»•ng', 'Main Valves & Circuit Breaker Location')}
                  </h4>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4 font-light leading-relaxed">
                    <li><strong>{t('Tá»§ Aptomat Äiá»‡n Tá»•ng:', 'Main Circuit Breaker:')}</strong> {t('Náº±m á»Ÿ sáº£nh Ä‘Ã³n cá»­a vÃ o, phÃ­a sau tá»§ giÃ y Ã¢m tÆ°á»ng. Aptomat chá»‘ng giáº­t tá»± ngáº¯t RCBO an toÃ n.', 'Located in the entry foyer behind the shoe cabinet. Features safe RCBO automatic shock protection.')}</li>
                    <li><strong>{t('Van Cáº¥p NÆ°á»›c Sáº¡ch Tá»•ng:', 'Main Clean Water Valve:')}</strong> {t('Äáº·t trong há»™p ká»¹ thuáº­t cáº¡nh cá»­a chÃ­nh bÃªn ngoÃ i hÃ nh lang táº§ng 12. Khi cÃ³ sá»± cá»‘ rÃ² rá»‰, há»‡ thá»‘ng AI sáº½ tá»± Ä‘á»™ng Ä‘Ã³ng van Ä‘iá»‡n tá»« trong 3 giÃ¢y.', 'Located in the service shaft next to entrance on 12th floor corridor. In case of leaks, AI auto-shuts the solenoid valve in 3s.')}</li>
                    <li><strong>{t('Äáº§u BÃ¡o ChÃ¡y & KhÃ³i ThÃ´ng Minh:', 'Smart Fire & Smoke Sensors:')}</strong> {t('Bá»‘ trÃ­ táº¡i phÃ²ng khÃ¡ch vÃ  2 phÃ²ng ngá»§, káº¿t ná»‘i trá»±c tiáº¿p vá»›i trung tÃ¢m PCCC chung cÆ°.', 'Installed in living room and both bedrooms, connected directly to central fire command.')}</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-sky-300">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    {t('Quy Chuáº©n Sá»­ Dá»¥ng CÄƒn Há»™ & Ban CÃ´ng', 'Apartment & Balcony Living Standards')}
                  </h4>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4 font-light leading-relaxed">
                    <li><strong>{t('Ban CÃ´ng Sinh ThÃ¡i:', 'Eco Balcony:')}</strong> {t('Thiáº¿t káº¿ lan can kÃ­nh an toÃ n cao 1.4m. Tuyá»‡t Ä‘á»‘i khÃ´ng treo Ä‘á»“ náº·ng quÃ¡ táº£i hoáº·c xáº£ rÃ¡c qua ban cÃ´ng.', 'Features 1.4m safety glass railing. Please do not hang overweight items or dispose of debris over the rail.')}</li>
                    <li><strong>{t('Thiáº¿t Káº¿ Ná»™i Tháº¥t:', 'Interior Fit-out:')}</strong> {t('Má»i hoáº¡t Ä‘á»™ng khoan Ä‘á»¥c hoáº·c thay Ä‘á»•i káº¿t cáº¥u tÆ°á»ng chá»‹u lá»±c cáº§n Ä‘Äƒng kÃ½ trÆ°á»›c vá»›i BQL Ä‘á»ƒ báº£o Ä‘áº£m an toÃ n tÄ©nh táº£i.', 'Any drilling or alterations to load-bearing walls must be pre-approved by Management for structural safety.')}</li>
                    <li><strong>{t('Báº£o Hiá»ƒm Chung CÆ°:', 'Building Insurance:')}</strong> {t('ToÃ n bá»™ cÄƒn há»™ Ä‘Æ°á»£c chá»§ Ä‘áº§u tÆ° mua báº£o hiá»ƒm chÃ¡y ná»• vÃ  rá»§i ro tÃ i sáº£n trá»n gÃ³i Ä‘áº¿n nÄƒm 2030.', 'All residences are covered under comprehensive building fire and property insurance until 2030.')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================= */}
        {/* 4. FOOTER                                                     */}
        {/* ============================================================= */}
        <div className="p-3 sm:p-4 bg-[#0A0E17] border-t border-[#222B35] flex items-center justify-between text-xs text-gray-400">
          <span className="font-mono text-[11px] text-gray-400">
            {t('MÃ£ Ä‘á»‹nh danh sá»• sá»‘:', 'Digital Title ID:')} <strong className="text-white">SKYLINE-CH06-TITLED</strong>
          </span>
          <span className="text-[10px] text-[#C5A880] font-mono font-bold tracking-wider">
            {t('Báº¢N QUYá»€N Sá» SKYLINE RESIDENCE', 'SKYLINE RESIDENCE DIGITAL ASSET')}
          </span>
        </div>

      </div>
    </div>
  );
}
