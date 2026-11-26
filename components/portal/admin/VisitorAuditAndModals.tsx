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
import type {
  VerificationScanResult,
  GeneratedVisitorPass,
  GateAuditLog,
  VisitorPassStatus,
} from '@/lib/visitorStore';
import { getApartmentUnits } from '@/lib/apartmentStore';
import { cleanPhoneNumber, isValidPhoneNumber, getPhoneValidationError } from '@/lib/validationUtils';
import { useLanguage } from '@/lib/languageContext';
import ConfirmDeleteModal from '@/components/portal/shared/ConfirmDeleteModal';

export type VisitorTab = 'LIST' | 'SCANNER' | 'AUDIT_LOGS';


export default function VisitorAuditAndModals({ ctx }: { ctx: any }) {
  const { t, isEn, isValidPhoneNumber, getPhoneValidationError, activeTab, setActiveTabState, selectedCheckpoint, setSelectedCheckpoint, viewLayout, setViewLayout, scanMode, setScanMode, isCameraActive, setIsCameraActive, cameraError, setCameraError, isScanning, setIsScanning, pinSearchInput, setPinSearchInput, scanResult, setScanResult, actionFeedback, setActionFeedback, passesList, setPassesList, filterStatus, setFilterStatus, tableSearch, setTableSearch, auditLogs, setAuditLogs, deleteModalConfig, setDeleteModalConfig, logSearch, setLogSearch, isQuickPassModalOpen, setIsQuickPassModalOpen, selectedPassForDetail, setSelectedPassForDetail, detailQrDataUrl, setDetailQrDataUrl, newPassApt, setNewPassApt, newPassVisitorName, setNewPassVisitorName, newPassVisitorPhone, setNewPassVisitorPhone, newPassPlate, setNewPassPlate, newPassHours, setNewPassHours, newPassNote, setNewPassNote, createdQuickPass, setCreatedQuickPass, createdQrUrl, setCreatedQrUrl, setActiveTab, apartments, videoRef, canvasRef, fileInputRef, animationFrameId, refreshData, showFeedback, handleVerify, handleCheckIn, handleCheckOut, handleDeletePass, handleClearAllData, scanVideoFrame, startCamera, stopCamera, handleImageUpload, openPassDetail, handleCreateQuickPass, resetQuickPassForm, totalPasses, inBuildingCount, pendingCount, completedCount, expiredCount, filteredPasses, filteredLogs, visitorResource } = ctx;
  return (
    <>
      {activeTab === 'AUDIT_LOGS' && (
        <div className="p-5 bg-[#121820] border border-[#222B35] rounded-none space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222B35] pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                Lịch Sử Đón Tiếp Khách Thăm Tòa Nhà
              </h3>
              <div className="text-[11px] text-gray-400">
                Ghi nhận tự động theo thời gian thực các lượt xác thực và đón tiếp khách thăm của cư dân.
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder={isEn ? 'Search visitor, unit, note...' : 'Tìm tên khách, căn hộ, ghi chú...'}
                className="w-full bg-[#161B22] border border-[#2D3748] pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 rounded-none focus:border-[#C5A880] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#161D26] text-gray-400 uppercase text-[10px] tracking-wider border-y border-[#222B35]">
                <tr>
                  <th className="py-3 px-3">{isEn ? 'Time' : 'Thời Gian'}</th>
                  <th className="py-3 px-3">{isEn ? 'Apartment & Host' : 'Căn Hộ & Chủ Hộ'}</th>
                  <th className="py-3 px-3">{t('Khách Thăm', 'Visitor')}</th>
                  <th className="py-3 px-3">{isEn ? 'Action' : 'Hành Động'}</th>
                  <th className="py-3 px-3">{isEn ? 'Result' : 'Kết Quả'}</th>
                  <th className="py-3 px-3">{isEn ? 'Log Details' : 'Chi Tiết Ghi Nhận'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222B35]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                      Không tìm thấy bản ghi nhật ký nào.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-[#161B22]/70 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-300 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#C5A880]">{t('Căn', 'Unit')} {log.apartmentCode}</span>
                        {log.hostName && <div className="text-[10px] text-gray-400">{log.hostName}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-xs">{log.visitorName || t('Vãng lai', 'Walk-in visitor')}</div>
                        {log.licensePlate && <div className="text-[10px] text-[#C5A880] font-mono">Xe: {log.licensePlate}</div>}
                      </td>
                      <td className="py-3 px-3">
                        {log.action === 'CHECK_IN' ? (
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-bold">
                            VÀO TÒA NHÀ
                          </span>
                        ) : log.action === 'CHECK_OUT' ? (
                          <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-600 text-[10px] font-bold">
                            RỜI TÒA NHÀ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-600 text-[10px] font-medium">
                            QUÉT XÁC THỰC
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-mono font-bold">
                          {log.result}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-gray-300 max-w-xs truncate">
                        {log.note}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: CẤP THẺ KHÁCH NHANH TẠI QUẦY (QUICK PASS MODAL)       */}
      {/* ============================================================= */}
      {isQuickPassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#0D1117] border border-[#C5A880] text-white shadow-2xl p-6 rounded-none space-y-4 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Cấp Thẻ Đón Khách Nhanh Tại Quầy
                </h3>
              </div>
              <button
                type="button"
                onClick={resetQuickPassForm}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!createdQuickPass ? (
              <form onSubmit={handleCreateQuickPass} className="space-y-4 text-xs">
                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Căn Hộ Điểm Đến:
                  </label>
                  <select
                    value={newPassApt}
                    onChange={(e) => setNewPassApt(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-bold p-2.5 outline-none"
                  >
                    <option value="CH-06">{isEn ? 'Apt CH-06 - Tower BS-07 (Host: Tran Huu Luc - Floor 30)' : 'Căn CH-06 - Tòa BS-07 (Chủ hộ: Trần Hữu Lực - Tầng 30)'}</option>
                    <option value="CH-01">{isEn ? 'Apt CH-01 - Tower BS-07 (Corner 2BR - Floor 30)' : 'Căn CH-01 - Tòa BS-07 (Căn hộ góc 2PN - Tầng 30)'}</option>
                    <option value="CH-08">{isEn ? 'Apt CH-08 - Tower BS-07 (1BR+ Multi-use - Floor 30)' : 'Căn CH-08 - Tòa BS-07 (Căn hộ 1PN+ Đa Năng - Tầng 30)'}</option>
                    {apartments.filter((u: any) => u.code !== 'CH-06' && u.code !== 'CH-01' && u.code !== 'CH-08').slice(0, 15).map((u: any) => (
                      <option key={u.code} value={u.code}>
                        Căn {u.code} (Tầng {u.floor})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Họ Tên Khách Thăm <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={newPassVisitorName}
                      onChange={(e) => setNewPassVisitorName(e.target.value)}
                      placeholder={isEn ? 'e.g. Nguyen Van An' : 'VD: Nguyễn Văn An'}
                      className="w-full bg-[#161B22] border border-[#2D3748] text-white p-2.5 outline-none focus:border-[#C5A880]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Số Điện Thoại Khách (10 số):
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={newPassVisitorPhone}
                      onChange={(e) => setNewPassVisitorPhone(cleanPhoneNumber(e.target.value))}
                      placeholder="VD: 0912345678"
                      className="w-full bg-[#161B22] border border-[#2D3748] text-white p-2.5 outline-none focus:border-[#C5A880] font-mono"
                    />
                    {newPassVisitorPhone && !isValidPhoneNumber(newPassVisitorPhone) && (
                      <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                        {getPhoneValidationError(newPassVisitorPhone)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Biển Số Xe (Nếu có):
                    </label>
                    <input
                      type="text"
                      value={newPassPlate}
                      onChange={(e) => setNewPassPlate(e.target.value)}
                      placeholder={isEn ? 'e.g. 51G-123.45 or leave blank' : 'VD: 51G-123.45 hoặc để trống'}
                      className="w-full bg-[#161B22] border border-[#2D3748] text-[#C5A880] font-mono uppercase p-2.5 outline-none focus:border-[#C5A880]"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-medium block mb-1">
                      Thời Gian Hiệu Lực:
                    </label>
                    <select
                      value={newPassHours}
                      onChange={(e) => setNewPassHours(e.target.value)}
                      className="w-full bg-[#161B22] border border-[#2D3748] text-white p-2.5 outline-none"
                    >
                      <option value="2">2 {t('Giờ (Giao nhận nhanh)', 'Hours (Quick Delivery)')}</option>
                      <option value="4">4 {t('Giờ (Thăm gia đình tiêu chuẩn)', 'Hours (Standard Family Visit)')}</option>
                      <option value="8">8 {t('Giờ (Làm việc / Sửa chữa)', 'Hours (Working / Repair)')}</option>
                      <option value="24">24 {t('Giờ (Trong ngày)', 'Hours (Same Day)')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 font-medium block mb-1">
                    Ghi Chú Tiếp Đón:
                  </label>
                  <input
                    type="text"
                    value={newPassNote}
                    onChange={(e) => setNewPassNote(e.target.value)}
                    placeholder={isEn ? 'e.g. Guest meeting host...' : 'VD: Khách lên bàn việc với chủ hộ...'}
                    className="w-full bg-[#161B22] border border-[#2D3748] text-white p-2.5 outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-[#222B35]">
                  <button
                    type="button"
                    onClick={resetQuickPassForm}
                    className="px-4 py-2 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 text-xs font-medium border border-[#2D3748] cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold shadow cursor-pointer"
                  >
                    Tạo & Kích Hoạt Thẻ Khách
                  </button>
                </div>
              </form>
            ) : (
              /* Thẻ sau khi tạo thành công */
              <div className="space-y-4 text-center animate-fadeIn">
                <div className="p-3 bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{t('Đã cấp thẻ khách thăm thành công!', 'Visitor pass issued successfully!')}</span>
                </div>

                <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none flex flex-col items-center space-y-3">
                  {createdQrUrl && (
                    <img src={createdQrUrl} alt={isEn ? 'Visitor QR Code' : 'Mã QR Khách'} className="w-44 h-44 border-4 border-white shadow-lg" />
                  )}
                  <div className="text-center space-y-1">
                    <div className="text-xs text-gray-400">{t('MÃ PIN BÀN PHÍM CỬA / THANG MÁY:', 'DOOR / ELEVATOR KEYPAD PIN:')}</div>
                    <div className="text-2xl font-mono font-extrabold text-[#C5A880] tracking-widest bg-[#121820] px-4 py-1 border border-[#2D3748]">
                      {createdQuickPass.pinCode}
                    </div>
                  </div>

                  <div className="text-xs text-gray-300 text-center space-y-0.5">
                    <div>{isEn ? 'Visitor:' : 'Khách:'} <strong className="text-white">{createdQuickPass.visitorName}</strong> • {isEn ? 'Unit:' : 'Căn:'} <strong className="text-[#C5A880]">{createdQuickPass.apartmentCode}</strong></div>
                    <div className="text-[11px] text-gray-400">{t('Chủ hộ:', 'Host:')} {createdQuickPass.hostName}</div>
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleCheckIn(createdQuickPass.id);
                      resetQuickPassForm();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Mời Vào Ngay
                  </button>
                  <button
                    type="button"
                    onClick={resetQuickPassForm}
                    className="px-4 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold shadow cursor-pointer"
                  >
                    Hoàn Tất
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: XEM CHI TIẾT THẺ KHÁCH & MÃ QR (DETAIL MODAL)         */}
      {/* ============================================================= */}
      {selectedPassForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0D1117] border border-[#C5A880] text-white shadow-2xl p-6 rounded-none space-y-4 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-[#222B35] pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-base font-bold text-white">
                  Thẻ Khách Thăm Kỹ Thuật Số
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPassForDetail(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#161D26] border border-[#2D3748] rounded-none flex flex-col items-center space-y-3">
              {detailQrDataUrl && (
                <img src={detailQrDataUrl} alt={isEn ? 'QR Code' : 'Mã QR'} className="w-48 h-48 border-4 border-white shadow-lg" />
              )}
              
              <div className="text-center space-y-1 w-full">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-mono">{t('Mã PIN 6 Số Tra Cứu:', '6-Digit Search PIN:')}</span>
                <div className="text-2xl font-mono font-extrabold text-[#C5A880] tracking-widest bg-[#121820] py-1 border border-[#2D3748]">
                  {selectedPassForDetail.pinCode}
                </div>
                <div className="text-[10.5px] text-gray-400 font-mono">{t('Mã vé:', 'Pass ID:')} {selectedPassForDetail.id}</div>
              </div>
            </div>

            {/* Thông tin đối chiếu */}
            <div className="p-3 bg-[#121820] border border-[#222B35] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">{isEn ? 'Visitor:' : 'Khách Thăm:'}</span>
                <span className="font-bold text-white">{selectedPassForDetail.visitorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isEn ? 'Phone:' : 'Số Điện Thoại:'}</span>
                <span className="font-mono text-gray-200">{selectedPassForDetail.phoneNumber || t('Không có', 'None')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isEn ? 'License Plate:' : 'Biển Số Xe:'}</span>
                <span className="font-mono text-[#C5A880]">{selectedPassForDetail.licensePlate || t('Đi bộ / Taxi', 'Pedestrian / Taxi')}</span>
              </div>
              <div className="flex justify-between border-t border-[#222B35] pt-1.5">
                <span className="text-gray-400">{isEn ? 'Destination Unit:' : 'Căn Hộ Điểm Đến:'}</span>
                <span className="font-bold text-[#C5A880]">{t('Căn', 'Unit')} {selectedPassForDetail.apartmentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isEn ? 'Host Resident:' : 'Chủ Hộ Bảo Lãnh:'}</span>
                <span className="text-white">{selectedPassForDetail.hostName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isEn ? 'Validity:' : 'Thời Hạn:'}</span>
                <span className="text-emerald-400 font-mono">
                  Đến {new Date(selectedPassForDetail.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(selectedPassForDetail.validUntil).toLocaleDateString('vi-VN')})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isEn ? 'Status:' : 'Trạng Thái:'}</span>
                <span className="font-bold text-amber-400">{selectedPassForDetail.status}</span>
              </div>
            </div>

            {/* Thao tác trong Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#222B35]">
              <button
                type="button"
                onClick={() => handleDeletePass(selectedPassForDetail)}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 text-xs font-semibold cursor-pointer"
              >
                Hủy Thẻ
              </button>

              <div className="flex items-center gap-2">
                {selectedPassForDetail.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handleCheckIn(selectedPassForDetail.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Mời Khách Vào
                  </button>
                )}
                {selectedPassForDetail.status === 'CHECKED_IN' && (
                  <button
                    type="button"
                    onClick={() => handleCheckOut(selectedPassForDetail.id)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Khách Rời Đi
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPassForDetail(null)}
                  className="px-3.5 py-1.5 bg-[#161B22] text-gray-300 border border-[#2D3748] text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
