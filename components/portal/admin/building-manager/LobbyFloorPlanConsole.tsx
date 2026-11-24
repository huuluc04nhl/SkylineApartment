'use client';

import React from 'react';
import { 
  ChevronUp, 
  ChevronRight, 
  Building, 
  Phone, 
  UserCheck, 
  Clock, 
  Sparkles, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { LOBBY_ZONES_DETAIL } from './buildingConstants';
import { useLanguage } from '@/lib/languageContext';

export interface LobbyFloorPlanConsoleProps {
  selectedBlock: string;
  onSelectFloor: (floor: number) => void;
  selectedLobbyZone: string;
  setSelectedLobbyZone: (zone: string) => void;
}

export default function LobbyFloorPlanConsole({
  selectedBlock,
  onSelectFloor,
  selectedLobbyZone,
  setSelectedLobbyZone,
}: LobbyFloorPlanConsoleProps) {
  const { t, isEn } = useLanguage();
  return (
              <div className="flex flex-col h-full justify-between select-none">
                <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                  
                  {/* TIÊU ĐỀ TẦNG SẢNH */}
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-white font-bold text-sm tracking-wide">
                        {t('MẶT BẰNG ĐẠI SẢNH CHÀO ĐÓN (TẦNG G)', 'GRAND WELCOME LOBBY FLOOR PLAN (LEVEL G)')}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-[#C5A880] font-bold">{selectedBlock}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-950 border border-blue-500 text-blue-300 font-bold uppercase hidden sm:inline">
                        {t('TIỆN ÍCH & BQL (KHÔNG CÓ CĂN HỘ)', 'AMENITIES & MANAGEMENT (NO UNITS)')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectFloor(1)}
                        className="px-2.5 py-1 bg-[#141E2D] hover:bg-[#C5A880] text-[#C5A880] hover:text-black text-xs border border-[#23354C] flex items-center gap-1.5 transition-all shadow"
                        title={t('Lên Tầng 1 xem mặt bằng căn hộ', 'Go to Level 1 to view residential units')}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>{t('Lên Tầng 1 (Căn Hộ) ➔', 'Go to Level 1 (Units) ➔')}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 THẺ THỐNG KÊ VẬN HÀNH TẦNG SẢNH */}
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                    <div className="p-1 bg-[#161B22]">
                      <div className="text-[9.5px] text-gray-400">{t('Diện Tích Sảnh', 'Lobby Area')}</div>
                      <div className="text-xs font-bold text-white mt-0.5">850 m²</div>
                    </div>
                    <div className="p-1 bg-[#161B22] border-b-2 border-emerald-500">
                      <div className="text-[9.5px] text-gray-400">{t('Lễ Tân & BQL', 'Concierge & Mgmt')}</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">{t('Trực 24/7', '24/7 Duty')}</div>
                    </div>
                    <div className="p-1 bg-[#161B22] border-b-2 border-sky-500">
                      <div className="text-[9.5px] text-gray-400">{t('An Ninh Sảnh', 'Lobby Security')}</div>
                      <div className="text-xs font-bold text-sky-400 mt-0.5">{t('12 Camera AI', '12 AI Cameras')}</div>
                    </div>
                    <div className="p-1 bg-[#161B22] border-b-2 border-amber-500">
                      <div className="text-[9.5px] text-gray-400">{t('Lõi Thang Máy', 'Elevator Core')}</div>
                      <div className="text-xs font-bold text-amber-300 mt-0.5">{t('6 Thang FaceID', '6 FaceID Lifts')}</div>
                    </div>
                  </div>

                  {/* SƠ ĐỒ MẶT BẰNG KIẾN TRÚC TẦNG SẢNH CAD SVG */}
                  <div className="border border-[#1E293B] bg-[#05080E] p-2 relative overflow-hidden">
                    <svg viewBox="0 0 800 420" className="w-full h-auto select-none font-mono">
                      <defs>
                        <pattern id="lobbyCadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#131D2A" strokeWidth="0.6" />
                        </pattern>
                      </defs>
                      <rect width="800" height="420" fill="#070B12" />
                      <rect width="800" height="420" fill="url(#lobbyCadGrid)" opacity="0.6" />

                      {/* Tường bao chu vi đại sảnh */}
                      <rect x="30" y="30" width="740" height="360" fill="none" stroke="#334155" strokeWidth="3" />
                      <rect x="35" y="35" width="730" height="350" fill="#0B1320" fillOpacity="0.85" />

                      {/* 1. DROP-OFF & LỐI VÀO CHÍNH CÓ MÁI CHE */}
                      <rect x="280" y="360" width="240" height="30" fill="#162234" stroke="#C5A880" strokeWidth="1.5" strokeDasharray="4 2" />
                      <text x="400" y="380" fill="#E2E8F0" fontSize="10" fontWeight="bold" textAnchor="middle">{t('▼ LỐI VÀO SẢNH ĐÓN CHÍNH (DROP-OFF CANOPY) ▼', '▼ MAIN DROP-OFF CANOPY ENTRANCE ▼')}</text>

                      {/* Cửa xoay tự động */}
                      <circle cx="400" cy="355" r="14" fill="#1E293B" stroke="#C5A880" strokeWidth="1.5" />
                      <line x1="400" y1="341" x2="400" y2="369" stroke="#C5A880" strokeWidth="1.5" />
                      <line x1="386" y1="355" x2="414" y2="355" stroke="#C5A880" strokeWidth="1.5" />

                      {/* 2. QUẦY ĐẠI LỄ TÂN & CONCIERGE 24/7 */}
                      <g
                        onClick={() => setSelectedLobbyZone('RECEPTION')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="300" 
                          y="245" 
                          width="200" 
                          height="65" 
                          rx="6"
                          fill={selectedLobbyZone === 'RECEPTION' ? '#2A2314' : '#141C26'} 
                          stroke={selectedLobbyZone === 'RECEPTION' ? '#C5A880' : '#2D3E54'} 
                          strokeWidth={selectedLobbyZone === 'RECEPTION' ? 2 : 1.2} 
                        />
                        <path d="M 330 268 Q 400 252 470 268" fill="none" stroke="#C5A880" strokeWidth="3" />
                        <text x="400" y="285" fill={selectedLobbyZone === 'RECEPTION' ? '#FDE68A' : '#FFFFFF'} fontSize="11" fontWeight="bold" textAnchor="middle">
                          {t('QUẦY ĐẠI LỄ TÂN & CONCIERGE', 'GRAND RECEPTION & CONCIERGE')}
                        </text>
                        <text x="400" y="300" fill="#94A3B8" fontSize="8.5" textAnchor="middle">
                          {t('Trực Tiếp Đón Khách 24/7 • Bàn Tròn VIP', '24/7 Guest Welcoming • VIP Round Table')}
                        </text>
                      </g>

                      {/* 3. LÕI 6 THANG MÁY CƯ DÂN & CỔNG FACEID */}
                      <g
                        onClick={() => setSelectedLobbyZone('ELEVATOR_LOBBY')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="260" 
                          y="50" 
                          width="280" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'ELEVATOR_LOBBY' ? '#0E241E' : '#0F1A24'} 
                          stroke={selectedLobbyZone === 'ELEVATOR_LOBBY' ? '#34D399' : '#1E3A34'} 
                          strokeWidth={selectedLobbyZone === 'ELEVATOR_LOBBY' ? 2 : 1.2} 
                        />
                        <text x="400" y="75" fill="#34D399" fontSize="11" fontWeight="bold" textAnchor="middle">
                          {t('LÕI 6 THANG MÁY CƯ DÂN (TỐC ĐỘ CAO 3.5m/s)', '6 RESIDENT ELEVATORS (HIGH SPEED 3.5m/s)')}
                        </text>

                        {[0, 1, 2].map(i => (
                          <rect key={`elev-l-${i}`} x={280 + i * 42} y="90" width="34" height="42" fill="#162232" stroke="#38BDF8" strokeWidth="1" />
                        ))}
                        {[0, 1, 2].map(i => (
                          <rect key={`elev-r-${i}`} x={425 + i * 42} y="90" width="34" height="42" fill="#162232" stroke="#38BDF8" strokeWidth="1" />
                        ))}
                        <text x="330" y="115" fill="#E2E8F0" fontSize="8.5" textAnchor="middle">{t('THANG 1-3', 'LIFTS 1-3')}</text>
                        <text x="475" y="115" fill="#E2E8F0" fontSize="8.5" textAnchor="middle">{t('THANG 4-6', 'LIFTS 4-6')}</text>

                        {/* Cổng Flap Barrier FaceID */}
                        <line x1="280" y1="165" x2="520" y2="165" stroke="#34D399" strokeWidth="2" strokeDasharray="6 3" />
                        <text x="400" y="185" fill="#6EE7B7" fontSize="9" textAnchor="middle">
                          {t('[ CỔNG KIỂM SOÁT AN NINH FACEID AI & FLAP BARRIER ]', '[ AI FACEID & FLAP BARRIER SECURITY ACCESS ]')}
                        </text>
                      </g>

                      {/* 4. VĂN PHÒNG BAN QUẢN LÝ (BQL) */}
                      <g
                        onClick={() => setSelectedLobbyZone('BQL_OFFICE')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="50" 
                          y="220" 
                          width="210" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'BQL_OFFICE' ? '#0F2338' : '#0B1622'} 
                          stroke={selectedLobbyZone === 'BQL_OFFICE' ? '#38BDF8' : '#1D334C'} 
                          strokeWidth={selectedLobbyZone === 'BQL_OFFICE' ? 2 : 1.2} 
                        />
                        <text x="155" y="245" fill="#38BDF8" fontSize="11" fontWeight="bold" textAnchor="middle">
                          {t('VĂN PHÒNG BAN QUẢN LÝ (BQL)', 'MANAGEMENT OFFICE (BQL)')}
                        </text>
                        <text x="155" y="265" fill="#E2E8F0" fontSize="9" textAnchor="middle">
                          {t('Phòng Tiếp Dân & Thủ Tục Cư Trú', 'Resident Service & Registration Desk')}
                        </text>
                        <rect x="70" y="280" width="80" height="35" fill="#142436" stroke="#2563EB" strokeWidth="0.8" />
                        <text x="110" y="302" fill="#93C5FD" fontSize="8.5" textAnchor="middle">{t('Bàn BQL', 'Mgmt Desk')}</text>
                        <rect x="160" y="280" width="80" height="35" fill="#142436" stroke="#2563EB" strokeWidth="0.8" />
                        <text x="200" y="302" fill="#93C5FD" fontSize="8.5" textAnchor="middle">{t('Bàn Kỹ Thuật', 'Tech Desk')}</text>
                        <text x="155" y="350" fill="#94A3B8" fontSize="8.5" textAnchor="middle">
                          {t('Giờ làm việc: 08h00 - 17h30 (T2-T7)', 'Working Hours: 08:00 - 17:30 (Mon-Sat)')}
                        </text>
                      </g>

                      {/* 5. RESIDENT LOUNGE */}
                      <g
                        onClick={() => setSelectedLobbyZone('LOUNGE')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="50" 
                          y="50" 
                          width="190" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'LOUNGE' ? '#2A2012' : '#14141E'} 
                          stroke={selectedLobbyZone === 'LOUNGE' ? '#FBBF24' : '#2D2938'} 
                          strokeWidth={selectedLobbyZone === 'LOUNGE' ? 2 : 1.2} 
                        />
                        <text x="145" y="75" fill="#FBBF24" fontSize="11" fontWeight="bold" textAnchor="middle">
                          RESIDENT LOUNGE RESORT
                        </text>
                        <text x="145" y="95" fill="#E2E8F0" fontSize="9" textAnchor="middle">
                          {t('Sảnh Tiếp Khách Cư Dân 5★', '5★ Resident Guest Lounge')}
                        </text>
                        <rect x="80" y="115" width="130" height="50" rx="4" fill="#201C2B" stroke="#D97706" strokeWidth="0.8" />
                        <text x="145" y="145" fill="#FDE68A" fontSize="9" textAnchor="middle">{t('Sofa Thư Giãn • Máy Pha Cà Phê', 'Relaxation Lounge • Coffee Machine')}</text>
                      </g>

                      {/* 6. HÒM THƯ CƯ DÂN & SMART LOCKER */}
                      <g
                        onClick={() => setSelectedLobbyZone('MAIL_LOCKER')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="560" 
                          y="50" 
                          width="190" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'MAIL_LOCKER' ? '#1C162A' : '#12101C'} 
                          stroke={selectedLobbyZone === 'MAIL_LOCKER' ? '#A78BFA' : '#2D2444'} 
                          strokeWidth={selectedLobbyZone === 'MAIL_LOCKER' ? 2 : 1.2} 
                        />
                        <text x="655" y="75" fill="#A78BFA" fontSize="11" fontWeight="bold" textAnchor="middle">
                          {t('HÒM THƯ & SMART LOCKER', 'MAILBOX & SMART LOCKER')}
                        </text>
                        <text x="655" y="95" fill="#E2E8F0" fontSize="9" textAnchor="middle">
                          {t('Giao Nhận Bưu Kiện Tự Động 24/7', 'Automated 24/7 Parcel Delivery')}
                        </text>
                        <rect x="580" y="115" width="150" height="50" fill="#1C182E" stroke="#8B5CF6" strokeWidth="0.8" />
                        <text x="655" y="135" fill="#DDD6FE" fontSize="8.5" textAnchor="middle">{t('Tủ Locker Thông Minh (Mở QR/OTP)', 'Smart Locker (QR/OTP Open)')}</text>
                        <text x="655" y="152" fill="#94A3B8" fontSize="8" textAnchor="middle">{t('Hòm Thư Từng Căn T1 - T34', 'Mailbox Per Unit L1 - L34')}</text>
                      </g>

                      {/* 7. RAM DỐC HẦM XE B1 - B2 */}
                      <g
                        onClick={() => setSelectedLobbyZone('DROP_OFF')}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="560" 
                          y="220" 
                          width="190" 
                          height="150" 
                          rx="4"
                          fill={selectedLobbyZone === 'DROP_OFF' ? '#2A1420' : '#1A0E18'} 
                          stroke={selectedLobbyZone === 'DROP_OFF' ? '#F472B6' : '#3E1E34'} 
                          strokeWidth={selectedLobbyZone === 'DROP_OFF' ? 2 : 1.2} 
                        />
                        <text x="655" y="245" fill="#F472B6" fontSize="11" fontWeight="bold" textAnchor="middle">
                          {t('RAM DỐC HẦM XE B1 - B2', 'BASEMENT B1 - B2 RAMP')}
                        </text>
                        <text x="655" y="265" fill="#E2E8F0" fontSize="9" textAnchor="middle">
                          {t('Lối Xe Ô Tô & Xe Máy Xuống Hầm', 'Vehicles Down to Basement')}
                        </text>
                        <rect x="585" y="280" width="140" height="40" fill="#261022" stroke="#E11D48" strokeWidth="0.8" strokeDasharray="3 2" />
                        <text x="655" y="305" fill="#FDA4AF" fontSize="9" textAnchor="middle">{t('▼ RAM DỐC B1 - B2 ▼', '▼ B1 - B2 RAMP ▼')}</text>
                        <text x="655" y="350" fill="#94A3B8" fontSize="8.5" textAnchor="middle">
                          {t('Kiểm soát Barrier tự động biển số', 'Automatic ALPR License Plate Barrier')}
                        </text>
                      </g>
                    </svg>
                  </div>

                  {/* DANH SÁCH 6 KHU VỰC CHỨC NĂNG TẦNG SẢNH */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                      <span>{t('PHÂN KHU CHỨC NĂNG ĐẠI SẢNH (TẦNG G):', 'LOBBY FUNCTIONAL ZONES (LEVEL G):')}</span>
                      <span className="text-[#C5A880] text-[10.5px]">{t('Bấm vào khu vực để xem chi tiết', 'Click zone to view details')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                      {[
                        { id: 'RECEPTION', name: t('Quầy Lễ Tân 24/7', '24/7 Reception'), tag: t('Tiếp đón', 'Welcoming'), color: 'border-[#C5A880] text-[#C5A880]' },
                        { id: 'BQL_OFFICE', name: t('Văn Phòng BQL', 'Mgmt Office'), tag: t('Hành chính', 'Admin'), color: 'border-sky-400 text-sky-400' },
                        { id: 'ELEVATOR_LOBBY', name: t('Lõi 6 Thang Máy', '6 Elevator Core'), tag: 'FaceID AI', color: 'border-emerald-400 text-emerald-400' },
                        { id: 'LOUNGE', name: 'Resident Lounge', tag: t('Tiếp khách 5★', '5★ Lounge'), color: 'border-amber-400 text-amber-400' },
                        { id: 'MAIL_LOCKER', name: t('Hòm Thư & Locker', 'Mailbox & Locker'), tag: 'Smart Locker', color: 'border-purple-400 text-purple-400' },
                        { id: 'DROP_OFF', name: t('Ram Dốc Hầm B1-B2', 'Basement Ramp B1-B2'), tag: t('Lối xe', 'Vehicle ramp'), color: 'border-pink-400 text-pink-400' },
                      ].map(z => {
                        const isCur = selectedLobbyZone === z.id;
                        return (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => setSelectedLobbyZone(z.id)}
                            className={`p-2 border text-left transition-all ${
                              isCur 
                                ? 'bg-[#182333] border-[#C5A880] ring-1 ring-[#C5A880]' 
                                : 'bg-[#101622] border-[#1E293B] hover:border-gray-500'
                            }`}
                          >
                            <div className="font-bold text-white truncate text-[11px]">{z.name}</div>
                            <div className={`text-[10px] mt-0.5 font-bold ${z.color}`}>{z.tag}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CHI TIẾT KHU VỰC TẦNG SẢNH ĐANG CHỌN */}
                  {(() => {
                    const curZoneInfo = LOBBY_ZONES_DETAIL[selectedLobbyZone] || LOBBY_ZONES_DETAIL['RECEPTION'];
                    return (
                      <div className="p-3 bg-[#111824] border border-[#23354C] space-y-2 font-mono">
                        <div className="flex items-center justify-between border-b border-[#1E2D42] pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                            <strong className="text-white text-xs">{curZoneInfo.title}</strong>
                          </div>
                          <span className="text-[10.5px] px-2 py-0.5 bg-[#182436] text-[#C5A880] border border-[#2B3E59]">
                            {curZoneInfo.status}
                          </span>
                        </div>

                        <p className="text-xs text-gray-300 font-sans leading-relaxed">
                          {curZoneInfo.desc}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="p-1.5 bg-[#0C121C] border border-[#1A2636]">
                            <span className="text-gray-400">{t('Nhân sự phụ trách:', 'Staff in charge:')}</span>
                            <div className="text-emerald-400 font-bold mt-0.5">{curZoneInfo.staff}</div>
                          </div>
                          <div className="p-1.5 bg-[#0C121C] border border-[#1A2636]">
                            <span className="text-gray-400">{t('Hotline BQL nội bộ:', 'Internal Hotline:')}</span>
                            <div className="text-cyan-400 font-bold mt-0.5">{curZoneInfo.hotline}</div>
                          </div>
                        </div>

                        {/* Thông báo phân định kiến trúc */}
                        <div className="p-2 bg-[#0A0F18] border border-[#182638] text-[10.5px] text-gray-400 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="text-[#C5A880]">ℹ️</span>
                            <span>{t('Tầng sảnh là khu vực dịch vụ công cộng, không có căn hộ ở.', 'The lobby floor is a public amenity and management area with no residential units.')}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectFloor(1)}
                            className="text-[#C5A880] hover:underline font-bold ml-2 shrink-0 flex items-center gap-1"
                          >
                            <span>{t('Xem Tầng 1 (Căn Hộ)', 'View Level 1 (Units)')}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>
);
}
