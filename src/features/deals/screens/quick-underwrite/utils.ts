// src/features/deals/screens/quick-underwrite/utils.ts
// Utility functions for quick underwrite screen
//
// Uses shared formatters from @/lib/formatters where possible.

import { formatCurrency } from '@/lib/formatters';

/**
 * Format currency with sign prefix for profit/loss display.
 *
 * This is different from the shared formatCurrency because it:
 * - Returns '-' for zero values (for cleaner profit/loss tables)
 * - Explicitly shows negative sign for losses
 *
 * @example
 * formatCurrencyWithSign(50000)   // "$50,000"
 * formatCurrencyWithSign(-25000)  // "-$25,000"
 * formatCurrencyWithSign(0)       // "-"
 */
export function formatCurrencyWithSign(value: number): string {
  if (!value || value === 0) return '-';
  if (value < 0) {
    return `-${formatCurrency(Math.abs(value))}`;
  }
  return formatCurrency(value);
}

// Keep backward compatibility alias
export { formatCurrencyWithSign as formatCurrencyShort };
