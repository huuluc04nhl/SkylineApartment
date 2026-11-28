'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, ShieldCheck, X, RefreshCw, Zap, Droplets, Info } from 'lucide-react';

interface MeterOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MeterOcrModal({ isOpen, onClose, onSuccess }: MeterOcrModalProps) {
  useEscapeKey(isOpen, onClose);
  const [aptCode, setAptCode] = useState('');
  const [meterType, setMeterType] = useState<'ELECTRIC' | 'WATER'>('ELECTRIC');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OCR result state
  const [ocrResult, setOcrResult] = useState<{
    reading: number;
    confidence: number;
    notes: string;
    previous_reading?: number;
    consumption_estimate?: number;
    needs_confirmation: boolean;
  } | null>(null);

  // Form editable reading
  const [editReading, setEditReading] = useState<number | ''>('');
  const [isHumanConfirmed, setIsHumanConfirmed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp định dạng hình ảnh (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setOcrResult(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async () => {
    if (!imagePreview) {
      setErrorMsg('Vui lòng tải lên ảnh chụp mặt đồng hồ trước.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/billing/meter-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagePreview,
          apt_code: aptCode,
          meter_type_hint: meterType,
          period: '2026-09'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể trích xuất chỉ số từ ảnh');
      }

      setOcrResult(data.data);
      setEditReading(data.data.reading);
      setIsHumanConfirmed(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReading = async () => {
    if (!ocrResult || editReading === '') return;

    if (ocrResult.confidence < 0.85 && !isHumanConfirmed) {
      setErrorMsg('Độ tin cậy dưới 85%. Bắt buộc bạn phải tích vào ô xác nhận đã đối chiếu số trên ảnh trước khi lưu!');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/billing/meter-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          apartment_code: aptCode,
          meter_type: ocrResult.confidence < 0.85 ? meterType : ocrResult.confidence > 0 ? meterType : 'ELECTRIC',
          reading: Number(editReading),
          confidence: ocrResult.confidence,
          source: Number(editReading) === ocrResult.reading ? 'ocr' : 'manual',
          period: '2026-09',
          is_confirmed: isHumanConfirmed,
          image_url: imagePreview?.slice(0, 50) + '...'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi ghi nhận chỉ số vào cơ sở dữ liệu');
      }

      setSuccessMsg(data.message || 'Đã lưu chỉ số thành công!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu dữ liệu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0E131B] border border-[#C5A880]/50 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#C5A880]/10 border border-[#C5A880]/40 text-[#C5A880]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-serif uppercase tracking-wide">
                Nhập Chỉ Số Đồng Hồ Bằng AI Vision
              </h2>
              <p className="text-xs text-gray-400">
                Chụp hoặc upload ảnh đồng hồ điện/nước • AI OCR tự động trích xuất & kiểm định độ tin cậy
              </p>
            </div>
          </div>
          <button aria-label="Đóng"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1E2530] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5">
          {/* Controls: Căn hộ & Loại đồng hồ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                Căn Hộ Ghi Nhận
              </label>
              <select
                value={aptCode}
                onChange={(e) => setAptCode(e.target.value)}
                className="w-full bg-[#161D26] border border-[#2A3441] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A880]"
              >
                <option value="CH-06">CH-06 (BS-08 Tầng 12)</option>
                <option value="BS08-1204">BS08-1204 (Tòa BS-08)</option>
                <option value="BS07-0801">BS07-0801 (Tòa BS-07)</option>
                <option value="BS09-1502">BS09-1502 (Tòa BS-09)</option>
                <option value="BS10-2101">BS10-2101 (Tòa BS-10)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                Loại Chỉ Số Đồng Hồ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeterType('ELECTRIC')}
                  className={`py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    meterType === 'ELECTRIC'
                      ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                      : 'bg-[#161D26] border-[#2A3441] text-gray-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Điện (kWh)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMeterType('WATER')}
                  className={`py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    meterType === 'WATER'
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                      : 'bg-[#161D26] border-[#2A3441] text-gray-400 hover:text-white'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nước (m³)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upload Box */}
          <div className="border border-dashed border-[#2A3441] p-4 text-center bg-[#131922]">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative max-h-52 overflow-hidden mx-auto border border-[#2A3441] inline-block">
                  <img
                    src={imagePreview}
                    alt="Meter preview"
                    className="max-h-52 object-contain"
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#1C2533] hover:bg-[#253042] text-xs font-semibold text-gray-300 border border-[#2D3A4D]"
                  >
                    Chọn Ảnh Khác
                  </button>
                  <button
                    type="button"
                    onClick={handleRunOcr}
                    disabled={isAnalyzing}
                    className="px-4 py-1.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Đang Phân Tích...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Quét Chỉ Số Bằng AI Vision</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-8 cursor-pointer hover:bg-[#18212D] transition-colors"
              >
                <Upload className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                <p className="text-xs text-gray-300 font-semibold">
                  Bấm để tải ảnh đồng hồ điện/nước từ thiết bị
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Hỗ trợ định dạng JPG, PNG, ảnh chụp thực địa từ camera điện thoại
                </p>
              </div>
            )}
          </div>

          {/* OCR Result View */}
          {ocrResult && (
            <div className="p-4 bg-[#141B24] border border-[#253042] space-y-4">
              <div className="flex items-center justify-between border-b border-[#222B35] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase text-[#C5A880]">
                    Kết Quả Nhận Dạng AI
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                    ocrResult.confidence >= 0.85
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/50'
                  }`}>
                    Độ Tin Cậy: {(ocrResult.confidence * 100).toFixed(0)}%
                    {ocrResult.confidence >= 0.85 ? ' (Tin Cậy Cao)' : ' (Cần Xác Nhận)'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  Kỳ trước: {ocrResult.previous_reading !== undefined ? `${ocrResult.previous_reading} ${meterType === 'ELECTRIC' ? 'kWh' : 'm³'}` : 'Chưa có'}
                </div>
              </div>

              {/* Confidence Alert if < 0.85 */}
              {ocrResult.confidence < 0.85 && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">
                      Quy Tắc An Toàn: Độ tin cậy dưới 85% ({ (ocrResult.confidence * 100).toFixed(0) }%)
                    </div>
                    <div className="text-[11px] text-amber-300/90 leading-relaxed">
                      Ảnh chụp có thể bị chói sáng hoặc góc chụp nghiêng. Bắt buộc người quản trị phải kiểm tra lại số thực tế trên ảnh, chỉnh sửa nếu cần và tích vào ô xác nhận trước khi lưu vào hệ thống.
                    </div>
                  </div>
                </div>
              )}

              {/* Form Input for Reading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                    Chỉ Số Ghi Nhận ({meterType === 'ELECTRIC' ? 'kWh' : 'm³'}):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editReading}
                    onChange={(e) => setEditReading(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-[#2D3A4D] px-3 py-2 text-base font-mono font-bold text-amber-400 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <div className="text-[11px] font-mono uppercase text-gray-400 mb-1">
                    Ước Tính Sản Lượng Tiêu Thụ:
                  </div>
                  <div className="p-2 bg-[#0D1117] border border-[#222B35] text-xs font-mono">
                    {ocrResult.previous_reading !== undefined && editReading !== '' ? (
                      <span className="font-bold text-emerald-400">
                        +{Number((Number(editReading) - ocrResult.previous_reading).toFixed(1))} {meterType === 'ELECTRIC' ? 'kWh' : 'm³'}
                      </span>
                    ) : (
                      <span className="text-gray-500">Kỳ khởi tạo đầu tiên</span>
                    )}
                  </div>
                </div>
              </div>

              {ocrResult.notes && (
                <div className="text-[11px] text-gray-400 italic flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                  <span>Diễn giải AI: {ocrResult.notes}</span>
                </div>
              )}

              {/* Checkbox confirmation required if confidence < 0.85 */}
              {ocrResult.confidence < 0.85 && (
                <div className="pt-2 border-t border-[#222B35]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isHumanConfirmed}
                      onChange={(e) => setIsHumanConfirmed(e.target.checked)}
                      className="w-4 h-4 accent-[#C5A880] rounded-none cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-white">
                      Tôi đã đối chiếu số trên ảnh và xác nhận chỉ số này là chính xác
                    </span>
                  </label>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveReading}
                  disabled={isSaving || (ocrResult.confidence < 0.85 && !isHumanConfirmed)}
                  className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    ocrResult.confidence < 0.85 && !isHumanConfirmed
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      : 'bg-[#C5A880] hover:bg-white text-[#0D1117] cursor-pointer shadow-lg'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang Lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác Nhận & Lưu Vào Hệ Thống</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#222B35] flex items-center justify-between text-[11px] text-gray-500">
          <div>
            Tuân thủ Tiêu chuẩn BQL: Confidence &lt; 0.85 bắt buộc duyệt thủ công
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-[#2D3A4D] hover:border-gray-500 text-gray-300 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

