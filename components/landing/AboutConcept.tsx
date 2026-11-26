'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/languageContext';

export default function AboutConcept() {
  const { theme } = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const { t, isEn } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <section id="concept" className={`py-20 sm:py-24 border-b scroll-mt-20 relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0D1117] text-white border-[#1E293B]' 
        : 'bg-white text-gray-900 border-gray-200'
    }`}>
      {/* Background glow tinh táº¿ */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#C5A880]/5 rounded-none blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] ${
            isDark 
              ? 'bg-[#161F2E] border border-[#C5A880]/40 text-[#C5A880]' 
              : 'bg-amber-50 border border-[#C5A880]/60 text-amber-900 shadow-sm'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{t('Triáº¿t LÃ½ Thiáº¿t Káº¿ & KhÃ´ng Gian', 'Design Philosophy & Space')}</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-serif leading-tight font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {t('Sá»± Giao Thoa Giá»¯a Nghá»‡ Thuáº­t Kiáº¿n TrÃºc Tá»‘i Giáº£n VÃ  Váº­n HÃ nh Sá»‘ HÃ³a', 'The Convergence of Minimalist Architecture & Digital Operations')}
          </h2>
          <div className="w-16 h-0.5 bg-[#C5A880]"></div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className={`lg:col-span-6 space-y-6 font-light leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <p className="text-base sm:text-lg">
              {isEn ? (
                <>
                  Inspired by international waterfront luxury architecture,{' '}
                  <strong className={isDark ? 'text-white' : 'text-gray-900'}>SKYLINE Smart Residence</strong> focuses on sharp geometric forms, expansive open proportions, and capturing natural daylight alongside refreshing river breezes.
                </>
              ) : (
                <>
                  Láº¥y cáº£m há»©ng tá»« phong cÃ¡ch kiáº¿n trÃºc cÄƒn há»™ cao cáº¥p quá»‘c táº¿ bÃªn bá» sÃ´ng,{' '}
                  <strong className={isDark ? 'text-white' : 'text-gray-900'}>SKYLINE Smart Residence</strong> táº­p trung vÃ o hÃ¬nh khá»‘i sáº¯c nÃ©t, tá»· lá»‡ khÃ´ng gian má»Ÿ thoÃ¡ng Ä‘Ã£ng vÃ  Ä‘Ã³n trá»n Ã¡nh sÃ¡ng tá»± nhiÃªn cÃ¹ng giÃ³ sÃ´ng mÃ¡t lÃ nh.
                </>
              )}
            </p>
            <p className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {isEn ? (
                <>
                  The breakthrough of the project is the integration of an <strong className="text-[#C5A880]">AI Core</strong> running seamlessly underneath all engineering infrastructure. Residents no longer need manual maintenance requests or paperwork: all support tickets, access control, billing, and security are automated with near-absolute precision.
                </>
              ) : (
                <>
                  {isEn ? 'The breakthrough of the project is the integration of an AI Core running seamlessly underneath all engineering infrastructure. Residents no longer need manual maintenance requests or paperwork: all support tickets, access control, billing, and security are automated with near-absolute precision.' : 'Äiá»ƒm Ä‘á»™t phÃ¡ cá»§a dá»± Ã¡n lÃ  viá»‡c tÃ­ch há»£p má»™t LÃµi TrÃ­ Tuá»‡ NhÃ¢n Táº¡o (AI Core) cháº¡y ngáº§m trong toÃ n bá»™ háº¡ táº§ng ká»¹ thuáº­t. CÆ° dÃ¢n khÃ´ng cÃ²n pháº£i chá» Ä‘á»£i báº£o dÆ°á»¡ng thá»§ cÃ´ng hay gáº·p phiá»n toÃ¡i vá»›i cÃ¡c thá»§ tá»¥c giáº¥y tá»: má»i yÃªu cáº§u há»— trá»£, kiá»ƒm soÃ¡t ra vÃ o, hÃ³a Ä‘Æ¡n vÃ  an ninh Ä‘á»u Ä‘Æ°á»£c tá»± Ä‘á»™ng hÃ³a vá»›i Ä‘á»™ chÃ­nh xÃ¡c gáº§n nhÆ° tuyá»‡t Ä‘á»‘i.'}
                </>
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className={`p-4 rounded-none border-l-4 border-l-[#C5A880] space-y-1 shadow-lg transition-colors ${
                isDark 
                  ? 'bg-[#121824] border border-[#1E293B]' 
                  : 'bg-slate-50 border border-gray-200'
              }`}>
                <div className={`font-serif text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('Quyá»n Tá»± Trá»‹ CÄƒn Há»™', 'Apartment Autonomy')}
                </div>
                <div className={`text-xs font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('Chá»§ há»™ toÃ n quyá»n cáº¥p phÃ¡t FaceID vÃ  quáº£n lÃ½ thÃ nh viÃªn cÆ° trÃº.', 'Owners have full autonomy to grant FaceID access and manage residential members.')}
                </div>
              </div>
              <div className={`p-4 rounded-none border-l-4 border-l-[#C5A880] space-y-1 shadow-lg transition-colors ${
                isDark 
                  ? 'bg-[#121824] border border-[#1E293B]' 
                  : 'bg-slate-50 border border-gray-200'
              }`}>
                <div className={`font-serif text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('An Ninh Äa Lá»›p 24/7', 'Multi-layer 24/7 Security')}
                </div>
                <div className={`text-xs font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('PhÃ¢n táº§ng thang mÃ¡y báº£o máº­t vÃ  camera Vision AI quÃ©t biá»ƒn sá»‘ xe tá»± Ä‘á»™ng.', 'Secured elevator zoning and Vision AI cameras with automated license plate scanning.')}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className={`relative border p-2 sm:p-3 rounded-none shadow-2xl overflow-hidden group transition-colors ${
              isDark 
                ? 'border-[#C5A880]/40 bg-[#121824]' 
                : 'border-gray-200 bg-slate-100'
            }`}>
              <Image
                src="/masterplan/the-tropical-masterplan.png"
                alt="Skyline Luxury Architecture"
                width={1200}
                height={800}
                className="w-full h-[360px] sm:h-[400px] object-cover rounded-none transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 pointer-events-none rounded-none bg-gradient-to-t from-black/75 via-transparent to-transparent" />

              <div className={`absolute bottom-5 left-5 right-5 sm:right-auto p-4 border rounded-none max-w-sm backdrop-blur-md shadow-2xl transition-colors ${
                isDark 
                  ? 'bg-[#0A0E17]/95 text-white border-[#C5A880]/60' 
                  : 'bg-white/95 text-gray-900 border-gray-200 shadow-xl'
              }`}>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C5A880] font-semibold">
                  {isAuthenticated && currentUser ? `${t('CÄƒn Há»™ Thá»±c Táº¿', 'Actual Apartment')} ${currentUser.apartment_code || ''}` : t('CÄƒn Há»™ Máº«u Thá»±c Táº¿', 'Model Apartment')}
                </div>
                <div className={`text-sm font-serif mt-1 font-bold break-words leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('CÄƒn Há»™ TiÃªu Chuáº©n â€¢ Ban CÃ´ng View Há»“ & CÃ´ng ViÃªn', 'Standard Apartment â€¢ Balcony with Lake & Park View')}
                </div>
                <div className={`text-xs font-light mt-1 break-words leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isAuthenticated && currentUser 
                    ? `${t('Táº§ng 30 â€¢ Chung CÆ° BS-07 (The Tropical) â€¢ CÆ° dÃ¢n:', 'Floor 30 â€¢ BS-07 Tower (The Tropical) â€¢ Resident:')} ${currentUser.full_name}`
                    : t('Táº§ng 30 â€¢ Chung CÆ° BS-07 (The Tropical) â€¢ TiÃªu Chuáº©n BÃ n Giao Cao Cáº¥p', 'Floor 30 â€¢ BS-07 Tower (The Tropical) â€¢ Luxury Handover Standards')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
