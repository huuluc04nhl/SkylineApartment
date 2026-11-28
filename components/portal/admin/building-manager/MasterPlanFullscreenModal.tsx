'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Map, ZoomIn, ZoomOut, Eye, X } from 'lucide-react';
import TropicalCampusSvgModel from '../models/TropicalCampusSvgModel';
import SurroundingRadarSvgModel from '../models/SurroundingRadarSvgModel';
import MacroCitySvgModel from '../models/MacroCitySvgModel';
import { THE_TROPICAL_AMENITIES, SURROUNDING_AMENITIES } from './buildingConstants';
import { useLanguage } from '@/lib/languageContext';

export interface MasterPlanFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterPlanTab: 'TROPICAL' | 'SURROUNDINGS' | 'MACRO';
  setMasterPlanTab: (tab: 'TROPICAL' | 'SURROUNDINGS' | 'MACRO') => void;
  modalZoomScale: number;
  setModalZoomScale: React.Dispatch<React.SetStateAction<number>>;
  modalShowPins: boolean;
  setModalShowPins: React.Dispatch<React.SetStateAction<boolean>>;
  selectedBlock: string;
  onSwitchBlock: (block: string) => void;
  selectedAmenityId: string | null;
  onSelectAmenity: (id: string | null) => void;
  hoveredAmenityId: string | null;
  onHoverAmenity: (id: string | null) => void;
}

export default function MasterPlanFullscreenModal({
  isOpen,
  onClose,
  masterPlanTab,
  setMasterPlanTab,
  modalZoomScale,
  setModalZoomScale,
  modalShowPins,
  setModalShowPins,
  selectedBlock,
  onSwitchBlock,
  selectedAmenityId,
  onSelectAmenity,
  hoveredAmenityId,
  onHoverAmenity,
}: MasterPlanFullscreenModalProps) {
  const { t, isEn } = useLanguage();
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-[#04060A] flex flex-col select-none animate-fadeIn">
      {/* Top Controller Bar - DESIGN.md 0px rounded-none Luxury */}
      <div className="h-14 px-4 bg-[#090D15] border-b border-[#1E293B] flex items-center justify-between gap-4 shrink-0 shadow-lg">
        {/* Left: Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-none bg-[#141E2D] border border-[#23354C] flex items-center justify-center text-[#C5A880] shrink-0">
            <Map className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-sm tracking-wide truncate">
              {masterPlanTab === 'TROPICAL' && t('The Tropical • Mặt Bằng Phân Khu', 'The Tropical • Subdivision Master Plan')}
              {masterPlanTab === 'SURROUNDINGS' && t('Thành Phố Biển Hồ • 8 Đại Tiện Ích', 'Coastal Lake City • 8 Landmark Amenities')}
              {masterPlanTab === 'MACRO' && t('Vinhomes Grand Park • Quy Hoạch 271 ha', 'Vinhomes Grand Park • 271 ha Master Plan')}
            </h3>
            <div className="text-[11px] text-gray-400 font-mono truncate">
              {masterPlanTab === 'TROPICAL' && t('Bản vẽ kiến trúc 4 khối tháp & 23 tiện ích nội khu', 'Architectural blueprint of 4 towers & 23 internal amenities')}
              {masterPlanTab === 'SURROUNDINGS' && t('Bán kính 1km kết nối biển hồ & các đại tiện ích', '1km radius connecting salt lake & landmark amenities')}
              {masterPlanTab === 'MACRO' && t('Tổng thể 271 ha • Công viên 36 ha • Vincom Mega Mall', '271 ha master plan • 36 ha park • Vincom Mega Mall')}
            </div>
          </div>
        </div>

        {/* Center: Segmented Control - rounded-none */}
        <div className="hidden sm:flex items-center bg-[#101723] p-1 rounded-none border border-[#1E2B3C] text-xs font-mono">
          {(['TROPICAL', 'SURROUNDINGS', 'MACRO'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setMasterPlanTab(tab);
                setModalZoomScale(1);
              }}
              className={`px-3 py-1 rounded-none transition-all font-medium ${
                masterPlanTab === tab
                  ? 'bg-[#C5A880] text-black font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'TROPICAL' ? 'The Tropical' : tab === 'SURROUNDINGS' ? t('Tiện Ích Biển Hồ', 'Lake Amenities') : t('Đại Đô Thị', 'Metropolis')}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setModalShowPins(!modalShowPins)}
            className={`px-2.5 py-1.5 rounded-none border text-xs font-mono transition-all flex items-center gap-1.5 ${
              modalShowPins
                ? 'bg-[#152538] border-[#3B82F6] text-cyan-300'
                : 'bg-[#101722] border-[#222E3E] text-gray-400 hover:text-white'
            }`}
            title={modalShowPins ? t('Ẩn ghim để xem bản vẽ gốc sạch', 'Hide pins for clean blueprint') : t('Hiện ghim vị trí', 'Show location pins')}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{modalShowPins ? t('Ghim: BẬT', 'Pins: ON') : t('Bản Vẽ Sạch', 'Clean View')}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#101722] border border-[#222E3E] rounded-none p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setModalZoomScale(prev => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
              className="p-1 hover:bg-[#1A2637] rounded-none text-gray-300 hover:text-white transition-colors"
              title={t('Thu nhỏ', 'Zoom out')}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setModalZoomScale(1)}
              className="px-2 py-0.5 text-[#C5A880] font-bold text-[11px] min-w-[46px] text-center hover:bg-[#1A2637] rounded-none transition-colors"
              title={t('Đặt lại 100%', 'Reset 100%')}
            >
              {Math.round(modalZoomScale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setModalZoomScale(prev => Math.min(3.0, Number((prev + 0.15).toFixed(2))))}
              className="p-1 hover:bg-[#1A2637] rounded-none text-gray-300 hover:text-white transition-colors"
              title={t('Phóng to', 'Zoom in')}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Close button */}
          <button aria-label="Đóng"
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-none text-gray-400 hover:text-white transition-colors ml-1"
            title={t('Đóng (ESC)', 'Close (ESC)')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Workspace */}
      <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-2 sm:p-4 bg-[#030508]">
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${modalZoomScale})`,
            transformOrigin: 'center center'
          }}
        >
          {masterPlanTab === 'TROPICAL' && (
            <TropicalCampusSvgModel
              amenities={THE_TROPICAL_AMENITIES}
              selectedBlock={selectedBlock}
              onSelectBlock={onSwitchBlock}
              selectedAmenityId={selectedAmenityId}
              onSelectAmenity={onSelectAmenity}
              hoveredAmenityId={hoveredAmenityId}
              onHoverAmenity={onHoverAmenity}
              hideHeader={true}
              hideFooter={true}
              showHotspotsOverride={modalShowPins}
            />
          )}
          {masterPlanTab === 'SURROUNDINGS' && (
            <SurroundingRadarSvgModel
              amenities={SURROUNDING_AMENITIES}
              selectedBlock={selectedBlock}
              selectedAmenityId={selectedAmenityId}
              onSelectAmenity={onSelectAmenity}
              hoveredAmenityId={hoveredAmenityId}
              onHoverAmenity={onHoverAmenity}
              hideHeader={true}
              showPinsOverride={modalShowPins}
            />
          )}
          {masterPlanTab === 'MACRO' && (
            <MacroCitySvgModel
              selectedBlock={selectedBlock}
              selectedAmenityId={selectedAmenityId}
              onSelectAmenity={onSelectAmenity}
              onSelectTropical={() => {
                setMasterPlanTab('TROPICAL');
              }}
              hideHeader={true}
              showPinsOverride={modalShowPins}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

