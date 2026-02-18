/**
 * theme-generation.ts
 *
 * Theme component helpers for Material You
 */

import type {
  MaterialYouColors,
  ButtonVariant,
  ButtonColors,
  CardColors,
  InputColors,
  NavigationColors,
} from '../types';

// Re-export fallback colors for convenience
export {
  FALLBACK_COLORS_LIGHT,
  FALLBACK_COLORS_DARK,
  getFallbackColors,
} from './fallback-colors';

/**
 * Theme component helpers
 */
export const ThemeComponents = {
  /**
   * Get button colors
   */
  getButtonColors(colors: MaterialYouColors, variant: ButtonVariant = 'filled'): ButtonColors {
    switch (variant) {
      case 'filled':
        return {
          background: colors.primary,
          text: colors.onPrimary,
          border: 'transparent',
        };
      case 'tonal':
        return {
          background: colors.secondaryContainer,
          text: colors.onSecondaryContainer,
          border: 'transparent',
        };
      case 'outlined':
        return {
          background: 'transparent',
          text: colors.primary,
          border: colors.outline,
        };
      case 'text':
        return {
          background: 'transparent',
          text: colors.primary,
          border: 'transparent',
        };
    }
  },

  /**
   * Get card colors
   */
  getCardColors(colors: MaterialYouColors, elevated: boolean = false): CardColors {
    return {
      background: elevated ? colors.surfaceContainerHigh : colors.surface,
      text: colors.onSurface,
      border: colors.outlineVariant,
    };
  },

  /**
   * Get input colors
   */
  getInputColors(colors: MaterialYouColors): InputColors {
    return {
      background: colors.surfaceContainerHighest,
      text: colors.onSurface,
      placeholder: colors.onSurfaceVariant,
      border: colors.outline,
      borderFocused: colors.primary,
      label: colors.onSurfaceVariant,
    };
  },

  /**
   * Get navigation colors
   */
  getNavigationColors(colors: MaterialYouColors): NavigationColors {
    return {
      background: colors.surfaceContainer,
      text: colors.onSurface,
      textActive: colors.onSecondaryContainer,
      indicator: colors.secondaryContainer,
      icon: colors.onSurfaceVariant,
      iconActive: colors.onSecondaryContainer,
    };
  },
};
