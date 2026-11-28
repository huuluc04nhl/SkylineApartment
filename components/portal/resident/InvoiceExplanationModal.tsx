'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React from 'react';
import { 
  Sparkles, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Droplets, 
  Zap, 
  Building, 
  ShieldCheck, 
  Calendar, 
  ArrowRight, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export interface InvoiceExplanationData {
  summary: string;
  comparison3Periods: Array<{
    id?: string;
    period: string;
    totalAmount: number;
    status: string;
    electricUsage?: number;
    waterUsage?: number;
    managementFee?: number;
  }>;
  highlights: Array<{
    category: string;
    changePercent: number;
    reason: string;
    suggestion?: string;
  }>;
  advice: string;
  disclaimer: string;
}

interface InvoiceExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceExplanationData | null;
  isLoading: boolean;
  onOpenAiAssistant?: () => void;
}

export default function InvoiceExplanationModal({
  isOpen,
  onClose,
  data,
  isLoading,
  onOpenAiAssistant,
}: InvoiceExplanationModalProps) {
  useEscapeKey(isOpen, onClose);
  const { t, isEn } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#C5A880]/60 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col rounded-none overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222B35] bg-[#121820] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#C5A880]/20 border border-[#C5A880] flex items-center justify-center text-[#C5A880] rounded-none">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t('Giải Thích Hóa Đơn AI', 'AI Invoice Explanation')}</span>
                <span className="px-2 py-0.5 bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/50 text-[10px] font-mono">
                  3 KỲ
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                {t('Phân tích chi tiết từng khoản mục & so sánh chuỗi kỳ tiêu dùng')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1C2533] transition-colors rounded-none"
            title={t('Đóng', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#C5A880] border-t-transparent animate-spin mx-auto" />
              <p className="text-gray-400 text-xs">{t('AI đang tổng hợp dữ liệu 3 kỳ và đối soát định mức...', 'AI synthesizing 3-period records...')}</p>
            </div>
          ) : data ? (
            <>
              {/* Summary Box */}
              <div className="p-4 bg-[#141B24] border border-[#C5A880]/30 space-y-2">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>{t('TỔNG QUAN BIẾN ĐỘNG', 'VARIANCE SUMMARY')}</span>
                </div>
                <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
                  {data.summary}
                </p>
              </div>

              {/* So Sánh 3 Kỳ Gần Nhất */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{t('So Sánh Chi Phí 3 Kỳ Gần Nhất', '3-Month Historical Comparison')}</span>
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">Tháng 08 vs 07 vs 06</span>
                </div>

                <div className="overflow-x-auto border border-[#222B35]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121820] text-gray-400 font-mono text-[10px] uppercase border-b border-[#222B35]">
                      <tr>
                        <th className="p-2.5">{t('Kỳ Thu', 'Period')}</th>
                        <th className="p-2.5 text-right">{t('Điện (kWh)', 'Elec (kWh)')}</th>
                        <th className="p-2.5 text-right">{t('Nước (m³)', 'Water (m³)')}</th>
                        <th className="p-2.5 text-right">{t('Tổng Chi Phí', 'Total Amount')}</th>
                        <th className="p-2.5 text-center">{t('Trạng Thái', 'Status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222B35]">
                      {data.comparison3Periods.map((p, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-[#161B22] transition-colors ${
                            idx === 0 ? 'bg-[#C5A880]/10 font-medium' : ''
                          }`}
                        >
                          <td className="p-2.5 font-mono text-white flex items-center gap-1.5">
                            {idx === 0 && <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-none inline-block" />}
                            <span>{p.period}</span>
                          </td>
                          <td className="p-2.5 text-right font-mono text-amber-400">
                            {p.electricUsage ? `${p.electricUsage} kWh` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono text-cyan-400">
                            {p.waterUsage ? `${p.waterUsage} m³` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-white">
                            {p.totalAmount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                                p.status === 'Paid'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                                  : 'bg-amber-950 text-amber-400 border border-amber-500/50'
                              }`}
                            >
                              {p.status === 'Paid' ? t('Đã nộp ✓', 'Paid') : t('Chờ nộp', 'Unpaid')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bóc Tách Nguyên Nhân Từng Khoản Mục */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold tracking-wider text-white">
                  {t('Phân Tích Chi Tiết Từng Khoản Mục', 'Detailed Category Analysis')}
                </h4>

                <div className="space-y-2.5">
                  {data.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 bg-[#121820] border border-[#222B35] space-y-1.5 rounded-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {h.category.includes('Điện') ? (
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                          ) : h.category.includes('Nước') ? (
                            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <Building className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{h.category}</span>
                        </div>

                        {h.changePercent !== 0 && (
                          <div
                            className={`flex items-center gap-1 font-mono text-[11px] font-bold ${
                              h.changePercent > 0 ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {h.changePercent > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            <span>{h.changePercent > 0 ? `+${h.changePercent}%` : `${h.changePercent}%`}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-300 text-xs leading-relaxed">
                        {h.reason}
                      </p>

                      {h.suggestion && (
                        <div className="text-[11px] text-[#C5A880] pt-1 flex items-start gap-1 font-medium border-t border-[#222B35]">
                          <span className="shrink-0">👉</span>
                          <span><strong>{t('Khuyến nghị:', 'Tip:')}</strong> {h.suggestion}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice Box */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{data.advice}</span>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-500 italic">
              {t('Không có dữ liệu giải thích cho hóa đơn này.')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222B35] bg-[#121820] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[9px] text-gray-400 font-mono">
            💡 {data?.disclaimer || t('Nội dung do AI tạo, vui lòng đối chiếu hóa đơn gốc.')}
          </div>

          <div className="flex items-center gap-2">
            {onOpenAiAssistant && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAiAssistant();
                }}
                className="px-3 py-1.5 bg-[#1C2533] border border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {t('Chat Hỏi Thêm AI', 'Ask More in Chat')}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#C5A880] text-[#0D1117] hover:bg-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {t('Đã Hiểu', 'Got It')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

