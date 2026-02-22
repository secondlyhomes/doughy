/**
 * Shared Formatting Utilities
 *
 * Centralized formatting functions to eliminate duplication across the codebase.
 * These functions were previously duplicated in 9+ files.
 *
 * @see docs/DESIGN_SYSTEM.md#shared-formatters
 * @see docs/UI_CONSISTENCY_GUIDE.md#shared-utilities
 */

import type { ThemeColors } from '@/contexts/ThemeContext';

// Badge variant types (matches Badge component)
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'inactive';

/**
 * Format a status string for display with proper capitalization.
 *
 * Handles snake_case, kebab-case, and camelCase inputs.
 *
 * @example
 * formatStatus('in_progress')  // "In Progress"
 * formatStatus('NEW')          // "New"
 * formatStatus('won-deal')     // "Won Deal"
 * formatStatus(null)           // "Unknown"
 * formatStatus(undefined)      // "Unknown"
 */
export function formatStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';

  return status
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get the appropriate Badge variant for a status string.
 *
 * Provides consistent color coding across the app:
 * - Green (success): new, open, won, completed, confirmed, active (positive)
 * - Blue (info): active, in_progress, contacted, pending actions
 * - Yellow (warning): pending, scheduled, requires_attention
 * - Red (destructive): lost, cancelled, declined, failed
 * - Gray (secondary): closed, archived, inactive
 *
 * @example
 * <Badge variant={getStatusBadgeVariant(lead.status)}>
 *   {formatStatus(lead.status)}
 * </Badge>
 */
export function getStatusBadgeVariant(
  status: string | null | undefined
): BadgeVariant {
  if (!status) return 'default';

  const normalizedStatus = status.toLowerCase().replace(/[_-]/g, '');

  // Positive/success states
  if (['new', 'open', 'won', 'completed', 'confirmed', 'approved'].includes(normalizedStatus)) {
    return 'success';
  }

  // Active/in-progress states
  if (['active', 'inprogress', 'contacted', 'processing', 'reviewing'].includes(normalizedStatus)) {
    return 'info';
  }

  // Warning/pending states
  if (['pending', 'scheduled', 'requiresattention', 'waiting', 'onhold'].includes(normalizedStatus)) {
    return 'warning';
  }

  // Negative/failed states
  if (['lost', 'cancelled', 'canceled', 'declined', 'failed', 'rejected'].includes(normalizedStatus)) {
    return 'destructive';
  }

  // Closed/archived states
  if (['closed', 'archived', 'inactive', 'expired'].includes(normalizedStatus)) {
    return 'secondary';
  }

  return 'default';
}

/**
 * Get theme-aware color for score displays.
 *
 * Color thresholds:
 * - Score >= 80: success (green) - high quality
 * - Score >= 50: warning (yellow) - medium quality
 * - Score < 50: mutedForeground (gray) - low quality
 * - Score undefined/null: mutedForeground (gray)
 *
 * @example
 * const scoreColor = getScoreColor(lead.score, colors);
 * <Text style={{ color: scoreColor }}>{lead.score} pts</Text>
 */
export function getScoreColor(
  score: number | null | undefined,
  colors: ThemeColors
): string {
  if (score === null || score === undefined) return colors.mutedForeground;
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.mutedForeground;
}

/**
 * Get theme-aware color for rating displays (1-5 scale).
 *
 * Color thresholds:
 * - Rating >= 4: success (green) - excellent
 * - Rating >= 3: warning (yellow) - average
 * - Rating < 3: destructive (red) - poor
 *
 * @example
 * const ratingColor = getRatingColor(vendor.rating, colors);
 * <Text style={{ color: ratingColor }}>{vendor.rating.toFixed(1)}</Text>
 */
export function getRatingColor(
  rating: number | null | undefined,
  colors: ThemeColors
): string {
  if (rating === null || rating === undefined) return colors.mutedForeground;
  if (rating >= 4) return colors.success;
  if (rating >= 3) return colors.warning;
  return colors.destructive;
}

// Note: formatPhoneNumber is available from '@/lib/twilio' or '@/lib'
// Do not duplicate here to maintain single source of truth.

/**
 * Format currency for display.
 *
 * @example
 * formatCurrency(450000)           // "$450,000"
 * formatCurrency(450000.5)         // "$450,000.50"
 * formatCurrency(450000, false)    // "450,000" (no symbol)
 */
export function formatCurrency(
  amount: number | null | undefined,
  includeSymbol: boolean = true
): string {
  if (amount === null || amount === undefined) return includeSymbol ? '$0' : '0';

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "Yesterday").
 *
 * @example
 * formatRelativeTime(new Date())                    // "Just now"
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';

  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  // For older dates, return formatted date
  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: then.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format a date range for display (e.g., booking dates).
 *
 * @example
 * formatDateRange(new Date('2024-01-15'), new Date('2024-01-18'))
 * // "Jan 15 - Jan 18, 2024"
 *
 * formatDateRange(new Date('2024-01-15'), new Date('2024-02-20'))
 * // "Jan 15 - Feb 20, 2024"
 *
 * formatDateRange(new Date('2024-12-28'), new Date('2025-01-03'))
 * // "Dec 28, 2024 - Jan 3, 2025"
 */
export function formatDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): string {
  if (!start || !end) return '';

  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;

  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

  if (sameYear) {
    // Same year: "Jan 15 - Jan 18, 2024" or "Jan 15 - 18, 2024"
    const startStr = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = sameMonth
      ? endDate.getDate().toString()
      : endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}, ${endDate.getFullYear()}`;
  }

  // Different years: "Dec 28, 2024 - Jan 3, 2025"
  const startStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} - ${endStr}`;
}

/**
 * Format square footage for display.
 *
 * @example
 * formatSquareFeet(1500)        // "1,500 sqft"
 * formatSquareFeet(1500, true)  // "1,500 sq ft"
 * formatSquareFeet(null)        // "— sqft"
 */
export function formatSquareFeet(
  sqft: number | null | undefined,
  useSpace: boolean = false
): string {
  const unit = useSpace ? 'sq ft' : 'sqft';
  if (sqft === null || sqft === undefined) return `— ${unit}`;
  return `${sqft.toLocaleString('en-US')} ${unit}`;
}

/**
 * Format a date for display.
 *
 * @example
 * formatDate(new Date('2024-01-15'))  // "Jan 15, 2024"
 * formatDate('2024-01-15')            // "Jan 15, 2024"
 * formatDate(null)                     // ""
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date with time for display.
 *
 * @example
 * formatDateTime(new Date('2024-01-15T14:30:00'))  // "Jan 15, 2024 at 2:30 PM"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
