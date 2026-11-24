'use client';

import React from 'react';
import { 
  Map, 
  X, 
  ChevronLeft, 
  Sparkles, 
  MapPin, 
  Compass, 
  Building2, 
  Layers, 
  ExternalLink, 
  Info,
  ChevronRight
} from 'lucide-react';
import { THE_TROPICAL_AMENITIES, SURROUNDING_AMENITIES, BUILDING_3D_UNITS } from './buildingConstants';
import { useLanguage } from '@/lib/languageContext';

export interface MasterPlanAmenitiesConsoleProps {
  selectedAmenityId: string | null;
  hoveredAmenityId: string | null;
  setSelectedAmenityId: (id: string | null) => void;
  setHoveredAmenityId: (id: string | null) => void;
  selectedBlock: string;
  onSwitchBlock: (block: string) => void;
  onSelectBlockAndShowFloors: (block: string) => void;
  onSelectFloor: (floor: number) => void;
}

export default function MasterPlanAmenitiesConsole({
  selectedAmenityId,
  hoveredAmenityId,
  setSelectedAmenityId,
  setHoveredAmenityId,
  selectedBlock,
  onSwitchBlock,
  onSelectBlockAndShowFloors,
  onSelectFloor,
}: MasterPlanAmenitiesConsoleProps) {
  const { t, isEn } = useLanguage();
  const activeAmenityId = selectedAmenityId || hoveredAmenityId;
  const tropicalAmenity = THE_TROPICAL_AMENITIES.find(a => a.id === activeAmenityId);
  const surroundingAmenity = SURROUNDING_AMENITIES.find(a => a.id === activeAmenityId);
  const activeAmenity = tropicalAmenity || surroundingAmenity;
  const currentBlockConfig = BUILDING_3D_UNITS[selectedBlock] || BUILDING_3D_UNITS['BS-07'];
  const currentTotalFloors = currentBlockConfig.totalFloors;

  return (
    <div className="flex flex-col h-full justify-between select-none">
                <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                  
                  {/* TIÊU ĐỀ QUY HOẠCH TINH GỌN (ĐÃ LOẠI BỎ TAB HỒ SƠ CĂN) */}
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Map className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span className="text-white font-bold tracking-wide">
                        {t('QUY HOẠCH PHÂN KHU THE TROPICAL', 'THE TROPICAL MASTER PLAN')}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-[#C5A880] font-bold">{selectedBlock}</span>
                    </div>

                    {activeAmenity && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAmenityId(null);
                          setHoveredAmenityId(null);
                        }}
                        className="px-2 py-0.5 bg-[#141E2D] hover:bg-[#1E2E42] text-[#C5A880] text-[10.5px] border border-[#23354C] flex items-center gap-1 transition-all"
                        title={t('Đóng chi tiết tiện ích, quay về chung cư', 'Close amenity details, return to overview')}
                      >
                        <X className="w-3 h-3" />
                        <span>{t('Về Tổng Quan', 'Overview')}</span>
                      </button>
                    )}
                  </div>

                  {/* ========================================================================= */}
                  {/* TRƯỜNG HỢP 1: CÓ TIỆN ÍCH ĐANG ĐƯỢC CHỌN HOẶC HOVER                       */}
                  {/* ========================================================================= */}
                  {activeAmenity ? (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      
                      {/* Tiêu đề tiện ích */}
                      <div className="border-b border-[#222B35] pb-2.5 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>
                              {tropicalAmenity ? `${t('TIỆN ÍCH NỘI KHU #', 'INTERNAL AMENITY #')}${tropicalAmenity.displayNumber || tropicalAmenity.id}` : `${t('ĐẠI TIỆN ÍCH ĐÔ THỊ', 'METRO AMENITY')} ${surroundingAmenity?.id}`}
                            </span>
                          </div>
                          <h3 className="font-serif text-lg sm:text-xl font-bold text-white mt-0.5 leading-snug">
                            {activeAmenity.name}
                          </h3>
                        </div>

                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border bg-emerald-950 text-emerald-300 border-emerald-500 shrink-0 ml-2">
                          {t('VẬN HÀNH 5★', '5★ OPERATION')}
                        </span>
                      </div>

                      {/* 3 Thẻ chỉ số tiện ích thiết yếu */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">{t('Khoảng Cách', 'Distance')}</div>
                          <div className="text-xs font-bold text-cyan-400 mt-0.5 truncate">{activeAmenity.distance}</div>
                        </div>
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">{t('Thời Gian Đến', 'Travel Time')}</div>
                          <div className="text-xs font-bold text-emerald-400 mt-0.5 truncate">{surroundingAmenity?.walkTime || t('1 - 2 phút', '1 - 2 mins')}</div>
                        </div>
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">{t('Khung Giờ Mở', 'Opening Hours')}</div>
                          <div className="text-xs font-bold text-[#C5A880] mt-0.5 truncate">
                            {tropicalAmenity?.category === 'POOL' ? '06h - 21h30' : tropicalAmenity?.category === 'SPORT' ? '06h - 22h00' : surroundingAmenity?.category === 'SHOPPING' ? '09h30 - 22h' : '05h - 23h'}
                          </div>
                        </div>
                      </div>

                      {/* Mô tả chi tiết không gian */}
                      <div className="p-3 bg-[#111622] border border-[#222E3E] space-y-1.5">
                        <div className="text-xs font-mono font-bold text-[#C5A880] flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5" />
                          <span>{t('KHÔNG GIAN KIẾN TRÚC & CẢNH QUAN', 'ARCHITECTURE & LANDSCAPE')}</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          {activeAmenity.desc}
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAmenityId(null);
                            setHoveredAmenityId(null);
                          }}
                          className="w-full py-2 bg-[#141E2D] hover:bg-[#C5A880] text-[#C5A880] hover:text-black border border-[#23354C] text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>{t('Quay Lại Tổng Quan Phân Khu', 'Back to Master Plan Overview')}</span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    /* ========================================================================= */
                    /* TRƯỜNG HỢP 2: TỔNG QUAN QUY HOẠCH KHỐI CHUNG CƯ ĐANG CHỌN (BS-07..BS-10)   */
                    /* ========================================================================= */
                    <div className="space-y-3 animate-in fade-in duration-200">
                      
                      {/* Tiêu đề tòa nhà */}
                      <div className="border-b border-[#222B35] pb-2.5 flex items-start justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                            {t('QUY HOẠCH PHÂN KHU THE TROPICAL', 'THE TROPICAL MASTER PLAN')}
                          </div>
                          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                            {currentBlockConfig.name}
                          </h3>
                        </div>

                        <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-none border bg-blue-950 text-blue-300 border-blue-500 shrink-0 ml-2 font-mono">
                          {currentTotalFloors} {t('TẦNG', 'FLOORS')}
                        </span>
                      </div>

                      {/* 3 Thẻ thông số quy hoạch khối tòa gọn gàng */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">{t('Chiều Cao', 'Height')}</div>
                          <div className="text-xs font-bold text-white mt-0.5">{currentTotalFloors} {t('Tầng', 'Floors')}</div>
                        </div>
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">{t('Tổng Căn Hộ', 'Total Units')}</div>
                          <div className="text-xs font-bold text-cyan-400 mt-0.5">{selectedBlock === 'BS-08' ? '819' : '714'} {t('căn', 'units')}</div>
                        </div>
                        <div className="p-1.5 bg-[#161B22]">
                          <div className="text-[9.5px] text-gray-400">{t('Mật Độ Thiết Kế', 'Layout Density')}</div>
                          <div className="text-xs font-bold text-emerald-400 mt-0.5">{t('21 căn/sàn', '21 units/floor')}</div>
                        </div>
                      </div>

                      {/* BỘ CHUYỂN 4 KHỐI CHUNG CƯ THE TROPICAL GỌN GÀNG */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-mono font-bold text-gray-300 flex items-center justify-between">
                          <span>{t('KHỐI CHUNG CƯ TRONG PHÂN KHU:', 'RESIDENTIAL BLOCKS IN SUBDIVISION:')}</span>
                          <span className="text-[#C5A880] text-[11px]">{t('Bấm chuyển khối', 'Switch block')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          {[
                            { code: 'BS-07', name: 'BS-07 (The Tropical)', floors: 34, loc: isEn ? 'Rodeo Palm Avenue' : 'Trục Phố Cọ Rodeo' },
                            { code: 'BS-08', name: 'BS-08 (The Tropical)', floors: 39, loc: isEn ? 'California Palm Garden' : 'Vườn Cọ California' },
                            { code: 'BS-09', name: 'BS-09 (The Tropical)', floors: 34, loc: isEn ? 'Direct Resort Pool View' : 'Trực Diện Hồ Bơi Resort' },
                            { code: 'BS-10', name: 'BS-10 (The Tropical)', floors: 34, loc: isEn ? 'Malibu Sports Arena' : 'Sân Thể Thao Malibu' },
                          ].map(blk => {
                            const isCur = selectedBlock === blk.code;
                            return (
                              <div
                                key={blk.code}
                                onClick={() => onSwitchBlock(blk.code as any)}
                                className={`p-2.5 border cursor-pointer transition-all ${
                                  isCur 
                                    ? 'bg-[#1C2838] border-[#C5A880] ring-1 ring-[#C5A880]' 
                                    : 'bg-[#111622] border-[#222E3E] hover:border-gray-500'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <strong className={isCur ? 'text-[#C5A880]' : 'text-white'}>{blk.name}</strong>
                                  <span className={`text-[10px] px-1.5 py-0.5 ${isCur ? 'bg-[#C5A880] text-black font-bold' : 'bg-[#182333] text-gray-400'}`}>
                                    {blk.floors}T
                                  </span>
                                </div>
                                <div className="text-[10.5px] text-gray-400 mt-1 truncate">{blk.loc}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Khối tóm tắt tiện ích trọng điểm nội khu */}
                      <div className="p-3 bg-[#111622] border border-[#222E3E] space-y-1.5">
                        <div className="text-xs font-mono font-bold text-[#C5A880] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t('TIỆN ÍCH ĐẶC QUYỀN NỘI KHU THE TROPICAL', 'EXCLUSIVE THE TROPICAL AMENITIES')}</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          {t('Phân khu The Tropical sở hữu 23 tiện ích phong cách nghỉ dưỡng nhiệt đới: Bể bơi resort 800m², phố cọ Rodeo, vườn California, sân tập yoga và sân thể thao Malibu.', 'The Tropical subdivision features 23 tropical resort-style amenities: 800m² pool, Rodeo palm promenade, California garden, yoga deck, and Malibu sports arena.')}
                        </p>
                      </div>

                      {/* Thẻ chỉ dẫn thao tác nhanh */}
                      <div className="p-2.5 bg-[#0C111A] border border-[#1E293B] text-[11px] font-mono text-gray-400 flex items-center gap-2">
                        <span className="text-[#C5A880] text-sm">💡</span>
                        <span>{t('Nhấp vào các điểm đánh dấu trên bản đồ bên trái để xem chi tiết tiện ích.', 'Click the markers on the map on the left to view amenity details.')}</span>
                      </div>

                    </div>
                  )}

                </div>
              </div>
  );
}
