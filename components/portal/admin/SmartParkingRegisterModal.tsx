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

export default function SmartParkingRegisterModal({ ctx }: { ctx: SmartParkingContext }) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0E131B] border border-[#C5A880]/50 p-6 space-y-5 text-gray-200 rounded-none shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold">
                  {isEn ? 'PARKING PASS ISSUANCE & AUTO ALLOCATION' : 'CẤP THẺ XE & ĐIỀU PHỐI Ô ĐỖ THÔNG MINH'}
                </div>
                <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                  {regActionType === 'WAITLIST'
                    ? (isEn ? 'Enqueue to Parking Waitlist' : 'Đưa Vào Hàng Đợi Xét Duyệt (Waitlist)')
                    : (isEn ? 'Issue Parking Pass & Assign Slot' : 'Cấp Thẻ & Điều Phối Vị Trí Đỗ Xe')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Error & Success Alerts */}
            {regFormError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono">
                ⚠️ {regFormError}
              </div>
            )}

            {regSuccessMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono">
                ✓ {regSuccessMsg}
              </div>
            )}

            <form onSubmit={handleRegisterVehicle} className="space-y-4 text-xs">
              {/* Select Apartment */}
              <div>
                <label className="block text-gray-300 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                  {isEn ? 'Select Apartment Unit *' : 'Chọn Căn Hộ Cư Dân *'}
                </label>
                <select
                  value={regAptCode}
                  onChange={(e) => handleApartmentSelect(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#161B22] border border-[#2D3748] text-white focus:outline-none focus:border-[#C5A880] rounded-none font-mono text-xs font-bold"
                  required
                >
                  {apartments.map((apt) => (
                    <option key={apt.code} value={apt.code}>
                      {t('Căn', 'Unit')} {apt.code} - {t('Tầng', 'Floor')} {apt.floor} {apt.owner?.name ? `(${apt.owner.name})` : `(${t('Đang trống', 'Vacant')})`}
                    </option>
                  ))}
                </select>

                {/* Resident & Vehicle Status Indicator */}
                <div className="mt-1.5 font-mono text-[11px]">
                  {!hasResident ? (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      ⚠️ {isEn ? 'Unit is currently vacant — No registered resident.' : 'Căn hộ đang trống — Chưa có cư dân nhận bàn giao.'}
                    </span>
                  ) : detectedResidentVehicles.length === 0 ? (
                    <span className="text-gray-400 flex items-center gap-1.5">
                      ℹ️ {isEn ? 'Owner' : 'Chủ hộ'}: <strong className="text-gray-200">{activeApartmentUnit?.owner?.name}</strong> • {isEn ? 'No vehicles declared in resident profile.' : 'Chưa có phương tiện nào trong hồ sơ cư dân.'}
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      ✓ {isEn ? 'Owner' : 'Chủ hộ'}: <strong className="text-white">{activeApartmentUnit?.owner?.name}</strong> • {isEn ? `Identified ${detectedResidentVehicles.length} declared vehicle(s)` : `Đã nhận diện ${detectedResidentVehicles.length} phương tiện khai báo`}
                    </span>
                  )}
                </div>
              </div>

              {/* Declared Vehicles Quick Selector (when resident has multiple declared vehicles) */}
              {hasResident && detectedResidentVehicles.length > 1 && (
                <div>
                  <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                    {isEn ? 'Select Declared Vehicle' : 'Chọn Phương Tiện Khai Báo Của Cư Dân'}
                  </label>
                  <div className="space-y-1.5">
                    {detectedResidentVehicles.map((veh, idx) => (
                      <button
                        key={veh.plate}
                        type="button"
                        onClick={() => {
                          setSelectedVehicleIdx(idx);
                          setRegPlate(veh.plate);
                          setRegBrand(veh.brand);
                          setRegType(veh.type);
                          const wing = activeApartmentUnit?.wing || 'SOUTH';
                          setRegCustomSlot(computeOptimalSlot(veh.type, regTargetZone, wing));
                        }}
                        className={`w-full p-2 text-left border flex items-center justify-between font-mono text-xs transition-colors rounded-none ${selectedVehicleIdx === idx
                          ? 'border-[#C5A880] bg-[#C5A880]/15 text-white'
                          : 'border-[#222B35] bg-[#121820] text-gray-400 hover:text-white'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {veh.type === 'CAR' ? <Car className="w-3.5 h-3.5 text-[#C5A880]" /> : <Bike className="w-3.5 h-3.5 text-cyan-400" />}
                          <span className="font-bold text-white tracking-wider">{veh.plate}</span>
                          <span className="text-gray-400 font-sans text-[11px]">({veh.brand})</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {veh.cardNo ? `${t('Thẻ', 'Card')}: ${veh.cardNo} (${t('Ô', 'Slot')} ${veh.slot || 'N/A'})` : veh.source}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Classification */}
              <div>
                <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                  {isEn ? 'Vehicle Type' : 'Phân Loại Phương Tiện'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegType('CAR')}
                    className={`py-2 px-3 border text-left flex items-center gap-2 rounded-none transition-colors ${regType === 'CAR'
                      ? 'border-[#C5A880] bg-[#C5A880]/15 text-white shadow-[0_0_10px_rgba(197,168,128,0.15)]'
                      : 'border-[#2D3748] bg-[#161B22] text-gray-500'
                      }`}
                  >
                    <Car className="w-4 h-4 text-[#C5A880]" />
                    <div>
                      <div className="font-bold">{isEn ? 'Car' : 'Ô Tô'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">1.200.000 đ/{t('tháng', 'mo')}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegType('MOTORBIKE')}
                    className={`py-2 px-3 border text-left flex items-center gap-2 rounded-none transition-colors ${regType === 'MOTORBIKE'
                      ? 'border-cyan-400 bg-cyan-950/25 text-white shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'border-[#2D3748] bg-[#161B22] text-gray-500'
                      }`}
                  >
                    <Bike className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold">{isEn ? 'Motorbike (B1)' : 'Xe Máy (Hầm B1)'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">120.000 đ/{t('tháng', 'mo')}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Zone Selection (For Car) */}
              {regType === 'CAR' && (
                <div>
                  <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                    {isEn ? 'Parking Zone' : 'Phân Khu Điều Phối Ô Đỗ'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegTargetZone('FIXED_B2')}
                      className={`p-2 border text-left rounded-none font-mono text-[11px] transition-colors ${regTargetZone === 'FIXED_B2'
                        ? 'border-[#C5A880] bg-[#C5A880]/15 text-white'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                        }`}
                    >
                      <div className="font-bold">{t('Hầm B2 Cố Định', 'Fixed B2')}</div>
                      <div className="text-[9px] text-gray-400">{t('Zone A VIP', 'Zone A VIP')}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegTargetZone('FLOATING_B2')}
                      className={`p-2 border text-left rounded-none font-mono text-[11px] transition-colors ${regTargetZone === 'FLOATING_B2'
                        ? 'border-[#C5A880] bg-[#C5A880]/15 text-white'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                        }`}
                    >
                      <div className="font-bold">{t('Hầm B2 Tự Do', 'Floating B2')}</div>
                      <div className="text-[9px] text-gray-400">{t('Zone B Luân Phiên', 'Zone B Rotating')}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegTargetZone('SOLARI_HUB')}
                      className={`p-2 border text-left rounded-none font-mono text-[11px] transition-colors ${regTargetZone === 'SOLARI_HUB'
                        ? 'border-amber-400 bg-amber-950/25 text-white'
                        : 'border-[#2D3748] bg-[#161B22] text-gray-400 hover:text-white'
                        }`}
                    >
                      <div className="font-bold">{t('Solari Hub', 'Solari Hub')}</div>
                      <div className="text-[9px] text-amber-400">{t('Nhà Xe Liên Tòa', 'Hub Garage')}</div>
                    </button>
                  </div>
                </div>
              )}

              {/* License Plate & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                    {isEn ? 'License Plate *' : 'Biển Số Xe *'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEn ? 'e.g. 51K-889.99' : 'VD: 51K-889.99'}
                    value={regPlate}
                    onChange={(e) => setRegPlate(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-mono font-bold focus:outline-none focus:border-[#C5A880] rounded-none tracking-wider text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                    {isEn ? 'Brand / Model' : 'Hãng Xe / Dòng Xe'}
                  </label>
                  <input
                    type="text"
                    placeholder={isEn ? 'e.g. Mercedes-Benz, Honda...' : 'VD: Mercedes-Benz, Honda...'}
                    value={regBrand}
                    onChange={(e) => setRegBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161B22] border border-[#2D3748] text-white font-mono focus:outline-none focus:border-[#C5A880] rounded-none text-xs"
                  />
                </div>
              </div>

              {/* Allocated Slot */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-gray-400 uppercase tracking-wider font-semibold text-xs">
                    {isEn ? 'Allocated Parking Slot' : 'Vị Trí Ô Đỗ Được Phân Bổ Tối Ưu'}
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    {isEn ? 'Auto-routed near elevator' : 'Tự động chọn ô gần thang máy'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={isEn ? 'Auto-allocated when vehicle is identified...' : 'Tự động tính ô khi có thông tin xe...'}
                  value={regCustomSlot}
                  onChange={(e) => setRegCustomSlot(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#C5A880]/60 text-[#C5A880] font-mono font-bold focus:outline-none focus:border-[#C5A880] rounded-none text-xs"
                />
              </div>

              {/* Action Mode Toggle */}
              <div>
                <label className="block text-gray-400 uppercase tracking-wider font-semibold mb-1.5 text-xs">
                  {isEn ? 'Allocation Method' : 'Phương Thức Phân Bổ'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegActionType('DIRECT_ISSUE')}
                    className={`py-2 px-3 border text-left rounded-none font-mono text-xs transition-colors ${regActionType === 'DIRECT_ISSUE'
                      ? 'border-emerald-500 bg-emerald-950/25 text-white'
                      : 'border-[#2D3748] bg-[#161B22] text-gray-400'
                      }`}
                  >
                    <div className="font-bold">{isEn ? 'Direct Pass Issue' : 'Cấp Slot Ngay'}</div>
                    <div className="text-[10px] text-emerald-400">{isEn ? 'Assign slot & issue RFID' : 'Gán ô & phát thẻ RFID'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegActionType('WAITLIST')}
                    className={`py-2 px-3 border text-left rounded-none font-mono text-xs transition-colors ${regActionType === 'WAITLIST'
                      ? 'border-amber-400 bg-amber-950/25 text-white'
                      : 'border-[#2D3748] bg-[#161B22] text-gray-400'
                      }`}
                  >
                    <div className="font-bold">{isEn ? 'Waitlist Queue' : 'Hàng Đợi Waitlist'}</div>
                    <div className="text-[10px] text-amber-400">{isEn ? 'Queue for review' : 'Xếp hàng chờ duyệt'}</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222B35]">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-[#161B22] hover:bg-gray-800 text-gray-300 border border-gray-700 transition-colors rounded-none text-xs"
                >
                  {isEn ? 'Cancel' : 'Hủy Bỏ'}
                </button>
                <button
                  type="submit"
                  disabled={!hasResident}
                  className={`px-5 py-2 font-semibold uppercase tracking-wider transition-colors rounded-none flex items-center gap-1.5 text-xs ${hasResident
                    ? 'bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14]'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  {regActionType === 'WAITLIST'
                    ? (isEn ? 'Confirm Enqueue' : 'Xác Nhận Xếp Hàng Đợi')
                    : (isEn ? 'Confirm Pass Issue' : 'Xác Nhận Cấp Thẻ')}
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
