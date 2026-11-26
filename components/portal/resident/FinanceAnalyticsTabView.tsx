'use client';

import React, { useState, useEffect } from 'react';
import { Bill, BillDetail, User } from '@/lib/dataStore';
import { 
  CreditCard, 
  AlertTriangle, 
  Download, 
  CheckCircle2, 
  QrCode, 
  Shield, 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Building,
  Lock,
  Calendar,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Clock,
  Zap,
  Droplets,
  Car,
  Shirt,
  Dumbbell,
  Tag,
  Wifi,
  Globe,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Coins,
  Activity,
  CalendarDays,
  FileSpreadsheet,
  CheckCheck,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Percent,
  Layers,
  Info
} from 'lucide-react';
import { 
  getBills, 
  payBill, 
  ExtendedBill,
  calculateBillFundAllocation,
  BillFundAllocation,
  generateVietQrUrl,
  SKYLINE_BANK_INFO,
  SKYLINE_MOMO_INFO
} from '@/lib/billingStore';
import { exportInvoicePdf } from '@/lib/pdfExport';
import { useLanguage } from '@/lib/languageContext';
import { toast } from '@/components/ui/Toast';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';
import { ResourceSkeleton, ResourceError, ResourceEmpty } from '@/components/ui/ResourceState';
import BillingAiAssistantDrawer from './BillingAiAssistantDrawer';
import InvoiceExplanationModal, { InvoiceExplanationData } from './InvoiceExplanationModal';
import CostForecastCard from './CostForecastCard';
import SmartPaymentReminderBanner from './SmartPaymentReminderBanner';

export const VNPAY_NCB_TEST_CARD = {
  bank: 'NCB',
  cardNumber: '9704198526191432198',
  cardHolder: 'NGUYEN VAN A',
  issueDate: '07/15',
  otp: '123456',
};


