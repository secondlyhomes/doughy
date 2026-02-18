/**
 * Contacts Service
 *
 * Queries CRM contacts from Supabase (crm.contacts).
 * Falls back to mock data when Supabase credentials are not configured.
 */

import type { Contact, ContactSource, ContactStatus, ContactTemperature, ContactModule, ContactType, LeaseInfo, ContractorInfo } from '@/types'
import { mockContacts } from '@/mocks'
import { supabase, isMockMode } from './supabaseClient'

// ============================================================================
// CRM → CallPilot mapper
// ============================================================================

interface CrmContact {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  source: string | null
  status: string | null
  tags: string[] | null
  city: string | null
  state: string | null
  score: number | null
  preferred_channel: string | null
  metadata: Record<string, unknown> | null
  module: string | null
  created_at: string
  updated_at: string | null
}

const SOURCE_MAP: Record<string, ContactSource> = {
  referral: 'referral',
  cold_call: 'cold',
  cold: 'cold',
  driving_for_dollars: 'cold',
  inbound: 'inbound',
  website: 'inbound',
  manual: 'cold',
  renewal: 'renewal',
}

const STATUS_MAP: Record<string, ContactStatus> = {
  new: 'prospect',
  contacted: 'prospect',
  qualified: 'quoted',
  negotiating: 'negotiating',
  closed_won: 'won',
  closed_lost: 'lost',
  unresponsive: 'lost',
}

function computeTemperature(status: ContactStatus, score: number | null, lastContactDate: string): ContactTemperature {
  // Negotiating contacts are always hot
  if (status === 'negotiating') return 'hot'

  // Score-based
  if (score !== null) {
    if (score >= 70) return 'hot'
    if (score >= 40) return 'warm'
  }

  // Recency-based fallback
  const parsedDate = new Date(lastContactDate)
  if (isNaN(parsedDate.getTime())) return 'cold'

  const daysSinceContact = Math.floor(
    (Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSinceContact <= 3) return 'hot'
  if (daysSinceContact <= 10) return 'warm'

  return 'cold'
}

function buildAddress(city: string | null, state: string | null): string {
  if (city && state) return `${city}, ${state}`
  return city || state || ''
}

function mapCrmToContact(row: CrmContact): Contact {
  const meta = row.metadata || {}
  const status = STATUS_MAP[row.status || ''] || 'prospect'
  const lastContactDate = row.updated_at || row.created_at
  const score = row.score ?? null
  const module = (row.module || 'investor') as ContactModule

  // Extract module-specific fields from metadata
  const contactType = (meta['contact_type'] as ContactType) || null
  const leaseInfo = meta['lease_info'] as LeaseInfo | null ?? null
  const contractorInfo = meta['contractor_info'] as ContractorInfo | null ?? null

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name || '',
    company: row.company || '',
    role: (meta['role'] as string) || '',
    phone: row.phone || '',
    email: row.email || '',
    source: SOURCE_MAP[row.source || ''] || 'cold',
    policyType: (meta['policy_type'] as string) || '',
    estimatedPremium: (meta['estimated_premium'] as number) || 0,
    lastContactDate,
    nextFollowUp: (meta['next_follow_up'] as string) || '',
    callCount: (meta['call_count'] as number) || 0,
    status,
    notes: (meta['notes_text'] as string) || '',
    keyFacts: Array.isArray(meta['key_facts']) ? (meta['key_facts'] as string[]) : [],
    objections: Array.isArray(meta['objections']) ? (meta['objections'] as string[]) : [],
    optStatus: null,
    tags: row.tags,
    communicationStats: null,
    preferredChannel: null,
    score,
    temperature: computeTemperature(status, score, lastContactDate),
    address: buildAddress(row.city, row.state),
    module,
    contactType,
    leaseInfo,
    contractorInfo,
  }
}

// ============================================================================
// Service functions
// ============================================================================

export async function getContacts(module: 'investor' | 'landlord' = 'investor'): Promise<Contact[]> {
  if (isMockMode || !supabase) {
    if (__DEV__) console.warn('[ContactsService] Running in mock mode — returning mock data')
    return mockContacts.filter((c) => c.module === module)
  }

  const { data: user, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Authentication failed: ${authError.message}`)
  if (!user?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .schema('crm')
    .from('contacts')
    .select('*')
    .eq('module', module)
    .is('deleted_at', null)
    .order('score', { ascending: false })
    .limit(50)

  if (error) throw new Error(`Failed to load contacts: ${error.message}`)

  return (data || []).map(mapCrmToContact)
}

export async function getContact(id: string): Promise<Contact | undefined> {
  if (isMockMode || !supabase) return mockContacts.find((c) => c.id === id)

  const { data, error } = await supabase
    .schema('crm')
    .from('contacts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(`Failed to load contact: ${error.message}`)
  if (!data) return undefined
  return mapCrmToContact(data as CrmContact)
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
  const { data, error } = await supabase
    .schema('crm')
    .from('contacts')
    .select('*')
    .eq('module', module)
    .is('deleted_at', null)
    .or(`first_name.ilike.${q},last_name.ilike.${q},company.ilike.${q}`)
    .order('score', { ascending: false })
    .limit(20)

  if (error) throw new Error(`Search failed: ${error.message}`)

  return (data || []).map(mapCrmToContact)
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
    .is('deleted_at', null)

  if (error) throw new Error(`Failed to load overdue contacts: ${error.message}`)
  return (data || []).map(mapCrmToContact)
}

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
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
