/**
 * Calls Service
 *
 * Call history retrieval and creation.
 * Uses openclaw-server /api/calls endpoints when connected,
 * falls back to mock data in mock mode.
 */

import type { Call } from '@/types'
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

function mapApiCall(apiCall: ApiCall): Call {
  return {
    id: apiCall.id,
    contactId: apiCall.contact_id || apiCall.lead_id || '',
    contactName: '', // Resolved by caller or joined
    startedAt: apiCall.started_at || apiCall.created_at,
    endedAt: apiCall.ended_at || apiCall.created_at,
    duration: apiCall.duration_seconds || 0,
    outcome: (apiCall.outcome as Call['outcome']) || 'follow_up',
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
