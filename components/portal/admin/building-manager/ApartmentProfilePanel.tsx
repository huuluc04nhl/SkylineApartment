'use client';

import React from 'react';
import { 
  Building, 
  UserCheck, 
  Key, 
  ExternalLink, 
  Coins, 
  Activity, 
  Zap, 
  Droplets, 
  Check, 
  Compass, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { ApartmentUnit } from '@/lib/apartmentStore';
import { getApartmentFinancialMetrics } from './buildingConstants';
import { useLanguage } from '@/lib/languageContext';

export interface ApartmentProfilePanelProps {
  activeUnit: ApartmentUnit | null;
  detailSubTab?: 'RESIDENT' | 'FINANCIAL' | 'TECHNICAL';
  setDetailSubTab?: (tab: 'RESIDENT' | 'FINANCIAL' | 'TECHNICAL') => void;
  onOpenAssignModal: (unit: ApartmentUnit) => void;
  onOpenEditModal: (unit: ApartmentUnit) => void;
  onOpenDetailModal: (unit: ApartmentUnit) => void;
  onOpenFloorPlanModal: () => void;
}

export default function ApartmentProfilePanel({
  activeUnit,
  onOpenAssignModal,
  onOpenEditModal,
  onOpenDetailModal,
  onOpenFloorPlanModal,
}: ApartmentProfilePanelProps) {
  const { t, isEn } = useLanguage();
  const [detailTab, setDetailTab] = React.useState<'OVERVIEW' | 'FINANCIAL' | 'TECHNICAL'>('OVERVIEW');
  const [billToastMessage, setBillToastMessage] = React.useState<string | null>(null);

  const setIsAssignModalOpen = (open: boolean) => {
    if (open && activeUnit) onOpenAssignModal(activeUnit);
  };
  if (!activeUnit) {
    return (
      <div className="p-8 text-center text-gray-400 text-xs font-mono my-auto">
        {t('Vui lòng chọn một căn hộ trên mô hình để xem thông tin chi tiết.', 'Please select an apartment on the model to view detailed information.')}
      </div>
    );
  }

  const financialMetrics = getApartmentFinancialMetrics(activeUnit);

  return (
    <div className="flex flex-col h-full justify-between">
              <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1">
                {/* 1. Tiêu đề & Trạng thái căn */}
                <div className="border-b border-[#222B35] pb-2.5 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-mono font-semibold">
                      {activeUnit.towerName} • {t('TẦNG', 'FLOOR')} {activeUnit.floor}
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                      {t('Căn Hộ', 'Apartment')} {activeUnit.code}
                    </h3>
                  </div>

                  {/* Trạng thái thực tế */}
                  <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-none border ${
                    activeUnit.status === 'OCCUPIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : activeUnit.status === 'MAINTENANCE'
                      ? 'bg-blue-950 text-blue-300 border-blue-500'
                      : 'bg-amber-950 text-amber-300 border-amber-500'
                  }`}>
                    {activeUnit.status === 'OCCUPIED' ? t('ĐÃ CÓ NGƯỜI Ở', 'OCCUPIED') : activeUnit.status === 'MAINTENANCE' ? t('NGHIỆM THU', 'INSPECTION') : t('NHÀ TRỐNG', 'VACANT')}
                  </span>
                </div>

                {/* 2. Thanh 4 thông số chính nhanh gọn */}
                <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#121820] border border-[#222B35] text-center font-mono">
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">{t('Diện Tích', 'Area')}</div>
                    <div className="text-xs font-bold text-white mt-0.5">{activeUnit.area} m²</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">{t('Bố Trí', 'Layout')}</div>
                    <div className="text-xs font-bold text-gray-200 mt-0.5">{activeUnit.bedrooms}{t('PN', 'BR')} • {activeUnit.bathrooms}{t('WC', 'BA')}</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">{t('Hướng Ban Công', 'Orientation')}</div>
                    <div className="text-xs font-bold text-[#C5A880] mt-0.5">{activeUnit.direction || (isEn ? 'South-East' : 'Đông Nam')}</div>
                  </div>
                  <div className="p-1 bg-[#161B22]">
                    <div className="text-[9.5px] text-gray-400">{t('Giá Niêm Yết', 'Listed Price')}</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">{activeUnit.priceBillion} {t('tỷ', 'B VND')}</div>
                  </div>
                </div>

                {/* 3. Thanh chuyển Tab tinh gọn (3 Tab: Cư dân, Tiêu thụ & Doanh thu, Kỹ thuật) */}
                <div className="flex border-b border-[#222B35] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDetailTab('OVERVIEW')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 ${
                      detailTab === 'OVERVIEW'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {activeUnit.status === 'OCCUPIED' ? t('Hồ Sơ Cư Dân', 'Resident Profile') : t('Hiện Trạng', 'Unit Status')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('FINANCIAL')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 ${
                      detailTab === 'FINANCIAL'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {t('Năng Lượng & Chi Phí', 'Energy & Billing')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('TECHNICAL')}
                    className={`pb-2 px-2.5 transition-colors border-b-2 ${
                      detailTab === 'TECHNICAL'
                        ? 'border-[#C5A880] text-[#C5A880]'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {t('Kỹ Thuật & Pháp Lý', 'Specs & Legal')}
                  </button>
                </div>

                {/* 4. Nội dung Tab 1: Tổng quan cư dân / hiện trạng */}
                {detailTab === 'OVERVIEW' && (
                  <div className="space-y-2.5">
                    {activeUnit.status === 'OCCUPIED' && activeUnit.owner ? (
                      <>
                        {/* Chủ hộ súc tích */}
                        <div className="p-2.5 bg-[#121820] border border-[#222B35] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={activeUnit.owner.avatar}
                              alt={activeUnit.owner.name}
                              className="w-10 h-10 rounded-none object-cover border border-[#C5A880] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm truncate">{activeUnit.owner.name}</div>
                              <div className="text-[11px] text-gray-300 font-mono flex items-center gap-2">
                                <span>{t('ĐT', 'Phone')}: {activeUnit.owner.phone}</span>
                                <span>• {t('CCCD', 'ID')}: {activeUnit.owner.cccd}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[9.5px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono">
                            {t('Đã Đối Chiếu', 'Verified')}
                          </span>
                        </div>

                        {/* Tóm tắt bàn giao */}
                        {activeUnit.handoverProtocol ? (
                          <div className="p-2.5 bg-[#121820] border border-[#222B35] text-[11px] font-mono space-y-1">
                            <div className="flex items-center justify-between text-gray-400">
                              <span>{t('Biên bản bàn giao:', 'Handover protocol:')}</span>
                              <strong className="text-[#C5A880]">{activeUnit.handoverProtocol.protocolCode}</strong>
                            </div>
                            <div className="flex items-center justify-between text-gray-400">
                              <span>{t('Chìa khóa & thẻ từ:', 'Keys & access cards:')}</span>
                              <strong className="text-white">
                                {activeUnit.handoverProtocol.keysCount} {t('chìa khóa', 'keys')} • {activeUnit.handoverProtocol.cardsCount} {t('thẻ thang máy', 'elevator cards')}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-gray-400">
                              <span>{t('Chỉ số khi nhận:', 'Initial meters:')}</span>
                              <strong className="text-amber-400">
                                {activeUnit.handoverProtocol.initialElectricMeter} kWh • {activeUnit.handoverProtocol.initialWaterMeter} m³
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-[#121820] border border-[#222B35] text-[11px] font-mono text-gray-400 flex items-center justify-between">
                            <span>{t('Biên bản bàn giao kỹ thuật:', 'Technical handover protocol:')}</span>
                            <span className="text-gray-500 italic">{t('Chưa lập biên bản', 'Not yet recorded')}</span>
                          </div>
                        )}

                        {/* Nhân khẩu & xe gọn */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="p-2 bg-[#121820] border border-[#222B35]">
                            <div className="text-gray-400 text-[10px]">{t('Cùng Cư Trú:', 'Co-residents:')}</div>
                            <div className="text-white font-bold mt-0.5">
                              {activeUnit.members?.length || activeUnit.membersCount || 0} {t('người thân', 'members')}
                            </div>
                          </div>
                          <div className="p-2 bg-[#121820] border border-[#222B35]">
                            <div className="text-gray-400 text-[10px]">{t('Xe Đăng Ký Gửi Hầm:', 'Registered Parking:')}</div>
                            <div className="text-emerald-400 font-bold mt-0.5 truncate">
                              {activeUnit.vehicles && activeUnit.vehicles.length > 0
                                ? activeUnit.vehicles.map(v => v.plate).join(', ')
                                : t('Chưa đăng ký', 'Not registered')}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : activeUnit.status === 'MAINTENANCE' ? (
                      <div className="p-3 bg-[#121820] border border-blue-500/40 space-y-2">
                        <div className="text-blue-400 font-bold text-xs font-mono">
                          {t('Căn Hộ Đang Nghiệm Thu Kỹ Thuật', 'Unit Under Technical Inspection')}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {t('Tổ kỹ thuật BQL đang kiểm tra điều hòa trung tâm, cửa sổ kính cách âm và van cấp nước. Tiến độ đạt 85%, sẵn sàng bàn giao trong 2 ngày.', 'Management technical team is inspecting central HVAC, soundproof windows, and water valves. Progress at 85%, ready for handover in 2 days.')}
                        </p>
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(activeUnit)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase transition-all"
                        >
                          {t('Cập Nhật Tình Trạng', 'Update Status')}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-[#121820] border border-amber-500/40 space-y-2.5">
                        <div className="text-amber-400 font-bold text-xs font-mono">
                          {t('Căn Hộ Trống (Sẵn Sàng Bàn Giao)', 'Vacant Unit (Ready for Handover)')}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {t('Căn hộ đã hoàn tất nghiệm thu hoàn thiện xây dựng, an toàn điện nước và đầu phun chữa cháy PCCC đạt chuẩn an toàn. Sẵn sàng bàn giao cho cư dân mới.', 'Unit has passed construction finishing inspection, MEP safety, and fire sprinkler certification. Ready for new resident handover.')}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAssignModalOpen(true)}
                          className="w-full py-2.5 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center shadow"
                        >
                          {t('Bàn Giao Căn Hộ & Cấp Tài Khoản', 'Handover Unit & Issue Account')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4.5. Nội dung Tab 2: Tiêu Thụ Hàng Tháng & Doanh Thu / Dòng Tiền */}
                {detailTab === 'FINANCIAL' && (() => {
                  const fin = getApartmentFinancialMetrics(activeUnit);
                  if (!fin) return null;

                  return (
                    <div className="space-y-2.5 text-xs font-mono">
                      {/* Thông báo thao tác thu phí */}
                      {billToastMessage && (
                        <div className="p-2 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[11px] flex items-center justify-between">
                          <span>{billToastMessage}</span>
                          <button onClick={() => setBillToastMessage(null)} className="text-gray-400 hover:text-white ml-2">✕</button>
                        </div>
                      )}

                      {/* 1. KHỐI TỔNG HỢP DOANH THU BQL & GIÁ TRỊ KHAI THÁC */}
                      <div className="p-2.5 bg-gradient-to-br from-[#16202E] to-[#0E1520] border border-[#2A374A] space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-200 font-bold">
                            {t('DÒNG TIỀN & DOANH THU CĂN HỘ', 'UNIT CASH FLOW & REVENUE')}
                          </span>
                          <span className={`px-2 py-0.5 text-[9.5px] font-bold border ${
                            fin.isOccupied 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500' 
                              : 'bg-amber-950 text-amber-300 border-amber-600'
                          }`}>
                            {fin.isOccupied ? t('ĐÃ ĐÓNG ĐỦ', 'FULLY PAID') : t('CĐT BẢO DƯỠNG', 'DEVELOPER MAINTENANCE')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#232F42]">
                          <div>
                            <div className="text-[9.5px] text-gray-400">{t('Doanh Thu Phí BQL:', 'Management Fee Revenue:')}</div>
                            <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                              {new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(fin.totalBqlRevenue)} <span className="text-[10px] text-gray-400">đ/{t('th', 'mo')}</span>
                            </div>
                            <div className="text-[9px] text-gray-400">~{((fin.totalBqlRevenue * 12) / 1000000).toFixed(1)} {t('triệu đ/năm', 'M VND/yr')}</div>
                          </div>
                          <div>
                            <div className="text-[9.5px] text-gray-400">{t('Giá Thuê Ước Tính:', 'Est. Rental Price:')}</div>
                            <div className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">
                              {new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(fin.estimatedRentalPrice)} <span className="text-[10px] text-gray-400">đ/{t('th', 'mo')}</span>
                            </div>
                            <div className="text-[9px] text-emerald-400">
                              {t('Lợi suất:', 'Rental Yield:')} {fin.rentalYield}% / {t('năm', 'year')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. CHỈ SỐ TIÊU THỤ NĂNG LƯỢNG HÀNG THÁNG (ĐIỆN - NƯỚC) */}
                      <div className="p-2.5 bg-[#121820] border border-[#222B35] space-y-2">
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#222B35]">
                          <span className="text-[#C5A880] font-bold">
                            {t('TIÊU THỤ HÀNG THÁNG (KỲ GẦN NHẤT)', 'MONTHLY CONSUMPTION (LATEST CYCLE)')}
                          </span>
                          <span className="text-[9px] text-gray-400">{t('Đồng hồ IoT', 'IoT Smart Meter')}</span>
                        </div>

                        {/* Tiêu thụ Điện */}
                        <div className="p-2 bg-[#161B22] border border-[#2D3748] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-300 font-bold text-[10.5px]">
                              {t('Điện Sinh Hoạt', 'Household Electricity')} ({fin.meterElectricId})
                            </span>
                            <span className="text-amber-300 font-bold text-xs">
                              {new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(fin.electricCost)} đ
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="font-bold text-white text-sm">{fin.electricKwh} <span className="text-[10px] text-gray-400 font-normal">kWh</span></span>
                            <span className="text-[9px] text-gray-400">{fin.electricKwh > 300 ? t('Cao hơn trung bình', 'Above average') : t('Tiêu thụ chuẩn', 'Normal consumption')}</span>
                          </div>
                          {/* Thanh đo */}
                          <div className="w-full bg-gray-800 h-1.5 overflow-hidden">
                            <div 
                              className="bg-amber-400 h-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.round((fin.electricKwh / 350) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Tiêu thụ Nước */}
                        <div className="p-2 bg-[#161B22] border border-[#2D3748] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-300 font-bold text-[10.5px]">
                              {t('Nước Sinh Hoạt', 'Household Water')} ({fin.meterWaterId})
                            </span>
                            <span className="text-cyan-300 font-bold text-xs">
                              {new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(fin.waterCost)} đ
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="font-bold text-white text-sm">{fin.waterM3} <span className="text-[10px] text-gray-400 font-normal">m³</span></span>
                            <span className="text-[9px] text-emerald-400">{t('Áp lực ống: 2.8 bar', 'Pipe pressure: 2.8 bar')}</span>
                          </div>
                          {/* Thanh đo */}
                          <div className="w-full bg-gray-800 h-1.5 overflow-hidden">
                            <div 
                              className="bg-cyan-400 h-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.round((fin.waterM3 / 25) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Chi tiết phí dịch vụ & xe */}
                        <div className="pt-1 space-y-1 text-[10.5px] text-gray-300">
                          <div className="flex justify-between py-0.5 border-b border-[#1E293B]">
                            <span className="text-gray-400">• {t('Phí quản lý chung cư', 'Management Fee')} ({fin.area} m² x 18k):</span>
                            <span className="font-bold text-white">{new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(fin.managementFee)} đ</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-[#1E293B]">
                            <span className="text-gray-400">• {t('Phí gửi xe tầng hầm', 'Basement Parking Fee')} ({activeUnit.vehicles?.length || 0} {t('xe', 'vehicles')}):</span>
                            <span className="font-bold text-white">{new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(fin.parkingFee)} đ</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. NÚT TƯƠNG TÁC NHANH */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setBillToastMessage(isEn ? `Extracted billing receipt for unit ${activeUnit.code} successfully.` : `Đã trích xuất biên lai phiếu thu căn hộ ${activeUnit.code} thành công.`);
                            setTimeout(() => setBillToastMessage(null), 3500);
                          }}
                          className="py-2 px-2 bg-[#16202E] hover:bg-[#1E2B3E] text-gray-200 hover:text-white border border-[#2D3B4E] font-semibold text-[10.5px] transition-all flex items-center justify-center"
                        >
                          {t('Xuất Phiếu Thu', 'Export Receipt')}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBillToastMessage(isEn ? `Sent bill notification & payment reminder to owner of unit ${activeUnit.code}.` : `Đã gửi tin nhắn nhắc phí & hóa đơn tới chủ căn hộ ${activeUnit.code}.`);
                            setTimeout(() => setBillToastMessage(null), 3500);
                          }}
                          className="py-2 px-2 bg-[#162B22] hover:bg-[#1E3B2F] text-emerald-300 hover:text-emerald-200 border border-emerald-600/50 font-semibold text-[10.5px] transition-all flex items-center justify-center"
                        >
                          {t('Gửi Thông Báo Phí', 'Send Bill Notice')}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. Nội dung Tab 3: Thông số kỹ thuật & phí */}
                {detailTab === 'TECHNICAL' && (
                  <div className="p-3 bg-[#121820] border border-[#222B35] space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">{t('Diện tích thông thủy:', 'Carpet area:')}</span>
                      <strong className="text-white">{activeUnit.area} m²</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">{t('Diện tích tim tường:', 'Built-up area:')}</span>
                      <strong className="text-white">{Math.round(activeUnit.area * 1.08)} m²</strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">{t('Phí quản lý chung cư:', 'Management fee:')}</span>
                      <strong className="text-amber-300">
                        {new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN').format(Math.round(activeUnit.area * 18000))} {t('đ/tháng (18.000 đ/m²)', 'VND/mo (18,000 VND/m²)')}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#222B35]">
                      <span className="text-gray-400">{t('Pháp lý sở hữu:', 'Ownership legal:')}</span>
                      <strong className="text-emerald-400">{t('Sổ hồng lâu dài (Đã cấp)', 'Long-term Pink Book (Issued)')}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t('Hệ thống kỹ thuật:', 'Engineering systems:')}</span>
                      <strong className="text-gray-200">{t('Smart Intercom & Báo khói PCCC', 'Smart Intercom & Smoke Detector')}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Chân thẻ: Nút hành động nhanh */}
              <div className="pt-2.5 border-t border-[#222B35] flex items-center gap-2 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenDetailModal(activeUnit)}
                  className="flex-1 py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center"
                >
                  {t('Mặt Bằng Sàn', 'Floor Plan')}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenEditModal(activeUnit)}
                  className="py-2 px-3 bg-[#161B22] hover:bg-[#202936] text-gray-200 hover:text-white border border-[#2D3748] font-semibold transition-all flex items-center justify-center"
                >
                  {t('Chỉnh Sửa', 'Edit')}
                </button>
              </div>
            </div>
  );
}
