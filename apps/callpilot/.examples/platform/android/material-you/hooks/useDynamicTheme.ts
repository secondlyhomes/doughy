/**
 * useDynamicTheme.ts
 *
 * Hooks for accessing Material You dynamic theme
 */

import { createContext, useContext } from 'react';
import type { DynamicThemeConfig, MaterialYouColors } from '../types';

/**
 * Material You Context
 */
export const DynamicThemeContext = createContext<DynamicThemeConfig | null>(null);

/**
 * Hook to access dynamic theme
 */
export function useDynamicTheme(): DynamicThemeConfig {
  const context = useContext(DynamicThemeContext);

  if (!context) {
    throw new Error('useDynamicTheme must be used within DynamicThemeProvider');
  }

  return context;
}

/**
 * Hook to access Material You colors
 */
export function useMaterialYouColors(): MaterialYouColors {
  const { colors } = useDynamicTheme();
  return colors;
}

/**
 * Hook to check if dynamic colors are active
 */
export function useIsDynamicTheme(): boolean {
  const { isDynamic } = useDynamicTheme();
  return isDynamic;
}

/**
 * Hook to get current color scheme
 */
export function useColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useDynamicTheme();
  return colorScheme;
}

/**
 * Hook to check if dynamic colors are available on this device
 */
export function useIsDynamicColorAvailable(): boolean {
  const { isAvailable } = useDynamicTheme();
  return isAvailable;
}
