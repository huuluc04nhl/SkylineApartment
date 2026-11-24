'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  CreditCard, 
  ShieldCheck, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Lock, 
  RefreshCw, 
  QrCode, 
  Smartphone,
  Check,
  AlertCircle,
  Building
} from 'lucide-react';
import { generateVietQrUrl, SKYLINE_BANK_INFO } from '@/lib/billingStore';
import { useLanguage } from '@/lib/languageContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

const POPULAR_BANKS = [
  { code: 'NCB', nameKey: 'Ngân hàng NCB (Test)', fallback: 'NCB Bank (Test)', color: 'bg-blue-900/30 border-blue-500 text-blue-400' },
  { code: 'VCB', nameKey: 'Vietcombank', fallback: 'Vietcombank', color: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' },
  { code: 'BIDV', nameKey: 'BIDV', fallback: 'BIDV', color: 'bg-teal-950/40 border-teal-500/50 text-teal-400' },
  { code: 'TCB', nameKey: 'Techcombank', fallback: 'Techcombank', color: 'bg-red-950/40 border-red-500/50 text-red-400' },
  { code: 'MB', nameKey: 'MB Bank', fallback: 'MB Bank', color: 'bg-indigo-950/40 border-indigo-500/50 text-indigo-400' },
  { code: 'VPB', nameKey: 'VPBank', fallback: 'VPBank', color: 'bg-green-950/40 border-green-500/50 text-green-400' },
  { code: 'ACB', nameKey: 'ACB', fallback: 'ACB', color: 'bg-blue-950/40 border-blue-400/50 text-blue-300' },
  { code: 'TPB', nameKey: 'TPBank', fallback: 'TPBank', color: 'bg-purple-950/40 border-purple-500/50 text-purple-400' },
];

function VnpayGatewayInner() {
  const { t, isEn, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const billId = searchParams.get('billId') || 'BILL-CH06-2026-08';
  const amountStr = searchParams.get('amount') || '2450000';
  const amount = parseFloat(amountStr) || 2450000;
  const aptCode = searchParams.get('apt') || 'CH-06';
  const month = searchParams.get('month') || 'T08/2026';
  const returnUrl = searchParams.get('returnUrl') || '';

  const [activeChannel, setActiveChannel] = useState<'ATM' | 'QR' | 'INTL'>('ATM');
  const [selectedBank, setSelectedBank] = useState<string>('NCB');
  const [cardNumber, setCardNumber] = useState<string>('9704 1985 2619 1432');
  const [cardHolder, setCardHolder] = useState<string>('NGUYEN VAN A');
  const [issueDate, setIssueDate] = useState<string>('07/15');
  const [otpInput, setOtpInput] = useState<string>('');
  const [isOtpStep, setIsOtpStep] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 phut

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOtpStep(true);
    setOtpInput('123456');
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/billing/vnpay-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId,
          amount,
          bankCode: selectedBank,
          returnUrl: returnUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data.message || t('Lỗi xử lý xác nhận thanh toán VNPAY', 'Error processing VNPAY payment confirmation'));
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert(t('Lỗi kết nối cổng thanh toán:', 'Payment gateway connection error:') + ' ' + (err?.message || ''));
      setIsSubmitting(false);
    }
  };

  const handleCancelPayment = () => {
    if (confirm(t('Quý khách có chắc chắn muốn hủy phiên giao dịch này không?', 'Are you sure you want to cancel this payment transaction?'))) {
      router.push('/portal?tab=resident-finance&vnp_status=failed&code=24');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E14] text-gray-200 flex flex-col font-sans selection:bg-[#005BAA] selection:text-white">
      {/* VNPAY Official Header Bar */}
      <header className="bg-[#0D1117] border-b border-[#222B35] sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* VNPAY Official Logo Icon */}
            <div className="flex items-center gap-1.5 font-black text-xl tracking-tighter">
              <span className="text-[#005BAA]">VN</span>
              <span className="text-[#ED1C24]">PAY</span>
              <span className="text-[10px] text-gray-400 font-mono font-normal ml-1.5 px-1.5 py-0.5 bg-[#161B22] border border-[#2D3748]">
                GATEWAY
              </span>
            </div>
            <div className="hidden sm:block h-4 w-[1px] bg-gray-700" />
            <span className="hidden sm:inline text-xs text-gray-400 font-medium">
              {t('Cổng Thanh Toán Quốc Gia Chuẩn PCI-DSS', 'National Payment Gateway • PCI-DSS Certified')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="inline" />
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline text-emerald-400 font-mono">{t('Bảo mật SSL 256-bit', '256-bit SSL Security')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Order Summary */}
        <div className="lg:col-span-5 bg-[#121820] border border-[#222B35] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-sm">
              <Building className="w-4 h-4 text-[#C5A880]" />
              <span>{t('Thông Tin Đơn Hàng', 'Order Details')}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/50 px-2 py-0.5 border border-amber-600/40">
              <Clock className="w-3 h-3" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-400">{t('Đơn vị thụ hưởng:', 'Beneficiary:')}</span>
              <div className="font-semibold text-white mt-0.5">
                {t('BAN QUẢN LÝ CHUNG CƯ SKYLINE SMART RESIDENCE', 'SKYLINE SMART RESIDENCE MANAGEMENT BOARD')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222B35]">
              <div>
                <span className="text-gray-400">{t('Mã hóa đơn:', 'Bill ID:')}</span>
                <div className="font-mono font-bold text-white mt-0.5">{billId}</div>
              </div>
              <div>
                <span className="text-gray-400">{t('Căn hộ:', 'Apartment:')}</span>
                <div className="font-mono font-bold text-[#C5A880] mt-0.5">{t('Căn', 'Unit')} {aptCode}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#222B35]">
              <span className="text-gray-400">{t('Kỳ thanh toán phí:', 'Billing Cycle:')}</span>
              <div className="font-semibold text-gray-200 mt-0.5">{month}</div>
            </div>

            <div className="p-4 bg-[#0D1117] border border-[#005BAA]/40 rounded-none mt-2 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                {t('Tổng số tiền thanh toán:', 'Total Amount Due:')}
              </span>
              <div className="font-serif text-2xl font-bold text-white font-mono">
                {amount.toLocaleString(isEn ? 'en-US' : 'vi-VN')} <span className="text-sm font-sans text-[#005BAA]">{t('VNĐ', 'VND')}</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCancelPayment}
              className="w-full py-2.5 bg-[#161B22] border border-[#2D3748] hover:border-red-500 text-gray-400 hover:text-red-400 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('Hủy Giao Dịch & Quay Lại', 'Cancel Transaction & Return')}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Payment Channels */}
        <div className="lg:col-span-7 bg-[#121820] border border-[#222B35] p-5 space-y-5 shadow-xl">
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[#0D1117] p-1 border border-[#222B35] text-xs">
            <button
              type="button"
              onClick={() => { setActiveChannel('ATM'); setIsOtpStep(false); }}
              className={`py-2 px-2 text-center font-semibold transition-all cursor-pointer ${
                activeChannel === 'ATM'
                  ? 'bg-[#005BAA] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('Thẻ ATM Nội Địa', 'Domestic ATM Card')}
            </button>
            <button
              type="button"
              onClick={() => { setActiveChannel('QR'); setIsOtpStep(false); }}
              className={`py-2 px-2 text-center font-semibold transition-all cursor-pointer ${
                activeChannel === 'QR'
                  ? 'bg-[#005BAA] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('VNPAY-QR', 'VNPAY-QR')}
            </button>
            <button
              type="button"
              onClick={() => { setActiveChannel('INTL'); setIsOtpStep(false); }}
              className={`py-2 px-2 text-center font-semibold transition-all cursor-pointer ${
                activeChannel === 'INTL'
                  ? 'bg-[#005BAA] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('Thẻ Quốc Tế', 'International Card')}
            </button>
          </div>

          {/* TAB 1: THẺ ATM NỘI ĐỊA */}
          {activeChannel === 'ATM' && (
            <div className="space-y-4">
              {!isOtpStep ? (
                <form onSubmit={handleProceedToOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">
                      {t('1. Chọn Ngân Hàng Thanh Toán:', '1. Select Payment Bank:')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {POPULAR_BANKS.map(bank => (
                        <button
                          key={bank.code}
                          type="button"
                          onClick={() => setSelectedBank(bank.code)}
                          className={`p-2.5 text-xs font-bold border text-left transition-all cursor-pointer ${
                            selectedBank === bank.code
                              ? 'border-[#005BAA] bg-[#005BAA]/20 text-white ring-1 ring-[#005BAA]'
                              : 'border-[#222B35] bg-[#161B22] text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <div className="font-mono text-sm">{bank.code}</div>
                          <div className="text-[10px] text-gray-400 truncate">{t(bank.nameKey, bank.fallback)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#222B35]">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        {t('Số thẻ ngân hàng:', 'Bank Card Number:')}
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="9704 xxxx xxxx xxxx"
                        required
                        className="w-full bg-[#161B22] border border-[#2D3748] focus:border-[#005BAA] p-2.5 text-sm text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          {t('Tên in trên thẻ (không dấu):', 'Cardholder Name (Unaccented):')}
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NGUYEN VAN A"
                          required
                          className="w-full bg-[#161B22] border border-[#2D3748] focus:border-[#005BAA] p-2.5 text-sm text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          {t('Ngày phát hành (MM/YY):', 'Issue Date (MM/YY):')}
                        </label>
                        <input
                          type="text"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          placeholder="07/15"
                          required
                          className="w-full bg-[#161B22] border border-[#2D3748] focus:border-[#005BAA] p-2.5 text-sm text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#005BAA] hover:bg-[#004785] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{t('Tiếp Tục Xác Thực Thanh Toán', 'Proceed to Payment Verification')} ({amount.toLocaleString(isEn ? 'en-US' : 'vi-VN')} {t('đ', 'VND')})</span>
                  </button>
                </form>
              ) : (
                /* OTP STEP */
                <div className="space-y-4 p-4 bg-[#161B22] border border-[#005BAA]/50 animate-fadeIn">
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 bg-[#005BAA]/20 border border-[#005BAA]/40 flex items-center justify-center mx-auto text-[#005BAA]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif font-bold text-white text-sm">
                      {t('Xác Thực Mật Khẩu OTP (3D-Secure)', '3D-Secure OTP Verification')}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {t('Ngân hàng')} {selectedBank} {t('đã gửi mã xác thực SMS OTP đến số điện thoại của chủ thẻ.', 'has sent an SMS OTP verification code to your registered mobile number.')}
                    </p>
                  </div>

                  <div className="space-y-2 max-w-xs mx-auto">
                    <label className="block text-center text-xs text-gray-400">
                      {t('Nhập mã OTP xác nhận:', 'Enter OTP confirmation code:')}
                    </label>
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full bg-[#0D1117] border-2 border-[#005BAA] p-2.5 text-center text-lg text-white font-mono tracking-widest focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOtpStep(false)}
                      className="px-4 py-2 border border-gray-700 text-xs text-gray-400 hover:text-white cursor-pointer font-semibold"
                    >
                      {t('Quay Lại', 'Back')}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>{isSubmitting ? t('Đang Xử Lý Gạch Nợ...', 'Processing Settlement...') : t('Xác Nhận & Hoàn Tất', 'Confirm & Complete')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VNPAY-QR */}
          {activeChannel === 'QR' && (
            <div className="space-y-4 text-center py-2">
              <div className="p-4 bg-white rounded max-w-xs mx-auto flex flex-col items-center justify-center shadow-inner">
                <img
                  src={generateVietQrUrl({
                    amount,
                    transferNote: `VNPAY ${aptCode.replace(/[^A-Za-z0-9]/g, '')} ${billId}`,
                  })}
                  alt="VNPAY-QR"
                  className="w-56 h-56 object-contain"
                />
                <div className="mt-2 text-[11px] text-gray-700 font-medium">
                  {t('Quét mã qua ứng dụng Ngân hàng hoặc Ví VNPAY', 'Scan QR code via Banking Apps or VNPAY Wallet')}
                </div>
              </div>

              <div className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                {t('Mở ứng dụng Mobile Banking của bạn, chọn tính năng QR Pay / Quét Mã và hướng camera vào mã QR ở trên để hoàn tất thanh toán.', 'Open your Mobile Banking app, select QR Pay / Scan QR and point camera at the QR code above to complete payment.')}
              </div>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="w-full max-w-md mx-auto py-3 bg-[#005BAA] hover:bg-[#004785] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSubmitting ? t('Đang Xử Lý...', 'Processing...') : t('Tôi Đã Quét Mã & Thanh Toán Thành Công', 'I Have Scanned & Paid Successfully')}</span>
              </button>
            </div>
          )}

          {/* TAB 3: THẺ QUỐC TẾ */}
          {activeChannel === 'INTL' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-gray-400 border-b border-[#222B35] pb-2">
                <span>{t('Chấp nhận các loại thẻ:', 'Accepted Cards:')}</span>
                <span className="font-bold text-white font-mono">VISA • MasterCard • JCB</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{t('Số thẻ quốc tế:', 'International Card Number:')}</label>
                  <input
                    type="text"
                    defaultValue="4456 5300 0000 1005"
                    className="w-full bg-[#161B22] border border-[#2D3748] focus:border-[#005BAA] p-2.5 text-sm text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">{t('Hạn sử dụng (MM/YY):', 'Expiration Date (MM/YY):')}</label>
                    <input
                      type="text"
                      defaultValue="12/26"
                      className="w-full bg-[#161B22] border border-[#2D3748] focus:border-[#005BAA] p-2.5 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">{t('Mã bảo mật (CVV/CVC):', 'Security Code (CVV/CVC):')}</label>
                    <input
                      type="password"
                      defaultValue="123"
                      maxLength={4}
                      className="w-full bg-[#161B22] border border-[#2D3748] focus:border-[#005BAA] p-2.5 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="w-full py-3 bg-[#005BAA] hover:bg-[#004785] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-75"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{isSubmitting ? t('Đang Xử Lý...', 'Processing...') : `${t('Thanh Toán Quốc Tế', 'International Payment')} (${amount.toLocaleString(isEn ? 'en-US' : 'vi-VN')} ${t('đ', 'VND')})`}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0D1117] border-t border-[#222B35] py-4 text-center text-xs text-gray-500">
        <p>{t('Cổng thanh toán điện tử VNPAY • Hợp tác cùng Skyline Smart Residence • Hotline 1900 55 55 77', 'VNPAY Payment Gateway • In partnership with Skyline Smart Residence • Hotline 1900 55 55 77')}</p>
      </footer>
    </div>
  );
}

function VnpayLoadingFallback() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#0A0E14] text-white flex items-center justify-center">
      <div className="flex items-center gap-2 text-xs font-mono">
        <RefreshCw className="w-4 h-4 animate-spin text-[#005BAA]" />
        <span>{t('Đang kết nối cổng thanh toán VNPAY...', 'Connecting to VNPAY Payment Gateway...')}</span>
      </div>
    </div>
  );
}

export default function VnpayGatewayPage() {
  return (
    <Suspense fallback={<VnpayLoadingFallback />}>
      <VnpayGatewayInner />
    </Suspense>
  );
}
