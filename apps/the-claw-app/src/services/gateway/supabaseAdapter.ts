/**
 * Supabase Gateway Adapter
 *
 * Real implementation of GatewayAdapter that reads from Supabase claw schema
 * and calls the openclaw-server API for actions.
 */

import { supabase } from '@/lib/supabase'
import type { GatewayAdapter } from './types'
import type {
  HealthResponse,
  GatewayConfig,
  PendingAction,
  ActionResult,
  BatchApproveResponse,
  ActionHistoryEntry,
  ClawMessage,
  BriefingResponse,
  SendMessageResponse,
  AgentProfile,
  KillSwitchStatus,
  ServiceConnection,
  ConnectionId,
  QueueItem,
  TrustConfig,
  MonthlyCostSummary,
  TrustLevel,
} from '@/types'
import type { ConnectionPermission } from '@/types'

const CLAW_API_URL = process.env.EXPO_PUBLIC_CLAW_API_URL || 'https://openclaw.doughy.app/api/claw'

/**
 * Default connections to initialize for new users.
 * This is the canonical source of truth for connection metadata.
 */
const DEFAULT_CONNECTIONS: Array<{
  service: string
  name: string
  status: string
  summary: string
  permissions: Record<string, Record<string, boolean>>
  config?: Record<string, unknown>
}> = [
  {
    service: 'doughy', name: 'Doughy', status: 'connected',
    summary: 'CRM access for leads, deals, properties, and tenant management.',
    permissions: {
      'Real Estate Investor': {
        read_leads: true, read_deals: true, read_properties: true, read_documents: true,
        draft_messages: true, send_messages: false, update_lead_status: false,
        update_deal_stage: false, create_new_leads: false, delete_records: false,
      },
      'Landlord': {
        read_bookings: true, read_maintenance: true, read_tenants: true,
        draft_messages: true, send_messages: false, dispatch_vendors: false,
        create_maintenance_req: false, delete_records: false,
      },
    },
  },
  {
    service: 'whatsapp', name: 'WhatsApp', status: 'connected',
    summary: 'Receive drafts, briefings, and approval requests via WhatsApp.',
    permissions: {
      'Messages': { receive_claw: true, receive_drafts: true, receive_briefings: true, receive_approvals: true },
    },
  },
  {
    service: 'discord', name: 'Discord', status: 'connected',
    summary: 'Receive notifications and drafts in your Discord channels.',
    permissions: {
      'Channels': { receive_claw: true, receive_drafts: true, receive_briefings: true },
    },
  },
  {
    service: 'bland', name: 'Bland AI', status: 'connected',
    summary: 'AI-powered phone calls for lead follow-up and scheduling.',
    permissions: {
      'Calls': { view_logs: true, make_calls: false },
    },
    config: {
      bland: {
        maxCallsPerDay: 10,
        maxSpendPerDayCents: 2000,
        queueDelaySeconds: 30,
        voice: 'nat',
        language: 'en-US',
      },
    },
  },
  {
    service: 'sms', name: 'SMS (Twilio)', status: 'warning',
    summary: 'SMS messaging via Twilio. Verification pending.',
    permissions: {
      'Messages': { read_sms: true, send_sms: false },
    },
  },
  { service: 'slack', name: 'Slack', status: 'disconnected', summary: 'Team notifications and approvals via Slack.', permissions: {} },
  { service: 'hubspot', name: 'HubSpot', status: 'disconnected', summary: 'Sync contacts and deals with HubSpot CRM.', permissions: {} },
  { service: 'gmail', name: 'Gmail', status: 'disconnected', summary: 'Draft and send emails on your behalf.', permissions: {} },
]

/**
 * Parse permissions from DB — handles both formats:
 * - Array format: {list: [{id, module, name, ...}]} (app format)
 * - Object format: {"module": {"perm_key": true/false}} (seed/server format)
 */
function parsePermissions(perms: any): ConnectionPermission[] {
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

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return session.access_token
}

async function clawFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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

