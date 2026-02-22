// src/features/rental-bookings/screens/useBookingsFilters.ts
// Filter state management and filtering logic for the bookings list

import { useState, useMemo, useCallback } from 'react';
import { BookingWithRelations } from '../types';
import { BookingFilters, defaultFilters } from './bookings-list-constants';

export function useBookingsFilters(filteredBookings: BookingWithRelations[]) {
  const [filters, setFilters] = useState<BookingFilters>(defaultFilters);

  // Apply additional filters
  const displayBookings = useMemo(() => {
    let result = filteredBookings;
    const today = new Date().toISOString().split('T')[0];

    // Apply quick filter
    switch (filters.quickFilter) {
      case 'upcoming':
        result = result.filter(
          (b) => b.start_date >= today && ['confirmed', 'pending'].includes(b.status)
        );
        break;
      case 'active':
        result = result.filter((b) => b.status === 'active');
        break;
      case 'pending':
        result = result.filter((b) => ['inquiry', 'pending'].includes(b.status));
        break;
      case 'completed':
        result = result.filter((b) => b.status === 'completed' || b.status === 'cancelled');
        break;
    }

    // Apply status filter (if not 'all' and different from quick filter)
    if (filters.status !== 'all') {
      result = result.filter((b) => b.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      result = result.filter((b) => b.booking_type === filters.type);
    }

    return result;
  }, [filteredBookings, filters]);

  // Check if any advanced filters are active
  const hasActiveFilters =
    filters.quickFilter !== 'all' || filters.status !== 'all' || filters.type !== 'all';

  const handleClearAllFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    setFilters,
    displayBookings,
    hasActiveFilters,
    handleClearAllFilters,
  };
}
