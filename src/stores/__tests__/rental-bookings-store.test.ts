// src/stores/__tests__/rental-bookings-store.test.ts
// Comprehensive tests for the Rental Bookings Zustand store

import { act, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Supabase
const mockSupabaseData: Record<string, unknown[]> = {
  rental_bookings: [],
};

const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockGte = jest.fn();
const mockIn = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect.mockReturnThis(),
      insert: mockInsert.mockReturnThis(),
      update: mockUpdate.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      order: mockOrder.mockReturnThis(),
      single: mockSingle,
      gte: mockGte.mockReturnThis(),
      in: mockIn.mockReturnThis(),
    })),
  },
}));

import {
  useRentalBookingsStore,
  selectBookings,
  selectBookingsWithRelations,
  selectSelectedBooking,
  selectBookingById,
  selectUpcomingBookings,
  selectActiveBookings,
  BookingStatus,
} from '../rental-bookings-store';

describe('useRentalBookingsStore', () => {
  // ============================================
  // Test Setup
  // ============================================

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();

    // Reset store to initial state
    useRentalBookingsStore.setState({
      bookings: [],
      bookingsWithRelations: [],
      selectedBookingId: null,
      statusFilter: 'all',
      dateFilter: 'all',
      isLoading: false,
      isRefreshing: false,
      isSaving: false,
      error: null,
    });
  });

  // ============================================
  // Initial State Tests
  // ============================================

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const state = useRentalBookingsStore.getState();

      expect(state.bookings).toEqual([]);
      expect(state.bookingsWithRelations).toEqual([]);
      expect(state.selectedBookingId).toBeNull();
      expect(state.statusFilter).toBe('all');
      expect(state.dateFilter).toBe('all');
      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ============================================
  // Fetch Bookings Tests
  // ============================================

  describe('fetchBookings', () => {
    it('sets isLoading to true during fetch', async () => {
      mockOrder.mockReturnValueOnce(
        Promise.resolve({ data: [], error: null })
      );

      const { result } = renderHook(() => useRentalBookingsStore());

      // Start fetch without awaiting
      act(() => {
        result.current.fetchBookings();
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('populates bookings on successful fetch', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          user_id: 'user-1',
          contact_id: 'contact-1',
          property_id: 'property-1',
          room_id: null,
          booking_type: 'reservation',
          start_date: '2024-02-01',
          end_date: '2024-03-01',
          rate: 1500,
          rate_type: 'monthly',
          status: 'confirmed',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          contact: { id: 'contact-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '555-1234' },
          property: { id: 'property-1', name: 'Main Property', address: '123 Main St' },
          room: null,
        },
      ];

      mockOrder.mockReturnValueOnce(
        Promise.resolve({ data: mockBookings, error: null })
      );

      const { result } = renderHook(() => useRentalBookingsStore());

      await act(async () => {
        await result.current.fetchBookings();
      });

      expect(result.current.bookings).toHaveLength(1);
      expect(result.current.bookingsWithRelations).toHaveLength(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch error gracefully', async () => {
      mockOrder.mockReturnValueOnce(
        Promise.resolve({ data: null, error: { message: 'Database error' } })
      );

      const { result } = renderHook(() => useRentalBookingsStore());

      await act(async () => {
        await result.current.fetchBookings();
      });

      expect(result.current.error).toBe('Failed to fetch bookings');
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ============================================
  // Fetch Booking By ID Tests
  // ============================================

  describe('fetchBookingById', () => {
    it('returns booking and updates local state', async () => {
      const mockBooking = {
        id: 'booking-1',
        user_id: 'user-1',
        contact_id: 'contact-1',
        property_id: 'property-1',
        booking_type: 'reservation',
        start_date: '2024-02-01',
        status: 'confirmed',
        contact: { id: 'contact-1', first_name: 'Jane', last_name: 'Smith' },
      };

      mockSingle.mockResolvedValueOnce({ data: mockBooking, error: null });

      const { result } = renderHook(() => useRentalBookingsStore());

      let booking;
      await act(async () => {
        booking = await result.current.fetchBookingById('booking-1');
      });

      expect(booking).toEqual(mockBooking);
      expect(result.current.bookingsWithRelations).toContainEqual(mockBooking);
    });

    it('returns null on error', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      const { result } = renderHook(() => useRentalBookingsStore());

      let booking;
      await act(async () => {
        booking = await result.current.fetchBookingById('non-existent');
      });

      expect(booking).toBeNull();
      expect(result.current.error).toBe('Failed to fetch booking');
    });
  });

  // ============================================
  // Fetch Upcoming Bookings Tests
  // ============================================

  describe('fetchUpcomingBookings', () => {
    it('fetches bookings with future start dates', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          start_date: '2024-06-01',
          status: 'confirmed',
        },
      ];

      mockOrder.mockReturnValueOnce(
        Promise.resolve({ data: mockBookings, error: null })
      );

      const { result } = renderHook(() => useRentalBookingsStore());

      await act(async () => {
        await result.current.fetchUpcomingBookings();
      });

      expect(result.current.bookingsWithRelations).toEqual(mockBookings);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ============================================
  // Fetch Active Bookings Tests
  // ============================================

  describe('fetchActiveBookings', () => {
    it('fetches bookings with active status', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          status: 'active',
        },
      ];

      mockOrder.mockReturnValueOnce(
        Promise.resolve({ data: mockBookings, error: null })
      );

      const { result } = renderHook(() => useRentalBookingsStore());

      await act(async () => {
        await result.current.fetchActiveBookings();
      });

      expect(result.current.bookingsWithRelations).toEqual(mockBookings);
    });
  });

  // ============================================
  // Create Booking Tests
  // ============================================

  describe('createBooking', () => {
    it('creates booking and adds to local state', async () => {
      const newBooking = {
        id: 'new-booking-1',
        user_id: 'user-1',
        contact_id: 'contact-1',
        property_id: 'property-1',
        start_date: '2024-03-01',
        rate: 1200,
        rate_type: 'monthly',
        status: 'pending' as BookingStatus,
      };

      mockSingle.mockResolvedValueOnce({ data: newBooking, error: null });

      const { result } = renderHook(() => useRentalBookingsStore());

      let createdBooking;
      await act(async () => {
        createdBooking = await result.current.createBooking({
          contact_id: 'contact-1',
          property_id: 'property-1',
          start_date: '2024-03-01',
          rate: 1200,
          rate_type: 'monthly',
          status: 'pending',
        });
      });

      expect(createdBooking).toEqual(newBooking);
      expect(result.current.bookings).toContainEqual(newBooking);
      expect(result.current.isSaving).toBe(false);
    });

    it('returns null on create error', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });

      const { result } = renderHook(() => useRentalBookingsStore());

      let createdBooking;
      await act(async () => {
        createdBooking = await result.current.createBooking({
          contact_id: 'contact-1',
        });
      });

      expect(createdBooking).toBeNull();
      expect(result.current.error).toBe('Failed to create booking');
    });
  });

  // ============================================
  // Update Booking Tests
  // ============================================

  describe('updateBooking', () => {
    it('updates booking in local state', async () => {
      // Setup initial state with a booking
      useRentalBookingsStore.setState({
        bookings: [
          {
            id: 'booking-1',
            user_id: 'user-1',
            contact_id: 'contact-1',
            property_id: 'prop-1',
            room_id: null,
            booking_type: 'reservation',
            start_date: '2024-02-01',
            end_date: '2024-03-01',
            rate: 1500,
            rate_type: 'monthly',
            deposit: null,
            total_amount: null,
            status: 'pending',
            source: null,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            confirmed_at: null,
            cancelled_at: null,
          },
        ],
        bookingsWithRelations: [],
      });

      const updatedBooking = {
        id: 'booking-1',
        user_id: 'user-1',
        contact_id: 'contact-1',
        property_id: 'prop-1',
        room_id: null,
        booking_type: 'reservation',
        start_date: '2024-02-01',
        end_date: '2024-03-01',
        rate: 1600,
        rate_type: 'monthly',
        deposit: null,
        total_amount: null,
        status: 'confirmed',
        source: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        confirmed_at: null,
        cancelled_at: null,
      };

      mockSingle.mockResolvedValueOnce({ data: updatedBooking, error: null });

      const { result } = renderHook(() => useRentalBookingsStore());

      await act(async () => {
        await result.current.updateBooking('booking-1', { rate: 1600, status: 'confirmed' });
      });

      expect(result.current.bookings[0].rate).toBe(1600);
      expect(result.current.bookings[0].status).toBe('confirmed');
    });
  });

  // ============================================
  // Update Booking Status Tests
  // ============================================

  describe('updateBookingStatus', () => {
    it('updates status and sets confirmed_at for confirmed status', async () => {
      useRentalBookingsStore.setState({
        bookings: [
          {
            id: 'booking-1',
            user_id: 'user-1',
            contact_id: 'contact-1',
            property_id: 'prop-1',
            room_id: null,
            booking_type: 'reservation',
            start_date: '2024-02-01',
            end_date: null,
            rate: 1500,
            rate_type: 'monthly',
            deposit: null,
            total_amount: null,
            status: 'pending',
            source: null,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            confirmed_at: null,
            cancelled_at: null,
          },
        ],
        bookingsWithRelations: [],
      });

      mockEq.mockReturnValueOnce(Promise.resolve({ error: null }));

      const { result } = renderHook(() => useRentalBookingsStore());

      let success;
      await act(async () => {
        success = await result.current.updateBookingStatus('booking-1', 'confirmed');
      });

      expect(success).toBe(true);
      expect(result.current.bookings[0].status).toBe('confirmed');
      expect(result.current.bookings[0].confirmed_at).toBeTruthy();
    });

    it('sets cancelled_at for cancelled status', async () => {
      useRentalBookingsStore.setState({
        bookings: [
          {
            id: 'booking-1',
            user_id: 'user-1',
            contact_id: 'contact-1',
            property_id: 'prop-1',
            room_id: null,
            booking_type: 'reservation',
            start_date: '2024-02-01',
            end_date: null,
            rate: 1500,
            rate_type: 'monthly',
            deposit: null,
            total_amount: null,
            status: 'active',
            source: null,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            confirmed_at: null,
            cancelled_at: null,
          },
        ],
        bookingsWithRelations: [],
      });

      mockEq.mockReturnValueOnce(Promise.resolve({ error: null }));

      const { result } = renderHook(() => useRentalBookingsStore());

      await act(async () => {
        await result.current.updateBookingStatus('booking-1', 'cancelled');
      });

      expect(result.current.bookings[0].status).toBe('cancelled');
      expect(result.current.bookings[0].cancelled_at).toBeTruthy();
    });
  });

  // ============================================
  // Cancel Booking Tests
  // ============================================

  describe('cancelBooking', () => {
    it('calls updateBookingStatus with cancelled status', async () => {
      useRentalBookingsStore.setState({
        bookings: [
          {
            id: 'booking-1',
            user_id: 'user-1',
            contact_id: 'contact-1',
            property_id: 'prop-1',
            room_id: null,
            booking_type: 'reservation',
            start_date: '2024-02-01',
            end_date: null,
            rate: 1500,
            rate_type: 'monthly',
            deposit: null,
            total_amount: null,
            status: 'confirmed',
            source: null,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            confirmed_at: null,
            cancelled_at: null,
          },
        ],
        bookingsWithRelations: [],
      });

      mockEq.mockReturnValueOnce(Promise.resolve({ error: null }));

      const { result } = renderHook(() => useRentalBookingsStore());

      await act(async () => {
        await result.current.cancelBooking('booking-1');
      });

      expect(result.current.bookings[0].status).toBe('cancelled');
    });
  });

  // ============================================
  // Filter Tests
  // ============================================

  describe('Filters', () => {
    it('setSelectedBookingId updates selectedBookingId', () => {
      const { result } = renderHook(() => useRentalBookingsStore());

      act(() => {
        result.current.setSelectedBookingId('booking-123');
      });

      expect(result.current.selectedBookingId).toBe('booking-123');
    });

    it('setStatusFilter updates statusFilter', () => {
      const { result } = renderHook(() => useRentalBookingsStore());

      act(() => {
        result.current.setStatusFilter('confirmed');
      });

      expect(result.current.statusFilter).toBe('confirmed');
    });

    it('setDateFilter updates dateFilter', () => {
      const { result } = renderHook(() => useRentalBookingsStore());

      act(() => {
        result.current.setDateFilter('upcoming');
      });

      expect(result.current.dateFilter).toBe('upcoming');
    });
  });

  // ============================================
  // Clear Error Tests
  // ============================================

  describe('clearError', () => {
    it('clears error state', () => {
      useRentalBookingsStore.setState({ error: 'Some error' });

      const { result } = renderHook(() => useRentalBookingsStore());

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ============================================
  // Reset Tests
  // ============================================

  describe('reset', () => {
    it('resets store to initial state', () => {
      useRentalBookingsStore.setState({
        bookings: [{ id: 'booking-1' }] as any,
        selectedBookingId: 'booking-1',
        statusFilter: 'confirmed',
        error: 'Some error',
      });

      const { result } = renderHook(() => useRentalBookingsStore());

      act(() => {
        result.current.reset();
      });

      expect(result.current.bookings).toEqual([]);
      expect(result.current.selectedBookingId).toBeNull();
      expect(result.current.statusFilter).toBe('all');
      expect(result.current.error).toBeNull();
    });
  });

  // ============================================
  // Selector Tests
  // ============================================

  describe('Selectors', () => {
    const mockState = {
      bookings: [
        { id: 'booking-1', status: 'active', start_date: '2024-01-01' },
        { id: 'booking-2', status: 'confirmed', start_date: '2025-06-01' },
        { id: 'booking-3', status: 'pending', start_date: '2025-07-01' },
      ] as any,
      bookingsWithRelations: [
        { id: 'booking-1', status: 'active', start_date: '2024-01-01' },
        { id: 'booking-2', status: 'confirmed', start_date: '2025-06-01' },
        { id: 'booking-3', status: 'pending', start_date: '2025-07-01' },
      ] as any,
      selectedBookingId: 'booking-1',
      statusFilter: 'all' as const,
      dateFilter: 'all' as const,
      isLoading: false,
      isRefreshing: false,
      isSaving: false,
      error: null,
    };

    it('selectBookings returns all bookings', () => {
      const result = selectBookings(mockState);
      expect(result).toHaveLength(3);
    });

    it('selectBookingsWithRelations returns bookings with relations', () => {
      const result = selectBookingsWithRelations(mockState);
      expect(result).toHaveLength(3);
    });

    it('selectSelectedBooking returns selected booking', () => {
      const result = selectSelectedBooking(mockState);
      expect(result?.id).toBe('booking-1');
    });

    it('selectBookingById returns booking by id', () => {
      const result = selectBookingById('booking-2')(mockState);
      expect(result?.id).toBe('booking-2');
    });

    it('selectActiveBookings returns only active bookings', () => {
      const result = selectActiveBookings(mockState);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('booking-1');
    });

    it('selectUpcomingBookings returns future confirmed/pending bookings', () => {
      const result = selectUpcomingBookings(mockState);
      // Bookings with future start_date and confirmed/pending status
      expect(result.every((b) => ['confirmed', 'pending'].includes(b.status))).toBe(true);
    });
  });
});
