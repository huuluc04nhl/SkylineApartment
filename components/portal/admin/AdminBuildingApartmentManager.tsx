'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';
import { ResourceSkeleton, ResourceError, ResourceEmpty } from '@/components/ui/ResourceState';
import { 
  getApartmentUnits, 
  getApartmentByCode, 
  syncApartmentsFromApi, 
  ApartmentUnit, 
  ApartmentResidentOwner, 
  ApartmentType, 
  ApartmentStatus, 
  saveApartmentsList 
} from '@/lib/apartmentStore';
import { 
  Map, 
  Layers, 
  Compass, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  ChevronRight, 
  ChevronLeft,
  ChevronUp,
  Sparkles, 
  Building, 
  Building2,
  Search,
  MapPin, 
  Check, 
  Key,
  UserCheck,
  ExternalLink,
  Info,
  X,
  Navigation,
  TreePine,
  Waves,
  Dumbbell,
  FileText,
  RefreshCw,
  GraduationCap,
  ShoppingBag,
  Bus,
  HeartPulse
} from 'lucide-react';
import AssignResidentModal from '@/components/portal/admin/AssignResidentModal';
import EditApartmentModal from '@/components/portal/admin/EditApartmentModal';
import AddApartmentModal from '@/components/portal/admin/AddApartmentModal';
import ApartmentDetailModal from '@/components/portal/admin/ApartmentDetailModal';
import { useLanguage } from '@/lib/languageContext';
import TropicalCampusSvgModel from './models/TropicalCampusSvgModel';
import SurroundingRadarSvgModel from './models/SurroundingRadarSvgModel';
import MacroCitySvgModel from './models/MacroCitySvgModel';

// Subcomponents & Constants modularized per DESIGN.md
import { 
  OccupancyFilter, 
  ApartmentTypeFilter, 
  FloorRangeFilter, 
  ViewPerspective, 
  BuildingColorTone, 
  TropicalAmenity, 
  SurroundingAmenity, 
  THE_TROPICAL_AMENITIES, 
  SURROUNDING_AMENITIES, 
  CAD_FLOOR_UNITS_CONFIG, 
  BUILDING_3D_UNITS, 
  getApartmentFinancialMetrics, 
  LOBBY_ZONES_DETAIL 
} from './building-manager/buildingConstants';
import IsometricBuilding3DView from './building-manager/IsometricBuilding3DView';
import MasterPlanAmenitiesConsole from './building-manager/MasterPlanAmenitiesConsole';
import LobbyFloorPlanConsole from './building-manager/LobbyFloorPlanConsole';
import FloorUnitCadPlanView from './building-manager/FloorUnitCadPlanView';
import ApartmentProfilePanel from './building-manager/ApartmentProfilePanel';
import FloorPlanDeepDiveModal from './building-manager/FloorPlanDeepDiveModal';
import MasterPlanFullscreenModal from './building-manager/MasterPlanFullscreenModal';

// Re-export constants & types for models and subcomponents
export { 
  THE_TROPICAL_AMENITIES, 
  SURROUNDING_AMENITIES, 
  CAD_FLOOR_UNITS_CONFIG, 
  BUILDING_3D_UNITS, 
  getApartmentFinancialMetrics, 
  LOBBY_ZONES_DETAIL 
} from './building-manager/buildingConstants';
export type { 
  OccupancyFilter, 
  ApartmentTypeFilter, 
  FloorRangeFilter, 
  ViewPerspective, 
  BuildingColorTone, 
  TropicalAmenity, 
  SurroundingAmenity 
} from './building-manager/buildingConstants';


