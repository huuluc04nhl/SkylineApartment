'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Share2, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  KeyRound, 
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  Send,
  Scan,
  RefreshCw,
  Lock,
  Unlock,
  Building,
  Car,
  XCircle,
  Camera,
  ShieldAlert,
  Info,
  Download,
  Link,
  MessageSquare,
  ExternalLink,
  Phone
} from 'lucide-react';
import {
  GeneratedVisitorPass,
  PassEntryType,
  VerificationScanResult,
} from '@/lib/visitorStore';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';
import { User as UserType } from '@/lib/dataStore';
import { useLanguage } from '@/lib/languageContext';
import { cleanPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from '@/lib/validationUtils';

// Custom Zalo Brand Icon
const ZaloIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <rect width="48" height="48" rx="10" fill="#0068FF" />
    <path
      d="M37 24C37 31.1797 31.1797 37 24 37C21.603 37 19.3499 36.3533 17.4172 35.2281L11 37L13.1252 31.3323C11.8021 29.1878 11 26.6896 11 24C11 16.8203 16.8203 11 24 11C31.1797 11 37 16.8203 37 24Z"
      fill="white"
    />
    <path
      d="M20.5 19H29.5V21.5L23.5 28.5H29.5V31H20.5V28.5L26.5 21.5H20.5V19Z"
      fill="#0068FF"
    />
  </svg>
);

// Custom Facebook Messenger Brand Icon
const MessengerIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="12" r="12" fill="url(#messenger-gradient)" />
    <path
      d="M12 4C7.58172 4 4 7.37896 4 11.5459C4 13.9189 5.16335 16.0321 6.98565 17.4246V20L9.4678 18.6369C10.2741 18.8994 11.123 19.0357 12 19.0357C16.4183 19.0357 20 15.6567 20 11.4898C20 7.32284 16.4183 4 12 4ZM12.8767 14.0483L10.7495 11.7807L6.59828 14.0483L11.1609 9.20846L13.3106 11.476L17.4393 9.20846L12.8767 14.0483Z"
      fill="white"
    />
    <defs>
      <linearGradient id="messenger-gradient" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00B2FE" />
        <stop offset="0.5" stopColor="#006AFF" />
        <stop offset="1" stopColor="#A033FF" />
      </linearGradient>
    </defs>
  </svg>
);

interface VisitorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartmentCode: string;
  currentUser?: UserType;
}

