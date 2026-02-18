/**
 * widget-colors.ts
 *
 * Color definitions for iOS Task Widget
 */

export interface ColorPalette {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  checkboxBorder: string;
}

/**
 * Get color palette based on color scheme
 */
export function getColorPalette(isDark: boolean): ColorPalette {
  return {
    background: isDark ? '#1C1C1E' : '#FFFFFF',
    backgroundSecondary: isDark ? '#2C2C2E' : '#F2F2F7',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#98989F' : '#6C6C70',
    accent: isDark ? '#0A84FF' : '#007AFF',
    border: isDark ? '#2C2C2E' : '#E5E5EA',
    checkboxBorder: isDark ? '#98989F' : '#C7C7CC',
  };
}

/**
 * Priority colors (same for both themes)
 */
export const PRIORITY_COLORS = {
  high: '#FF3B30',
  medium: '#FF9500',
  low: '#34C759',
} as const;
