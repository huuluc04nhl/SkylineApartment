import { ApartmentUnit } from '@/lib/apartmentStore';
'use client';

import React from 'react';
import { useLanguage } from '@/lib/languageContext';
import { 
  Building, 
  MapPin, 
  Layers, 
  ChevronRight, 
  Sparkles, 
  Eye, 
  Users, 
  Check, 
  Compass, 
  TrendingUp,
  Zap,
  Droplets,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';

export interface IsometricBuilding3DViewProps {
  selectedBlock: string;
  selectedFloor: number;
  onSelectFloor: (floor: number) => void;
  hoveredFloor: number | null;
  setHoveredFloor: (floor: number | null) => void;
  currentTotalFloors: number;
  occupancyRate: number;
  toneConfig: any;
  building3dZoom: number;
  setBuilding3dZoom: React.Dispatch<React.SetStateAction<number>>;
  reset3dTransform: () => void;
  building3dPan: { x: number; y: number };
  handle3dMouseDown: (e: React.MouseEvent) => void;
  handle3dMouseMove: (e: React.MouseEvent) => void;
  handle3dMouseUp: () => void;
  handle3dTouchStart: (e: React.TouchEvent) => void;
  handle3dTouchMove: (e: React.TouchEvent) => void;
  handle3dTouchEnd: () => void;
  selectedFloorRange?: string;
  buildingTheme?: string;
  currentBlockName?: string;
  floorStatsList?: any[];
  floorOccupiedCount?: number;
}

export default function IsometricBuilding3DView({
  selectedBlock,
  selectedFloor,
  onSelectFloor,
  hoveredFloor,
  setHoveredFloor,
  currentTotalFloors,
  occupancyRate,
  toneConfig,
  building3dZoom,
  setBuilding3dZoom,
  reset3dTransform,
  building3dPan,
  handle3dMouseDown,
  handle3dMouseMove,
  handle3dMouseUp,
  handle3dTouchStart,
  handle3dTouchMove,
  handle3dTouchEnd,
  selectedFloorRange = 'ALL',
  buildingTheme = 'NIGHT',
  currentBlockName = 'The Tropical',
  floorStatsList = [],
  floorOccupiedCount = 0,
}: IsometricBuilding3DViewProps) {
  const { t, isEn } = useLanguage();
  const curTone = toneConfig.GOLD_LUXURY;

            const isGesturing = false;
  const displayUnits: ApartmentUnit[] = [];
  const floorStep = (790 - 95) / (currentTotalFloors - 1);
            const baseRulerLevels = currentTotalFloors === 39 
              ? [39, 35, 30, 25, 20, 15, 10, 5, 1] 
              : [34, 30, 25, 20, 15, 10, 5, 1];
            // Đồng bộ thước đo: luôn luôn có mốc tầng đang chọn, nếu sát mốc khác thì thay thế mốc đó để không đè chữ
            const rulerLevels = Array.from(new Set([
              ...baseRulerLevels.filter(fl => Math.abs(fl - selectedFloor) > 1),
              ...(selectedFloor > 0 ? [selectedFloor] : [])
            ])).sort((a, b) => b - a);

            return (
              <div className={`relative w-full h-[660px] sm:h-[760px] ${curTone.containerBg} overflow-hidden flex flex-col select-none transition-colors duration-500`}>
                {/* Lưới tọa độ kiến trúc số */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${curTone.gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${curTone.gridLineColor} 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                  }}
                />

                {/* THANH HUD ĐIỀU KHIỂN & PHÓNG TO 3D GÓC TRÊN */}
                <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
                  {/* Chip thông số tòa nhà góc trái */}
                  <div className="pointer-events-auto flex items-center gap-2 px-2.5 py-1 bg-[#090E17]/90 border border-[#222E3E] text-xs font-mono shadow-lg backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[#C5A880] font-bold">{selectedBlock} • THE TROPICAL</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-300">{t('Lấp đầy:', 'Occupancy:')} <strong className="text-emerald-400">{occupancyRate}%</strong></span>
                    <span className="text-gray-500 hidden sm:inline">|</span>
                    <span className="text-gray-400 text-[10.5px] hidden sm:inline">{t('21 Căn/Tầng', '21 Units/Floor')}</span>
                  </div>

                  {/* Bộ điều khiển Zoom góc phải */}
                  <div className="pointer-events-auto flex items-center gap-1 bg-[#090E17]/90 p-1 border border-[#222E3E] text-xs font-mono shadow-lg backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setBuilding3dZoom(z => Math.max(0.75, Number((z - 0.15).toFixed(2))))}
                      className="w-6 h-6 flex items-center justify-center bg-[#141E2B] hover:bg-[#C5A880] text-gray-300 hover:text-black font-bold transition-all"
                      title={t('Thu nhỏ mô hình', 'Zoom out')}
                    >
                      -
                    </button>
                    <span className="px-1.5 text-[10.5px] text-[#C5A880] font-bold min-w-[38px] text-center">
                      {Math.round(building3dZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setBuilding3dZoom(z => Math.min(2.8, Number((z + 0.15).toFixed(2))))}
                      className="w-6 h-6 flex items-center justify-center bg-[#141E2B] hover:bg-[#C5A880] text-gray-300 hover:text-black font-bold transition-all"
                      title={t('Phóng to mô hình', 'Zoom in')}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={reset3dTransform}
                      className="px-1.5 h-6 flex items-center justify-center bg-[#141E2B] hover:bg-[#1E2E40] text-gray-400 hover:text-white text-[10px] transition-all ml-0.5"
                      title={t('Đặt lại kích thước và góc nhìn chuẩn (hoặc chạm đúp 2 lần)', 'Reset size and default view (or double click)')}
                    >
                      100%
                    </button>
                  </div>
                </div>

                {/* BẢN VẼ PHỐI CẢNH 3D CHUNG CƯ ISOMETRIC MỞ RỘNG TOÀN DIỆN KHUNG HÌNH (MOBILE TOUCH PINCH & PAN) */}
                <div 
                  className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
                  onTouchStart={handle3dTouchStart}
                  onTouchMove={handle3dTouchMove}
                  onTouchEnd={handle3dTouchEnd}
                  onMouseDown={handle3dMouseDown}
                  onMouseMove={handle3dMouseMove}
                  onMouseUp={handle3dMouseUp}
                  onMouseLeave={handle3dMouseUp}
                  onDoubleClick={reset3dTransform}
                >
                  <div 
                    className="w-full h-full flex items-center justify-center transition-transform ease-out"
                    style={{
                      transform: `translate3d(${building3dPan.x - Math.max(0, (building3dZoom - 1) * 145)}px, ${building3dPan.y}px, 0px) scale(${building3dZoom})`,
                      transformOrigin: '42% center',
                      transitionDuration: isGesturing ? '0ms' : '200ms'
                    }}
                  >
                    <svg
                      viewBox="0 -20 1000 970"
                      preserveAspectRatio="xMidYMid meet"
                      className="w-full h-full cursor-default drop-shadow-[0_30px_60px_rgba(0,0,0,0.95)]"
                    >
                      <defs>
                        <style>{`
                          @keyframes laserDrawPath {
                            0% { stroke-dashoffset: 380; opacity: 0; }
                            20% { opacity: 1; }
                            100% { stroke-dashoffset: 0; opacity: 1; }
                          }
                          @keyframes calloutSlideIn {
                            0% { opacity: 0; transform: translateY(10px) scale(0.96); }
                            100% { opacity: 1; transform: translateY(0) scale(1); }
                          }
                          @keyframes pingRing {
                            0% { r: 3.5; opacity: 1; stroke-width: 2.5; }
                            70% { opacity: 0.5; }
                            100% { r: 18; opacity: 0; stroke-width: 0.5; }
                          }
                          .anim-laser-line {
                            stroke-dasharray: 380;
                            stroke-dashoffset: 380;
                            animation: laserDrawPath 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                          }
                          .anim-callout-card {
                            animation: calloutSlideIn 0.45s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
                          }
                          .anim-ping-pulse {
                            animation: pingRing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
                          }
                        `}</style>

                        <filter id="unitGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>

                        {/* Gradient kính ban đêm vs ban ngày theo Tone Màu được chọn */}
                        <linearGradient id="skylineGlassL" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={curTone.glassL[0]} />
                          <stop offset="50%" stopColor={curTone.glassL[1]} />
                          <stop offset="100%" stopColor={curTone.glassL[2]} />
                        </linearGradient>

                        <linearGradient id="skylineGlassR" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={curTone.glassR[0]} />
                          <stop offset="60%" stopColor={curTone.glassR[1]} />
                          <stop offset="100%" stopColor={curTone.glassR[2]} />
                        </linearGradient>

                        {/* Gradient khối đế tiếp tân */}
                        <linearGradient id="podiumMallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={curTone.podiumGrad[0]} />
                          <stop offset="60%" stopColor={curTone.podiumGrad[1]} />
                          <stop offset="100%" stopColor={curTone.podiumGrad[2]} />
                        </linearGradient>
                      </defs>

                      {/* THƯỚC ĐO CAO ĐỘ CÁC TẦNG BÊN TRÁI (LEVEL RULER) */}
                      <g className="font-mono text-[9.5px]">
                        {/* VẠCH TẦNG SẢNH (G) */}
                        {(() => {
                          const yPos = 785;
                          const isFloorSelected = selectedFloor === 0;
                          const rulerColor = isFloorSelected ? '#C5A880' : '#38BDF8';
                          const rulerTextColor = isFloorSelected ? '#E6CA9E' : '#7DD3FC';
                          const rulerBg = isFloorSelected ? '#2A2015' : '#082F49';
                          const rulerBorder = isFloorSelected ? '#C5A880' : '#0369A1';
                          return (
                            <g
                              key="level-ruler-lobby"
                              onClick={() => onSelectFloor(0)}
                              onMouseEnter={() => setHoveredFloor(0)}
                              onMouseLeave={() => setHoveredFloor(null)}
                              className="cursor-pointer group"
                            >
                              <line 
                                x1="88" 
                                y1={yPos} 
                                x2="200" 
                                y2={yPos} 
                                stroke={rulerColor} 
                                strokeWidth={isFloorSelected ? 2 : 1.2} 
                              />
                              <circle cx="200" cy={yPos} r={isFloorSelected ? 4 : 3} fill={rulerColor} />
                              <rect
                                x="18"
                                y={yPos - 9}
                                width="68"
                                height="18"
                                rx="3"
                                fill={rulerBg}
                                stroke={rulerBorder}
                                strokeWidth={isFloorSelected ? 1.6 : 1}
                                className="group-hover:stroke-cyan-300 transition-all"
                              />
                              <text x="52" y={yPos + 3.8} fill={rulerTextColor} fontWeight="bold" textAnchor="middle">
                                {t('SẢNH (G)', 'LOBBY (G)')}
                              </text>
                            </g>
                          );
                        })()}
                        {rulerLevels.map(fl => {
                          const yBase = 790 - (fl - 1) * floorStep;
                          const flH = fl === currentTotalFloors ? 18 : 14;
                          // Tâm dải tầng 3D tại vách bên trái (x = 220) nằm chính xác giữa (yBase - 40 - flH) và (yBase - 40)
                          const yPos = Number((yBase - 40 - (flH / 2)).toFixed(1));
                          const hasOccupied = displayUnits.some(u => u.floor === fl && u.status === 'OCCUPIED');
                          const isFloorSelected = selectedFloor === fl;
                          const rulerColor = isFloorSelected ? '#C5A880' : hasOccupied ? '#10B981' : '#334155';
                          const rulerTextColor = isFloorSelected ? '#E6CA9E' : hasOccupied ? '#34D399' : '#94A3B8';
                          const rulerBg = isFloorSelected ? '#2A2015' : hasOccupied ? '#064E3B' : '#0B121D';
                          const rulerBorder = isFloorSelected ? '#C5A880' : hasOccupied ? '#10B981' : '#1E2D42';

                          return (
                            <g
                              key={`level-ruler-${fl}`}
                              onClick={() => {
                                onSelectFloor(fl);
                              }}
                              onMouseEnter={() => setHoveredFloor(fl)}
                              onMouseLeave={() => setHoveredFloor(null)}
                              className="cursor-pointer group"
                            >
                              <line 
                                x1="88" 
                                y1={yPos} 
                                x2="220" 
                                y2={yPos} 
                                stroke={rulerColor} 
                                strokeWidth={isFloorSelected || hasOccupied ? 1.8 : 1} 
                                strokeDasharray={isFloorSelected || hasOccupied ? 'none' : '3 3'} 
                              />
                              <circle cx="220" cy={yPos} r={isFloorSelected ? 4 : hasOccupied ? 3 : 2} fill={rulerColor} />
                              
                              <rect
                                x="22"
                                y={yPos - 9}
                                width="64"
                                height="18"
                                rx="3"
                                fill={rulerBg}
                                stroke={rulerBorder}
                                strokeWidth={isFloorSelected ? 1.6 : 1}
                                className="group-hover:stroke-amber-300 transition-all"
                              />
                              <text x="54" y={yPos + 3.8} fill={rulerTextColor} fontWeight="bold" textAnchor="middle">
                                {t('TẦNG', 'LEVEL')} {fl}
                              </text>
                            </g>
                          );
                        })}
                      </g>

                      {/* 1. KHUÔN VIÊN QUẢNG TRƯỜNG & HỒ NƯỚC NỀN */}
                      <g className="opacity-95">
                        <polygon points="60,860 440,945 820,860 440,775" fill="#070B12" stroke="#1E293B" strokeWidth="2" />
                        <polygon points="300,910 440,936 580,910 440,884" fill="#0369A1" fillOpacity="0.4" stroke="#38BDF8" strokeWidth="1.2" />
                      </g>

                      {/* 2. THÂN CHUNG CƯ CAO TẦNG ISOMETRIC ĐỒ SỘ */}
                      <g className="transition-all duration-300">
                        {/* Mặt Trái Tòa Nhà */}
                        <polygon points="220,750 440,790 440,95 220,55" fill="url(#skylineGlassL)" stroke={curTone.borderBuilding} strokeWidth="2" />
                        {/* Mặt Phải Tòa Nhà */}
                        <polygon points="440,790 660,750 660,55 440,95" fill="url(#skylineGlassR)" stroke={curTone.borderBuilding} strokeWidth="2" />
                        
                        {/* Nan lam kiến trúc đứng */}
                        <line x1="290" y1="68" x2="290" y2="763" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.35" />
                        <line x1="365" y1="81" x2="365" y2="776" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.35" />
                        <line x1="515" y1="81" x2="515" y2="776" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.35" />
                        <line x1="590" y1="68" x2="590" y2="763" stroke={curTone.mullionColor} strokeWidth="0.8" opacity="0.35" />

                        {/* RENDER CÁC TẦNG CĂN HỘ (TẦNG 2 ĐẾN TẦNG MAX) */}
                        {floorStatsList.filter(item => item.floor >= 1).map(item => {
                          const fl = item.floor;
                          const isSelected = selectedFloor === fl;
                          const isHovered = hoveredFloor === fl;
                          const hasOccupied = item.occupied > 0;
                          const hasMaint = item.maintenance > 0;

                          const yBase = 790 - (fl - 1) * floorStep;
                          const h = fl === currentTotalFloors ? 18 : 14;

                          const isMatchedZone = selectedFloorRange === 'ALL'
                            ? true
                            : selectedFloorRange === 'HIGH'
                            ? fl >= 21
                            : selectedFloorRange === 'MID'
                            ? (fl >= 11 && fl <= 20)
                            : (fl <= 10);

                          let opacityVal = isMatchedZone ? 0.94 : 0.22;
                          if (isSelected || isHovered) opacityVal = 1;

                          const leftPts = `222,${(yBase - 40 - h).toFixed(1)} 438,${(yBase - h).toFixed(1)} 438,${yBase.toFixed(1)} 222,${(yBase - 40).toFixed(1)}`;
                          const rightPts = `442,${(yBase - h).toFixed(1)} 658,${(yBase - 40 - h).toFixed(1)} 658,${(yBase - 40).toFixed(1)} 442,${yBase.toFixed(1)}`;

                          let fillColorL = buildingTheme === 'NIGHT' ? '#0E1726' : '#0369A1';
                          let fillColorR = buildingTheme === 'NIGHT' ? '#131F33' : '#0284C7';
                          let strokeColor = buildingTheme === 'NIGHT' ? '#1E293B' : '#0E3A66';
                          let strokeWidth = 0.8;

                          if (isSelected) {
                            fillColorL = '#C5A880';
                            fillColorR = '#D8BC94';
                            strokeColor = '#FFFFFF';
                            strokeWidth = 2.4;
                          } else if (isHovered) {
                            fillColorL = '#2A3C53';
                            fillColorR = '#3B5270';
                            strokeColor = '#FDE68A';
                            strokeWidth = 1.8;
                          } else if (hasOccupied) {
                            fillColorL = '#064E3B';
                            fillColorR = '#065F46';
                            strokeColor = '#10B981';
                            strokeWidth = 1.2;
                          } else if (hasMaint) {
                            fillColorL = '#0C2A40';
                            fillColorR = '#0E3652';
                            strokeColor = '#38BDF8';
                            strokeWidth = 1.0;
                          }

                          return (
                            <g
                              key={`floor-layer-${fl}`}
                              onClick={() => {
                                onSelectFloor(fl);
                              }}
                              onMouseEnter={() => setHoveredFloor(fl)}
                              onMouseLeave={() => setHoveredFloor(null)}
                              className="cursor-pointer group"
                              opacity={opacityVal}
                            >
                              {/* Mặt kính trái tầng */}
                              <polygon 
                                points={leftPts} 
                                fill={fillColorL} 
                                stroke={strokeColor} 
                                strokeWidth={strokeWidth}
                                className="transition-all duration-200" 
                              />
                              {/* Mặt kính phải tầng */}
                              <polygon 
                                points={rightPts} 
                                fill={fillColorR} 
                                stroke={strokeColor} 
                                strokeWidth={strokeWidth}
                                className="transition-all duration-200" 
                              />

                              {/* Vạch đèn LED ban công sàn nếu đã có cư dân ở */}
                              {hasOccupied && (
                                <>
                                  <line 
                                    x1="226" 
                                    y1={(yBase - 38).toFixed(1)} 
                                    x2="434" 
                                    y2={(yBase + 2).toFixed(1)} 
                                    stroke="#34D399" 
                                    strokeWidth="1.8" 
                                    strokeDasharray="8 4" 
                                    opacity="0.8" 
                                  />
                                  <line 
                                    x1="446" 
                                    y1={(yBase + 2).toFixed(1)} 
                                    x2="654" 
                                    y2={(yBase - 38).toFixed(1)} 
                                    stroke="#34D399" 
                                    strokeWidth="1.8" 
                                    strokeDasharray="8 4" 
                                    opacity="0.8" 
                                  />
                                </>
                              )}

                              {/* Hiệu ứng tầng đang chọn */}
                              {isSelected && (
                                <g className="pointer-events-none">
                                  <line 
                                    x1="222" 
                                    y1={(yBase - 40 - h).toFixed(1)} 
                                    x2="438" 
                                    y2={(yBase - h).toFixed(1)} 
                                    stroke="#FFFFFF" 
                                    strokeWidth="2.4" 
                                    strokeLinecap="round" 
                                  />
                                  <line 
                                    x1="442" 
                                    y1={(yBase - h).toFixed(1)} 
                                    x2="658" 
                                    y2={(yBase - 40 - h).toFixed(1)} 
                                    stroke="#FFFFFF" 
                                    strokeWidth="2.4" 
                                    strokeLinecap="round" 
                                  />
                                  <rect
                                    x="414"
                                    y={(yBase - h / 2 - 9).toFixed(1)}
                                    width="52"
                                    height="18"
                                    rx="3"
                                    fill="#C5A880"
                                    stroke="#FFFFFF"
                                    strokeWidth="1.6"
                                    filter="url(#unitGlow)"
                                  />
                                  <text
                                    x="440"
                                    y={(yBase - h / 2 + 4).toFixed(1)}
                                    fill="#0D1117"
                                    fontSize="10"
                                    fontWeight="900"
                                    textAnchor="middle"
                                    fontFamily="monospace"
                                  >
                                    {t('TẦNG', 'LEVEL')} {fl}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}

                        {/* 3. MÁI THƯỢNG, SÂN ĐÁP TRỰC THĂNG (HELIPAD) & ĐÈN ĐỈNH TÒA */}
                        <g id="skyline-crown-roof">
                          {/* Sàn Bê Tông Mái Thượng */}
                          <polygon points="220,55 440,95 660,55 440,15" fill={curTone.roofColor} stroke={curTone.crownColor} strokeWidth="2.5" />

                          {/* Sân đỗ trực thăng Helipad 3D */}
                          <ellipse cx="440" cy="57" rx="60" ry="11" fill="#0A0F18" stroke="#1E293B" strokeWidth="1.2" />
                          <ellipse cx="440" cy="55" rx="60" ry="11" fill="#111827" stroke="#C5A880" strokeWidth="1.8" />
                          <ellipse cx="440" cy="55" rx="44" ry="8" fill="none" stroke="#FDE68A" strokeWidth="1.6" strokeDasharray="6 3" />
                          <ellipse cx="440" cy="55" rx="28" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
                          <text x="440" y="59" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">H</text>

                          {/* Đèn tín hiệu hàng không ban đêm LED quanh Helipad */}
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                            const rad = (deg * Math.PI) / 180;
                            const lx = 440 + 58 * Math.cos(rad);
                            const ly = 55 + 10.5 * Math.sin(rad);
                            const ledColor = deg % 90 === 0 ? '#EF4444' : '#10B981';
                            return (
                              <circle 
                                key={`helipad-led-${deg}`} 
                                cx={lx.toFixed(1)} 
                                cy={ly.toFixed(1)} 
                                r="1.8" 
                                fill={ledColor} 
                                className="animate-pulse" 
                              />
                            );
                          })}

                          {/* Cột ăng-ten & Đèn chớp đỏ */}
                          <line x1="440" y1="15" x2="440" y2="-5" stroke="#64748B" strokeWidth="1.8" />
                          <circle cx="440" cy="-5" r="3.5" fill="#EF4444" className="animate-pulse" filter="url(#unitGlow)" />

                          {/* Tiêu đề Đỉnh Chung Cư */}
                          <text 
                            x="440" 
                            y="-12" 
                            fill={curTone.titleColor} 
                            fontSize="11" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            fontFamily="serif" 
                            letterSpacing="0.06em"
                          >
                            {currentBlockName.toUpperCase()} ({currentTotalFloors} {t('TẦNG', 'FLOORS')}) • {t('CHUNG CƯ THE TROPICAL', 'THE TROPICAL RESIDENCES')}
                          </text>
                        </g>

                        {/* 4. ĐẠI SẢNH CHÀO ĐÓN & DỊCH VỤ BQL (TẦNG SẢNH / G) */}
                        <g 
                          id="grand-lobby-podium"
                          onClick={() => {
                            onSelectFloor(0);
                          }}
                          onMouseEnter={() => setHoveredFloor(0)}
                          onMouseLeave={() => setHoveredFloor(null)}
                          className="cursor-pointer group"
                        >
                          {/* Mái vát khối sảnh Tầng 1 (kết nối chân tháp) */}
                          <polygon 
                            points="200,747 440,790 680,747 440,704" 
                            fill="url(#podiumMallGrad)" 
                            stroke={curTone.borderBuilding} 
                            strokeWidth="1.6" 
                          />

                          {/* Mặt kính sảnh trái */}
                          <polygon 
                            points="200,747 440,790 440,865 200,822" 
                            fill={selectedFloor === 0 ? '#C5A880' : 'url(#skylineGlassL)'} 
                            fillOpacity={selectedFloor === 0 ? 0.95 : 0.88}
                            stroke={selectedFloor === 0 ? '#FFFFFF' : curTone.borderBuilding} 
                            strokeWidth={selectedFloor === 0 ? 2.2 : 1.6} 
                          />

                          {/* Mặt kính sảnh phải */}
                          <polygon 
                            points="440,790 680,747 680,822 440,865" 
                            fill={selectedFloor === 0 ? '#D8BC94' : 'url(#skylineGlassR)'} 
                            fillOpacity={selectedFloor === 0 ? 0.95 : 0.88}
                            stroke={selectedFloor === 0 ? '#FFFFFF' : curTone.borderBuilding} 
                            strokeWidth={selectedFloor === 0 ? 2.2 : 1.6} 
                          />

                          {/* Ánh sáng vàng tiếp tân ấm cúng */}
                          <polygon 
                            points="220,760 440,798 440,858 220,822" 
                            fill="#F59E0B" 
                            fillOpacity={selectedFloor === 0 ? 0.35 : 0.18} 
                            stroke="#FDE68A" 
                            strokeWidth="0.8" 
                          />
                          <polygon 
                            points="440,798 660,760 660,822 440,858" 
                            fill="#F59E0B" 
                            fillOpacity={selectedFloor === 0 ? 0.35 : 0.18} 
                            stroke="#FDE68A" 
                            strokeWidth="0.8" 
                          />

                          {/* Mái đón sảnh chính (Canopy đón trả khách) */}
                          <polygon 
                            points="340,847 440,865 540,847 440,830" 
                            fill="#0F172A" 
                            stroke="#C5A880" 
                            strokeWidth="1.8" 
                          />
                          <line x1="350" y1="849" x2="350" y2="880" stroke="#C5A880" strokeWidth="2.2" />
                          <line x1="530" y1="849" x2="530" y2="880" stroke="#C5A880" strokeWidth="2.2" />

                          {/* Đèn rọi lối đón khách */}
                          <ellipse cx="440" cy="872" rx="36" ry="7" fill="#FDE68A" fillOpacity="0.28" filter="url(#unitGlow)" />

                          {selectedFloor === 0 && (
                            <g className="pointer-events-none">
                              <rect
                                x="385"
                                y="868"
                                width="110"
                                height="18"
                                rx="0"
                                fill="#C5A880"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                filter="url(#unitGlow)"
                              />
                              <text
                                x="440"
                                y="881"
                                fill="#0D1117"
                                fontSize="9.5"
                                fontWeight="900"
                                textAnchor="middle"
                                fontFamily="monospace"
                              >
                                {t('TẦNG SẢNH (G)', 'LOBBY FLOOR (G)')}
                              </text>
                            </g>
                          )}
                        </g>

                        {/* CON TRỎ LASER VÀ BẢNG CALLOUT HOLOGRAPHIC ĐỒNG BỘ */}
                        {(() => {
                          const isPodium = selectedFloor === 0;
                          const curFloor = Math.max(1, Math.min(currentTotalFloors, selectedFloor));
                          const curYBase = 790 - (curFloor - 1) * floorStep;
                          const curH = curFloor === currentTotalFloors ? 18 : 14;

                          // Tọa độ định vị laser khớp chuẩn xác 100% với trục tim dải tầng 3D
                          const pinX = isPodium ? 560 : 550;
                          const pinY = isPodium ? 806 : Number((curYBase - 20 - (curH / 2)).toFixed(1));

                          const wallX = isPodium ? 680 : 660;
                          const wallY = isPodium ? 785 : Number((curYBase - 40 - (curH / 2)).toFixed(1));

                          // Thẻ Callout Tầng - Tinh gọn, thanh thoát, định vị cao độ kiến trúc (Không tràn khung)
                          const cardX = 675;
                          const cardW = 275;
                          const cardH = 90;
                          const targetCardY = Math.max(30, Math.min(840, Math.round(wallY - cardH / 2)));
                          const dockX = cardX;
                          const dockY = Math.max(targetCardY + 20, Math.min(targetCardY + cardH - 20, wallY));

                          // Đường dẫn laze chuẩn xác không bị gập ziczac hay ngược chiều
                          const isDirectHorizontal = Math.abs(dockY - wallY) < 3;
                          const midX = Math.round((wallX + dockX) / 2);
                          const laserPath = isDirectHorizontal
                            ? `M ${pinX} ${pinY} L ${wallX} ${wallY} L ${dockX} ${dockY}`
                            : `M ${pinX} ${pinY} L ${wallX} ${wallY} L ${midX} ${wallY} L ${midX} ${dockY} L ${dockX} ${dockY}`;

                          const curFloorStats = floorStatsList.find(f => f.floor === curFloor);
                          const occCount = curFloorStats?.occupied || floorOccupiedCount;
                          const hasOcc = occCount > 0;

                          // Thông tin đặc thù theo cao độ & kiến trúc tòa nhà (tránh trùng lặp với mặt bằng bên phải)
                          const floorZone = isPodium
                            ? (isEn ? 'GROUND LOBBY / G' : 'SẢNH TRỆT / G')
                            : curFloor >= 21
                            ? (isEn ? 'HIGH ZONE' : 'PHÂN KHU TẦNG CAO')
                            : curFloor >= 11
                            ? (isEn ? 'MID ZONE' : 'PHÂN KHU TẦNG TRUNG')
                            : curFloor === 1
                            ? (isEn ? 'COMMERCIAL PODIUM' : 'KHỐI ĐẾ THƯƠNG MẠI')
                            : (isEn ? 'LOW ZONE' : 'PHÂN KHU TẦNG THẤP');

                          const elevationM = isPodium ? '0m' : `~${(curFloor * 3.2).toFixed(0)}m`;
                          const elevatorAccess = isPodium ? (isEn ? 'Lobby lifts' : 'Thang sảnh') : (isEn ? '5 High-speed elevators (3.5m/s)' : '5 Thang tốc độ cao (3.5m/s)');
                          const viewOrientation = isPodium
                            ? (isEn ? 'Concierge & 24/7 Security FaceID' : 'Tiếp tân & FaceID an ninh 24/7')
                            : curFloor >= 21
                            ? (isEn ? 'Outlook: River & Panorama Penthouse View' : 'Tầm nhìn: View Sông & Panorama đỉnh')
                            : curFloor >= 11
                            ? (isEn ? 'Outlook: Internal Tropical Pool View' : 'Tầm nhìn: View Toàn cảnh hồ bơi nội khu')
                            : (isEn ? 'Outlook: Landscape Garden & Amenities' : 'Tầm nhìn: View Mảng xanh & tiện ích');

                          const themeNeon = '#C5A880';
                          const themeBg = '#0B121D';
                          const themeBorder = '#C5A880';

                          return (
                            <g key={`dynamic-floor-pointer-${selectedFloor}`} className="pointer-events-none">
                              {/* Vòng tâm định vị tầng chuẩn xác trên dải 3D */}
                              <circle cx={pinX} cy={pinY} r="4.5" fill={themeNeon} filter="url(#unitGlow)" />
                              <circle cx={pinX} cy={pinY} r="14" fill="none" stroke={themeNeon} strokeWidth="1.5" className="anim-ping-pulse" />
                              <circle cx={pinX} cy={pinY} r="2" fill="#FFFFFF" />

                              {/* Đường dẫn Laser chỉ tầng */}
                              <path
                                d={laserPath}
                                fill="none"
                                stroke={themeNeon}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="anim-laser-line"
                                filter="url(#unitGlow)"
                              />
                              <circle cx={wallX} cy={wallY} r="3" fill={themeNeon} />
                              <circle cx={dockX} cy={dockY} r="3.5" fill={themeBorder} />

                              {/* Thẻ Callout Tầng Tinh Gọn - Zero Border-Radius Luxury */}
                              <g className="anim-callout-card">
                                <rect
                                  x={cardX}
                                  y={targetCardY}
                                  width={cardW}
                                  height={cardH}
                                  fill={themeBg}
                                  fillOpacity="0.96"
                                  stroke={themeBorder}
                                  strokeWidth="1.6"
                                  filter="url(#unitGlow)"
                                />

                                {/* Dải viền vàng bên trái */}
                                <rect
                                  x={cardX}
                                  y={targetCardY}
                                  width="3.5"
                                  height={cardH}
                                  fill="#C5A880"
                                />

                                {/* Dòng 1: Tiêu đề tầng & Phân khu kiến trúc */}
                                <circle cx={cardX + 16} cy={targetCardY + 20} r="3" fill={themeNeon} />
                                <text
                                  x={cardX + 24}
                                  y={targetCardY + 24}
                                  fill="#FFFFFF"
                                  fontSize="12"
                                  fontWeight="900"
                                  fontFamily="monospace"
                                >
                                  {isPodium ? t('TẦNG SẢNH (G)', 'LOBBY (G)') : `${t('TẦNG', 'LEVEL')} ${curFloor}`}
                                </text>

                                <text
                                  x={cardX + (isPodium ? 116 : 88)}
                                  y={targetCardY + 24}
                                  fill="#C5A880"
                                  fontSize="9.5"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                >
                                  • {floorZone.replace('PHÂN KHU ', '')}
                                </text>

                                {/* Huy hiệu tỷ lệ ở ngắn gọn góc phải */}
                                <rect
                                  x={cardX + cardW - 78}
                                  y={targetCardY + 11}
                                  width="70"
                                  height="18"
                                  fill="#141E2B"
                                  stroke="#26374D"
                                />
                                <text
                                  x={cardX + cardW - 43}
                                  y={targetCardY + 23.5}
                                  fill={hasOcc ? '#34D399' : '#94A3B8'}
                                  fontSize="8.5"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  fontFamily="monospace"
                                >
                                  {isPodium ? t('SẢNH ĐÓN', 'LOBBY') : `${t('ĐÃ Ở:', 'OCCUPIED:')} ${occCount}/21`}
                                </text>

                                {/* Đường kẻ phân cách sang trọng */}
                                <line
                                  x1={cardX + 14}
                                  y1={targetCardY + 36}
                                  x2={cardX + cardW - 14}
                                  y2={targetCardY + 36}
                                  stroke="#1C2737"
                                  strokeWidth="0.8"
                                />

                                {/* Dòng 2: Cao độ tĩnh không & Trục giao thông đứng */}
                                <text
                                  x={cardX + 16}
                                  y={targetCardY + 53}
                                  fill="#94A3B8"
                                  fontSize="9.5"
                                  fontFamily="sans-serif"
                                >
                                  {t('Cao độ:', 'Elevation:')} <tspan fill="#F1F5F9" fontWeight="bold">{elevationM}</tspan>  •  {elevatorAccess}
                                </text>

                                {/* Dòng 3: Tầm nhìn kiến trúc & Hướng cảnh quan */}
                                <text
                                  x={cardX + 16}
                                  y={targetCardY + 73}
                                  fill="#CBD5E1"
                                  fontSize="9.5"
                                  fontFamily="sans-serif"
                                >
                                  {viewOrientation}
                                </text>
                              </g>
                            </g>
                          );
                        })()}
                      </g>

                      {/* THẺ HOVER */}
                      {hoveredFloor && hoveredFloor !== selectedFloor && (
                        <g className="pointer-events-none">
                          {(() => {
                            const hStats = floorStatsList.find(f => f.floor === hoveredFloor);
                            return (
                              <g>
                                <rect x="660" y="16" width="285" height="42" fill="#0D1117" fillOpacity="0.96" stroke={curTone.borderBuilding} strokeWidth="1.2" />
                                <text x="674" y="33" fill={curTone.titleColor} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                                  {hoveredFloor === 1 ? t('XEM NHANH: TẦNG 1 (ĐẠI SẢNH ĐÓN)', 'QUICK VIEW: LEVEL 1 (MAIN LOBBY)') : `${t('XEM NHANH: TẦNG', 'QUICK VIEW: LEVEL')} ${hoveredFloor} (${t('21 CĂN HỘ', '21 UNITS')})`}
                                </text>
                                <text x="674" y="47" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">
                                  {hoveredFloor === 1 ? t('Khu vực lễ tân & kiểm soát an ninh', 'Reception area & security check') : (hStats?.occupied && hStats.occupied > 0 ? `${hStats.occupied} ${t('căn có người ở', 'units occupied')}` : t('Tất cả căn trống', 'All units vacant'))} • {t('Nhấp để xem mặt bằng tầng', 'Click to view floor plan')}
                                </text>
                              </g>
                            );
                          })()}
                        </g>
                      )}
                    </svg>
                  </div>
                </div>

              </div>
  );
}