function approvalToPendingAction(approval: {
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

export class SupabaseGatewayAdapter implements GatewayAdapter {
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${CLAW_API_URL.replace('/api/claw', '/health')}`)
      const data = await response.json()

      let pendingCount = 0
      try {
        const approvals = await clawFetch<{ approvals: unknown[] }>('/approvals?status=pending')
        pendingCount = approvals.approvals.length
      } catch (err) {
        console.warn('[SupabaseAdapter] Failed to fetch pending count:', err instanceof Error ? err.message : err)
      }

      return {
        status: data.status === 'ok' ? 'ok' : 'degraded',
        version: data.version || '1.0.0',
        agentName: 'The Claw',
        uptime: 0,
        channelCount: 4,
        pendingActionCount: pendingCount,
      }
    } catch (err) {
      console.error('[SupabaseAdapter] healthCheck failed:', err instanceof Error ? err.message : err)
      return { status: 'down', version: '0.0.0', agentName: 'The Claw', uptime: 0, channelCount: 0, pendingActionCount: 0 }
    }
  }

  async getConfig(): Promise<GatewayConfig> {
    return { trustLevel: 'guarded', pollingIntervalMs: 5000, maxBatchSize: 20, channels: [] }
  }

  async updateConfig(_patch: Partial<GatewayConfig>): Promise<void> {}

  // -- Connections --

  /**
   * Initialize default connections for the current user.
   * Called once when getConnections() finds no rows.
   */
  private async initializeConnections(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated — cannot initialize connections')

    const rows = DEFAULT_CONNECTIONS.map((conn) => ({
      user_id: user.id,
      service: conn.service,
      name: conn.name,
      status: conn.status,
      permissions: conn.permissions,
      config: { summary: conn.summary, ...(conn.config ?? {}) },
    }))

    const { error } = await supabase
      .schema('claw').from('connections')
      .upsert(rows, { onConflict: 'user_id,service' })

    if (error) throw new Error(`Failed to initialize connections: ${error.message}`)
  }

  async getConnections(): Promise<ServiceConnection[]> {
    const { data, error } = await supabase
      .schema('claw').from('connections')
      .select('*')
      .order('created_at')

    if (error) throw new Error(error.message)

    // Initialize defaults if user has no connections
    if (!data || data.length === 0) {
      await this.initializeConnections()
      // Re-fetch after initialization
      const { data: freshData, error: freshError } = await supabase
        .schema('claw').from('connections')
        .select('*')
        .order('created_at')
      if (freshError) throw new Error(freshError.message)
      return this.mapConnections(freshData ?? [])
    }

    return this.mapConnections(data)
  }

  private mapConnections(rows: any[]): ServiceConnection[] {
    // Deduplicate by service — keep the first row per service
    const seen = new Set<string>()
    const unique = rows.filter((row: any) => {
      const key = row.service ?? row.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return unique.map((row: any) => {
      const defaults = DEFAULT_CONNECTIONS.find(d => d.service === row.service)
      return {
        id: row.service as ConnectionId,
        name: row.name || defaults?.name || row.service,
        icon: row.config?.icon || 'flash',
        status: row.status as ServiceConnection['status'],
        permissions: parsePermissions(row.permissions),
        summary: row.config?.summary || defaults?.summary || '',
        ...(row.service === 'bland' ? { blandConfig: row.config?.bland ?? defaults?.config?.bland } : {}),
      }
    })
  }

  async toggleConnectionPermission(connectionId: ConnectionId, permissionId: string, enabled: boolean): Promise<void> {
    // permissionId format: "ModuleName.perm_key"
    const dotIndex = permissionId.indexOf('.')
    if (dotIndex === -1) throw new Error(`Invalid permission ID format: ${permissionId}`)
    const moduleName = permissionId.slice(0, dotIndex)
    const permKey = permissionId.slice(dotIndex + 1)

    const { data: conn, error: fetchError } = await supabase
      .schema('claw').from('connections')
      .select('permissions')
      .eq('service', connectionId)
      .single()

    if (fetchError) throw new Error(`Failed to fetch connection: ${fetchError.message}`)
    if (!conn) throw new Error(`Connection "${connectionId}" not found`)

    // Write back in canonical object format: {"Module": {"perm_key": bool}}
    const perms = { ...(conn.permissions ?? {}) }
    if (perms[moduleName] && typeof perms[moduleName] === 'object') {
      perms[moduleName] = { ...perms[moduleName], [permKey]: enabled }
    }

    const { error } = await supabase
      .schema('claw').from('connections')
      .update({ permissions: perms })
      .eq('service', connectionId)

    if (error) throw new Error(error.message)
  }

  async disconnectConnection(connectionId: ConnectionId): Promise<void> {
    const { error } = await supabase
      .schema('claw').from('connections')
      .update({ status: 'disconnected', permissions: {} })
      .eq('service', connectionId)

    if (error) throw new Error(error.message)
  }

  // -- Queue --

  async getQueueItems(): Promise<QueueItem[]> {
    const { data, error } = await supabase
      .schema('claw').from('action_queue')
      .select('*')
      .in('status', ['pending', 'countdown'])
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []).map((row: any) => ({
      id: row.id,
      connectionId: row.connection_id as ConnectionId,
      actionType: row.action_type,
      title: row.title,
      summary: row.summary || '',
      status: row.status as QueueItem['status'],
      riskLevel: row.risk_level as QueueItem['riskLevel'],
      countdownEndsAt: row.countdown_ends_at,
      createdAt: row.created_at,
    }))
  }

  async cancelQueueItem(id: string): Promise<void> {
    await clawFetch(`/queue/${id}/cancel`, { method: 'POST' })
  }

  async approveQueueItem(id: string): Promise<void> {
    await clawFetch(`/queue/${id}/approve`, { method: 'POST' })
  }

  async denyQueueItem(id: string): Promise<void> {
    // Server has no separate deny endpoint — cancel is the reject action
    await clawFetch(`/queue/${id}/cancel`, { method: 'POST' })
  }

  // -- Trust --

  async getTrustConfig(): Promise<TrustConfig> {
    const { data, error } = await supabase
      .schema('claw').from('trust_config')
      .select('*')
      .single()

    if (error) {
      // PGRST116 = no rows found — expected for first-time users
      if (error.code !== 'PGRST116') {
        throw new Error(`Failed to load trust config: ${error.message}`)
      }
    }

    if (!data) {
      return { globalLevel: 'manual', countdownSeconds: 30, overrides: [], dailySpendLimitCents: 500, dailyCallLimit: 10 }
    }

    return {
      globalLevel: data.global_level as TrustLevel,
      countdownSeconds: data.countdown_seconds,
      overrides: data.action_overrides || [],
      dailySpendLimitCents: data.daily_spend_limit_cents ?? 500,
      dailyCallLimit: data.daily_call_limit ?? 10,
    }
  }

  async updateTrustConfig(config: Partial<TrustConfig>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const updates: Record<string, unknown> = { user_id: user.id }
    if (config.globalLevel !== undefined) updates.global_level = config.globalLevel
    if (config.countdownSeconds !== undefined) updates.countdown_seconds = config.countdownSeconds
    if (config.overrides !== undefined) updates.action_overrides = config.overrides
    if (config.dailySpendLimitCents !== undefined) updates.daily_spend_limit_cents = config.dailySpendLimitCents
    if (config.dailyCallLimit !== undefined) updates.daily_call_limit = config.dailyCallLimit
    updates.updated_at = new Date().toISOString()

    const { error } = await supabase.schema('claw').from('trust_config').upsert(updates, { onConflict: 'user_id' })
    if (error) throw new Error(error.message)
  }

  // -- Cost --

  async getMonthlyCost(): Promise<MonthlyCostSummary> {
    // Query cost_log directly for current month aggregation
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data, error } = await supabase
      .schema('claw').from('cost_log')
      .select('service, action, cost_cents')
      .gte('created_at', startOfMonth)

    if (error) {
      console.warn('[SupabaseAdapter] Direct cost query failed, falling back to API:', error.message)
      try {
        return await clawFetch<MonthlyCostSummary>('/cost/monthly')
      } catch (apiErr) {
        throw new Error(`Cost unavailable: DB failed (${error.message}), API also failed (${apiErr instanceof Error ? apiErr.message : apiErr})`)
      }
    }

    const totalCents = data.reduce((sum, row) => sum + row.cost_cents, 0)

    // Group by service for breakdown
    const byService: Record<string, number> = {}
    for (const row of data) {
      byService[row.service] = (byService[row.service] || 0) + row.cost_cents
    }
    const breakdown = Object.entries(byService).map(([label, amountCents]) => ({ label, amountCents }))

    // Count unique actions and approximate leads
    const actionCount = data.length
    const leadsTouched = data.filter(r => r.action !== 'transcription').length

    return {
      totalCents,
      breakdown,
      actionCount,
      leadsTouched,
      costPerLeadCents: leadsTouched > 0 ? Math.round(totalCents / leadsTouched) : 0,
    }
  }

  // -- Activity --

  async getActivityHistory(): Promise<ActionHistoryEntry[]> {
    // Try server API first, fall back to cost_log direct query
    try {
      const data = await clawFetch<{ activity: any[] }>('/activity?limit=50')
      return data.activity.map(mapActivityItem)
    } catch (serverErr) {
      console.warn('[SupabaseAdapter] Server /activity failed, falling back to cost_log:', serverErr instanceof Error ? serverErr.message : serverErr)
    }

    // Fallback: read directly from claw.cost_log
    const { data, error } = await supabase
      .schema('claw').from('cost_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(`Failed to load activity: ${error.message}`)

    return (data ?? []).map((row: any) => ({
      id: row.id,
      tool: row.action || 'task',
      description: row.description || row.action || 'Action',
      tier: 'low' as const,
      status: 'executed' as const,
      connectionId: row.service || null,
      preview: {
        title: row.description || row.action || 'Action',
        summary: `${row.service} — $${(row.cost_cents / 100).toFixed(2)}`,
        details: {
          Service: row.service,
          Action: row.action,
          Cost: `$${(row.cost_cents / 100).toFixed(2)}`,
        },
      },
      channel: 'app' as const,
      requestedAt: row.created_at,
      resolvedAt: row.created_at,
      executedAt: row.created_at,
      resolvedBy: 'auto-policy' as const,
      trustLevelAtTime: 'manual' as TrustLevel,
      undoable: false,
      undoneAt: null,
      costCents: row.cost_cents ?? 0,
    }))
  }

  async undoActivity(id: string): Promise<void> {
    await clawFetch(`/activity/${id}/undo`, { method: 'POST' })
  }

  // -- Legacy methods --

  async getPendingActions(): Promise<PendingAction[]> {
    const data = await clawFetch<{ approvals: any[] }>('/approvals?status=pending')
    return data.approvals.map(approvalToPendingAction)
  }

  async approveAction(id: string, editedContent?: string): Promise<ActionResult> {
    const data = await clawFetch<{ success: boolean; status: string }>(`/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', ...(editedContent ? { edited_content: editedContent } : {}) }),
    })
    return { success: data.success, actionId: id, newStatus: data.status === 'executed' ? 'executed' : 'approved' }
  }

  async denyAction(id: string, _reason?: string): Promise<ActionResult> {
    const data = await clawFetch<{ success: boolean; status: string }>(`/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject' }),
    })
    return { success: data.success, actionId: id, newStatus: 'denied' }
  }

  async batchApproveActions(actionIds: string[]): Promise<BatchApproveResponse> {
    const decisions = actionIds.map((id) => ({ approval_id: id, action: 'approve' as const }))
    const data = await clawFetch<{ approved: number; rejected: number; failed: number }>('/approvals/batch', {
      method: 'POST',
      body: JSON.stringify({ decisions }),
    })
    return {
      successCount: data.approved,
      failureCount: data.failed,
      results: actionIds.map((id) => ({ actionId: id, success: true, newStatus: 'approved' as const })),
    }
  }

  async sendMessage(message: string): Promise<SendMessageResponse> {
    return clawFetch<SendMessageResponse>('/message', { method: 'POST', body: JSON.stringify({ message }) })
  }

  async getMessages(limit = 50): Promise<ClawMessage[]> {
    const data = await clawFetch<{ messages: ClawMessage[] }>(`/messages?limit=${limit}`)
    return data.messages
  }

  async getBriefing(): Promise<BriefingResponse> {
    return clawFetch<BriefingResponse>('/briefing')
  }

  async getAgentProfiles(): Promise<AgentProfile[]> {
    const data = await clawFetch<{ profiles: AgentProfile[] }>('/agent-profiles')
    return data.profiles
  }

  async toggleAgentProfile(id: string, isActive: boolean): Promise<void> {
    await clawFetch(`/agent-profiles/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) })
  }

  async getKillSwitchStatus(): Promise<KillSwitchStatus> {
    try {
      return await clawFetch<KillSwitchStatus>('/kill-switch')
    } catch (apiErr) {
      console.warn('[SupabaseAdapter] Kill switch status API failed, checking trust_config:', apiErr instanceof Error ? apiErr.message : apiErr)
      const { data, error } = await supabase
        .schema('claw').from('trust_config')
        .select('global_level')
        .single()
      if (error) {
        throw new Error(`Kill switch status unavailable: DB query failed (${error.message}), server also unreachable`)
      }
      return { active: data?.global_level === 'locked', last_event: null }
    }
  }

  async activateKillSwitch(reason: string): Promise<{ agents_disabled: number }> {
    try {
      return await clawFetch<{ agents_disabled: number }>('/kill-switch', { method: 'POST', body: JSON.stringify({ reason }) })
    } catch (apiErr) {
      console.warn('[SupabaseAdapter] Kill switch API failed, attempting DB fallback:', apiErr instanceof Error ? apiErr.message : apiErr)
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        throw new Error(`Kill switch failed: server unreachable and cannot verify identity (${authErr?.message ?? 'no session'})`)
      }
      const { error: dbErr } = await supabase.schema('claw').from('trust_config')
        .update({ global_level: 'locked', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
      if (dbErr) {
        throw new Error(`Kill switch failed: server unreachable and DB update failed (${dbErr.message})`)
      }
      // DB locked but server couldn't halt running agents
      throw new Error('Server unreachable — new actions blocked, but running agents may not have stopped.')
    }
  }

  async deactivateKillSwitch(): Promise<{ agents_restored: number }> {
    try {
      return await clawFetch<{ agents_restored: number }>('/kill-switch', { method: 'DELETE' })
    } catch (apiErr) {
      console.warn('[SupabaseAdapter] Resume API failed, attempting DB fallback:', apiErr instanceof Error ? apiErr.message : apiErr)
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        throw new Error(`Resume failed: server unreachable and cannot verify identity (${authErr?.message ?? 'no session'})`)
      }
      const { error: dbErr } = await supabase.schema('claw').from('trust_config')
        .update({ global_level: 'manual', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
      if (dbErr) {
        throw new Error(`Resume failed: server unreachable and DB update failed (${dbErr.message})`)
      }
      throw new Error('Server unreachable — trust level restored, but agents may need manual restart.')
    }
  }
}

function mapActivityItem(item: any): ActionHistoryEntry {
  return {
    id: item.id,
    tool: item.type || 'task',
    description: item.title || 'Action',
    tier: item.kind === 'approval' ? 'medium' as const : 'low' as const,
    status: mapStatus(item.status),
    connectionId: item.connection_id || null,
    preview: {
      title: item.title || 'Action',
      summary: item.summary || item.status,
      details: {
        Type: item.type,
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

function mapStatus(status: string): ActionHistoryEntry['status'] {
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
