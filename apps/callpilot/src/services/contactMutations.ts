/**
 * Contact Mutations
 *
 * Create, update, and delete functions for CRM contacts.
 */

import type { Contact } from '@/types'
import { supabase, isMockMode } from './supabaseClient'
import { mapCrmToContact } from './contactMappers'
import type { CrmContact } from './contactMappers'

export async function createContact(
  contact: Omit<Contact, 'id'>
): Promise<Contact> {
  if (isMockMode || !supabase) {
    throw new Error('Not implemented — mock mode does not support create')
  }

  const { data, error } = await supabase
    .schema('crm')
    .from('contacts')
    .insert({
      first_name: contact.firstName,
      last_name: contact.lastName || null,
      email: contact.email || null,
      phone: contact.phone || null,
      company: contact.company || null,
      source: 'manual',
      status: 'new',
      tags: contact.tags || [],
      module: 'investor',
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message || 'Failed to create contact')
  return mapCrmToContact(data as CrmContact)
}

export async function updateContact(
  id: string,
  updates: Partial<Contact>
): Promise<Contact> {
  if (isMockMode || !supabase) {
    throw new Error('Not implemented — mock mode does not support update')
  }

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.firstName !== undefined) payload['first_name'] = updates.firstName
  if (updates.lastName !== undefined) payload['last_name'] = updates.lastName
  if (updates.email !== undefined) payload['email'] = updates.email
  if (updates.phone !== undefined) payload['phone'] = updates.phone
  if (updates.company !== undefined) payload['company'] = updates.company
  if (updates.tags !== undefined) payload['tags'] = updates.tags

  const { data, error } = await supabase
    .schema('crm')
    .from('contacts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message || 'Failed to update contact')
  return mapCrmToContact(data as CrmContact)
}

export async function deleteContact(id: string): Promise<void> {
  if (isMockMode || !supabase) {
    throw new Error('Not implemented — mock mode does not support delete')
  }

  const { error } = await supabase
    .schema('crm')
    .from('contacts')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
