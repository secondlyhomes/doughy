// src/features/contacts/screens/contact-detail/formatters.ts
// Formatting functions for contact display
// Re-exports shared formatters + contact-specific formatters

import type { CrmContactType, CrmContactSource } from '../../types';

// Re-export shared formatters for backwards compatibility
// These are now centralized in @/lib/formatters
export { formatStatus, getScoreColor } from '@/lib/formatters';

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
