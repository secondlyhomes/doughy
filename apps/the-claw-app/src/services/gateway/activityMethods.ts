/**
 * Activity Methods — activity feed related adapter methods
 */

import { supabase } from '@/lib/supabase'
import type { ActionHistoryEntry, TrustLevel } from '@/types'
import { clawFetch, humanizeAction, mapActivityItem } from './helpers'

export function createActivityMethods() {
  return {
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

      return (data ?? []).map((row: any) => {
        const label = humanizeAction(row.action || 'task')
        return {
        id: row.id,
        tool: row.action || 'task',
        description: label,
        tier: 'low' as const,
        status: 'executed' as const,
        connectionId: row.service || null,
        preview: {
          title: label,
          summary: `${row.service} — $${(row.cost_cents / 100).toFixed(2)}`,
          details: {
            Service: row.service,
            Action: label,
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
      }})
    },

    async undoActivity(id: string): Promise<void> {
      await clawFetch(`/activity/${id}/undo`, { method: 'POST' })
    },
  }
}
