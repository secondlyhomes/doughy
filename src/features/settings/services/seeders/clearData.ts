// src/features/settings/services/seeders/clearData.ts
// Clear all landlord data for a user

import { supabase } from '@/lib/supabase';
import { getUserId } from './common/auth';
import { deleteUserConversations } from './entities/conversationSeeder';
import { deleteUserBookings } from './entities/bookingSeeder';
import { deleteUserProperties } from './entities/propertySeeder';
import { deleteLandlordContacts } from './entities/contactSeeder';
import type { ClearDataResult } from './types';

/**
 * Clear all landlord-related data for the current user.
 * Deletes in the correct order to respect foreign key constraints.
 */
export async function clearAllLandlordData(): Promise<ClearDataResult> {
  const errors: Array<{ table: string; message: string }> = [];
  const userId = await getUserId();

  // Get property IDs for dependent records
  const { data: properties } = await supabase
    .from('landlord_properties')
    .select('id')
    .eq('user_id', userId);
  const propertyIds = properties?.map((p) => p.id) || [];

  // 1. Delete conversations and messages
  const conversationResult = await deleteUserConversations(userId);
  errors.push(...conversationResult.errors);

  // 2. Delete bookings and related data (charges, settlements)
  const bookingResult = await deleteUserBookings(userId);
  errors.push(...bookingResult.errors);

  // 3. Delete turnovers
  const { error: turnoversError } = await supabase
    .from('landlord_turnovers')
    .delete()
    .eq('user_id', userId);
  if (turnoversError) {
    errors.push({ table: 'landlord_turnovers', message: turnoversError.message });
  }

  // 4. Delete maintenance records
  const { error: maintenanceError } = await supabase
    .from('landlord_maintenance_records')
    .delete()
    .eq('user_id', userId);
  if (maintenanceError) {
    errors.push({ table: 'landlord_maintenance_records', message: maintenanceError.message });
  }

  // 5. Delete property-related data (rooms, inventory)
  if (propertyIds.length > 0) {
    const { error: roomsError } = await supabase
      .from('landlord_rooms')
      .delete()
      .in('property_id', propertyIds);
    if (roomsError) {
      errors.push({ table: 'landlord_rooms', message: roomsError.message });
    }

    const { error: inventoryError } = await supabase
      .from('landlord_inventory_items')
      .delete()
      .in('property_id', propertyIds);
    if (inventoryError) {
      errors.push({ table: 'landlord_inventory_items', message: inventoryError.message });
    }
  }

  // 6. Delete properties
  try {
    await deleteUserProperties(userId);
  } catch (err) {
    errors.push({ table: 'landlord_properties', message: err instanceof Error ? err.message : 'Unknown error' });
  }

  // 7. Delete vendors
  const { error: vendorsError } = await supabase
    .from('landlord_vendors')
    .delete()
    .eq('user_id', userId);
  if (vendorsError) {
    errors.push({ table: 'landlord_vendors', message: vendorsError.message });
  }

  // 8. Delete templates
  const { error: templatesError } = await supabase
    .from('landlord_guest_templates')
    .delete()
    .eq('user_id', userId);
  if (templatesError) {
    errors.push({ table: 'landlord_guest_templates', message: templatesError.message });
  }

  // 9. Delete landlord contacts
  try {
    await deleteLandlordContacts(userId);
  } catch (err) {
    errors.push({ table: 'crm_contacts', message: err instanceof Error ? err.message : 'Unknown error' });
  }

  // Return result
  if (errors.length > 0) {
    console.error('Errors during data clearing:', errors);
    throw new Error(`Failed to clear some data: ${errors.map((e) => `${e.table}: ${e.message}`).join('; ')}`);
  }

  return { success: true, errors: [] };
}
