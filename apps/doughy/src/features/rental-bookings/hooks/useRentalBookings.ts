// src/features/rental-bookings/hooks/useRentalBookings.ts
// Hooks for fetching and managing rental bookings
// Uses the rental-bookings-store for state management

import { useCallback, useEffect, useMemo } from 'react';
import {
  useRentalBookingsStore,
  BookingWithRelations,
  BookingStatus,
  BookingType,
  Booking,
} from '@/stores/rental-bookings-store';

// ============================================
// Main Bookings Hook
// ============================================

export interface UseRentalBookingsOptions {
  /** Auto-fetch bookings on mount */
  autoFetch?: boolean;
  /** Filter by property ID */
  propertyId?: string;
  /** Filter by status */
  statusFilter?: BookingStatus | 'all';
  /** Filter by booking type */
  typeFilter?: BookingType | 'all';
  /** Search query for filtering */
  searchQuery?: string;
}

export interface UseRentalBookingsReturn {
  /** All bookings with relations */
  bookings: BookingWithRelations[];
  /** Filtered bookings based on options */
  filteredBookings: BookingWithRelations[];
  /** Loading state */
  isLoading: boolean;
  /** Refreshing state */
  isRefreshing: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch bookings */
  refetch: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

export function useRentalBookings(options: UseRentalBookingsOptions = {}): UseRentalBookingsReturn {
  const {
    autoFetch = true,
    propertyId,
    statusFilter = 'all',
    typeFilter = 'all',
    searchQuery = '',
  } = options;

  const {
    bookingsWithRelations,
    isLoading,
    isRefreshing,
    error,
    fetchBookings,
    clearError,
  } = useRentalBookingsStore();

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchBookings();
    }
  }, [autoFetch, fetchBookings]);

  // Filter bookings based on options
  const filteredBookings = useMemo(() => {
    let result = bookingsWithRelations;

    // Filter by property ID
    if (propertyId) {
      result = result.filter((b) => b.property_id === propertyId);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Filter by booking type
    if (typeFilter !== 'all') {
      result = result.filter((b) => b.booking_type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((b) => {
        const guestName = `${b.contact?.first_name || ''} ${b.contact?.last_name || ''}`.trim().toLowerCase();
        const propertyName = b.property?.name?.toLowerCase() || '';
        const propertyAddress = b.property?.address?.toLowerCase() || '';
        const roomName = b.room?.name?.toLowerCase() || '';

        return (
          guestName.includes(query) ||
          propertyName.includes(query) ||
          propertyAddress.includes(query) ||
          roomName.includes(query)
        );
      });
    }

    // Sort by start_date (most recent first for upcoming, or upcoming first)
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateA - dateB; // Ascending (earliest first)
    });

    return result;
  }, [bookingsWithRelations, propertyId, statusFilter, typeFilter, searchQuery]);

  const refetch = useCallback(async () => {
    await fetchBookings();
  }, [fetchBookings]);

  return {
    bookings: bookingsWithRelations,
    filteredBookings,
    isLoading,
    isRefreshing,
    error,
    refetch,
    clearError,
  };
}

// ============================================
// Single Booking Hook
// ============================================

export interface UseBookingReturn {
  /** The booking data */
  booking: BookingWithRelations | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch the booking */
  refetch: () => Promise<void>;
}

export function useBooking(bookingId: string | null): UseBookingReturn {
  const { bookingsWithRelations, fetchBookingById, isLoading, error } = useRentalBookingsStore();

  const booking = useMemo(() => {
    if (!bookingId) return null;
    return bookingsWithRelations.find((b) => b.id === bookingId) || null;
  }, [bookingsWithRelations, bookingId]);

  const refetch = useCallback(async () => {
    if (bookingId) {
      await fetchBookingById(bookingId);
    }
  }, [bookingId, fetchBookingById]);

  // Fetch on mount if not in store
  useEffect(() => {
    if (bookingId && !booking) {
      fetchBookingById(bookingId);
    }
  }, [bookingId, booking, fetchBookingById]);

  return {
    booking,
    isLoading,
    error,
    refetch,
  };
}

// ============================================
// Booking Mutations Hook
// ============================================

export interface UseBookingMutationsReturn {
  /** Create a new booking */
  createBooking: (data: Partial<Booking>) => Promise<Booking | null>;
  /** Update an existing booking */
  updateBooking: (id: string, data: Partial<Booking>) => Promise<Booking | null>;
  /** Update booking status */
  updateStatus: (id: string, status: BookingStatus) => Promise<boolean>;
  /** Cancel a booking */
  cancelBooking: (id: string) => Promise<boolean>;
  /** Saving state */
  isSaving: boolean;
  /** Error message if any */
  error: string | null;
}

export function useBookingMutations(): UseBookingMutationsReturn {
  const {
    createBooking,
    updateBooking,
    updateBookingStatus,
    cancelBooking,
    isSaving,
    error,
  } = useRentalBookingsStore();

  return {
    createBooking,
    updateBooking,
    updateStatus: updateBookingStatus,
    cancelBooking,
    isSaving,
    error,
  };
}

// ============================================
// Upcoming Bookings Hook
// ============================================

export function useUpcomingBookings() {
  const { bookingsWithRelations, fetchUpcomingBookings, isLoading, error } = useRentalBookingsStore();

  useEffect(() => {
    fetchUpcomingBookings();
  }, [fetchUpcomingBookings]);

  const upcomingBookings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return bookingsWithRelations.filter(
      (b) => b.start_date >= today && ['confirmed', 'pending'].includes(b.status)
    );
  }, [bookingsWithRelations]);

  return {
    bookings: upcomingBookings,
    isLoading,
    error,
    refetch: fetchUpcomingBookings,
  };
}

// ============================================
// Active Bookings Hook
// ============================================

export function useActiveBookings() {
  const { bookingsWithRelations, fetchActiveBookings, isLoading, error } = useRentalBookingsStore();

  useEffect(() => {
    fetchActiveBookings();
  }, [fetchActiveBookings]);

  const activeBookings = useMemo(() => {
    return bookingsWithRelations.filter((b) => b.status === 'active');
  }, [bookingsWithRelations]);

  return {
    bookings: activeBookings,
    isLoading,
    error,
    refetch: fetchActiveBookings,
  };
}

// ============================================
// Bookings by Property Hook
// ============================================

export function usePropertyBookings(propertyId: string | null) {
  const { bookingsWithRelations, fetchBookingsByProperty, isLoading, error } = useRentalBookingsStore();

  useEffect(() => {
    if (propertyId) {
      fetchBookingsByProperty(propertyId);
    }
  }, [propertyId, fetchBookingsByProperty]);

  const propertyBookings = useMemo(() => {
    if (!propertyId) return [];
    return bookingsWithRelations.filter((b) => b.property_id === propertyId);
  }, [bookingsWithRelations, propertyId]);

  return {
    bookings: propertyBookings,
    isLoading,
    error,
    refetch: () => propertyId ? fetchBookingsByProperty(propertyId) : Promise.resolve(),
  };
}

export default useRentalBookings;
