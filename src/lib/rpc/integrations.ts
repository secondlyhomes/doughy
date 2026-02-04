// src/lib/rpc/integrations.ts
// RPC wrapper functions for integrations domain
// These replace PostgREST cross-schema queries with proper RPC calls

import { supabase } from '@/lib/supabase';
import type { AccessCodeWithBookingRPC } from '@/types/rpc-types';

// ============================================================================
// Smart Home / Access Codes
// ============================================================================

/**
 * Fetch access codes with device and booking data
 * Replaces: supabase.schema('integrations').from('seam_access_codes').select('*, device:seam_connected_devices!...(*), booking:bookings!booking_id(..., contact:contacts!contact_id(...))')
 */
export async function getAccessCodesWithBooking(params: {
  deviceId?: string;
  propertyId?: string;
} = {}): Promise<AccessCodeWithBookingRPC[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('integrations').rpc('get_access_codes_with_booking', {
    p_user_id: user.id,
    p_device_id: params.deviceId || null,
    p_property_id: params.propertyId || null,
  });

  if (error) throw error;
  return (data || []) as AccessCodeWithBookingRPC[];
}

/**
 * Fetch access codes for all devices in a property
 * Replaces: two-step query to get devices then access codes
 */
export async function getAccessCodesByProperty(propertyId: string): Promise<AccessCodeWithBookingRPC[]> {
  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('integrations').rpc('get_access_codes_by_property', {
    p_property_id: propertyId,
  });

  if (error) throw error;
  return (data || []) as AccessCodeWithBookingRPC[];
}
