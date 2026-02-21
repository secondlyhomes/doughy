/**
 * Shared Color Palettes
 *
 * These palettes are the canonical color scales used across all Secondly apps.
 * Each app maps these into its own theme system (Doughy uses useThemeColors(),
 * CallPilot/Claw use theme.colors.*).
 */

export const primary = {
  50: '#f0f7f2',
  100: '#dcebe0',
  200: '#b9d8c3',
  300: '#8dbf9e',
  400: '#6b9b7e',
  500: '#4d7c5f',
  600: '#3d6550',
  700: '#2f4f3d',
  800: '#23392d',
  900: '#19291f',
} as const;

export const neutral = {
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
} as const;

export const success = {
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
} as const;

export const warning = {
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
} as const;

export const error = {
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
} as const;

export const info = {
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
} as const;

export const white = '#ffffff';
export const black = '#000000';
export const transparent = 'transparent';

export const colors = {
  primary,
  neutral,
  success,
  warning,
  error,
  info,
  white,
  black,
  transparent,
} as const;

export type ColorPalette = typeof colors;
export type ColorScale = keyof typeof colors;
