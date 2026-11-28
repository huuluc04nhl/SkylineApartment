'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Car, 
  Building, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  MapPin, 
  Sparkles, 
  Shield,
  ArrowRight,
  PhoneCall,
  XCircle,
  RefreshCw,
  Home
} from 'lucide-react';
import { GeneratedVisitorPass } from '@/lib/visitorStore';
import { useAuth } from '@/lib/authContext';

function VisitorPassViewer() {
  const { currentUser } = useAuth();
  const canStaffCheckIn = currentUser?.role === 'ADMIN' || currentUser?.role === 'RECEPTIONIST';
  const searchParams = useSearchParams();
  const passIdParam = searchParams.get('id') || searchParams.get('passId') || '';
  const pinParam = searchParams.get('pin') || '';

  const [pass, setPass] = useState<GeneratedVisitorPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  // Fetch visitor pass from API
  const fetchPassData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      if (!passIdParam || !pinParam) {
        setErrorMsg('Liên kết thẻ khách thiếu mã thẻ (id) hoặc mã PIN xác thực.');
        setPass(null);
        return;
      }

      const url = `/api/visitor/public?id=${encodeURIComponent(passIdParam)}&pin=${encodeURIComponent(pinParam)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.pass) {
        setPass(data.pass);
      } else {
        setErrorMsg(data.message || 'Không tìm thấy thông tin thẻ khách thăm.');
      }
    } catch (err: any) {
      console.error('Fetch visitor pass error:', err);
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassData();
  }, [passIdParam, pinParam]);

  // Real-time Countdown calculation
  useEffect(() => {
    if (!pass?.validUntil) return;

    const calculateTimeLeft = () => {
      const difference = new Date(pass.validUntil).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [pass?.validUntil]);

  // Copy PIN action
  const handleCopyPin = () => {
    if (!pass?.pinCode) return;
    navigator.clipboard.writeText(pass.pinCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  // Receptionist / Security check-in
  const handleConfirmCheckIn = async () => {
    if (!pass) return;
    try {
      setIsCheckingIn(true);
      const res = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'CHECK_IN', passId: pass.id }),
      });
      const data = await res.json();
      if (data.success && data.pass) {
        setPass(data.pass);
        setCheckInSuccess(true);
        setTimeout(() => setCheckInSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A0E] flex flex-col items-center justify-center p-4 text-[#C5A880] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-gray-300">Đang tải thẻ mời khách Skyline...</p>
      </div>
    );
  }

  if (errorMsg || !pass) {
    return (
      <div className="min-h-screen bg-[#070A0E] flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-[#121820] border border-red-500/50 p-6 space-y-4 text-center shadow-2xl">
          <div className="w-12 h-12 bg-red-950/80 border border-red-500 text-red-400 mx-auto flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-lg font-bold text-white">Không Thể Xác Thực Thẻ Khách</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            {errorMsg || 'Mã thẻ khách không tồn tại hoặc đã bị thu hồi khỏi hệ thống an ninh tòa nhà.'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider"
            >
              <Home className="w-3.5 h-3.5" /> Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = timeLeft.isExpired || pass.status === 'EXPIRED';
  const isCheckedIn = pass.status === 'CHECKED_IN';
  const expDateObj = new Date(pass.validUntil);
  const expTimeStr = expDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const expDateStr = expDateObj.toLocaleDateString('vi-VN');

  return (
    <div className="min-h-screen bg-[#070A0E] text-white flex flex-col items-center justify-center p-3 sm:p-6 py-8 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1C2533]/40 via-[#070A0E] to-[#05070A] pointer-events-none" />

      <div className="relative w-full max-w-lg space-y-4 sm:space-y-5 animate-fadeIn">
        {/* Luxury Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#121820] border border-[#C5A880]/60 text-[#C5A880] text-[10.5px] uppercase tracking-[0.25em] font-semibold shadow">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> Skyline Smart Residence
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight pt-1">
            Thư Mời Đón Khách Điện Tử
          </h1>
          <p className="text-xs text-gray-400">
            Hệ thống an ninh tiếp đón tự động • Bảo lãnh chính thức từ Chủ hộ
          </p>
        </div>

        {/* Main Digital Pass Card */}
        <div className="bg-[#121820] border-2 border-[#C5A880] shadow-2xl overflow-hidden relative">
          
          {/* Top Gold Corner Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#E2C799]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#E2C799]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#E2C799]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#E2C799]" />

          {/* Status Banner */}
          <div className={`p-4 border-b flex items-center justify-between gap-3 ${
            isExpired 
              ? 'bg-rose-950/70 border-rose-500 text-rose-200' 
              : isCheckedIn
              ? 'bg-amber-950/60 border-amber-500 text-amber-200'
              : 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {isExpired ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : isCheckedIn ? (
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-xs uppercase tracking-wider font-mono">
                  {isExpired 
                    ? 'Thẻ Đón Khách Đã Hết Hạn' 
                    : isCheckedIn 
                    ? 'Khách Đã Check-In Tại Tòa Nhà' 
                    : 'Thẻ Hợp Lệ • Được Phép Vào Tòa Nhà'}
                </div>
                <div className="text-[11px] opacity-90">
                  {isExpired 
                    ? `Hết hạn lúc ${expTimeStr} ngày ${expDateStr}` 
                    : isCheckedIn 
                    ? `Đã xác thực lúc ${pass.checkedInAt || 'hôm nay'}` 
                    : `Hiệu lực đến ${expTimeStr} ngày ${expDateStr}`}
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 border border-current font-bold uppercase shrink-0">
              {pass.id}
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Countdown Clock (If Active) */}
            {!isExpired && (
              <div className="p-3 bg-[#0A0E14] border border-[#222B35] flex items-center justify-between gap-2">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Thời gian hiệu lực còn lại:</span>
                </div>
                <div className="font-mono text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <span className="bg-[#161D26] px-1.5 py-0.5 border border-emerald-500/40">{String(timeLeft.hours).padStart(2, '0')}h</span>
                  <span>:</span>
                  <span className="bg-[#161D26] px-1.5 py-0.5 border border-emerald-500/40">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                  <span>:</span>
                  <span className="bg-[#161D26] px-1.5 py-0.5 border border-emerald-500/40">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                </div>
              </div>
            )}

            {/* Information Grid: Khách Thăm & Chủ Hộ Bảo Lãnh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              
              {/* Box 1: Khách Thăm */}
              <div className="p-3.5 bg-[#0D1117] border border-[#222B35] space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Thông Tin Khách Thăm
                </div>
                <div className="font-bold text-base text-white truncate" title={pass.visitorName}>
                  {pass.visitorName || 'Quý Khách'}
                </div>
                <div className="space-y-1 text-gray-300 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{pass.phoneNumber || 'Không cung cấp SĐT'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Car className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="font-mono font-semibold text-white">
                      {pass.licensePlate ? `Xe: ${pass.licensePlate}` : 'Đi bộ / Taxi công nghệ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Điểm Đến & Chủ Hộ Bảo Lãnh */}
              <div className="p-3.5 bg-[#0D1117] border border-[#222B35] space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-[#C5A880] font-bold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Điểm Đến & Bảo Lãnh
                </div>
                <div className="font-bold text-base text-[#C5A880] flex items-center gap-1.5">
                  <span>Căn {pass.apartmentCode}</span>
                  <span className="text-xs text-gray-400 font-normal">• {pass.towerName || 'Tropical BS-07'}</span>
                </div>
                <div className="space-y-1 text-gray-300 text-[11px]">
                  <div>
                    Chủ hộ: <strong className="text-white">{pass.hostName || 'Chủ Hộ'}</strong>
                  </div>
                  {pass.hostPhone && (
                    <a
                      href={`tel:${pass.hostPhone}`}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:underline pt-0.5"
                    >
                      <PhoneCall className="w-3 h-3" /> Gọi chủ hộ ({pass.hostPhone})
                    </a>
                  )}
                </div>
              </div>

            </div>

            {/* Giant PIN Box for Reception Check-in */}
            <div className="p-4 bg-gradient-to-r from-[#161D26] to-[#0E141D] border border-[#C5A880] text-center space-y-2 shadow-lg">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-300 flex items-center justify-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Mã PIN Tra Cứu Tại Bàn Lễ Tân / Bảo Vệ</span>
              </div>
              <div className="font-mono text-4xl sm:text-5xl font-extrabold text-[#F0D4A3] tracking-[0.2em]">
                {pass.pinCode}
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="px-3 py-1.5 bg-[#1C2533] hover:bg-[#2A374A] border border-[#C5A880] text-[#C5A880] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPin ? 'Đã Sao Chép PIN' : 'Sao Chép Mã PIN'}</span>
                </button>
              </div>
            </div>

            {/* Check-in Instructions */}
            <div className="p-4 bg-[#0A0E14] border border-[#222B35] space-y-2.5 text-xs text-gray-300">
              <div className="font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Hướng Dẫn Tiếp Đón Tại Tòa Nhà:
              </div>
              <ol className="space-y-1.5 list-decimal list-inside text-gray-300 leading-relaxed text-[11.5px]">
                <li>Xuất trình màn hình thẻ mời này hoặc đọc <strong>mã PIN {pass.pinCode}</strong> tại Quầy Lễ Tân / Bốt An Ninh Sảnh Tòa Nhà.</li>
                <li>Nhân viên lễ tân đối soát thông tin bảo lãnh hợp lệ từ chủ hộ căn <strong>{pass.apartmentCode}</strong>.</li>
                <li>Nhận thẻ thang máy phân tầng hoặc được nhân viên an ninh mở cửa sảnh để lên căn hộ.</li>
              </ol>
            </div>

            {/* Check-in Success Banner */}
            {checkInSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Xác nhận check-in thành công! Khách đã được ghi nhận vào tòa nhà.</span>
              </div>
            )}

            {/* Action Buttons: Hotline & Receptionist Check-in */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <a
                href="tel:19008888"
                className="py-3 px-3 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Hotline Lễ Tân: 1900 8888</span>
              </a>

              {canStaffCheckIn && !isCheckedIn && !isExpired ? (
                <button
                  type="button"
                  onClick={handleConfirmCheckIn}
                  disabled={isCheckingIn}
                  className="py-3 px-3 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-60"
                >
                  {isCheckingIn ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Xác Nhận Check-In (Lễ Tân)</span>
                </button>
              ) : isCheckedIn ? (
                <div className="py-3 px-3 bg-[#161D26] border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã Vào Tòa Nhà
                </div>
              ) : null}
            </div>

          </div>

          {/* Card Footer */}
          <div className="p-3 bg-[#0A0E14] border-t border-[#222B35] text-center text-[10.5px] text-gray-400">
            Chung cư cao cấp Skyline Smart Residence • Xác thực mã hóa thời gian thực
          </div>

        </div>

        {/* Back Link */}
        <div className="text-center pt-1">
          <Link
            href="/"
            className="text-xs text-[#C5A880] hover:text-white hover:underline inline-flex items-center gap-1 transition-colors"
          >
            ← Về Trang Chủ Chung Cư Skyline
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VisitorPassPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070A0E] flex flex-col items-center justify-center p-4 text-[#C5A880] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-gray-300">Đang khởi tạo thẻ mời khách...</p>
      </div>
    }>
      <VisitorPassViewer />
    </Suspense>
  );
}
