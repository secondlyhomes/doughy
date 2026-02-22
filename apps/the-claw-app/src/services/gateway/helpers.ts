/**
 * Shared helpers for Supabase Gateway Adapter
 *
 * Contains: clawFetch, auth token, permission parsing, status mapping,
 * humanize helpers, and approval/activity mappers.
 */

import { supabase } from '@/lib/supabase'
import type {
  PendingAction,
  ActionHistoryEntry,
  TrustLevel,
  ConnectionPermission,
} from '@/types'

export const CLAW_API_URL = process.env.EXPO_PUBLIC_CLAW_API_URL || 'https://openclaw.doughy.app/api/claw'

/**
 * Parse permissions from DB — handles both formats:
 * - Array format: {list: [{id, module, name, ...}]} (app format)
 * - Object format: {"module": {"perm_key": true/false}} (seed/server format)
 */
export function parsePermissions(perms: any): ConnectionPermission[] {
  if (!perms) return []

  // Already in app format
  if (Array.isArray(perms.list)) return perms.list
  if (Array.isArray(perms)) return perms

  // Object format: {"module": {"perm_key": bool}}
  const result: ConnectionPermission[] = []
  for (const [moduleName, modulePerms] of Object.entries(perms)) {
    if (typeof modulePerms !== 'object' || modulePerms === null) continue
    for (const [permKey, enabled] of Object.entries(modulePerms as Record<string, boolean>)) {
      result.push({
        id: `${moduleName}.${permKey}`,
        module: moduleName,
        name: permKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: '',
        enabled: !!enabled,
        riskLevel: permKey.includes('delete') || permKey.includes('send') || permKey.includes('dispatch')
          ? 'high'
          : permKey.includes('create') || permKey.includes('update') || permKey.includes('make')
            ? 'medium'
            : 'low',
      })
    }
  }
  return result
}

/** Convert snake_case action names to human-readable labels */
export function humanizeAction(action: string): string {
  const labels: Record<string, string> = {
    whatsapp_queue: 'WhatsApp Message',
    whatsapp_dispatch: 'Vendor Dispatch',
    whatsapp_tenant_reply: 'Tenant Reply',
    sms_queue: 'SMS Message',
    briefing: 'Daily Briefing',
    transcription: 'Call Transcription',
    intent_classification: 'Intent Classification',
    lead_analysis: 'Lead Analysis',
    draft_followups: 'Draft Follow-ups',
  }
  return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return session.access_token
}

export async function clawFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()
  const makeRequest = (authToken: string) =>
    fetch(`${CLAW_API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        ...options.headers,
      },
    })

  let response = await makeRequest(token)

  if (response.status === 401) {
    // Silently attempt token refresh — 401 is expected when tokens expire
    const { data: { session } } = await supabase.auth.refreshSession()
    if (!session?.access_token) throw new Error('Session expired. Please sign in again.')
    response = await makeRequest(session.access_token)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Claw API error: ${response.status} - ${text}`)
  }

  return response.json()
}

export function approvalToPendingAction(approval: {
  id: string
  action_type: string
  title: string
  description: string | null
  draft_content: string
  recipient_name: string | null
  recipient_phone: string | null
  status: string
  created_at: string
  expires_at: string | null
}): PendingAction {
  return {
    id: approval.id,
    tool: approval.action_type,
    description: approval.title,
    tier: 'medium' as const,
    status: approval.status === 'pending' ? 'pending' : (approval.status as PendingAction['status']),
    timestamp: approval.created_at,
    expiresAt: approval.expires_at,
    connectionId: null,
    preview: {
      title: approval.title,
      summary: approval.draft_content,
      details: {
        ...(approval.recipient_name ? { Recipient: approval.recipient_name } : {}),
        ...(approval.recipient_phone ? { Phone: approval.recipient_phone } : {}),
        ...(approval.description ? { Context: approval.description } : {}),
      },
    },
  }
}

export function mapActivityItem(item: any): ActionHistoryEntry {
  const label = item.title || humanizeAction(item.type || 'task')
  return {
    id: item.id,
    tool: item.type || 'task',
    description: label,
    tier: item.kind === 'approval' ? 'medium' as const : 'low' as const,
    status: mapStatus(item.status),
    connectionId: item.connection_id || null,
    preview: {
      title: label,
      summary: item.summary || item.status,
      details: {
        Type: humanizeAction(item.type || 'task'),
        Status: item.status,
        ...(item.recipient_name ? { Recipient: item.recipient_name } : {}),
        ...(item.resolved_at ? { Resolved: new Date(item.resolved_at).toLocaleString() } : {}),
      },
    },
    channel: 'app' as const,
    requestedAt: item.created_at,
    resolvedAt: item.resolved_at || null,
    executedAt: item.resolved_at || null,
    resolvedBy: item.status === 'done' || item.status === 'executed'
      ? 'auto-policy' as const
      : item.status === 'approved' || item.status === 'rejected'
        ? 'manual-user' as const
        : null,
    trustLevelAtTime: (item.trust_level || 'manual') as TrustLevel,
    undoable: item.undoable ?? false,
    undoneAt: item.undone_at || null,
    costCents: item.cost_cents ?? 0,
  }
}

export function mapStatus(status: string): ActionHistoryEntry['status'] {
  switch (status) {
    case 'done': return 'executed'
    case 'executed': return 'executed'
    case 'approved': return 'approved'
    case 'running': return 'pending'
    case 'awaiting_approval': return 'pending'
    case 'pending': return 'pending'
    case 'failed': return 'failed'
    case 'rejected': return 'denied'
    case 'denied': return 'denied'
    default: return 'pending'
  }
}
