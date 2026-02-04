// src/lib/rpc/landlord.ts
// RPC wrapper functions for landlord domain
// These replace PostgREST cross-schema queries with proper RPC calls

import { supabase } from '@/lib/supabase';
import type {
  BookingWithContactRPC,
  LandlordConversationRPC,
} from '@/types/rpc-types';

// ============================================================================
// Bookings
// ============================================================================

export interface GetBookingsParams {
  propertyId?: string;
  status?: string[];
  dateFilter?: 'upcoming' | 'past' | 'active' | 'all';
  limit?: number;
  offset?: number;
}

/**
 * Fetch bookings with contact, property, and room data
 * Replaces: supabase.schema('landlord').from('bookings').select('*, contact:contacts!contact_id(...), property:properties(...), room:rooms!...')
 */
export async function getBookingsWithContact(params: GetBookingsParams = {}): Promise<BookingWithContactRPC[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('landlord').rpc('get_bookings_with_contact', {
    p_user_id: user.id,
    p_property_id: params.propertyId || null,
    p_status: params.status || null,
    p_date_filter: params.dateFilter || null,
    p_limit: params.limit || 100,
    p_offset: params.offset || 0,
  });

  if (error) throw error;
  return (data || []) as BookingWithContactRPC[];
}

/**
 * Fetch a single booking by ID with full relations
 * Replaces: supabase.schema('landlord').from('bookings').select('*, contact:contacts!contact_id(...), ...').eq('id', id).single()
 */
export async function getBookingById(bookingId: string): Promise<BookingWithContactRPC | null> {
  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('landlord').rpc('get_booking_by_id', {
    p_booking_id: bookingId,
  });

  if (error) throw error;
  const results = data as BookingWithContactRPC[] | null;
  return results?.[0] || null;
}

/**
 * Fetch upcoming bookings for a property
 * Replaces: supabase.schema('landlord').from('bookings').select('*, contact:contacts!contact_id(...), room:rooms!...').eq('property_id', propertyId).gte('start_date', today)
 */
export async function getUpcomingBookings(propertyId: string, limit: number = 10): Promise<BookingWithContactRPC[]> {
  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('landlord').rpc('get_upcoming_bookings', {
    p_property_id: propertyId,
    p_limit: limit,
  });

  if (error) throw error;
  return (data || []) as BookingWithContactRPC[];
}

// ============================================================================
// Conversations
// ============================================================================

/**
 * Fetch landlord conversations with contact and property data
 * Replaces: supabase.schema('landlord').from('conversations').select('*, contact:contacts!contact_id(...), property:properties(...)')
 */
export async function getConversationsWithContact(
  conversationIds?: string[]
): Promise<LandlordConversationRPC[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('landlord').rpc('get_conversations_with_contact', {
    p_user_id: user.id,
    p_conversation_ids: conversationIds || null,
  });

  if (error) throw error;
  return (data || []) as LandlordConversationRPC[];
}

/**
 * Fetch a single landlord conversation by ID
 */
export async function getLandlordConversationById(conversationId: string): Promise<LandlordConversationRPC | null> {
  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('landlord').rpc('get_landlord_conversation_by_id', {
    p_conversation_id: conversationId,
  });

  if (error) throw error;
  const results = data as LandlordConversationRPC[] | null;
  return results?.[0] || null;
}
