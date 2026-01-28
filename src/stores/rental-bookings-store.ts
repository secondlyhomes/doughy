// src/stores/rental-bookings-store.ts
// Zustand store for Landlord platform bookings management
// Part of Zone 3: UI scaffolding for the Doughy architecture refactor

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Booking types based on Contract A from architecture doc
// These must match the database enum values exactly
export type BookingType = 'reservation' | 'lease';
// Database does NOT have 'hold' status - remove it
export type BookingStatus = 'inquiry' | 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
// Database only has: nightly, weekly, monthly (no 'yearly')
export type RateType = 'nightly' | 'weekly' | 'monthly';

export interface Booking {
  id: string;
  user_id: string;
  // contact_id is NOT NULL in database, so it must be required
  contact_id: string;
  property_id: string;
  room_id: string | null;
  booking_type: BookingType;
  start_date: string;
  end_date: string | null;
  rate: number;
  rate_type: RateType;
  deposit: number | null;
  total_amount: number | null;
  status: BookingStatus;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
}

// Booking with related data for display
export interface BookingWithRelations extends Booking {
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  property?: {
    id: string;
    name: string;
    address: string;
  } | null;
  room?: {
    id: string;
    name: string;
  } | null;
}

export interface RentalBookingsState {
  // Data
  bookings: Booking[];
  bookingsWithRelations: BookingWithRelations[];
  selectedBookingId: string | null;

  // Filters
  statusFilter: BookingStatus | 'all';
  dateFilter: 'upcoming' | 'past' | 'active' | 'all';

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchBookings: () => Promise<void>;
  fetchBookingById: (id: string) => Promise<BookingWithRelations | null>;
  fetchBookingsByProperty: (propertyId: string) => Promise<void>;
  fetchUpcomingBookings: () => Promise<void>;
  fetchActiveBookings: () => Promise<void>;
  createBooking: (data: Partial<Booking>) => Promise<Booking | null>;
  updateBooking: (id: string, data: Partial<Booking>) => Promise<Booking | null>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<boolean>;
  cancelBooking: (id: string) => Promise<boolean>;
  setSelectedBookingId: (id: string | null) => void;
  setStatusFilter: (status: BookingStatus | 'all') => void;
  setDateFilter: (filter: 'upcoming' | 'past' | 'active' | 'all') => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  bookings: [],
  bookingsWithRelations: [],
  selectedBookingId: null,
  statusFilter: 'all' as const,
  dateFilter: 'all' as const,
  isLoading: false,
  isRefreshing: false,
  isSaving: false,
  error: null,
};

