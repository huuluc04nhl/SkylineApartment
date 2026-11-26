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


export default function FinanceBillingTabView({ ctx }: { ctx: any }) {
  const { t, isEn, currentUser, aptCode, SKYLINE_BANK_INFO, generateVietQrUrl, bills, setBills, selectedBillId, setSelectedBillId, cycleMode, setCycleMode, selectedQuarterId, setSelectedQuarterId, showVietQrModal, setShowVietQrModal, showAiAssistant, setShowAiAssistant, showExplainModal, setShowExplainModal, explainData, setExplainData, isExplaining, setIsExplaining, isRedirectingVnpay, setIsRedirectingVnpay, copiedField, setCopiedField, redirectBanner, setRedirectBanner, paymentSuccessToast, setPaymentSuccessToast, isExportingInvoicePdf, setIsExportingInvoicePdf, activeTab, setActiveTab, analyticsCategory, setAnalyticsCategory, residentName, residentPhone, triggerPaymentSuccessToast, handleExportInvoicePdf, handleExplainBill, copyToClipboard, refreshBills, currentBill, billAmountFormatted, handleConfirmVietQrPaid, handleOpenVnpaySandbox, getItemIcon, getItemName, sortedBills, newestBillsFirst, quarters, currentQuarter, totalSpendAll, avgMonthlySpend, paidCount, onTimeRate, allDetails, electricityDetails, waterDetails, mgmtDetails, parkingDetails, internetDetails, serviceDetails, facilityDetails, sumCategory, totalElec, totalWater, totalMgmt, totalParking, totalInternet, totalLivingServices, totalFacility, totalKwh, totalM3, categoryStats, highestCategory, maxBillAmount, handleExportExpenseCsv, billingResource } = ctx;
  return (
    <>
      {activeTab === 'BILLING' && (
        <div className="space-y-6 animate-fadeIn">

          {/* A4: Nhắc Hạn Thanh Toán Thông Minh Trong Giao Diện */}
          <SmartPaymentReminderBanner
            bill={currentBill}
            onPayVnpay={handleOpenVnpaySandbox}
            onPayVietQr={() => setShowVietQrModal(true)}
          />

          {/* Cảnh báo rò rỉ / biến động tiêu thụ */}
      {currentBill?.has_ai_anomaly && (
        <div className="p-4 bg-amber-950/40 border border-amber-500 flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-gray-200">
            <div className="text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Cảnh Báo Tiêu Thụ Nước Bất Thường
            </div>
            <p className="text-gray-300">
              {isEn ? <>Continuous flow detected between <strong>02:00 - 04:00 AM</strong> (+115% compared to last month).</> : <>Hệ thống phát hiện dòng chảy liên tục khung giờ <strong>02:00 - 04:00 sáng</strong> (+115% so với tháng trước).</>}
              Vui lòng kiểm tra van xả bồn cầu hoặc thiết bị vệ sinh trong căn hộ để tránh phát sinh chi phí lãng phí nước sạch.
            </p>
          </div>
        </div>
      )}

      {/* Segmented Cycle Selector: Theo Tháng vs Theo Quý */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0D1117] p-1 border border-[#222B35]">
            <button
              type="button"
              onClick={() => setCycleMode('MONTH')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                cycleMode === 'MONTH'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('Đóng Phí Theo Tháng')}</span>
            </button>
            <button
              type="button"
              onClick={() => setCycleMode('QUARTER')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                cycleMode === 'QUARTER'
                  ? 'bg-[#C5A880] text-[#0D1117] shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('Đóng Phí Theo Quý')}</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
                -5%
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Pills based on cycleMode */}
        {cycleMode === 'MONTH' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {newestBillsFirst.map((b: any) => (
              <button
                key={b.id}
                onClick={() => setSelectedBillId(b.id)}
                className={`px-3 py-1.5 text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                  (currentBill?.id === b.id)
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white'
                }`}
              >
                <span>{t(b.billing_month)}</span>
                <span className={`text-[10px] px-1.5 py-0.2 border ${
                  b.status === 'Paid'
                    ? (currentBill?.id === b.id ? 'border-[#0D1117] text-[#0D1117]' : 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40')
                    : (currentBill?.id === b.id ? 'border-[#0D1117] bg-[#0D1117] text-amber-300 font-bold' : 'border-amber-500/50 text-amber-300 bg-amber-950/40')
                }`}>
                  {b.status === 'Paid' ? t('Đã nộp ✓') : t('Chờ nộp')}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {quarters.map((q: any) => (
              <button
                key={q.id}
                onClick={() => setSelectedQuarterId(q.id)}
                className={`px-3 py-1.5 text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedQuarterId === q.id
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white'
                }`}
              >
                <span>{q.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 border ${
                  q.status === 'Active'
                    ? (selectedQuarterId === q.id ? 'border-[#0D1117] bg-[#0D1117] text-amber-300 font-bold' : 'border-amber-500/50 text-amber-300 bg-amber-950/40')
                    : (selectedQuarterId === q.id ? 'border-[#0D1117] text-[#0D1117]' : 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40')
                }`}>
                  {q.status === 'Active' ? t('Kỳ Hiện Tại') : t('Đã Quyết Toán ✓')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {cycleMode === 'QUARTER' ? (
        <div className="p-6 bg-[#121820] border border-[#222B35] space-y-6 shadow-xl animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
            <div>
              <div className="text-xs text-gray-400">{t('Quyết toán theo quý:')} <strong className="text-white">{currentQuarter.name} ({currentQuarter.periodText})</strong></div>
              <div className="text-xs text-gray-400 mt-0.5">
                {t('Phân kỳ quản lý:')} <strong className="text-emerald-400">{currentQuarter.status === 'Active' ? t('Đang Mở Thu Phí Kỳ Tháng 11/2026') : t('Đã Quyết Toán Đầy Đủ 100%')}</strong>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {t('Chính sách ưu đãi:')} <strong className="text-gray-200">{t('Chiết khấu 5% Phí Quản Lý Vận Hành khi thanh toán trước theo quý')}</strong>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs uppercase tracking-wider text-gray-400">{t('Tổng Chi Phí Cả Quý')}</div>
              <div className="font-serif text-3xl font-bold text-[#C5A880]">
                {currentQuarter.totalEstimate.toLocaleString('vi-VN')} đ
              </div>
              <div className="mt-1 flex items-center justify-start sm:justify-end gap-2">
                <span className={`px-2.5 py-0.5 text-[10px] uppercase font-bold font-mono ${
                  currentQuarter.status === 'Active'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                }`}>
                  {currentQuarter.status === 'Active' ? t('Đang Mở Thu Phí') : t('✓ Đã Quyết Toán')}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Metric Cards for the Quarter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#0D1117] border border-[#222B35]">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider">{t('Tổng Nghĩa Vụ Quý')}</div>
              <div className="font-mono text-lg font-bold text-white mt-1">
                {currentQuarter.totalEstimate.toLocaleString('vi-VN')} đ
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{currentQuarter.months.length} {t('kỳ hàng tháng')}</div>
            </div>

            <div className="p-3.5 bg-[#0D1117] border border-emerald-500/30">
              <div className="text-[11px] text-emerald-400 uppercase tracking-wider">{t('Đã Quyết Toán')}</div>
              <div className="font-mono text-lg font-bold text-emerald-400 mt-1">
                {currentQuarter.paidAmount.toLocaleString('vi-VN')} đ
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {Math.round((currentQuarter.paidAmount / currentQuarter.totalEstimate) * 100)}% {t('tiến độ quý')}
              </div>
            </div>

            <div className="p-3.5 bg-[#0D1117] border border-amber-500/30">
              <div className="text-[11px] text-amber-400 uppercase tracking-wider">{t('Còn Phải Nộp')}</div>
              <div className="font-mono text-lg font-bold text-amber-400 mt-1">
                {currentQuarter.remainingAmount.toLocaleString('vi-VN')} đ
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {currentQuarter.remainingAmount > 0 ? t('Bao gồm Tháng 11 đến hạn') : t('Không có dư nợ')}
              </div>
            </div>
          </div>

          {/* Bảng Kê Các Tháng Trong Quý */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
              <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#C5A880]" />
                <span>{t('Tiến Độ Các Kỳ Tháng Trong Quý')}</span>
              </h3>
              <span className="text-[11px] text-gray-400 font-mono">
                {currentQuarter.periodText}
              </span>
            </div>

            <div className="overflow-x-auto border border-[#222B35] bg-[#161B22]/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#222B35] bg-[#121820] text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                    <th className="py-3 px-4">{t('Kỳ Tháng')}</th>
                    <th className="py-3 px-4">{t('Trạng Thái')}</th>
                    <th className="py-3 px-4">{t('Ngày Ghi Nhận / Hạn Nộp')}</th>
                    <th className="py-3 px-4 text-right">{t('Số Tiền')}</th>
                    <th className="py-3 px-4 text-right">{t('Thao Tác')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222B35]">
                  {currentQuarter.months.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#1A222D] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>{t(m.name)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold font-mono border ${
                          m.status === 'Paid'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                            : m.status === 'Unpaid'
                            ? 'bg-amber-950/70 text-amber-300 border-amber-500/50'
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}>
                          {m.status === 'Paid' ? t('Đã Nộp ✓') : m.status === 'Unpaid' ? t('Chờ Thanh Toán') : t('Ước Tính')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-mono text-[11px]">
                        {m.paidDate ? `${t('Đã nộp:')} ${m.paidDate} (${m.method})` : m.dueDate ? `${t('Hạn nộp:')} ${m.dueDate}` : (m as any).note || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {m.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {m.status === 'Unpaid' && m.bill && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBillId(m.bill!.id);
                                setCycleMode('MONTH');
                              }}
                              className="px-2.5 py-1 bg-[#C5A880] text-[#0D1117] hover:bg-white text-[10px] font-bold uppercase tracking-wider"
                            >
                              {t('Xem & Thanh Toán')}
                            </button>
                          </div>
                        )}
                        {m.status === 'Paid' && m.bill && (
                          <button
                            type="button"
                            onClick={() => handleExportInvoicePdf(m.bill!)}
                            className="px-2.5 py-1 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-[#C5A880] text-[10px] font-mono flex items-center gap-1 ml-auto"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                        )}
                        {m.status === 'Estimated' && (
                          <span className="text-[10px] text-gray-400 italic">{t('Kỳ tiếp theo')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Platinum Resident Incentive Banner for Active Quarter */}
          {currentQuarter.id === 'Q4_2026' && currentQuarter.remainingAmount > 0 && (
            <div className="p-4 bg-gradient-to-r from-[#121820] to-[#1C2533] border border-[#C5A880] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 text-[#C5A880] border border-[#C5A880]/50 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880]">
                      {t('Đặc Quyền Skyline Platinum: Đóng Phí Trọn Quý 4')}
                    </div>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      {t('Thanh toán trước trọn gói Quý 4 nhận ngay chiết khấu 5% Phí Quản Lý Vận Hành. Tổng tiết kiệm:')}{' '}
                      <strong className="text-emerald-400 font-mono">113.400 đ</strong>. {t('Số tiền sau ưu đãi:')}{' '}
                      <strong className="text-[#C5A880] font-mono">4.821.600 đ</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenVnpaySandbox()}
                    className="px-3.5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{t('Thanh Toán Tháng 11 (2.485k)')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowVietQrModal(true)}
                    className="px-3.5 py-2 bg-[#161B22] border border-[#C5A880] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t('Gói Trọn Quý 4 (-5%)')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : currentBill ? (
        <div className="p-6 bg-[#121820] border border-[#222B35] space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
            <div>
              <div className="text-xs text-gray-400">{t('Kỳ thu phí:')} <strong className="text-white">{t(currentBill.billing_month)}</strong></div>
              <div className="text-xs text-gray-400 mt-0.5">
                {t('Hạn chót thanh toán:')} <strong className="text-amber-400 font-mono">
                  {new Date(currentBill.due_date).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}
                </strong>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {t('Đơn vị quản lý thu:')} <strong className="text-gray-200">{t('Ban Quản Lý Chung Cư Skyline Smart Residence')}</strong>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs uppercase tracking-wider text-gray-400">{t('Tổng Số Tiền Cần Thanh Toán')}</div>
              <div className="font-serif text-3xl font-bold text-[#C5A880]">
                {billAmountFormatted} đ
              </div>
              <div className="mt-1 flex items-center justify-start sm:justify-end gap-2">
                <span className={`px-2.5 py-0.5 text-[10px] uppercase font-bold font-mono ${
                  currentBill.status === 'Paid'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                    : 'bg-amber-950 text-amber-300 border border-amber-600'
                }`}>
                  {currentBill.status === 'Paid' ? t('✓ Đã Thanh Toán Hoàn Tất') : t('Chờ Thanh Toán')}
                </span>

                {currentBill.payment_method && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                    currentBill.payment_method === 'VNPAY'
                      ? 'bg-[#005BAA]/20 text-[#005BAA] border border-[#005BAA]/50'
                      : currentBill.payment_method === 'MOMO'
                        ? 'bg-[#A50064]/20 text-[#D82D8B] border border-[#A50064]/50'
                        : 'bg-gray-800 text-gray-300 border border-gray-600'
                  }`}>
                    {t('Qua')} {currentBill.payment_method}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BẢNG KÊ CHI TIẾT PHÍ SINH HOẠT TRONG KỲ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
              <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#C5A880]" />
                <span>{t('Bảng Kê Chi Tiết Phí Sinh Hoạt', 'Detailed Statement of Living Expenses')}</span>
              </h3>
              <span className="text-[11px] text-gray-400 font-mono">
                {currentBill.details?.length || 0} {t('khoản mục trong kỳ', 'items in period')}
              </span>
            </div>

            {/* Bảng kê chi phí thanh lịch, thân thiện cư dân */}
            <div className="overflow-x-auto border border-[#222B35] bg-[#161B22]/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#222B35] bg-[#121820] text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                    <th className="py-3 px-4">{t('Khoản Mục & Diễn Giải', 'Item & Description')}</th>
                    <th className="py-3 px-4 text-center">{t('Chỉ Số / Khối Lượng', 'Usage / Quantity')}</th>
                    <th className="py-3 px-4 text-right">{t('Đơn Giá', 'Unit Price')}</th>
                    <th className="py-3 px-4 text-right">{t('Thành Tiền', 'Amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222B35]">
                  {currentBill.details.map((item: any) => {
                    const isService = !['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'].includes(item.service_type);
                    return (
                      <tr key={item.id} className="hover:bg-[#1A222D] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-[#0D1117] border border-[#2D3748] text-gray-300 shrink-0">
                              {getItemIcon(item.service_type)}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{getItemName(item)}</span>
                                {isService && (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-purple-950/70 border border-purple-500/50 text-purple-300 font-normal">
                                    {t('Dịch vụ yêu cầu', 'Requested')}
                                  </span>
                                )}
                              </div>
                              {item.order_date && (
                                <div className="text-[11px] text-gray-400 mt-0.5">
                                  {t('Ngày sử dụng')}: {item.order_date} {item.booking_ref && `• #${item.booking_ref}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-300 font-mono">
                          <span className="font-bold text-white">{item.usage}</span>{' '}
                          <span className="text-[11px] text-gray-400">
                            {item.unit || (item.service_type === 'Electricity' ? 'kWh' : item.service_type === 'Water' ? 'm³' : item.service_type === 'Management_Fee' ? 'm²' : t('xe'))}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-300 font-mono">
                          {item.unit_price ? `${item.unit_price.toLocaleString('vi-VN')} đ` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-white">
                          {item.total_line_amount.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Dòng Tổng Kết Cuối Bảng */}
              <div className="p-4 bg-[#0D1117] border-t border-[#222B35] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('Đã bao gồm thuế GTGT và các khoản quỹ theo quy định chung cư')}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {t('Hạn chót thanh toán kỳ này:')}{' '}
                    <span className="text-amber-400 font-mono font-semibold">
                      {new Date(currentBill.due_date).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                    {t('Tổng Cộng Cần Thanh Toán', 'Total Due')}:
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#C5A880] font-mono">
                    {currentBill.total_amount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Minh Bạch Nguồn Tiền Thanh Toán (Phân bổ tiền đóng rõ ràng) */}
          {(() => {
            const allocation = calculateBillFundAllocation(currentBill);
            return (
              <div className="p-4 bg-[#0D1117] border border-[#C5A880]/50 space-y-3.5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222B35] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#1C2533] border border-[#C5A880]/70 flex items-center justify-center text-[#C5A880]">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-white text-sm">
                        {t('Minh Bạch Nguồn Tiền Thanh Toán', 'Clear Payment Fund Allocation')}
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        {t('Khoản tiền đóng của căn hộ được tự động phân bổ vào từng mục tiêu cụ thể:', 'Your payment is automatically allocated into specific transparent funds:')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/50 px-2 py-0.5 font-semibold uppercase tracking-wider">
                      ✓ {t('Tách Bạch Quỹ • Đúng Quy Định', 'Separate Funds • Verified')}
                    </span>
                  </div>
                </div>

                {/* 3 Khối nguồn tiền rõ ràng */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Túi 1: Thu hộ Điện Nước Nhà Nước */}
                  <div className="p-3 bg-[#121820] border border-cyan-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5" /> {t('Thu Hộ Điện & Nước', 'State Utility Collection')}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold text-xs bg-cyan-950/60 px-1.5 py-0.5 border border-cyan-500/40">
                        {allocation.stateUtilitiesPercent}%
                      </span>
                    </div>
                    <div className="font-mono text-base font-bold text-white">
                      {allocation.stateUtilitiesAmount.toLocaleString('vi-VN')} đ
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      {t('Chung cư chỉ thu hộ và chuyển 100% về Điện lực EVN và Cấp nước. Ban Quản Lý không giữ lại khoản này.', 'Collected on behalf and remitted 100% to EVN Power and City Water. Management keeps 0% of this fund.')}
                    </p>
                  </div>

                  {/* Túi 2: Chi phí duy trì tòa nhà & Tiện ích cư dân */}
                  <div className="p-3 bg-[#121820] border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" /> {t('Duy Trì Tòa Nhà & Tiện Ích', 'Building Operations & Amenities')}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold text-xs bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-500/40">
                        {allocation.operationsPercent}%
                      </span>
                    </div>
                    <div className="font-mono text-base font-bold text-white">
                      {allocation.operationsAmount.toLocaleString('vi-VN')} đ
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      {t('Trực tiếp chi trả an ninh 24/7, vệ sinh sảnh, chiếu sáng công cộng, bảo trì thang máy, hồ bơi & phòng gym.', 'Directly funds 24/7 security, janitorial, hallway lighting, elevators, swimming pool & gym operations.')}
                    </p>
                  </div>

                  {/* Túi 3: Quỹ bảo dưỡng & Cáp quang */}
                  <div className="p-3 bg-[#121820] border border-[#C5A880]/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> {t('Quỹ Bảo Dưỡng & Mạng', 'Maintenance Fund & Network')}
                      </span>
                      <span className="font-mono text-[#C5A880] font-bold text-xs bg-[#C5A880]/10 px-1.5 py-0.5 border border-[#C5A880]/40">
                        {allocation.maintenancePercent + allocation.taxesAndTelecomPercent}%
                      </span>
                    </div>
                    <div className="font-mono text-base font-bold text-white">
                      {(allocation.maintenanceAmount + allocation.taxesAndTelecomAmount).toLocaleString('vi-VN')} đ
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      {t('Tích lũy vào tài khoản riêng để đại tu thiết bị chung (máy phát, cáp thang máy) và đường truyền cáp quang.', 'Reserved for long-term repairs of shared assets (generators, elevator cables) and VNPT fiber connection.')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* KHỐI HÀNH ĐỘNG THANH TOÁN THỰC TẾ & MINH BẠCH */}
          {currentBill.status === 'Unpaid' ? (
            <div className="p-5 bg-gradient-to-r from-[#121820] to-[#161B22] border border-[#C5A880]/60 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>{t('Chọn Phương Thức Thanh Toán Trực Tiếp', 'Select Payment Option')}</span>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    {t('Thanh toán tức thời qua Cổng VNPAY quốc gia hoặc quét mã VietQR 24/7 từ mọi ứng dụng ngân hàng.')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 font-mono">
                    ✓ {t('Gạch Nợ Tự Động 24/7')}
                  </span>
                </div>
              </div>

              {/* Các nút bấm thanh toán chính */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Nút 1: Chuyển tiếp cổng VNPAY */}
                <button
                  type="button"
                  onClick={() => handleOpenVnpaySandbox()}
                  disabled={isRedirectingVnpay}
                  className="p-4 bg-[#C5A880] hover:bg-[#D4BC96] text-[#0D1117] transition-all flex items-center justify-between shadow-lg group text-left cursor-pointer disabled:opacity-75"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      {isRedirectingVnpay ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#0D1117]" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-[#0D1117]" />
                      )}
                      <span>{isRedirectingVnpay ? t('Đang chuyển hướng...') : t('Thanh Toán Qua Cổng VNPAY')}</span>
                    </div>
                    <div className="text-[11px] text-[#222B35] font-medium">
                      {t('Chuyển tiếp sang VNPAY • Hỗ trợ thẻ ATM nội địa, Visa/Mastercard & VNPAY-QR')}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 shrink-0 text-[#0D1117] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Nút 2: Quét mã VietQR 24/7 */}
                <button
                  type="button"
                  onClick={() => setShowVietQrModal(true)}
                  className="p-4 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-white transition-all flex items-center justify-between shadow text-left cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-xs uppercase tracking-wider text-[#C5A880] flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      <span>{t('Quét Mã Chuyển Khoản VietQR 24/7')}</span>
                    </div>
                    <div className="text-[11px] text-gray-300">
                      {t('Mở mã QR Napas 24/7 • Quét bằng mọi App Ngân hàng (VCB, MB, Techcombank, BIDV...)')}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-[#121820] border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-white text-sm">
                    {t('Hóa Đơn Đã Được Thanh Toán Hoàn Tất')}
                  </h4>
                  <p className="text-[11px] text-emerald-300 mt-0.5">
                    {currentBill.payment_method ? `${t('Phương thức:')} ${currentBill.payment_method}` : ''}
                    {currentBill.paid_at ? ` • ${t('Ngày nộp:')} ${new Date(currentBill.paid_at).toLocaleString('vi-VN')}` : ''}
                    {currentBill.transaction_ref ? ` • ${t('Mã GD:')} #${currentBill.transaction_ref}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExportInvoicePdf(currentBill)}
                disabled={isExportingInvoicePdf}
                className="px-4 py-2.5 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 self-start sm:self-auto"
              >
                {isExportingInvoicePdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C5A880]" />
                ) : (
                  <Download className="w-4 h-4 text-[#C5A880]" />
                )}
                <span>{t('Tải Biên Nhận PDF')}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 bg-[#121820] border border-[#222B35] text-center text-gray-400 text-xs">
          Căn hộ hiện chưa có hóa đơn nào được phát hành.
        </div>
      )}

      {/* A3: Dự Báo Chi Phí Kỳ Tới & Gợi Ý Tiết Kiệm Năng Lượng */}
      <CostForecastCard bills={bills} aptCode={aptCode} />
      </div>
      )}

    </>
  );
}
