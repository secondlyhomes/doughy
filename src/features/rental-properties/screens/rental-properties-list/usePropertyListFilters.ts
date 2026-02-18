// src/features/rental-properties/screens/rental-properties-list/usePropertyListFilters.ts
// Hook for property list filtering and sorting logic

import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks';
import { RentalType } from '../../types';
import { DEFAULT_FILTERS } from './constants';
import type { RentalPropertyFilters, RentalPropertyWithRooms } from './types';

interface UsePropertyListFiltersOptions {
  properties: RentalPropertyWithRooms[];
}

export function usePropertyListFilters({ properties }: UsePropertyListFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<RentalType | 'all'>('all');
  const [advancedFilters, setAdvancedFilters] =
    useState<RentalPropertyFilters>(DEFAULT_FILTERS);

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();

    // Filter properties
    let filtered = properties.filter((property) => {
      // Search filter
      const matchesSearch =
        !query ||
        property.name?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.state?.toLowerCase().includes(query);

      // Quick rental type filter
      const matchesQuickFilter =
        activeFilter === 'all' || property.rental_type === activeFilter;

      // Advanced filters
      const matchesStatus =
        advancedFilters.status === 'all' ||
        property.status === advancedFilters.status;

      return matchesSearch && matchesQuickFilter && matchesStatus;
    });

    // Sort properties
    const { sortBy, sortOrder } = advancedFilters;
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'created_at') {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = aTime - bTime;
      } else if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'base_rate') {
        comparison = (a.base_rate || 0) - (b.base_rate || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [properties, debouncedSearchQuery, activeFilter, advancedFilters]);

  // Count active advanced filters
  const activeFiltersCount = [
    advancedFilters.status !== 'all',
    advancedFilters.sortBy !== 'created_at',
    advancedFilters.sortOrder !== 'desc',
  ].filter(Boolean).length;

  // Check if any filters are active (quick + advanced)
  const hasActiveFilters = activeFilter !== 'all' || activeFiltersCount > 0;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilter('all');
    setAdvancedFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    advancedFilters,
    setAdvancedFilters,
    filteredProperties,
    hasActiveFilters,
    activeFiltersCount,
    clearAllFilters,
  };
}
