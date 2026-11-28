'use client';

import React from 'react';
import {
  Car,
  Bike,
  Search,
  Plus,
  Trash2,
  LayoutGrid,
  CreditCard,
  Building,
  UserCheck,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Hash,
  Clock,
  Warehouse,
  Check,
  Share2,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import type { SmartParkingContext } from './useSmartParking';

export default function SmartParkingMatrixTabView({ ctx }: { ctx: SmartParkingContext }) {
  const {
    t,
    isEn,
    apartments,
    setApartments,
    parkingSlots,
    setParkingSlots,
    isLoadingParking,
    setIsLoadingParking,
    parkingError,
    setParkingError,
    activeMainTab,
    setActiveMainTab,
    searchPlate,
    setSearchPlate,
    typeFilter,
    setTypeFilter,
    selectedFloorMap,
    setSelectedFloorMap,
    selectedSlotCode,
    setSelectedSlotCode,
    revokeVehicleTarget,
    setRevokeVehicleTarget,
    waitlist,
    setWaitlist,
    isRegisterModalOpen,
    setIsRegisterModalOpen,
    regAptCode,
    setRegAptCode,
    regType,
    setRegType,
    regPlate,
    setRegPlate,
    regBrand,
    setRegBrand,
    regTargetZone,
    setRegTargetZone,
    regCustomSlot,
    setRegCustomSlot,
    regActionType,
    setRegActionType,
    regFormError,
    setRegFormError,
    regSuccessMsg,
    setRegSuccessMsg,
    selectedVehicleIdx,
    setSelectedVehicleIdx,
    parkingResource,
    loadParkingData,
    registeredVehicles,
    B2_FIXED_CAR_SLOTS,
    B2_FLOATING_CAR_SLOTS,
    TOTAL_B2_CAR_SLOTS,
    SOLARI_HUB_CAR_SLOTS,
    TOTAL_EXPANDED_CAR_CAPACITY,
    MAX_MOTO_SLOTS,
    CAR_MONTHLY_FEE,
    MOTO_MONTHLY_FEE,
    registeredCars,
    registeredMotos,
    carOccupancyPct,
    motoOccupancyPct,
    totalMonthlyRevenue,
    b2FixedSlots,
    b2FloatingSlots,
    b1Slots,
    solariHubSlots,
    currentSlotDetail,
    saveWaitlistState,
    activeApartmentUnit,
    hasResident,
    detectedResidentVehicles,
    computeOptimalSlot,
    handleApartmentSelect,
    handleRegisterVehicle,
    handleApproveWaitlistEntry,
    handleRemoveWaitlistEntry,
    handleRevokeVehicle,
    confirmRevokeVehicle,
    filteredVehicles,
  } = ctx;

  return (
        <div className="bg-[#121820] border border-[#222B35] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {t('HỆ THỐNG PHÂN KHU HẦM B1/B2 & NHÀ XE THÔNG MINH LIÊN TÒA', 'BASEMENT B1/B2 & SMART MULTI-TOWER GARAGE ZONING')}
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                {t('Chọn Phân Khu Để Giám Sát Không Gian Ô Đỗ', 'Select Zone to Monitor Parking Space')}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedFloorMap('B2_FIXED')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${selectedFloorMap === 'B2_FIXED'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                  }`}
              >
                <Car className="w-3.5 h-3.5" />
                {t('B2: Ô Cố Định VIP', 'B2: Fixed VIP')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFloorMap('B2_FLOATING')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${selectedFloorMap === 'B2_FLOATING'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                  }`}
              >
                <Car className="w-3.5 h-3.5" />
                {t('B2: Đỗ Tự Do', 'B2: Floating')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFloorMap('SOLARI_HUB')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${selectedFloorMap === 'SOLARI_HUB'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                  }`}
              >
                <Warehouse className="w-3.5 h-3.5" />
                {t('Nhà Xe Solari Hub', 'Solari Hub Garage')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFloorMap('B1_MOTO')}
                className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 ${selectedFloorMap === 'B1_MOTO'
                  ? 'bg-[#C5A880] text-black font-bold'
                  : 'bg-[#161B22] text-gray-400 hover:text-white border border-[#2D3748]'
                  }`}
              >
                <Bike className="w-3.5 h-3.5" />
                {t('Hầm B1: Xe Máy', 'Basement B1: Motorbikes')}
              </button>
            </div>
          </div>

          {/* Grid Layout & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
            {/* Slot Matrix (8 cols on lg) */}
            <div className="lg:col-span-8 bg-[#0E131B] border border-[#222B35] p-4">
              <div className="text-[11px] font-mono text-gray-400 mb-3 flex justify-between items-center border-b border-[#222B35] pb-2">
                <span className="text-gray-300 font-semibold uppercase">
                  {selectedFloorMap === 'B2_FIXED'
                    ? t('HẦM B2 ZONE A: Ô CỐ ĐỊNH ĐỊNH DANH VIP', 'BASEMENT B2 ZONE A: DEDICATED VIP FIXED SLOTS')
                    : selectedFloorMap === 'B2_FLOATING'
                      ? t('HẦM B2 ZONE B: KHU ĐỖ TỰ DO CHIA SẺ', 'BASEMENT B2 ZONE B: SHARED FLOATING SLOTS')
                      : selectedFloorMap === 'SOLARI_HUB'
                        ? t('NHÀ XE CAO TẦNG BEVERLY SOLARI HUB (ĐIỀU PHỐI MỞ RỘNG)', 'BEVERLY SOLARI MULTI-STOREY GARAGE (EXPANDED DISPATCH)')
                        : t('HẦM B1: XE MÁY CƯ DÂN TOÀN TÒA BS-07', 'BASEMENT B1: RESIDENT MOTORBIKES FOR BS-07')}
                </span>
                <span className="text-[#C5A880]">{t('24 - 32 Ô ĐẠI DIỆN', '24 - 32 SAMPLE SLOTS')}</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {(
                  selectedFloorMap === 'B2_FIXED'
                    ? b2FixedSlots
                    : selectedFloorMap === 'B2_FLOATING'
                      ? b2FloatingSlots
                      : selectedFloorMap === 'SOLARI_HUB'
                        ? solariHubSlots
                        : b1Slots
                ).map((slot) => {
                  const isSelected = selectedSlotCode === slot.code;
                  const isOccupied = !!slot.assigned;

                  return (
                    <button
                      key={slot.code}
                      type="button"
                      onClick={() => setSelectedSlotCode(slot.code)}
                      className={`p-2 border text-center transition-all flex flex-col justify-between h-20 rounded-none relative group ${isSelected
                        ? 'bg-[#C5A880]/20 border-[#C5A880] shadow-[0_0_12px_rgba(197,168,128,0.25)]'
                        : isOccupied
                          ? 'bg-[#1C2533] border-[#C5A880]/60 hover:border-[#C5A880]'
                          : 'bg-[#121820] border-[#2D3748] hover:border-gray-500 opacity-70 hover:opacity-100'
                        }`}
                    >
                      <div className="flex items-center justify-between w-full text-[10px] font-mono">
                        <span className={`font-bold ${isSelected ? 'text-[#C5A880]' : isOccupied ? 'text-white' : 'text-gray-400'}`}>
                          {slot.code}
                        </span>
                        {isOccupied && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                      </div>

                      <div className="my-auto">
                        {isOccupied ? (
                          <div>
                            <div className="text-[10px] font-mono font-bold text-[#C5A880] truncate">
                              {slot.assigned?.plate}
                            </div>
                            <div className="text-[9px] text-gray-400 font-mono truncate">
                              {t('Căn', 'Unit')} {slot.assigned?.aptCode}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                            {t('TRỐNG', 'VACANT')}
                          </div>
                        )}
                      </div>

                      <div className="text-[9px] text-gray-500 font-mono truncate">
                        {slot.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot Inspector (4 cols on lg) */}
            <div className="lg:col-span-4 bg-[#0E131B] border border-[#222B35] p-4 flex flex-col justify-between">
              {currentSlotDetail ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                    <div className="text-xs uppercase tracking-wider font-semibold text-[#C5A880] flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      {t('Chi Tiết Ô Đỗ Đang Chọn', 'Selected Slot Details')}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSlotCode(null)}
                      className="text-gray-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3 bg-[#121820] border border-[#222B35] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{t('Mã Vị Trí:', 'Slot Code:')}</span>
                      <span className="font-mono font-bold text-white text-sm bg-[#161B22] px-2 py-0.5 border border-gray-700">
                        {currentSlotDetail.code}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{t('Phân Khu:', 'Zone:')}</span>
                      <span className="font-mono text-gray-300 text-xs">
                        {currentSlotDetail.zone}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{t('Trạng Thái:', 'Status:')}</span>
                      <span className={`font-mono text-xs font-semibold px-2 py-0.5 border ${currentSlotDetail.assigned
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50'
                        : 'bg-gray-900 text-gray-400 border-gray-700'
                        }`}>
                        {currentSlotDetail.assigned ? t('ĐÃ ĐƯỢC CẤP', 'ASSIGNED') : t('CÒN TRỐNG', 'VACANT')}
                      </span>
                    </div>
                  </div>

                  {currentSlotDetail.assigned ? (
                    <div className="p-3.5 bg-[#161B22] border border-[#222B35] space-y-2.5 text-xs">
                      <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider border-b border-[#222B35] pb-1.5">
                        {t('Thông Tin Phương Tiện Cư Dân', 'Resident Vehicle Info')}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t('Biển số:', 'Plate:')}</span>
                        <span className="font-mono font-bold text-[#C5A880] text-sm">
                          {currentSlotDetail.assigned.plate}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t('Chủ sở hữu:', 'Owner:')}</span>
                        <span className="text-white font-semibold">
                          {currentSlotDetail.assigned.ownerName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t('Căn hộ:', 'Apartment:')}</span>
                        <span className="text-gray-200 font-mono">
                          {t('Căn', 'Unit')} {currentSlotDetail.assigned.aptCode} ({t('Tầng', 'Floor')} {currentSlotDetail.assigned.floor})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t('Mã thẻ RFID:', 'RFID Card:')}</span>
                        <span className="text-gray-300 font-mono">
                          {currentSlotDetail.assigned.cardNo}
                        </span>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleRevokeVehicle(
                            currentSlotDetail.assigned!.aptCode,
                            currentSlotDetail.assigned!.id,
                            currentSlotDetail.assigned!.plate
                          )}
                          className="w-full py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-mono font-semibold transition-colors rounded-none flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t('Thu Hồi / Giải Phóng Ô Này', 'Revoke / Release Slot')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#121820] border border-[#222B35] text-center space-y-3">
                      <div className="text-xs text-gray-400">
                        {t(
                          'Ô đỗ này hiện đang trống. BQL có thể cấp trực tiếp hoặc duyệt từ hồ sơ khai báo cư dân.',
                          'This slot is currently vacant. Management can issue directly or approve from resident declarations.'
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRegCustomSlot(currentSlotDetail.code);
                          setRegType(currentSlotDetail.type);
                          setRegActionType('DIRECT_ISSUE');
                          setIsRegisterModalOpen(true);
                        }}
                        className="w-full py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-black text-xs font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('Cấp Xe Vào Ô', 'Assign Vehicle to Slot')} {currentSlotDetail.code}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2 text-gray-500">
                  <LayoutGrid className="w-8 h-8 text-gray-600" />
                  <div className="text-xs font-mono">
                    {t(
                      'Nhấp vào một ô trên ma trận bên trái để xem chi tiết.',
                      'Click any slot on the left matrix to inspect details.'
                    )}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-gray-500 font-mono text-center pt-3 border-t border-[#222B35] mt-4">
                {t(
                  'Dữ liệu phân bổ liên kết thời gian thực với CSDL căn hộ',
                  'Real-time allocation data synchronized with apartment database'
                )}
              </div>
            </div>
          </div>
        </div>
  );
}
