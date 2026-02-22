// src/features/portfolio/screens/portfolio-property-detail/portfolio-property-detail-types.ts

import { useThemeColors } from '@/contexts/ThemeContext';

export type TabValue = 'performance' | 'financials' | 'debt' | 'valuations' | 'docs';

// UUID validation regex
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ThemeColors = ReturnType<typeof useThemeColors>;

// Format currency helper
export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}
