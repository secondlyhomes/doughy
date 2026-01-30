// src/features/deals/screens/quick-underwrite/utils.ts
// Utility functions for quick underwrite screen

/**
 * Format currency with sign prefix
 */
export function formatCurrencyShort(value: number): string {
  if (!value || value === 0) return '-';
  const prefix = value < 0 ? '-' : '';
  return `${prefix}$${Math.abs(value).toLocaleString()}`;
}
