'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getCookieTheme(): Theme {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)skyline_theme=([^;]+)/);
    if (match && (match[1] === 'dark' || match[1] === 'light')) {
      return match[1] as Theme;
    }
  }
  return 'dark';
}

function setCookieTheme(t: Theme) {
  if (typeof document !== 'undefined') {
    document.cookie = 'skyline_theme=' + t + '; path=/; max-age=31536000';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = getCookieTheme();
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (t === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    setCookieTheme(t);
    applyTheme(t);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
