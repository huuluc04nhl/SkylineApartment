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

import FinanceBillingTabView from './FinanceBillingTabView';
import FinanceAnalyticsTabView from './FinanceAnalyticsTabView';
interface FinanceBillingProps {
  currentUser?: User;
}

export default function FinanceBilling({ currentUser }: FinanceBillingProps) {
  const { t, isEn, language } = useLanguage();
  const aptCode = currentUser?.apartment_code || 'CH-06';
  const residentName = currentUser?.full_name || (currentUser as any)?.fullname || 'Cư Dân';
  const residentPhone = currentUser?.phone || '';

  const [bills, setBills] = useState<ExtendedBill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [cycleMode, setCycleMode] = useState<'MONTH' | 'QUARTER'>('MONTH');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>('Q4_2026');
  const [showVietQrModal, setShowVietQrModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainData, setExplainData] = useState<InvoiceExplanationData | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  
  // VNPAY Sandbox Real API states
  const [isRedirectingVnpay, setIsRedirectingVnpay] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [redirectBanner, setRedirectBanner] = useState<{
    type: 'success' | 'failed' | 'invalid_checksum';
    message: string;
  } | null>(null);

  // Toast thông báo thanh toán thành công
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<{
    show: boolean;
    transId: string;
    amount: number;
    gateway: string;
    paidAt: string;
    message?: string;
  } | null>(null);

  const [isExportingInvoicePdf, setIsExportingInvoicePdf] = useState(false);

  const triggerPaymentSuccessToast = (transId: string, amount: number, gateway = 'VNPAY', message?: string) => {
    setPaymentSuccessToast({
      show: true,
      transId,
      amount,
      gateway,
      paidAt: new Date().toLocaleString('vi-VN'),
      message,
    });
    setTimeout(() => {
      setPaymentSuccessToast(null);
    }, 7000);
  };

  const handleExportInvoicePdf = async (billToExport?: ExtendedBill) => {
    const target = billToExport || currentBill;
    if (!target) return;
    setIsExportingInvoicePdf(true);
    await exportInvoicePdf({
      bill: target,
      residentName,
      aptCode,
    });
    setIsExportingInvoicePdf(false);
  };

  const handleExplainBill = async (billId?: string) => {
    const targetId = billId || currentBill?.id;
    if (!targetId) return;
    setShowExplainModal(true);
    setIsExplaining(true);
    setExplainData(null);
    try {
      const res = await fetch('/api/billing/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: targetId }),
      });
      const json = await res.json();
      if (json.success && json.explanation) {
        setExplainData(json.explanation);
      }
    } catch (err) {
      console.error('Explain bill error:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const refreshBills = () => {
    const list = getBills(aptCode, residentName);
    setBills(list);
  };

  useEffect(() => {
    refreshBills();
    const handleUpdate = () => refreshBills();
    window.addEventListener('skyline_billing_updated', handleUpdate);

    // Kiểm tra kết quả phản hồi khi được VNPAY redirect về
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const vnpStatus = urlParams.get('vnp_status');
      if (vnpStatus) {
        const transId = urlParams.get('transId') || `VNP${Date.now().toString().slice(-8)}`;
        const amountStr = urlParams.get('amount');
        const billIdParam = urlParams.get('billId');
        const bankCode = urlParams.get('bank') || 'VNPAY';
        const code = urlParams.get('code') || '';

        if (vnpStatus === 'success') {
          if (billIdParam) {
            payBill(billIdParam, 'VNPAY', transId, bankCode);
            setSelectedBillId(billIdParam);
          }
          refreshBills();
          const paidAmount = amountStr ? parseFloat(amountStr) : 0;
          setRedirectBanner({
            type: 'success',
            message: `Giao dịch qua Cổng VNPAY Sandbox thành công! Mã chuẩn chi: #${transId} (${bankCode}) • Số tiền: ${paidAmount.toLocaleString('vi-VN')} VNĐ. Hóa đơn căn ${aptCode} đã được tự động gạch nợ thành công!`,
          });
          triggerPaymentSuccessToast(
            transId, 
            paidAmount, 
            'VNPAY', 
            `Hóa đơn căn ${aptCode} kỳ ${currentBill?.billing_month || ''} đã được tự động gạch nợ thành công.`
          );
        } else if (vnpStatus === 'failed') {
          if (billIdParam) setSelectedBillId(billIdParam);
          const getVnpayErrMsg = (c: string) => {
            switch (c) {
              case '24': return 'Khách hàng đã hủy giao dịch trên cổng VNPAY.';
              case '09': return 'Thẻ/Tài khoản của quý khách chưa đăng ký dịch vụ InternetBanking.';
              case '10': return 'Quý khách đã xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.';
              case '11': return 'Đã hết thời gian chờ thanh toán (Timeout).';
              case '12': return 'Thẻ/Tài khoản của quý khách đang bị khóa.';
              case '51': return 'Số dư tài khoản không đủ để thực hiện thanh toán.';
              case '65': return 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.';
              case '75': return 'Ngân hàng thanh toán đang trong quá trình bảo trì.';
              case '79': return 'Nhập sai mật khẩu xác thực quá số lần quy định.';
              default: return `Giao dịch thanh toán VNPAY không hoàn tất (Mã lỗi: ${c || 'Không xác định'}).`;
            }
          };
          setRedirectBanner({
            type: 'failed',
            message: getVnpayErrMsg(code),
          });
        } else if (vnpStatus === 'invalid_checksum') {
          setRedirectBanner({
            type: 'failed',
            message: 'Chữ ký số bảo mật VNPAY (Checksum) không hợp lệ. Giao dịch đã bị từ chối để đảm bảo an toàn.',
          });
        } else if (vnpStatus === 'error') {
          setRedirectBanner({
            type: 'failed',
            message: 'Đã xảy ra lỗi trong quá trình tiếp nhận dữ liệu phản hồi từ VNPAY.',
          });
        }

        // Dọn dẹp query param VNPAY nhưng giữ nguyên tab resident-finance
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('vnp_status');
        newUrl.searchParams.delete('transId');
        newUrl.searchParams.delete('amount');
        newUrl.searchParams.delete('bank');
        newUrl.searchParams.delete('billId');
        newUrl.searchParams.delete('code');
        if (!newUrl.searchParams.get('tab')) {
          newUrl.searchParams.set('tab', 'resident-finance');
        }
        window.history.replaceState({}, document.title, newUrl.toString());
      }
    }

    return () => window.removeEventListener('skyline_billing_updated', handleUpdate);
  }, [aptCode]);

  // Hóa đơn hiện tại đang xem (ưu tiên hóa đơn chưa thanh toán)
  const currentBill = bills.find(b => b.id === selectedBillId) 
    || bills.find(b => b.status === 'Unpaid') 
    || bills[0];

  const billAmountFormatted = currentBill ? currentBill.total_amount.toLocaleString('vi-VN') : '0';

  // Xác nhận đã chuyển khoản ngân hàng qua VietQR 24/7
  const handleConfirmVietQrPaid = () => {
    if (!currentBill) return;
    const transId = `QR${Date.now().toString().slice(-8)}`;
    payBill(currentBill.id, 'VIETQR', transId, 'BIDV');
    refreshBills();
    setShowVietQrModal(false);
    triggerPaymentSuccessToast(
      transId,
      currentBill.total_amount,
      'VietQR 24/7',
      `Đã ghi nhận thanh toán chuyển khoản Căn ${aptCode}. Ban Quản Lý đã đối soát và gạch nợ thành công.`
    );
  };

  // Mở Cổng thanh toán VNPAY Sandbox chính thức theo cấu hình Merchant
  const handleOpenVnpaySandbox = async (bankCode?: string) => {
    if (!currentBill) return;
    try {
      setIsRedirectingVnpay(true);
      const res = await fetch('/api/billing/vnpay-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: currentBill.id,
          bankCode: bankCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.message || 'Không thể tạo liên kết thanh toán VNPAY');
        setIsRedirectingVnpay(false);
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối cổng thanh toán VNPAY: ' + (err?.message || ''));
      setIsRedirectingVnpay(false);
    }
  };

  // Tab view: Hóa đơn & Thanh toán vs Thống kê chi tiêu
  const [activeTab, setActiveTab] = useState<'BILLING' | 'ANALYTICS'>('BILLING');
  const [analyticsCategory, setAnalyticsCategory] = useState<string>('ALL');

  // Hàm lấy biểu tượng dịch vụ chuẩn
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'Electricity': return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'Water': return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Management_Fee': return <Building className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Parking': return <Car className="w-3.5 h-3.5 text-blue-400" />;
      case 'Internet': return <Wifi className="w-3.5 h-3.5 text-teal-400" />;
      case 'Facility': return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case 'Laundry': return <Shirt className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Housekeeping': return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'Personal_Trainer': return <Dumbbell className="w-3.5 h-3.5 text-orange-400" />;
      case 'Car_Care': return <Car className="w-3.5 h-3.5 text-teal-400" />;
      default: return <Tag className="w-3.5 h-3.5 text-[#C5A880]" />;
    }
  };

  // Hàm lấy tên dịch vụ chuẩn
  const getItemName = (item: BillDetail) => {
    if (item.service_name) return t(item.service_name);
    switch (item.service_type) {
      case 'Electricity': return t('Tiền Điện Sinh Hoạt');
      case 'Water': return t('Tiền Nước Sinh Hoạt');
      case 'Management_Fee': return t('Phí Quản Lý Vận Hành');
      case 'Parking': return t('Phí Gửi Xe Căn Hộ');
      case 'Internet': return t('Cáp Quang Internet VNPT Fiber 300Mbps');
      case 'Facility': return t('Phí Sử Dụng Tiện Ích Đặt Trước');
      case 'Laundry': return t('Giặt Ủi & Giặt Hấp Cao Cấp');
      case 'Housekeeping': return t('Giúp Việc & Dọn Dẹp Căn Hộ');
      case 'Personal_Trainer': return t('Thuê Huấn Luyện Viên PT Bơi/Gym');
      case 'Car_Care': return t('Chăm Sóc & Rửa Xe Hầm B2');
      default: return t('Phí Dịch Vụ Cư Dân');
    }
  };

  // Sắp xếp các kỳ hóa đơn theo thứ tự thời gian
  const sortedBills = [...bills].sort((a, b) => {
    return new Date(a.created_at || a.due_date || '').getTime() - new Date(b.created_at || b.due_date || '').getTime();
  });

  // Hóa đơn sắp xếp mới nhất lên trước
  const newestBillsFirst = [...bills].sort((a, b) => {
    return new Date(b.created_at || b.due_date || '').getTime() - new Date(a.created_at || a.due_date || '').getTime();
  });

  // Dữ liệu các Quý trong năm 2026 (Quý 4/2026 hiện tại)
  const quarters = [
    {
      id: 'Q4_2026',
      name: 'Quý 4/2026',
      periodText: 'Tháng 10 - Tháng 12/2026',
      status: 'Active',
      months: [
        {
          name: 'Tháng 10/2026',
          bill: bills.find(b => b.billing_month.includes('10/2026')),
          status: 'Paid',
          amount: 2410000,
          paidDate: '25/10/2026',
          method: 'VNPAY',
        },
        {
          name: 'Tháng 11/2026',
          bill: bills.find(b => b.billing_month.includes('11/2026')),
          status: 'Unpaid',
          amount: 2485000,
          dueDate: '30/11/2026',
          method: null,
        },
        {
          name: 'Tháng 12/2026',
          bill: null,
          status: 'Estimated',
          amount: 2450000,
          dueDate: '30/12/2026',
          method: null,
        },
      ],
      totalEstimate: 7345000,
      paidAmount: 2410000,
      remainingAmount: 4935000,
      discountPrepay: 113400, // Tiết kiệm 5% phí QL
      prepayTotal: 4821600,
    },
    {
      id: 'Q3_2026',
      name: 'Quý 3/2026',
      periodText: 'Tháng 07 - Tháng 09/2026',
      status: 'Settled',
      months: [
        {
          name: 'Tháng 07/2026',
          bill: bills.find(b => b.billing_month.includes('07/2026')),
          status: 'Paid',
          amount: 2370000,
          paidDate: '28/07/2026',
          method: 'VNPAY',
        },
        {
          name: 'Tháng 08/2026',
          bill: bills.find(b => b.billing_month.includes('08/2026')),
          status: 'Paid',
          amount: 2505000,
          paidDate: '28/08/2026',
          method: 'VNPAY',
        },
        {
          name: 'Tháng 09/2026',
          bill: bills.find(b => b.billing_month.includes('09/2026')),
          status: 'Paid',
          amount: 2380000,
          paidDate: '22/09/2026',
          method: 'VIETQR',
        },
      ],
      totalEstimate: 7255000,
      paidAmount: 7255000,
      remainingAmount: 0,
      discountPrepay: 0,
      prepayTotal: 0,
    },
    {
      id: 'Q2_2026',
      name: 'Quý 2/2026',
      periodText: 'Tháng 04 - Tháng 06/2026',
      status: 'Settled',
      months: [
        {
          name: 'Tháng 06/2026',
          bill: bills.find(b => b.billing_month.includes('06/2026')),
          status: 'Paid',
          amount: 2320000,
          paidDate: '25/06/2026',
          method: 'VIETQR',
        },
      ],
      totalEstimate: 2320000,
      paidAmount: 2320000,
      remainingAmount: 0,
      discountPrepay: 0,
      prepayTotal: 0,
    },
  ];

  const currentQuarter = quarters.find(q => q.id === selectedQuarterId) || quarters[0];

  // Tổng hợp dữ liệu thống kê chi tiêu
  const totalSpendAll = bills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const avgMonthlySpend = bills.length > 0 ? Math.round(totalSpendAll / bills.length) : 0;
  const paidCount = bills.filter(b => b.status === 'Paid').length;
  const onTimeRate = bills.length > 0 ? Math.round((paidCount / bills.length) * 100) : 100;

  // Thu thập toàn bộ chi tiết dòng hóa đơn
  const allDetails = bills.flatMap(b => b.details || []);

  const electricityDetails = allDetails.filter(d => d.service_type === 'Electricity');
  const waterDetails = allDetails.filter(d => d.service_type === 'Water');
  const mgmtDetails = allDetails.filter(d => d.service_type === 'Management_Fee');
  const parkingDetails = allDetails.filter(d => d.service_type === 'Parking');
  const internetDetails = allDetails.filter(d => d.service_type === 'Internet');
  const serviceDetails = allDetails.filter(d => !['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet', 'Facility'].includes(d.service_type));
  const facilityDetails = allDetails.filter(d => d.service_type === 'Facility');

  const sumCategory = (items: BillDetail[]) => items.reduce((s, it) => s + (it.total_line_amount || 0), 0);
  const totalElec = sumCategory(electricityDetails);
  const totalWater = sumCategory(waterDetails);
  const totalMgmt = sumCategory(mgmtDetails);
  const totalParking = sumCategory(parkingDetails);
  const totalInternet = sumCategory(internetDetails);
  const totalLivingServices = sumCategory(serviceDetails);
  const totalFacility = sumCategory(facilityDetails);

  const totalKwh = electricityDetails.reduce((s, it) => s + (it.usage || 0), 0);
  const totalM3 = waterDetails.reduce((s, it) => s + (it.usage || 0), 0);

  // Danh mục thống kê chi tiết theo tỷ trọng
  const categoryStats = [
    {
      id: 'Electricity',
      name: 'Điện Sinh Hoạt',
      subtext: `Tổng ${totalKwh.toLocaleString('vi-VN')} kWh (TB ${bills.length ? Math.round(totalKwh / bills.length) : 0} kWh/tháng)`,
      amount: totalElec,
      percent: totalSpendAll > 0 ? (totalElec / totalSpendAll) * 100 : 0,
      icon: Zap,
      color: '#F59E0B',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-400',
      bgMuted: 'bg-amber-950/40 border-amber-500/50',
      unitName: 'kWh',
      rate: '3.200 đ/kWh',
      trend: '+15.2%',
      trendDirection: 'up' as const,
      note: 'Định mức bậc thang giá điện sinh hoạt EVN'
    },
    {
      id: 'Water',
      name: 'Nước Sinh Hoạt',
      subtext: `Tổng ${totalM3.toLocaleString('vi-VN')} m³ (TB ${bills.length ? (Math.round((totalM3 / bills.length) * 10) / 10) : 0} m³/tháng)`,
      amount: totalWater,
      percent: totalSpendAll > 0 ? (totalWater / totalSpendAll) * 100 : 0,
      icon: Droplets,
      color: '#06B6D4',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-400',
      bgMuted: 'bg-cyan-950/40 border-cyan-500/50',
      unitName: 'm³',
      rate: '18.000 đ/m³',
      trend: '+55.5%',
      trendDirection: 'up' as const,
      note: 'AI cảnh báo rò rỉ đêm kỳ T08/2026'
    },
    {
      id: 'Management_Fee',
      name: 'Phí Quản Lý Vận Hành',
      subtext: `Diện tích thông thủy 73.2 m² x 10.000 đ/m²`,
      amount: totalMgmt,
      percent: totalSpendAll > 0 ? (totalMgmt / totalSpendAll) * 100 : 0,
      icon: Building,
      color: '#10B981',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-400',
      bgMuted: 'bg-emerald-950/40 border-emerald-500/50',
      unitName: 'm²',
      rate: '10.000 đ/m²',
      trend: '0.0%',
      trendDirection: 'stable' as const,
      note: 'Bao gồm an ninh 24/7, vệ sinh sảnh, hồ bơi & thang máy'
    },
    {
      id: 'Parking',
      name: 'Phí Gửi Xe Căn Hộ',
      subtext: `Xe máy / ô tô đăng ký tầng hầm B1/B2`,
      amount: totalParking,
      percent: totalSpendAll > 0 ? (totalParking / totalSpendAll) * 100 : 0,
      icon: Car,
      color: '#3B82F6',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-400',
      bgMuted: 'bg-blue-950/40 border-blue-500/50',
      unitName: 'xe/tháng',
      rate: '141.000 - 198.000 đ/xe',
      trend: 'Ổn định',
      trendDirection: 'stable' as const,
      note: 'Thẻ từ tích hợp nhận diện biển số thông minh LPR'
    },
    {
      id: 'Internet',
      name: 'Cáp Quang Internet VNPT',
      subtext: `Gói Fiber 300Mbps chuyên biệt Smart Home`,
      amount: totalInternet,
      percent: totalSpendAll > 0 ? (totalInternet / totalSpendAll) * 100 : 0,
      icon: Wifi,
      color: '#14B8A6',
      textColor: 'text-teal-400',
      bgColor: 'bg-teal-400',
      bgMuted: 'bg-teal-950/40 border-teal-500/50',
      unitName: 'tháng',
      rate: '220.000 đ/tháng',
      trend: 'Cố định',
      trendDirection: 'stable' as const,
      note: 'Băng thông ưu tiên cho hạ tầng nhà thông minh Skyline'
    },
    {
      id: 'Living_Services',
      name: 'Dịch Vụ Cư Dân & Đời Sống',
      subtext: `Giặt ủi, Giúp việc theo giờ, PT Gym/Bơi, Rửa xe`,
      amount: totalLivingServices,
      percent: totalSpendAll > 0 ? (totalLivingServices / totalSpendAll) * 100 : 0,
      icon: Sparkles,
      color: '#A855F7',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-400',
      bgMuted: 'bg-purple-950/40 border-purple-500/50',
      unitName: 'dịch vụ',
      rate: 'Biểu giá cư dân Skyline',
      trend: serviceDetails.length > 0 ? `${serviceDetails.length} đơn` : 'Chưa đặt',
      trendDirection: 'stable' as const,
      note: 'Đặt trực tiếp trên Portal và cộng gộp vào kỳ hóa đơn'
    },
    {
      id: 'Facility',
      name: 'Tiện Ích & Phòng Sự Kiện',
      subtext: `Khu nướng BBQ ngoài trời, Phòng tiệc VIP`,
      amount: totalFacility,
      percent: totalSpendAll > 0 ? (totalFacility / totalSpendAll) * 100 : 0,
      icon: Tag,
      color: '#F43F5E',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-400',
      bgMuted: 'bg-rose-950/40 border-rose-500/50',
      unitName: 'lượt',
      rate: 'Phí vận hành & vệ sinh',
      trend: facilityDetails.length > 0 ? `${facilityDetails.length} lượt` : '0 lượt',
      trendDirection: 'stable' as const,
      note: 'Miễn phí hồ bơi, gym cư dân; tính phí khi đặt riêng sự kiện'
    },
  ];

  // Hạng mục chi phí lớn nhất
  const highestCategory = [...categoryStats].sort((a, b) => b.amount - a.amount)[0];

  // Giá trị hóa đơn cao nhất để chuẩn hóa độ cao thanh biểu đồ (tối thiểu 1 để tránh chia cho 0)
  const maxBillAmount = Math.max(...bills.map(b => b.total_amount), 3000000);

  // Xuất file CSV báo cáo tài chính
  const handleExportExpenseCsv = () => {
    const headers = [
      'Mã Hóa Đơn',
      'Kỳ Thanh Toán',
      'Hạng Mục Dịch Vụ',
      'Phân Loại',
      'Chỉ Số / Số Lượng',
      'Đơn Vị Tính',
      'Đơn Giá (VNĐ)',
      'Thành Tiền (VNĐ)',
      'Trạng Thái',
      'Ngày Lập'
    ];

    const rows: string[][] = [];

    sortedBills.forEach(bill => {
      bill.details.forEach(item => {
        const catName = getItemName(item);
        const isUtility = ['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'].includes(item.service_type);
        const typeLabel = isUtility ? 'Cố định / Định kỳ' : 'Dịch vụ đời sống phát sinh';
        
        rows.push([
          bill.id,
          bill.billing_month,
          catName,
          typeLabel,
          String(item.usage || 1),
          item.unit || '',
          String(item.unit_price || item.total_line_amount),
          String(item.total_line_amount),
          bill.status === 'Paid' ? 'Đã Thanh Toán' : 'Chờ Thanh Toán',
          bill.created_at ? new Date(bill.created_at).toLocaleDateString('vi-VN') : ''
        ]);
      });
    });

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_ThongKe_ChiTieu_Can_${aptCode}_Skyline.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const billingResource = useAsyncResource(async () => {
    const res = await fetch('/api/billing', { credentials: 'include' });
    if (!res.ok) throw new Error(`Không thể tải hóa đơn tài chính (HTTP ${res.status})`);
    const json = await res.json();
    return Array.isArray(json?.bills) ? json.bills : [];
  }, []);

  const financeCtx: any = { t, isEn, currentUser, aptCode, SKYLINE_BANK_INFO, generateVietQrUrl, bills, setBills, selectedBillId, setSelectedBillId, cycleMode, setCycleMode, selectedQuarterId, setSelectedQuarterId, showVietQrModal, setShowVietQrModal, showAiAssistant, setShowAiAssistant, showExplainModal, setShowExplainModal, explainData, setExplainData, isExplaining, setIsExplaining, isRedirectingVnpay, setIsRedirectingVnpay, copiedField, setCopiedField, redirectBanner, setRedirectBanner, paymentSuccessToast, setPaymentSuccessToast, isExportingInvoicePdf, setIsExportingInvoicePdf, activeTab, setActiveTab, analyticsCategory, setAnalyticsCategory, residentName, residentPhone, triggerPaymentSuccessToast, handleExportInvoicePdf, handleExplainBill, copyToClipboard, refreshBills, currentBill, billAmountFormatted, handleConfirmVietQrPaid, handleOpenVnpaySandbox, getItemIcon, getItemName, sortedBills, newestBillsFirst, quarters, currentQuarter, totalSpendAll, avgMonthlySpend, paidCount, onTimeRate, allDetails, electricityDetails, waterDetails, mgmtDetails, parkingDetails, internetDetails, serviceDetails, facilityDetails, sumCategory, totalElec, totalWater, totalMgmt, totalParking, totalInternet, totalLivingServices, totalFacility, totalKwh, totalM3, categoryStats, highestCategory, maxBillAmount, handleExportExpenseCsv, billingResource };
  return (
    <div className="space-y-6 w-full animate-fadeIn relative">
      {billingResource.loading && <ResourceSkeleton label="Đang tải dữ liệu hóa đơn..." />}
      {!billingResource.loading && billingResource.error && (
        <ResourceError message={billingResource.error} onRetry={billingResource.retry} />
      )}
      {!billingResource.loading && !billingResource.error && bills.length === 0 && (
        <ResourceEmpty message="Chưa có hóa đơn phí dịch vụ nào." />
      )}
      {/* Toast Báo Kết Quả Thanh Toán Thành Công */}
      {paymentSuccessToast && (
        <div className="fixed top-6 right-6 z-[9999] max-w-md w-full bg-[#121820] border-2 border-[#10B981] p-4 shadow-2xl animate-fadeIn text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/50">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 font-sans">
                    {t('THANH TOÁN THÀNH CÔNG', 'PAYMENT SUCCESSFUL')}
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#005BAA]/40 border border-[#005BAA] text-[10px] font-mono text-[#4CC9F0]">
                    {paymentSuccessToast.gateway}
                  </span>
                </div>
                <div className="text-xs text-gray-200">
                  {paymentSuccessToast.message || `${t('Hóa đơn căn')} ${aptCode} ${t('đã được gạch nợ thành công.')}`}
                </div>
                <div className="text-[11px] font-mono text-gray-300 pt-1 space-y-0.5">
                  <div>{t('Mã GD:', 'Trans ID:')} <strong className="text-[#C5A880]">#{paymentSuccessToast.transId}</strong></div>
                  <div>{t('Số tiền:', 'Amount:')} <strong className="text-white">{paymentSuccessToast.amount.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {t('đ', 'VND')}</strong></div>
                  <div className="text-[10px] text-gray-400">{t('Thời gian:', 'Time:')} {paymentSuccessToast.paidAt}</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setPaymentSuccessToast(null)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#222B35] flex items-center justify-between">
            <button
              onClick={() => handleExportInvoicePdf(currentBill)}
              disabled={isExportingInvoicePdf}
              className="px-3 py-1 bg-[#161B22] border border-[#C5A880] hover:bg-[#C5A880] hover:text-[#0D1117] text-[#C5A880] text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              {isExportingInvoicePdf ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              <span>{t('Tải Hóa Đơn PDF', 'Download Invoice PDF')}</span>
            </button>
            <span className="text-[10px] text-gray-400 italic">{t('Tự động đóng sau 7s', 'Auto closes in 7s')}</span>
          </div>
        </div>
      )}

      {/* Thông báo kết quả giao dịch sau khi quay lại từ cổng VNPAY */}
      {redirectBanner && (
        <div className={`p-4 border flex items-start justify-between gap-3 animate-fadeIn ${
          redirectBanner.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-xl' 
            : 'bg-red-950/90 border-red-500 text-red-300 shadow-xl'
        }`}>
          <div className="flex items-start gap-2.5 text-xs">
            {redirectBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wide">
                {redirectBanner.type === 'success' ? t('Thanh Toán VNPAY Thành Công', 'VNPAY Payment Successful') : t('Thông Báo Giao Dịch VNPAY', 'VNPAY Transaction Notice')}
              </div>
              <p className="text-gray-200 leading-relaxed">{redirectBanner.message}</p>
            </div>
          </div>
          <button 
            onClick={() => setRedirectBanner(null)}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> {t('Tài Chính • Căn', 'Finance • Unit')} {aptCode}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {activeTab === 'BILLING' 
              ? t('Hóa Đơn & Thanh Toán', 'Invoices & Payments') 
              : t('Thống Kê Chi Tiêu & Dịch Vụ', 'Spending & Services Analytics')}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {activeTab === 'BILLING' ? (
            <>
              {currentBill && (
                <button
                  onClick={() => handleExportInvoicePdf(currentBill)}
                  disabled={isExportingInvoicePdf}
                  className="px-2.5 sm:px-3.5 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                  title={isEn ? 'Export statement to standard A4 PDF' : 'Xuất Hóa Đơn Ra File PDF Chuẩn A4'}
                >
                  {isExportingInvoicePdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#C5A880] shrink-0" />
                  ) : (
                    <Download className="w-4 h-4 text-[#C5A880] shrink-0" />
                  )}
                  <span className="hidden sm:inline">{isExportingInvoicePdf ? t('Đang Xuất PDF...') : t('Xuất Hóa Đơn PDF')}</span>
                  <span className="sm:hidden">{isExportingInvoicePdf ? t('Đang xuất...') : t('Xuất PDF')}</span>
                </button>
              )}

              {currentBill && currentBill.status === 'Paid' && (
                <button
                  onClick={() => window.print()}
                  className="px-3 sm:px-4 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4 text-[#C5A880] shrink-0" />
                  <span className="hidden sm:inline">{t('In Hóa Đơn')}</span>
                  <span className="sm:hidden">{t('In')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleExplainBill()}
                className="px-3 sm:px-4 py-2 bg-[#1C2533] border border-[#C5A880]/80 hover:border-[#C5A880] text-[#C5A880] hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow"
                title={t('Xem AI giải thích và so sánh 3 kỳ', 'Explain Bill with AI')}
              >
                <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span className="hidden sm:inline">{t('Giải Thích Hóa Đơn', 'Explain Bill')}</span>
                <span className="sm:hidden">{t('Giải Thích', 'Explain')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAiAssistant(true)}
                className="px-3 sm:px-4 py-2 bg-[#1A222C] border border-[#C5A880]/80 hover:border-[#C5A880] text-[#C5A880] hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow"
                title={t('Mở Trợ Lý Hóa Đơn AI thông minh', 'Open AI Billing Assistant')}
              >
                <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span className="hidden sm:inline">{t('Hỏi Trợ Lý AI', 'AI Assistant')}</span>
                <span className="sm:hidden">{t('AI', 'AI')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleExportExpenseCsv}
                className="px-2.5 sm:px-3.5 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                title={isEn ? 'Download CSV spreadsheet with itemized cost details' : 'Tải bảng tính CSV chi tiết từng hạng mục chi phí'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">{t('Xuất CSV')}</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-2.5 sm:px-3.5 py-2 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                <span className="hidden sm:inline">{t('In Báo Cáo')}</span>
                <span className="sm:hidden">{t('In')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222B35] pb-3">
        <div className="flex items-center gap-1.5 bg-[#0D1117] p-1 border border-[#222B35]">
          <button
            onClick={() => setActiveTab('BILLING')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'BILLING'
                ? 'bg-[#C5A880] text-[#0D1117] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#161B22]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span>{t('Hóa Đơn')}</span>
            {bills.some(b => b.status === 'Unpaid') && (
              <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-none ${
                activeTab === 'BILLING' ? 'bg-[#0D1117] text-[#C5A880]' : 'bg-amber-500 text-black'
              }`}>
                {bills.filter(b => b.status === 'Unpaid').length} {t('chưa nộp')}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-[#C5A880] text-[#0D1117] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#161B22]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{t('Thống Kê Chi Tiêu')}</span>
            <span className="sm:hidden">{t('Thống Kê')}</span>
          </button>
        </div>

        <div className="text-xs text-gray-400 flex items-center gap-2 font-mono">
          <span>{t('Căn:')} <strong className="text-white">{aptCode}</strong></span>
          <span>•</span>
          <span>{t('Chủ hộ:')} <strong className="text-[#C5A880]">{residentName}</strong></span>
        </div>
      </div>

      {/* VIEW 1: BILLING & PAYMENT */}
      <FinanceBillingTabView ctx={financeCtx} />
      <FinanceAnalyticsTabView ctx={financeCtx} />
      {/* ========================================================================= */}
      {/* MODAL QUÉT MÃ VIETQR NAPAS 24/7 (CHUYỂN KHOẢN TẤT CẢ NGÂN HÀNG)          */}
      {/* ========================================================================= */}
      {showVietQrModal && currentBill && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border border-[#C5A880] max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn text-white">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-base font-bold text-white">
                  {t('Quét Mã VietQR Napas 24/7', 'Scan VietQR Napas 24/7')}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowVietQrModal(false)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Khối hiển thị ảnh QR Napas 24/7 */}
            <div className="p-4 bg-white rounded flex flex-col items-center justify-center text-center shadow-inner">
              <img
                src={generateVietQrUrl({
                  amount: currentBill.total_amount,
                  transferNote: `SKYLINE ${aptCode.replace(/[^A-Za-z0-9]/g, '')} ${currentBill.billing_month.replace(/[^A-Za-z0-9]/g, '')}`,
                })}
                alt="VietQR Napas 24/7"
                className="w-56 h-56 object-contain"
              />
              <div className="mt-2 text-[11px] text-gray-700 font-medium">
                {t('Sử dụng ứng dụng bất kỳ ngân hàng nào để quét mã thanh toán')}
              </div>
            </div>

            {/* Chi tiết tài khoản thụ hưởng có nút sao chép */}
            <div className="p-3 bg-[#161B22] border border-[#222B35] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{t('Ngân hàng')}:</span>
                <span className="font-bold text-white text-right">{SKYLINE_BANK_INFO.bankShortName} ({SKYLINE_BANK_INFO.branch})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{t('Số tài khoản')}:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-[#C5A880]">{SKYLINE_BANK_INFO.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(SKYLINE_BANK_INFO.accountNumber, 'acc')}
                    className="p-1 hover:text-[#C5A880] text-gray-400 cursor-pointer"
                    title={t('Sao chép số tài khoản')}
                  >
                    {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{t('Người thụ hưởng')}:</span>
                <span className="font-bold text-white text-right text-[11px]">{SKYLINE_BANK_INFO.accountHolder}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{t('Số tiền')}:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-white">{currentBill.total_amount.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {isEn ? 'VND' : 'đ'}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentBill.total_amount.toString(), 'amount')}
                    className="p-1 hover:text-[#C5A880] text-gray-400 cursor-pointer"
                    title={t('Sao chép số tiền')}
                  >
                    {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#222B35] pt-2">
                <span className="text-gray-400">{t('Nội dung CK')}:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-amber-400">{`SKYLINE ${aptCode.replace(/[^A-Za-z0-9]/g, '')} ${currentBill.billing_month.replace(/[^A-Za-z0-9]/g, '')}`}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`SKYLINE ${aptCode.replace(/[^A-Za-z0-9]/g, '')} ${currentBill.billing_month.replace(/[^A-Za-z0-9]/g, '')}`, 'note')}
                    className="p-1 hover:text-[#C5A880] text-gray-400 cursor-pointer"
                    title={t('Sao chép nội dung')}
                  >
                    {copiedField === 'note' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowVietQrModal(false)}
                className="flex-1 py-2.5 border border-[#2D3748] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {t('Đóng Lại', 'Close')}
              </button>
              <button
                type="button"
                onClick={handleConfirmVietQrPaid}
                className="flex-1 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{t('Tôi Đã Chuyển Khoản', 'I Have Transferred')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A1: Trợ Lý Hóa Đơn AI Streaming Drawer */}
      <BillingAiAssistantDrawer
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        aptCode={aptCode}
        residentName={residentName}
      />

      {/* A2: Modal Giải Thích Hóa Đơn AI (So sánh 3 kỳ) */}
      <InvoiceExplanationModal
        isOpen={showExplainModal}
        onClose={() => setShowExplainModal(false)}
        data={explainData}
        isLoading={isExplaining}
      />
    </div>
  );
}
