/**
 * Design Tokens — Matched to Doughy Design System
 *
 * Central design system tokens for colors, spacing, typography, etc.
 * Source of truth: doughy-app-mobile/src/constants/design-tokens.ts
 */

export const colors = {
  // Primary brand colors (Sage Green — shared across all 3 apps)
  primary: {
    50: '#f0f7f2',
    100: '#dcebe0',
    200: '#b9d8c3',
    300: '#8dbf9e',
    400: '#6b9b7e',
    500: '#4d7c5f', // Main brand color
    600: '#3d6550',
    700: '#2f4f3d',
    800: '#23392d',
    900: '#19291f',
  },

  // Neutral grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Monochrome
  white: '#ffffff',
  black: '#000000',

  // Transparent
  transparent: 'transparent',
}

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
} as const

export const fontSize = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
} as const

export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

export const lineHeight = {
  none: 1,
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const

// Matched to Doughy: sm=6, md=8, lg=12, xl=16
export const borderRadius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 32,
  full: 9999,
} as const

export const borderWidth = {
  0: 0,
  1: 1,
  2: 2,
  4: 4,
  8: 8,
} as const

// Shadow presets — matched to Doughy (opacity 0.1–0.25)
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Semantic aliases for backward compat
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  // Standard scale
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
} as const

export const opacity = {
  0: 0,
  5: 0.05,
  10: 0.1,
  20: 0.2,
  25: 0.25,
  30: 0.3,
  40: 0.4,
  50: 0.5,
  60: 0.6,
  70: 0.7,
  75: 0.75,
  80: 0.8,
  90: 0.9,
  95: 0.95,
  100: 1,
} as const

// Animation durations (in milliseconds) — matched to Doughy
export const duration = {
  fastest: 100,
  fast: 150,
  normal: 250,
  slow: 350,
  slowest: 800,
} as const

// Spring configs for Animated.spring — matched to Doughy's Reanimated configs
export const springs = {
  standard: { tension: 120, friction: 14 },
  snappy: { tension: 180, friction: 20 },
  gentle: { tension: 80, friction: 16 },
} as const

// Glass intensity for native blur (expo-blur) — from Doughy
export const glassIntensity = {
  subtle: 30,
  light: 40,
  medium: 55,
  strong: 65,
  opaque: 80,
} as const

// Sizing tokens — matched to Doughy button/input heights
export const sizing = {
  button: { sm: 36, md: 40, lg: 44 },
  icon: { sm: 14, md: 16, lg: 20, xl: 24, '2xl': 32 },
  dot: { sm: 8, md: 12, lg: 16 },
  input: 40,
  switch: { trackWidth: 52, trackHeight: 32, thumbSize: 28, thumbOffset: 2 },
  tabBadge: { minWidth: 18, height: 18 },
} as const

// Trust level colors — The Claw control panel
export const trustColors = {
  locked: '#6b7280',
  manual: '#3b82f6',
  guarded: '#f59e0b',
  autonomous: '#22c55e',
  killed: '#ef4444',
} as const

// Claw glass intensities — 5 higher than Doughy defaults for darker control-room feel
export const clawGlass = {
  subtle: 35,
  light: 45,
  medium: 60,
  strong: 70,
  opaque: 85,
} as const

// Z-index layers
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
} as const

/**
 * Theme tokens
 * Combines all design tokens into a single object
 */
export const tokens = {
  colors,
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  borderRadius,
  borderWidth,
  shadows,
  opacity,
  duration,
  springs,
  glassIntensity,
  sizing,
  zIndex,
  trustColors,
  clawGlass,
} as const

export type Tokens = typeof tokens
export type ColorScale = keyof typeof colors
export type SpacingScale = keyof typeof spacing
export type FontSize = keyof typeof fontSize
export type FontWeight = keyof typeof fontWeight
export type LineHeight = keyof typeof lineHeight
export type BorderRadius = keyof typeof borderRadius
export type Shadow = keyof typeof shadows
