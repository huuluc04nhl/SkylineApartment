'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isDanger = false,
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      return;
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await Promise.resolve(onConfirm());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-heading"
        className="w-full max-w-md bg-[#0E131B] border border-[#2D3748] shadow-2xl rounded-none overflow-hidden text-gray-200"
      >
        <div
          className={`h-1 w-full ${
            isDanger
              ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500'
              : 'bg-gradient-to-r from-[#C5A880] via-[#E2C9A5] to-[#C5A880]'
          }`}
        />
        <div className="p-5 flex items-start justify-between gap-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className={`w-5 h-5 shrink-0 ${isDanger ? 'text-rose-400' : 'text-[#C5A880]'}`} />
            <h3 id="confirm-dialog-heading" className="font-serif text-base font-bold text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="p-1 text-gray-400 hover:text-white rounded-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-xs sm:text-sm text-gray-300 leading-relaxed">{message}</div>

        <div className="px-5 py-4 bg-[#141B24] border-t border-[#1E293B] flex items-center justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#0A0E14] border border-[#2D3748] text-gray-300 hover:text-white text-xs font-semibold rounded-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-xs font-semibold rounded-none flex items-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-[#C5A880] hover:bg-[#E2C9A5] text-[#0A0E14]'
            }`}
          >
            {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
