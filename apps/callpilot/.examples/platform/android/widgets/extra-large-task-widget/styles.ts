/**
 * ExtraLargeTaskWidget Styles
 *
 * Style constants for the 4x4 widget layout.
 * Note: Android widgets use inline style objects, not StyleSheet.
 */

import { WidgetTheme } from '../types';

/**
 * Creates the container style for the widget root
 */
export function getContainerStyle(theme: WidgetTheme) {
  return {
    height: 'match_parent' as const,
    width: 'match_parent' as const,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'column' as const,
  };
}

/**
 * Layout constants used across components
 */
export const LAYOUT = {
  containerPadding: 20,
  borderRadius: 16,
  sectionMarginBottom: 20,
  gap: {
    small: 8,
    medium: 10,
    large: 16,
  },
} as const;

/**
 * Typography constants
 */
export const TYPOGRAPHY = {
  title: {
    fontSize: 22,
    fontWeight: 'bold' as const,
  },
  subtitle: {
    fontSize: 13,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  button: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  timestamp: {
    fontSize: 10,
  },
  moreText: {
    fontSize: 12,
  },
} as const;

/**
 * Progress bar dimensions
 */
export const PROGRESS_BAR = {
  height: 10,
  borderRadius: 5,
} as const;

/**
 * Button dimensions
 */
export const BUTTON = {
  paddingVertical: 12,
  borderRadius: 10,
} as const;

/**
 * Static color values (non-theme)
 */
export const COLORS = {
  warning: '#F59E0B',
} as const;
