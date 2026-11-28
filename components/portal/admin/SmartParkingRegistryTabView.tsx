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

export default function SmartParkingRegistryTabView({ ctx }: { ctx: SmartParkingContext }) {
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
                <Car className="w-4 h-4 text-[#C5A880]" />
                {t('Danh Sách Phương Tiện Đã Cấp Thẻ', 'Active Issued Vehicle Registry')} ({filteredVehicles.length} {t('xe', 'vehicles')})
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t(
                  'Toàn bộ phương tiện chính thức được cấp quyền sử dụng hầm nội khu hoặc nhà xe liên khu',
                  'All official vehicles authorized to use basement or multi-storey parking facilities'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('Tìm biển số, căn hộ, chủ xe...', 'Search plate, apartment, owner...')}
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#161B22] border border-[#2D3748] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A880] w-48 sm:w-60 rounded-none"
                />
              </div>

              <div className="flex items-center border border-[#2D3748] bg-[#161B22] p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-2.5 py-1 ${typeFilter === 'ALL' ? 'bg-[#C5A880] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                  {t('Tất cả', 'All')}
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('CAR')}
                  className={`px-2.5 py-1 ${typeFilter === 'CAR' ? 'bg-[#C5A880] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                  {t('Ô tô', 'Cars')}
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('MOTORBIKE')}
                  className={`px-2.5 py-1 ${typeFilter === 'MOTORBIKE' ? 'bg-[#C5A880] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
                >
                  {t('Xe máy', 'Bikes')}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#222B35]">
              <thead className="bg-[#161B22] text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#222B35]">
                <tr>
                  <th className="p-3">{t('Biển Số Xe', 'Plate Number')}</th>
                  <th className="p-3">{t('Phân Loại', 'Category')}</th>
                  <th className="p-3">{t('Hãng Xe / Model', 'Make / Model')}</th>
                  <th className="p-3">{t('Căn Hộ', 'Apartment')}</th>
                  <th className="p-3">{t('Chủ Sở Hữu', 'Owner')}</th>
                  <th className="p-3">{t('Mã Thẻ RFID', 'RFID Card')}</th>
                  <th className="p-3">{t('Vị Trí Ô Đỗ', 'Assigned Slot')}</th>
                  <th className="p-3">{t('Phí Tháng', 'Monthly Fee')}</th>
                  <th className="p-3 text-right">{t('Thao Tác', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2533]">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500 font-mono space-y-2">
                      <Car className="w-8 h-8 text-gray-600 mx-auto" />
                      <div>
                        {searchPlate.trim()
                          ? t('Không tìm thấy phương tiện nào phù hợp với từ khóa tìm kiếm.', 'No vehicles matched your search filter.')
                          : t('Chưa có phương tiện nào được cấp quyền trong tòa nhà. Hãy nhấn "+ Cấp Thẻ / Đăng Ký Ô Đỗ" để đăng ký.', 'No authorized vehicles found. Click "+ Issue Pass / Assign Slot" to register.')}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((veh) => (
                    <tr key={veh.id} className="hover:bg-[#161F2E]/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#C5A880]">
                        {veh.plate}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase font-mono ${veh.type === 'CAR'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                          }`}>
                          {veh.type === 'CAR' ? t('Ô Tô', 'Car') : t('Xe Máy', 'Motorbike')}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">
                        {veh.brand || '---'}
                      </td>
                      <td className="p-3 font-mono font-semibold text-white">
                        {t('Căn', 'Unit')} {veh.aptCode} ({t('Tầng', 'Floor')} {veh.floor})
                      </td>
                      <td className="p-3 text-gray-300">
                        {veh.ownerName}
                      </td>
                      <td className="p-3 font-mono text-gray-400">
                        {veh.cardNo || `RFID-${veh.aptCode}`}
                      </td>
                      <td className="p-3 font-mono text-[#C5A880] font-bold">
                        {veh.slot || (veh.type === 'CAR' ? 'B2-A01' : 'B1-M01')}
                      </td>
                      <td className="p-3 font-mono text-emerald-400 font-semibold">
                        {veh.type === 'CAR' ? '1.200.000 đ' : '120.000 đ'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (veh.slot) {
                                setActiveMainTab('MATRIX');
                                setSelectedSlotCode(veh.slot);
                              }
                            }}
                            className="px-2.5 py-1 bg-[#1C2533] hover:bg-[#C5A880] hover:text-black text-gray-300 border border-gray-700 text-[11px] font-semibold transition-all rounded-none"
                            title={t('Xem Ô Đỗ', 'View Slot')}
                          >
                            {t('Vị Trí', 'View Slot')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeVehicle(veh.aptCode, veh.id, veh.plate)}
                            className="p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/50 transition-colors rounded-none"
                            title={t('Thu Hồi / Xóa Thẻ Xe', 'Revoke / Remove Pass')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
