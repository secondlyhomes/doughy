// src/features/real-estate/hooks/usePropertyFilters.ts
// Hook for managing property filters and sorting state

import { useState, useCallback, useMemo } from 'react';
import { PropertyStatus, PropertyType } from '../types';

export type SortOption =
  | 'created_desc'
  | 'created_asc'
  | 'price_desc'
  | 'price_asc'
  | 'arv_desc'
  | 'arv_asc';

export interface PropertyFilters {
  status: PropertyStatus[];
  propertyType: PropertyType[];
  priceMin: number | null;
  priceMax: number | null;
  arvMin: number | null;
  arvMax: number | null;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  bathroomsMin: number | null;
  bathroomsMax: number | null;
  city: string;
  state: string;
}

export const DEFAULT_FILTERS: PropertyFilters = {
  status: [],
  propertyType: [],
  priceMin: null,
  priceMax: null,
  arvMin: null,
  arvMax: null,
  bedroomsMin: null,
  bedroomsMax: null,
  bathroomsMin: null,
  bathroomsMax: null,
  city: '',
  state: '',
};

export const SORT_OPTIONS = [
  { value: 'created_desc' as SortOption, label: 'Newest First' },
  { value: 'created_asc' as SortOption, label: 'Oldest First' },
  { value: 'price_desc' as SortOption, label: 'Price: High to Low' },
  { value: 'price_asc' as SortOption, label: 'Price: Low to High' },
  { value: 'arv_desc' as SortOption, label: 'ARV: High to Low' },
  { value: 'arv_asc' as SortOption, label: 'ARV: Low to High' },
];

interface UsePropertyFiltersReturn {
  filters: PropertyFilters;
  sortBy: SortOption;
  activeFilterCount: number;
  setFilters: (filters: PropertyFilters) => void;
  updateFilter: <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => void;
  setSortBy: (sortBy: SortOption) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  toggleStatus: (status: PropertyStatus) => void;
  togglePropertyType: (type: PropertyType) => void;
}

export function usePropertyFilters(initialFilters: Partial<PropertyFilters> = {}): UsePropertyFiltersReturn {
  const [filters, setFiltersState] = useState<PropertyFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');

  const setFilters = useCallback((newFilters: PropertyFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const toggleStatus = useCallback((status: PropertyStatus) => {
    setFiltersState(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  }, []);

  const togglePropertyType = useCallback((type: PropertyType) => {
    setFiltersState(prev => ({
      ...prev,
      propertyType: prev.propertyType.includes(type)
        ? prev.propertyType.filter(t => t !== type)
        : [...prev.propertyType, type],
    }));
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.propertyType.length > 0) count++;
    if (filters.priceMin !== null || filters.priceMax !== null) count++;
    if (filters.arvMin !== null || filters.arvMax !== null) count++;
    if (filters.bedroomsMin !== null || filters.bedroomsMax !== null) count++;
    if (filters.bathroomsMin !== null || filters.bathroomsMax !== null) count++;
    if (filters.city.trim()) count++;
    if (filters.state.trim()) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    sortBy,
    activeFilterCount,
    setFilters,
    updateFilter,
    setSortBy,
    resetFilters,
    hasActiveFilters,
    toggleStatus,
    togglePropertyType,
  };
}
