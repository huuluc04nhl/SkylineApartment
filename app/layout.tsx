import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { AuthProvider } from '@/lib/authContext';
import { ThemeProvider } from '@/lib/themeContext';
import { LanguageProvider, type Language } from '@/lib/languageContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

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
    <html lang={initialLanguage} className="scroll-smooth dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0A0E17] dark:bg-[#0A0E17] text-[#FAFAFA] antialiased transition-colors duration-300" suppressHydrationWarning>
        <LanguageProvider initialLanguage={initialLanguage}>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <LanguageSwitcher variant="floating" />
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
