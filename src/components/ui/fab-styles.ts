// src/components/ui/fab-styles.ts
// Shared FAB shadow and glow styling utilities

import { ViewStyle } from 'react-native';
import { ThemeColors } from '@/context/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';

export interface FABShadowOptions {
  /** Use primary color glow instead of black shadow. Default: true */
  useGlow?: boolean;
}

/**
 * Get standard FAB shadow/glow styling
 * Provides consistent shadow effects across all floating action buttons
 * Uses centralized shadow system from design-utils
 */
export function getFABShadowStyle(
  colors: ThemeColors,
  options: FABShadowOptions = {}
): ViewStyle {
  const { useGlow = true } = options;

  return getShadowStyle(colors, {
    size: 'lg',
    useThemeColor: useGlow,
  });
}
