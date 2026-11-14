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
import BillingAiAssistantDrawer from './BillingAiAssistantDrawer';
import InvoiceExplanationModal, { InvoiceExplanationData } from './InvoiceExplanationModal';
import CostForecastCard from './CostForecastCard';

export const VNPAY_NCB_TEST_CARD = {
  bank: 'NCB',
  cardNumber: '9704198526191432198',
  cardHolder: 'NGUYEN VAN A',
  issueDate: '07/15',
  otp: '123456',
};

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
            // Đồng bộ trạng thái gạch nợ lên Server Route
            fetch('/api/billing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'PAY',
                billId: billIdParam,
                method: 'VNPAY',
                transactionCode: transId,
              }),
            }).catch(() => {});
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
        alert(data.message || 'Không thể tạo liên kết thanh toán VNPAY');
        setIsRedirectingVnpay(false);
      }
    } catch (err: any) {
      alert('Lỗi kết nối cổng thanh toán VNPAY: ' + (err?.message || ''));
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

  return (
    <div className="space-y-6 w-full animate-fadeIn relative">
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
              {currentBill && currentBill.status === 'Unpaid' && (
                <button
                  onClick={() => handleOpenVnpaySandbox()}
                  disabled={isRedirectingVnpay}
                  className="px-3 sm:px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow"
                >
                  {isRedirectingVnpay ? (
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <CreditCard className="w-4 h-4 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{isRedirectingVnpay ? t('Đang Chuyển Hướng...') : t('Thanh Toán VNPAY', 'Pay Bill')}</span>
                  <span className="sm:hidden">{t('Thanh Toán', 'Pay')}</span>
                </button>
              )}

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
      {activeTab === 'BILLING' && (
        <div className="space-y-6 animate-fadeIn">

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

      {/* Selector nếu có nhiều kỳ hóa đơn */}
      {bills.length > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">{t('Chọn kỳ thanh toán:')}</span>
          <div className="flex items-center gap-2">
            {bills.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBillId(b.id)}
                className={`px-3 py-1.5 text-xs font-mono transition-all ${
                  (currentBill?.id === b.id)
                    ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow'
                    : 'bg-[#161B22] border border-[#2D3748] text-gray-300 hover:text-white'
                }`}
              >
                {t(b.billing_month)} ({b.status === 'Paid' ? t('Đã thanh toán ✓') : t('Chưa thanh toán')})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bill Overview Card */}
      {currentBill ? (
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
                  {currentBill.details.map((item) => {
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
      </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: THỐNG KÊ CHI TIÊU & PHÂN TÍCH DỊCH VỤ TOÀN DIỆN                   */}
      {/* ========================================================================= */}
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
                <span>(T05 - T08/2026)</span>
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
                {categoryStats.map(cat => (
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
                {categoryStats.map(cat => {
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
                {categoryStats.map(cat => (
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
                .filter(cat => analyticsCategory === 'ALL' || analyticsCategory === cat.id)
                .map(cat => {
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
              {sortedBills.map((b, index) => {
                const prev = index > 0 ? sortedBills[index - 1] : null;
                const diffAmount = prev ? b.total_amount - prev.total_amount : 0;
                const diffPercent = prev ? Math.round((diffAmount / prev.total_amount) * 100) : 0;

                // Sub-totals inside this bill
                const elecLine = b.details.find(d => d.service_type === 'Electricity')?.total_line_amount || 0;
                const waterLine = b.details.find(d => d.service_type === 'Water')?.total_line_amount || 0;
                const fixedLine = b.details.filter(d => ['Management_Fee', 'Parking', 'Internet'].includes(d.service_type)).reduce((s, d) => s + d.total_line_amount, 0);
                const serviceLine = b.details.filter(d => !['Electricity', 'Water', 'Management_Fee', 'Parking', 'Internet'].includes(d.service_type)).reduce((s, d) => s + d.total_line_amount, 0);

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
                  {categoryStats.map(cat => {
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
