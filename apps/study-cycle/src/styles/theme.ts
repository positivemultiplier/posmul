/**
 * Study-Cycle React Native 테마 시스템
 * 
 * React Native 환경에 최적화된 디자인 토큰과 스타일 시스템
 */

import { Platform } from 'react-native';

export const Colors = {
  // Primary Colors
  primary: '#3498db',
  primaryDark: '#2980b9',
  primaryLight: '#5dade2',
  
  // Secondary Colors
  secondary: '#2ecc71',
  secondaryDark: '#27ae60',
  secondaryLight: '#58d68d',
  
  // Semantic Colors
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
  
  // Neutral Colors
  white: '#ffffff',
  black: '#000000',
  gray50: '#f8f9fa',
  gray100: '#e9ecef',
  gray200: '#dee2e6',
  gray300: '#ced4da',
  gray400: '#adb5bd',
  gray500: '#6c757d',
  gray600: '#495057',
  gray700: '#343a40',
  gray800: '#212529',
  gray900: '#1a1a1a',
  
  // Text Colors
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textTertiary: '#adb5bd',
  textInverse: '#ffffff',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#ffffff',
  
  // Background Colors
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  backgroundTertiary: '#e9ecef',
  surface: '#ffffff',
  surfaceSecondary: '#f8f9fa',
  
  // Border Colors
  border: '#dee2e6',
  borderLight: '#e9ecef',
  borderDark: '#ced4da',
  
  // Study-Cycle Specific Colors
  studyPrimary: '#4a90e2',
  studySecondary: '#7bb3f0',
  rewardGold: '#f1c40f',
  progressGreen: '#2ecc71',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

export const Typography = {
  // Heading Styles
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    color: Colors.textPrimary,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  
  // Body Text Styles
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  body3: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  
  // Special Text Styles
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
    color: Colors.textTertiary,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    color: Colors.textOnPrimary,
    textAlign: 'center' as const,
  },
};

export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  full: 9999,
};

export const Shadow = {
  // iOS Shadows
  sm: Platform.OS === 'ios' ? {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  } : {
    elevation: 1,
  },
  md: Platform.OS === 'ios' ? {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } : {
    elevation: 3,
  },
  lg: Platform.OS === 'ios' ? {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  } : {
    elevation: 5,
  },
  xl: Platform.OS === 'ios' ? {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  } : {
    elevation: 8,
  },
};

export const Opacity = {
  disabled: 0.5,
  pressed: 0.7,
  overlay: 0.8,
};

export const AnimationDuration = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export const Theme = {
  colors: Colors,
  spacing: Spacing,
  typography: Typography,
  borderRadius: BorderRadius,
  shadow: Shadow,
  opacity: Opacity,
  animation: AnimationDuration,
};

export default Theme;
