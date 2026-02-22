// src/features/rental-properties/screens/rental-properties-list/constants.ts
// Configuration constants for rental properties list filters

import type {
  RentalPropertyFilters,
  QuickFilterOption,
  StatusFilterOption,
  SortOption,
} from './types';

// Default filter state
export const DEFAULT_FILTERS: RentalPropertyFilters = {
  rentalType: 'all',
  status: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

// Quick filter tabs for rental type
export const QUICK_FILTERS: QuickFilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'str', label: 'STR' },
  { key: 'mtr', label: 'MTR' },
  { key: 'ltr', label: 'LTR' },
];

// Status filter options
export const STATUS_OPTIONS: StatusFilterOption[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
];

// Sort by options
export const SORT_OPTIONS: SortOption[] = [
  { label: 'Date Added', value: 'created_at' },
  { label: 'Name', value: 'name' },
  { label: 'Rate', value: 'base_rate' },
];

// Badge config by rental type for list items
export const RENTAL_TYPE_BADGES = {
  str: { label: 'STR', variant: 'success' as const },
  mtr: { label: 'MTR', variant: 'info' as const },
  ltr: { label: 'LTR', variant: 'secondary' as const },
} as const;
