/**
 * Communications Service
 *
 * Unified communication retrieval across channels.
 * Uses Supabase crm.messages when connected, mock data in dev.
 */

import type { Communication, CommunicationChannel } from '@/types'
import { mockCommunications } from '@/mocks'
import { supabase, isMockMode } from './supabaseClient'
import { serverFetch } from './callpilotApi'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const VALID_CHANNELS: ReadonlySet<CommunicationChannel> = new Set(['sms', 'email', 'call', 'transcript'])

interface CrmMessage {
  id: string
  contact_id: string | null
  lead_id: string | null
  channel: string
  direction: string
  sender_type: string | null
  body: string
  subject: string | null
  status: string
  created_at: string
  updated_at: string | null
}

function mapCrmMessage(row: CrmMessage): Communication {
  const channel: CommunicationChannel = VALID_CHANNELS.has(row.channel as CommunicationChannel)
    ? (row.channel as CommunicationChannel)
    : 'sms'

  return {
    id: row.id,
    contactId: row.contact_id || row.lead_id || '',
    channel,
    direction: row.direction === 'inbound' ? 'incoming' : 'outgoing',
    status: (row.status === 'sent' || row.status === 'delivered' || row.status === 'read' || row.status === 'error')
      ? row.status
      : 'sent',
    body: row.body || '',
    subject: row.subject || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    duration: null,
    outcome: null,
    recordingUrl: null,
    transcriptText: null,
    aiAnalysis: null,
  }
}

export async function getCommunications(): Promise<Communication[]> {
  if (isMockMode || !supabase) return mockCommunications

  const { data, error } = await supabase
    .schema('crm' as any)
    .from('messages')
    .select('id, contact_id, lead_id, channel, direction, sender_type, body, subject, status, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    if (__DEV__) console.warn('[communicationsService] getCommunications failed:', error)
    throw new Error('Failed to load messages')
  }

  return (data as CrmMessage[]).map(mapCrmMessage)
}

export async function getByContact(
  contactId: string
): Promise<Communication[]> {
  if (isMockMode || !supabase) {
    return mockCommunications.filter((c) => c.contactId === contactId)
  }

  // Validate contactId is a UUID to prevent PostgREST filter injection
  if (!UUID_RE.test(contactId)) return []

  const { data, error } = await supabase
    .schema('crm' as any)
    .from('messages')
    .select('id, contact_id, lead_id, channel, direction, sender_type, body, subject, status, created_at, updated_at')
    .or(`contact_id.eq.${contactId},lead_id.eq.${contactId}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    if (__DEV__) console.warn('[communicationsService] getByContact failed:', error)
    throw new Error('Failed to load messages for contact')
  }

  return (data as CrmMessage[]).map(mapCrmMessage)
}

export async function getRecent(limit: number): Promise<Communication[]> {
  if (isMockMode || !supabase) {
    return [...mockCommunications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }

  const { data, error } = await supabase
    .schema('crm' as any)
    .from('messages')
    .select('id, contact_id, lead_id, channel, direction, sender_type, body, subject, status, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (__DEV__) console.warn('[communicationsService] getRecent failed:', error)
    throw new Error('Failed to load recent messages')
  }

  return (data as CrmMessage[]).map(mapCrmMessage)
}

interface SendMessageResponse {
  success: boolean
  message_id: string
  conversation_id: string
  delivered: boolean
  created_at: string
  error?: string
}

export async function sendMessage(
  contactId: string,
  body: string,
  channel: 'sms' | 'email' = 'sms'
): Promise<SendMessageResponse> {
  if (isMockMode) throw new Error('Not available in mock mode')
  return serverFetch<SendMessageResponse>('/api/messages/send', {
    method: 'POST',
    body: JSON.stringify({ contactId, channel, body }),
  })
}
