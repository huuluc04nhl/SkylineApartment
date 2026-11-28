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
import ConfirmDeleteModal from '@/components/portal/shared/ConfirmDeleteModal';
import { ResourceSkeleton, ResourceError, ResourceEmpty } from '@/components/ui/ResourceState';
import { useSmartParking, type ParkingWaitlistEntry } from './useSmartParking';
import SmartParkingMatrixTabView from './SmartParkingMatrixTabView';
import SmartParkingRegistryTabView from './SmartParkingRegistryTabView';
import SmartParkingWaitlistTabView from './SmartParkingWaitlistTabView';
import SmartParkingRegisterModal from './SmartParkingRegisterModal';

export type { ParkingWaitlistEntry };

export default function SmartParking() {
  const ctx = useSmartParking();
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
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-[#C5A880]" />
            {isEn ? 'MULTI-HUB PARKING & QUOTA BALANCING • THE BEVERLY SOLARI' : 'HỆ THỐNG ĐIỀU PHỐI ĐỖ XE ĐA TẦNG HẦM & LIÊN KHU • TÒA NHÀ THE TROPICAL'}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1">
            {isEn ? 'Parking Infrastructure & Resident Quota Management' : 'Quản Lý Bãi Đỗ Xe & Điều Phối Hạn Mức Tòa Nhà'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const defaultUnit = apartments.find(a => a.code === regAptCode) ||
                apartments.find(a => a.vehicles && a.vehicles.length > 0) ||
                apartments[0];
              if (defaultUnit) {
                handleApartmentSelect(defaultUnit.code);
              }
              setRegActionType('DIRECT_ISSUE');
              setIsRegisterModalOpen(true);
            }}
            className="px-4 py-2 bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
          >
            <Plus className="w-3.5 h-3.5" />
            {isEn ? 'Issue Pass / Register' : 'Cấp Thẻ / Đăng Ký Ô Đỗ'}
          </button>
        </div>
      </div>

      {/* Loading / Error / Empty states for /api/parking */}
      {isLoadingParking && <ResourceSkeleton label={isEn ? 'Loading parking slots...' : 'Đang tải dữ liệu bãi đỗ xe...'} />}
      {!isLoadingParking && parkingError && <ResourceError message={parkingError} onRetry={loadParkingData} />}
      {!isLoadingParking && !parkingError && registeredVehicles.length === 0 && (
        <ResourceEmpty message={isEn ? 'No vehicles or parking slots assigned yet.' : 'Chưa có phương tiện hoặc vị trí đỗ xe nào được gán trong hệ thống.'} />
      )}

      {/* 2. Top Multi-Hub KPI Cards (Pixel-Perfect Alignment across all 4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Hầm B2 Ô Tô Nội Khu */}
        <div className="p-4 bg-[#121820] border border-[#222B35] h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300 truncate">
              <Car className="w-4 h-4 text-[#C5A880] shrink-0" />
              <span className="truncate">{t('Hầm B2 Ô Tô (Nội Khu)', 'Basement B2 Car (Internal)')}</span>
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400 shrink-0 whitespace-nowrap px-1.5 py-0.5 bg-[#161B22] border border-[#2D3748]">
              {carOccupancyPct}%
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-xl font-bold text-white">
              {registeredCars} <span className="text-xs text-gray-500 font-normal">/ {TOTAL_B2_CAR_SLOTS} {t('chỗ', 'slots')}</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400 shrink-0">
              {t('Trống:', 'Available:')} <strong className="text-white">{Math.max(0, TOTAL_B2_CAR_SLOTS - registeredCars)}</strong>
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${carOccupancyPct >= 90 ? 'bg-rose-500' : carOccupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              style={{ width: `${Math.max(registeredCars > 0 ? 5 : 0, carOccupancyPct)}%` }}
            />
          </div>

          <div className="text-[10px] text-gray-400 font-mono flex justify-between items-center gap-2 border-t border-[#1C2533] pt-2">
            <span className="truncate">{t('60 VIP Cố Định', '60 Fixed VIP')}</span>
            <span className="truncate shrink-0 text-right">{t('90 Đỗ Tự Do', '90 Floating Slots')}</span>
          </div>
        </div>

        {/* KPI 2: Nhà Xe Thông Minh Beverly Solari Hub */}
        <div className="p-4 bg-[#121820] border border-[#222B35] h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300 truncate">
              <Warehouse className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{t('Nhà Xe Solari Hub', 'Solari Hub Garage')}</span>
            </span>
            <span className="font-mono text-xs font-bold text-amber-300 shrink-0 whitespace-nowrap px-1.5 py-0.5 bg-amber-950/40 border border-amber-500/40">
              {t('MỞ RỘNG', 'EXPANDED')}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-xl font-bold text-white">
              {SOLARI_HUB_CAR_SLOTS} <span className="text-xs text-gray-500 font-normal">{t('chỗ bổ sung', 'extra slots')}</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 shrink-0">
              {t('Toàn khu:', 'Whole area:')} <strong className="text-white">{TOTAL_EXPANDED_CAR_CAPACITY} {t('ô', 'slots')}</strong>
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: '15%' }}
            />
          </div>

          <div className="text-[10px] text-gray-400 font-mono flex justify-between items-center gap-2 border-t border-[#1C2533] pt-2">
            <span className="truncate">{t('Nhà xe cao tầng liên tòa', 'Multi-tower parking structure')}</span>
            <span className="truncate shrink-0 text-emerald-400 text-right">{t('Sẵn sàng điều phối', 'Ready for dispatch')}</span>
          </div>
        </div>

        {/* KPI 3: Hầm B1 Xe Máy */}
        <div className="p-4 bg-[#121820] border border-[#222B35] h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300 truncate">
              <Bike className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">{t('Xe Máy (Hầm B1)', 'Motorbikes (Basement B1)')}</span>
            </span>
            <span className="font-mono text-xs font-bold text-cyan-400 shrink-0 whitespace-nowrap px-1.5 py-0.5 bg-[#161B22] border border-[#2D3748]">
              {motoOccupancyPct}%
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-xl font-bold text-white">
              {registeredMotos} <span className="text-xs text-gray-500 font-normal">/ {MAX_MOTO_SLOTS} {t('xe', 'bikes')}</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400 shrink-0">
              {t('Còn nhận:', 'Remaining:')} <strong className="text-white">{MAX_MOTO_SLOTS - registeredMotos}</strong>
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${motoOccupancyPct >= 90 ? 'bg-rose-500' : 'bg-cyan-500'
                }`}
              style={{ width: `${Math.max(registeredMotos > 0 ? 4 : 0, motoOccupancyPct)}%` }}
            />
          </div>

          <div className="text-[10px] text-gray-400 font-mono flex justify-between items-center gap-2 border-t border-[#1C2533] pt-2">
            <span className="truncate">{t('120.000 đ/tháng/xe', '120,000 VND/mo/bike')}</span>
            <span className="truncate shrink-0 text-right">{t('Định mức: 1.2 xe/căn', 'Quota: 1.2 bikes/unit')}</span>
          </div>
        </div>

        {/* KPI 4: Hàng Đợi Danh Sách Chờ */}
        <div className="p-4 bg-[#121820] border border-[#222B35] h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-gray-300 truncate">
              <Clock className="w-4 h-4 text-[#C5A880] shrink-0" />
              <span className="truncate">{t('Hàng Đợi Xét Duyệt', 'Review Waitlist')}</span>
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400 shrink-0 whitespace-nowrap px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-500/40">
              {waitlist.length} {t('HỒ SƠ', 'PROFILES')}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-xl font-bold text-white">
              {totalMonthlyRevenue.toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-xs text-gray-500 font-normal">đ</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400 shrink-0">
              {t('Thu tháng này', 'Revenue this month')}
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#0A0E14] border border-[#222B35] overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>

          <div className="text-[10px] text-gray-400 font-mono flex justify-between items-center gap-2 border-t border-[#1C2533] pt-2">
            <span className="truncate">{t('AI Tự Động Nâng Hạng', 'AI Auto Priority Elevation')}</span>
            <button
              type="button"
              onClick={() => setActiveMainTab('WAITLIST')}
              className="truncate shrink-0 text-[#C5A880] hover:underline text-right"
            >
              {t('Xem hàng đợi →', 'View waitlist →')}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Tabs (3 Clean Essential Tabs: Matrix, Registry, Waitlist) */}
      <div className="border-b border-[#222B35] flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveMainTab('MATRIX')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-2 border-b-2 transition-all rounded-none whitespace-nowrap ${activeMainTab === 'MATRIX'
            ? 'border-[#C5A880] text-white bg-[#121820]'
            : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#C5A880]" />
          {t('Sơ Đồ Phân Bổ Không Gian Ô Đỗ', 'Parking Slot Matrix Map')}
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('REGISTRY')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-2 border-b-2 transition-all rounded-none whitespace-nowrap ${activeMainTab === 'REGISTRY'
            ? 'border-[#C5A880] text-white bg-[#121820]'
            : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          <Car className="w-3.5 h-3.5 text-[#C5A880]" />
          {t('Danh Sách Xe Đã Cấp Thẻ', 'Registered Vehicle Pass List')} ({filteredVehicles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('WAITLIST')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-2 border-b-2 transition-all rounded-none whitespace-nowrap ${activeMainTab === 'WAITLIST'
            ? 'border-[#C5A880] text-white bg-[#121820]'
            : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          {t('Hàng Đợi Waitlist', 'Waitlist Queue')} ({waitlist.length})
        </button>
      </div>


      {/* 4. Tab 1: Interactive Spatial Slot Matrix */}
      {activeMainTab === 'MATRIX' && <SmartParkingMatrixTabView ctx={ctx} />}

      {/* 5. Tab 2: Active Vehicle Registry Table */}
      {activeMainTab === 'REGISTRY' && <SmartParkingRegistryTabView ctx={ctx} />}

      {/* 6. Tab 3: Waitlist & Quota Overflow Queue */}
      {activeMainTab === 'WAITLIST' && <SmartParkingWaitlistTabView ctx={ctx} />}

      {/* 7. Modal: Cấp Thẻ & Điều Phối Ô Đỗ Xe */}
      {isRegisterModalOpen && <SmartParkingRegisterModal ctx={ctx} />}

      <ConfirmDeleteModal
        isOpen={!!revokeVehicleTarget}
        onClose={() => setRevokeVehicleTarget(null)}
        onConfirm={confirmRevokeVehicle}
        title={isEn ? 'Revoke Vehicle & Parking Pass' : 'Thu Hồi Thẻ Xe & Slot Đỗ Xe'}
        message={isEn
          ? `Confirm revoking vehicle and parking permit for unit ${revokeVehicleTarget?.aptCode}? Automatic barrier access will be disabled.`
          : `Xác nhận thu hồi và xóa thẻ đỗ xe của căn hộ ${revokeVehicleTarget?.aptCode}? Thẻ RFID và nhận diện biển số tại barie hầm xe sẽ bị hủy ngay lập tức.`
        }
        itemCode={revokeVehicleTarget?.plate}
        itemName={revokeVehicleTarget ? `Căn hộ ${revokeVehicleTarget.aptCode}` : undefined}
      />
    </div>
  );
}

