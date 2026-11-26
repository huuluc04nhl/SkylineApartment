'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAsyncResource } from '@/lib/hooks/useAsyncResource';
import { ResourceSkeleton, ResourceError, ResourceEmpty } from '@/components/ui/ResourceState';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Upload, 
  Zap, 
  Building2, 
  User, 
  Phone, 
  Car, 
  Clock, 
  KeyRound, 
  Search, 
  RefreshCw, 
  Check, 
  UserCheck, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  FileText,
  Home,
  Users,
  Info,
  Plus,
  QrCode,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  Trash2,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  Printer,
  X
} from 'lucide-react';
import { 
  verifyVisitorQr, 
  VerificationScanResult, 
  getAllVisitorPasses,
  GeneratedVisitorPass,
  checkInVisitorPass,
  checkOutVisitorPass,
  deleteVisitorPass,
  generateVisitorPassToken,
  getGateAuditLogs,
  GateAuditLog,
  VisitorPassStatus,
  clearAllVisitorData
} from '@/lib/visitorStore';
import { getApartmentUnits } from '@/lib/apartmentStore';
import { cleanPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from '@/lib/validationUtils';
import { useLanguage } from '@/lib/languageContext';
import ConfirmDeleteModal from '@/components/portal/shared/ConfirmDeleteModal';

export type VisitorTab = 'LIST' | 'SCANNER' | 'AUDIT_LOGS';


export default function VisitorScannerTabView({ ctx }: { ctx: any }) {
  const { t, isEn, isValidPhoneNumber, getPhoneValidationError, activeTab, setActiveTabState, selectedCheckpoint, setSelectedCheckpoint, viewLayout, setViewLayout, scanMode, setScanMode, isCameraActive, setIsCameraActive, cameraError, setCameraError, isScanning, setIsScanning, pinSearchInput, setPinSearchInput, scanResult, setScanResult, actionFeedback, setActionFeedback, passesList, setPassesList, filterStatus, setFilterStatus, tableSearch, setTableSearch, auditLogs, setAuditLogs, deleteModalConfig, setDeleteModalConfig, logSearch, setLogSearch, isQuickPassModalOpen, setIsQuickPassModalOpen, selectedPassForDetail, setSelectedPassForDetail, detailQrDataUrl, setDetailQrDataUrl, newPassApt, setNewPassApt, newPassVisitorName, setNewPassVisitorName, newPassVisitorPhone, setNewPassVisitorPhone, newPassPlate, setNewPassPlate, newPassHours, setNewPassHours, newPassNote, setNewPassNote, createdQuickPass, setCreatedQuickPass, createdQrUrl, setCreatedQrUrl, setActiveTab, apartments, videoRef, canvasRef, fileInputRef, animationFrameId, refreshData, showFeedback, handleVerify, handleCheckIn, handleCheckOut, handleDeletePass, handleClearAllData, scanVideoFrame, startCamera, stopCamera, handleImageUpload, openPassDetail, handleCreateQuickPass, resetQuickPassForm, totalPasses, inBuildingCount, pendingCount, completedCount, expiredCount, filteredPasses, filteredLogs, visitorResource } = ctx;
  return (
    <>
      {activeTab === 'SCANNER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Cột Trái (5/12): Thiết Bị Quét Đa Phương Thức */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-4 bg-[#121820] border border-[#2D3748] rounded-none space-y-3.5 shadow-xl">
              {/* Tiêu đề & Chọn phương thức */}
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> Phương Thức Tiếp Đón
                </span>

                <div className="flex gap-1 bg-[#161B22] p-0.5 rounded-none border border-[#222B35] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setScanMode('CAMERA')}
                    className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                      scanMode === 'CAMERA' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('UPLOAD')}
                    className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                      scanMode === 'UPLOAD' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Tải Ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('PIN_SEARCH')}
                    className={`px-2.5 py-1 rounded-none transition-all cursor-pointer ${
                      scanMode === 'PIN_SEARCH' ? 'bg-[#C5A880] text-[#0D1117] font-bold shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Nhập PIN
                  </button>
                </div>
              </div>

              {/* Hidden Canvas for QR frame processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* MODE 1: LIVE CAMERA SCANNER */}
              {scanMode === 'CAMERA' && (
                <div className="space-y-3">
                  <div className="relative w-full h-64 bg-[#090D12] border-2 border-dashed border-[#2D3748] rounded-none overflow-hidden flex items-center justify-center shadow-inner">
                    {isCameraActive ? (
                      <>
                        <video
                          ref={videoRef}
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Targeting box */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="relative w-48 h-48 border-2 border-emerald-400/80 rounded-none shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-[bounce_2.2s_infinite]"></div>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 rounded-none text-[9.5px] text-emerald-300 font-mono whitespace-nowrap">
                              Đang quét mã QR khách...
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-2.5 p-4">
                        <div className="w-12 h-12 mx-auto rounded-none bg-[#161D26] border border-[#2D3748] flex items-center justify-center text-[#C5A880]">
                          <CameraOff className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-white text-xs">{t('Camera Tiếp Tân Đang Tắt', 'Reception Camera is Off')}</div>
                          <p className="text-[11px] text-gray-400 max-w-xs">
                            Bật camera để quét trực tiếp mã QR trên điện thoại của khách thăm khi đến sảnh.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none shadow transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" /> Bật Camera Quét Mã
                        </button>
                      </div>
                    )}

                    {isScanning && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center text-white z-20 animate-fadeIn">
                        <div className="text-center space-y-1.5">
                          <RefreshCw className="w-6 h-6 text-[#C5A880] animate-spin mx-auto" />
                          <div className="text-xs font-bold text-[#C5A880]">{t('Đang Đối Chiếu Thông Tin...', 'Matching Visitor Details...')}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div className="p-2.5 bg-rose-950/80 border border-rose-500 rounded-none text-xs text-rose-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {isCameraActive && (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 text-xs font-bold rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CameraOff className="w-3.5 h-3.5" /> Dừng Camera
                    </button>
                  )}
                </div>
              )}

              {/* MODE 2: UPLOAD QR IMAGE */}
              {scanMode === 'UPLOAD' && (
                <div className="space-y-3">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-56 bg-[#090D12] border-2 border-dashed border-[#2D3748] hover:border-[#C5A880] rounded-none flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-none bg-[#161D26] border border-[#2D3748] group-hover:border-[#C5A880] flex items-center justify-center text-[#C5A880] mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-white text-xs">{t('Nhấn Để Tải Ảnh Mã QR Lên', 'Click to Upload QR Code Image')}</div>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                      Hỗ trợ ảnh chụp màn hình thư mời Zalo, Messenger hoặc file ảnh thẻ mời do chủ hộ gửi.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}

              {/* MODE 3: MANUAL PIN / PASS ID SEARCH */}
              <div className="pt-1 border-t border-[#222B35]">
                <label className="text-[11px] text-gray-400 font-medium block mb-1">
                  Nhập Nhanh Mã PIN (6 số) Hoặc Mã Vé Thẻ Khách:
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (pinSearchInput.trim()) {
                      handleVerify(pinSearchInput.trim());
                    }
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={pinSearchInput}
                      onChange={(e) => setPinSearchInput(e.target.value)}
                      placeholder={isEn ? 'e.g. 849201 or SKY-PASS-...' : 'VD: 849201 hoặc SKY-PASS-...'}
                      className="w-full bg-[#161B22] border border-[#2D3748] rounded-none px-3 py-2 text-xs text-white placeholder-gray-500 font-mono focus:border-[#C5A880] outline-none pl-8"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    type="submit"
                    disabled={!pinSearchInput.trim() || isScanning}
                    className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold rounded-none flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" /> Tra Cứu
                  </button>
                </form>
              </div>

              {/* Phím bấm tra cứu nhanh cho khách mẫu */}
              <div className="pt-2 border-t border-[#222B35]/60 text-[11px] space-y-1.5">
                <span className="text-gray-400 block font-mono text-[10.5px]">{t('Thử nhanh với khách thực tế:', 'Quick test with real visitor:')}</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPinSearchInput('849201');
                      handleVerify('849201');
                    }}
                    className="px-2 py-1 bg-[#161D26] hover:bg-[#1E2530] text-[#C5A880] border border-[#2D3748] rounded-none text-[10.5px] cursor-pointer"
                  >
                    PIN 849201 (Căn CH-06 - Tòa BS-07)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinSearchInput('652190');
                      handleVerify('652190');
                    }}
                    className="px-2 py-1 bg-[#161D26] hover:bg-[#1E2530] text-amber-300 border border-[#2D3748] rounded-none text-[10.5px] cursor-pointer"
                  >
                    PIN 652190 (Chờ vào)
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Cột Phải (7/12): Thẻ Khách Thăm Kỹ Thuật Số (Digital Guest Pass) */}
          <div className="lg:col-span-7 space-y-4">
            {scanResult ? (
              <div className="p-5 bg-[#121820] border border-[#2D3748] rounded-none space-y-4 shadow-xl animate-fadeIn">
                
                {/* Status Header Banner */}
                <div className={`p-4 rounded-none border flex items-start justify-between gap-3 ${
                  scanResult.canEnter && scanResult.scanResult === 'VALID'
                    ? scanResult.visitor?.status === 'CHECKED_IN'
                      ? 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                      : 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                    : scanResult.scanResult === 'EXPIRED'
                    ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                    : 'bg-rose-950/70 border-rose-600 text-rose-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {scanResult.canEnter && scanResult.scanResult === 'VALID' ? (
                      scanResult.visitor?.status === 'CHECKED_IN' ? (
                        <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                      )
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-white">{scanResult.title}</div>
                      <div className="text-xs text-gray-300 leading-relaxed">{scanResult.message}</div>
                      <div className="text-[10.5px] text-gray-400 pt-1 font-mono">
                        Quét lúc: {scanResult.scannedAt} • {scanResult.checkpoint}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-none border font-mono ${
                      scanResult.canEnter && scanResult.scanResult === 'VALID'
                        ? scanResult.visitor?.status === 'CHECKED_IN'
                          ? 'bg-amber-900 text-amber-300 border-amber-500'
                          : 'bg-emerald-900 text-emerald-300 border-emerald-500'
                        : 'bg-rose-900 text-rose-300 border-rose-500'
                    }`}>
                      {scanResult.visitor?.status === 'CHECKED_IN'
                        ? 'Đang Ở Trong'
                        : scanResult.scanResult === 'VALID'
                        ? 'Hợp Lệ'
                        : 'Không Hợp Lệ'}
                    </span>
                  </div>
                </div>

                {/* 2 Detailed Panels: Host Info vs Visitor Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* 1. THÔNG TIN CHỦ HỘ BẢO LÃNH */}
                  <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between border-b border-[#222B35] pb-2">
                      <span className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-[#C5A880]" /> Chủ Hộ Bảo Lãnh
                      </span>
                      <span className="text-[9.5px] bg-[#1C2533] px-1.5 py-0.5 rounded-none text-emerald-400 font-mono">
                        Cư Dân Thật
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-gray-400 text-[10.5px]">{isEn ? 'Apartment Host:' : 'Chủ Hộ Căn Hộ:'}</div>
                        <div className="font-bold text-white text-sm">
                          {scanResult.host?.hostName || 'Chưa xác định'}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400 text-[10.5px]">{isEn ? 'Destination Unit:' : 'Căn Hộ Điểm Đến:'}</div>
                        <div className="font-bold text-[#C5A880] text-sm flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{t('Căn', 'Unit')} {scanResult.host?.apartmentCode}</span>
                          <span className="text-xs text-gray-300 font-normal">
                            ({scanResult.host?.towerName})
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400 text-[10.5px]">{isEn ? 'Host Phone:' : 'Số Điện Thoại Chủ Hộ:'}</div>
                        <div className="font-mono text-gray-200 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{scanResult.host?.hostPhone || '0908.888.888'}</span>
                        </div>
                      </div>

                      <div className="pt-1 text-[10.5px] text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t('Tư cách cư trú: Hợp pháp • Đã duyệt e-KYC', 'Residency: Lawful • e-KYC Verified')}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. THÔNG TIN KHÁCH THĂM */}
                  <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between border-b border-[#222B35] pb-2">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" /> Thông Tin Khách Thăm
                      </span>
                      <span className="text-[9.5px] bg-[#1C2533] px-1.5 py-0.5 rounded-none text-cyan-400 font-mono">
                        Khách Vào
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-gray-400 text-[10.5px]">{isEn ? 'Visitor Name:' : 'Họ Tên Khách Thăm:'}</div>
                        <div className="font-bold text-white text-sm">
                          {scanResult.visitor?.visitorName || 'Khách Thăm'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-gray-400 text-[10.5px]">{isEn ? 'Phone Number:' : 'Số Điện Thoại:'}</div>
                          <div className="font-mono text-gray-200">
                            {scanResult.visitor?.phoneNumber || 'Không có SĐT'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-[10.5px]">{isEn ? 'License Plate:' : 'Biển Số Xe:'}</div>
                          <div className="font-mono font-bold text-[#C5A880]">
                            {scanResult.visitor?.licensePlate || 'Đi bộ / Taxi'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400 text-[10.5px]">{isEn ? 'Pass Validity:' : 'Thời Hạn Hiệu Lực Thẻ:'}</div>
                        <div className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>
                            Đến {scanResult.visitor?.validUntil ? new Date(scanResult.visitor.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Hôm nay'}{' '}
                            ({scanResult.visitor?.validHours || 4} giờ)
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10.5px] text-gray-400 font-mono">
                        <span>{isEn ? 'PIN Code:' : 'Mã PIN:'} <strong className="text-[#C5A880] text-xs">{scanResult.visitor?.pinCode}</strong></span>
                        <span>{t('Mã vé:', 'Pass ID:')} {scanResult.visitor?.passId}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Action Operations: Check-in / Check-out */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222B35]">
                  <div className="text-xs text-gray-400">
                    Thao tác tiếp đón tại chốt trực:
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mời khách vào */}
                    {scanResult.canEnter && scanResult.visitor && scanResult.visitor.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(scanResult.visitor!.passId)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" /> Mời Khách Vào Tòa Nhà
                      </button>
                    )}

                    {/* Khách rời tòa nhà */}
                    {scanResult.visitor && scanResult.visitor.status === 'CHECKED_IN' && (
                      <button
                        type="button"
                        onClick={() => handleCheckOut(scanResult.visitor!.passId)}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-none shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Xác Nhận Khách Rời Tòa Nhà
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setScanResult(null);
                        setPinSearchInput('');
                      }}
                      className="px-4 py-2 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 text-xs font-medium rounded-none border border-[#2D3748] transition-colors cursor-pointer"
                    >
                      Tiếp Đón Lượt Mới
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Trạng thái chờ quét */
              <div className="p-8 bg-[#121820] border border-dashed border-[#2D3748] rounded-none flex flex-col items-center justify-center text-center min-h-[380px] space-y-3.5 shadow-inner">
                <div className="w-16 h-16 rounded-none bg-[#161D26] border border-[#2D3748] flex items-center justify-center text-[#C5A880]/70">
                  <QrCode className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="font-serif font-bold text-white text-base">{t('Chưa Có Khách Được Quét', 'No Visitor Scanned Yet')}</div>
                  <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                    Vui lòng đưa mã QR thẻ mời của khách vào camera bên trái hoặc nhập mã PIN 6 số. Thông tin đối chiếu của chủ hộ và khách thăm sẽ hiển thị lập tức tại đây.
                  </p>
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Kiểm soát an ninh tự động • Bảo mật thông tin cư dân Skyline
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </>
  );
}
