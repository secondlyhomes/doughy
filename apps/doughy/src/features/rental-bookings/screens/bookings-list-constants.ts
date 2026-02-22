// src/features/rental-bookings/screens/bookings-list-constants.ts
// Filter options and types for the bookings list screen

import { BookingStatus, BookingType } from '../types';

// ============================================
// Filter Options
// ============================================

export const STATUS_OPTIONS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Inquiry', value: 'inquiry' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const TYPE_OPTIONS: { label: string; value: BookingType | 'all' }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Reservation', value: 'reservation' },
  { label: 'Lease', value: 'lease' },
];

export const QUICK_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Past' },
];

// ============================================
// Filter State Interface
// ============================================

export interface BookingFilters {
  status: BookingStatus | 'all';
  type: BookingType | 'all';
  quickFilter: string;
}

export const defaultFilters: BookingFilters = {
  status: 'all',
  type: 'all',
  quickFilter: 'all',
};
