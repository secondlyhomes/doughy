// src/features/rental-bookings/screens/booking-detail/utils.ts
// Utility functions for booking detail screen

import type { RateType } from '../../types';
import { formatCurrency } from '@/lib/formatters';

export { formatCurrency, formatDate } from '@/lib/formatters';

export function formatRate(rate: number, rateType: RateType): string {
  const amount = formatCurrency(rate);
  const suffix: Record<RateType, string> = {
    nightly: '/night',
    weekly: '/week',
    monthly: '/mo',
  };
  return `${amount}${suffix[rateType]}`;
}

export function calculateDuration(startDate: string, endDate: string | null): string {
  if (!endDate) return 'Ongoing';

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return '1 night';
  if (diffDays < 7) return `${diffDays} nights`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return days > 0 ? `${weeks}w ${days}d` : `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  return remainingDays > 0
    ? `${months}mo ${remainingDays}d`
    : `${months} month${months > 1 ? 's' : ''}`;
}
