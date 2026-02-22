/**
 * Cost Methods — cost tracking/aggregation adapter methods
 */

import { supabase } from '@/lib/supabase'
import type { MonthlyCostSummary } from '@/types'
import { clawFetch } from './helpers'

export function createCostMethods() {
  return {
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
      const SERVICE_LABELS: Record<string, string> = {
        anthropic: 'Anthropic',
        bland: 'Bland AI',
        twilio: 'Twilio',
        deepgram: 'Deepgram',
      }
      const byService: Record<string, number> = {}
      for (const row of data) {
        byService[row.service] = (byService[row.service] || 0) + row.cost_cents
      }
      const breakdown = Object.entries(byService).map(([key, amountCents]) => ({
        label: SERVICE_LABELS[key] || key,
        amountCents,
      }))

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
    },
  }
}