export const useRentalBookingsStore = create<RentalBookingsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchBookings: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('rental_bookings')
            .select(`
              *,
              contact:crm_contacts(id, first_name, last_name, email, phone),
              property:rental_properties(id, name, address),
              room:rental_rooms!rental_bookings_room_id_fkey(id, name)
            `)
            .order('start_date', { ascending: true });

          if (error) throw error;

          const bookings = (data || []) as BookingWithRelations[];

          set({
            bookings: bookings.map(({ contact, property, room, ...b }) => b),
            bookingsWithRelations: bookings,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch bookings';
          set({ error: message, isLoading: false });
        }
      },

      fetchBookingById: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('rental_bookings')
            .select(`
              *,
              contact:crm_contacts(id, first_name, last_name, email, phone),
              property:rental_properties(id, name, address),
              room:rental_rooms!rental_bookings_room_id_fkey(id, name)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;

          const booking = data as BookingWithRelations;

          // Update the booking in local state
          set((state) => ({
            bookingsWithRelations: state.bookingsWithRelations.some((b) => b.id === id)
              ? state.bookingsWithRelations.map((b) => (b.id === id ? booking : b))
              : [...state.bookingsWithRelations, booking],
          }));

          return booking;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch booking';
          set({ error: message });
          return null;
        }
      },

      fetchBookingsByProperty: async (propertyId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('rental_bookings')
            .select(`
              *,
              contact:crm_contacts(id, first_name, last_name, email, phone),
              room:rental_rooms!rental_bookings_room_id_fkey(id, name)
            `)
            .eq('property_id', propertyId)
            .order('start_date', { ascending: true });

          if (error) throw error;

          set({ isLoading: false });
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch bookings';
          set({ error: message, isLoading: false });
        }
      },

      fetchUpcomingBookings: async () => {
        set({ isLoading: true, error: null });
        try {
          const today = new Date().toISOString().split('T')[0];

          const { data, error } = await supabase
            .from('rental_bookings')
            .select(`
              *,
              contact:crm_contacts(id, first_name, last_name, email, phone),
              property:rental_properties(id, name, address),
              room:rental_rooms!rental_bookings_room_id_fkey(id, name)
            `)
            .gte('start_date', today)
            .in('status', ['confirmed', 'pending'])
            .order('start_date', { ascending: true });

          if (error) throw error;

          set({
            bookingsWithRelations: (data || []) as BookingWithRelations[],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch upcoming bookings';
          set({ error: message, isLoading: false });
        }
      },

      fetchActiveBookings: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('rental_bookings')
            .select(`
              *,
              contact:crm_contacts(id, first_name, last_name, email, phone),
              property:rental_properties(id, name, address),
              room:rental_rooms!rental_bookings_room_id_fkey(id, name)
            `)
            .eq('status', 'active')
            .order('start_date', { ascending: true });

          if (error) throw error;

          set({
            bookingsWithRelations: (data || []) as BookingWithRelations[],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch active bookings';
          set({ error: message, isLoading: false });
        }
      },

      createBooking: async (data: Partial<Booking>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: newBooking, error } = await supabase
            .from('rental_bookings')
            .insert(data)
            .select()
            .single();

          if (error) throw error;

          const booking = newBooking as Booking;

          set((state) => ({
            bookings: [...state.bookings, booking],
            isSaving: false,
          }));

          return booking;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create booking';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      updateBooking: async (id: string, data: Partial<Booking>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: updatedBooking, error } = await supabase
            .from('rental_bookings')
            .update(data)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const booking = updatedBooking as Booking;

          set((state) => ({
            bookings: state.bookings.map((b) => (b.id === id ? booking : b)),
            bookingsWithRelations: state.bookingsWithRelations.map((b) =>
              b.id === id ? { ...b, ...booking } : b
            ),
            isSaving: false,
          }));

          return booking;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update booking';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      updateBookingStatus: async (id: string, status: BookingStatus) => {
        set({ isSaving: true, error: null });
        try {
          const updateData: Partial<Booking> = {
            status,
            updated_at: new Date().toISOString(),
          };

          // Add confirmation timestamp
          if (status === 'confirmed') {
            updateData.confirmed_at = new Date().toISOString();
          }

          // Add cancellation timestamp
          if (status === 'cancelled') {
            updateData.cancelled_at = new Date().toISOString();
          }

          const { error } = await supabase
            .from('rental_bookings')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            bookings: state.bookings.map((b) =>
              b.id === id ? { ...b, ...updateData } : b
            ),
            bookingsWithRelations: state.bookingsWithRelations.map((b) =>
              b.id === id ? { ...b, ...updateData } : b
            ),
            isSaving: false,
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update booking status';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      cancelBooking: async (id: string) => {
        return get().updateBookingStatus(id, 'cancelled');
      },

      setSelectedBookingId: (id: string | null) => {
        set({ selectedBookingId: id });
      },

      setStatusFilter: (status: BookingStatus | 'all') => {
        set({ statusFilter: status });
      },

      setDateFilter: (filter: 'upcoming' | 'past' | 'active' | 'all') => {
        set({ dateFilter: filter });
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'rental-bookings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        selectedBookingId: state.selectedBookingId,
      }),
    }
  )
);

// Selectors
export const selectBookings = (state: RentalBookingsState) => state.bookings;
export const selectBookingsWithRelations = (state: RentalBookingsState) => state.bookingsWithRelations;
export const selectSelectedBooking = (state: RentalBookingsState) =>
  state.bookingsWithRelations.find((b) => b.id === state.selectedBookingId);
export const selectBookingById = (id: string) => (state: RentalBookingsState) =>
  state.bookingsWithRelations.find((b) => b.id === id);
export const selectUpcomingBookings = (state: RentalBookingsState) => {
  const today = new Date().toISOString().split('T')[0];
  // 'hold' is not a valid database status - only filter by valid statuses
  return state.bookingsWithRelations.filter(
    (b) => b.start_date >= today && ['confirmed', 'pending'].includes(b.status)
  );
};
export const selectActiveBookings = (state: RentalBookingsState) =>
  state.bookingsWithRelations.filter((b) => b.status === 'active');
