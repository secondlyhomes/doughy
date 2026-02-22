// src/utils/format.ts
// Formatting utility functions for React Native
//
// NOTE: Core formatters have been moved to @/lib/formatters for consistency.
// This file re-exports those and adds utility-specific formatters.
//
// @see @/lib/formatters for: formatCurrency, formatDate, formatDateTime,
//   formatRelativeTime, formatDateRange, formatSquareFeet, formatStatus, etc.

// Re-export core formatters from shared library
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatDateRange,
  formatSquareFeet,
  formatStatus,
  getStatusBadgeVariant,
  getScoreColor,
  getRatingColor,
} from '@/lib/formatters';

// Alias for backward compatibility
export { formatDateTime as formatDatetime } from '@/lib/formatters';

/**
 * Format currency with cents (always shows 2 decimal places).
 *
 * Unlike formatCurrency which auto-detects decimals, this always shows cents.
 * Useful for invoices, transactions, and financial reports.
 *
 * @example
 * formatCurrencyWithCents(100)    // "$100.00"
 * formatCurrencyWithCents(99.5)   // "$99.50"
 */
export const formatCurrencyWithCents = (value: number | undefined): string => {
  if (value === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Format duration in seconds to mm:ss or hh:mm:ss.
 *
 * Useful for call durations, media playback, timers.
 *
 * @example
 * formatDuration(65)    // "01:05"
 * formatDuration(3665)  // "01:01:05"
 */
export const formatDuration = (seconds: number | undefined): string => {
  if (seconds === undefined || isNaN(seconds)) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Format timestamp to readable date and time (compact format for logs/history).
 *
 * @example
 * formatTimestamp(new Date())  // "Jan 15, 2024, 02:30 PM"
 */
export const formatTimestamp = (timestamp: string | number | Date | undefined): string => {
  if (!timestamp) return 'N/A';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format relative time with compact output (e.g., "2m ago", "3h ago").
 *
 * Different from formatRelativeTime which uses full words ("2 minutes ago").
 * Useful for compact UI elements like message timestamps, notifications.
 *
 * @example
 * formatRelativeTimeCompact(new Date(Date.now() - 120000))  // "2m ago"
 * formatRelativeTimeCompact(new Date(Date.now() - 7200000)) // "2h ago"
 */
export const formatRelativeTimeCompact = (date: Date | string | number): string => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return then.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format number with commas (no currency symbol).
 *
 * @example
 * formatNumber(1500000)  // "1,500,000"
 */
export const formatNumber = (value: number | undefined): string => {
  if (value === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Format percentage value.
 *
 * @example
 * formatPercentage(75.5)     // "75.5%"
 * formatPercentage(75.55, 2) // "75.55%"
 */
export const formatPercentage = (value: number | undefined, decimals = 1): string => {
  if (value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format phone number for display.
 *
 * Note: For more comprehensive phone formatting, consider using @/lib/twilio.
 *
 * @example
 * formatPhoneNumber('5551234567')   // "(555) 123-4567"
 * formatPhoneNumber('15551234567')  // "+1 (555) 123-4567"
 */
export const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Truncate text with ellipsis.
 *
 * @example
 * truncateText('Hello World', 8)  // "Hello..."
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};
