/**
 * Queue Methods — queue/approval related adapter methods
 */

import { supabase } from '@/lib/supabase'
import type {
  PendingAction,
  ActionResult,
  BatchApproveResponse,
  ClawMessage,
  BriefingResponse,
  SendMessageResponse,
  AgentProfile,
  QueueItem,
  ConnectionId,
} from '@/types'
import { clawFetch, approvalToPendingAction } from './helpers'

export function createQueueMethods() {
  return {
    async getQueueItems(): Promise<QueueItem[]> {
      // DB statuses: pending, executing, executed, cancelled, error
      // App statuses: pending, countdown, approved, denied, cancelled, executed
      const { data, error } = await supabase
        .schema('claw').from('action_queue')
        .select('*')
        .in('status', ['pending', 'executing'])
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      return (data ?? []).map((row: any) => ({
        id: row.id,
        connectionId: (row.target_channel || 'doughy') as ConnectionId,
        actionType: row.action_type,
        title: row.description || row.action_type,
        summary: row.preview || '',
        status: row.status === 'executing' ? 'countdown' as const : row.status as QueueItem['status'],
        riskLevel: (row.metadata?.risk_level || 'medium') as QueueItem['riskLevel'],
        countdownEndsAt: row.execute_at,
        createdAt: row.created_at,
      }))
    },

    async cancelQueueItem(id: string): Promise<void> {
      await clawFetch(`/queue/${id}/cancel`, { method: 'POST' })
    },

    async approveQueueItem(id: string): Promise<void> {
      await clawFetch(`/queue/${id}/approve`, { method: 'POST' })
    },

    async denyQueueItem(id: string): Promise<void> {
      // Server has no separate deny endpoint — cancel is the reject action
      await clawFetch(`/queue/${id}/cancel`, { method: 'POST' })
    },

    // -- Legacy methods --

    async getPendingActions(): Promise<PendingAction[]> {
      const data = await clawFetch<{ approvals: any[] }>('/approvals?status=pending')
      return data.approvals.map(approvalToPendingAction)
    },

    async approveAction(id: string, editedContent?: string): Promise<ActionResult> {
      const data = await clawFetch<{ success: boolean; status: string }>(`/approvals/${id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ action: 'approve', ...(editedContent ? { edited_content: editedContent } : {}) }),
      })
      return { success: data.success, actionId: id, newStatus: data.status === 'executed' ? 'executed' : 'approved' }
    },

    async denyAction(id: string, _reason?: string): Promise<ActionResult> {
      const data = await clawFetch<{ success: boolean; status: string }>(`/approvals/${id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ action: 'reject' }),
      })
      return { success: data.success, actionId: id, newStatus: 'denied' }
    },

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
    },

    async sendMessage(message: string): Promise<SendMessageResponse> {
      return clawFetch<SendMessageResponse>('/message', { method: 'POST', body: JSON.stringify({ message }) })
    },

    async getMessages(limit = 50): Promise<ClawMessage[]> {
      const data = await clawFetch<{ messages: ClawMessage[] }>(`/messages?limit=${limit}`)
      return data.messages
    },

    async getBriefing(): Promise<BriefingResponse> {
      return clawFetch<BriefingResponse>('/briefing')
    },

    async getAgentProfiles(): Promise<AgentProfile[]> {
      const data = await clawFetch<{ profiles: AgentProfile[] }>('/agent-profiles')
      return data.profiles
    },

    async toggleAgentProfile(id: string, isActive: boolean): Promise<void> {
      await clawFetch(`/agent-profiles/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) })
    },
  }
}
