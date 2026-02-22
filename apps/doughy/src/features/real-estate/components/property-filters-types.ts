// src/features/real-estate/components/property-filters-types.ts
// Shared types and constants for PropertyFiltersSheet

import { PropertyType, PropertyConstants } from '../types';
import { PropertyFilters, SortOption } from '../hooks/usePropertyFilters';

export interface PropertyFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onReset: () => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

// Common property types to show (most used)
export const COMMON_PROPERTY_TYPES = [
  PropertyType.SINGLE_FAMILY,
  PropertyType.MULTI_FAMILY,
  PropertyType.CONDO,
  PropertyType.TOWNHOUSE,
  PropertyType.DUPLEX,
  PropertyType.LAND,
];
