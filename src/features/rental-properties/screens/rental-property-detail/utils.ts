// src/features/rental-properties/screens/rental-property-detail/utils.ts
// Utility functions for rental property detail screen

import { ToggleLeft, ToggleRight, Wrench } from 'lucide-react-native';
import type { PropertyStatus } from '../../types';

export { formatCurrency } from '@/lib/formatters';

export function formatRateType(rateType: string): string {
  // Database only has: nightly, weekly, monthly (no 'yearly')
  const suffixes: Record<string, string> = {
    nightly: '/night',
    weekly: '/week',
    monthly: '/mo',
  };
  return suffixes[rateType] || '/mo';
}

export function getStatusInfo(status: PropertyStatus): {
  label: string;
  variant: 'success' | 'secondary' | 'warning';
  icon: React.ElementType;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'success', icon: ToggleRight };
    case 'inactive':
      return { label: 'Inactive', variant: 'secondary', icon: ToggleLeft };
    case 'maintenance':
      return { label: 'Maintenance', variant: 'warning', icon: Wrench };
    default:
      return { label: status, variant: 'secondary', icon: ToggleLeft };
  }
}
