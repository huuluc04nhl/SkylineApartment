'use client';

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
  apartmentCode?: string;
  onNavigateToSmartHome?: () => void;
}

type TabType = '3D_VIEWER' | 'EQUIPMENTS' | 'HANDBOOK';

export default function ResidentApartmentModal({
  isOpen,
  onClose,
  apartmentCode = 'CH-06',
  onNavigateToSmartHome
}: ResidentApartmentModalProps) {
  const { currentUser } = useAuth();
  const { t, isEn } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('3D_VIEWER');
  const [smartState, setSmartState] = useState(() => getSmartHomeState(apartmentCode));

  const aptData = getApartmentByCode(apartmentCode);

  // Lắng nghe cập nhật Smart Home
  useEffect(() => {
    const handleUpdate = () => {
      setSmartState({ ...getSmartHomeState(apartmentCode) });
    };
    window.addEventListener('skyline_smarthome_update', handleUpdate);
    return () => window.removeEventListener('skyline_smarthome_update', handleUpdate);
  }, [apartmentCode]);

  if (!isOpen) return null;

  // Toggle đèn từng phòng
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

  // Thay đổi nhiệt độ AC
  const handleChangeTemp = (delta: number) => {
    const nextTemp = Math.min(Math.max(smartState.acTemp + delta, 18), 30);
    saveSmartHomeState(apartmentCode, { acTemp: nextTemp });
  };

  // Toggle Rèm
  const handleToggleCurtains = () => {
    saveSmartHomeState(apartmentCode, { curtainsOpen: !smartState.curtainsOpen });
  };

  // Toggle Khóa
  const handleToggleDoor = () => {
    saveSmartHomeState(apartmentCode, { doorLocked: !smartState.doorLocked });
  };

  // Danh mục trang thiết bị bàn giao cao cấp chuẩn 5 sao
  const PREMIUM_EQUIPMENTS = [
    {
      id: 'eq-1',
      name: t('Khóa Cửa Thông Minh FaceID Skyline v4.2', 'FaceID Smart Door Lock Skyline v4.2'),
      brand: t('Skyline SmartSec / Nhập khẩu Đức', 'Skyline SmartSec / German Imported'),
      location: t('Cửa chính căn hộ', 'Main apartment entrance'),
      specs: t('Nhận diện khuôn mặt 3D AI trong 0.2s, thẻ từ NFC, mã số ảo chống nhìn trộm, kết nối mã hóa bảo mật BQL.', '3D AI facial recognition in 0.2s, NFC keycard, anti-peeping virtual PIN, encrypted management connection.'),
      status: smartState.doorLocked ? t('Đang Khóa Chốt An Toàn', 'Securely Locked') : t('Đang Mở Khóa', 'Unlocked'),
      warranty: t('Bảo hành 36 tháng (Đến 08/2029)', '36-month warranty (Until 08/2029)'),
      icon: Lock,
      color: '#10B981'
    },
    {
      id: 'eq-2',
      name: t('Hệ Thống Điều Hòa Trung Tâm Multi-Split Inverter', 'Multi-Split Inverter Central Air Conditioning'),
      brand: t('Daikin VRV-S Multi / Nhật Bản', 'Daikin VRV-S Multi / Japan'),
      location: t('Phòng Khách, PN Master, PN 2', 'Living Room, Master Bedroom, Bed 2'),
      specs: t('Gas R32 tiết kiệm điện 65%, công nghệ lọc ion Streamer diệt 99% vi khuẩn, điều khiển nhiệt độ độc lập từng phòng.', 'R32 refrigerant saving 65% energy, Streamer ion filtration eliminating 99% bacteria, independent room controls.'),
      status: smartState.acPower ? `${t('Đang Bật', 'Running')} (${smartState.acTemp}°C)` : t('Đang Tắt Chờ', 'Standby Off'),
      warranty: t('Bảo hành chính hãng 5 năm máy nén', '5-year manufacturer compressor warranty'),
      icon: Wind,
      color: '#0284C7'
    },
    {
      id: 'eq-3',
      name: t('Hệ Thống Rèm Cửa Tự Động Thông Minh', 'Smart Automatic Curtain System'),
      brand: t('Aqara Zigbee 3.0 / Động cơ siêu êm', 'Aqara Zigbee 3.0 / Ultra-quiet motor'),
      location: t('Ban công sinh thái & PN Master', 'Eco Balcony & Master Bedroom'),
      specs: t('Động cơ kéo rèm chịu tải 50kg, độ ồn < 25dB, tự động đóng khi trời nắng gắt và mở lúc bình minh.', '50kg load capacity, <25dB ultra-quiet operation, auto-close under high sunlight, auto-open at sunrise.'),
      status: smartState.curtainsOpen ? t('Đang Mở Đón Ánh Sáng', 'Open for Sunlight') : t('Đang Đóng Chắn Sáng', 'Closed for Shading'),
      warranty: t('Bảo hành 24 tháng', '24-month warranty'),
      icon: Sun,
      color: '#F59E0B'
    },
    {
      id: 'eq-4',
      name: t('Bếp Từ Đôi & Hút Mùi Cảm Ứng Âm Tủ', 'Double Induction Hob & Concealed Hood'),
      brand: t('Bosch Series 8 / CHLB Đức', 'Bosch Series 8 / Germany'),
      location: t('Khu vực bếp & bàn ăn', 'Kitchen & dining area'),
      specs: t('Mặt kính gốm thủy tinh Schott Ceran chịu nhiệt 1000°C, chức năng PowerBoost gia nhiệt nhanh, cảm biến tự ngắt an toàn.', 'Schott Ceran ceramic glass resisting 1000°C, PowerBoost rapid heating, auto safety shut-off sensors.'),
      status: t('Sẵn sàng sử dụng 220V', 'Ready for use 220V'),
      warranty: t('Bảo hành 36 tháng', '36-month warranty'),
      icon: Flame,
      color: '#EF4444'
    },
    {
      id: 'eq-5',
      name: t('Thiết Bị Vệ Sinh Thông Minh & Buồng Tắm Kính', 'Smart Sanitary Ware & Glass Shower Enclosure'),
      brand: t('Kohler & TOTO Neorest / Mỹ - Nhật', 'Kohler & TOTO Neorest / USA - Japan'),
      location: t('WC Master & WC Chung', 'Master & Common Bathrooms'),
      specs: t('Bồn cầu thông minh tự đóng mở nắp & sưởi ấm nắp ngồi, sen cây điều nhiệt âm tường mạ Chrome chống bám cặn, kính cường lực 12mm.', 'Smart auto lid-opening toilet with heated seat, concealed thermostatic shower mixer, 12mm tempered safety glass.'),
      status: t('Hệ thống cấp thoát nước ổn định (6.2 Bar)', 'Stable plumbing pressure (6.2 Bar)'),
      warranty: t('Bảo hành 5 năm', '5-year warranty'),
      icon: Droplets,
      color: '#06B6D4'
    },
    {
      id: 'eq-6',
      name: t('Hệ Kính Hộp 3 Lớp Low-E Cách Âm Chống UV', 'Triple-Glazed Low-E Acoustic & UV Glass'),
      brand: t('Eurowindow / Kính Saint-Gobain Pháp', 'Eurowindow / Saint-Gobain Glass France'),
      location: t('Toàn bộ cửa sổ và vách kính căn hộ', 'All windows & architectural glass panels'),
      specs: t('Kính Low-E cản nhiệt 95%, cản tia UV 99%, cách âm 45dB triệt tiêu tiếng ồn đô thị, khung nhôm cầu cách nhiệt.', 'Low-E blocks 95% heat, 99% UV radiation, 45dB sound reduction against urban noise, thermal-break aluminum frame.'),
      status: t('Đạt chuẩn an toàn bão cấp 14', 'Certified for category 14 storms'),
      warranty: t('Bảo hành kết cấu 10 năm', '10-year structural warranty'),
      icon: ShieldCheck,
      color: '#8B5CF6'
    },
    {
      id: 'eq-7',
      name: t('Hạ Tầng Mạng FTTH Cáp Quang & Wi-Fi 6 Mesh', 'FTTH Fiber Optic & Wi-Fi 6 Mesh Network'),
      brand: t('Skyline GigaFiber & Cisco Mesh', 'Skyline GigaFiber & Cisco Mesh'),
      location: t('Tủ điện âm tường & trần thạch cao', 'Recessed electrical cabinet & ceiling'),
      specs: t('Đường truyền 1 Gbps không giới hạn băng thông, thiết bị phát Wi-Fi 6 phủ sóng 100% căn hộ không góc chết.', '1 Gbps unlimited fiber connection, Wi-Fi 6 coverage eliminating dead zones across entire apartment.'),
      status: t('Kết nối liên tục 100% Online', 'Continuous 100% Online status'),
      warranty: t('Hỗ trợ kỹ thuật 24/7', '24/7 Technical Support'),
      icon: Wifi,
      color: '#EC4899'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0D1117] border border-[#C5A880]/80 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[94vh] overflow-hidden text-white rounded-none">
        
        {/* ============================================================= */}
        {/* 1. HEADER SỔ TAY CĂN HỘ THƯỢNG LƯU                            */}
        {/* ============================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161D26] via-[#121820] to-[#0D1117] border-b border-[#222B35] flex items-start justify-between gap-4 select-none">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] text-[#C5A880] font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{t('Sổ Tay Căn Hộ', 'Apartment Handbook')}</span>
              <span>•</span>
              <span>{t('Tầng 12', '12th Floor')}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-1.5">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
                {t('Căn Hộ', 'Apartment')} {apartmentCode}
              </h2>
              
              <span className="px-2.5 py-0.5 text-xs bg-[#1C2533] text-[#C5A880] border border-[#C5A880]/40 font-semibold">
                {t('Loại Căn:', 'Unit Type:')} 2PN - 2WC
              </span>

              <span className="px-2.5 py-0.5 text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {t('Diện Tích Thông Thủy: 78.5 m²', 'Carpet Area: 78.5 m²')}
              </span>

              <span className="text-xs text-gray-300 hidden md:inline">
                {t('Chủ Hộ:', 'Owner:')} <strong className="text-white">{currentUser?.full_name || 'Trần Hữu Lực'}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1C2533] border border-transparent hover:border-gray-700 transition-colors"
            title={t('Đóng cửa sổ', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================= */}
        {/* 2. THANH CHUYỂN ĐỔI TAB TRẢI NGHIỆM SỐ CƯ DÂN                  */}
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
            <span>{t('1. Phối Cảnh & Mặt Bằng', '1. 3D & Floor Plan')}</span>
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
            <span>{t('2. Thiết Bị Bàn Giao', '2. Equipment List')} ({PREMIUM_EQUIPMENTS.length})</span>
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
            <span>{t('3. Cẩm Nang & Hotline', '3. Handbook & Hotline')}</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* 3. NỘI DUNG CHÍNH CỦA TỪNG TAB                                */}
        {/* ============================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          
          {/* ----------------------------------------------------------- */}
          {/* TAB 1: PHỐI CẢNH 3D & KÍCH THƯỚC PHÒNG                      */}
          {/* ----------------------------------------------------------- */}
          {activeTab === '3D_VIEWER' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Thẻ mô tả nhanh không gian */}
              <div className="p-3 bg-[#121820] border border-[#222B35] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-gray-300">
                    {t('Hướng Cửa Chính:', 'Main Door Facing:')} <strong className="text-white">{t('Tây Bắc', 'Northwest')}</strong> • {t('Hướng Ban Công:', 'Balcony Facing:')} <strong className="text-[#C5A880]">{t('Đông Nam (Đón gió mát & view sông Sài Gòn)', 'Southeast (Cool breeze & Saigon River view)')}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-[#C5A880] font-mono">
                  {t('✨ Chạm vào từng phòng để xem kích thước thực tế & điều khiển thiết bị', '✨ Tap each room to view dimensions & control devices')}
                </span>
              </div>

              {/* Viewer Mô Hình Không Gian 3D Thông Minh */}
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

              {/* Bảng tổng hợp diện tích chuẩn kiến trúc */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { name: t('Phòng Khách & Ăn', 'Living & Dining Room'), area: '24.5 m²', dim: '5.60m x 4.40m' },
                  { name: t('Phòng Ngủ Master', 'Master Bedroom'), area: '16.5 m²', dim: '4.60m x 3.60m' },
                  { name: t('Phòng Ngủ 2', 'Bedroom 2'), area: '11.8 m²', dim: '3.50m x 3.40m' },
                  { name: t('Khu Bếp Nấu', 'Kitchen Area'), area: '7.5 m²', dim: '3.00m x 2.50m' },
                  { name: t('Ban Công Sinh Thái', 'Eco Balcony'), area: '6.7 m²', dim: '4.50m x 1.50m' },
                  { name: t('WC Master', 'Master Bath'), area: '4.2 m²', dim: '2.20m x 1.90m' },
                  { name: t('WC Chung', 'Common Bath'), area: '3.8 m²', dim: '2.00m x 1.90m' },
                  { name: t('Sảnh Đón Cửa Vào', 'Entry Foyer'), area: '3.5 m²', dim: '1.90m x 1.80m' },
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
          {/* TAB 2: THIẾT BỊ BÀN GIAO CAO CẤP                             */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'EQUIPMENTS' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 bg-[#121820] border border-[#222B35] text-xs text-gray-300 flex items-center justify-between">
                <span>{t('Danh mục thiết bị bàn giao căn hộ', 'Handover equipment catalog for apartment')} <strong>{apartmentCode}</strong>.</span>
                <span className="text-emerald-400 font-mono text-[11px] hidden sm:inline">{t('Bàn giao chuẩn ✓', 'Standard Handover ✓')}</span>
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
          {/* TAB 3: CẨM NANG CĂN HỘ & HOTLINE HỖ TRỢ 24/7                 */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'HANDBOOK' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Hotline Khẩn Cấp BQL & Kỹ Thuật Chung Cư */}
              <div className="p-4 bg-gradient-to-r from-[#1C2533] to-[#121820] border border-[#C5A880]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        {t('Đường Dây Nóng Kỹ Thuật & Dịch Vụ Cư Dân 24/7', '24/7 Technical & Resident Service Hotline')}
                      </h3>
                      <p className="text-[11px] text-gray-300">
                        {t('Đội ngũ kỹ sư chung cư túc trực thường trực, hỗ trợ xử lý kỹ thuật trong vòng 10 phút.', 'Building technical engineers on standby 24/7, responding to requests within 10 minutes.')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{t('Tổng Đài Ban Quản Lý', 'Building Management Hotline')}</span>
                    <div className="text-base font-bold text-[#C5A880] font-mono">1900 8899 ({t('Phím 1', 'Ext 1')})</div>
                    <span className="text-[10px] text-emerald-400">{t('Trực 24/7 đối soát', '24/7 Support')}</span>
                  </div>

                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{t('Hỗ Trợ Kỹ Thuật & Điện Nước', 'Technical & MEP Hotline')}</span>
                    <div className="text-base font-bold text-sky-400 font-mono">028 7300 9988</div>
                    <span className="text-[10px] text-sky-400">{t('Kỹ sư tầng trực tiếp', 'Floor engineer on duty')}</span>
                  </div>

                  <div className="p-2.5 bg-[#0D1117] border border-[#222B35] space-y-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{t('Lễ Tân & Dịch Vụ Tiện Ích', 'Concierge & Amenities Desk')}</span>
                    <div className="text-base font-bold text-emerald-400 font-mono">028 7300 9989</div>
                    <span className="text-[10px] text-gray-400">{t('Sảnh đón tầng 1', 'Main Lobby Level 1')}</span>
                  </div>
                </div>
              </div>

              {/* Cẩm nang an toàn điện nước & thiết bị */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    {t('Vị Trí Van Khóa Nước & Tủ Điện Tổng', 'Main Valves & Circuit Breaker Location')}
                  </h4>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4 font-light leading-relaxed">
                    <li><strong>{t('Tủ Aptomat Điện Tổng:', 'Main Circuit Breaker:')}</strong> {t('Nằm ở sảnh đón cửa vào, phía sau tủ giày âm tường. Aptomat chống giật tự ngắt RCBO an toàn.', 'Located in the entry foyer behind the shoe cabinet. Features safe RCBO automatic shock protection.')}</li>
                    <li><strong>{t('Van Cấp Nước Sạch Tổng:', 'Main Clean Water Valve:')}</strong> {t('Đặt trong hộp kỹ thuật cạnh cửa chính bên ngoài hành lang tầng 12. Khi có sự cố rò rỉ, hệ thống AI sẽ tự động đóng van điện từ trong 3 giây.', 'Located in the service shaft next to entrance on 12th floor corridor. In case of leaks, AI auto-shuts the solenoid valve in 3s.')}</li>
                    <li><strong>{t('Đầu Báo Cháy & Khói Thông Minh:', 'Smart Fire & Smoke Sensors:')}</strong> {t('Bố trí tại phòng khách và 2 phòng ngủ, kết nối trực tiếp với trung tâm PCCC chung cư.', 'Installed in living room and both bedrooms, connected directly to central fire command.')}</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#121820] border border-[#222B35] space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-sky-300">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    {t('Quy Chuẩn Sử Dụng Căn Hộ & Ban Công', 'Apartment & Balcony Living Standards')}
                  </h4>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4 font-light leading-relaxed">
                    <li><strong>{t('Ban Công Sinh Thái:', 'Eco Balcony:')}</strong> {t('Thiết kế lan can kính an toàn cao 1.4m. Tuyệt đối không treo đồ nặng quá tải hoặc xả rác qua ban công.', 'Features 1.4m safety glass railing. Please do not hang overweight items or dispose of debris over the rail.')}</li>
                    <li><strong>{t('Thiết Kế Nội Thất:', 'Interior Fit-out:')}</strong> {t('Mọi hoạt động khoan đục hoặc thay đổi kết cấu tường chịu lực cần đăng ký trước với BQL để bảo đảm an toàn tĩnh tải.', 'Any drilling or alterations to load-bearing walls must be pre-approved by Management for structural safety.')}</li>
                    <li><strong>{t('Bảo Hiểm Chung Cư:', 'Building Insurance:')}</strong> {t('Toàn bộ căn hộ được chủ đầu tư mua bảo hiểm cháy nổ và rủi ro tài sản trọn gói đến năm 2030.', 'All residences are covered under comprehensive building fire and property insurance until 2030.')}</li>
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
            {t('Mã định danh sổ số:', 'Digital Title ID:')} <strong className="text-white">SKYLINE-CH06-TITLED</strong>
          </span>
          <span className="text-[10px] text-[#C5A880] font-mono font-bold tracking-wider">
            {t('BẢN QUYỀN SỐ SKYLINE RESIDENCE', 'SKYLINE RESIDENCE DIGITAL ASSET')}
          </span>
        </div>

      </div>
    </div>
  );
}
