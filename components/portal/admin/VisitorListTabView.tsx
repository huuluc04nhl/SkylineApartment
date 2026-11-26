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


export default function VisitorListTabView({ ctx }: { ctx: any }) {
  const { t, isEn, isValidPhoneNumber, getPhoneValidationError, activeTab, setActiveTabState, selectedCheckpoint, setSelectedCheckpoint, viewLayout, setViewLayout, scanMode, setScanMode, isCameraActive, setIsCameraActive, cameraError, setCameraError, isScanning, setIsScanning, pinSearchInput, setPinSearchInput, scanResult, setScanResult, actionFeedback, setActionFeedback, passesList, setPassesList, filterStatus, setFilterStatus, tableSearch, setTableSearch, auditLogs, setAuditLogs, deleteModalConfig, setDeleteModalConfig, logSearch, setLogSearch, isQuickPassModalOpen, setIsQuickPassModalOpen, selectedPassForDetail, setSelectedPassForDetail, detailQrDataUrl, setDetailQrDataUrl, newPassApt, setNewPassApt, newPassVisitorName, setNewPassVisitorName, newPassVisitorPhone, setNewPassVisitorPhone, newPassPlate, setNewPassPlate, newPassHours, setNewPassHours, newPassNote, setNewPassNote, createdQuickPass, setCreatedQuickPass, createdQrUrl, setCreatedQrUrl, setActiveTab, apartments, videoRef, canvasRef, fileInputRef, animationFrameId, refreshData, showFeedback, handleVerify, handleCheckIn, handleCheckOut, handleDeletePass, handleClearAllData, scanVideoFrame, startCamera, stopCamera, handleImageUpload, openPassDetail, handleCreateQuickPass, resetQuickPassForm, totalPasses, inBuildingCount, pendingCount, completedCount, expiredCount, filteredPasses, filteredLogs, visitorResource } = ctx;
  return (
    <>
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          
          {/* Thanh công cụ lọc & tìm kiếm */}
          <div className="p-3.5 bg-[#121820] border border-[#222B35] rounded-none flex flex-wrap items-center justify-between gap-3">
            {/* Bộ lọc tình trạng */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-mono text-[11px] mr-1">{isEn ? 'Filter:' : 'Lọc:'}</span>
              {[
                { id: 'ALL', label: `Tất Cả (${totalPasses})` },
                { id: 'CHECKED_IN', label: `🟢 Đang Ở Trong (${inBuildingCount})` },
                { id: 'ACTIVE', label: `🟡 Chờ Khách Đến (${pendingCount})` },
                { id: 'COMPLETED', label: `⚪ Đã Rời Đi (${completedCount})` },
                { id: 'EXPIRED', label: `🔴 Quá Hạn (${expiredCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-[#1C2533] text-[#C5A880] border border-[#C5A880] shadow font-bold'
                      : 'text-gray-400 hover:text-white bg-[#161B22]/60 hover:bg-[#161B22] border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Ô tìm kiếm thông minh */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#C5A880] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder={isEn ? 'Search visitor, PIN, apt CH-06, plate...' : 'Tìm tên khách, PIN, căn CH-06, biển số...'}
                className="w-full bg-[#161B22] border border-[#2D3748] pl-9 pr-8 py-1.5 text-xs text-white placeholder-gray-500 rounded-none focus:border-[#C5A880] outline-none"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* DẠNG 1: DẠNG BẢNG CHI TIẾT (TABLE VIEW) */}
          {viewLayout === 'TABLE' && (
            <div className="p-4 bg-[#121820] border border-[#222B35] rounded-none shadow-xl overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#161D26] text-gray-400 uppercase text-[10px] tracking-wider border-y border-[#222B35]">
                  <tr>
                    <th className="py-3 px-3">{t('Mã Vé & PIN', 'Pass Code & PIN')}</th>
                    <th className="py-3 px-3">{t('Khách Thăm', 'Visitor')}</th>
                    <th className="py-3 px-3">{t('Chủ Hộ Bảo Lãnh', 'Sponsoring Host')}</th>
                    <th className="py-3 px-3">{t('Căn Hộ', 'Apartment')}</th>
                    <th className="py-3 px-3">{t('Thời Hạn Hiệu Lực', 'Validity Period')}</th>
                    <th className="py-3 px-3">{t('Trạng Thái', 'Status')}</th>
                    <th className="py-3 px-3 text-right">{t('Thao Tác Tiếp Đón', 'Reception Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222B35]">
                  {filteredPasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                        <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <div>{t('Không có khách thăm nào phù hợp với bộ lọc hiện tại.', 'No visitors match the current filter.')}</div>
                        <button
                          type="button"
                          onClick={() => { setFilterStatus('ALL'); setTableSearch(''); }}
                          className="mt-2 text-xs text-[#C5A880] underline cursor-pointer"
                        >
                          Xóa bộ lọc để xem toàn bộ khách
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredPasses.map((pass: any) => (
                      <tr key={pass.id} className="hover:bg-[#161B22]/80 transition-colors">
                        {/* Mã vé & PIN */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-white">{pass.id}</div>
                          <div className="text-[10.5px] text-gray-400 font-mono">
                            PIN: <strong className="text-[#C5A880] tracking-wider">{pass.pinCode}</strong>
                          </div>
                        </td>

                        {/* Khách thăm */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs">{pass.visitorName}</div>
                          <div className="text-[10.5px] text-gray-400 flex items-center gap-1">
                            {pass.phoneNumber ? (
                              <span>{pass.phoneNumber}</span>
                            ) : (
                              <span className="text-gray-500">{isEn ? 'No phone' : 'Chưa có SĐT'}</span>
                            )}
                            {pass.licensePlate && (
                              <span className="text-[#C5A880] font-mono">• Xe: {pass.licensePlate}</span>
                            )}
                          </div>
                        </td>

                        {/* Chủ hộ bảo lãnh */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-white">{pass.hostName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {pass.hostPhone || 'Chủ hộ bảo lãnh'}
                          </div>
                        </td>

                        {/* Căn hộ */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-[#1C2533] border border-[#2D3748] rounded-none text-[#C5A880] font-bold font-mono">
                            Căn {pass.apartmentCode}
                          </span>
                        </td>

                        {/* Thời hạn hiệu lực */}
                        <td className="py-3 px-3 text-[11px]">
                          <div className="text-gray-200">
                            Đến {new Date(pass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(pass.validUntil).toLocaleDateString('vi-VN')} ({pass.validHours}h)
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3 px-3">
                          {pass.status === 'CHECKED_IN' ? (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10.5px] font-bold inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Đang Ở Trong
                            </span>
                          ) : pass.status === 'ACTIVE' ? (
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 text-[10.5px] font-bold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" /> Chờ Khách Đến
                            </span>
                          ) : pass.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 bg-gray-800 text-gray-300 border border-gray-600 text-[10.5px] font-medium">
                              Đã Rời Đi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-600 text-[10.5px] font-bold">
                              Quá Hạn
                            </span>
                          )}
                        </td>

                        {/* Thao tác 1-chạm */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pass.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleCheckIn(pass.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none text-[11px] shadow transition-colors cursor-pointer flex items-center gap-1"
                                title={isEn ? 'Check-in visitor' : 'Đón tiếp và mời khách vào'}
                              >
                                <LogIn className="w-3 h-3" /> Mời Vào
                              </button>
                            )}

                            {pass.status === 'CHECKED_IN' && (
                              <button
                                type="button"
                                onClick={() => handleCheckOut(pass.id)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-none text-[11px] shadow transition-colors cursor-pointer flex items-center gap-1"
                                title={isEn ? 'Record visitor departure' : 'Ghi nhận khách rời tòa nhà'}
                              >
                                <LogOut className="w-3 h-3" /> Rời Đi
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openPassDetail(pass)}
                              className="px-2.5 py-1 bg-[#161B22] hover:bg-[#1E2530] text-gray-300 hover:text-white border border-[#2D3748] rounded-none text-[11px] transition-colors cursor-pointer"
                              title={isEn ? 'View pass details and QR code' : 'Xem chi tiết thẻ và mã QR'}
                            >
                              Thẻ QR
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePass(pass)}
                              className="p-1 hover:bg-rose-950/60 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title={isEn ? 'Cancel visitor pass' : 'Hủy thẻ khách'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* DẠNG 2: DẠNG THẺ HỒ SƠ TRỰC QUAN (GRID CARDS VIEW) */}
          {viewLayout === 'CARDS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPasses.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400 bg-[#121820] border border-[#222B35] p-6">
                  <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <div>{t('Không có khách thăm nào phù hợp với bộ lọc hiện tại.', 'No visitors match the current filter.')}</div>
                </div>
              ) : (
                filteredPasses.map((pass: any) => (
                  <div
                    key={pass.id}
                    className={`p-4 bg-[#121820] border rounded-none shadow-xl flex flex-col justify-between space-y-3 transition-all ${
                      pass.status === 'CHECKED_IN'
                        ? 'border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : pass.status === 'ACTIVE'
                        ? 'border-amber-500/60'
                        : 'border-[#222B35]'
                    }`}
                  >
                    <div>
                      {/* Card Header: Căn Hộ & Badge Trạng Thái */}
                      <div className="flex items-center justify-between border-b border-[#222B35] pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#1C2533] border border-[#2D3748] text-[#C5A880] font-bold font-mono text-xs">
                            Căn {pass.apartmentCode}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {pass.towerName || 'Chung Cư Skyline'}
                          </span>
                        </div>

                        <div>
                          {pass.status === 'CHECKED_IN' ? (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500 text-[9.5px] font-bold">
                              Đang Ở Trong
                            </span>
                          ) : pass.status === 'ACTIVE' ? (
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500 text-[9.5px] font-bold">
                              Chờ Khách Đến
                            </span>
                          ) : pass.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 bg-gray-800 text-gray-300 border border-gray-600 text-[9.5px] font-medium">
                              Đã Rời Đi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-600 text-[9.5px] font-bold">
                              Quá Hạn
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Khách Thăm & Chủ Hộ */}
                      <div className="pt-2.5 space-y-1.5 text-xs">
                        <div>
                          <div className="text-gray-400 text-[10.5px]">{isEn ? 'Visitor:' : 'Khách Thăm:'}</div>
                          <div className="font-bold text-white text-sm">{pass.visitorName}</div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1">
                            <span>{pass.phoneNumber || t('Không có SĐT', 'No phone')}</span>
                            {pass.licensePlate && (
                              <span className="text-[#C5A880] font-mono">• {pass.licensePlate}</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-1">
                          <div className="text-gray-400 text-[10.5px]">{isEn ? 'Host Resident:' : 'Chủ Hộ Bảo Lãnh:'}</div>
                          <div className="font-medium text-gray-200">{pass.hostName}</div>
                          <div className="text-[10.5px] text-gray-400 font-mono">{pass.hostPhone}</div>
                        </div>

                        {/* PIN & Thời Hạn */}
                        <div className="pt-2 p-2 bg-[#161D26] border border-[#222B35] flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-gray-400 text-[10px] block">{t('MÃ PIN:', 'PIN CODE:')}</span>
                            <span className="font-mono font-bold text-[#C5A880] text-sm tracking-wider">{pass.pinCode}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-400 text-[10px] block">{t('HIỆU LỰC:', 'VALID UNTIL:')}</span>
                            <span className="text-emerald-300 font-mono text-[10.5px]">
                              Đến {new Date(pass.validUntil).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thao tác Card footer */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#222B35]">
                      <button
                        type="button"
                        onClick={() => openPassDetail(pass)}
                        className="text-xs text-[#C5A880] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Xem Thẻ &amp; QR
                      </button>

                      <div className="flex items-center gap-1.5">
                        {pass.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(pass.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow cursor-pointer flex items-center gap-1"
                          >
                            <LogIn className="w-3.5 h-3.5" /> Mời Vào
                          </button>
                        )}

                        {pass.status === 'CHECKED_IN' && (
                          <button
                            type="button"
                            onClick={() => handleCheckOut(pass.id)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow cursor-pointer flex items-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Rời Đi
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}
    </>
  );
}
