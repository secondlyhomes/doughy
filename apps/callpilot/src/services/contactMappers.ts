/**
 * Contact Mappers
 *
 * Data transformation and mapping functions for converting
 * CRM database rows into CallPilot's unified Contact type.
 */

import type { Contact, ContactSource, ContactStatus, ContactTemperature, ContactModule, ContactType, LeaseInfo, ContractorInfo } from '@/types'

// ============================================================================
// CRM row interfaces
// ============================================================================

export interface CrmContact {
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

export interface CrmLead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  source: string | null
  status: string
  tags: string[] | null
  city: string | null
  state: string | null
  score: number | null
  module: string
  notes: string | null
  created_at: string | null
  updated_at: string
}

// ============================================================================
// Mapping constants
// ============================================================================

export const SOURCE_MAP: Record<string, ContactSource> = {
  referral: 'referral',
  cold_call: 'cold',
  cold: 'cold',
  driving_for_dollars: 'cold',
  inbound: 'inbound',
  website: 'inbound',
  manual: 'cold',
  renewal: 'renewal',
}

export const STATUS_MAP: Record<string, ContactStatus> = {
  new: 'prospect',
  contacted: 'prospect',
  active: 'prospect',
  qualified: 'quoted',
  negotiating: 'negotiating',
  closed_won: 'won',
  closed_lost: 'lost',
  unresponsive: 'lost',
  dead: 'lost',
}

// ============================================================================
// Mapping functions
// ============================================================================

export function computeTemperature(status: ContactStatus, score: number | null, lastContactDate: string): ContactTemperature {
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

export function buildAddress(city: string | null, state: string | null): string {
  if (city && state) return `${city}, ${state}`
  return city || state || ''
}

export function mapCrmToContact(row: CrmContact): Contact {
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

export function mapLeadToContact(row: CrmLead): Contact {
  const status = STATUS_MAP[row.status || ''] || 'prospect'
  const lastContactDate = row.updated_at || row.created_at || new Date().toISOString()
  const score = row.score ?? null
  const module = (row.module || 'investor') as ContactModule

  // Split lead name into first/last
  const nameParts = row.name.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ')

  return {
    id: row.id,
    firstName,
    lastName,
    company: row.company || '',
    role: '',
    phone: row.phone || '',
    email: row.email || '',
    source: SOURCE_MAP[row.source || ''] || 'cold',
    policyType: '',
    estimatedPremium: 0,
    lastContactDate,
    nextFollowUp: '',
    callCount: 0,
    status,
    notes: row.notes || '',
    keyFacts: [],
    objections: [],
    optStatus: null,
    tags: row.tags,
    communicationStats: null,
    preferredChannel: null,
    score,
    temperature: computeTemperature(status, score, lastContactDate),
    address: buildAddress(row.city, row.state),
    module,
    contactType: null,
    leaseInfo: null,
    contractorInfo: null,
  }
}
