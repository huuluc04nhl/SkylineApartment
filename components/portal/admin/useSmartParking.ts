'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  getApartmentUnits,
  syncApartmentsFromApi,
  addApartmentVehicle,
  removeApartmentVehicle,
  ApartmentVehicle,
  ApartmentUnit
} from '@/lib/apartmentStore';
import { useLanguage } from '@/lib/languageContext';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';

interface RegisteredVehicleWithUnit extends ApartmentVehicle {
  aptCode: string;
  ownerName: string;
  floor: number;
}

export interface ParkingWaitlistEntry {
  id: string;
  aptCode: string;
  ownerName: string;
  floor: number;
  vehicleType: 'CAR' | 'MOTORBIKE';
  plate: string;
  brand: string;
  requestedZone: 'FIXED_B2' | 'FLOATING_B2' | 'SOLARI_HUB';
  requestDate: string;
  status: 'PENDING' | 'APPROVED';
}

const WAITLIST_STORAGE_KEY = 'skyline_parking_waitlist_v4';



export function useSmartParking() {
  const { t, isEn } = useLanguage();

  // Apartment Data & Registered Vehicles
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [parkingSlots, setParkingSlots] = useState<any[]>([]);
  const [isLoadingParking, setIsLoadingParking] = useState<boolean>(true);
  const [parkingError, setParkingError] = useState<string>('');
  const [activeMainTab, setActiveMainTab] = useState<'MATRIX' | 'REGISTRY' | 'WAITLIST'>('MATRIX');
  const [searchPlate, setSearchPlate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CAR' | 'MOTORBIKE'>('ALL');
  const [selectedFloorMap, setSelectedFloorMap] = useState<'B2_FIXED' | 'B2_FLOATING' | 'B1_MOTO' | 'SOLARI_HUB'>('B2_FIXED');

  // Selected Slot for detail panel
  const [selectedSlotCode, setSelectedSlotCode] = useState<string | null>(null);
  const [revokeVehicleTarget, setRevokeVehicleTarget] = useState<{ aptCode: string; vehicleId: string; plate: string } | null>(null);

  // Waitlist Queue State
  const [waitlist, setWaitlist] = useState<ParkingWaitlistEntry[]>([]);

  // Modal State for New Vehicle Registration
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regAptCode, setRegAptCode] = useState('');
  const [regType, setRegType] = useState<'CAR' | 'MOTORBIKE'>('CAR');
  const [regPlate, setRegPlate] = useState('');
  const [regBrand, setRegBrand] = useState('');
  const [regTargetZone, setRegTargetZone] = useState<'FIXED_B2' | 'FLOATING_B2' | 'SOLARI_HUB'>('FIXED_B2');
  const [regCustomSlot, setRegCustomSlot] = useState('');
  const [regActionType, setRegActionType] = useState<'DIRECT_ISSUE' | 'WAITLIST'>('DIRECT_ISSUE');
  const [regFormError, setRegFormError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Selected declared vehicle index when apartment has multiple declared vehicles
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState<number>(0);

  const parkingResource = useAsyncResource(async () => {
    const [apts, parkingRes] = await Promise.all([
      syncApartmentsFromApi(''),
      fetch('/api/parking', { credentials: 'include' }),
    ]);
    setApartments(apts.length > 0 ? apts : getApartmentUnits());
    if (apts.length > 0 && !regAptCode) {
      setRegAptCode(apts[0].code);
    }
    if (!parkingRes.ok) {
      const errJson = await parkingRes.json().catch(() => ({}));
      throw new Error(errJson?.message || `HTTP ${parkingRes.status}`);
    }
    const parkingJson = await parkingRes.json();
    const slots = Array.isArray(parkingJson?.slots) ? parkingJson.slots : [];
    setParkingSlots(slots);
    setIsLoadingParking(false);
    setParkingError('');
    return slots;
  }, []);

  const loadParkingData = async () => {
    parkingResource.retry();
  };

  useEffect(() => {
    setIsLoadingParking(parkingResource.loading);
    setParkingError(parkingResource.error || '');
  }, [parkingResource.loading, parkingResource.error]);

  const registeredVehicles: RegisteredVehicleWithUnit[] = useMemo(() => {
    const list: RegisteredVehicleWithUnit[] = [];
    const seenKeys = new Set<string>();

    parkingSlots
      .filter((s) => s.status === 'OCCUPIED' && s.apartment_code && s.assigned_license_plate)
      .forEach((s) => {
        const apt = apartments.find((a) => a.code.toUpperCase() === String(s.apartment_code).toUpperCase());
        const key = `${String(s.apartment_code).toUpperCase()}-${String(s.assigned_license_plate).toUpperCase()}`;
        seenKeys.add(key);
        list.push({
          id: s.id,
          type: s.vehicle_type === 'MOTORCYCLE' ? 'MOTORBIKE' : 'CAR',
          plate: s.assigned_license_plate,
          brand: s.vehicle_type === 'MOTORCYCLE' ? 'Xe máy' : 'Ô tô',
          cardNo: s.rfid_card_code || `RFID-${s.slot_code}`,
          slot: s.slot_code,
          aptCode: s.apartment_code,
          ownerName: apt?.owner?.name || (isEn ? 'Resident' : 'Cư dân căn hộ'),
          floor: apt?.floor || 0,
        });
      });

    apartments.forEach(apt => {
      if (apt.vehicles && apt.vehicles.length > 0) {
        apt.vehicles.forEach(v => {
          const key = `${apt.code.toUpperCase()}-${v.plate.toUpperCase()}`;
          if (seenKeys.has(key)) return;
          list.push({
            ...v,
            aptCode: apt.code,
            ownerName: apt.owner?.name || (isEn ? 'Resident' : 'Cư dân căn hộ'),
            floor: apt.floor,
          });
        });
      }
    });
    return list;
  }, [apartments, parkingSlots, isEn]);

  // Operational Multi-Hub Capacity Specs
  const B2_FIXED_CAR_SLOTS = 60; // Hầm B2 Zone A: Ô cố định VIP
  const B2_FLOATING_CAR_SLOTS = 90; // Hầm B2 Zone B: Ô đỗ tự do
  const TOTAL_B2_CAR_SLOTS = B2_FIXED_CAR_SLOTS + B2_FLOATING_CAR_SLOTS; // 150 ô nội khu

  const SOLARI_HUB_CAR_SLOTS = 650; // Nhà xe cao tầng Beverly Solari
  const TOTAL_EXPANDED_CAR_CAPACITY = TOTAL_B2_CAR_SLOTS + SOLARI_HUB_CAR_SLOTS; // 800 chỗ ô tô (> 1.1 ô tô/căn)

  const MAX_MOTO_SLOTS = 850; // Hầm B1: 850 xe máy (~1.2 xe/căn hộ)

  const CAR_MONTHLY_FEE = 1200000;
  const MOTO_MONTHLY_FEE = 120000;

  const registeredCars = registeredVehicles.filter(v => v.type === 'CAR').length;
  const registeredMotos = registeredVehicles.filter(v => v.type === 'MOTORBIKE').length;

  const carOccupancyPct = Math.min(100, Math.round((registeredCars / TOTAL_B2_CAR_SLOTS) * 100));
  const motoOccupancyPct = Math.min(100, Math.round((registeredMotos / MAX_MOTO_SLOTS) * 100));

  const totalMonthlyRevenue = (registeredCars * CAR_MONTHLY_FEE) + (registeredMotos * MOTO_MONTHLY_FEE);

  // Generate Slot Matrices for Multi-Hub Spatial Mapping
  // 1. Hầm B2 Zone A: Ô Đỗ Cố Định (B2-A01 đến B2-A24)
  const b2FixedSlots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= 24; i++) {
      const code = `B2-A${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'CAR' && v.slot === code);
      slots.push({ code, zone: 'Zone A (Cố Định VIP)', type: 'CAR' as const, assigned, category: 'FIXED' });
    }
    return slots;
  }, [registeredVehicles]);

  // 2. Hầm B2 Zone B: Ô Đỗ Tự Do Chia Sẻ (B2-B01 đến B2-B24)
  const b2FloatingSlots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= 24; i++) {
      const code = `B2-B${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'CAR' && v.slot === code);
      slots.push({ code, zone: 'Zone B (Tự Do Luân Phiên)', type: 'CAR' as const, assigned, category: 'FLOATING' });
    }
    return slots;
  }, [registeredVehicles]);

  // 3. Hầm B1: Xe Máy (B1-M01 đến B1-M32)
  const b1Slots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= 32; i++) {
      const code = `B1-M${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'MOTORBIKE' && v.slot === code);
      slots.push({ code, zone: 'Hầm B1 Xe Máy', type: 'MOTORBIKE' as const, assigned, category: 'MOTO' });
    }
    return slots;
  }, [registeredVehicles]);

  // 4. Nhà Xe Thông Minh Beverly Solari Hub (HUB-01 đến HUB-24)
  const solariHubSlots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= 24; i++) {
      const code = `HUB-${String(i).padStart(2, '0')}`;
      const assigned = registeredVehicles.find(v => v.type === 'CAR' && v.slot === code);
      slots.push({ code, zone: 'Nhà Xe Thông Minh Beverly Solari', type: 'CAR' as const, assigned, category: 'HUB' });
    }
    return slots;
  }, [registeredVehicles]);

  // Selected slot detail
  const currentSlotDetail = useMemo(() => {
    if (!selectedSlotCode) return null;
    const allSlots = [...b2FixedSlots, ...b2FloatingSlots, ...b1Slots, ...solariHubSlots];
    return allSlots.find(s => s.code === selectedSlotCode) || null;
  }, [selectedSlotCode, b2FixedSlots, b2FloatingSlots, b1Slots, solariHubSlots]);

  const saveWaitlistState = (newList: ParkingWaitlistEntry[]) => {
    setWaitlist(newList);
  };

  const activeApartmentUnit = useMemo(() => {
    return apartments.find(a => a.code === regAptCode) || null;
  }, [regAptCode, apartments]);

  const hasResident = useMemo(() => {
    return Boolean(
      activeApartmentUnit?.owner?.name ||
      activeApartmentUnit?.status === 'OCCUPIED' ||
      (activeApartmentUnit?.members && activeApartmentUnit.members.length > 0)
    );
  }, [activeApartmentUnit]);

  // Genuinely declared resident vehicles from Database / Apartment Store
  const detectedResidentVehicles = useMemo(() => {
    if (!regAptCode || !activeApartmentUnit || !hasResident) return [];

    const list: Array<{
      plate: string;
      brand: string;
      type: 'CAR' | 'MOTORBIKE';
      cardNo?: string;
      slot?: string;
      source: string;
    }> = [];

    const seenPlates = new Set<string>();

    // 1. Existing vehicles on the apartment unit (from Database / Apartment Store)
    if (activeApartmentUnit.vehicles && activeApartmentUnit.vehicles.length > 0) {
      activeApartmentUnit.vehicles.forEach(v => {
        const clean = v.plate.trim().toUpperCase();
        if (clean && !seenPlates.has(clean)) {
          seenPlates.add(clean);
          list.push({
            plate: clean,
            brand: v.brand || (v.type === 'CAR' ? 'Sedan / SUV' : 'Xe máy'),
            type: v.type === 'CAR' ? 'CAR' : 'MOTORBIKE',
            cardNo: v.cardNo,
            slot: v.slot,
            source: isEn ? 'Registered Vehicle' : 'Hồ sơ xe căn hộ',
          });
        }
      });
    }

    // 2. Family members with declared license plate (from Database / Apartment Store)
    if (activeApartmentUnit.members && activeApartmentUnit.members.length > 0) {
      activeApartmentUnit.members.forEach(m => {
        if (m.licensePlate) {
          const clean = m.licensePlate.trim().toUpperCase();
          if (clean && !seenPlates.has(clean)) {
            seenPlates.add(clean);
            list.push({
              plate: clean,
              brand: isEn ? 'Member Vehicle' : 'Xe thành viên',
              type: 'MOTORBIKE',
              source: `${isEn ? 'Member' : 'Thành viên'}: ${m.fullName}`,
            });
          }
        }
      });
    }

    return list;
  }, [regAptCode, activeApartmentUnit, hasResident, isEn]);

  // AI Spatial Slot Routing Function
  const computeOptimalSlot = (
    type: 'CAR' | 'MOTORBIKE',
    targetZone: 'FIXED_B2' | 'FLOATING_B2' | 'SOLARI_HUB',
    wing: string
  ) => {
    if (type === 'MOTORBIKE') {
      const free = b1Slots.find(s => !s.assigned);
      return free ? free.code : (wing === 'SOUTH' ? 'B1-M08' : 'B1-M02');
    }
    if (targetZone === 'FIXED_B2') {
      const preferred = wing === 'SOUTH'
        ? ['B2-A06', 'B2-A07', 'B2-A08', 'B2-A05', 'B2-A09']
        : ['B2-A03', 'B2-A02', 'B2-A04', 'B2-A01'];
      const preferredFree = b2FixedSlots.find(s => !s.assigned && preferred.includes(s.code));
      if (preferredFree) return preferredFree.code;
      const anyFree = b2FixedSlots.find(s => !s.assigned);
      return anyFree ? anyFree.code : (wing === 'SOUTH' ? 'B2-A06' : 'B2-A03');
    }
    if (targetZone === 'FLOATING_B2') {
      const preferred = wing === 'SOUTH'
        ? ['B2-B08', 'B2-B07', 'B2-B09', 'B2-B06']
        : ['B2-B04', 'B2-B03', 'B2-B05', 'B2-B02'];
      const preferredFree = b2FloatingSlots.find(s => !s.assigned && preferred.includes(s.code));
      if (preferredFree) return preferredFree.code;
      const anyFree = b2FloatingSlots.find(s => !s.assigned);
      return anyFree ? anyFree.code : (wing === 'SOUTH' ? 'B2-B08' : 'B2-B04');
    }
    const anyFree = solariHubSlots.find(s => !s.assigned);
    return anyFree ? anyFree.code : 'HUB-08';
  };

  // ZERO-CLICK AUTO-DETECTION & AUTO-FILL HANDLER:
  // Directly and synchronously auto-fills license plate, brand, and slot when an apartment is selected.
  const handleApartmentSelect = (targetCode: string) => {
    setRegAptCode(targetCode);
    setSelectedVehicleIdx(0);

    const targetUnit = apartments.find(a => a.code === targetCode);
    const hasRes = Boolean(targetUnit?.owner?.name || targetUnit?.status === 'OCCUPIED' || (targetUnit?.members && targetUnit.members.length > 0));

    if (!targetUnit || !hasRes) {
      setRegPlate('');
      setRegBrand('');
      setRegCustomSlot('');
      return;
    }

    const unitVehicles = targetUnit.vehicles || [];
    const memberVehicles = (targetUnit.members || [])
      .filter(m => m.licensePlate)
      .map(m => ({
        plate: m.licensePlate!.trim().toUpperCase(),
        brand: isEn ? 'Member Vehicle' : 'Xe thành viên',
        type: 'MOTORBIKE' as const,
      }));

    const allVehs = [
      ...unitVehicles.map(v => ({
        plate: v.plate.trim().toUpperCase(),
        brand: v.brand || (v.type === 'CAR' ? 'Sedan / SUV' : 'Xe máy'),
        type: (v.type === 'CAR' ? 'CAR' : 'MOTORBIKE') as 'CAR' | 'MOTORBIKE',
      })),
      ...memberVehicles,
    ];

    if (allVehs.length > 0) {
      const v = allVehs[0];
      setRegPlate(v.plate);
      setRegBrand(v.brand);
      setRegType(v.type);

      const wing = targetUnit.wing || (targetCode.includes('06') || targetCode.includes('08') || targetCode.includes('09') ? 'SOUTH' : 'NORTH');
      const slot = computeOptimalSlot(v.type, regTargetZone, wing);
      setRegCustomSlot(slot);
    } else {
      // Resident exists but has no vehicles declared in profile
      setRegPlate('');
      setRegBrand('');
      setRegCustomSlot('');
    }
  };

  // REACTIVE AUTO-FILL SYNCHRONIZATION:
  // Guarantees inputs are filled on initial modal open or whenever apartment/vehicle selection updates
  useEffect(() => {
    if (!activeApartmentUnit || !hasResident) {
      setRegPlate('');
      setRegBrand('');
      setRegCustomSlot('');
      return;
    }

    if (detectedResidentVehicles.length > 0) {
      const target = detectedResidentVehicles[selectedVehicleIdx] || detectedResidentVehicles[0];
      setRegPlate(target.plate);
      setRegBrand(target.brand);
      setRegType(target.type);
      const wing = activeApartmentUnit.wing || (regAptCode.includes('06') || regAptCode.includes('08') || regAptCode.includes('09') ? 'SOUTH' : 'NORTH');
      setRegCustomSlot(computeOptimalSlot(target.type, regTargetZone, wing));
    } else {
      setRegPlate('');
      setRegBrand('');
      setRegCustomSlot('');
    }
  }, [regAptCode, activeApartmentUnit, hasResident, detectedResidentVehicles, selectedVehicleIdx, regTargetZone]);

  // Handler: Register New Vehicle or Enqueue to Waitlist
  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegFormError('');
    setRegSuccessMsg('');

    if (!regAptCode) {
      setRegFormError(isEn ? 'Please select an apartment' : 'Vui lòng chọn căn hộ');
      return;
    }

    if (!hasResident) {
      setRegFormError(
        isEn
          ? 'Cannot issue pass: Apartment is vacant with no registered resident.'
          : 'Không thể cấp thẻ: Căn hộ đang trống, chưa có cư dân nhận bàn giao.'
      );
      return;
    }

    if (!regPlate.trim()) {
      setRegFormError(
        isEn
          ? 'Please enter or select a vehicle license plate'
          : 'Vui lòng nhập hoặc chọn biển số xe cần cấp thẻ'
      );
      return;
    }

    const cleanNew = regPlate.trim().toUpperCase().replace(/[-.\s]/g, '');
    const existsOther = registeredVehicles.some(
      v => v.plate.toUpperCase().replace(/[-.\s]/g, '') === cleanNew && v.aptCode !== regAptCode
    );
    if (existsOther) {
      setRegFormError(isEn ? 'This plate number is already registered to another apartment' : 'Biển số này đã được đăng ký cho căn hộ khác trong hệ thống');
      return;
    }

    const apt = apartments.find(a => a.code === regAptCode);

    // If enqueuing to Waitlist
    if (regActionType === 'WAITLIST') {
      const newWaitEntry: ParkingWaitlistEntry = {
        id: `wait-${Date.now()}`,
        aptCode: regAptCode,
        ownerName: apt?.owner?.name || (isEn ? 'Resident' : 'Cư dân căn hộ'),
        floor: apt?.floor || 1,
        vehicleType: regType,
        plate: regPlate.trim().toUpperCase(),
        brand: regBrand.trim() || (regType === 'CAR' ? 'Sedan / SUV' : 'Xe máy'),
        requestedZone: regTargetZone,
        requestDate: new Date().toLocaleDateString('vi-VN'),
        status: 'PENDING',
      };

      saveWaitlistState([...waitlist, newWaitEntry]);
      setRegSuccessMsg(
        isEn
          ? `Added vehicle ${newWaitEntry.plate} to Waitlist Queue (#${waitlist.length + 1})`
          : `Đã đưa phương tiện ${newWaitEntry.plate} vào Hàng đợi xét duyệt (#${waitlist.length + 1})`
      );
      setRegPlate('');
      setRegBrand('');
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegSuccessMsg('');
      }, 1400);
      return;
    }

    // Direct issue slot with AI allocated code
    const slotCode = regCustomSlot.trim() || (regType === 'CAR' ? 'B2-A06' : 'B1-M08');
    const generatedCardNo = `RFID-${regAptCode}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    const newVehicle: ApartmentVehicle = {
      id: `veh-${Date.now()}`,
      type: regType,
      plate: regPlate.trim().toUpperCase(),
      brand: regBrand.trim() || (regType === 'CAR' ? 'Sedan / SUV' : 'Xe máy'),
      cardNo: generatedCardNo,
      slot: slotCode,
    };

    try {
      const res = await fetch('/api/parking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          slotCode,
          floorNumber: regType === 'CAR' ? -2 : -1,
          vehicleType: regType === 'CAR' ? 'CAR' : 'MOTORCYCLE',
          apartmentCode: regAptCode,
          licensePlate: newVehicle.plate,
          rfidCardCode: generatedCardNo,
          monthlyFee: regType === 'CAR' ? 1200000 : 120000,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRegFormError(json?.message || (isEn ? 'Failed to assign parking slot.' : 'Không thể gán vị trí đỗ xe.'));
        return;
      }

      addApartmentVehicle(regAptCode, newVehicle);
      await loadParkingData();
      setRegSuccessMsg(
        isEn
          ? `Vehicle ${newVehicle.plate} successfully assigned to Unit ${regAptCode} (Slot ${slotCode})`
          : `Đã cấp thẻ thành công xe ${newVehicle.plate} cho Căn ${regAptCode} (Vị trí ${slotCode})`
      );
      setRegPlate('');
      setRegBrand('');
      setRegCustomSlot('');
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegSuccessMsg('');
      }, 1400);
    } catch {
      setRegFormError(isEn ? 'Network error while saving parking slot.' : 'Lỗi kết nối khi lưu vị trí đỗ xe.');
    }
  };

  // Handler: Approve Waitlist Item directly to slot
  const handleApproveWaitlistEntry = async (entry: ParkingWaitlistEntry, targetSlotCode: string) => {
    const rfidCardCode = `RFID-${entry.aptCode}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const newVehicle: ApartmentVehicle = {
      id: `veh-${Date.now()}`,
      type: entry.vehicleType,
      plate: entry.plate,
      brand: entry.brand,
      cardNo: rfidCardCode,
      slot: targetSlotCode,
    };

    const res = await fetch('/api/parking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        slotCode: targetSlotCode,
        floorNumber: entry.vehicleType === 'CAR' ? -2 : -1,
        vehicleType: entry.vehicleType === 'CAR' ? 'CAR' : 'MOTORCYCLE',
        apartmentCode: entry.aptCode,
        licensePlate: entry.plate,
        rfidCardCode,
        monthlyFee: entry.vehicleType === 'CAR' ? 1200000 : 120000,
      }),
    });
    if (res.ok) {
      addApartmentVehicle(entry.aptCode, newVehicle);
      await loadParkingData();
      saveWaitlistState(waitlist.filter(w => w.id !== entry.id));
    }
  };

  // Handler: Remove Waitlist Entry
  const handleRemoveWaitlistEntry = (id: string) => {
    saveWaitlistState(waitlist.filter(w => w.id !== id));
  };

  // Handler: Revoke Vehicle
  const handleRevokeVehicle = (aptCode: string, vehicleId: string, plate: string) => {
    setRevokeVehicleTarget({ aptCode, vehicleId, plate });
  };

  const confirmRevokeVehicle = async () => {
    if (!revokeVehicleTarget) return;
    const { aptCode, vehicleId, plate } = revokeVehicleTarget;
    await fetch(`/api/parking?apartmentCode=${encodeURIComponent(aptCode)}&licensePlate=${encodeURIComponent(plate)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => { });
    removeApartmentVehicle(aptCode, vehicleId);
    await loadParkingData();
    if (selectedSlotCode && currentSlotDetail?.assigned?.id === vehicleId) {
      setSelectedSlotCode(null);
    }
    setRevokeVehicleTarget(null);
  };

  // Filtered vehicles
  const filteredVehicles = registeredVehicles.filter(v => {
    if (typeFilter !== 'ALL' && v.type !== typeFilter) return false;
    if (searchPlate.trim()) {
      const q = searchPlate.toLowerCase();
      return (
        v.plate.toLowerCase().includes(q) ||
        v.aptCode.toLowerCase().includes(q) ||
        v.ownerName.toLowerCase().includes(q) ||
        (v.brand && v.brand.toLowerCase().includes(q)) ||
        (v.cardNo && v.cardNo.toLowerCase().includes(q)) ||
        (v.slot && v.slot.toLowerCase().includes(q))
      );
    }
    return true;
  });


  return {
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
  };
}

export type SmartParkingContext = ReturnType<typeof useSmartParking>;
