'use client';

import React from 'react';
import { Building, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, BarChart3, Layers, Sparkles } from 'lucide-react';
import { Bill } from '@/lib/dataStore';
import { useLanguage } from '@/lib/languageContext';

interface TowerCollectionSummaryCardProps {
  bills: Bill[];
  onSelectTower?: (towerCode: string) => void;
}

export default function TowerCollectionSummaryCard({ bills, onSelectTower }: TowerCollectionSummaryCardProps) {
  const { t, isEn } = useLanguage();

  const towers = [
    { code: 'BS-07', name: 'The Oasis', totalFloors: 25 },
    { code: 'BS-08', name: 'The Tropical', totalFloors: 30 },
    { code: 'BS-09', name: 'The Sunset', totalFloors: 28 },
    { code: 'BS-10', name: 'The Horizon', totalFloors: 32 },
  ];

  const towerStats = towers.map(tower => {
    const towerBills = bills.filter(
      b => b.apt_code.startsWith(tower.code)
    );
    const totalBilled = towerBills.reduce((s, b) => s + b.total_amount, 0);
    const paidBills = towerBills.filter(b => b.status === 'Paid');
    const totalCollected = paidBills.reduce((s, b) => s + b.total_amount, 0);
    const totalDebt = totalBilled - totalCollected;
    const rateNum = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    return {
      ...tower,
      unitsCount: towerBills.length,
      totalBilled,
      totalCollected,
      totalDebt,
      collectionRate: rateNum,
      unpaidCount: towerBills.length - paidBills.length
    };
  });

  const totalAllBilled = towerStats.reduce((s, t) => s + t.totalBilled, 0);
  const totalAllCollected = towerStats.reduce((s, t) => s + t.totalCollected, 0);
  const totalAllDebt = totalAllBilled - totalAllCollected;
  const overallRate = totalAllBilled > 0 ? ((totalAllCollected / totalAllBilled) * 100).toFixed(1) : '0';

  // AI Highlights / Key Notes
  const topRateTower = [...towerStats].sort((a, b) => b.collectionRate - a.collectionRate)[0];
  const lowestRateTower = [...towerStats].sort((a, b) => a.collectionRate - b.collectionRate)[0];

  return (
    <div className="p-5 bg-[#121820] border border-[#222B35] space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> B5 • {t('Tóm Tắt Kỳ Thu Theo Từng Tòa', 'Collection Summary by Tower')}
          </div>
          <h3 className="font-serif text-base text-white font-bold mt-0.5">
            {t('Tiến Độ Thu Phí Phân Khu The Beverly Solari (BS-07...BS-10)', 'Collection Progress: Blocks BS-07 to BS-10')}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="p-2 bg-[#161D26] border border-[#2A3441] text-right">
            <div className="text-[10px] text-gray-400">Tỷ Lệ Thu Toàn Khu:</div>
            <div className="text-sm font-mono font-bold text-emerald-400">
              {overallRate}%
            </div>
          </div>
          <div className="p-2 bg-[#161D26] border border-[#2A3441] text-right">
            <div className="text-[10px] text-gray-400">Tổng Nợ Tồn:</div>
            <div className="text-sm font-mono font-bold text-amber-400">
              {totalAllDebt.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 4 Towers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {towerStats.map((tItem) => (
          <div
            key={tItem.code}
            className="p-3.5 bg-[#161D26] border border-[#2A3441] hover:border-[#C5A880]/60 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-serif text-sm">
                  {tItem.code}
                </span>
                <span className="text-[10px] font-mono text-[#C5A880] uppercase">
                  {tItem.name}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-gray-400">Thu hồi:</span>
                  <span className="font-bold text-emerald-400">
                    {tItem.collectionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#0D1117] h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(tItem.collectionRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Numbers */}
              <div className="mt-3 pt-2 border-t border-[#222B35] space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-[10px] text-gray-400">Đã thu:</span>
                  <span className="text-emerald-400 font-bold">
                    {tItem.totalCollected.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-[10px] text-gray-400">Còn nợ:</span>
                  <span className={tItem.totalDebt > 0 ? 'text-amber-400 font-bold' : 'text-gray-500'}>
                    {tItem.totalDebt.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[10px]">
              <span className="text-gray-400">
                {tItem.unpaidCount > 0 ? (
                  <span className="text-amber-400 font-bold">Còn {tItem.unpaidCount} căn chưa nộp</span>
                ) : (
                  <span className="text-emerald-400 font-bold">Hoàn tất 100% ✓</span>
                )}
              </span>
              {onSelectTower && (
                <button
                  type="button"
                  onClick={() => onSelectTower(tItem.code)}
                  className="text-[#C5A880] hover:underline flex items-center gap-0.5"
                >
                  <span>Xem</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Key Insights / Notable Highlights */}
      <div className="p-3 bg-[#161B22] border border-[#2D3A4D] space-y-2 text-xs">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Điểm Đáng Chú Ý Trong Kỳ Thu (AI Synthesis):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-300 leading-relaxed">
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Tòa <strong>{topRateTower?.code || 'BS-07'}</strong> dẫn đầu tiến độ thu hồi với tỷ lệ <strong>{topRateTower?.collectionRate.toFixed(1)}%</strong>, phần lớn cư dân thanh toán chủ động qua VietQR / VNPAY trong 5 ngày đầu kỳ.
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Tòa <strong>{lowestRateTower?.code || 'BS-08'}</strong> có số lượng căn hộ chưa nộp cao nhất ({lowestRateTower?.unpaidCount} căn). Khuyến nghị Ban Quản Lý mở công cụ <strong>Soạn Nhắc Nợ (Mức 1 &amp; Mức 2)</strong> để đôn đốc kịp thời.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

