'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react';

export function ResourceSkeleton({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="p-4 bg-[#0E131B] border border-[#222B35] rounded-none space-y-3 animate-pulse"
    >
      <div className="h-3 w-40 bg-[#1C2533] rounded-none" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="h-14 bg-[#141B24] rounded-none" />
        <div className="h-14 bg-[#141B24] rounded-none" />
        <div className="h-14 bg-[#141B24] rounded-none" />
      </div>
    </div>
  );
}

export function ResourceError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-100 font-semibold rounded-none flex items-center gap-1.5 self-start sm:self-auto"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Thử lại
      </button>
    </div>
  );
}

export function ResourceEmpty({ message }: { message: string }) {
  return (
    <div className="p-6 bg-[#0E131B] border border-[#222B35] rounded-none flex flex-col items-center justify-center text-center gap-2 text-xs text-gray-400">
      <Inbox className="w-5 h-5 text-gray-500" />
      <span>{message}</span>
    </div>
  );
}