export default function AdminBuildingApartmentManager() {
  const { t, isEn } = useLanguage();
  // 1. Quản lý danh sách căn hộ thực tế từ apartmentStore & Skyline API
  const [apartments, setApartments] = useState<ApartmentUnit[]>([]);
  const [selectedAptCode, setSelectedAptCode] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<'BS-07' | 'BS-08' | 'BS-09' | 'BS-10'>('BS-07');
  const buildingColorTone: BuildingColorTone = 'GOLD_LUXURY';

  const [selectedFloorRange, setSelectedFloorRange] = useState<FloorRangeFilter>('ALL');
  const [buildingPerspective, setBuildingPerspectiveState] = useState<ViewPerspective>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view');
      if (view) return view as ViewPerspective;
    }
    return 'BUILDING_3D_FLOOR';
  });

  const setBuildingPerspective = (view: ViewPerspective) => {
    setBuildingPerspectiveState(view);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('view') !== view) {
        url.searchParams.set('view', view);
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  };
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'FINANCIAL' | 'TECHNICAL'>('OVERVIEW');

  // Điều khiển Floor Plan View (Mặt Bằng Tầng & Chế độ Mở Rộng) - Mặc định tầng 30 của chủ hộ
  const [selectedFloor, setSelectedFloor] = useState<number>(30);
  const [selectedLobbyZone, setSelectedLobbyZone] = useState<string>('RECEPTION');
  const [hoveredUnitCode, setHoveredUnitCode] = useState<string | null>(null);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [buildingTheme, setBuildingTheme] = useState<'NIGHT' | 'DAY'>('NIGHT');
  const [building3dZoom, setBuilding3dZoom] = useState<number>(1);
  const [building3dPan, setBuilding3dPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState<boolean>(false);

  const gestureRef = useRef<{
    startX: number;
    startY: number;
    startPan: { x: number; y: number };
    startDist: number;
    startZoom: number;
    lastTap: number;
    mode: 'NONE' | 'PAN' | 'PINCH';
  }>({
    startX: 0,
    startY: 0,
    startPan: { x: 0, y: 0 },
    startDist: 0,
    startZoom: 1,
    lastTap: 0,
    mode: 'NONE'
  });

  // Reset 3D transform về trạng thái chuẩn
  const reset3dTransform = useCallback(() => {
    setBuilding3dZoom(1);
    setBuilding3dPan({ x: 0, y: 0 });
  }, []);

  // Cử chỉ chạm CHỈ ÁP DỤNG TRÊN MOBILE / TABLET với giới hạn khung hình an toàn (không bị méo/vỡ mô hình)
  const handle3dTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    // Chạm đúp 2 lần để reset về chuẩn
    if (now - gestureRef.current.lastTap < 280) {
      reset3dTransform();
      gestureRef.current.lastTap = 0;
      return;
    }
    gestureRef.current.lastTap = now;

    if (e.touches.length === 1) {
      gestureRef.current.mode = 'PAN';
      gestureRef.current.startX = e.touches[0].clientX;
      gestureRef.current.startY = e.touches[0].clientY;
      gestureRef.current.startPan = { ...building3dPan };
      setIsGesturing(true);
    } else if (e.touches.length >= 2) {
      gestureRef.current.mode = 'PINCH';
      gestureRef.current.startDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      gestureRef.current.startZoom = building3dZoom;
      setIsGesturing(true);
    }
  };

  const handle3dTouchMove = (e: React.TouchEvent) => {
    if (gestureRef.current.mode === 'PAN' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - gestureRef.current.startX;
      const dy = e.touches[0].clientY - gestureRef.current.startY;
      const maxPanX = Math.max(70, Math.round((building3dZoom - 1) * 220 + 70));
      const maxPanY = Math.max(50, Math.round((building3dZoom - 1) * 180 + 50));
      const boundedX = Math.max(-maxPanX, Math.min(maxPanX, gestureRef.current.startPan.x + dx * 0.6));
      const boundedY = Math.max(-maxPanY, Math.min(maxPanY, gestureRef.current.startPan.y + dy * 0.6));
      setBuilding3dPan({ x: boundedX, y: boundedY });
    } else if (gestureRef.current.mode === 'PINCH' && e.touches.length >= 2) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (gestureRef.current.startDist > 0) {
        const factor = currentDist / gestureRef.current.startDist;
        const newZoom = Math.max(0.75, Math.min(2.5, Number((gestureRef.current.startZoom * factor).toFixed(2))));
        setBuilding3dZoom(newZoom);
      }
    }
  };

  const handle3dTouchEnd = () => {
    gestureRef.current.mode = 'NONE';
    setIsGesturing(false);
  };

  // Kéo chuột tự do (Mouse Drag Pan) trên Desktop
  const handle3dMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    gestureRef.current.mode = 'PAN';
    gestureRef.current.startX = e.clientX;
    gestureRef.current.startY = e.clientY;
    gestureRef.current.startPan = { ...building3dPan };
    setIsGesturing(true);
  };

  const handle3dMouseMove = (e: React.MouseEvent) => {
    if (gestureRef.current.mode !== 'PAN' || !isGesturing) return;
    const dx = e.clientX - gestureRef.current.startX;
    const dy = e.clientY - gestureRef.current.startY;
    const maxPanX = Math.max(90, Math.round((building3dZoom - 1) * 260 + 100));
    const maxPanY = Math.max(70, Math.round((building3dZoom - 1) * 200 + 80));
    const boundedX = Math.max(-maxPanX, Math.min(maxPanX, gestureRef.current.startPan.x + dx));
    const boundedY = Math.max(-maxPanY, Math.min(maxPanY, gestureRef.current.startPan.y + dy));
    setBuilding3dPan({ x: boundedX, y: boundedY });
  };

  const handle3dMouseUp = () => {
    if (gestureRef.current.mode === 'PAN') {
      gestureRef.current.mode = 'NONE';
      setIsGesturing(false);
    }
  };

  const [isFloorPlanExpanded, setIsFloorPlanExpanded] = useState<boolean>(false);
  const [floorFilterStatus, setFloorFilterStatus] = useState<'ALL' | 'OCCUPIED' | 'VACANT' | 'MAINTENANCE'>('ALL');
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>('');
  const [floorPlanViewMode, setFloorPlanViewMode] = useState<'CAD_VECTOR' | 'BLUEPRINT_IMAGE'>('CAD_VECTOR');
  const [floorPlanFilterWing, setFloorPlanFilterWing] = useState<'ALL' | 'NORTH' | 'SOUTH' | 'WEST'>('ALL');
  const [floorPlanCadZoom, setFloorPlanCadZoom] = useState<number>(1);
  const [billToastMessage, setBillToastMessage] = useState<string | null>(null);

  // Điều khiển chế độ xem Bản đồ Quy hoạch Phân khu & Đô thị
  const [masterPlanTab, setMasterPlanTab] = useState<'TROPICAL' | 'SURROUNDINGS' | 'MACRO'>('TROPICAL');
  const [isMasterPlanZoomed, setIsMasterPlanZoomed] = useState<boolean>(false);
  const [modalZoomScale, setModalZoomScale] = useState<number>(1);
  const [modalShowPins, setModalShowPins] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Phím tắt ESC để đóng modal phóng to
  useEffect(() => {
    if (!isMasterPlanZoomed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMasterPlanZoomed(false);
        setModalZoomScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMasterPlanZoomed]);

  const [selectedAmenityCategory, setSelectedAmenityCategory] = useState<'ALL' | 'POOL' | 'PARK' | 'SPORT' | 'ACCESS'>('ALL');
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);
  const [hoveredAmenityId, setHoveredAmenityId] = useState<string | null>(null);
  const [amenityScope, setAmenityScope] = useState<'ALL' | 'INTERNAL' | 'SURROUNDINGS'>('ALL');
  
  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningApartment, setAssigningApartment] = useState<ApartmentUnit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);


  // Hàm tải danh sách căn hộ từ kho theo block
  const reloadApartments = (bCode: string = selectedBlock) => {
    const list = getApartmentUnits(bCode);
    setApartments(list);
  };

  // 3. Trạng thái và hàm đồng bộ dữ liệu Realtime 100% từ Skyline API
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => isEn ? 'Just updated' : 'Vừa cập nhật');
  const [apiLiveApartments, setApiLiveApartments] = useState<any[]>([]);

  // Tải và đồng bộ danh sách căn hộ trực tiếp từ API Skyline
  const syncLiveApartmentsFromApi = useCallback(async (bCode: string = selectedBlock) => {
    setIsSyncingApi(true);
    try {
      const units = await syncApartmentsFromApi(bCode);
      if (Array.isArray(units) && units.length > 0) {
        setApartments(units);
      }
      setLastSyncedTime(new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN'));
    } catch (err) {
      console.warn('API sync error:', err);
    } finally {
      setIsSyncingApi(false);
    }
  }, [selectedBlock]);

  // Tự động kích hoạt đồng bộ API khi khởi chạy hoặc chuyển chung cư
  useEffect(() => {
    syncLiveApartmentsFromApi(selectedBlock);
  }, [selectedBlock, syncLiveApartmentsFromApi]);

  // Chuyển đổi giữa 4 Chung Cư (Giữ nguyên góc nhìn hiện tại, không tự ý nhảy tab)
  const handleSwitchBlock = async (blockCode: 'BS-07' | 'BS-08' | 'BS-09' | 'BS-10') => {
    setSelectedBlock(blockCode);
    const localUnits = getApartmentUnits(blockCode);
    setApartments(localUnits);

    let targetFloor = 30;
    let targetCode = '';
    if (blockCode === 'BS-08') {
      targetFloor = 15;
      targetCode = 'CH-08';
    } else if (blockCode === 'BS-09') {
      targetFloor = 12;
      targetCode = 'CH-12';
    } else if (blockCode === 'BS-10') {
      targetFloor = 18;
      targetCode = 'CH-02';
    }

    setSelectedFloor(targetFloor);
    setSelectedAptCode(targetCode);

    try {
      await syncApartmentsFromApi(blockCode);
      setApartments(getApartmentUnits(blockCode));
    } catch (e) {
      console.warn('Switch block error:', e);
    }
  };

  // Lắng nghe thay đổi từ storage
  useEffect(() => {
    reloadApartments(selectedBlock);

    const handleUpdate = (e: any) => {
      if (e?.detail?.blockCode && e.detail.blockCode !== selectedBlock) {
        return;
      }
      reloadApartments(selectedBlock);
    };

    window.addEventListener('skyline_apartments_updated', handleUpdate);
    return () => {
      window.removeEventListener('skyline_apartments_updated', handleUpdate);
    };
  }, [selectedBlock]);


  const currentBlockConfig = useMemo(() => {
    switch (selectedBlock) {
      case 'BS-08':
        return { name: 'Chung Cư BS-08', floors: 39, badge: t('Chung Cư Điểm Nhấn (39 Tầng)', 'Signature Tower (39 Floors)') };
      case 'BS-09':
        return { name: 'Chung Cư BS-09', floors: 34, badge: t('Chung Cư Hướng Công Viên (34 Tầng)', 'Park-view Tower (34 Floors)') };
      case 'BS-10':
        return { name: 'Chung Cư BS-10', floors: 34, badge: t('Chung Cư Hướng Quảng Trường (34 Tầng)', 'Plaza-view Tower (34 Floors)') };
      default:
        return { name: 'Chung Cư BS-07', floors: 34, badge: t('Chung Cư Cư Dân (34 Tầng)', 'Residential Tower (34 Floors)') };
    }
  }, [selectedBlock]);

  const currentBlockName = currentBlockConfig.name;
  const currentTotalFloors = currentBlockConfig.floors;

  // Danh sách căn hộ hiển thị đồng bộ theo dữ liệu quản lý tòa nhà
  const displayUnits = useMemo(() => {
    return apartments.map(u => ({
      ...u,
      towerName: currentBlockName,
      statusLabel: u.status === 'OCCUPIED' ? t('Đã Bàn Giao (Có Cư Dân)', 'Occupied') : u.status === 'MAINTENANCE' ? t('Nghiệm Thu Kỹ Thuật', 'Technical Inspection') : t('Căn Hộ Trống', 'Vacant Unit')
    }));
  }, [apartments, currentBlockName]);

  // Danh sách căn hộ hiển thị đồng bộ theo bộ lọc trạng thái và tìm kiếm
  const filteredUnits = useMemo(() => {
    return displayUnits.filter(u => {
      if (floorFilterStatus !== 'ALL' && u.status !== floorFilterStatus) return false;
      if (unitSearchQuery.trim()) {
        const q = unitSearchQuery.trim().toLowerCase();
        const codeMatch = u.code.toLowerCase().includes(q);
        const ownerMatch = u.owner?.name?.toLowerCase().includes(q);
        const floorMatch = String(u.floor) === q;
        if (!codeMatch && !ownerMatch && !floorMatch) return false;
      }
      return true;
    });
  }, [displayUnits, floorFilterStatus, unitSearchQuery]);

  // Điều phối chọn căn hộ
  const handleSelectApartment = (unit: ApartmentUnit) => {
    setSelectedAptCode(unit.code);
    if (unit.floor && unit.floor !== selectedFloor) {
      setSelectedFloor(unit.floor);
    }
  };

  // Điều hướng và chọn tầng thông minh - Đồng bộ 100% dữ liệu mặt bằng, số căn và hồ sơ căn hộ
  const handleSelectFloor = useCallback((targetFloor: number) => {
    const safeFloor = Math.max(0, Math.min(currentTotalFloors, targetFloor));
    setSelectedFloor(safeFloor);
    if (safeFloor >= 1) {
      // Chuyển mã căn hộ sang tầng mới tương ứng theo đúng vị trí
      const baseCode = selectedAptCode?.includes('-') ? selectedAptCode.split('-').pop() : (selectedAptCode || '');
      const newTargetCode = (safeFloor === 30 && selectedBlock === 'BS-07') ? (baseCode || '') : (baseCode ? `${safeFloor}-${baseCode}` : '');
      setSelectedAptCode(newTargetCode);
    }
  }, [currentTotalFloors, selectedAptCode, selectedBlock]);

  const handleSelectBlockAndShowFloors = (blockCode: any) => {
    handleSwitchBlock(blockCode);
    setBuildingPerspective('BUILDING_3D_FLOOR');
    };

  const handleSelectFloorAndShowUnits = (floor: number) => {
    handleSelectFloor(floor);
    setBuildingPerspective('BUILDING_3D_FLOOR');
  };

  const isAnyFilterActive = false;

  // Bộ tra cứu O(1) phục vụ lọc thống nhất trên toàn bộ hệ thống (3D, Mặt Đứng, Mặt Bằng, Lưới)
  const matchingUnitCodesSet = useMemo(() => {
    return new Set(filteredUnits.map(u => u.code.toUpperCase()));
  }, [filteredUnits]);

  const matchingFloorsSet = useMemo(() => {
    return new Set(filteredUnits.map(u => u.floor));
  }, [filteredUnits]);

  // Hàm kiểm tra thống nhất căn hộ có khớp bộ lọc hay không trên toàn bộ giao diện
  const isUnitMatchingFilter = useCallback((unitCode: string, floor?: number) => {
    if (!isAnyFilterActive) return true;
    const clean = unitCode.toUpperCase();
    if (matchingUnitCodesSet.has(clean)) return true;
    return filteredUnits.some(f => 
      f.code.toUpperCase() === clean || 
      f.code.toUpperCase().endsWith(`-${clean}`) || 
      clean.endsWith(`-${f.code.toUpperCase()}`) ||
      (floor !== undefined && f.floor === floor && (clean.includes(f.code.toUpperCase()) || f.code.toUpperCase().includes(clean)))
    );
  }, [isAnyFilterActive, matchingUnitCodesSet, filteredUnits]);

  // Cấu hình Tone màu sang trọng mặc định (Hoàng Gia Gold) cho phối cảnh BIM 3D
  const toneConfig = useMemo(() => ({
    GOLD_LUXURY: {
      id: 'GOLD_LUXURY' as BuildingColorTone,
      label: 'Hoàng Gia Gold',
      containerBg: buildingTheme === 'NIGHT' ? 'bg-[#040711]' : 'bg-[#091122]',
      gridLineColor: buildingTheme === 'NIGHT' ? '#1E293B' : '#C5A880',
      glassL: buildingTheme === 'NIGHT' ? ['#172033', '#0F1626', '#060A13'] : ['#22324F', '#152136', '#0B1322'],
      glassR: buildingTheme === 'NIGHT' ? ['#2D3D5A', '#1C293E', '#0B1320'] : ['#3A5074', '#25354F', '#111D30'],
      borderBuilding: '#C5A880',
      roofColor: '#172033',
      crownColor: '#D4AF37',
      titleColor: '#E6CA9E',
      laserBeamColor: '#C5A880',
      podiumGrad: ['#1A253A', '#0F1726', '#070C15'],
      accentTag: 'bg-[#C5A880] text-black',
      mullionColor: '#C5A880',
    },
  }), [buildingTheme]);

  // Thống kê toàn chung cư
  const totalUnitsCount = displayUnits.length;
  const occupiedCount = displayUnits.filter(u => u.status === 'OCCUPIED').length;
  const vacantCount = displayUnits.filter(u => u.status === 'VACANT').length;
  const maintenanceCount = displayUnits.filter(u => u.status === 'MAINTENANCE').length;
  const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedCount / totalUnitsCount) * 100) : 0;

  // Danh sách các tầng thực tế của chung cư (sắp xếp giảm dần từ tầng cao nhất xuống tầng 1)
  const buildingFloors = useMemo(() => {
    const list: number[] = [];
    for (let f = currentTotalFloors; f >= 1; f--) {
      list.push(f);
    }
    return list;
  }, [currentTotalFloors]);

  // Danh sách các căn hộ thuộc tầng đang chọn theo mặt bằng kiến trúc 21 căn The Tropical
  const floorUnits = useMemo(() => {
    return CAD_FLOOR_UNITS_CONFIG.map(cfg => {
      const chCode = cfg.code;
      const targetCode = (selectedFloor === 30 && selectedBlock === 'BS-07') ? chCode : `${selectedFloor}-${chCode}`;
      const found = displayUnits.find(u => 
        u.floor === selectedFloor && (
          u.code.toUpperCase() === chCode ||
          u.code.toUpperCase() === targetCode ||
          u.code.toUpperCase().endsWith(`-${chCode}`) ||
          u.code.toUpperCase().endsWith(chCode) ||
          u.code.toUpperCase().endsWith(`-${cfg.num}`) ||
          u.code.toUpperCase().endsWith(cfg.num) ||
          (selectedFloor === 30 && u.code === chCode)
        )
      );

      if (found) {
        return found;
      }

      return ({
        code: targetCode,
        tower: (selectedBlock === 'BS-09' || selectedBlock === 'BS-10') ? 'B' : 'A',
        towerName: currentBlockName,
        floor: selectedFloor,
        type: cfg.type,
        typeLabel: cfg.typeLabel,
        status: 'VACANT',
        statusLabel: 'Căn Hộ Trống',
        area: cfg.area,
        wallArea: Math.round(cfg.area * 1.08 * 10) / 10,
        bedrooms: cfg.beds,
        bathrooms: cfg.baths,
        direction: cfg.dir,
        priceBillion: cfg.defaultPrice,
      } as ApartmentUnit);
    });
  }, [displayUnits, selectedFloor, selectedBlock, currentBlockName]);

  const floorOccupiedCount = useMemo(() => floorUnits.filter(u => u.status === 'OCCUPIED').length, [floorUnits]);
  const floorMaintenanceCount = useMemo(() => floorUnits.filter(u => u.status === 'MAINTENANCE').length, [floorUnits]);
  const floorVacantCount = useMemo(() => floorUnits.filter(u => u.status === 'VACANT').length, [floorUnits]);

  // Căn hộ đang được chọn làm tiêu điểm hồ sơ - LUÔN THUỘC TẦNG ĐANG CHỌN (selectedFloor)
  const activeUnit = useMemo(() => {
    if (!floorUnits || floorUnits.length === 0) return null;

    // 1. Tìm chính xác theo mã căn hộ trong danh sách 21 căn của tầng đang chọn
    let unit = floorUnits.find(u => u.code === selectedAptCode);
    if (unit) return unit;

    // 2. Tìm theo số hiệu / mã đuôi căn hộ (ví dụ: 'CH-06' hoặc '30-CH-06' khớp với '12-CH-06')
    const baseCode = selectedAptCode?.includes('-') ? selectedAptCode.split('-').pop() : selectedAptCode;
    if (baseCode) {
      unit = floorUnits.find(u => 
        u.code === baseCode || 
        u.code === `${selectedFloor}-${baseCode}` ||
        u.code.endsWith(`-${baseCode}`) || 
        u.code.endsWith(baseCode)
      );
      if (unit) return unit;
    }

    // 3. Ưu tiên căn đã có người ở trên tầng này nếu có
    unit = floorUnits.find(u => u.status === 'OCCUPIED');
    if (unit) return unit;

    // 4. Mặc định là căn đầu tiên của tầng đang chọn
    return floorUnits[0] || null;
  }, [floorUnits, selectedAptCode, selectedFloor]);

  // Thống kê từng tầng của tòa nhà phục vụ mô hình 3D
  const floorStatsList = useMemo(() => {
    const list: Array<{ floor: number; total: number; occupied: number; maintenance: number; vacant: number }> = [];
    for (let fl = currentTotalFloors; fl >= 1; fl--) {
      const unitsOnFl = displayUnits.filter(u => u.floor === fl);
      const occupied = unitsOnFl.filter(u => u.status === 'OCCUPIED').length;
      const maintenance = unitsOnFl.filter(u => u.status === 'MAINTENANCE').length;
      const total = 21;
      const vacant = Math.max(0, total - occupied - maintenance);
      list.push({ floor: fl, total, occupied, maintenance, vacant });
    }
    return list;
  }, [displayUnits, currentTotalFloors]);

  const apartmentsResource = useAsyncResource(async () => {
    const res = await fetch('/api/apartments', { credentials: 'include' });
    if (!res.ok) throw new Error(`Không thể tải danh sách căn hộ (HTTP ${res.status})`);
    const json = await res.json();
    return Array.isArray(json?.apartments) ? json.apartments : [];
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {apartmentsResource.loading && <ResourceSkeleton label="Đang tải sơ đồ tòa nhà & căn hộ..." />}
      {!apartmentsResource.loading && apartmentsResource.error && (
        <ResourceError message={apartmentsResource.error} onRetry={apartmentsResource.retry} />
      )}
      {!apartmentsResource.loading && !apartmentsResource.error && displayUnits.length === 0 && (
        <ResourceEmpty message="Chưa có dữ liệu căn hộ nào trong tòa nhà." />
      )}
      {/* ============================================================= */}
      {/* 1. TIÊU ĐỀ HỆ THỐNG QUẢN LÝ CĂN HỘ BQL                        */}
      {/* ============================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#C5A880] font-semibold font-mono">
            {t('CHUNG CƯ THE TROPICAL • BEVERLY SOLARI', 'THE TROPICAL RESIDENCES • BEVERLY SOLARI')}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-0.5">
            {t('Sơ Đồ Tầng & Căn Hộ', 'Floor Plans & Residences')}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('Sơ đồ mặt bằng và trạng thái kỹ thuật căn hộ.', 'Floor layouts and unit technical operating status.')}
          </p>
        </div>

        {/* Nút hành động BQL */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider rounded-none transition-all shadow-lg active:scale-95"
          >
            {t('Thêm Căn Hộ Mới', 'Add New Unit')}
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* BỘ LỌC TINH GỌN BQL: CHUNG CƯ • TẦNG • TÌM KIẾM • TRẠNG THÁI   */}
      {/* ============================================================= */}
      {/* ============================================================= */}
      {/* BỘ LỌC TINH GỌN BQL: CHUNG CƯ • TẦNG • TÌM KIẾM • TRẠNG THÁI   */}
      {/* ============================================================= */}
      <div className="bg-[#0B121D] border border-[#1E2D42] p-2.5 shadow-lg space-y-2.5">
        {/* HÀNG 1: CHỌN CHUNG CƯ (TRÁI) & CHỌN TẦNG + NÚT ĐỒNG BỘ (PHẢI) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* 1. CHỌN CHUNG CƯ */}
          <div className="flex items-center gap-1 bg-[#121B27] border border-[#1E2D42] p-1 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="text-gray-400 font-medium text-[11px] px-1.5 flex items-center gap-1 shrink-0">
              <Building className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="hidden sm:inline">{t('Chung Cư:', 'Building:')}</span>
            </span>
            {[
              { code: 'BS-07', name: 'BS-07', floors: 34 },
              { code: 'BS-08', name: 'BS-08', floors: 39 },
              { code: 'BS-09', name: 'BS-09', floors: 34 },
              { code: 'BS-10', name: 'BS-10', floors: 34 },
            ].map(b => {
              const isCurrent = selectedBlock === b.code;
              return (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => handleSwitchBlock(b.code as any)}
                  className={`px-2.5 py-1 text-xs font-mono transition-all flex items-center gap-1 border shrink-0 active:scale-95 ${
                    isCurrent
                      ? 'bg-[#C5A880] text-black border-[#C5A880] font-bold shadow'
                      : 'bg-[#0E1521] text-gray-300 border-[#1B293C] hover:border-[#385175] hover:text-white'
                  }`}
                >
                  <span>{b.name}</span>
                  <span className={`text-[9.5px] px-1 ${isCurrent ? 'bg-black/20 text-black font-bold' : 'bg-[#152132] text-cyan-300'}`}>
                    {b.floors}T
                  </span>
                </button>
              );
            })}
          </div>

          {/* 2. CHỌN TẦNG TINH GỌN & NÚT ĐỒNG BỘ BQL */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-[#121B27] border border-[#1E2D42] p-1 shrink-0">
              <span className="text-gray-400 font-medium text-[11px] px-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden sm:inline">{t('Tầng:', 'Floor:')}</span>
              </span>

              <button
                type="button"
                onClick={() => handleSelectFloor(selectedFloor - 1)}
                disabled={selectedFloor <= 0}
                className="w-6 h-6 flex items-center justify-center bg-[#1A2536] hover:bg-[#25354D] text-gray-300 hover:text-white disabled:opacity-30 border border-[#2C3E56]"
                title={t('Tầng bên dưới', 'Lower floor')}
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              
              <select
                value={selectedFloor}
                onChange={(e) => handleSelectFloor(Number(e.target.value))}
                className="bg-[#182333] border border-[#2D3E56] text-white font-mono font-bold text-xs px-2 py-0.5 outline-none focus:border-[#C5A880] cursor-pointer"
              >
                <option value={0}>{t('Sảnh (G) - Dịch Vụ', 'Lobby (G) - Service')}</option>
                {buildingFloors.map(f => (
                  <option key={f} value={f}>
                    {t('Tầng', 'Floor')} {f} {f === 30 ? `(${t('Chủ Hộ', 'Resident')})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleSelectFloor(selectedFloor + 1)}
                disabled={selectedFloor >= currentTotalFloors}
                className="w-6 h-6 flex items-center justify-center bg-[#1A2536] hover:bg-[#25354D] text-gray-300 hover:text-white disabled:opacity-30 border border-[#2C3E56]"
                title={t('Tầng bên trên', 'Upper floor')}
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Nút Đồng bộ dữ liệu BQL */}
            <button
              type="button"
              onClick={() => syncLiveApartmentsFromApi(selectedBlock)}
              disabled={isSyncingApi}
              className="p-1.5 bg-[#121B27] hover:bg-[#1A2536] text-gray-300 hover:text-white border border-[#1E2D42] transition-colors disabled:opacity-50 shrink-0"
              title={t('Đồng bộ dữ liệu cư dân mới nhất', 'Sync latest resident data')}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C5A880] ${isSyncingApi ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* HÀNG 2: BỘ LỌC TRẠNG THÁI (TRÁI) & Ô TÌM NHANH MỞ RỘNG TOÀN BỘ KHOẢNG TRỐNG (PHẢI) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1.5 border-t border-[#162233]">
          {/* Cụm bộ lọc trạng thái */}
          <div className="flex items-center gap-1 bg-[#121B27] border border-[#1E2D42] p-1 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
            {[
              { key: 'ALL', label: t('Tất Cả', 'All'), count: totalUnitsCount, countColor: 'text-gray-300' },
              { key: 'OCCUPIED', label: t('Đã Ở', 'Occupied'), count: occupiedCount, countColor: 'text-emerald-400' },
              { key: 'VACANT', label: t('Căn Trống', 'Vacant'), count: vacantCount, countColor: 'text-amber-400' },
              { key: 'MAINTENANCE', label: t('Bảo Trì', 'Maintenance'), count: maintenanceCount, countColor: 'text-blue-400' },
            ].map(item => {
              const isActive = floorFilterStatus === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFloorFilterStatus(item.key as any)}
                  className={`px-2.5 py-1 text-xs transition-all flex items-center gap-1.5 border shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-[#C5A880] text-black border-[#C5A880] font-bold shadow'
                      : 'bg-[#0E1521] text-gray-300 border-[#1B293C] hover:border-[#385175] hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`text-[10px] font-mono px-1 py-0.2 ${
                    isActive ? 'bg-black/20 text-black font-bold' : `${item.countColor} bg-[#152132]`
                  }`}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ô TÌM NHANH CĂN HỘ - DÙNG FLEX-1 LẤP TRỌN TOÀN BỘ KHOẢNG TRỐNG BÊN PHẢI */}
          <div className="relative flex-1 min-w-[200px] flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t('Tìm nhanh mã căn hộ (VD: 06, CH-01, BS-07-30.06)...', 'Search unit code (e.g. 06, CH-01, BS-07-30.06)...')}
              value={unitSearchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setUnitSearchQuery(val);
                if (val.trim()) {
                  const clean = val.trim().toLowerCase();
                  const match = floorUnits.find(u => u.code.toLowerCase().includes(clean)) 
                              || displayUnits.find(u => u.code.toLowerCase().includes(clean));
                  if (match) {
                    setSelectedAptCode(match.code);
                    if (match.floor && match.floor !== selectedFloor) {
                      setSelectedFloor(match.floor);
                    }
                  }
                }
              }}
              className="w-full pl-8 pr-7 py-1.5 bg-[#121B27] border border-[#1E2D42] text-white text-xs placeholder-gray-500 outline-none focus:border-[#C5A880] transition-all font-mono"
            />
            {unitSearchQuery && (
              <button
                type="button"
                onClick={() => setUnitSearchQuery('')}
                className="absolute right-2.5 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. KHU VỰC CHÍNH: SƠ ĐỒ CHUNG CƯ & HỒ SƠ CHI TIẾT CĂN HỘ       */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI: SƠ ĐỒ CHUNG CƯ / MÔ HÌNH 3D / DANH SÁCH */}
        <div className={`${(buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') ? 'lg:col-span-6' : 'lg:col-span-7'} bg-[#0D1117] border border-[#222B35] rounded-none overflow-hidden shadow-2xl flex flex-col`}>
          
          {/* THANH ĐIỀU HÀNH GÓC NHÌN DUY NHẤT (SINGLE UNIFIED VIEWPORT TOOLBAR) */}
          <div className="px-2 sm:px-3 py-1.5 bg-[#0E1520] border-b border-[#222B35] flex items-center justify-between gap-2 text-xs">
            {/* 3 Tab Chuyển Đổi Góc Nhìn Chuẩn BQL */}
            <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth bg-[#070B11] p-0.5 border border-[#1E2A38] text-xs font-semibold shrink-0">
              {/* Tab 1: Quy Hoạch */}
              <button
                type="button"
                onClick={() => {
                  setBuildingPerspective('MASTER_PLAN');
                  setMasterPlanTab('TROPICAL');
                }}
                className={`px-3 py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                  buildingPerspective === 'MASTER_PLAN'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title={t('Bản đồ quy hoạch phân khu The Tropical và tiện ích nội/ngoại khu', 'The Tropical master plan and amenities')}
              >
                <Map className="w-3.5 h-3.5 shrink-0" />
                <span>{t('Khuôn Viên & Tiện Ích', 'Master Plan & Amenities')}</span>
              </button>

              {/* Tab 2: Số Tầng & Mặt Bằng 3D (Gộp Số Tầng, Mặt Bằng và Mô Hình 3D) */}
              <button
                type="button"
                onClick={() => {
                  setBuildingPerspective('BUILDING_3D_FLOOR');
                  }}
                className={`px-3 py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                  buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title={t('Mô hình 3D thống kê số tầng và xem mặt bằng căn hộ trực quan', '3D model and floor blueprint')}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>{t('Số Tầng & Mặt Bằng 3D', '3D Tower & Floors')}</span>
                <span className={`text-[9.5px] px-1.5 py-0.2 font-mono font-bold ${
                  (buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN')
                    ? 'bg-black/20 text-black' 
                    : 'text-amber-300'
                }`}>
                  {selectedBlock} • {selectedFloor === 0 ? 'Sảnh (G)' : `T${selectedFloor}`}
                </span>
              </button>

              {/* Tab 3: Lưới Căn Hộ */}
              <button
                type="button"
                onClick={() => setBuildingPerspective('GRID')}
                className={`px-3 py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                  buildingPerspective === 'GRID'
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title={t('Danh sách toàn bộ căn hộ dạng bảng lưới', 'Apartment directory grid view')}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>{t('Danh Sách Căn Hộ', 'Units Directory')}</span>
              </button>
            </div>

            {/* BÊN PHẢI: BỘ CÔNG CỤ THEO NGỮ CẢNH CỦA VIEW */}
            <div className="flex items-center gap-2 shrink-0">
              {buildingPerspective === 'MASTER_PLAN' && (
                <button
                  type="button"
                  onClick={() => setIsMasterPlanZoomed(true)}
                  className="px-2.5 py-1 bg-[#141E2B] hover:bg-[#C5A880] text-[#C5A880] hover:text-black border border-[#223348] text-xs font-mono font-bold transition-all flex items-center gap-1 shrink-0"
                  title={t('Phóng to toàn cảnh', 'Full screen view')}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('Toàn Cảnh', 'Full View')}</span>
                </button>
              )}

              {(buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#141E2B] border border-[#233345] text-[11px] font-mono shrink-0">
                    <span className="text-gray-400">{t('Đang chiếu:', 'Displaying:')}</span>
                    <strong className="text-amber-300">{selectedFloor === 0 ? t("Tầng Sảnh (G)", "Lobby (G)") : `${t("Tầng", "Floor")} ${selectedFloor}`}</strong>
                    <span className="text-gray-600">•</span>
                    <strong className="text-[#C5A880]">{t('Căn', 'Unit')} {selectedAptCode}</strong>
                  </div>

                  {/* Lọc khoảng tầng */}
                  <div className="flex items-center gap-1 font-mono text-[10.5px]">
                    {[
                      { key: 'ALL', label: t('Tất Cả Tầng', 'All Floors') },
                      { key: 'LOW', label: t('Tầng Thấp (1-10)', 'Low (1-10)') },
                      { key: 'MID', label: t('Tầng Trung (11-20)', 'Mid (11-20)') },
                      { key: 'HIGH', label: t('Tầng Cao (21+)', 'High (21+)') }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedFloorRange(item.key as FloorRangeFilter)}
                        className={`px-2 py-0.5 border transition-all ${
                          selectedFloorRange === item.key
                            ? 'bg-[#C5A880] text-black font-bold border-[#C5A880]'
                            : 'bg-[#141E2B] text-gray-300 border-[#233345] hover:text-white'
                        }`}
                        title={`Lọc tầng: ${item.label}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Chế độ Ngày / Đêm */}
                  <button
                    type="button"
                    onClick={() => setBuildingTheme(buildingTheme === 'NIGHT' ? 'DAY' : 'NIGHT')}
                    className="px-2 py-0.5 bg-[#141E2B] hover:bg-[#1E2E40] border border-[#233345] text-white text-[10.5px] font-mono transition-all shrink-0"
                    title={buildingTheme === 'NIGHT' ? 'Chuyển sang chế độ Ban Ngày' : 'Chuyển sang chế độ Ban Đêm'}
                  >
                    <span>{buildingTheme === 'NIGHT' ? t('Đêm', 'Night') : t('Ngày', 'Day')}</span>
                  </button>
                </div>
              )}

              {buildingPerspective === 'GRID' && (
                <div className="text-[11px] font-mono text-[#C5A880] px-2.5 py-0.5 bg-[#141E2B] border border-[#233345]">
                  {filteredUnits.length}/{displayUnits.length} {t('căn', 'units')}
                </div>
              )}
            </div>
          </div>

          {/* THANH PHÂN CẤP BẢN ĐỒ QUY HOẠCH TINH GỌN (MASTER PLAN SCOPE TABS) */}
          {buildingPerspective === 'MASTER_PLAN' && (
            <div className="px-2 sm:px-3 py-1.5 bg-[#090E17] border-b border-[#1E293B] flex items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1 bg-[#121A26] p-0.5 border border-[#202E42]">
                <button
                  type="button"
                  onClick={() => setMasterPlanTab('TROPICAL')}
                  className={`px-2.5 py-1 text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    masterPlanTab === 'TROPICAL'
                      ? 'bg-[#C5A880] text-black font-bold shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={isEn ? 'The Tropical subdivision & 23 internal amenities' : 'Phân khu The Tropical và 23 tiện ích nội khu'}
                >
                  <Map className="w-3.5 h-3.5 shrink-0" />
                  <span>The Tropical (23)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMasterPlanTab('SURROUNDINGS')}
                  className={`px-2.5 py-1 text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    masterPlanTab === 'SURROUNDINGS'
                      ? 'bg-[#C5A880] text-black font-bold shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={isEn ? 'Lagoon city & surrounding amenities system' : 'Hệ thống tiện ích thành phố biển hồ & xung quanh'}
                >
                  <Waves className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('Tiện Ích Biển Hồ (8)', 'Lagoon Amenities (8)')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMasterPlanTab('MACRO')}
                  className={`px-2.5 py-1 text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    masterPlanTab === 'MACRO'
                      ? 'bg-[#C5A880] text-black font-bold shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={isEn ? 'Vinhomes Grand Park 271ha mega master plan' : 'Quy hoạch tổng thể đại đô thị Vinhomes Grand Park 271 ha'}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('Đại Đô Thị (271ha)', 'Mega City (271ha)')}</span>
                </button>
              </div>

              <div className="text-[11px] text-gray-400 hidden sm:flex items-center gap-1 shrink-0">
                <span className="text-[#C5A880]">💡</span>
                <span>{t('Bấm chọn khối Chung Cư để xem số tầng', 'Click a building to view floors')}</span>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 1: MÔ HÌNH KHỐI 3D KIẾN TRÚC CHUNG CƯ & SỐ TẦNG */}
          {/* ----------------------------------------------------------- */}
          {(buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') && (
            <IsometricBuilding3DView
              selectedBlock={selectedBlock}
              selectedFloor={selectedFloor}
              onSelectFloor={handleSelectFloor}
              hoveredFloor={hoveredFloor}
              setHoveredFloor={setHoveredFloor}
              currentTotalFloors={currentTotalFloors}
              occupancyRate={occupancyRate}
              toneConfig={toneConfig}
              building3dZoom={building3dZoom}
              setBuilding3dZoom={setBuilding3dZoom}
              reset3dTransform={reset3dTransform}
              building3dPan={building3dPan}
              handle3dMouseDown={handle3dMouseDown}
              handle3dMouseMove={handle3dMouseMove}
              handle3dMouseUp={handle3dMouseUp}
              handle3dTouchStart={handle3dTouchStart}
              handle3dTouchMove={handle3dTouchMove}
              handle3dTouchEnd={handle3dTouchEnd}
              selectedFloorRange={selectedFloorRange}
              buildingTheme={buildingTheme}
              currentBlockName={currentBlockName}
              floorStatsList={floorStatsList}
              floorOccupiedCount={floorOccupiedCount}
            />
          )}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 2: DANH SÁCH LƯỚI CĂN HỘ                          */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'GRID' && (
            <div className="p-4 bg-[#05070A] h-[540px] sm:h-[600px] overflow-y-auto space-y-3">
              <div className="text-xs text-gray-400 font-mono mb-2 flex items-center justify-between">
                <span>{t('Danh Sách Căn Hộ', 'Apartment Directory')} ({filteredUnits.length} {t('căn phù hợp', 'matching units')}):</span>
                <span className="text-[11px] text-[#C5A880]">{t('Nhấn vào từng ô để xem chi tiết bên phải', 'Click any unit to view details on the right')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredUnits.map(unit => {
                  const isSelected = unit.code === selectedAptCode;
                  const isOccupied = unit.status === 'OCCUPIED';
                  const isMaint = unit.status === 'MAINTENANCE';

                  return (
                    <div
                      key={unit.code}
                      onClick={() => setSelectedAptCode(unit.code)}
                      className={`p-3 rounded-none border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1C2533] border-[#C5A880] ring-1 ring-[#C5A880] shadow-xl'
                          : 'bg-[#121820] border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <div>
                        <div className="font-serif text-base font-bold text-white flex items-center gap-2">
                          <span>{t('Căn', 'Unit')} {unit.code}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-[#161B22] border border-gray-700 text-[#C5A880] font-sans">
                            {unit.typeLabel}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {unit.towerName} • {t('Tầng', 'Floor')} {unit.floor} • {unit.area} m²
                        </div>
                        {isOccupied && unit.owner?.name && (
                          <div className="text-[11px] text-emerald-400 mt-1 font-medium truncate">
                            {unit.owner.name}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                          isOccupied
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : isMaint
                            ? 'bg-blue-950 text-blue-300 border-blue-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                        }`}>
                          {isOccupied ? t('Đã Ở', 'Occupied') : isMaint ? t('Nghiệm Thu', 'Inspection') : t('Trống', 'Vacant')}
                        </span>
                        <div className="text-[11px] font-mono text-[#C5A880] mt-1.5 font-bold">
                          {unit.priceBillion} {t('tỷ VNĐ', 'Billion VND')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}

          {/* ----------------------------------------------------------- */}
          {/* GÓC NHÌN 3: BẢN ĐỒ QUY HOẠCH ĐÔ THỊ & KIẾN TRÚC PHÂN KHU    */}
          {/* ----------------------------------------------------------- */}
          {/* ----------------------------------------------------------- */}
          {buildingPerspective === 'MASTER_PLAN' && (
            <div className="h-[660px] sm:h-[760px] bg-[#070B12] overflow-y-auto no-scrollbar select-none flex flex-col">
              
              {/* SUB-VIEW 1: PHÂN KHU THE TROPICAL - BẢN ĐỒ MẶT BẰNG QUY HOẠCH THỰC TẾ & 23 TIỆN ÍCH */}
              {masterPlanTab === 'TROPICAL' && (
                <TropicalCampusSvgModel
                  amenities={THE_TROPICAL_AMENITIES}
                  selectedBlock={selectedBlock}
                  onSelectBlock={handleSwitchBlock}
                  onSelectBlockAndShowFloors={handleSelectBlockAndShowFloors}
                  selectedAmenityId={selectedAmenityId}
                  onSelectAmenity={setSelectedAmenityId}
                  hoveredAmenityId={hoveredAmenityId}
                  onHoverAmenity={setHoveredAmenityId}
                  onOpenZoomModal={() => setIsMasterPlanZoomed(true)}
                />
              )}

              {/* SUB-VIEW 2: TIỆN ÍCH XUNG QUANH CỦA DỰ ÁN & KHU DÂN CƯ */}
              {masterPlanTab === 'SURROUNDINGS' && (
                <div className="flex-1 flex flex-col space-y-2 p-2">
                  {/* MÔ HÌNH BẢN ĐỒ TIỆN ÍCH THÀNH PHỐ BIỂN HỒ */}
                  <SurroundingRadarSvgModel
                    amenities={SURROUNDING_AMENITIES}
                    selectedBlock={selectedBlock}
                    selectedAmenityId={selectedAmenityId}
                    onSelectAmenity={setSelectedAmenityId}
                    hoveredAmenityId={hoveredAmenityId}
                    onHoverAmenity={setHoveredAmenityId}
                    onOpenZoomModal={() => setIsMasterPlanZoomed(true)}
                  />

                  {/* Danh sách các tiện ích xung quanh của dự án & khu dân cư (HOVER XEM TIỆN ÍCH) */}
                  <div className="p-2.5 bg-[#111622] border border-[#222E3E] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>{t('DANH SÁCH 8 ĐẠI TIỆN ÍCH XUNG QUANH KHU DÂN CƯ', '8 SIGNATURE AMENITIES SURROUNDING THE RESIDENCE')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300">
                        {t('Bán kính:', 'Radius:')} 50m - 750m
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                      {SURROUNDING_AMENITIES.map((sur) => {
                        const isHovered = hoveredAmenityId === sur.id;
                        const isSel = selectedAmenityId === sur.id;
                        const isHighlighted = isHovered || isSel;
                        return (
                          <div
                            key={sur.id}
                            onMouseEnter={() => setHoveredAmenityId(sur.id)}
                            onMouseLeave={() => setHoveredAmenityId(null)}
                            onClick={() => setSelectedAmenityId(isSel ? null : sur.id)}
                            className={`p-2.5 border text-left cursor-pointer transition-all ${
                              isHighlighted
                                ? 'bg-[#1C2838] border-[#C5A880] ring-1 ring-[#C5A880]'
                                : 'bg-[#131A24] border-[#222E3E] hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`w-6 h-6 rounded-none flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                                isHighlighted
                                  ? 'bg-[#C5A880] text-black border border-white'
                                  : 'bg-[#182333] text-[#C5A880] border border-[#283C57]'
                              }`}>
                                {sur.id.replace('SUR-', '')}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-bold text-white truncate">
                                    {sur.name}
                                  </div>
                                  <span className="text-[10px] text-cyan-300 font-mono shrink-0 ml-1">
                                    {sur.distance}
                                  </span>
                                </div>
                                <div className="text-[10.5px] text-[#C5A880] font-mono mt-0.5">
                                  {sur.categoryLabel} • {sur.walkTime}
                                </div>
                                <div className="text-[10.5px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                  {sur.desc}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 3: QUY HOẠCH TỔNG THỂ ĐẠI ĐÔ THỊ VINHOMES GRAND PARK */}
              {masterPlanTab === 'MACRO' && (
                <div className="flex-1 flex flex-col space-y-2 p-2">
                  {/* BẢN ĐỒ QUY HOẠCH TỔNG THỂ ĐẠI ĐÔ THỊ 271HA THỰC TẾ */}
                  <MacroCitySvgModel
                    selectedBlock={selectedBlock}
                    selectedAmenityId={selectedAmenityId}
                    onSelectAmenity={setSelectedAmenityId}
                    onSelectTropical={() => setMasterPlanTab('TROPICAL')}
                    onOpenZoomModal={() => setIsMasterPlanZoomed(true)}
                  />

                  {/* Hạ tầng trọng điểm */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-[#C5A880] font-bold">{t('TTTM Vincom Mega Mall', 'Vincom Mega Mall')}</div>
                      <div className="text-gray-400 text-[10.5px] mt-1">
                        {t('Trung tâm thương mại lớn nhất miền Nam, cách The Tropical 2 phút dạo bộ', 'Southern Vietnam largest mall, 2 mins walk from The Tropical')}
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-emerald-400 font-bold">{t('Đại Công Viên 36ha', '36ha Grand Park')}</div>
                      <div className="text-gray-400 text-[10.5px] mt-1">
                        {t('Hồ cảnh quan cát trắng, bãi biển nhân tạo và 15 công viên chủ đề liên hoàn', 'White sand lagoon, artificial beach, and 15 continuous theme parks')}
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#111622] border border-[#222E3E]">
                      <div className="text-cyan-400 font-bold">{t('Vành Đai 3 & Tuyến VinBus', 'Ring Road 3 & VinBus Network')}</div>
                      <div className="text-gray-400 text-[10.5px] mt-1">
                        {t('Huyết mạch giao thông kết nối liên vùng & mạng lưới xe buýt điện thông minh', 'Key regional arterial expressway & smart electric bus network')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ============================================================= */}
        {/* CỘT PHẢI: CONSOLE ĐIỀU HÀNH & THÔNG TIN CĂN HỘ               */}
        {/* ============================================================= */}
        <div className={`${(buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') ? 'lg:col-span-6' : 'lg:col-span-5'} bg-[#0D1117] border border-[#222B35] rounded-none p-4 shadow-2xl min-h-[660px] sm:min-h-[760px] flex flex-col justify-between overflow-hidden`}>
          {buildingPerspective === 'MASTER_PLAN' ? (
            <MasterPlanAmenitiesConsole
              selectedAmenityId={selectedAmenityId}
              hoveredAmenityId={hoveredAmenityId}
              setSelectedAmenityId={setSelectedAmenityId}
              setHoveredAmenityId={setHoveredAmenityId}
              selectedBlock={selectedBlock}
              onSwitchBlock={(b: string) => handleSwitchBlock(b as any)}
              onSelectBlockAndShowFloors={handleSelectBlockAndShowFloors}
              onSelectFloor={handleSelectFloor}
            />
          ) : (buildingPerspective === 'BUILDING_3D_FLOOR' || buildingPerspective === '3D' || buildingPerspective === 'BUILDING_ELEVATION' || buildingPerspective === 'FLOOR_PLAN') ? (
            selectedFloor === 1 ? (
              <LobbyFloorPlanConsole
                selectedBlock={selectedBlock}
                onSelectFloor={handleSelectFloor}
                selectedLobbyZone={selectedLobbyZone}
                setSelectedLobbyZone={setSelectedLobbyZone}
              />
            ) : (
              <FloorUnitCadPlanView
                selectedFloor={selectedFloor}
                selectedBlock={selectedBlock}
                floorUnits={floorUnits}
                floorOccupiedCount={floorOccupiedCount}
                floorMaintenanceCount={floorMaintenanceCount}
                floorVacantCount={floorVacantCount}
                activeUnit={activeUnit}
                selectedAptCode={selectedAptCode}
                onSelectApartment={handleSelectApartment}
                onOpenFloorPlanExpanded={() => setIsFloorPlanExpanded(true)}
                onOpenAssignModal={(unit) => {
                  setAssigningApartment(unit);
                  setIsAssignModalOpen(true);
                }}
                onOpenDetailModal={() => setIsDetailModalOpen(true)}
                onOpenEditModal={() => setIsEditModalOpen(true)}
              />
            )
          ) : (
            <ApartmentProfilePanel
              activeUnit={activeUnit}
              onOpenAssignModal={(unit) => {
                setAssigningApartment(unit);
                setIsAssignModalOpen(true);
              }}
              onOpenEditModal={() => setIsEditModalOpen(true)}
              onOpenDetailModal={() => setIsDetailModalOpen(true)}
              onOpenFloorPlanModal={() => setIsFloorPlanExpanded(true)}
            />
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* Modal Bàn Giao Cư Dân Mới */}
      {isAssignModalOpen && (assigningApartment || activeUnit) && (
        <AssignResidentModal
          isOpen={isAssignModalOpen}
          onClose={() => { setIsAssignModalOpen(false); setAssigningApartment(null); }}
          unit={assigningApartment || activeUnit}
          onSuccess={() => {
            syncLiveApartmentsFromApi(selectedBlock);
          }}
        />
      )}

      {/* Modal Chỉnh Sửa Thông Số Căn Hộ */}
      {isEditModalOpen && activeUnit && (
        <EditApartmentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          unit={activeUnit}
          onSuccess={() => {
            syncLiveApartmentsFromApi(selectedBlock);
          }}
        />
      )}

      {/* Modal Thêm Căn Hộ Mới */}
      {isAddModalOpen && (
        <AddApartmentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          currentBlock={selectedBlock}
          onSuccess={(newUnit) => {
            syncLiveApartmentsFromApi(selectedBlock);
            setSelectedAptCode(newUnit.code);
          }}
        />
      )}

      {/* Modal Xem 3D Nội Thất & Chi Tiết */}
      {isDetailModalOpen && activeUnit && (
        <ApartmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          unit={activeUnit}
          onEditUnit={() => {
            setIsDetailModalOpen(false);
            setIsEditModalOpen(true);
          }}
          onAssignResident={() => {
            setIsDetailModalOpen(false);
            setIsAssignModalOpen(true);
          }}
          onRefresh={() => syncLiveApartmentsFromApi(selectedBlock)}
        />
      )}


      {/* 5. MODAL MỞ RỘNG MẶT BẰNG CAD TẦNG (DEEP-DIVE) */}
      <FloorPlanDeepDiveModal
        isOpen={isFloorPlanExpanded}
        onClose={() => setIsFloorPlanExpanded(false)}
        selectedFloor={selectedFloor}
        selectedBlock={selectedBlock}
        currentBlockName={currentBlockName}
        apartments={apartments}
        selectedAptCode={selectedAptCode}
        onSelectAptCode={(code) => setSelectedAptCode(code)}
        onOpenAssignModal={(unit) => {
          setAssigningApartment(unit);
          setIsAssignModalOpen(true);
        }}
        onOpenDetailModal={() => setIsDetailModalOpen(true)}
      />

      {/* 6. MODAL PHÓNG TO BẢN ĐỒ QUY HOẠCH TOÀN MÀN HÌNH */}
      <MasterPlanFullscreenModal
        isOpen={isMasterPlanZoomed}
        onClose={() => {
          setIsMasterPlanZoomed(false);
          setModalZoomScale(1);
        }}
        masterPlanTab={masterPlanTab}
        setMasterPlanTab={setMasterPlanTab}
        modalZoomScale={modalZoomScale}
        setModalZoomScale={setModalZoomScale}
        modalShowPins={modalShowPins}
        setModalShowPins={setModalShowPins}
        selectedBlock={selectedBlock}
        onSwitchBlock={(b: string) => handleSwitchBlock(b as any)}
        selectedAmenityId={selectedAmenityId}
        onSelectAmenity={setSelectedAmenityId}
        hoveredAmenityId={hoveredAmenityId}
        onHoverAmenity={setHoveredAmenityId}
      />

    </div>
  );
}
