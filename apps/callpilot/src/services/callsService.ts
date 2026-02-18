/**
 * Calls Service
 *
 * Call history retrieval and creation.
 * Uses openclaw-server /api/calls endpoints when connected,
 * falls back to mock data in mock mode.
 */

import type { Call, TranscriptLine } from '@/types'
import { mockCalls } from '@/mocks'
import { callsFetch, isMockMode } from './callpilotApi'

interface ApiCall {
  id: string
  user_id: string
  lead_id: string | null
  contact_id: string | null
  deal_id: string | null
  direction: string
  phone_number: string
  status: string
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  outcome: string | null
  created_at: string
}

const VALID_OUTCOMES: ReadonlySet<string> = new Set([
  'interested', 'not_interested', 'follow_up', 'no_answer', 'left_voicemail',
  'deal_made', 'callback_scheduled', 'wrong_number', 'do_not_call',
])

function mapApiCall(apiCall: ApiCall): Call {
  return {
    id: apiCall.id,
    contactId: apiCall.contact_id || apiCall.lead_id || '',
    contactName: '', // Resolved by caller or joined
    startedAt: apiCall.started_at || apiCall.created_at,
    endedAt: apiCall.ended_at || apiCall.created_at,
    duration: apiCall.duration_seconds || 0,
    outcome: (apiCall.outcome && VALID_OUTCOMES.has(apiCall.outcome)
      ? apiCall.outcome
      : 'follow_up') as Call['outcome'],
    hasVoiceMemo: false,
    hasSummary: apiCall.status === 'completed',
  }
}

export async function getCalls(): Promise<Call[]> {
  if (isMockMode) return mockCalls

  const data = await callsFetch<{ calls: ApiCall[] }>('/')
  return data.calls.map(mapApiCall)
}

export async function getCall(id: string): Promise<Call | undefined> {
  if (isMockMode) return mockCalls.find((c) => c.id === id)

  const data = await callsFetch<{ calls: ApiCall[] }>('/')
  const call = data.calls.find((c) => c.id === id)
  return call ? mapApiCall(call) : undefined
}

export async function getCallsForContact(
  contactId: string
): Promise<Call[]> {
  if (isMockMode) return mockCalls.filter((c) => c.contactId === contactId)

  const data = await callsFetch<{ calls: ApiCall[] }>('/')
  return data.calls
    .filter((c) => c.contact_id === contactId || c.lead_id === contactId)
    .map(mapApiCall)
}

export async function createCall(
  call: Omit<Call, 'id'>
): Promise<{ id: string }> {
  if (isMockMode) throw new Error('Not implemented in mock mode')

  const data = await callsFetch<{ call: { id: string } }>('/pre-call', {
    method: 'POST',
    body: JSON.stringify({
      contact_id: call.contactId,
      phone_number: '',
    }),
  })
  return data.call
}

// --- Transcript ---

interface TranscriptChunkApi {
  speaker: string
  content: string
  timestamp_ms: number | null
  duration_ms: number | null
  confidence: number | null
}

interface TranscriptResponse {
  chunks: TranscriptChunkApi[]
  full_text: string
}

const VALID_SPEAKERS: ReadonlySet<string> = new Set(['user', 'lead', 'ai_bland'])

export async function getTranscript(callId: string): Promise<TranscriptLine[]> {
  if (isMockMode) throw new Error('Not available in mock mode')

  const data = await callsFetch<TranscriptResponse>('/' + callId + '/transcript')
  return data.chunks.map((chunk) => ({
    speaker: (VALID_SPEAKERS.has(chunk.speaker) ? chunk.speaker : 'lead') as TranscriptLine['speaker'],
    text: chunk.content,
    timestamp: chunk.timestamp_ms != null ? chunk.timestamp_ms / 1000 : null,
  }))
}

// --- CRM Push ---

export interface SuggestedUpdate {
  id: string
  field_name: string
  suggested_value: string | number | boolean | null
  status: string
  target_table: string
  target_record_id: string | null
  source_quote?: string
  confidence?: string
  current_value?: string | number | boolean | null
}

interface SuggestedUpdatesResponse {
  suggested_updates: SuggestedUpdate[]
}

interface ApproveAllResponse {
  success: boolean
  updates_applied: number
  errors?: string[]
}

export async function getSuggestedUpdates(callId: string): Promise<SuggestedUpdate[]> {
  if (isMockMode) throw new Error('Not available in mock mode')

  const data = await callsFetch<SuggestedUpdatesResponse>('/' + callId + '/suggested-updates')
  return data.suggested_updates
}

export async function approveUpdates(callId: string, updateIds: string[]): Promise<ApproveAllResponse> {
  if (isMockMode) throw new Error('Not available in mock mode')

  return callsFetch<ApproveAllResponse>('/' + callId + '/approve-all', {
    method: 'POST',
    body: JSON.stringify({ approved_updates: updateIds }),
  })
}
