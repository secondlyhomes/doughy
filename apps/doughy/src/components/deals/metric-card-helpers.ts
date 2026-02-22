// src/components/deals/metric-card-helpers.ts
// Helper functions for the MetricCard component

import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { ConfidenceLevel } from './metric-card-types';

export function getConfidenceColors(confidence: ConfidenceLevel, colors: ReturnType<typeof useThemeColors>) {
  switch (confidence) {
    case 'high':
      return {
        bg: withOpacity(colors.success, 'subtle'),
        border: withOpacity(colors.success, 'light'),
        indicator: colors.success,
      };
    case 'medium':
      return {
        bg: withOpacity(colors.warning, 'subtle'),
        border: withOpacity(colors.warning, 'light'),
        indicator: colors.warning,
      };
    case 'low':
      return {
        bg: withOpacity(colors.destructive, 'subtle'),
        border: withOpacity(colors.destructive, 'light'),
        indicator: colors.destructive,
      };
    default:
      return {
        bg: colors.card,
        border: colors.border,
        indicator: colors.mutedForeground,
      };
  }
}

export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
  }
}

export function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
}
