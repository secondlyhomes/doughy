/**
 * Memos Service
 *
 * Voice memo and call summary retrieval.
 * Uses openclaw-server /api/calls/:id/summary when connected,
 * falls back to mock data in mock mode.
 */

import type { VoiceMemo, CallSummary } from '@/types'
import { mockVoiceMemos, mockCallSummaries } from '@/mocks'
import { callsFetch, isMockMode } from './callpilotApi'

export async function getVoiceMemos(): Promise<VoiceMemo[]> {
  return mockVoiceMemos
}

export async function getMemoForCall(
  callId: string
): Promise<VoiceMemo | undefined> {
  return mockVoiceMemos.find((m) => m.callId === callId)
}

export async function getCallSummaries(): Promise<CallSummary[]> {
  // No server endpoint to list all summaries — return mock for now
  return mockCallSummaries
}

export async function getSummaryForCall(
  callId: string
): Promise<CallSummary | undefined> {
  if (isMockMode) {
    return mockCallSummaries.find((s) => s.callId === callId)
  }

  // Check mock first as fallback for any local-only summaries
  const mockMatch = mockCallSummaries.find((s) => s.callId === callId)

  try {
    const data = await callsFetch<{
      summary: {
        id: string
        call_id: string
        sentiment: string
        temperature: string
        summary_text: string
        key_points: string[] | { points: string[] }
        unanswered_questions: string[]
        closing_recommendation: string
        follow_up_date: string | null
        contact_name: string | null
        created_at: string | null
      } | null
      action_items: Array<{
        id: string
        title: string
        description: string
        status: string
        priority: string
      }>
    }>(`/${callId}/summary`)

    if (!data.summary) return mockMatch

    const s = data.summary
    const keyPoints = Array.isArray(s.key_points)
      ? s.key_points
      : (s.key_points as { points: string[] })?.points ?? []

    return {
      id: s.id,
      callId: s.call_id,
      contactId: '',
      contactName: s.contact_name || '',
      date: s.created_at || new Date().toISOString(),
      duration: 0,
      summaryText: s.summary_text,
      bulletPoints: keyPoints,
      sentiment: s.sentiment as CallSummary['sentiment'],
      actionItems: (data.action_items || []).map((ai) => ({
        id: ai.id,
        text: ai.title || ai.description,
        completed: ai.status === 'approved',
        priority: (ai.priority as 'high' | 'medium' | 'low') || 'medium',
      })),
      keyMoments: [],
      nextStep: s.closing_recommendation || '',
      followUpDate: s.follow_up_date || '',
      crmSynced: false,
    }
  } catch (err) {
    if (__DEV__) console.warn('[MemosService] getSummaryForCall failed:', err)
    return mockMatch
  }
}