export default function FinanceAnalyticsTabView({ ctx }: { ctx: any }) {
  const { t, isEn, currentUser, aptCode, SKYLINE_BANK_INFO, generateVietQrUrl, bills, setBills, selectedBillId, setSelectedBillId, cycleMode, setCycleMode, selectedQuarterId, setSelectedQuarterId, showVietQrModal, setShowVietQrModal, showAiAssistant, setShowAiAssistant, showExplainModal, setShowExplainModal, explainData, setExplainData, isExplaining, setIsExplaining, isRedirectingVnpay, setIsRedirectingVnpay, copiedField, setCopiedField, redirectBanner, setRedirectBanner, paymentSuccessToast, setPaymentSuccessToast, isExportingInvoicePdf, setIsExportingInvoicePdf, activeTab, setActiveTab, analyticsCategory, setAnalyticsCategory, residentName, residentPhone, triggerPaymentSuccessToast, handleExportInvoicePdf, handleExplainBill, copyToClipboard, refreshBills, currentBill, billAmountFormatted, handleConfirmVietQrPaid, handleOpenVnpaySandbox, getItemIcon, getItemName, sortedBills, newestBillsFirst, quarters, currentQuarter, totalSpendAll, avgMonthlySpend, paidCount, onTimeRate, allDetails, electricityDetails, waterDetails, mgmtDetails, parkingDetails, internetDetails, serviceDetails, facilityDetails, sumCategory, totalElec, totalWater, totalMgmt, totalParking, totalInternet, totalLivingServices, totalFacility, totalKwh, totalM3, categoryStats, highestCategory, maxBillAmount, handleExportExpenseCsv, billingResource } = ctx;
  return (
    <>
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. TOP 4 KEY METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="p-4 bg-[#121820] border border-[#222B35] relative overflow-hidden shadow-lg group hover:border-[#C5A880]/50 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider font-semibold">{isEn ? 'Total Spend 2026' : 'Tổng Chi Năm 2026'}</span>
                <div className="w-8 h-8 rounded-none bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#C5A880]">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-white tracking-tight">
                {totalSpendAll.toLocaleString('vi-VN')} đ
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="text-emerald-400 font-mono font-bold flex items-center">
                  <CheckCheck className="w-3.5 h-3.5 mr-0.5" /> {bills.length} kỳ
                </span>
                <span>
                  {sortedBills.length > 0
                    ? `(${sortedBills[0].billing_month.replace('Tháng ', 'T')} - ${sortedBills[sortedBills.length - 1].billing_month.replace('Tháng ', 'T')})`
                    : '(Năm 2026)'}
                </span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-4 bg-[#121820] border border-[#222B35] relative overflow-hidden shadow-lg group hover:border-[#C5A880]/50 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider font-semibold">{isEn ? 'Monthly Average' : 'Trung Bình Tháng'}</span>
                <div className="w-8 h-8 rounded-none bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-[#C5A880] tracking-tight">
                {avgMonthlySpend.toLocaleString('vi-VN')} đ
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="text-cyan-400 font-mono font-bold">{isEn ? 'Standard 2BR' : 'Chuẩn 2PN'}</span>
                <span>{isEn ? 'Apartment 73.2 m²' : 'Căn hộ 73.2 m²'}</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-4 bg-[#121820] border border-[#222B35] relative overflow-hidden shadow-lg group hover:border-[#C5A880]/50 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider font-semibold">{isEn ? 'Highest Category' : 'Hạng Mục Cao Nhất'}</span>
                <div className="w-8 h-8 rounded-none bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-bold text-white truncate" title={highestCategory ? highestCategory.name : 'Phí Quản Lý'}>
                {highestCategory ? highestCategory.name : 'Phí Quản Lý & Điện'}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="text-emerald-400 font-mono font-bold">
                  {highestCategory ? `${highestCategory.percent.toFixed(1)}%` : '0%'}
                </span>
                <span>{isEn ? 'of total spend' : 'tổng chi phí'}</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-4 bg-[#121820] border border-[#222B35] relative overflow-hidden shadow-lg group hover:border-[#C5A880]/50 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="uppercase tracking-wider font-semibold">{isEn ? 'On-Time Payments' : 'Thanh Toán Đúng Hạn'}</span>
                <div className="w-8 h-8 rounded-none bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-emerald-400 tracking-tight">
                {onTimeRate}% Đúng Hạn
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="text-amber-300 font-bold uppercase tracking-wider text-[10px]">Platinum VIP</span>
                <span>• {isEn ? '0 days overdue' : '0 ngày trễ'}</span>
              </div>
            </div>
          </div>

          {/* 2. CƠ CẤU CHI TIÊU THEO HẠNG MỤC (EXPENSE BREAKDOWN CARDS & PROGRESS BARS) */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5" /> Cơ Cấu Chi Phí
                </div>
                <h3 className="font-serif text-lg text-white font-bold mt-0.5">
                  Tỷ Trọng Dịch Vụ & Tiện Ích
                </h3>
              </div>

              {/* Filter categories */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setAnalyticsCategory('ALL')}
                  className={`px-2.5 py-1 text-xs font-mono transition-all ${
                    analyticsCategory === 'ALL'
                      ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                      : 'bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white'
                  }`}
                >
                  Tất Cả ({categoryStats.length})
                </button>
                {categoryStats.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setAnalyticsCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs font-mono transition-all flex items-center gap-1 ${
                      analyticsCategory === cat.id
                        ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                        : 'bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>{cat.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stacked visually proportioned bar of all categories */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{isEn ? 'Expense breakdown allocation:' : 'Thanh phân bổ tỷ trọng tổng chi phí:'}</span>
                <span className="font-mono text-gray-300">100% ({totalSpendAll.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'})</span>
              </div>
              <div className="w-full h-3.5 bg-[#0D1117] rounded-none overflow-hidden flex border border-[#2D3748]">
                {categoryStats.map((cat: any) => {
                  if (cat.percent <= 0) return null;
                  return (
                    <div
                      key={cat.id}
                      style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                      className="h-full transition-all hover:opacity-90 relative group"
                      title={`${cat.name}: ${cat.amount.toLocaleString('vi-VN')} đ (${cat.percent.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-400">
                {categoryStats.map((cat: any) => (
                  <div key={cat.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}:</span>
                    <strong className="text-gray-200 font-mono">{cat.percent.toFixed(1)}%</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid of Category Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {categoryStats
                .filter((cat: any) => analyticsCategory === 'ALL' || analyticsCategory === cat.id)
                .map((cat: any) => {
                  const Icon = cat.icon;
                  return (
                    <div 
                      key={cat.id}
                      className="p-4 bg-[#161B22]/70 border border-[#222B35] hover:border-[#2D3748] transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded bg-[#0D1117] border border-[#222B35]">
                            <Icon className={`w-4 h-4 ${cat.textColor}`} />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{cat.name}</div>
                            <div className="text-[10px] text-gray-400">{cat.rate}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-serif font-bold text-sm text-white font-mono">
                            {cat.amount.toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {cat.percent.toFixed(1)}% tổng chi
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#0D1117] h-1.5 rounded-none overflow-hidden">
                        <div
                          className="h-full rounded-none transition-all duration-500"
                          style={{ width: `${Math.min(cat.percent, 100)}%`, backgroundColor: cat.color }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5 border-t border-[#222B35]">
                        <span className="truncate pr-1">{cat.subtext}</span>
                        <span className="text-gray-300 font-mono font-medium flex-shrink-0">
                          {cat.trend}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* A3: Dự Báo Chi Phí Kỳ Tới & Gợi Ý Tiết Kiệm (Ước Tính) */}
          <CostForecastCard bills={bills} aptCode={aptCode} />

          {/* 3. LỊCH SỬ & XU HƯỚNG CHI TIÊU THEO KỲ HÓA ĐƠN (MONTHLY TREND & COMPARISON) */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Biến Động Qua Các Tháng
                </div>
                <h3 className="font-serif text-lg text-white font-bold mt-0.5">
                  Tiến Trình Chi Phí Sinh Hoạt
                </h3>
              </div>
              <div className="text-xs text-gray-400">
                {isEn ? 'Billing cycle:' : 'Chu kỳ:'} <strong className="text-white">{isEn ? '5th of each month' : 'Ngày 05 hàng tháng'}</strong>
              </div>
            </div>

            {/* Monthly Cards Visual Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {sortedBills.map((b: any, index: number) => {
                const prev = index > 0 ? sortedBills[index - 1] : null;
                const diffAmount = prev ? b.total_amount - prev.total_amount : 0;
                const diffPercent = prev ? Math.round((diffAmount / prev.total_amount) * 100) : 0;

                // Sub-totals inside this bill
                const elecLine = b.details.find((d: any) => d.service_type === 'Electricity')?.total_line_amount || 0;
                const waterLine = b.details.find((d: any) => d.service_type === 'Water')?.total_line_amount || 0;
                const fixedLine = b.details.filter((d: any) => ['Management_Fee', 'Parking', 'Internet'].includes(d.service_type)).reduce((s: number, d: any) => s + d.total_line_amount, 0);
                const serviceLine = b.details.filter((d: any) => !['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'].includes(d.service_type)).reduce((s: number, d: any) => s + d.total_line_amount, 0);

                return (
                  <div 
                    key={b.id}
                    className={`p-4 border transition-all flex flex-col justify-between space-y-4 ${
                      b.id === currentBill?.id
                        ? 'bg-[#161B22] border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-xl'
                        : 'bg-[#161B22]/50 border-[#222B35] hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#222B35]">
                        <span className="font-bold text-white font-mono">{b.billing_month}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold ${
                          b.status === 'Paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                        }`}>
                          {b.status === 'Paid' ? 'Đã Nộp ✓' : 'Chờ Nộp'}
                        </span>
                      </div>

                      <div className="mt-3 text-center">
                        <div className="text-[11px] text-gray-400">{isEn ? 'Statement period:' : 'Hóa đơn kỳ:'}</div>
                        <div className="font-serif text-xl font-bold text-[#C5A880] mt-0.5">
                          {b.total_amount.toLocaleString('vi-VN')} đ
                        </div>
                      </div>

                      {/* Sub-breakdown badges */}
                      <div className="mt-3 pt-3 border-t border-[#222B35] space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="flex items-center gap-1 text-amber-400">
                            <Zap className="w-3 h-3" /> Điện:
                          </span>
                          <span className="font-mono">{elecLine.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Droplets className="w-3 h-3" /> Nước:
                          </span>
                          <span className="font-mono">{waterLine.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Building className="w-3 h-3" /> Cố định:
                          </span>
                          <span className="font-mono">{fixedLine.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                        </div>
                        {serviceLine > 0 && (
                          <div className="flex items-center justify-between text-purple-300 font-bold">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Dịch vụ:
                            </span>
                            <span className="font-mono">{serviceLine.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom comparison indicator & AI button */}
                    <div className="pt-2 border-t border-[#222B35] space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>{isEn ? 'vs previous period:' : 'So kỳ trước:'}</span>
                        {prev ? (
                          <span className={`font-mono font-bold flex items-center gap-0.5 ${
                            diffAmount > 0 ? 'text-amber-400' : diffAmount < 0 ? 'text-emerald-400' : 'text-gray-400'
                          }`}>
                            {diffAmount > 0 ? <ArrowUpRight className="w-3 h-3" /> : diffAmount < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                            {diffAmount > 0 ? `+${diffPercent}%` : diffAmount < 0 ? `${diffPercent}%` : '0%'}
                          </span>
                        ) : (
                          <span className="font-mono text-gray-500">{isEn ? 'Initial period' : 'Kỳ đầu'}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExplainBill(b.id)}
                        disabled={isExplaining}
                        className="w-full py-1.5 px-2 bg-[#0A0E17] hover:bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#C5A880] text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#C5A880]" />
                        <span>{isEn ? 'Explain AI (3-Mo)' : 'Giải Thích AI (3 Kỳ)'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. BẢNG MA TRẬN CHI TIẾT TOÀN BỘ DỊCH VỤ, TIỆN ÍCH, ĐIỆN NƯỚC, INTERNET */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> {t('Bảng Kê Dịch Vụ', 'Services Breakdown')}
                </div>
                <h3 className="font-serif text-lg text-white font-bold mt-0.5">
                  {t('Chi Tiết Định Mức & Tiêu Dùng', 'Usage Quotas & Consumption Details')}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleExportExpenseCsv}
                  className="px-3 py-1.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('Xuất CSV', 'Export CSV')}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0D1117] text-gray-400 border-b border-[#222B35] uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">{isEn ? 'Item' : 'Hạng Mục'}</th>
                    <th className="p-3">{isEn ? 'Fee Type' : 'Loại Phí'}</th>
                    <th className="p-3 text-right whitespace-nowrap">{isEn ? 'Usage / Volume' : 'Sản Lượng'}</th>
                    <th className="p-3 text-right whitespace-nowrap">{isEn ? 'Unit Rate' : 'Đơn Giá'}</th>
                    <th className="p-3 text-right whitespace-nowrap">{isEn ? 'Total Spend' : 'Tổng Chi'}</th>
                    <th className="p-3 text-right whitespace-nowrap">{isEn ? 'Ratio' : 'Tỷ Trọng'}</th>
                    <th className="p-3">{isEn ? 'Note' : 'Ghi Chú'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222B35]">
                  {categoryStats.map((cat: any) => {
                    const Icon = cat.icon;
                    return (
                      <tr key={cat.id} className="hover:bg-[#161B22]/50 transition-colors">
                        <td className="p-3 font-medium text-white flex items-center gap-2 whitespace-nowrap">
                          <Icon className={`w-3.5 h-3.5 ${cat.textColor}`} />
                          <span>{cat.name}</span>
                        </td>
                        <td className="p-3 text-gray-400 whitespace-nowrap">
                          {['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'].includes(cat.id)
                            ? <span className="px-1.5 py-0.5 bg-blue-950/70 border border-blue-500/40 text-blue-300 text-[10px] font-mono">{isEn ? 'Recurring' : 'Định Kỳ'}</span>
                            : <span className="px-1.5 py-0.5 bg-purple-950/70 border border-purple-500/40 text-purple-300 text-[10px] font-mono">{isEn ? 'On-Demand' : 'Dịch Vụ'}</span>
                          }
                        </td>
                        <td className="p-3 text-right font-mono text-gray-200 whitespace-nowrap">
                          {cat.id === 'Electricity' ? `${totalKwh.toLocaleString(isEn ? 'en-US' : 'vi-VN')} kWh` :
                           cat.id === 'Water' ? `${totalM3.toLocaleString(isEn ? 'en-US' : 'vi-VN')} m³` :
                           cat.id === 'Management_Fee' ? `73.2 m² x ${bills.length} ${isEn ? 'mos' : 'tháng'}` :
                           cat.id === 'Internet' ? `${bills.length} ${isEn ? (bills.length > 1 ? 'months' : 'month') : 'tháng'}` :
                           cat.id === 'Parking' ? `${bills.length} ${isEn ? (bills.length > 1 ? 'cycles' : 'cycle') : 'kỳ'}` :
                           `${serviceDetails.length} ${isEn ? (serviceDetails.length > 1 ? 'orders' : 'order') : 'đơn'}`}
                        </td>
                        <td className="p-3 text-right font-mono text-gray-300 whitespace-nowrap">{cat.rate}</td>
                        <td className="p-3 text-right font-mono font-bold text-white whitespace-nowrap">
                          {cat.amount.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#C5A880] whitespace-nowrap">
                          {cat.percent.toFixed(1)}%
                        </td>
                        <td className="p-3 text-gray-400 text-[11px]">{cat.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#0D1117] border-t-2 border-[#2D3748] font-bold">
                  <tr>
                    <td className="p-3 text-white uppercase tracking-wider" colSpan={4}>
                      {isEn ? 'Total Cumulative Spend (May - Aug):' : 'Tổng Chi Tiêu Tích Lũy (T05 - T08):'}
                    </td>
                    <td className="p-3 text-right font-serif text-sm font-bold text-[#C5A880] font-mono whitespace-nowrap">
                      {totalSpendAll.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">100%</td>
                    <td className="p-3 text-gray-400 text-[11px]">{isEn ? 'Incl. 10% VAT' : 'Đã bao gồm 10% VAT'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. GỢI Ý TỐI ƯU HÓA CHI PHÍ & CẢNH BÁO AI THÔNG MINH (AI SMART INSIGHTS) */}
          <div className="p-6 bg-[#121820] border border-[#222B35] space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#222B35] pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif text-base text-white font-bold">
                {t('Gợi Ý AI Tối Ưu Năng Lượng & Chi Phí', 'AI Energy & Cost Optimization Insights')}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Insight 1: Tiết kiệm điện */}
              <div className="p-4 bg-[#161B22] border border-amber-500/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Zap className="w-4 h-4" />
                  <span>{t('Tối Ưu Hóa Tiền Điện', 'Electricity Cost Optimization')}</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  {t(
                    'Mức tiêu thụ điện tháng 8 là 340 kWh, cao hơn 21% so với tháng 7 do nắng nóng. Bật điều hòa ở mức 26°C kết hợp quạt đối lưu có thể giúp căn hộ tiết kiệm từ 120.000 - 180.000 đ/tháng.',
                    'August electricity usage was 340 kWh (+21% vs July). Setting AC to 26°C with ceiling fans can save 120,000 - 180,000 VND/month.'
                  )}
                </p>
              </div>

              {/* Insight 2: Cảnh báo nước */}
              <div className="p-4 bg-[#161B22] border border-cyan-500/40 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Droplets className="w-4 h-4" />
                  <span>{t('Giám Sát Lưu Lượng Nước', 'Water Consumption Monitoring')}</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  {t(
                    'Cảm biến đồng hồ nước thông minh IoT phát hiện lưu lượng nước đêm (02:00 - 04:00) tại phòng vệ sinh master. Cư dân có thể gửi yêu cầu hỗ trợ kỹ thuật trên Portal để được kiểm tra van miễn phí.',
                    'IoT smart meters detected overnight flow (02:00 - 04:00) in the master bathroom. Submit a ticket on the Portal for a free valve inspection.'
                  )}
                </p>
              </div>

              {/* Insight 3: Dịch vụ & Internet */}
              <div className="p-4 bg-[#161B22] border border-teal-500/40 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-bold">
                  <Wifi className="w-4 h-4" />
                  <span>{t('Ưu Đãi Cáp Quang & Dịch Vụ', 'Fiber Internet & Service Promotions')}</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  {t(
                    'Đường truyền Internet Fiber 300Mbps hoạt động ổn định 99.98% uptime. Khi đặt kèm các dịch vụ đời sống (Giặt ủi, PT, Dọn dẹp), điểm tích lũy Skyline Rewards sẽ được hoàn trực tiếp vào kỳ hóa đơn tiếp theo.',
                    'Fiber 300Mbps operates at 99.98% uptime. Bundling lifestyle services (Laundry, PT, Cleaning) earns Skyline Rewards credited to your next bill.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