export default function VisitorQrModal({ 
  isOpen, 
  onClose, 
  apartmentCode = '',
  currentUser,
}: VisitorQrModalProps) {
  useEscapeKey(isOpen, onClose);
  const { t, isEn } = useLanguage();

  // Form State (ÄÃ£ lÆ°á»£c bá» hoÃ n toÃ n hÃ¬nh thá»©c mÃ£ theo yÃªu cáº§u)
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [validHours, setValidHours] = useState('4');
  const [activePass, setActivePass] = useState<GeneratedVisitorPass | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Interaction states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showScannedContent, setShowScannedContent] = useState(false);

  // Helper toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Generate QR Code data URL whenever activePass changes
  useEffect(() => {
    if (activePass?.qrData) {
      QRCode.toDataURL(activePass.qrData, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0D1117',
          light: '#FFFFFF',
        },
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [activePass?.qrData]);

  if (!isOpen) return null;

  const visitorPassesResource = useAsyncResource(async () => {
    if (!isOpen) return [];
    const res = await fetch('/api/visitor', { credentials: 'include' });
    if (!res.ok) throw new Error(`KhÃ´ng thá»ƒ táº£i danh sÃ¡ch tháº» khÃ¡ch (HTTP ${res.status})`);
    const json = await res.json();
    const passes: GeneratedVisitorPass[] = Array.isArray(json?.passes) ? json.passes : [];
    if (passes.length > 0 && !activePass) {
      setActivePass(passes[0]);
    }
    return passes;
  }, [isOpen]);

  // Handle Resident create/regenerate pass via /api/visitor
  const handleGeneratePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      showToast('Vui lÃ²ng nháº­p há» tÃªn khÃ¡ch thÄƒm!');
      return;
    }
    if (visitorPhone.trim() && !isValidPhoneNumber(visitorPhone)) {
      showToast(getPhoneValidationError(visitorPhone) || 'Sá»‘ Ä‘iá»‡n thoáº¡i khÃ¡ch khÃ´ng há»£p lá»‡!');
      return;
    }
    setIsGenerating(true);

    try {
      const res = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'GENERATE',
          apartmentCode,
          visitorName: visitorName.trim(),
          phoneNumber: visitorPhone.trim(),
          licensePlate: licensePlate.trim().toUpperCase(),
          entryType: 'MULTI',
          validHours: parseInt(validHours, 10) || 4,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.pass) {
        showToast(data?.message || 'KhÃ´ng thá»ƒ táº¡o mÃ£ QR Ä‘Ã³n khÃ¡ch.');
        return;
      }
      setActivePass(data.pass);
      visitorPassesResource.retry();
      showToast('ÄÃ£ táº¡o mÃ£ QR Ä‘Ã³n khÃ¡ch thÃ nh cÃ´ng!');
    } catch {
      showToast('Lá»—i káº¿t ná»‘i khi táº¡o mÃ£ QR Ä‘Ã³n khÃ¡ch.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Format full invitation text
  const getShareText = (pass: GeneratedVisitorPass) => {
    const expTime = new Date(pass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const expDate = new Date(pass.validUntil).toLocaleDateString('vi-VN');
    const towerName = pass.towerName || 'TÃ²a Tropical BS-07';
    const passUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/visitor-pass?id=${pass.id}&pin=${pass.pinCode}`
      : `https://skyline.residence/visitor-pass?id=${pass.id}`;

    let text = `âœ¨ [SKYLINE SMART RESIDENCE] THÆ¯ Má»œI ÄÃ“N KHÃCH ÄIá»†N Tá»¬ âœ¨\n`;
    text += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n`;
    text += `ðŸ‘¤ KÃ­nh gá»­i QuÃ½ khÃ¡ch: ${pass.visitorName}\n`;
    if (pass.phoneNumber) text += `ðŸ“ž Sá»‘ Ä‘iá»‡n thoáº¡i: ${pass.phoneNumber}\n`;
    if (pass.licensePlate) text += `ðŸš— Biá»ƒn sá»‘ xe: ${pass.licensePlate}\n`;
    text += `ðŸ¢ Äiá»ƒm Ä‘áº¿n: CÄƒn há»™ ${pass.apartmentCode} - ${towerName}\n`;
    text += `ðŸ  Chá»§ há»™ báº£o lÃ£nh: ${pass.hostName || 'Chá»§ Há»™'}${pass.hostPhone ? ' (' + pass.hostPhone + ')' : ''}\n`;
    text += `ðŸ“ Äá»‹a chá»‰: Chung cÆ° cao cáº¥p Skyline Smart Residence\n`;
    text += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n`;
    text += `ðŸ”‘ MÃƒ PIN TRA Cá»¨U Lá»„ TÃ‚N: ${pass.pinCode}\n`;
    text += `â³ Thá»i háº¡n hiá»‡u lá»±c: Äáº¿n ${expTime} ngÃ y ${expDate} (${pass.validHours} giá»)\n`;
    text += `MÃ£ vÃ©: ${pass.id}\n`;
    text += `â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n`;
    text += `ðŸ“² HÆ¯á»šNG DáºªN TIáº¾P ÄÃ“N:\n`;
    text += `1. QuÃ½ khÃ¡ch xuáº¥t trÃ¬nh mÃ£ QR hoáº·c Ä‘á»c mÃ£ PIN ${pass.pinCode} táº¡i BÃ n Lá»… TÃ¢n / Bá»‘t An Ninh Ä‘á»ƒ nháº­n tháº» thang mÃ¡y lÃªn cÄƒn há»™ ${pass.apartmentCode}.\n`;
    text += `2. NhÃ¢n viÃªn lá»… tÃ¢n sáº½ xÃ¡c thá»±c thÃ´ng tin báº£o lÃ£nh chÃ­nh thá»©c tá»« chá»§ há»™.\n`;
    text += `ðŸŒ Xem tháº» online: ${passUrl}\n`;
    text += `TrÃ¢n trá»ng Ä‘Ã³n tiáº¿p!`;
    return text;
  };

  // Copy invitation text
  const handleCopyPass = () => {
    if (!activePass) return;
    const shareText = getShareText(activePass);
    navigator.clipboard.writeText(shareText);
  };

  // Copy PIN only
  const handleCopyPin = () => {
    if (!activePass) return;
    navigator.clipboard.writeText(activePass.pinCode);
    showToast(`ÄÃ£ sao chÃ©p mÃ£ PIN: ${activePass.pinCode}`);
  };

  // Copy Direct Link
  const handleCopyLink = () => {
    if (!activePass) return;
    const shareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/visitor-pass?id=${activePass.id}&pin=${activePass.pinCode}`
      : `https://skyline.residence/visitor-pass?id=${activePass.id}&pin=${activePass.pinCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast('ÄÃ£ sao chÃ©p liÃªn káº¿t Ä‘Ã³n khÃ¡ch!');
  };

  // Share via Zalo
  const handleShareZalo = () => {
    if (!activePass) return;
    handleCopyPass();
    showToast('ÄÃ£ sao chÃ©p thÆ° má»i! Äang má»Ÿ Zalo Ä‘á»ƒ gá»­i...');
    setTimeout(() => {
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.open('https://zalo.me', '_blank');
      } else {
        window.open('https://chat.zalo.me', '_blank');
      }
    }, 400);
  };

  // Share via Messenger
  const handleShareMessenger = () => {
    if (!activePass) return;
    handleCopyPass();
    showToast('ÄÃ£ sao chÃ©p thÆ° má»i! Äang má»Ÿ Messenger...');
    setTimeout(() => {
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.open('fb-messenger://', '_blank');
      } else {
        window.open('https://www.facebook.com/messages/', '_blank');
      }
    }, 400);
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (!activePass) return;
    const shareText = getShareText(activePass);
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tháº» Má»i KhÃ¡ch CÄƒn Há»™ ${activePass.apartmentCode} - Skyline Smart Residence`,
          text: shareText,
          url: shareUrl,
        });
        showToast('ÄÃ£ má»Ÿ menu chia sáº» há»‡ thá»‘ng!');
      } catch (e) {
        // User dismissed
      }
    } else {
      handleCopyPass();
    }
  };

  // Export & Download Card as PNG Image
  const handleDownloadCardImage = async () => {
    if (!activePass) return;
    setIsDownloading(true);

    try {
      // 1. Generate QR Code Image URL
      const qrUrl = await QRCode.toDataURL(activePass.qrData, {
        width: 440,
        margin: 1,
        color: { dark: '#0D1117', light: '#FFFFFF' }
      });

      // 2. Setup High-Res Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot init canvas context');

      const W = 840;
      const H = 1140;
      canvas.width = W;
      canvas.height = H;

      // 3. Dark Luxury Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#090D12');
      bgGrad.addColorStop(0.35, '#121922');
      bgGrad.addColorStop(0.75, '#0E141C');
      bgGrad.addColorStop(1, '#06090D');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 4. Gold Outer & Inner Borders
      ctx.strokeStyle = '#C5A880';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, W - 60, H - 60);

      ctx.strokeStyle = 'rgba(197, 168, 128, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, W - 80, H - 80);

      // Luxury Corner Highlights
      const cSize = 28;
      ctx.strokeStyle = '#E2C799';
      ctx.lineWidth = 4;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(28, 28 + cSize); ctx.lineTo(28, 28); ctx.lineTo(28 + cSize, 28);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(W - 28 - cSize, 28); ctx.lineTo(W - 28, 28); ctx.lineTo(W - 28, 28 + cSize);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(28, H - 28 - cSize); ctx.lineTo(28, H - 28); ctx.lineTo(28 + cSize, H - 28);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(W - 28 - cSize, H - 28); ctx.lineTo(W - 28, H - 28); ctx.lineTo(W - 28, H - 28 - cSize);
      ctx.stroke();

      // 5. Header Branding
      ctx.textAlign = 'center';
      ctx.fillStyle = '#C5A880';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('SKYLINE SMART RESIDENCE', W / 2, 85);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px serif';
      ctx.fillText('THáºº ÄÃ“N KHÃCH ÄIá»†N Tá»¬', W / 2, 130);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText('VIP VISITOR SMART PASS â€¢ Há»† THá»NG AN NINH Tá»° Äá»˜NG', W / 2, 160);

      // Gold divider line
      const divGrad = ctx.createLinearGradient(120, 0, W - 120, 0);
      divGrad.addColorStop(0, 'rgba(197, 168, 128, 0)');
      divGrad.addColorStop(0.5, 'rgba(197, 168, 128, 0.8)');
      divGrad.addColorStop(1, 'rgba(197, 168, 128, 0)');
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(100, 185);
      ctx.lineTo(W - 100, 185);
      ctx.stroke();

      // 6. Guest Information Card Box
      ctx.fillStyle = 'rgba(20, 27, 36, 0.85)';
      ctx.fillRect(80, 210, W - 160, 120);
      ctx.strokeStyle = 'rgba(197, 168, 128, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(80, 210, W - 160, 120);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#C5A880';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('KÃNH Gá»¬I QUÃ KHÃCH THÄ‚M:', 110, 242);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(activePass.visitorName || 'KhÃ¡ch ThÄƒm NhÃ ', 110, 276);

      ctx.fillStyle = '#9FB1C7';
      ctx.font = '14px sans-serif';
      const towerText = activePass.apartmentCode.includes('A') ? 'Chung cÆ° Sapphire' : 'Chung cÆ° Diamond';
      ctx.fillText(`Äiá»ƒm Ä‘áº¿n: CÄƒn há»™ ${activePass.apartmentCode} â€¢ ${towerText} â€¢ Chung cÆ° Skyline`, 110, 304);
      ctx.fillStyle = '#C5A880';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Chá»§ há»™ báº£o lÃ£nh: ${activePass.hostName || 'Chá»§ há»™ CÄƒn ' + activePass.apartmentCode}${activePass.hostPhone ? ` â€¢ SÄT: ${activePass.hostPhone}` : ''}`, 110, 326);

      // 7. QR Code Card Container
      const qrBoxW = 340;
      const qrBoxH = 340;
      const qrBoxX = (W - qrBoxW) / 2;
      const qrBoxY = 360;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.rect(qrBoxX, qrBoxY, qrBoxW, qrBoxH);
      ctx.fill();

      // Draw QR image
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrUrl;
      });
      ctx.drawImage(qrImg, qrBoxX + 18, qrBoxY + 18, qrBoxW - 36, qrBoxH - 36);

      // 8. PIN Box below QR
      const pinBoxY = 730;
      ctx.fillStyle = 'rgba(16, 22, 30, 0.95)';
      ctx.fillRect(80, pinBoxY, W - 160, 115);
      ctx.strokeStyle = '#C5A880';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(80, pinBoxY, W - 160, 115);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.fillText('MÃƒ PIN TRA Cá»¨U Táº I BÃ€N Lá»„ TÃ‚N / CHá»T AN NINH', W / 2, pinBoxY + 35);

      ctx.fillStyle = '#F0D4A3';
      ctx.font = 'bold 38px monospace';
      ctx.fillText(activePass.pinCode, W / 2, pinBoxY + 82);

      // 9. Instructions & Validity
      const expTime = new Date(activePass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const expDate = new Date(activePass.validUntil).toLocaleDateString('vi-VN');

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`Thá»i háº¡n hiá»‡u lá»±c: Äáº¿n ${expTime} ngÃ y ${expDate} (${activePass.validHours} giá»)`, W / 2, 885);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText('QuÃ½ khÃ¡ch vui lÃ²ng xuáº¥t trÃ¬nh mÃ£ QR táº¡i BÃ n Lá»… TÃ¢n hoáº·c Chá»‘t An Ninh.', W / 2, 920);
      ctx.fillText('NhÃ¢n viÃªn an ninh sáº½ xÃ¡c thá»±c thÃ´ng tin vÃ  hÆ°á»›ng dáº«n lÃªn cÄƒn há»™.', W / 2, 946);

      // 10. Watermark Footer
      ctx.fillStyle = 'rgba(197, 168, 128, 0.45)';
      ctx.font = '11px sans-serif';
      ctx.fillText('Chung cÆ° Skyline Smart Residence â€¢ MÃ£ hÃ³a thá»i gian thá»±c â€¢ Verified Pass', W / 2, 1070);

      // 11. Download trigger
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `Skyline_The_Moi_Khach_${activePass.apartmentCode}_${(activePass.visitorName || 'VIP').replace(/\s+/g, '_')}.png`;
      a.href = dataUrl;
      a.click();
      showToast('ÄÃ£ lÆ°u áº£nh Tháº» Má»i KhÃ¡ch vÃ o mÃ¡y thÃ nh cÃ´ng!');
    } catch (err) {
      console.error('Download card error:', err);
      showToast('KhÃ´ng thá»ƒ lÆ°u áº£nh, vui lÃ²ng thá»­ láº¡i.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0D1117] border border-[#C5A880]/80 max-w-3xl w-full p-4 sm:p-6 text-white space-y-4 sm:space-y-5 shadow-2xl rounded-none max-h-[94vh] overflow-y-auto relative">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-[#161D26] border border-[#C5A880] text-[#C5A880] text-xs font-bold rounded-none shadow-2xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-3 sm:pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5 font-mono">
              <QrCode className="w-3.5 h-3.5" /> ÄÃ³n KhÃ¡ch â€¢ CÄƒn {apartmentCode}
            </div>
            <h2 className="font-serif text-lg sm:text-2xl font-bold text-white mt-0.5">
              MÃ£ QR ÄÃ³n KhÃ¡ch
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-none text-gray-400 hover:text-white hover:bg-[#161B22] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resident Pass Creation & Sharing */}
        <div className="space-y-4">
            {/* Building Policy & Privacy Guarantee Banner */}
            <div className="p-3 bg-[#121E2A] border border-[#1E3A5F] rounded-none flex items-start gap-2.5 text-xs text-cyan-200">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="line-clamp-2 sm:line-clamp-none">
                MÃ£ QR dÃ¹ng Ä‘á»ƒ khÃ¡ch quÃ©t qua sáº£nh lá»… tÃ¢n vÃ  thang mÃ¡y lÃªn cÄƒn há»™. HÃ ng shipper vui lÃ²ng gá»­i táº¡i sáº£nh lá»… tÃ¢n.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
              
              {/* Form táº¡o mÃ£ thÃ´ng tin khÃ¡ch */}
              <form onSubmit={handleGeneratePass} className="space-y-3.5 bg-[#121820] border border-[#222B35] p-3.5 sm:p-5 rounded-none text-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5 pb-2 border-b border-[#222B35]">
                  <UserCheck className="w-3.5 h-3.5" /> ThÃ´ng Tin KhÃ¡ch ThÄƒm
                </div>

                {/* 1. Há» tÃªn khÃ¡ch */}
                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Há» TÃªn KhÃ¡ch ThÄƒm <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder={isEn ? 'e.g. John Doe, Sarah...' : 'VD: Anh Minh, Chá»‹ Lan...'}
                    className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none font-sans"
                    required
                  />
                </div>

                {/* 2. Sá»‘ Ä‘iá»‡n thoáº¡i khÃ¡ch */}
                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Sá»‘ Äiá»‡n Thoáº¡i KhÃ¡ch (10 sá»‘):
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      maxLength={10}
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(cleanPhoneNumber(e.target.value))}
                      placeholder={isEn ? 'e.g. 0912345678 (Used for contact if needed)' : 'VD: 0912345678 (DÃ¹ng liÃªn há»‡ khi cáº§n)'}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 pl-8 text-white rounded-none focus:border-[#C5A880] outline-none font-mono"
                    />
                    <Phone className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-3" />
                  </div>
                  {visitorPhone && !isValidPhoneNumber(visitorPhone) && (
                    <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                      {getPhoneValidationError(visitorPhone)}
                    </span>
                  )}
                </div>

                {/* 3. Biá»ƒn sá»‘ xe & Thá»i gian hiá»‡u lá»±c */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Biá»ƒn Sá»‘ Xe (Náº¿u CÃ³):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        placeholder="51F-123.45"
                        className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 pl-8 text-white font-mono uppercase rounded-none focus:border-[#C5A880] outline-none"
                      />
                      <Car className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Thá»i Gian Hiá»‡u Lá»±c:
                    </label>
                    <select
                      value={validHours}
                      onChange={(e) => setValidHours(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] p-2.5 text-white rounded-none focus:border-[#C5A880] outline-none cursor-pointer"
                    >
                      <option value="1">{isEn ? '1 Hour (Quick visit)' : '1 Giá» (Gáº·p nhanh)'}</option>
                      <option value="2">{isEn ? '2 Hours (Casual visit)' : '2 Giá» (Tiáº¿p khÃ¡ch)'}</option>
                      <option value="4">{isEn ? '4 Hours (Half day)' : '4 Giá» (Ná»­a ngÃ y)'}</option>
                      <option value="8">{isEn ? '8 Hours (Full day)' : '8 Giá» (Trong ngÃ y)'}</option>
                      <option value="24">{isEn ? '24 Hours (Overnight)' : '24 Giá» (Cáº£ ngÃ y)'}</option>
                    </select>
                  </div>
                </div>

                {/* NÃºt Táº¡o MÃ£ */}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 bg-[#C5A880] hover:bg-white text-[#0D1117] font-bold text-xs uppercase tracking-wider rounded-none shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Äang Táº¡o MÃ£ Má»›i...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Táº¡o MÃ£ QR Má»i KhÃ¡ch
                    </>
                  )}
                </button>
              </form>

              {/* Tháº» hiá»ƒn thá»‹ mÃ£ QR & Bá»™ cÃ´ng cá»¥ chia sáº» VIP */}
              {!activePass ? (
                <div className="bg-[#121820] border-2 border-dashed border-[#2D3748] p-5 sm:p-6 rounded-none flex flex-col items-center justify-center text-center h-full min-h-[300px] sm:min-h-[360px] space-y-3.5 shadow-inner">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-none bg-[#161D26] border border-[#2D3748] flex items-center justify-center text-[#C5A880]/70">
                    <QrCode className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-serif font-bold text-white text-base">{isEn ? 'No Visitor Pass Created Yet' : 'ChÆ°a Táº¡o Tháº» ÄÃ³n KhÃ¡ch'}</div>
                    <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                      {isEn ? <>Please fill in visitor information on the left and click <span className="text-[#C5A880] font-semibold">"Generate Guest QR Pass"</span> to export an official security QR pass.</> : <>Vui lÃ²ng Ä‘iá»n thÃ´ng tin khÃ¡ch thÄƒm á»Ÿ biá»ƒu máº«u bÃªn trÃ¡i vÃ  nháº¥n <span className="text-[#C5A880] font-semibold">"Táº¡o MÃ£ QR Má»i KhÃ¡ch"</span> Ä‘á»ƒ xuáº¥t tháº» QR báº£o máº­t thá»±c táº¿.</>}
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Há»‡ thá»‘ng báº£o máº­t 100% khÃ´ng lÆ°u há»“ sÆ¡ cÃ¡ nhÃ¢n
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-b from-[#161D26] to-[#0E131A] border-2 border-[#C5A880] p-4 sm:p-5 rounded-none space-y-3.5 shadow-2xl flex flex-col justify-between">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                    <div className="space-y-0.5">
                      <div className="font-serif font-bold text-white text-base truncate">
                        {activePass.visitorName || 'KhÃ¡ch ThÄƒm NhÃ '}
                      </div>
                      <div className="text-[11px] text-[#C5A880]">
                        Äiá»ƒm Ä‘áº¿n: CÄƒn há»™ {activePass.apartmentCode} â€¢ {activePass.towerName || 'Chung cÆ° Skyline'}
                        {activePass.licensePlate && ` â€¢ Xe: ${activePass.licensePlate}`}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Chá»§ há»™: {activePass.hostName || 'Chá»§ há»™'} {activePass.hostPhone ? `(${activePass.hostPhone})` : ''}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 ml-2">
                      <span className="px-2 py-0.5 text-[9.5px] font-bold uppercase rounded-none border bg-emerald-950/80 text-emerald-300 border-emerald-500/60 font-mono">
                        VIP PASS
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono mt-0.5">{isEn ? 'Active Now' : 'Hiá»‡u Lá»±c Ngay'}</span>
                    </div>
                  </div>

                  {/* QR Image Container */}
                  <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-[#0A0E14] p-3.5 rounded-none border border-[#222B35]">
                    <button type="button" className="bg-white p-2 rounded-none shadow-inner flex-shrink-0 group relative cursor-pointer" onClick={handleDownloadCardImage} title={isEn ? 'Click to save image' : 'Nháº¥n Ä‘á»ƒ lÆ°u áº£nh'} aria-label={isEn ? 'Save QR pass image' : 'LÆ°u áº£nh mÃ£ QR khÃ¡ch thÄƒm'}>
                      <img
                        src={qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(activePass.qrData)}`}
                        alt={isEn ? 'Guest QR Pass' : 'QR Má»i KhÃ¡ch'}
                        className="w-28 h-28 object-contain"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-none flex items-center justify-center text-white text-[10px] font-bold gap-1">
                        <Download className="w-3.5 h-3.5" /> LÆ°u áº£nh
                      </div>
                    </button>

                    <div className="space-y-2 text-xs flex-1 w-full sm:w-auto">
                      <div className="p-2 bg-[#121820] border border-[#222B35] rounded-none flex items-center justify-between">
                        <div>
                          <div className="text-gray-400 text-[10px]">{isEn ? 'Gate PIN Code:' : 'MÃ£ PIN Nháº­p Cá»•ng:'}</div>
                          <div className="font-mono text-xl font-bold text-[#C5A880] tracking-wider">
                            {activePass.pinCode}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyPin}
                          className="px-2.5 py-1 bg-[#1C2533] hover:bg-[#2A374A] text-gray-300 hover:text-white rounded-none text-[10px] flex items-center gap-1 border border-gray-700 transition-colors cursor-pointer"
                          title={isEn ? 'Copy PIN code' : 'Sao chÃ©p mÃ£ PIN'}
                        >
                          <Copy className="w-3 h-3 text-[#C5A880]" /> ChÃ©p PIN
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-300 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{isEn ? `Valid duration: ${activePass.validHours} hours` : `Thá»i háº¡n hiá»‡u lá»±c: ${activePass.validHours} giá»`}</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Äáº¿n {new Date(activePass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(activePass.validUntil).toLocaleDateString('vi-VN')})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ======================================================= */}
                  {/* Bá»˜ CÃ”NG Cá»¤ CHIA Sáºº, ZALO, MESSENGER, LÆ¯U áº¢NH THEO YÃŠU Cáº¦U */}
                  {/* ======================================================= */}
                  <div className="space-y-2 pt-1 border-t border-[#222B35]">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-[#C5A880]" /> Chia Sáº» MÃ£ Äáº¿n KhÃ¡ch:
                      </span>
                      <span className="text-[9.5px] text-emerald-400 font-normal">{isEn ? 'Ready to share' : 'Sáºµn sÃ ng gá»­i'}</span>
                    </div>

                    {/* HÃ€NG 1: CÃC KÃŠNH CHIA Sáºº TRá»°C TIáº¾P */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* NÃºt Gá»­i Zalo */}
                      <button
                        type="button"
                        onClick={handleShareZalo}
                        className="py-2.5 px-2 bg-[#0068FF]/15 hover:bg-[#0068FF] text-[#60A5FA] hover:text-white border border-[#0068FF]/50 rounded-none text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer group"
                        title={isEn ? 'Copy invitation and open Zalo to send' : 'Sao chÃ©p lá»i má»i vÃ  má»Ÿ Zalo Ä‘á»ƒ gá»­i'}
                      >
                        <ZaloIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{isEn ? 'Send via Zalo' : 'Gá»­i Zalo'}</span>
                      </button>

                      {/* NÃºt Gá»­i Messenger */}
                      <button
                        type="button"
                        onClick={handleShareMessenger}
                        className="py-2.5 px-2 bg-[#0084FF]/15 hover:bg-[#0084FF] text-[#38BDF8] hover:text-white border border-[#0084FF]/50 rounded-none text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer group"
                        title={isEn ? 'Copy invitation and open Messenger' : 'Sao chÃ©p lá»i má»i vÃ  má»Ÿ Messenger'}
                      >
                        <MessengerIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">Messenger</span>
                      </button>

                      {/* NÃºt LÆ°u áº¢nh Tháº» Má»i PNG */}
                      <button
                        type="button"
                        onClick={handleDownloadCardImage}
                        disabled={isDownloading}
                        className="py-2.5 px-2 bg-[#C5A880]/20 hover:bg-[#C5A880] text-[#C5A880] hover:text-[#0D1117] border border-[#C5A880] rounded-none text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title={isEn ? 'Download VIP guest pass image as PNG' : 'Táº£i áº£nh tháº» má»i VIP Ä‘á»‹nh dáº¡ng PNG vá» mÃ¡y'}
                      >
                        {isDownloading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span className="truncate">{isEn ? 'Save Image' : 'LÆ°u áº¢nh'}</span>
                      </button>
                    </div>

                    {/* HÃ€NG 2: TIá»†N ÃCH LIÃŠN Káº¾T & CHIA Sáºº Há»† THá»NG */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Sao chÃ©p link */}
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="py-2.5 px-3 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 hover:text-white border border-[#2D3748] rounded-none text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold truncate">{isEn ? 'Link Copied' : 'ÄÃ£ ChÃ©p Link'}</span>
                          </>
                        ) : (
                          <>
                            <Link className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span className="truncate">{isEn ? 'Copy Guest Access Link' : 'Sao ChÃ©p Link ÄÃ³n KhÃ¡ch'}</span>
                          </>
                        )}
                      </button>

                      {/* Chia sáº» há»‡ thá»‘ng / KhÃ¡c */}
                      <button
                        type="button"
                        onClick={handleNativeShare}
                        className="py-2.5 px-3 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 hover:text-white border border-[#2D3748] rounded-none text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span className="truncate">{isEn ? 'Other Share' : 'Chia Sáº» KhÃ¡c'}</span>
                      </button>
                    </div>

                    {/* HÃ€NG 3: XEM TRÆ¯á»šC Ná»˜I DUNG KHI KHÃCH QUÃ‰T MÃƒ QR & TRANG WEB ONLINE */}
                    <div className="pt-2 border-t border-[#222B35] space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowScannedContent(!showScannedContent)}
                          className="text-[11px] text-[#C5A880] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                        >
                          <Scan className="w-3.5 h-3.5" />
                          <span>{showScannedContent ? t('Thu gá»n ná»™i dung quÃ©t') : t('Xem ná»™i dung hiá»ƒn thá»‹ khi quÃ©t mÃ£')}</span>
                        </button>

                        <a
                          href={`/visitor-pass?id=${activePass.id}&pin=${activePass.pinCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{t('Má»Ÿ Tháº» Má»i Online')}</span>
                        </a>
                      </div>

                      {showScannedContent && (
                        <div className="p-3 bg-[#0A0E14] border border-[#222B35] text-[11px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed animate-fadeIn select-all max-h-48 overflow-y-auto">
                          {activePass.qrData}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>

      </div>
    </div>
  );
}
