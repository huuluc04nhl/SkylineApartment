'use client';

import React from 'react';
import { 
  X, 
  Layers, 
  Building, 
  Compass, 
  Maximize2, 
  UserCheck, 
  Key, 
  ExternalLink, 
  Activity, 
  Coins, 
  Zap, 
  Droplets, 
  Check, 
  ArrowRight,
  Info
} from 'lucide-react';
import { ApartmentUnit } from '@/lib/apartmentStore';
import { CAD_FLOOR_UNITS_CONFIG, getApartmentFinancialMetrics } from './buildingConstants';
import CadFloorplanSvgModel from '../models/CadFloorplanSvgModel';
import { useLanguage } from '@/lib/languageContext';

export interface FloorPlanDeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFloor: number;
  selectedBlock: string;
  currentBlockName: string;
  apartments: ApartmentUnit[];
  selectedAptCode: string;
  onSelectAptCode: (code: string) => void;
  onOpenAssignModal: (unit: ApartmentUnit) => void;
  onOpenDetailModal: (unit: ApartmentUnit) => void;
}

export default function FloorPlanDeepDiveModal({
  isOpen,
  onClose,
  selectedFloor,
  selectedBlock,
  currentBlockName,
  apartments,
  selectedAptCode,
  onSelectAptCode,
  onOpenAssignModal,
  onOpenDetailModal,
}: FloorPlanDeepDiveModalProps) {
  const { t, isEn } = useLanguage();
  const [floorPlanViewMode, setFloorPlanViewMode] = React.useState<'CAD_VECTOR' | 'BLUEPRINT_IMAGE'>('CAD_VECTOR');
  const [floorPlanFilterWing, setFloorPlanFilterWing] = React.useState<'ALL' | 'NORTH' | 'SOUTH' | 'WEST'>('ALL');
  const [floorPlanCadZoom, setFloorPlanCadZoom] = React.useState<number>(1);
  const [detailTab, setDetailTab] = React.useState<'OVERVIEW' | 'FINANCIAL' | 'TECHNICAL'>('OVERVIEW');

  if (!isOpen) return null;

  // Danh sách 21 căn của tầng đang chọn theo bản vẽ CAD kiến trúc Chung Cư BS-09 & The Tropical
  const floorExpandedUnits = CAD_FLOOR_UNITS_CONFIG.map(cfg => {
    const chCode = cfg.code;
    const targetCode = selectedFloor === 30 ? chCode : `${selectedFloor}-${chCode}`;
    const found = apartments.find(u => 
      u.floor === selectedFloor && (
        u.code.toUpperCase() === chCode ||
        u.code.toUpperCase() === targetCode ||
        u.code.toUpperCase().endsWith(`-${chCode}`) ||
        u.code.toUpperCase().endsWith(chCode) ||
        u.code.toUpperCase().endsWith(`-${cfg.num}`) ||
        u.code.toUpperCase().endsWith(cfg.num) ||
        (selectedFloor === 30 && u.code === chCode)
      )
    );

    if (found) {
      return found;
    }

    return ({
      code: targetCode,
      tower: selectedBlock === 'BS-10' ? 'B' : 'A',
      towerName: currentBlockName,
      floor: selectedFloor,
      type: cfg.type,
      typeLabel: cfg.typeLabel,
      status: 'VACANT',
      statusLabel: 'Căn Hộ Trống',
      area: cfg.area,
      bedrooms: cfg.beds,
      bathrooms: cfg.baths,
      direction: cfg.dir,
      priceBillion: cfg.defaultPrice,
    } as ApartmentUnit);
  });

  const currentExpandedUnit = floorExpandedUnits.find(u => u.code === selectedAptCode || u.code.endsWith(selectedAptCode)) || floorExpandedUnits[0];
  const currentFin = getApartmentFinancialMetrics(currentExpandedUnit);

  const totalExpRevenue = floorExpandedUnits.reduce((sum, u) => sum + (getApartmentFinancialMetrics(u)?.totalBqlRevenue || 0), 0);
  const totalExpElectric = floorExpandedUnits.reduce((sum, u) => sum + (getApartmentFinancialMetrics(u)?.electricKwh || 0), 0);
  const totalExpWater = floorExpandedUnits.reduce((sum, u) => sum + (getApartmentFinancialMetrics(u)?.waterM3 || 0), 0);
  const occupiedExpCount = floorExpandedUnits.filter(u => u.status === 'OCCUPIED').length;

  const handleSelectFloor = (fl: number) => {};
  const activeUnit = currentExpandedUnit;
  const displayUnits = floorExpandedUnits;
  const handleSelectApartment = (u: ApartmentUnit) => {
    onSelectAptCode(u.code);
  };

  return (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 text-white animate-fadeIn select-none">
            <div className="relative w-full h-[95vh] max-w-7xl bg-[#090D14] border border-[#C5A880]/80 shadow-2xl flex flex-col overflow-hidden">
              
              <div className="p-3 sm:p-4 bg-[#101620] border-b border-[#222B35] flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm sm:text-base font-serif font-bold text-white tracking-wide flex items-center gap-2">
                    <span>{t('Mặt Bằng Tầng', 'Floor Plan - Level')} {selectedFloor}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40 font-mono font-normal">
                      {currentBlockName}
                    </span>
                  </h2>
                  <div className="text-[10.5px] text-gray-400 font-mono mt-0.5">
                    {t('21 Căn hộ • 6 Thang máy khách • 2 Thang thoát hiểm', '21 Units • 6 Passenger Elevators • 2 Fire Escape Stairs')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-3 py-1.5 bg-[#161B22] hover:bg-rose-950 text-gray-300 hover:text-rose-200 border border-[#2D3748] hover:border-rose-500 text-xs font-mono transition-all"
                >
                  <span>{t('Đóng', 'Close')} [✕]</span>
                </button>
              </div>

              <div className="p-2.5 sm:p-3 bg-[#121820] border-b border-[#222B35] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-400 font-mono text-[11px]">{t('Chuyển Tầng:', 'Switch Floor:')}</span>
                  {[34, 30, 25, 20, 18, 15, 12, 10, 8, 5, 2, 1].map(fl => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => handleSelectFloor(fl)}
                      className={`px-2 py-1 text-[11px] font-mono transition-all border ${
                        selectedFloor === fl
                          ? 'bg-[#C5A880] text-[#0D1117] font-bold border-[#C5A880] shadow'
                          : 'bg-[#161B22] text-gray-300 border-[#2D3748] hover:border-gray-500'
                      }`}
                    >
                      T{fl}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-[#070B12] p-0.5 border border-[#1E293B]">
                    <button
                      type="button"
                      onClick={() => setFloorPlanViewMode('CAD_VECTOR')}
                      className={`px-2.5 py-1 text-xs transition-all ${
                        floorPlanViewMode === 'CAD_VECTOR'
                          ? 'bg-[#C5A880] text-black font-bold shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t('Sơ Đồ BIM 3 Cánh', '3-Wing BIM Plan')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFloorPlanViewMode('BLUEPRINT_IMAGE')}
                      className={`px-2.5 py-1 text-xs transition-all ${
                        floorPlanViewMode === 'BLUEPRINT_IMAGE'
                          ? 'bg-[#C5A880] text-black font-bold shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t('Bản Vẽ Thiết Kế', 'Design Blueprint')}
                    </button>
                  </div>

                  {floorPlanViewMode === 'CAD_VECTOR' && (
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'ALL', label: t('Tất Cả (21)', 'All (21)') },
                        { key: 'NORTH', label: t('Cánh Bắc (5)', 'North Wing (5)') },
                        { key: 'SOUTH', label: t('Cánh Nam (5)', 'South Wing (5)') },
                        { key: 'WEST', label: t('Cánh Tây (11)', 'West Wing (11)') }
                      ].map(item => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFloorPlanFilterWing(item.key as any)}
                          className={`px-2 py-0.5 text-[10.5px] border transition-all ${
                            floorPlanFilterWing === item.key
                              ? 'bg-[#C5A880] text-black font-bold border-[#C5A880]'
                              : 'bg-[#141E2B] text-gray-300 border-[#233345] hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {floorPlanViewMode === 'BLUEPRINT_IMAGE' && (
                    <div className="flex items-center gap-1.5 font-mono">
                      <button
                        type="button"
                        onClick={() => setFloorPlanCadZoom(prev => Math.max(0.8, Number((prev - 0.2).toFixed(1))))}
                        className="px-2 py-0.5 bg-[#141E2B] text-white border border-[#233345]"
                      >
                        -
                      </button>
                      <span className="text-[11px] text-[#C5A880] min-w-[40px] text-center">
                        {Math.round(floorPlanCadZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setFloorPlanCadZoom(prev => Math.min(2.5, Number((prev + 0.2).toFixed(1))))}
                        className="px-2 py-0.5 bg-[#141E2B] text-white border border-[#233345]"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-3 sm:px-4 py-2 bg-[#0C121B] border-b border-[#1E293B] grid grid-cols-4 gap-2 text-[11px] font-mono text-center">
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">{t('Doanh Thu Sàn Tầng:', 'Floor Revenue:')}</span>
                  <div className="text-emerald-400 font-bold">{new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(totalExpRevenue)} đ/{t('th', 'mo')}</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">{t('Điện Tiêu Thụ:', 'Electricity:')}</span>
                  <div className="text-amber-300 font-bold">{totalExpElectric} kWh</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">{t('Nước Tiêu Thụ:', 'Water:')}</span>
                  <div className="text-cyan-300 font-bold">{totalExpWater} m³</div>
                </div>
                <div className="p-1 bg-[#121A26] border border-[#222E3E]">
                  <span className="text-gray-400 text-[10px]">{t('Lấp Đầy:', 'Occupancy:')}</span>
                  <div className="text-white font-bold">{occupiedExpCount}/21 {t('Căn', 'Units')} ({Math.round((occupiedExpCount / 21) * 100)}%)</div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-8 p-3 sm:p-5 bg-[#05080E] flex flex-col items-center justify-center overflow-auto border-r border-[#1E293B]">
                  {floorPlanViewMode === 'CAD_VECTOR' ? (
                    <div className="w-full max-w-[850px] relative">
                      <svg viewBox="0 0 980 580" className="w-full drop-shadow-2xl">
                        <defs>
                          <pattern id="modalCadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#162334" strokeWidth="0.6" opacity="0.6" />
                          </pattern>
                        </defs>
                        <rect x="10" y="10" width="960" height="560" fill="url(#modalCadGrid)" stroke="#1F2E42" strokeWidth="1.5" />

                        <g transform="translate(60, 55)" className="pointer-events-none opacity-80">
                          <circle cx="0" cy="0" r="24" fill="#0C1420" stroke="#33465E" strokeWidth="1.2" />
                          <polygon points="0,-20 5,-4 0,0 -5,-4" fill="#EF4444" />
                          <polygon points="0,20 5,4 0,0 -5,4" fill="#64748B" />
                          <polygon points="-20,0 -4,5 0,0 -4,-5" fill="#64748B" />
                          <polygon points="20,0 4,5 0,0 4,-5" fill="#64748B" />
                          <text x="0" y="-24" fill="#F8FAFC" fontSize="11" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">B</text>
                        </g>

                        <g transform="translate(860, 480)" className="pointer-events-none opacity-85">
                          <rect x="-65" y="-55" width="130" height="110" fill="#0B121C" stroke="#26374E" strokeWidth="1.2" rx="3" />
                          <text x="0" y="-40" fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">KEY PLAN</text>
                          <polygon points="-45,-25 35,-30 45,25 -35,35" fill="#141E2C" stroke="#3B4F68" strokeWidth="1" strokeDasharray="2 2" />
                          <circle cx="0" cy="0" r="10" fill="#EF4444" fillOpacity="0.4" />
                          <circle cx="0" cy="0" r="5" fill="#EF4444" />
                          <text x="0" y="24" fill="#F87171" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{selectedBlock}</text>
                        </g>

                        <path
                          d="M 50,160 L 370,160 L 370,40 L 930,40 L 930,190 L 610,190 L 610,430 L 760,430 L 760,560 L 460,560 L 460,440 L 50,440 Z"
                          fill="#0A101A"
                          stroke="#2A3D54"
                          strokeWidth="2.5"
                        />

                        <g>
                          <rect x="380" y="195" width="220" height="230" fill="#111B28" stroke="#33465E" strokeWidth="1.5" />
                          <text x="490" y="215" fill="#E2E8F0" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                            {t('LÕI THANG MÁY & SẢNH CHỜ TẦNG', 'ELEVATOR CORE & LOBBY LVL')} {selectedFloor}
                          </text>

                          <rect x="395" y="230" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="414" y="250" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P1</text>
                          <text x="414" y="260" fill="#64748B" fontSize="6" textAnchor="middle">{t('Khách', 'Pass.')}</text>

                          <rect x="395" y="270" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="414" y="290" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P2</text>
                          <text x="414" y="300" fill="#64748B" fontSize="6" textAnchor="middle">{t('Khách', 'Pass.')}</text>

                          <rect x="395" y="310" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="414" y="330" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P3</text>
                          <text x="414" y="340" fill="#64748B" fontSize="6" textAnchor="middle">{t('Khách', 'Pass.')}</text>

                          <rect x="545" y="230" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="564" y="250" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P4</text>
                          <text x="564" y="260" fill="#64748B" fontSize="6" textAnchor="middle">{t('Khách', 'Pass.')}</text>

                          <rect x="545" y="270" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="564" y="290" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P5</text>
                          <text x="564" y="300" fill="#64748B" fontSize="6" textAnchor="middle">{t('Khách', 'Pass.')}</text>

                          <rect x="545" y="310" width="38" height="34" fill="#0D1622" stroke="#38BDF8" strokeWidth="1" />
                          <text x="564" y="330" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">P6</text>
                          <text x="564" y="340" fill="#64748B" fontSize="6" textAnchor="middle">{t('Khách', 'Pass.')}</text>

                          <rect x="445" y="230" width="90" height="34" fill="#1C2634" stroke="#F59E0B" strokeWidth="1.2" />
                          <text x="490" y="250" fill="#FDE68A" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t('THANG PCCC & HÀNG', 'SERVICE / FIRE LIFT')}</text>
                          <text x="490" y="260" fill="#F59E0B" fontSize="6" textAnchor="middle">{t('Phòng đệm áp suất', 'Pressurized buffer')}</text>

                          <rect x="445" y="272" width="42" height="72" fill="#0B131E" stroke="#10B981" strokeWidth="1" />
                          <text x="466" y="306" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t('THOÁT', 'EXIT')}</text>
                          <text x="466" y="316" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t('HIỂM 1', 'STAIR 1')}</text>

                          <rect x="493" y="272" width="42" height="72" fill="#0B131E" stroke="#10B981" strokeWidth="1" />
                          <text x="514" y="306" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t('THOÁT', 'EXIT')}</text>
                          <text x="514" y="316" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{t('HIỂM 2', 'STAIR 2')}</text>

                          <rect x="440" y="352" width="100" height="34" fill="#0A1017" stroke="#1E2B3C" strokeDasharray="2 2" />
                          <text x="490" y="372" fill="#94A3B8" fontSize="7.5" textAnchor="middle" fontFamily="monospace">{t('SẢNH CHỜ THANG MÁY (2.4m)', 'ELEVATOR LOBBY (2.4m)')}</text>
                          <rect x="395" y="392" width="90" height="26" fill="#141E2B" stroke="#475569" strokeWidth="0.8" />
                          <text x="440" y="408" fill="#94A3B8" fontSize="6.5" textAnchor="middle" fontFamily="monospace">{t('PHÒNG RÁC HÚT CHÂN KHÔNG', 'VACUUM REFUSE ROOM')}</text>
                          <rect x="495" y="392" width="88" height="26" fill="#141E2B" stroke="#475569" strokeWidth="0.8" />
                          <text x="539" y="408" fill="#94A3B8" fontSize="6.5" textAnchor="middle" fontFamily="monospace">{t('HỘP KỸ THUẬT ĐIỆN - NƯỚC', 'MEP SERVICE SHAFT')}</text>
                        </g>

                        <path d="M 60,300 L 380,300" stroke="#33465E" strokeWidth="20" strokeLinecap="square" opacity="0.25" />
                        <text x="210" y="304" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{t('HÀNH LANG TÂY (1.8m)', 'WEST CORRIDOR (1.8m)')}</text>
                        <path d="M 500,105 L 920,105" stroke="#33465E" strokeWidth="20" strokeLinecap="square" opacity="0.25" />
                        <text x="730" y="109" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{t('HÀNH LANG BẮC (1.8m)', 'NORTH CORRIDOR (1.8m)')}</text>
                        <path d="M 540,430 L 540,550" stroke="#33465E" strokeWidth="20" strokeLinecap="square" opacity="0.25" />
                        <text x="540" y="490" fill="#64748B" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 540 490)">{t('HÀNH LANG NAM (1.8m)', 'SOUTH CORRIDOR (1.8m)')}</text>

                        {/* CÁNH BẮC: CH-01 ĐẾN CH-05 */}
                        {(() => {
                          const northCoords = [
                            { num: '01', x: 520, y: 48, w: 76, h: 52 },
                            { num: '02', x: 604, y: 48, w: 74, h: 52 },
                            { num: '03', x: 686, y: 48, w: 74, h: 52 },
                            { num: '04', x: 768, y: 48, w: 74, h: 52 },
                            { num: '05', x: 850, y: 48, w: 74, h: 52 },
                          ];
                          return northCoords.map(pos => {
                            const unit = floorExpandedUnits.find(u => u.code.endsWith(`CH-${pos.num}`) || u.code.endsWith(pos.num));
                            const isSelected = selectedAptCode === unit?.code;
                            const isOccupied = unit?.status === 'OCCUPIED';
                            const isMaint = unit?.status === 'MAINTENANCE';
                            const isDimmed = floorPlanFilterWing !== 'ALL' && floorPlanFilterWing !== 'NORTH';

                            return (
                              <g
                                key={`exp-north-${pos.num}`}
                                onClick={() => unit && onSelectAptCode(unit.code)}
                                className="cursor-pointer transition-all hover:opacity-90"
                                style={{ opacity: isDimmed ? 0.2 : 1 }}
                              >
                                <rect
                                  x={pos.x}
                                  y={pos.y}
                                  width={pos.w}
                                  height={pos.h}
                                  fill={isSelected ? '#143126' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                  stroke={isSelected ? '#F59E0B' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                  strokeWidth={isSelected ? 2.5 : 1.2}
                                  rx="1"
                                />
                                <text x={pos.x + pos.w / 2} y={pos.y + 22} fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CH-{pos.num}
                                </text>
                                <text x={pos.x + pos.w / 2} y={pos.y + 33} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="7" textAnchor="middle">
                                  {pos.num === '01' ? '2PN • 68m²' : pos.num === '02' ? '1PN • 38m²' : pos.num === '03' ? '1PN+ • 46m²' : pos.num === '04' ? '2PN • 59m²' : '2PN • 69m²'}
                                </text>
                                <rect x={pos.x + 8} y={pos.y + 38} width={pos.w - 16} height="10" fill={isOccupied ? '#065F46' : isMaint ? '#075985' : '#78350F'} />
                                <text x={pos.x + pos.w / 2} y={pos.y + 46} fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">
                                  {isOccupied ? t('ĐÃ CÓ CƯ DÂN', 'OCCUPIED') : isMaint ? t('NGHIỆM THU', 'INSPECTION') : t('NHÀ TRỐNG', 'VACANT')}
                                </text>
                              </g>
                            );
                          });
                        })()}

                        {/* CÁNH NAM: CH-06 ĐẾN CH-10 */}
                        {(() => {
                          const southCoords = [
                            { num: '06', x: 470, y: 440, w: 90, h: 54 },
                            { num: '07', x: 570, y: 440, w: 90, h: 54 },
                            { num: '08', x: 670, y: 440, w: 85, h: 54 },
                            { num: '09', x: 470, y: 500, w: 140, h: 54 },
                            { num: '10', x: 620, y: 500, w: 135, h: 54 },
                          ];
                          return southCoords.map(pos => {
                            const unit = floorExpandedUnits.find(u => u.code.endsWith(`CH-${pos.num}`) || u.code.endsWith(pos.num));
                            const isSelected = selectedAptCode === unit?.code;
                            const isOccupied = unit?.status === 'OCCUPIED';
                            const isMaint = unit?.status === 'MAINTENANCE';
                            const isDimmed = floorPlanFilterWing !== 'ALL' && floorPlanFilterWing !== 'SOUTH';

                            return (
                              <g
                                key={`exp-south-${pos.num}`}
                                onClick={() => unit && onSelectAptCode(unit.code)}
                                className="cursor-pointer transition-all hover:opacity-90"
                                style={{ opacity: isDimmed ? 0.2 : 1 }}
                              >
                                <rect
                                  x={pos.x}
                                  y={pos.y}
                                  width={pos.w}
                                  height={pos.h}
                                  fill={isSelected ? '#143126' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                  stroke={isSelected ? '#F59E0B' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                  strokeWidth={isSelected ? 2.2 : 1.2}
                                  rx="1"
                                />
                                <text x={pos.x + pos.w / 2} y={pos.y + 19} fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CH-{pos.num}
                                </text>
                                <text x={pos.x + pos.w / 2} y={pos.y + 30} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="7" textAnchor="middle">
                                  {pos.num === '06' ? (isEn ? '1BR • 42m² (Pool View)' : '1PN • 42m² (View Hồ Bơi)') : pos.num === '07' ? '2PN • 59m²' : pos.num === '08' ? '1PN • 46m²' : pos.num === '09' ? (isEn ? '2BR Corner • 69m²' : '2PN Góc • 69m²') : 'Studio • 35m²'}
                                </text>
                                <rect x={pos.x + 8} y={pos.y + 36} width={pos.w - 16} height="10" fill={isOccupied ? '#065F46' : isMaint ? '#075985' : '#78350F'} />
                                <text x={pos.x + pos.w / 2} y={pos.y + 43.5} fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                                  {isOccupied ? t('CÓ CƯ DÂN', 'OCCUPIED') : isMaint ? t('NGHIỆM THU', 'INSPECTION') : t('NHÀ TRỐNG', 'VACANT')}
                                </text>
                              </g>
                            );
                          });
                        })()}

                        {/* CÁNH TÂY: CH-11 ĐẾN CH-21 */}
                        {(() => {
                          const westCoords = [
                            { num: '11', x: 60, y: 170, w: 58, h: 58 },
                            { num: '12', x: 122, y: 170, w: 58, h: 58 },
                            { num: '13', x: 184, y: 170, w: 58, h: 58 },
                            { num: '14', x: 246, y: 170, w: 58, h: 58 },
                            { num: '15', x: 308, y: 170, w: 58, h: 58 },
                            { num: '16', x: 60, y: 370, w: 48, h: 62 },
                            { num: '17', x: 112, y: 370, w: 48, h: 62 },
                            { num: '18', x: 164, y: 370, w: 48, h: 62 },
                            { num: '19', x: 216, y: 370, w: 48, h: 62 },
                            { num: '20', x: 268, y: 370, w: 48, h: 62 },
                            { num: '21', x: 320, y: 370, w: 48, h: 62 },
                          ];
                          return westCoords.map(pos => {
                            const unit = floorExpandedUnits.find(u => u.code.endsWith(`CH-${pos.num}`) || u.code.endsWith(pos.num));
                            const isSelected = selectedAptCode === unit?.code;
                            const isOccupied = unit?.status === 'OCCUPIED';
                            const isMaint = unit?.status === 'MAINTENANCE';
                            const isDimmed = floorPlanFilterWing !== 'ALL' && floorPlanFilterWing !== 'WEST';

                            return (
                              <g
                                key={`exp-west-${pos.num}`}
                                onClick={() => unit && onSelectAptCode(unit.code)}
                                className="cursor-pointer transition-all hover:opacity-90"
                                style={{ opacity: isDimmed ? 0.2 : 1 }}
                              >
                                <rect
                                  x={pos.x}
                                  y={pos.y}
                                  width={pos.w}
                                  height={pos.h}
                                  fill={isSelected ? '#143126' : isOccupied ? '#0B2319' : isMaint ? '#0D253A' : '#101722'}
                                  stroke={isSelected ? '#F59E0B' : isOccupied ? '#10B981' : isMaint ? '#0284C7' : '#2D3E54'}
                                  strokeWidth={isSelected ? 2.2 : 1.1}
                                  rx="1"
                                />
                                <text x={pos.x + pos.w / 2} y={pos.y + 18} fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                                  CH-{pos.num}
                                </text>
                                <text x={pos.x + pos.w / 2} y={pos.y + 28} fill={isOccupied ? '#6EE7B7' : '#94A3B8'} fontSize="6.5" textAnchor="middle">
                                  {unit?.area || 60}m²
                                </text>
                                <rect x={pos.x + 4} y={pos.y + pos.h - 14} width={pos.w - 8} height="9" fill={isOccupied ? '#065F46' : isMaint ? '#075985' : '#78350F'} />
                                <text x={pos.x + pos.w / 2} y={pos.y + pos.h - 7} fill="#FFFFFF" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                                  {isOccupied ? t('CÓ CƯ DÂN', 'OCCUPIED') : isMaint ? t('NGHIỆM THU', 'INSPECTION') : t('TRỐNG', 'VACANT')}
                                </text>
                              </g>
                            );
                          });
                        })()}
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center overflow-auto">
                      <div className="w-full max-w-5xl">
                        <CadFloorplanSvgModel
                          selectedFloor={selectedFloor}
                          selectedBlock={selectedBlock}
                          activeUnitCode={activeUnit?.code}
                          onSelectUnit={(u) => handleSelectApartment(u)}
                          unitsOnFloor={displayUnits.filter(u => u.floor === selectedFloor)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 font-mono mt-2 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 inline-block"></span> {t('Đã ở', 'Occupied')}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#101722] border border-gray-600 inline-block"></span> {t('Trống', 'Vacant')}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 inline-block"></span> {t('Đang chọn', 'Selected')}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-sky-500 inline-block"></span> {t('Căn phụ', 'Secondary')}</span>
                  </div>
                </div>

                <div className="lg:col-span-4 p-4 bg-[#0D121B] flex flex-col justify-between overflow-y-auto space-y-3">
                  <div className="space-y-3">
                    <div className="pb-2.5 border-b border-[#222B35] flex items-start justify-between">
                      <div>
                        <div className="text-[10px] text-[#C5A880] font-mono font-semibold uppercase">
                          {t('CHI TIẾT MỞ RỘNG', 'EXPANDED DETAILS')} • {t('TẦNG', 'FLOOR')} {currentExpandedUnit.floor}
                        </div>
                        <h3 className="text-xl font-serif font-bold text-white mt-0.5">
                          {t('Căn Hộ', 'Apartment')} {currentExpandedUnit.code}
                        </h3>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                        currentExpandedUnit.status === 'OCCUPIED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : 'bg-amber-950 text-amber-300 border-amber-500'
                      }`}>
                        {currentExpandedUnit.status === 'OCCUPIED' ? t('CÓ CƯ DÂN', 'OCCUPIED') : t('NHÀ TRỐNG', 'VACANT')}
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#121822] border border-[#222B35] space-y-2">
                      <div className="text-[11px] font-bold text-[#C5A880]">
                        {t('BỐ TRÍ MẶT BẰNG KHÔNG GIAN', 'SPATIAL FLOOR LAYOUT')}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono">
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">{t('Phòng Khách & Bếp:', 'Living & Kitchen:')}</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.45)} m²</div>
                        </div>
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">{t('Phòng Ngủ Master:', 'Master Bedroom:')}</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.28)} m²</div>
                        </div>
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">{t('Phòng Ngủ Phụ & WC:', 'Second Bed & Bath:')}</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.2)} m²</div>
                        </div>
                        <div className="p-1.5 bg-[#161F2C]">
                          <span className="text-gray-400">{t('Logia & Giặt Phơi:', 'Loggia & Laundry:')}</span>
                          <div className="text-white font-bold">{Math.round(currentExpandedUnit.area * 0.07)} m²</div>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-[#1F2A38] text-[10.5px] font-mono space-y-1">
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400">{t('Hướng Ban Công:', 'Orientation:')}</span>
                          <strong className="text-[#C5A880]">{currentExpandedUnit.direction || (isEn ? 'South-East' : 'Đông Nam')}</strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400">{t('Tầm Nhìn (View):', 'View / Outlook:')}</span>
                          <strong className="text-white truncate max-w-[150px]">
                            {currentExpandedUnit.code.includes('06') ? (isEn ? 'Tropical Pool & River' : 'Hồ Bơi Nhiệt Đới & Sông') : (isEn ? '36ha Rainbow Central Park' : 'Công Viên Cầu Vồng 36ha')}
                          </strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span className="text-gray-400">{t('Chiếu Sáng Tự Nhiên:', 'Natural Daylight:')}</span>
                          <strong className="text-emerald-400">{t('94% diện tích sàn', '94% floor area')}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#121822] border border-[#222B35] space-y-2 text-xs font-mono">
                      <div className="text-[11px] font-bold text-amber-300">
                        {t('TIÊU THỤ NĂNG LƯỢNG & DOANH THU CĂN', 'UNIT ENERGY USE & REVENUE')}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div className="p-1.5 bg-[#161F2C] border border-[#26354A]">
                          <div className="text-gray-400">
                            {t('Điện Tiêu Thụ:', 'Electricity:')}
                          </div>
                          <div className="text-white font-bold mt-0.5">{currentFin?.electricKwh} kWh</div>
                          <div className="text-[9.5px] text-amber-300">{new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(currentFin?.electricCost || 0)} đ</div>
                        </div>

                        <div className="p-1.5 bg-[#161F2C] border border-[#26354A]">
                          <div className="text-gray-400">
                            {t('Nước Tiêu Thụ:', 'Water:')}
                          </div>
                          <div className="text-white font-bold mt-0.5">{currentFin?.waterM3} m³</div>
                          <div className="text-[9.5px] text-cyan-300">{new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(currentFin?.waterCost || 0)} đ</div>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-[#1F2A38] space-y-1 text-[10.5px]">
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t('Doanh Thu Phí BQL Thu Về:', 'BQL Management Fee Revenue:')}</span>
                          <strong className="text-emerald-400">{new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(currentFin?.totalBqlRevenue || 0)} {t('đ/tháng', 'VND/mo')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t('Giá Cho Thuê Tham Chiếu:', 'Reference Rental Value:')}</span>
                          <strong className="text-amber-300">{new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(currentFin?.estimatedRentalPrice || 0)} {t('đ/tháng', 'VND/mo')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{t('Suất Sinh Lời Cho Thuê:', 'Rental Yield:')}</span>
                          <strong className="text-emerald-400">{currentFin?.rentalYield}% / {t('năm', 'year')}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#222B35] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectAptCode(currentExpandedUnit.code);
                        setDetailTab('FINANCIAL');
                      }}
                      className="flex-1 py-2 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs font-mono transition-all flex items-center justify-center"
                    >
                      {t('Xem Hóa Đơn & Tiêu Thụ', 'View Bills & Consumption')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectAptCode(currentExpandedUnit.code);
                        onOpenDetailModal(currentExpandedUnit);
                      }}
                      className="py-2 px-3 bg-[#161F2C] hover:bg-[#202B3C] text-white border border-[#2D3748] font-bold text-xs font-mono transition-all"
                    >
                      {t('Hồ Sơ Căn', 'Unit Profile')}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
  );
}
