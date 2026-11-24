'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  itemCode?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemCode,
  itemName,
  confirmText,
  cancelText,
  isDanger = true,
}: ConfirmDeleteModalProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayTitle = title || t('Xác nhận xóa dữ liệu', 'Confirm Data Deletion');
  const displayMessage = message || t('Hành động này không thể hoàn tác. Dữ liệu sẽ được xóa vĩnh viễn khỏi hệ thống.', 'This action cannot be undone. Data will be permanently removed from the system.');
  const displayConfirmText = confirmText || t('Xác Nhận Xóa', 'Confirm Delete');
  const displayCancelText = cancelText || t('Hủy Bỏ', 'Cancel');

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleConfirmClick = async () => {
    try {
      setIsSubmitting(true);
      await Promise.resolve(onConfirm());
      onClose();
    } catch (err) {
      console.error('Error in ConfirmDeleteModal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div 
        className="w-full max-w-md bg-[#0E131B] border border-[#2D3748] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] rounded-none flex flex-col overflow-hidden text-gray-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Top Gold / Danger Architectural Accent Stripe */}
        <div 
          className={`h-1 w-full ${
            isDanger ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500' : 'bg-gradient-to-r from-[#C5A880] via-[#E2C9A5] to-[#C5A880]'
          }`} 
        />

        {/* Header */}
        <div className="px-5 py-4 bg-[#141B24] border-b border-[#222B35] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={`w-9 h-9 rounded-none flex items-center justify-center border shrink-0 ${
                isDanger 
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-400' 
                  : 'bg-amber-950/60 border-amber-500/50 text-amber-400'
              }`}
            >
              {isDanger ? <Trash2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="font-serif font-bold text-white text-base leading-tight">
                {displayTitle}
              </h3>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-0.5">
                Skyline Smart Residence Security Protocol
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-none text-gray-400 hover:text-white hover:bg-[#222B35] transition-colors disabled:opacity-50 cursor-pointer"
            aria-label={t('Đóng', 'Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 bg-[#0A0E14]">
          <p className="text-xs text-gray-300 leading-relaxed">
            {displayMessage}
          </p>

          {(itemCode || itemName) && (
            <div className="p-3 bg-[#141B24] border border-[#222B35] rounded-none space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                {t('Mục xác nhận xử lý:', 'Target item:')}
              </span>
              <div className="flex items-center gap-2">
                {itemCode && (
                  <span className="px-2 py-0.5 bg-[#16202D] text-[#C5A880] border border-[#C5A880]/30 font-mono text-xs font-bold rounded-none">
                    {itemCode}
                  </span>
                )}
                {itemName && (
                  <span className="text-xs font-semibold text-white truncate">
                    {itemName}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="p-2.5 bg-rose-950/20 border border-rose-500/30 rounded-none flex items-start gap-2 text-[11px] text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{t('Hệ thống sẽ cập nhật trạng thái ngay lập tức trên toàn bộ các cổng vận hành và báo cáo quản lý.', 'The system will update status immediately across all operations and management reports.')}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#141B24] border-t border-[#222B35] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#16202D] hover:bg-[#1E293B] border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-mono text-xs uppercase tracking-wider rounded-none transition-colors disabled:opacity-50 cursor-pointer"
          >
            {displayCancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isSubmitting}
            className={`px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded-none shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                : 'bg-[#C5A880] hover:bg-white text-[#0A0E14]'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t('Đang xử lý...', 'Processing...')}</span>
              </>
            ) : (
              <>
                {isDanger ? <Trash2 className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{displayConfirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

