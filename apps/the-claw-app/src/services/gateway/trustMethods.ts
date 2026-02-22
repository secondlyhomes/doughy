/**
 * Trust Methods — trust level configuration and kill switch adapter methods
 */

import { supabase } from '@/lib/supabase'
import type { TrustConfig, TrustLevel, KillSwitchStatus } from '@/types'
import { clawFetch } from './helpers'

export function createTrustMethods() {
  return {
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
        countdownSeconds: data.queue_delay_seconds ?? 30,
        overrides: data.action_overrides || [],
        dailySpendLimitCents: data.daily_spend_limit_cents ?? 500,
        dailyCallLimit: data.daily_call_limit ?? 10,
      }
    },

    async updateTrustConfig(config: Partial<TrustConfig>): Promise<void> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const updates: Record<string, unknown> = { user_id: user.id }
      if (config.globalLevel !== undefined) updates.global_level = config.globalLevel
      if (config.countdownSeconds !== undefined) updates.queue_delay_seconds = config.countdownSeconds
      if (config.overrides !== undefined) updates.action_overrides = config.overrides
      if (config.dailySpendLimitCents !== undefined) updates.daily_spend_limit_cents = config.dailySpendLimitCents
      if (config.dailyCallLimit !== undefined) updates.daily_call_limit = config.dailyCallLimit
      updates.updated_at = new Date().toISOString()

      const { error } = await supabase.schema('claw').from('trust_config').upsert(updates, { onConflict: 'user_id' })
      if (error) throw new Error(error.message)
    },

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
          // PGRST116 = no rows found — not an error, just no config yet
          if (error.code === 'PGRST116') {
            return { active: false, last_event: null }
          }
          throw new Error(`Kill switch status unavailable: DB query failed (${error.message}), server also unreachable`)
        }
        return { active: data?.global_level === 'locked', last_event: null }
      }
    },

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
    },

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
    },
  }
}
