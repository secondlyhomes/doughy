// src/features/settings/services/seeders/entities/bookingSeeder.ts
// Booking seeder for landlord platform

import { supabase } from '@/lib/supabase';
import { getRelativeDateString } from '../common/dates';
import type { BookingSeedData } from '../types';
import type { CreatedProperty } from './propertySeeder';
import type { CreatedContact } from './contactSeeder';

export interface CreatedBooking {
  id: string;
  property_id: string;
  contact_id: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Create bookings from seed data
 */
export async function createBookings(
  userId: string,
  bookingsData: BookingSeedData[],
  properties: CreatedProperty[],
  contacts: CreatedContact[]
): Promise<CreatedBooking[]> {
  const bookingInserts = bookingsData.map((b) => ({
    user_id: userId,
    property_id: properties[b.propertyIndex].id,
    contact_id: contacts[b.contactIndex].id,
    booking_type: b.booking_type,
    status: b.status,
    start_date: getRelativeDateString(b.startOffset),
    end_date: getRelativeDateString(b.endOffset),
    rate: b.rate,
    rate_type: b.rate_type,
    total_amount: b.total_amount,
    source: b.source,
    notes: b.notes,
    deposit: b.deposit,
    deposit_status: b.deposit_status,
  }));

  const { data: bookings, error } = await supabase
    .schema('landlord').from('bookings')
    .insert(bookingInserts)
    .select();

  if (error) {
    console.error('Error creating bookings:', error);
    throw new Error(`Failed to create bookings: ${error.message}`);
  }

  console.log('Created bookings:', bookings?.length || 0);
  return (bookings || []) as CreatedBooking[];
}

/**
 * Delete all bookings and related data for a user
 */
export async function deleteUserBookings(userId: string): Promise<{ errors: Array<{ table: string; message: string }> }> {
  const errors: Array<{ table: string; message: string }> = [];

  // Get booking IDs first
  const { data: bookings } = await supabase
    .schema('landlord').from('bookings')
    .select('id')
    .eq('user_id', userId);
  const bookingIds = bookings?.map((b) => b.id) || [];

  // Delete booking-related data first
  if (bookingIds.length > 0) {
    const { error: chargesError } = await supabase
      .schema('landlord').from('booking_charges')
      .delete()
      .in('booking_id', bookingIds);
    if (chargesError) {
      errors.push({ table: 'landlord.booking_charges', message: chargesError.message });
    }

    const { error: settlementsError } = await supabase
      .schema('landlord').from('deposit_settlements')
      .delete()
      .in('booking_id', bookingIds);
    if (settlementsError) {
      errors.push({ table: 'landlord.deposit_settlements', message: settlementsError.message });
    }
  }

  // Delete bookings
  const { error: bookingsError } = await supabase
    .schema('landlord').from('bookings')
    .delete()
    .eq('user_id', userId);
  if (bookingsError) {
    errors.push({ table: 'landlord.bookings', message: bookingsError.message });
  }

  return { errors };
}
