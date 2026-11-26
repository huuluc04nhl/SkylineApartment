'use client';

import React from 'react';
import { 
  Maximize2,
  Building, 
  UserCheck, 
  Key, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ApartmentUnit } from '@/lib/apartmentStore';
import CadFloorplanSvgModel from '../models/CadFloorplanSvgModel';
import { useLanguage } from '@/lib/languageContext';

export interface FloorUnitCadPlanViewProps {
  selectedFloor: number;
  selectedBlock: string;
  floorUnits: ApartmentUnit[];
  floorOccupiedCount: number;
  floorMaintenanceCount: number;
  floorVacantCount: number;
  activeUnit: ApartmentUnit | null;
  selectedAptCode: string;
  onSelectApartment: (unit: ApartmentUnit) => void;
  onOpenFloorPlanExpanded: () => void;
  onOpenAssignModal: (unit: ApartmentUnit) => void;
  onOpenDetailModal: (unit: ApartmentUnit) => void;
  onOpenEditModal: (unit: ApartmentUnit) => void;
}

export default function FloorUnitCadPlanView({
  selectedFloor,
  selectedBlock,
  floorUnits,
  floorOccupiedCount,
  floorMaintenanceCount,
  floorVacantCount,
  activeUnit,
  selectedAptCode,
  onSelectApartment,
  onOpenFloorPlanExpanded,
  onOpenAssignModal,
  onOpenDetailModal,
  onOpenEditModal,
}: FloorUnitCadPlanViewProps) {
  const { t, isEn } = useLanguage();
  const [floorFilterStatus, setFloorFilterStatus] = React.useState<'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE'>('ALL');
  const [unitSearchQuery, setUnitSearchQuery] = React.useState<string>('');

  const handleSelectApartment = (u: ApartmentUnit) => {
    onSelectApartment(u);
  };

  const setIsAssignModalOpen = (open: boolean) => {
    if (open && activeUnit) onOpenAssignModal(activeUnit);
  };

  return (
              /* TRƯỜNG HỢP B: CÁC TẦNG CĂN HỘ (TẦNG 1 ĐẾN TẦNG 34/39) - HIỂN THỊ 21 CĂN HỘ CAD */
              <div className="flex flex-col h-full justify-between select-none">
                <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                  
                  {/* THANH TIÊU ĐỀ MẶT BẰNG TẦNG CĂN HỘ */}
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                      <span className="text-white font-bold text-sm tracking-wide">
                        {t('MẶT BẰNG TẦNG', 'FLOOR PLAN - LEVEL')} {selectedFloor}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-[#C5A880] font-bold">{selectedBlock}</span>
                      <span className="text-[10.5px] px-2 py-0.5 bg-[#162232] border border-[#23354C] text-[#C5A880] hidden sm:inline">
                        {t('21 Căn Hộ CAD', '21 CAD Units')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenFloorPlanExpanded()}
                        className="px-2.5 py-1 bg-[#141E2D] hover:bg-[#C5A880] text-[#C5A880] hover:text-black text-xs border border-[#23354C] flex items-center gap-1.5 transition-all shadow"
                        title={t('Mở rộng mặt bằng toàn màn hình', 'Expand floor plan full screen')}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('Phóng To Mặt Bằng', 'Enlarge Plan')}</span>
                      </button>
                    </div>
                  </div>

                {/* 4 THẺ THỐNG KÊ SÀN TẦNG HIỆN TẠI */}
                <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">{t('Tổng Căn', 'Total Units')}</div>
                    <div className="text-xs font-bold text-white mt-0.5">{floorUnits.length} {t('căn', 'units')}</div>
                  </div>
                  <div className="p-1 bg-[#161B22] border-b-2 border-emerald-500">
                    <div className="text-[9.5px] text-gray-400">{t('Đã Có Người Ở', 'Occupied')}</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">
                      {floorOccupiedCount} ({floorUnits.length > 0 ? Math.round((floorOccupiedCount / floorUnits.length) * 100) : 0}%)
                    </div>
                  </div>
                  <div className="p-1 bg-[#161B22] border-b-2 border-sky-500">
                    <div className="text-[9.5px] text-gray-400">{t('Nghiệm Thu', 'Inspection')}</div>
                    <div className="text-xs font-bold text-sky-400 mt-0.5">{floorMaintenanceCount}</div>
                  </div>
                  <div className="p-1 bg-[#161B22] border-b-2 border-amber-500">
                    <div className="text-[9.5px] text-gray-400">{t('Căn Trống', 'Vacant')}</div>
                    <div className="text-xs font-bold text-amber-300 mt-0.5">{floorVacantCount}</div>
                  </div>
                </div>

                {/* BẢN VẼ MẶT BẰNG SÀN 21 CĂN HỘ CAD TƯƠNG TÁC */}
                <div className="border border-[#1E293B] bg-[#05080E] p-1 overflow-hidden">
                  <CadFloorplanSvgModel
                    selectedFloor={selectedFloor}
                    selectedBlock={selectedBlock}
                    activeUnitCode={activeUnit?.code || selectedAptCode}
                    onSelectUnit={(u) => onSelectApartment(u)}
                    unitsOnFloor={floorUnits}
                    onOpenZoomModal={() => onOpenFloorPlanExpanded()}
                  />
                </div>

                {/* DANH MỤC 21 CĂN HỘ DẠNG CHIPS NHANH */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span>{t('DANH MỤC CĂN HỘ TẦNG', 'UNIT DIRECTORY LEVEL')} {selectedFloor}:</span>
                      {floorFilterStatus !== 'ALL' && (
                        <span className="text-amber-300 text-[10px]">
                          ({t('Lọc:', 'Filter:')} {floorFilterStatus === 'OCCUPIED' ? t('Có cư dân', 'Occupied') : floorFilterStatus === 'VACANT' ? t('Còn trống', 'Vacant') : t('Bảo trì', 'Maintenance')})
                        </span>
                      )}
                    </span>
                    <span className="text-[#C5A880] text-[10.5px]">{t('Bấm chọn căn', 'Select unit')}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {floorUnits.map(unit => {
                      const isSelected = activeUnit?.code === unit.code || selectedAptCode === unit.code;
                      const isOccupied = unit.status === 'OCCUPIED';
                      const isMaint = unit.status === 'MAINTENANCE';
                      const chShort = unit.code.includes('-') ? unit.code.split('-').pop() : unit.code;

                      const matchesStatus = floorFilterStatus === 'ALL' || unit.status === floorFilterStatus;
                      const matchesSearch = !unitSearchQuery.trim() || unit.code.toLowerCase().includes(unitSearchQuery.trim().toLowerCase());
                      const isMatched = matchesStatus && matchesSearch;

                      return (
                        <button
                          key={unit.code}
                          type="button"
                          onClick={() => handleSelectApartment(unit)}
                          className={`py-1 text-[10px] font-mono font-bold transition-all border text-center ${
                            isSelected
                              ? 'bg-[#C5A880] text-black border-white shadow-md ring-1 ring-[#C5A880]'
                              : !isMatched
                              ? 'opacity-25 bg-[#0C1118] text-gray-500 border-gray-800'
                              : isOccupied
                              ? 'bg-[#0B2319] text-emerald-400 border-emerald-800/60 hover:border-emerald-500'
                              : isMaint
                              ? 'bg-[#0D253A] text-sky-400 border-sky-800/60 hover:border-sky-500'
                              : 'bg-[#101722] text-amber-300 border-amber-900/50 hover:border-amber-600'
                          }`}
                          title={isEn ? `Unit ${unit.code}: ${isOccupied ? 'Occupied' : isMaint ? 'Inspection' : 'Vacant'}` : `Căn ${unit.code}: ${isOccupied ? 'Đã có người ở' : isMaint ? 'Bảo trì kỹ thuật' : 'Nhà trống'}`}
                        >
                          {chShort}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* THẺ TÓM TẮT & NÚT HÀNH ĐỘNG CỦA CĂN ĐANG CHỌN */}
                {activeUnit && (
                  <div className="p-2.5 bg-[#101622] border border-[#223348] mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          {t('CĂN', 'UNIT')} {activeUnit.code}
                        </span>
                        <span className="text-[10.5px] font-mono text-gray-400">
                          ({t('Tầng', 'Floor')} {activeUnit.floor})
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 uppercase border ${
                          activeUnit.status === 'OCCUPIED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : activeUnit.status === 'MAINTENANCE'
                            ? 'bg-blue-950 text-blue-300 border-blue-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                        }`}>
                          {activeUnit.status === 'OCCUPIED' ? t('Đã Có Người Ở', 'Occupied') : activeUnit.status === 'MAINTENANCE' ? t('Nghiệm Thu', 'Inspection') : t('Nhà Trống', 'Vacant')}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-[#C5A880] font-bold">
                        {activeUnit.typeLabel || '2PN'} • {activeUnit.area || 65}m²
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-300 flex items-center justify-between border-t border-[#1C283A] pt-1.5 font-mono">
                      <div>
                        <span className="text-gray-400">{t('Chủ hộ:', 'Owner:')} </span>
                        <strong className="text-white">
                          {activeUnit.status === 'OCCUPIED'
                            ? (activeUnit.owner?.name || t('Cư Dân Đã Nhận Nhà', 'Handed-over Resident'))
                            : t('Chưa Bàn Giao (Nhà Trống)', 'Not Handed Over (Vacant)')}
                        </strong>
                        {activeUnit.status === 'OCCUPIED' && (activeUnit.owner?.phone) && (
                          <span className="text-gray-400 ml-1 font-mono">
                            ({activeUnit.owner?.phone || '0364967082'})
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-[10.5px]">
                        {t('Hướng:', 'Direction:')} <span className="text-white font-bold">{activeUnit.direction || (isEn ? 'South-East' : 'Đông Nam')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="flex-1 py-1.5 bg-[#C5A880] hover:bg-[#d8bc94] text-black text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shadow"
                        title={activeUnit.status === 'OCCUPIED' ? t('Xem và cập nhật thông tin cư dân', 'View and update resident details') : t('Bàn giao căn hộ và cấp quyền cho cư dân', 'Handover unit and grant access')}
                      >
                        {activeUnit.status === 'OCCUPIED' ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{t('Thông Tin Cư Dân', 'Resident Details')}</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-3.5 h-3.5" />
                            <span>{t('Bàn Giao Căn Hộ', 'Handover Unit')}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenDetailModal(activeUnit)}
                        className="px-2.5 py-1.5 bg-[#172335] hover:bg-[#20324A] text-[#C5A880] text-xs font-mono border border-[#2B3E59] transition-all flex items-center gap-1"
                        title={t('Xem toàn bộ hồ sơ chi tiết và 3D nội thất căn hộ này', 'View full detailed profile and 3D interior')}
                      >
                        <Building className="w-3.5 h-3.5" />
                        <span>{t('Xem Chi Tiết ➔', 'View Details ➔')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(activeUnit)}
                        className="px-2.5 py-1.5 bg-[#172335] hover:bg-[#22354F] text-gray-200 text-xs font-mono border border-[#2B3E59] transition-all flex items-center gap-1"
                        title={t('Chỉnh sửa thông số căn hộ', 'Edit unit parameters')}
                      >
                        <span>{t('Sửa', 'Edit')}</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
);
}
