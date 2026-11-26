'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, LayoutDashboard, KeyRound, Building2 } from 'lucide-react';
import { UserRole } from '@/lib/dataStore';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { useLanguage } from '@/lib/languageContext';

interface HeroSectionProps {
  onOpenLogin: (role?: UserRole) => void;
}

export default function HeroSection({ onOpenLogin }: HeroSectionProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const { t, isEn } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <section className={`relative min-h-[92vh] flex items-center pt-24 pb-16 overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0A0E14] text-white' : 'bg-[#F8FAFC] text-gray-900'
    }`}>
      {/* Background Architectural Texture */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-25"
        style={{
          backgroundImage: `url('/masterplan/vinhomes-grand-park-macro-plan.jpg')`,
        }}
      />
      <div className={`absolute inset-0 z-0 ${
        isDark 
          ? 'bg-gradient-to-r from-[#0A0E14] via-[#0A0E14]/90 to-transparent' 
          : 'bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent'
      }`} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {/* Khi chÆ°a Ä‘Äƒng nháº­p: Layout 2 cá»™t vá»›i video full-width */}
        {!isAuthenticated || !currentUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column: Text */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-8">
              <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 border text-[11px] uppercase tracking-[0.25em] font-medium backdrop-blur-sm rounded-none ${
                isDark 
                  ? 'border-[#C5A880]/40 text-[#C5A880] bg-[#0E131B]/80' 
                  : 'border-[#C5A880]/60 text-amber-800 bg-white/90 shadow-sm'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                {t('Kiáº¿n TrÃºc ÄÆ°Æ¡ng Äáº¡i TÃ­ch Há»£p LÃµi AI', 'Contemporary Architecture with AI Core')}
              </div>

              <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.15] tracking-tight ${
                isDark ? 'text-[#FAFAFA]' : 'text-[#0D1117]'
              }`}>
                {isEn ? (
                  <>
                    Where Architectural Standards Meet <br />
                    <span className="italic text-[#C5A880] font-light">Artificial Intelligence 4.0</span>
                  </>
                ) : (
                  <>
                    NÆ¡i Chuáº©n Má»±c Kiáº¿n TrÃºc Gáº·p Gá»¡ <br />
                    <span className="italic text-[#C5A880] font-light">{isEn ? 'Artificial Intelligence 4.0' : 'TrÃ­ Tuá»‡ NhÃ¢n Táº¡o 4.0'}</span>
                  </>
                )}
              </h1>

              <p className={`font-light text-sm sm:text-base max-w-xl leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {isEn ? (
                  <>
                    Luxury apartment project <strong>SKYLINE Smart Residence</strong> at 4 towers of{' '}
                    <strong>The Tropical (BS-07, BS-08, BS-09, BS-10)</strong> â€” smart FaceID door access, 
                    intelligent security, and 24/7 resident assistance.
                  </>
                ) : (
                  <>
                    Dá»± Ã¡n cÄƒn há»™ háº¡ng sang <strong>SKYLINE Smart Residence</strong> táº¡i cá»¥m 4 chung cÆ°{' '}
                    <strong>The Tropical (BS-07, BS-08, BS-09, BS-10)</strong> â€” má»Ÿ cá»­a nhanh báº±ng khuÃ´n máº·t FaceID, 
                    an ninh thÃ´ng minh vÃ  há»— trá»£ cÆ° dÃ¢n 24/7.
                  </>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a href="#floorplans" className="hendon-btn-gold text-[12px] shadow-lg rounded-none">
                  {t('Xem Máº·t Báº±ng CÄƒn Há»™', 'View Apartment Layouts')}
                </a>
                <button
                  onClick={() => onOpenLogin()}
                  className={`text-[12px] flex items-center gap-2 px-5 py-3 border font-semibold tracking-wider uppercase transition-all rounded-none cursor-pointer ${
                    isDark
                      ? 'border-gray-600 hover:border-white text-white bg-[#0E131B]/60 backdrop-blur-sm'
                      : 'border-gray-400 hover:border-gray-900 text-gray-800 bg-white/60'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-[#C5A880]" />
                  {t('ÄÄƒng Nháº­p Há»‡ Thá»‘ng', 'Sign In System')}
                </button>
              </div>

              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 pt-6 sm:pt-8 border-t ${
                isDark ? 'border-[#222B35]' : 'border-gray-200'
              }`}>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">34 - 39 {t('Táº§ng', 'Floors')}</div>
                  <div className={`text-[11px] uppercase tracking-wider mt-1 break-words leading-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('4 Chung CÆ° (BS-07 Ä‘áº¿n BS-10)', '4 Towers (BS-07 ~ BS-10)')}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">&lt; 0.5s</div>
                  <div className={`text-[11px] uppercase tracking-wider mt-1 break-words leading-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('Tá»‘c Äá»™ Má»Ÿ Cá»­a & Cá»•ng Xe', 'Door & Gate FaceID Speed')}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">15 {t('Module', 'Modules')}</div>
                  <div className={`text-[11px] uppercase tracking-wider mt-1 break-words leading-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('Há»‡ Thá»‘ng Váº­n HÃ nh AI', 'AI Operating System')}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">100%</div>
                  <div className={`text-[11px] uppercase tracking-wider mt-1 break-words leading-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('Sá»• Há»“ng & SPA Minh Báº¡ch', 'Pink Book & SPA Transparency')}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: VIDEO - Full-width, no iframe border */}
            <div className="lg:col-span-6 w-full">
              <div className={`rounded-none overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)] border ${
                isDark ? 'border-[#C5A880]/25' : 'border-gray-300'
              }`}>
                {/* Caption bar phÃ­a trÃªn video */}
                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
                  isDark ? 'border-[#1E293B] bg-[#0E131B]' : 'border-gray-200 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-none animate-pulse" />
                    <span className="font-mono text-[11px] font-semibold text-[#C5A880] uppercase tracking-wider">
                      {t('ThÆ°á»›c Phim Thá»±c Táº¿ â€¢ BÃ n Giao Chung CÆ°', 'Actual Footage â€¢ Handover Towers')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
                    <Building2 className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>The Tropical BS-07 ~ BS-10</span>
                  </div>
                </div>

                {/* Video 16:9 â€” loáº¡i bá» border iframe báº±ng cÃ¡ch che Ä‘Ã¨ trá»±c tiáº¿p */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full border-0"
                    src="https://www.youtube.com/embed/NjkWg9gaHfE?autoplay=1&mute=1&controls=1&loop=1&playlist=NjkWg9gaHfE&rel=0&modestbranding=1&iv_load_policy=3"
                    title={isEn ? 'Official showcase video of The Tropical - Beverly Solari Complex' : 'ThÆ°á»›c phim thá»±c táº¿ Cá»¥m Chung CÆ° The Tropical - Beverly Solari'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ border: 'none', outline: 'none' }}
                  />
                </div>

                {/* Caption bar phÃ­a dÆ°á»›i video */}
                <div className={`px-4 py-3 flex items-center justify-between ${
                  isDark ? 'bg-[#0E131B]' : 'bg-slate-50'
                }`}>
                  <p className={`text-[11px] font-light leading-relaxed max-w-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('Tráº£i nghiá»‡m khÃ´ng gian sá»‘ng xanh nhiá»‡t Ä‘á»›i, cá»¥m há»“ bÆ¡i resort vÃ  háº¡ táº§ng váº­n hÃ nh AI hiá»‡n Ä‘áº¡i.', 'Experience tropical green living spaces, resort pool complex, and modern AI operations infrastructure.')}
                  </p>
                  <span className="text-[10px] font-mono text-[#C5A880] uppercase shrink-0 ml-4">Beverly Solari</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* KHI ÄÃƒ ÄÄ‚NG NHáº¬P: Layout 2 cá»™t â€” Text trÃ¡i, Tháº» phiÃªn pháº£i */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 border text-[11px] uppercase tracking-[0.25em] font-medium backdrop-blur-sm rounded-none ${
                isDark 
                  ? 'border-[#C5A880]/40 text-[#C5A880] bg-[#0E131B]/80' 
                  : 'border-[#C5A880]/60 text-amber-800 bg-white/90 shadow-sm'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                {t('Kiáº¿n TrÃºc ÄÆ°Æ¡ng Äáº¡i TÃ­ch Há»£p LÃµi AI', 'Contemporary Architecture with AI Core')}
              </div>

              <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[1.15] tracking-tight ${
                isDark ? 'text-[#FAFAFA]' : 'text-[#0D1117]'
              }`}>
                {isEn ? (
                  <>
                    Where Architectural Standards Meet <br />
                    <span className="italic text-[#C5A880] font-light">Artificial Intelligence 4.0</span>
                  </>
                ) : (
                  <>
                    NÆ¡i Chuáº©n Má»±c Kiáº¿n TrÃºc Gáº·p Gá»¡ <br />
                    <span className="italic text-[#C5A880] font-light">{isEn ? 'Artificial Intelligence 4.0' : 'TrÃ­ Tuá»‡ NhÃ¢n Táº¡o 4.0'}</span>
                  </>
                )}
              </h1>

              <p className={`font-light text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {isEn ? (
                  <>
                    Luxury apartment project <strong>SKYLINE Smart Residence</strong> at 4 towers of{' '}
                    <strong>The Tropical (BS-07, BS-08, BS-09, BS-10)</strong> pioneers complete modern living: 
                    smart FaceID access &lt;0.5s, intelligent security, and 24/7 resident support.
                  </>
                ) : (
                  <>
                    Dá»± Ã¡n cÄƒn há»™ háº¡ng sang <strong>SKYLINE Smart Residence</strong> táº¡i cá»¥m 4 chung cÆ°{' '}
                    <strong>The Tropical (BS-07, BS-08, BS-09, BS-10)</strong> kiáº¿n táº¡o chuáº©n sá»‘ng tiá»‡n nghi 
                    hoÃ n chá»‰nh: Má»Ÿ cá»­a báº±ng khuÃ´n máº·t FaceID &lt;0.5s, an ninh thÃ´ng minh vÃ  há»— trá»£ cÆ° dÃ¢n chu Ä‘Ã¡o.
                  </>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
                <a href="#floorplans" className="hendon-btn-gold text-[12px] shadow-lg rounded-none">
                  {t('Xem Máº·t Báº±ng CÄƒn Há»™', 'View Apartment Layouts')}
                </a>
                <Link
                  href={currentUser.role === 'ADMIN' ? '/portal?tab=admin-dashboard' : currentUser.role === 'TECHNICIAN' ? '/portal?tab=admin-kanban' : '/portal?tab=resident-home'}
                  className={`text-[12px] flex items-center gap-2 px-5 py-3 border font-semibold tracking-wider uppercase transition-all rounded-none ${
                    isDark
                      ? 'border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-[#0D1117]'
                      : 'border-amber-700 text-amber-800 hover:bg-[#C5A880] hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {currentUser.role === 'ADMIN' 
                    ? t('VÃ o Báº£ng Quáº£n Trá»‹ VinHomes Manager', 'Go to VinHomes Manager Dashboard') 
                    : currentUser.role === 'TECHNICIAN' 
                    ? t('VÃ o Báº£ng Viá»‡c Ká»¹ Thuáº­t', 'Go to Technician Board') 
                    : t('VÃ o Báº£ng Äiá»u Khiá»ƒn CÄƒn Há»™', 'Go to Resident Portal')}
                </Link>
              </div>

              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t ${
                isDark ? 'border-[#222B35]' : 'border-gray-200'
              }`}>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">34 - 39 {t('Táº§ng', 'Floors')}</div>
                  <div className={`text-[11px] uppercase tracking-wider mt-1 break-words leading-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('4 Chung CÆ° (BS-07 Ä‘áº¿n BS-10)', '4 Towers (BS-07 ~ BS-10)')}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">&lt; 0.5s</div>
                  <div className={`text-[11px] uppercase tracking-wider mt-1 break-words leading-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('Tá»‘c Äá»™ Má»Ÿ Cá»­a & Cá»•ng Xe', 'Door & Gate FaceID Speed')}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">15 {t('Module', 'Modules')}</div>
                  <div className={`text-[11px] uppercase tracking-wider mt-1 break-words leading-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('Há»‡ Thá»‘ng Váº­n HÃ nh AI', 'AI Operating System')}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-serif text-[#C5A880] font-bold">100%</div>
                  <div className={`text-[11px] uppercase tracking-wider mt-1 break-words leading-tight ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('Sá»• Há»“ng & SPA Minh Báº¡ch', 'Pink Book & SPA Transparency')}
                  </div>
                </div>
              </div>
            </div>

            {/* Tháº» phiÃªn Ä‘Äƒng nháº­p */}
            <div className="lg:col-span-5 w-full">
              <div className={`border p-6 space-y-4 shadow-2xl rounded-none transition-colors ${
                isDark 
                  ? 'border-[#2D3748] bg-[#121820]' 
                  : 'border-gray-200 bg-white shadow-xl'
              }`}>
                <div className={`text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold border-b pb-3 flex items-center justify-between ${
                  isDark ? 'border-[#222B35]' : 'border-gray-100'
                }`}>
                  <span>{t('ThÃ´ng Tin PhiÃªn ÄÄƒng Nháº­p', 'Session Information')}</span>
                  <span className="text-gray-400 font-mono">ID: {currentUser.apartment_code || 'BQL_OFFICE'}</span>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-[#1E2631]' : 'border-gray-100'}`}>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('Há» vÃ  tÃªn:', 'Full Name:')}</span>
                    <span className={`font-semibold text-right text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {currentUser.full_name}
                    </span>
                  </div>
                  <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-[#1E2631]' : 'border-gray-100'}`}>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('Vai trÃ²:', 'Role:')}</span>
                    <span className="font-semibold text-right text-xs text-[#C5A880]">
                      {currentUser.role === 'ADMIN' 
                        ? 'VinHomes Manager' 
                        : currentUser.role === 'TECHNICIAN' 
                        ? t('Ká»¹ Thuáº­t ViÃªn', 'Technician') 
                        : `${t('Chá»§ Há»™ CÄƒn', 'Apartment Owner')} ${currentUser.apartment_code || 'CH-06'}`}
                    </span>
                  </div>
                  <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-[#1E2631]' : 'border-gray-100'}`}>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('Vá»‹ trÃ­:', 'Location:')}</span>
                    <span className={`font-medium text-right text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('Chung CÆ° BS-07 â€¢ The Tropical, TP. Thá»§ Äá»©c', 'BS-07 Tower â€¢ The Tropical, Thu Duc City')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t('Tráº¡ng thÃ¡i:', 'Status:')}</span>
                    <span className="font-medium text-emerald-500 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 bg-emerald-500 rounded-none animate-pulse" />
                      {t('Äang Hoáº¡t Äá»™ng', 'Active')}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={currentUser.role === 'ADMIN' ? '/portal?tab=admin-dashboard' : currentUser.role === 'TECHNICIAN' ? '/portal?tab=admin-kanban' : '/portal?tab=resident-home'}
                    className="w-full py-3 bg-[#C5A880] hover:bg-[#D4AF37] text-[#0D1117] text-[11px] uppercase tracking-[0.18em] font-bold transition-all flex items-center justify-center gap-2 rounded-none cursor-pointer shadow-md"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {currentUser.role === 'ADMIN' 
                      ? t('VÃ o Báº£ng Quáº£n Trá»‹ VinHomes Manager', 'Go to VinHomes Manager Dashboard') 
                      : currentUser.role === 'TECHNICIAN' 
                      ? t('VÃ o Báº£ng Viá»‡c Ká»¹ Thuáº­t', 'Go to Technician Board') 
                      : t('VÃ o Báº£ng Äiá»u Khiá»ƒn CÄƒn Há»™', 'Go to Resident Portal')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
