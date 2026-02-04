// src/features/settings/services/seeders/entities/contactSeeder.ts
// Contact seeder for landlord platform

import { supabase } from '@/lib/supabase';
import type { ContactSeedData } from '../types';

export interface CreatedContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  contact_types: string[];
  [key: string]: unknown;
}

/**
 * Create a single contact
 */
export async function createContact(
  userId: string,
  data: ContactSeedData
): Promise<CreatedContact> {
  const { data: contact, error } = await supabase
    .schema('crm').from('contacts')
    .insert({
      user_id: userId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      contact_types: data.types,
      source: data.source,
      status: data.status,
      score: data.score,
      tags: data.tags || [],
      metadata: data.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw new Error(`Failed to create contact: ${error.message}`);
  }

  if (!contact) throw new Error('Contact was not created');
  console.log('Created contact:', contact.id);

  return contact as CreatedContact;
}

/**
 * Create multiple contacts
 */
export async function createContacts(
  userId: string,
  contactsData: ContactSeedData[]
): Promise<CreatedContact[]> {
  const { data: contacts, error } = await supabase
    .schema('crm').from('contacts')
    .insert(
      contactsData.map((c) => ({
        user_id: userId,
        first_name: c.firstName,
        last_name: c.lastName,
        email: c.email,
        phone: c.phone,
        contact_types: c.types,
        source: c.source,
        status: c.status,
        score: c.score,
        tags: c.tags || [],
        metadata: c.metadata || {},
      }))
    )
    .select();

  if (error) {
    console.error('Error creating contacts:', error);
    throw new Error(`Failed to create contacts: ${error.message}`);
  }

  if (!contacts || contacts.length === 0) {
    throw new Error('Contacts were not created');
  }

  console.log('Created contacts:', contacts.length);
  return contacts as CreatedContact[];
}

/**
 * Delete landlord-specific contacts for a user (guests, tenants, leads)
 * Uses soft delete bypass to truly remove records
 */
export async function deleteLandlordContacts(userId: string): Promise<void> {
  try {
    const { data: contacts, error: fetchError } = await supabase
      .schema('crm').from('contacts')
      .select('id, contact_types')
      .eq('user_id', userId);

    if (fetchError) {
      throw new Error(`Failed to fetch contacts: ${fetchError.message}`);
    }

    // Filter to landlord-specific contacts (guest, tenant, or lead)
    const landlordContactIds = (contacts || [])
      .filter((c) => {
        const types = c.contact_types || [];
        return types.includes('guest') || types.includes('tenant') || types.includes('lead');
      })
      .map((c) => c.id);

    if (landlordContactIds.length === 0) return;

    // Step 1: Mark as soft-deleted first (bypasses trigger on actual DELETE)
    const { error: softDeleteError } = await supabase
      .schema('crm').from('contacts')
      .update({ is_deleted: true })
      .in('id', landlordContactIds);

    if (softDeleteError) {
      throw new Error(`Soft delete failed: ${softDeleteError.message}`);
    }

    // Step 2: DELETE actually removes the rows (trigger won't fire when is_deleted=true)
    const { error: deleteError } = await supabase
      .schema('crm').from('contacts')
      .delete()
      .in('id', landlordContactIds);

    if (deleteError) {
      throw new Error(`Hard delete failed: ${deleteError.message}`);
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Unknown error deleting contacts');
  }
}
