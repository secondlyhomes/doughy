/**
 * Briefs Service
 *
 * Pre-call brief retrieval and generation.
 * Checks callpilot.pre_call_briefings cache first, then generates via
 * openclaw-server /api/calls/pre-call. Falls back to mock data in mock mode.
 */

import type { PreCallBrief } from '@/types'
import { mockPreBriefs } from '@/mocks'
import { callsFetch, isMockMode } from './callpilotApi'
import { supabase } from './supabaseClient'

interface BriefingRow {
  id: string
  call_id: string
  lead_id: string | null
  briefing_content: {
    lead_name?: string
    lead_score?: number
    relationship_status?: string
    deal_context?: string | null
    opening_script?: string
    talking_points?: string[]
    questions_to_ask?: string[]
    warnings?: string[]
    last_interaction?: string | null
  }
  created_at: string
}

function mapRowToBrief(row: BriefingRow, contactId: string): PreCallBrief {
  const b = row.briefing_content
  return {
    id: row.call_id || row.id,
    contactId,
    contactName: b.lead_name || 'Unknown',
    generatedAt: row.created_at,
    lastConversation: {
      title: 'Last Interaction',
      items: b.last_interaction ? [b.last_interaction] : ['No previous interactions'],
    },
    keyFacts: b.talking_points || [],
    suggestedApproach: b.opening_script || 'Start with a friendly introduction.',
    watchOutFor: b.warnings || [],
    relationshipStrength: b.relationship_status === 'new' ? 'new'
      : b.relationship_status === 'contacted' ? 'building'
      : b.relationship_status === 'qualified' ? 'established'
      : 'strong',
  }
}

export async function getBriefs(): Promise<PreCallBrief[]> {
  if (isMockMode || !supabase) return mockPreBriefs

  const { data, error } = await supabase
    .schema('callpilot')
    .from('pre_call_briefings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data?.length) return []
  return data.map((row: BriefingRow) => mapRowToBrief(row, row.lead_id || ''))
}

export async function getBriefForContact(
  contactId: string
): Promise<PreCallBrief | undefined> {
  if (isMockMode || !supabase) {
    return mockPreBriefs.find((b) => b.contactId === contactId)
  }

  // Check cache: recent briefing for this contact (less than 24h old)
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
  const { data, error } = await supabase
    .schema('callpilot')
    .from('pre_call_briefings')
    .select('*')
    .eq('lead_id', contactId)
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!error && data?.length) {
    return mapRowToBrief(data[0] as BriefingRow, contactId)
  }

  // No cached briefing — generate a fresh one
  return generateBrief(contactId)
}

export async function generateBrief(
  contactId: string
): Promise<PreCallBrief> {
  if (isMockMode) {
    throw new Error('Not implemented — mock mode does not support generation')
  }

  const data = await callsFetch<{
    call: { id: string }
    briefing: {
      lead_name: string
      lead_score: number
      relationship_status: string
      deal_context: string | null
      opening_script: string
      talking_points: string[]
      questions_to_ask: string[]
      warnings: string[]
      last_interaction: string | null
    }
  }>('/pre-call', {
    method: 'POST',
    body: JSON.stringify({ contact_id: contactId }),
  })

  const b = data.briefing
  return {
    id: data.call.id,
    contactId,
    contactName: b.lead_name,
    generatedAt: new Date().toISOString(),
    lastConversation: {
      title: 'Last Interaction',
      items: b.last_interaction ? [b.last_interaction] : ['No previous interactions'],
    },
    keyFacts: b.talking_points,
    suggestedApproach: b.opening_script,
    watchOutFor: b.warnings,
    relationshipStrength: b.relationship_status === 'new' ? 'new'
      : b.relationship_status === 'contacted' ? 'building'
      : b.relationship_status === 'qualified' ? 'established'
      : 'strong',
  }
}
