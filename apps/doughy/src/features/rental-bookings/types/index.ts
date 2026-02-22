// src/features/rental-bookings/types/index.ts
// Re-export types from the rental-bookings store

export type {
  Booking,
  BookingWithRelations,
  BookingType,
  BookingStatus,
  RateType,
  RentalBookingsState,
} from '@/stores/rental-bookings-store';

// Import selectors for convenience
export {
  selectBookings,
  selectBookingsWithRelations,
  selectSelectedBooking,
  selectBookingById,
  selectUpcomingBookings,
  selectActiveBookings,
} from '@/stores/rental-bookings-store';
