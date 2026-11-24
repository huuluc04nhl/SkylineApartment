'use client';

import React from 'react';
import { Clock, AlertTriangle, CreditCard, QrCode, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Bill } from '@/lib/dataStore';
import { useLanguage } from '@/lib/languageContext';

interface SmartPaymentReminderBannerProps {
  bill: Bill | null;
  onPayVnpay: () => void;
  onPayVietQr: () => void;
}

export default function SmartPaymentReminderBanner({
  bill,
  onPayVnpay,
  onPayVietQr,
}: SmartPaymentReminderBannerProps) {
  const { t, isEn } = useLanguage();

  if (!bill || bill.status === 'Paid') return null;

  const dueDate = new Date(bill.due_date);
  const now = new Date();
  
  // Calculate day difference
  const diffTime = dueDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let badgeColor = '';
  let badgeText = '';
  let alertTitle = '';
  let alertDesc = '';
  let isOverdue = false;

  if (daysDiff < 0) {
    // Quá hạn
    isOverdue = true;
    const overDays = Math.abs(daysDiff);
    badgeColor = 'bg-red-950 text-red-300 border-red-500';
    badgeText = isEn ? `Overdue by ${overDays} day(s)` : `Quá hạn ${overDays} ngày`;
    alertTitle = isEn 
      ? `Payment Overdue Notice (${overDays} days)` 
      : `Thông Báo Hóa Đơn Quá Hạn (${overDays} ngày)`;
    alertDesc = isEn
      ? `Due date was ${new Date(bill.due_date).toLocaleDateString('en-US')}. Please settle promptly to prevent automated amenity access restrictions.`
      : `Hạn nộp quy định là ngày ${new Date(bill.due_date).toLocaleDateString('vi-VN')}. Quý cư dân vui lòng thanh toán để tránh gián đoạn dịch vụ tiện ích theo nội quy tòa nhà.`;
  } else if (daysDiff === 0) {
    // Hôm nay là hạn chót
    badgeColor = 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse';
    badgeText = isEn ? 'Due Today' : 'Hôm Nay Là Hạn Chót';
    alertTitle = isEn 
      ? 'Payment Due Today Before 23:59' 
      : 'Hôm Nay Là Hạn Chót Thanh Toán (Trước 23h59)';
    alertDesc = isEn
      ? `Today is the final day to settle bill for ${bill.billing_month}. Settle conveniently in seconds via VNPAY or VietQR.`
      : `Hôm nay là ngày cuối cùng của kỳ thanh toán phí ${bill.billing_month}. Quý cư dân có thể thanh toán trực tuyến tức thì qua VNPAY hoặc VietQR.`;
  } else if (daysDiff <= 2) {
    // Còn 1-2 ngày
    badgeColor = 'bg-amber-950 text-amber-300 border-amber-500';
    badgeText = isEn ? `Only ${daysDiff} day(s) left` : `Còn ${daysDiff} ngày`;
    alertTitle = isEn 
      ? `Upcoming Payment Deadline (Only ${daysDiff} days left)` 
      : `Sắp Đến Hạn Thanh Toán (Chỉ còn ${daysDiff} ngày)`;
    alertDesc = isEn
      ? `Bill for ${bill.billing_month} (${bill.total_amount.toLocaleString()} VND) is due on ${new Date(bill.due_date).toLocaleDateString('en-US')}.`
      : `Hóa đơn kỳ ${bill.billing_month} với số tiền ${bill.total_amount.toLocaleString('vi-VN')} đ sẽ đến hạn thanh toán vào ngày ${new Date(bill.due_date).toLocaleDateString('vi-VN')}.`;
  } else {
    // Còn 3-5 ngày
    badgeColor = 'bg-[#1C2533] text-[#C5A880] border-[#C5A880]/50';
    badgeText = isEn ? `${daysDiff} days until due` : `Còn ${daysDiff} ngày đến hạn`;
    alertTitle = isEn 
      ? `Smart Payment Reminder (${daysDiff} days remaining)` 
      : `Nhắc Hạn Thanh Toán Thông Minh (Còn ${daysDiff} ngày)`;
    alertDesc = isEn
      ? `Friendly reminder for period ${bill.billing_month}. You can settle in advance without automatic deductions.`
      : `Kỳ thanh toán phí ${bill.billing_month} sẽ đến hạn vào ngày ${new Date(bill.due_date).toLocaleDateString('vi-VN')}. Cư dân có thể chủ động thanh toán trước thuận tiện.`;
  }

  return (
    <div className={`p-4 border transition-all shadow-xl animate-fadeIn ${
      isOverdue 
        ? 'bg-[#180F12] border-red-500/60' 
        : daysDiff <= 2 
        ? 'bg-[#1A150E] border-amber-500/60' 
        : 'bg-[#111722] border-[#C5A880]/40'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start gap-3">
          <div className={`p-2 border shrink-0 mt-0.5 ${
            isOverdue 
              ? 'bg-red-950 text-red-400 border-red-500' 
              : daysDiff <= 2 
              ? 'bg-amber-950 text-amber-400 border-amber-500' 
              : 'bg-[#1C2533] text-[#C5A880] border-[#C5A880]/50'
          }`}>
            {isOverdue ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${badgeColor}`}>
                {badgeText}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                {alertTitle}
              </h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
              {alertDesc}
            </p>
            <div className="text-[10px] text-gray-400 flex items-center gap-1 font-mono pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {isEn 
                  ? 'Zero auto-charge: skyline never automatically debits bank accounts. You retain full control.' 
                  : 'An toàn: Hệ thống tuyệt đối KHÔNG tự động trừ tiền trong tài khoản của bạn. Cư dân chủ động bấm thanh toán.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Button (Deduplicated, single clean CTA) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPayVnpay}
            className="px-4 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isEn ? 'Pay Bill Now' : 'Thanh Toán Ngay'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

