'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

const TOAST_EVENT = 'skyline_toast_event';

export function showAppToast(message: string, type: ToastType = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }));
  }
}

export const toast = {
  success: (msg: string) => showAppToast(msg, 'success'),
  error: (msg: string) => showAppToast(msg, 'error'),
  warning: (msg: string) => showAppToast(msg, 'warning'),
  info: (msg: string) => showAppToast(msg, 'info'),
};

export function useToast() {
  return useContext(ToastContext);
}

const STYLE_MAP: Record<ToastType, { border: string; icon: React.ReactNode }> = {
  success: {
    border: 'border-emerald-500/50 text-emerald-200',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  },
  error: {
    border: 'border-rose-500/50 text-rose-200',
    icon: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  },
  warning: {
    border: 'border-amber-500/50 text-amber-200',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  },
  info: {
    border: 'border-[#C5A880]/50 text-gray-100',
    icon: <Info className="w-4 h-4 text-[#C5A880] shrink-0" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string; type?: ToastType }>).detail;
      if (detail?.message) {
        showToast(detail.message, detail.type || 'info');
      }
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => {
          const style = STYLE_MAP[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 p-3.5 bg-[#0E131B]/95 backdrop-blur-xl border ${style.border} shadow-2xl rounded-none text-xs leading-relaxed`}
            >
              {style.icon}
              <span className="flex-1 break-words">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Đóng thông báo"
                className="p-0.5 text-gray-400 hover:text-white transition-colors rounded-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
