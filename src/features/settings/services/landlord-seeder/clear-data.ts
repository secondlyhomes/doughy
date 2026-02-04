// src/features/settings/services/landlord-seeder/clear-data.ts
// Functions to clear landlord data from the database

import { supabase } from '@/lib/supabase';

import type { ClearDataResult } from './types';
import { getCurrentUserId } from './helpers';

/**
 * Clear all landlord data for the current user.
 * Deletes in reverse foreign key order to respect constraints.
 */
export async function clearAllLandlordData(): Promise<ClearDataResult> {
  const errors: { table: string; message: string }[] = [];
  const userId = await getCurrentUserId();

  // Get conversation IDs first for deleting messages
  const { data: conversations } = await supabase
    .schema('landlord').from('conversations')
    .select('id')
    .eq('user_id', userId);
  const conversationIds = conversations?.map(c => c.id) || [];

  // Get property IDs first for deleting dependent records
  const { data: properties } = await supabase
    .schema('landlord').from('properties')
    .select('id')
    .eq('user_id', userId);
  const propertyIds = properties?.map(p => p.id) || [];

  // Get booking IDs for deleting charges and settlements
  const { data: bookings } = await supabase
    .schema('landlord').from('bookings')
    .select('id')
    .eq('user_id', userId);
  const bookingIds = bookings?.map(b => b.id) || [];

  // Delete in order to respect foreign keys
  // Collect all errors but continue to delete as much as possible
  if (conversationIds.length > 0) {
    const { error: messagesError } = await supabase
      .schema('landlord').from('messages')
      .delete()
      .in('conversation_id', conversationIds);
    if (messagesError) {
      errors.push({ table: 'rental_messages', message: messagesError.message });
    }
  }

  const { error: aiQueueError } = await supabase
    .schema('landlord').from('ai_queue_items')
    .delete()
    .eq('user_id', userId);
  if (aiQueueError) {
    errors.push({ table: 'rental_ai_queue', message: aiQueueError.message });
  }

  const { error: conversationsError } = await supabase
    .schema('landlord').from('conversations')
    .delete()
    .eq('user_id', userId);
  if (conversationsError) {
    errors.push({ table: 'rental_conversations', message: conversationsError.message });
  }

  // Delete booking-related data (charges, settlements)
  if (bookingIds.length > 0) {
    const { error: chargesError } = await supabase
      .schema('landlord').from('booking_charges')
      .delete()
      .in('booking_id', bookingIds);
    if (chargesError) {
      errors.push({ table: 'booking_charges', message: chargesError.message });
    }

    const { error: settlementsError } = await supabase
      .schema('landlord').from('deposit_settlements')
      .delete()
      .in('booking_id', bookingIds);
    if (settlementsError) {
      errors.push({ table: 'deposit_settlements', message: settlementsError.message });
    }
  }

  // Delete turnovers (tied to properties/bookings)
  const { error: turnoversError } = await supabase
    .schema('landlord').from('turnovers')
    .delete()
    .eq('user_id', userId);
  if (turnoversError) {
    errors.push({ table: 'property_turnovers', message: turnoversError.message });
  }

  // Delete maintenance records
  const { error: maintenanceError } = await supabase
    .schema('landlord').from('maintenance_records')
    .delete()
    .eq('user_id', userId);
  if (maintenanceError) {
    errors.push({ table: 'property_maintenance', message: maintenanceError.message });
  }

  const { error: bookingsError } = await supabase
    .schema('landlord').from('bookings')
    .delete()
    .eq('user_id', userId);
  if (bookingsError) {
    errors.push({ table: 'rental_bookings', message: bookingsError.message });
  }

  // Delete property-related data
  if (propertyIds.length > 0) {
    const { error: roomsError } = await supabase
      .schema('landlord').from('rooms')
      .delete()
      .in('property_id', propertyIds);
    if (roomsError) {
      errors.push({ table: 'rental_rooms', message: roomsError.message });
    }

    const { error: inventoryError } = await supabase
      .schema('landlord').from('inventory_items')
      .delete()
      .in('property_id', propertyIds);
    if (inventoryError) {
      errors.push({ table: 'property_inventory', message: inventoryError.message });
    }
  }

  const { error: propertiesError } = await supabase
    .schema('landlord').from('properties')
    .delete()
    .eq('user_id', userId);
  if (propertiesError) {
    errors.push({ table: 'rental_properties', message: propertiesError.message });
  }

  // Delete global data (vendors, templates)
  const { error: vendorsError } = await supabase
    .schema('landlord').from('vendors')
    .delete()
    .eq('user_id', userId);
  if (vendorsError) {
    errors.push({ table: 'property_vendors', message: vendorsError.message });
  }

  const { error: templatesError } = await supabase
    .schema('landlord').from('guest_templates')
    .delete()
    .eq('user_id', userId);
  if (templatesError) {
    errors.push({ table: 'guest_message_templates', message: templatesError.message });
  }

  // Clear contacts - need to bypass soft delete trigger
  try {
    const { data: contacts, error: fetchError } = await supabase
      .schema('crm').from('contacts')
      .select('id, contact_types')
      .eq('user_id', userId);

    if (fetchError) {
      errors.push({ table: 'crm_contacts', message: `Failed to fetch: ${fetchError.message}` });
    } else {
      // Filter to landlord-specific contacts (guest, tenant, or lead)
      const landlordContactIds = (contacts || [])
        .filter(c => {
          const types = c.contact_types || [];
          return types.includes('guest') || types.includes('tenant') || types.includes('lead');
        })
        .map(c => c.id);

      if (landlordContactIds.length > 0) {
        // Step 1: Mark as soft-deleted first (this bypasses the trigger on actual DELETE)
        const { error: softDeleteError } = await supabase
          .schema('crm').from('contacts')
          .update({ is_deleted: true })
          .in('id', landlordContactIds);

        if (softDeleteError) {
          errors.push({ table: 'crm_contacts', message: `Soft delete failed: ${softDeleteError.message}` });
        } else {
          // Step 2: Now DELETE will actually remove the rows
          const { error: deleteError } = await supabase
            .schema('crm').from('contacts')
            .delete()
            .in('id', landlordContactIds);

          if (deleteError) {
            errors.push({ table: 'crm_contacts', message: `Hard delete failed: ${deleteError.message}` });
          }
        }
      }
    }
  } catch (err) {
    errors.push({ table: 'crm_contacts', message: err instanceof Error ? err.message : 'Unknown error' });
  }

  // Return detailed result
  if (errors.length > 0) {
    console.error('Errors during data clearing:', errors);
    throw new Error(`Failed to clear some data: ${errors.map(e => `${e.table}: ${e.message}`).join('; ')}`);
  }

  return { success: true, errors: [] };
}
