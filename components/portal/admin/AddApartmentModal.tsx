'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Building, 
  Check, 
  Plus, 
  AlertCircle, 
  Layers, 
  Compass,
  FileText,
  Zap,
  Droplets,
  Key,
  ShieldCheck,
  Coins,
  TrendingUp,
  SlidersHorizontal,
  Home,
  Sun,
  Wind,
  Sparkles
} from 'lucide-react';
import { 
  ApartmentUnit, 
  ApartmentType, 
  ApartmentStatus, 
  addApartmentUnit 
} from '@/lib/apartmentStore';
import { useLanguage } from '@/lib/languageContext';

interface AddApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUnit: ApartmentUnit) => void;
  currentBlock?: 'BS-07' | 'BS-08' | 'BS-09' | 'BS-10';
}

type TabType = 'ARCHITECTURE' | 'IOT_TECHNICAL' | 'FINANCE_LEGAL';

export default function AddApartmentModal({
  isOpen,
  onClose,
  onSuccess,
  currentBlock = 'BS-07'
}: AddApartmentModalProps) {
  useEscapeKey(isOpen, onClose);
  const { t, isEn } = useLanguage();
  // Tab Ä‘iá»u hÆ°á»›ng form
  const [activeTab, setActiveTab] = useState<TabType>('ARCHITECTURE');

  // 1. Kiáº¿n trÃºc & Vá»‹ trÃ­
  const [floor, setFloor] = useState<number>(12);
  const [unitSlot, setUnitSlot] = useState<string>('06');
  const [code, setCode] = useState<string>('12-CH-06');
  const [towerSide, setTowerSide] = useState<'LEFT' | 'RIGHT'>('LEFT');
  const [type, setType] = useState<ApartmentType>('2PN');
  const [area, setArea] = useState<number>(78.5);
  const [wallArea, setWallArea] = useState<number>(83.2);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [direction, setDirection] = useState('ÄÃ´ng Nam');
  const [mainDoorDirection, setMainDoorDirection] = useState('TÃ¢y Báº¯c');
  const [viewDescription, setViewDescription] = useState('View SÃ´ng SÃ i GÃ²n & Há»“ BÆ¡i Ná»™i Khu');

  // 2. Háº¡ táº§ng IoT & Ká»¹ thuáº­t PCCC
  const [electricMeterId, setElectricMeterId] = useState('EM-12A06-IoT');
  const [waterMeterId, setWaterMeterId] = useState('WM-12A06-SKY');
  const [initialElectric, setInitialElectric] = useState<number>(12.5);
  const [initialWater, setInitialWater] = useState<number>(1.2);
  const [hasSprinkler, setHasSprinkler] = useState<boolean>(true);
  const [hasSmokeSensor, setHasSmokeSensor] = useState<boolean>(true);
  const [hasIntercom, setHasIntercom] = useState<boolean>(true);

  // 3. TÃ i chÃ­nh, PhÃ¡p lÃ½ & BÃ n giao
  const [priceBillion, setPriceBillion] = useState<number>(4.85);
  const [estimatedRentPrice, setEstimatedRentPrice] = useState<number>(19500000);
  const [managementUnitPrice, setManagementUnitPrice] = useState<number>(18000);
  const [legalStatus, setLegalStatus] = useState<'Sá»• há»“ng lÃ¢u dÃ i' | 'Há»£p Ä‘á»“ng mua bÃ¡n SPA'>('Sá»• há»“ng lÃ¢u dÃ i');
  const [finishingStandard, setFinishingStandard] = useState('HoÃ n thiá»‡n cao cáº¥p Full ná»™i tháº¥t 5 sao');
  const [keysCount, setKeysCount] = useState<number>(3);
  const [cardsCount, setCardsCount] = useState<number>(2);
  const [status, setStatus] = useState<ApartmentStatus>('VACANT');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Tá»± Ä‘á»™ng tÃ­nh phÃ­ quáº£n lÃ½
  const calculatedMonthlyFee = useMemo(() => {
    return Math.round(area * managementUnitPrice);
  }, [area, managementUnitPrice]);

  // Tá»· suáº¥t sinh lá»i cho thuÃª Æ°á»›c tÃ­nh (%/nÄƒm)
  const calculatedRentalYield = useMemo(() => {
    if (!priceBillion || priceBillion <= 0) return 0;
    return (((estimatedRentPrice * 12) / (priceBillion * 1000000000)) * 100).toFixed(1);
  }, [estimatedRentPrice, priceBillion]);

  if (!isOpen) return null;

  // Khi thay Ä‘á»•i Táº§ng hoáº·c Sá»‘ cÄƒn -> Tá»± gá»£i Ã½ mÃ£ cÄƒn & mÃ£ Ä‘á»“ng há»“ IoT
  const handleFloorChange = (newFloor: number, newSlot?: string) => {
    setFloor(newFloor);
    const slot = newSlot !== undefined ? newSlot : unitSlot;
    const floorPrefix = newFloor < 10 ? `0${newFloor}` : `${newFloor}`;
    const generatedCode = `${floorPrefix}-CH-${slot}`;
    setCode(generatedCode);
    setElectricMeterId(`EM-${generatedCode}-IoT`);
    setWaterMeterId(`WM-${generatedCode}-SKY`);
  };

  const handleSlotChange = (newSlot: string) => {
    setUnitSlot(newSlot);
    handleFloorChange(floor, newSlot);
  };

  // Khi chá»n loáº¡i cÄƒn há»™ -> Tá»± Ä‘á»™ng Ä‘iá»n cÃ¡c thÃ´ng sá»‘ ká»¹ thuáº­t & Ä‘á»‹nh giÃ¡ chuáº©n
  const handleTypeChange = (selectedType: ApartmentType) => {
    setType(selectedType);
    if (selectedType === '1PN') {
      setArea(52.0);
      setWallArea(56.4);
      setBedrooms(1);
      setBathrooms(1);
      setPriceBillion(3.20);
      setEstimatedRentPrice(13500000);
    } else if (selectedType === '2PN') {
      setArea(78.5);
      setWallArea(83.2);
      setBedrooms(2);
      setBathrooms(2);
      setPriceBillion(4.85);
      setEstimatedRentPrice(19500000);
    } else if (selectedType === '3PN') {
      setArea(112.0);
      setWallArea(119.5);
      setBedrooms(3);
      setBathrooms(3);
      setPriceBillion(7.60);
      setEstimatedRentPrice(28000000);
    } else if (selectedType === 'DUPLEX_PENTHOUSE') {
      setArea(215.0);
      setWallArea(232.0);
      setBedrooms(4);
      setBathrooms(4);
      setPriceBillion(18.50);
      setEstimatedRentPrice(65000000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Vui lÃ²ng nháº­p mÃ£ cÄƒn há»™ há»£p lá»‡.');
      setActiveTab('ARCHITECTURE');
      return;
    }

    let typeLabel = '2 PhÃ²ng Ngá»§ - 2WC';
    if (type === '1PN') typeLabel = '1 PhÃ²ng Ngá»§ - 1WC';
    if (type === '3PN') typeLabel = '3 PhÃ²ng Ngá»§ - 3WC';
    if (type === 'DUPLEX_PENTHOUSE') typeLabel = 'Duplex Penthouse';

    let statusLabel = 'CÄƒn Há»™ Trá»‘ng';
    if (status === 'OCCUPIED') statusLabel = 'Äang Sinh Sá»‘ng';
    if (status === 'MAINTENANCE') statusLabel = 'Äang Nghiá»‡m Thu Ká»¹ Thuáº­t';
    if (status === 'HANDOVER_PENDING') statusLabel = 'Chá» BÃ n Giao CÆ° DÃ¢n';

    const newUnit: ApartmentUnit = {
      code: cleanCode,
      tower: (currentBlock === 'BS-09' || currentBlock === 'BS-10') ? 'B' : 'A',
      towerName: `The Tropical ${currentBlock}`,
      floor: Number(floor),
      type,
      typeLabel,
      area: Number(area),
      wallArea: Number(wallArea),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      direction,
      mainDoorDirection,
      priceBillion: Number(priceBillion),
      status,
      statusLabel,
      membersCount: 0,
      vehicles: [],
      billing: {
        monthlyFee: calculatedMonthlyFee,
        parkingFee: 0,
        serviceFee: 0,
        totalAmount: calculatedMonthlyFee,
        status: 'PAID',
        period: 'ThÃ¡ng 09/2026',
        dueDate: '30/09/2026'
      },
      handoverProtocol: {
        protocolCode: `BBBG-SKYLINE-${cleanCode}`,
        handoverDate: new Date().toLocaleDateString('vi-VN'),
        handoverOfficer: 'VinHomes Manager',
        keysCount: Number(keysCount),
        cardsCount: Number(cardsCount),
        initialElectricMeter: Number(initialElectric),
        initialWaterMeter: Number(initialWater),
        notes: `Nghiá»‡m thu cÄƒn há»™ ${cleanCode}: ${finishingStandard}. PhÃ¡p lÃ½: ${legalStatus}. PCCC: Äáº¡t chuáº©n QCVN 06.`
      },
      description: description.trim() || `CÄƒn há»™ ${cleanCode} (${typeLabel} â€¢ ${area}mÂ²) táº§m view ${viewDescription} táº¡i Chung CÆ° Skyline.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = addApartmentUnit(newUnit);
    if (!success) {
      setError(`MÃ£ cÄƒn há»™ "${cleanCode}" Ä‘Ã£ tá»“n táº¡i trong há»‡ thá»‘ng. Vui lÃ²ng chá»n mÃ£ khÃ¡c.`);
      setActiveTab('ARCHITECTURE');
      return;
    }

    onSuccess(newUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl bg-[#090D14] border border-[#C5A880]/80 shadow-2xl flex flex-col max-h-[92vh] text-white rounded-none overflow-hidden">
        
        {/* ============================================================= */}
        {/* 1. HEADER MODAL                                               */}
        {/* ============================================================= */}
        <div className="p-4 sm:p-5 bg-[#101620] border-b border-[#222B35] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#C5A880]/20 border border-[#C5A880] flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#C5A880]" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#C5A880] font-mono font-semibold flex items-center gap-1.5">
                <Building className="w-3 h-3" /> KHá»žI Táº O KHÃ”NG GIAN BQL â€¢ CHUNG CÆ¯ SKYLINE
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white mt-0.5">
                ThÃªm CÄƒn Há»™ Má»›i VÃ o CÆ¡ Sá»Ÿ Dá»¯ Liá»‡u
              </h2>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-white hover:bg-rose-950/60 border border-transparent hover:border-rose-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================= */}
        {/* 2. THANH TAB CHUYá»‚N PHÃ‚N ÄOáº N FORM                           */}
        {/* ============================================================= */}
        <div className="flex border-b border-[#222B35] bg-[#0C121B] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`flex-1 py-2.5 px-4 text-center transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'ARCHITECTURE'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#16202D] font-bold'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121822]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t('1. Kiáº¿n TrÃºc & Vá»‹ TrÃ­')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('IOT_TECHNICAL')}
            className={`flex-1 py-2.5 px-4 text-center transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'IOT_TECHNICAL'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#16202D] font-bold'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121822]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('2. Háº¡ Táº§ng IoT & PCCC')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FINANCE_LEGAL')}
            className={`flex-1 py-2.5 px-4 text-center transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'FINANCE_LEGAL'
                ? 'border-[#C5A880] text-[#C5A880] bg-[#16202D] font-bold'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#121822]'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('3. TÃ i ChÃ­nh & PhÃ¡p LÃ½')}</span>
          </button>
        </div>

        {/* ThÃ´ng bÃ¡o lá»—i náº¿u cÃ³ */}
        {error && (
          <div className="mx-5 mt-3 p-3 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================= */}
        {/* 3. Ná»˜I DUNG FORM CHÃNH                                        */}
        {/* ============================================================= */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-mono">
          
          {/* ----------------------------------------------------------- */}
          {/* PHáº¦N 1: KIáº¾N TRÃšC & Vá»Š TRÃ                                 */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'ARCHITECTURE' && (
            <div className="space-y-4">
              {/* Chung cÆ° & Táº§ng & Sá»‘ cÄƒn */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-[#121822] border border-[#222B35]">
                <div>
                  <label className="block text-gray-400 mb-1">{isEn ? 'Building:' : 'Chung CÆ°:'}</label>
                  <div className="px-3 py-2 bg-[#161F2C] border border-[#2B394E] text-[#C5A880] font-bold text-xs">
                    Chung CÆ° Skyline (25 Táº§ng)
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Select Floor (1-25):' : 'Chá»n Táº§ng (1-25):'}</label>
                  <select
                    value={floor}
                    onChange={(e) => handleFloorChange(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    {[25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(f => (
                      <option key={f} value={f}>
                        Táº§ng {f} {f === 25 ? '(Penthouse)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Unit Slot on Floor:' : 'Vá»‹ TrÃ­ CÄƒn TrÃªn SÃ n:'}</label>
                  <select
                    value={unitSlot}
                    onChange={(e) => handleSlotChange(e.target.value)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    {['01', '02', '03', '04', '05', '06', '07', '08'].map(s => (
                      <option key={s} value={s}>{isEn ? `Unit #${s}` : `CÄƒn sá»‘ ${s}`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    MÃ£ CÄƒn Há»™ <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCode(val);
                      setElectricMeterId(`EM-${val}-IoT`);
                      setWaterMeterId(`WM-${val}-SKY`);
                    }}
                    placeholder="VD: 12A06"
                    className="w-full bg-[#161F2C] border border-[#C5A880] px-3 py-2 text-white font-bold tracking-wider outline-none focus:ring-1 focus:ring-[#C5A880]"
                    required
                  />
                </div>
              </div>

              {/* Loáº¡i hÃ¬nh cÄƒn há»™ (4 nÃºt chá»n nhanh) */}
              <div className="space-y-1.5">
                <label className="block text-gray-300 font-semibold">{isEn ? 'Standard Layout Type:' : 'Loáº¡i HÃ¬nh CÄƒn Há»™ Chuáº©n:'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '1PN', label: '1PN - 1WC', area: '52 mÂ²', price: '3.20 tá»·' },
                    { id: '2PN', label: '2PN - 2WC', area: '78.5 mÂ²', price: '4.85 tá»·' },
                    { id: '3PN', label: '3PN - 3WC', area: '112 mÂ²', price: '7.60 tá»·' },
                    { id: 'DUPLEX_PENTHOUSE', label: 'Penthouse', area: '215 mÂ²', price: '18.50 tá»·' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTypeChange(t.id as any)}
                      className={`p-2.5 text-left border transition-all ${
                        type === t.id
                          ? 'bg-[#1C2533] text-[#C5A880] border-[#C5A880] ring-1 ring-[#C5A880]'
                          : 'bg-[#121820] text-gray-300 border-[#222B35] hover:border-gray-600'
                      }`}
                    >
                      <div className="font-bold text-white text-xs">{t.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{t.area} â€¢ {t.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Diá»‡n tÃ­ch & CÆ¡ cáº¥u phÃ²ng */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Carpet Area (mÂ²):' : 'Diá»‡n TÃ­ch ThÃ´ng Thá»§y (mÂ²):'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Built-up Area (mÂ²):' : 'Diá»‡n TÃ­ch Tim TÆ°á»ng (mÂ²):'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={wallArea}
                    onChange={(e) => setWallArea(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Bedrooms:' : 'Sá»‘ PhÃ²ng Ngá»§:'}</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Bathrooms:' : 'Sá»‘ PhÃ²ng Vá»‡ Sinh:'}</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* HÆ°á»›ng & Táº§m nhÃ¬n */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Main Balcony Orientation:' : 'HÆ°á»›ng Ban CÃ´ng ChÃ­nh:'}</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="ÄÃ´ng Nam">{isEn ? 'Southeast (Cool breeze, river view)' : 'ÄÃ´ng Nam (ÄÃ³n giÃ³ mÃ¡t, view sÃ´ng)'}</option>
                    <option value="ÄÃ´ng Báº¯c">{isEn ? 'Northeast (Gentle morning sun)' : 'ÄÃ´ng Báº¯c (Náº¯ng sá»›m dá»‹u mÃ¡t)'}</option>
                    <option value="TÃ¢y Nam">{isEn ? 'Southwest (Warm sun, city view)' : 'TÃ¢y Nam (áº¤m Ã¡p, view thÃ nh phá»‘)'}</option>
                    <option value="TÃ¢y Báº¯c">{isEn ? 'Northwest (Internal park view)' : 'TÃ¢y Báº¯c (View cÃ´ng viÃªn ná»™i khu)'}</option>
                    <option value="ChÃ­nh Nam">{isEn ? 'South' : 'ChÃ­nh Nam'}</option>
                    <option value="ChÃ­nh Báº¯c">{isEn ? 'North' : 'ChÃ­nh Báº¯c'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Main Door Orientation (Feng Shui):' : 'HÆ°á»›ng Cá»­a ChÃ­nh (Phong Thá»§y):'}</label>
                  <select
                    value={mainDoorDirection}
                    onChange={(e) => setMainDoorDirection(e.target.value)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="TÃ¢y Báº¯c">{isEn ? 'Northwest' : 'TÃ¢y Báº¯c'}</option>
                    <option value="TÃ¢y Nam">{isEn ? 'Southwest' : 'TÃ¢y Nam'}</option>
                    <option value="ÄÃ´ng Báº¯c">{isEn ? 'Northeast' : 'ÄÃ´ng Báº¯c'}</option>
                    <option value="ÄÃ´ng Nam">{isEn ? 'Southeast' : 'ÄÃ´ng Nam'}</option>
                    <option value="ChÃ­nh Nam">{isEn ? 'South' : 'ChÃ­nh Nam'}</option>
                    <option value="ChÃ­nh Báº¯c">{isEn ? 'North' : 'ChÃ­nh Báº¯c'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Landscape View:' : 'Táº§m NhÃ¬n (View):'}</label>
                  <input
                    type="text"
                    value={viewDescription}
                    onChange={(e) => setViewDescription(e.target.value)}
                    placeholder={isEn ? 'e.g. Saigon River View, City Skyline...' : 'VD: View SÃ´ng SÃ i GÃ²n, Landmark 81...'}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* PHáº¦N 2: Háº  Táº¦NG IOT ÄO LÆ¯á»œNG & AN TOÃ€N PCCC                */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'IOT_TECHNICAL' && (
            <div className="space-y-4">
              <div className="p-3 bg-gradient-to-r from-[#141F2D] to-[#0E1622] border border-[#2B394E] space-y-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> Há»† THá»NG ÄO LÆ¯á»œNG ÄIá»†N & NÆ¯á»šC THÃ”NG MINH IOT
                </div>
                <div className="text-[11px] text-gray-400">
                  Má»—i cÄƒn há»™ táº¡i Chung CÆ° Skyline Ä‘Æ°á»£c tÃ­ch há»£p Ä‘á»“ng há»“ Ä‘iá»‡n tá»­ vÃ  cÃ´ng tÆ¡ nÆ°á»›c thÃ´ng minh tá»± Ä‘á»™ng truyá»n sá»‘ liá»‡u vá» BQL.
                </div>
              </div>

              {/* Äá»“ng há»“ Ä‘iá»‡n & nÆ°á»›c */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Äiá»‡n IoT */}
                <div className="p-3 bg-[#121822] border border-[#222B35] space-y-2">
                  <div className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Äá»“ng Há»“ Äiá»‡n Tá»­ ThÃ´ng Minh
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10.5px] mb-1">{isEn ? 'Electric Meter ID (IoT):' : 'MÃ£ Thiáº¿t Bá»‹ IoT (Electric Meter ID):'}</label>
                    <input
                      type="text"
                      value={electricMeterId}
                      onChange={(e) => setElectricMeterId(e.target.value)}
                      className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-1.5 text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10.5px] mb-1">{isEn ? 'Initial Electric Meter Reading (kWh):' : 'Chá»‰ Sá»‘ Khá»Ÿi Äiá»ƒm Nghiá»‡m Thu (kWh):'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={initialElectric}
                      onChange={(e) => setInitialElectric(Number(e.target.value))}
                      className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-1.5 text-white font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* NÆ°á»›c IoT */}
                <div className="p-3 bg-[#121822] border border-[#222B35] space-y-2">
                  <div className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Äá»“ng Há»“ NÆ°á»›c Sinh Hoáº¡t IoT
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10.5px] mb-1">{isEn ? 'Water Meter ID (IoT):' : 'MÃ£ Thiáº¿t Bá»‹ IoT (Water Meter ID):'}</label>
                    <input
                      type="text"
                      value={waterMeterId}
                      onChange={(e) => setWaterMeterId(e.target.value)}
                      className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-1.5 text-white font-mono outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10.5px] mb-1">{isEn ? 'Initial Water Meter Reading (mÂ³):' : 'Chá»‰ Sá»‘ NÆ°á»›c Khá»Ÿi Äiá»ƒm (mÂ³):'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={initialWater}
                      onChange={(e) => setInitialWater(Number(e.target.value))}
                      className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-1.5 text-white font-mono outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* An toÃ n PCCC & Smart Living */}
              <div className="p-3 bg-[#121822] border border-[#222B35] space-y-2">
                <div className="text-[#C5A880] font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> TIÃŠU CHUáº¨N AN TOÃ€N PCCC & THIáº¾T Bá»Š BÃ€N GIAO
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <label className="p-2 bg-[#161F2C] border border-[#26354A] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSprinkler}
                      onChange={(e) => setHasSprinkler(e.target.checked)}
                      className="accent-[#C5A880]"
                    />
                    <span className="text-gray-200">{isEn ? 'Auto Fire Sprinklers' : 'Äáº§u Phun Sprinkler Tá»± Äá»™ng'}</span>
                  </label>

                  <label className="p-2 bg-[#161F2C] border border-[#26354A] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSmokeSensor}
                      onChange={(e) => setHasSmokeSensor(e.target.checked)}
                      className="accent-[#C5A880]"
                    />
                    <span className="text-gray-200">{isEn ? 'Smart Smoke Sensor' : 'Cáº£m Biáº¿n KhÃ³i ThÃ´ng Minh'}</span>
                  </label>

                  <label className="p-2 bg-[#161F2C] border border-[#26354A] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasIntercom}
                      onChange={(e) => setHasIntercom(e.target.checked)}
                      className="accent-[#C5A880]"
                    />
                    <span className="text-gray-200">{isEn ? 'Smart Video Intercom' : 'ChuÃ´ng HÃ¬nh Video Intercom'}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* PHáº¦N 3: TÃ€I CHÃNH, PHÃP LÃ & BÃ€N GIAO                       */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'FINANCE_LEGAL' && (
            <div className="space-y-4">
              {/* Äá»‹nh giÃ¡ bÃ¡n & Cho thuÃª */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#121822] border border-[#222B35]">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Developer Listing Price (Billion VND):' : 'GiÃ¡ BÃ¡n CÄT (Tá»· VNÄ):'}</label>
                  <input
                    type="number"
                    step="0.05"
                    value={priceBillion}
                    onChange={(e) => setPriceBillion(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-[#C5A880] font-bold outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Reference Rental Price (VND/month):' : 'GiÃ¡ Cho ThuÃª Tham Chiáº¿u (VNÄ/thÃ¡ng):'}</label>
                  <input
                    type="number"
                    step="500000"
                    value={estimatedRentPrice}
                    onChange={(e) => setEstimatedRentPrice(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-emerald-400 font-bold outline-none focus:border-emerald-400"
                  />
                  <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> Yield: ~{calculatedRentalYield}%/nÄƒm
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Estimated Management Fee:' : 'PhÃ­ Quáº£n LÃ½ Chung CÆ° (Dá»± kiáº¿n):'}</label>
                  <div className="px-3 py-2 bg-[#161F2C] border border-[#2B394E] text-amber-300 font-bold text-xs">
                    {new Intl.NumberFormat('vi-VN').format(calculatedMonthlyFee)} Ä‘/thÃ¡ng
                  </div>
                  <div className="text-[9.5px] text-gray-400 mt-1">{isEn ? 'Unit rate: 18,000 VND/mÂ² carpet area' : 'ÄÆ¡n giÃ¡: 18.000 Ä‘/mÂ² thÃ´ng thá»§y'}</div>
                </div>
              </div>

              {/* PhÃ¡p lÃ½ & BÃ n giao chÃ¬a khÃ³a */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Ownership Title:' : 'PhÃ¡p LÃ½ Sá»Ÿ Há»¯u:'}</label>
                  <select
                    value={legalStatus}
                    onChange={(e) => setLegalStatus(e.target.value as any)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="Sá»• há»“ng lÃ¢u dÃ i">{isEn ? 'Long-term Pink Book Ownership' : 'Sá»• há»“ng lÃ¢u dÃ i (VÄ©nh viá»…n)'}</option>
                    <option value="Há»£p Ä‘á»“ng mua bÃ¡n SPA">{isEn ? 'Sales & Purchase Agreement (SPA)' : 'Há»£p Ä‘á»“ng mua bÃ¡n SPA'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Physical Keys Count:' : 'Sá»‘ ChÃ¬a KhÃ³a CÆ¡:'}</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={keysCount}
                    onChange={(e) => setKeysCount(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Elevator Keycards:' : 'Sá»‘ Tháº» Thang MÃ¡y PhÃ¢n Táº§ng:'}</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cardsCount}
                    onChange={(e) => setCardsCount(Number(e.target.value))}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* TiÃªu chuáº©n hoÃ n thiá»‡n & Tráº¡ng thÃ¡i khá»Ÿi táº¡o */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Finishing Standard:' : 'TiÃªu Chuáº©n HoÃ n Thiá»‡n:'}</label>
                  <select
                    value={finishingStandard}
                    onChange={(e) => setFinishingStandard(e.target.value)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="HoÃ n thiá»‡n cao cáº¥p Full ná»™i tháº¥t 5 sao">{isEn ? 'Luxury 5-Star Fully Furnished' : 'HoÃ n thiá»‡n cao cáº¥p Full ná»™i tháº¥t 5 sao'}</option>
                    <option value="HoÃ n thiá»‡n liá»n tÆ°á»ng cao cáº¥p (Báº¿p & WC)">{isEn ? 'Semi-furnished (Kitchen & Bath)' : 'HoÃ n thiá»‡n liá»n tÆ°á»ng cao cáº¥p (Báº¿p & WC)'}</option>
                    <option value="BÃ n giao thÃ´ (Tá»± do thiáº¿t káº¿)">{isEn ? 'Bare Shell (Custom Interior)' : 'BÃ n giao thÃ´ (Tá»± do thiáº¿t káº¿)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Initial Unit Status:' : 'Tráº¡ng ThÃ¡i Khá»Ÿi Táº¡o:'}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                  >
                    <option value="VACANT">{isEn ? 'Vacant (Ready for Handover)' : 'CÄƒn Há»™ Trá»‘ng (Sáºµn sÃ ng bÃ n giao)'}</option>
                    <option value="MAINTENANCE">{isEn ? 'Under Technical Review / Maintenance' : 'Äang Nghiá»‡m Thu Ká»¹ Thuáº­t / Báº£o TrÃ¬'}</option>
                    <option value="HANDOVER_PENDING">{isEn ? 'Pending Resident Handover' : 'Chá» BÃ n Giao CÆ° DÃ¢n'}</option>
                  </select>
                </div>
              </div>

              {/* Ghi chÃº mÃ´ táº£ */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">{isEn ? 'Technical Notes / Unit Description:' : 'Ghi ChÃº Ká»¹ Thuáº­t / MÃ´ Táº£ CÄƒn Há»™:'}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder={isEn ? 'Detailed notes on appliances, view, or maintenance guidelines...' : 'Ghi chÃº chi tiáº¿t vá» trang thiáº¿t bá»‹ ná»™i tháº¥t, táº§m view hoáº·c cÃ¡c lÆ°u Ã½ báº£o dÆ°á»¡ng...'}
                  className="w-full bg-[#161F2C] border border-[#2D3748] px-3 py-2 text-white outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 4. CHÃ‚N FORM & NÃšT LÆ¯U                                       */}
          {/* ============================================================= */}
          <div className="pt-3 border-t border-[#222B35] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-gray-400 text-[11px] text-center sm:text-left">
              Äang xem má»¥c: <span className="text-[#C5A880] font-bold">
                {activeTab === 'ARCHITECTURE' ? '1. Kiáº¿n TrÃºc & Vá»‹ TrÃ­' : activeTab === 'IOT_TECHNICAL' ? '2. Háº¡ Táº§ng IoT & PCCC' : '3. TÃ i ChÃ­nh & PhÃ¡p LÃ½'}
              </span>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#161F2C] hover:bg-[#222E3E] text-gray-300 hover:text-white border border-[#2D3748] font-semibold transition-colors text-center"
              >
                Há»§y Bá»
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? 'Save New Apartment' : 'LÆ°u CÄƒn Há»™ Má»›i'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
