'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function MissingApartmentNotice({ className = '' }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <div
      role="status"
      className={`p-6 bg-[#0E131B] border border-[#C5A880]/30 rounded-none flex items-center gap-3 text-sm text-[#C5A880] ${className}`}
    >
      <Building2 className="w-5 h-5 shrink-0 text-[#C5A880]" />
      <span>
        {t(
          'Tài khoản chưa được gán căn hộ, vui lòng liên hệ Ban quản lý',
          'Your account has not been assigned an apartment yet, please contact Management'
        )}
      </span>
    </div>
  );
}
