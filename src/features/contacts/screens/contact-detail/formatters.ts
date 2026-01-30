// src/features/contacts/screens/contact-detail/formatters.ts
// Formatting functions for contact display

import type { ThemeColors } from '@/contexts/ThemeContext';
import type { CrmContactType, CrmContactStatus, CrmContactSource } from '../../types';

export function formatContactType(type: CrmContactType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function getContactTypeBadgeVariant(
  type: CrmContactType
): 'success' | 'info' | 'warning' | 'default' {
  switch (type) {
    case 'lead':
      return 'info';
    case 'guest':
      return 'success';
    case 'tenant':
      return 'warning';
    case 'vendor':
      return 'default';
    default:
      return 'default';
  }
}

export function formatStatus(status: CrmContactStatus | null): string {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatSource(source: CrmContactSource): string {
  const sourceMap: Record<CrmContactSource, string> = {
    furnishedfinder: 'Furnished Finder',
    airbnb: 'Airbnb',
    turbotenant: 'TurboTenant',
    zillow: 'Zillow',
    facebook: 'Facebook',
    whatsapp: 'WhatsApp',
    direct: 'Direct',
    referral: 'Referral',
    craigslist: 'Craigslist',
    other: 'Other',
  };
  return sourceMap[source] || source.charAt(0).toUpperCase() + source.slice(1);
}

export function getScoreColor(score: number | null, colors: ThemeColors): string {
  if (!score) return colors.mutedForeground;
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.destructive;
}
