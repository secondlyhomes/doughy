/**
 * Contact Queries
 *
 * Read/fetch functions for CRM contacts and leads.
 * Queries crm.contacts and crm.leads, merges into unified Contact type.
 */

import type { Contact } from '@/types'
import { mockContacts } from '@/mocks'
import { supabase, isMockMode } from './supabaseClient'
import { mapCrmToContact, mapLeadToContact } from './contactMappers'
import type { CrmContact, CrmLead } from './contactMappers'

export async function getContacts(module: 'investor' | 'landlord' = 'investor'): Promise<Contact[]> {
  if (isMockMode || !supabase) {
    if (__DEV__) console.warn('[ContactsService] Running in mock mode — returning mock data')
    return mockContacts.filter((c) => c.module === module)
  }

  const { data: user, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Authentication failed: ${authError.message}`)
  if (!user?.user) throw new Error('Not authenticated')

  // Query both crm.contacts and crm.leads in parallel
  const [contactsResult, leadsResult] = await Promise.all([
    supabase
      .schema('crm')
      .from('contacts')
      .select('*')
      .eq('module', module)
      .eq('is_deleted', false)
      .order('score', { ascending: false })
      .limit(50),
    supabase
      .schema('crm')
      .from('leads')
      .select('id, name, email, phone, company, source, status, tags, city, state, score, module, notes, created_at, updated_at')
      .eq('module', module)
      .eq('is_deleted', false)
      .order('score', { ascending: false })
      .limit(50),
  ])

  if (contactsResult.error) throw new Error(`Failed to load contacts: ${contactsResult.error.message}`)
  if (leadsResult.error) throw new Error(`Failed to load leads: ${leadsResult.error.message}`)

  const contacts = (contactsResult.data || []).map(mapCrmToContact)
  const leads = (leadsResult.data || []).map((row: any) => mapLeadToContact(row as CrmLead))

  // Merge and dedupe (leads that share a phone with a contact are likely the same person)
  const contactPhones = new Set(contacts.map((c) => c.phone).filter(Boolean))
  const uniqueLeads = leads.filter((l) => !l.phone || !contactPhones.has(l.phone))

  return [...contacts, ...uniqueLeads]
}

export async function getContact(id: string): Promise<Contact | undefined> {
  if (isMockMode || !supabase) return mockContacts.find((c) => c.id === id)

  // Try crm.contacts first
  const { data, error } = await supabase
    .schema('crm')
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle()

  if (error) throw new Error(`Failed to load contact: ${error.message}`)
  if (data) return mapCrmToContact(data as CrmContact)

  // Fall back to crm.leads
  const { data: lead, error: leadError } = await supabase
    .schema('crm')
    .from('leads')
    .select('id, name, email, phone, company, source, status, tags, city, state, score, module, notes, created_at, updated_at')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle()

  if (leadError) throw new Error(`Failed to load lead: ${leadError.message}`)
  if (lead) return mapLeadToContact(lead as CrmLead)

  return undefined
}

export async function searchContacts(query: string, module: 'investor' | 'landlord' = 'investor'): Promise<Contact[]> {
  if (isMockMode || !supabase) {
    const q = query.toLowerCase()
    return mockContacts.filter(
      (c) =>
        c.module === module &&
        (c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q))
    )
  }

  // Sanitize: allow only alphanumeric, spaces, hyphens, and apostrophes
  const sanitized = query.replace(/[^a-zA-Z0-9\s'-]/g, '')
  const q = `%${sanitized}%`

  const [contactsResult, leadsResult] = await Promise.all([
    supabase
      .schema('crm')
      .from('contacts')
      .select('*')
      .eq('module', module)
      .eq('is_deleted', false)
      .or(`first_name.ilike.${q},last_name.ilike.${q},company.ilike.${q}`)
      .order('score', { ascending: false })
      .limit(20),
    supabase
      .schema('crm')
      .from('leads')
      .select('id, name, email, phone, company, source, status, tags, city, state, score, module, notes, created_at, updated_at')
      .eq('module', module)
      .eq('is_deleted', false)
      .or(`name.ilike.${q},company.ilike.${q}`)
      .order('score', { ascending: false })
      .limit(20),
  ])

  if (contactsResult.error) throw new Error(`Search failed: ${contactsResult.error.message}`)
  if (leadsResult.error) throw new Error(`Lead search failed: ${leadsResult.error.message}`)

  const contacts = (contactsResult.data || []).map(mapCrmToContact)
  const leads = (leadsResult.data || []).map((row: any) => mapLeadToContact(row as CrmLead))

  const contactPhones = new Set(contacts.map((c) => c.phone).filter(Boolean))
  const uniqueLeads = leads.filter((l) => !l.phone || !contactPhones.has(l.phone))

  return [...contacts, ...uniqueLeads]
}

export async function getOverdueFollowUps(): Promise<Contact[]> {
  if (isMockMode || !supabase) {
    const now = new Date()
    return mockContacts.filter((c) => c.nextFollowUp && new Date(c.nextFollowUp) < now)
  }

  // Query overdue follow-ups from investor.follow_ups, then fetch linked contacts
  const now = new Date().toISOString().split('T')[0]
  const { data: followUps, error: fuError } = await supabase
    .schema('investor')
    .from('follow_ups')
    .select('contact_id')
    .eq('status', 'scheduled')
    .lt('scheduled_at', now)
    .limit(20)

  if (fuError) throw new Error(`Failed to load follow-ups: ${fuError.message}`)
  if (!followUps?.length) return []

  const contactIds = [...new Set(followUps.map((f: { contact_id: string }) => f.contact_id))]
  const { data, error } = await supabase
    .schema('crm')
    .from('contacts')
    .select('*')
    .in('id', contactIds)
    .eq('is_deleted', false)

  if (error) throw new Error(`Failed to load overdue contacts: ${error.message}`)
  return (data || []).map(mapCrmToContact)
}
