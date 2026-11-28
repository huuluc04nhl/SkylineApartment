import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/authContext';
import { ThemeProvider } from '@/lib/themeContext';
import { LanguageProvider, type Language } from '@/lib/languageContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { ToastProvider } from '@/components/ui/Toast';

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0A0E17',
};

export const metadata: Metadata = {
  title: 'SKYLINE Smart Residence | Luxury AI-Powered Living',
  description: 'Website Quản lý Chung cư Cao cấp Tích hợp AI Tự động hóa Vận hành & Trải nghiệm Cư dân Thượng lưu',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const langCookie = cookieStore.get('skyline_language')?.value;
  const initialLanguage: Language = langCookie === 'en' ? 'en' : 'vi';

  return (
    <html lang={initialLanguage} className={`scroll-smooth dark ${playfair.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0A0E17] dark:bg-[#0A0E17] text-[#FAFAFA] antialiased transition-colors duration-300" suppressHydrationWarning>
        <LanguageProvider initialLanguage={initialLanguage}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
                <LanguageSwitcher variant="floating" />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
