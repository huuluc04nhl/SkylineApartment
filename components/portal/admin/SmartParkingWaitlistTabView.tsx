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

export default function SmartParkingWaitlistTabView({ ctx }: { ctx: SmartParkingContext }) {
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                {t('Hàng Đợi Danh Sách Chờ Xét Duyệt Ô Đỗ', 'Parking Waitlist & Overflow Queue')} ({waitlist.length} {t('hồ sơ', 'requests')})
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t(
                  'Cơ chế điều phối xếp hàng thông minh: Tự động nâng thứ tự ưu tiên khi có căn hộ trả chỗ hoặc điều phối sang nhà xe liên khu',
                  'Smart priority queue: Automatically promotes order when a unit surrenders a slot or re-routes to Solari Hub'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setRegActionType('WAITLIST');
                setIsRegisterModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-[#161B22] border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded-none"
            >
              <Plus className="w-3.5 h-3.5" />
              + {t('Thêm Đơn Vào Hàng Đợi', 'Enqueue New Request')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#222B35]">
              <thead className="bg-[#161B22] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#222B35]">
                <tr>
                  <th className="p-3">{t('Hạng Ưu Tiên', 'Priority')}</th>
                  <th className="p-3">{t('Căn Hộ', 'Apartment')}</th>
                  <th className="p-3">{t('Chủ Sở Hữu', 'Owner')}</th>
                  <th className="p-3">{t('Biển Số Xe', 'Plate Number')}</th>
                  <th className="p-3">{t('Dòng Xe', 'Vehicle Model')}</th>
                  <th className="p-3">{t('Nhu Cầu Đỗ', 'Desired Zone')}</th>
                  <th className="p-3">{t('Ngày Nộp Đơn', 'Applied Date')}</th>
                  <th className="p-3 text-right">{t('Điều Phối / Duyệt Cấp', 'Dispatch / Approve')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2533]">
                {waitlist.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500 font-mono space-y-2">
                      <Clock className="w-8 h-8 text-gray-600 mx-auto" />
                      <div>
                        {t(
                          'Hiện không có hồ sơ nào trong danh sách chờ. Sức chứa tầng hầm và bãi xe liên tòa đang đáp ứng tốt nhu cầu cư dân.',
                          'No applications currently in the waitlist. Capacity is fully meeting resident demands.'
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  waitlist.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#161F2E]/60 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-500/50 text-amber-300 font-bold text-xs">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-white">
                        {t('Căn', 'Unit')} {item.aptCode} ({t('Tầng', 'Floor')} {item.floor})
                      </td>
                      <td className="p-3 text-gray-300">
                        {item.ownerName}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#C5A880]">
                        {item.plate}
                      </td>
                      <td className="p-3 text-gray-300">
                        {item.brand}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-gray-300">
                        {item.requestedZone === 'FIXED_B2' ? (
                          <span className="text-[#C5A880]">{t('Ô Cố Định Hầm B2', 'Fixed B2 Slot')}</span>
                        ) : item.requestedZone === 'FLOATING_B2' ? (
                          <span className="text-cyan-300">{t('Ô Tự Do Hầm B2', 'Floating B2 Slot')}</span>
                        ) : (
                          <span className="text-amber-300">{t('Nhà Xe Solari Hub', 'Solari Hub Garage')}</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-gray-400">
                        {item.requestDate}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const slot = item.requestedZone === 'FIXED_B2' ? 'B2-A08' : item.requestedZone === 'FLOATING_B2' ? 'B2-B12' : 'HUB-15';
                              handleApproveWaitlistEntry(item, slot);
                            }}
                            className="px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 text-[11px] font-mono font-semibold transition-colors rounded-none flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            {t('Duyệt Cấp Slot', 'Approve Slot')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWaitlistEntry(item.id)}
                            className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                            title={t('Xóa khỏi hàng đợi', 'Remove from queue')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
  );
}
