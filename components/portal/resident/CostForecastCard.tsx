'use client';

import React, { useState } from 'react';
import { Sparkles, TrendingDown, Lightbulb, ChevronRight, Info, Zap, Droplets, ShieldCheck, ArrowRight } from 'lucide-react';
import { Bill } from '@/lib/dataStore';
import { useLanguage } from '@/lib/languageContext';

interface CostForecastCardProps {
  bills: Bill[];
  aptCode: string;
}

export default function CostForecastCard({ bills, aptCode }: CostForecastCardProps) {
  const { t, isEn } = useLanguage();
  const [showTips, setShowTips] = useState(false);

  // Compute forecast based on bills history
  const recentBills = [...bills].sort((a, b) => b.billing_month.localeCompare(a.billing_month)).slice(0, 3);
  const avgAmount = recentBills.length > 0 
    ? Math.round(recentBills.reduce((s, b) => s + b.total_amount, 0) / recentBills.length)
    : 2450000;

  // Expected adjustments for next period (e.g. Month 09/2026: slight cooling after peak August heat)
  const estimatedMin = Math.round((avgAmount * 0.96) / 10000) * 10000;
  const estimatedMax = Math.round((avgAmount * 1.02) / 10000) * 10000;
  const forecastMid = Math.round((estimatedMin + estimatedMax) / 2);

  // Fixed & Variable breakdown estimates
  const fixedCost = 1320000; // Phí QL 1.050k + Gửi xe 270k
  const estimatedElectricity = Math.round((forecastMid - fixedCost) * 0.68);
  const estimatedWater = Math.max(0, forecastMid - fixedCost - estimatedElectricity);

  const tips = [
    {
      icon: Zap,
      color: 'text-amber-400',
      title: isEn ? 'AC Temperature & Smart Thermostat' : 'Nhiệt độ Điều Hòa 26°C + Quạt',
      desc: isEn 
        ? 'Setting AC to 26°C with ceiling fan lowers power usage by ~12% (save ~95.000 đ/mo).'
        : 'Cài đặt điều hòa 26°C kèm quạt gió giúp giảm 12% điện năng (tiết kiệm ước tính ~95.000 đ/tháng).'
    },
    {
      icon: Droplets,
      color: 'text-cyan-400',
      title: isEn ? 'Inspect Hidden Valve Leaks' : 'Kiểm Tra Rò Rỉ Van Nước Ngầm',
      desc: isEn
        ? 'Checking toilet float valves prevents unnoticed drip leaks that cause water bill spikes.'
        : 'Kiểm tra van phao bồn cầu và vòi xịt để tránh thất thoát nước rò rỉ âm thầm.'
    },
    {
      icon: Sparkles,
      color: 'text-emerald-400',
      title: isEn ? 'Smart Home Away Mode' : 'Kích Hoạt Ngữ Cảnh "Đi Vắng"',
      desc: isEn
        ? 'One-touch Away scene powers off standby devices and lights when leaving.'
        : '1-chạm kích hoạt kịch bản "Đi Vắng" tự động tắt thiết bị chờ và đèn chiếu sáng.'
    }
  ];

  return (
    <div className="p-5 bg-gradient-to-r from-[#121820] via-[#141C28] to-[#121820] border border-[#C5A880]/40 space-y-4 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#C5A880]/10 border border-[#C5A880]/40 text-[#C5A880]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
              <span>{isEn ? 'AI Expense Forecast' : 'Dự Báo Chi Phí Kỳ Tới'}</span>
              <span className="px-1.5 py-0.2 bg-[#C5A880] text-[#0D1117] text-[9px] font-bold uppercase tracking-wider">
                {isEn ? 'Estimate' : 'Ước Tính'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              {isEn ? 'Kỳ Tháng 09/2026 • Căn hộ ' : 'Kỳ Tháng 09/2026 • Căn hộ '}{aptCode}
            </h4>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-[10px] text-gray-400">{isEn ? 'Projected total:' : 'Tổng ước tính:'}</div>
          <div className="text-lg font-serif font-bold text-[#C5A880]">
            ~{forecastMid.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 sm:justify-end">
            <TrendingDown className="w-3 h-3" />
            <span>-3.6% {isEn ? 'vs previous peak' : 'so với đỉnh Tháng 8'}</span>
          </div>
        </div>
      </div>

      {/* Breakdown mini-bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-2.5 bg-[#0D1117]/80 border border-[#222B35]">
          <div className="text-[10px] text-gray-400 flex items-center justify-between">
            <span>{isEn ? 'Fixed Fees' : 'Phí Cố Định (QL + Xe)'}</span>
            <span className="text-[9px] text-emerald-400 font-bold">100% chuẩn</span>
          </div>
          <div className="text-sm font-mono font-bold text-white mt-0.5">
            {fixedCost.toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div className="p-2.5 bg-[#0D1117]/80 border border-[#222B35]">
          <div className="text-[10px] text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3 h-3" /> {isEn ? 'Est. Electric' : 'Điện Dự Kiến'}
            </span>
            <span className="text-[9px] text-gray-400">~265 kWh</span>
          </div>
          <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">
            ~{estimatedElectricity.toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div className="p-2.5 bg-[#0D1117]/80 border border-[#222B35]">
          <div className="text-[10px] text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-cyan-400">
              <Droplets className="w-3 h-3" /> {isEn ? 'Est. Water' : 'Nước Dự Kiến'}
            </span>
            <span className="text-[9px] text-gray-400">~24 m³</span>
          </div>
          <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
            ~{estimatedWater.toLocaleString('vi-VN')} đ
          </div>
        </div>
      </div>

      {/* Energy Saving Tips Toggle */}
      <div className="pt-2 border-t border-[#222B35]">
        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between text-xs text-gray-300 hover:text-[#C5A880] transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-semibold">
            <Lightbulb className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isEn ? '3 Smart Energy Saving Tips by AI' : '3 Gợi Ý Tiết Kiệm Năng Lượng Từ AI'}</span>
          </span>
          <span className="text-[10px] text-[#C5A880] underline flex items-center gap-0.5">
            {showTips ? (isEn ? 'Collapse' : 'Thu gọn') : (isEn ? 'View tips' : 'Xem chi tiết')}
            <ChevronRight className={`w-3 h-3 transition-transform ${showTips ? 'rotate-90' : ''}`} />
          </span>
        </button>

        {showTips && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 animate-fadeIn">
            {tips.map((tItem, idx) => {
              const Icon = tItem.icon;
              return (
                <div key={idx} className="p-3 bg-[#0D1117] border border-[#222B35] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Icon className={`w-3.5 h-3.5 ${tItem.color} shrink-0`} />
                    <span className="truncate">{tItem.title}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {tItem.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safe Disclaimer */}
      <div className="text-[10px] text-gray-500 italic flex items-center gap-1">
        <Info className="w-3 h-3 text-gray-400 shrink-0" />
        <span>
          {isEn
            ? 'Estimated projection for planning only. Official statement is issued on the 5th based on actual meter readings.'
            : 'Số liệu mang tính ước tính tham khảo. Hóa đơn chính thức được Ban Quản Lý chốt vào ngày 05 theo chỉ số đồng hồ thực tế.'}
        </span>
      </div>
    </div>
  );
}

