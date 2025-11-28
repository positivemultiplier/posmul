"use client";

import { createContext, useContext, useEffect, useState } from 'react';

const themes = {
  light: {
    // Background Colors
    background: 'bg-white',
    backgroundSecondary: 'bg-gray-50',
    backgroundTertiary: 'bg-gray-100',

    // Text Colors
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textTertiary: 'text-gray-500',

    // Border Colors
    border: 'border-gray-200',
    borderSecondary: 'border-gray-300',

    // Card Colors
    card: 'bg-white border-gray-200',
    cardHover: 'hover:bg-gray-50',

    // Button Colors
    buttonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white',
    buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    buttonDanger: 'bg-red-500 hover:bg-red-600 text-white',

    // Prediction Game Colors
    gameActive: 'bg-green-100 text-green-800 border-green-200',
    gamePending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gameEnded: 'bg-gray-100 text-gray-800 border-gray-200',

    // Chart Colors
    chartBackground: '#ffffff',
    chartGrid: '#f3f4f6',
    chartText: '#374151',

    // Accent Colors
    accent: 'bg-blue-500',
    accentHover: 'hover:bg-blue-600',
    accentText: 'text-blue-600',

    // Shadow
    shadow: 'shadow-sm',
    shadowHover: 'hover:shadow-md',

    // CSS Variables
    cssVars: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f9fafb',
      '--bg-tertiary': '#f3f4f6',
      '--text-primary': '#111827',
      '--text-secondary': '#4b5563',
      '--text-tertiary': '#6b7280',
      '--border-primary': '#e5e7eb',
      '--border-secondary': '#d1d5db',
      '--accent': '#3b82f6',
      '--accent-hover': '#2563eb',
    }
  },

  dark: {
    // Background Colors
    background: 'bg-gray-900',
    backgroundSecondary: 'bg-gray-800',
    backgroundTertiary: 'bg-gray-700',

    // Text Colors
    text: 'text-gray-100',
    textSecondary: 'text-gray-300',
    textTertiary: 'text-gray-400',

    // Border Colors
    border: 'border-gray-700',
    borderSecondary: 'border-gray-600',

    // Card Colors
    card: 'bg-gray-800 border-gray-700',
    cardHover: 'hover:bg-gray-750',

    // Button Colors
    buttonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white',
    buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
    buttonDanger: 'bg-red-600 hover:bg-red-500 text-white',

    // Prediction Game Colors
    gameActive: 'bg-green-900 text-green-200 border-green-800',
    gamePending: 'bg-yellow-900 text-yellow-200 border-yellow-800',
    gameEnded: 'bg-gray-800 text-gray-300 border-gray-700',

    // Chart Colors
    chartBackground: '#1f2937',
    chartGrid: '#374151',
    chartText: '#d1d5db',

    // Accent Colors
    accent: 'bg-blue-600',
    accentHover: 'hover:bg-blue-500',
    accentText: 'text-blue-400',

    // Shadow
    shadow: 'shadow-lg',
    shadowHover: 'hover:shadow-xl',

    // CSS Variables
    cssVars: {
      '--bg-primary': '#111827',
      '--bg-secondary': '#1f2937',
      '--bg-tertiary': '#374151',
      '--text-primary': '#f9fafb',
      '--text-secondary': '#d1d5db',
      '--text-tertiary': '#9ca3af',
      '--border-primary': '#374151',
      '--border-secondary': '#4b5563',
      '--accent': '#3b82f6',
      '--accent-hover': '#60a5fa',
    }
  },

  gameMode: {
    // Background Colors - 게임 모드는 더 몰입감 있는 어두운 테마
    background: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
    backgroundSecondary: 'bg-black/30 backdrop-blur-md',
    backgroundTertiary: 'bg-black/20 backdrop-blur-sm',

    // Text Colors
    text: 'text-white',
    textSecondary: 'text-gray-200',
    textTertiary: 'text-gray-400',

    // Border Colors
    border: 'border-white/20',
    borderSecondary: 'border-white/30',

    // Card Colors
    card: 'bg-black/20 backdrop-blur border-white/20',
    cardHover: 'hover:bg-black/30',

    // Button Colors
    buttonPrimary: 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white',
    buttonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/30',
    buttonDanger: 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white',

    // Prediction Game Colors
    gameActive: 'bg-green-500/20 text-green-300 border-green-400/30 backdrop-blur',
    gamePending: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30 backdrop-blur',
    gameEnded: 'bg-gray-500/20 text-gray-300 border-gray-400/30 backdrop-blur',

    // Chart Colors
    chartBackground: 'rgba(0, 0, 0, 0.3)',
    chartGrid: 'rgba(255, 255, 255, 0.1)',
    chartText: '#e5e7eb',

    // Accent Colors
    accent: 'bg-gradient-to-r from-green-400 to-blue-500',
    accentHover: 'hover:from-green-500 hover:to-blue-600',
    accentText: 'text-green-400',

    // Shadow
    shadow: 'shadow-2xl shadow-purple-500/25',
    shadowHover: 'hover:shadow-purple-500/40',

    // CSS Variables
    cssVars: {
      '--bg-primary': 'linear-gradient(135deg, #581c87 0%, #1e3a8a 50%, #312e81 100%)',
      '--bg-secondary': 'rgba(0, 0, 0, 0.3)',
      '--bg-tertiary': 'rgba(0, 0, 0, 0.2)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#e5e7eb',
      '--text-tertiary': '#9ca3af',
      '--border-primary': 'rgba(255, 255, 255, 0.2)',
      '--border-secondary': 'rgba(255, 255, 255, 0.3)',
      '--accent': '#10b981',
      '--accent-hover': '#059669',
    }
  }
};

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  // 시스템 다크 모드 감지
  const [systemPreference, setSystemPreference] = useState('light');

  useEffect(() => {
    // 저장된 테마 불러오기
    const savedTheme = localStorage.getItem('posmul-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    setSystemPreference(systemDark.matches ? 'dark' : 'light');

    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    } else {
      setCurrentTheme(systemDark.matches ? 'dark' : 'light');
    }

    // 시스템 테마 변경 감지
    const handleSystemThemeChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
      if (!localStorage.getItem('posmul-theme')) {
        setCurrentTheme(e.matches ? 'dark' : 'light');
      }
    };

    systemDark.addEventListener('change', handleSystemThemeChange);
    return () => systemDark.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // CSS 변수 적용
  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    Object.entries(theme.cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, String(value));
    });

    // body 클래스 업데이트
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '') + ` theme-${currentTheme}`;
  }, [currentTheme]);

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('posmul-theme', themeName);
    }
  };

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const value = {
    currentTheme,
    theme: themes[currentTheme],
    setTheme,
    toggleTheme,
    systemPreference,
    availableThemes: Object.keys(themes)
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={`${themes[currentTheme].background} ${themes[currentTheme].text} min-h-screen transition-colors duration-200`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
