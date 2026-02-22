/**
 * useTrustLevel Hook
 *
 * Wraps the trust store with gateway adapter calls.
 * Loads trust config from Supabase on mount, saves changes back.
 * Handles autonomous consent check.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTrustStore } from '@/stores/useTrustStore'
import { useConsentStore } from '@/stores/useConsentStore'
import { useConnectionContext } from '@/contexts/ConnectionContext'
import { TRUST_LEVEL_CONFIGS } from '@/types'
import type { TrustLevel, ActionOverride } from '@/types'

export const useTrustLevel = () => {
  const {
    trustLevel, countdownSeconds, overrides,
    dailySpendLimitCents, dailyCallLimit, headerMode, loading,
    setTrustLevel, setCountdownSeconds, setOverrides,
    setDailySpendLimitCents, setDailyCallLimit, setHeaderMode,
    setLoading,
  } = useTrustStore()

  const { hasActiveConsent } = useConsentStore()
  const { adapter } = useConnectionContext()
  const loadedRef = useRef(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Reset loadedRef when adapter changes (e.g. sign-out sets adapter to null)
  useEffect(() => {
    if (!adapter) loadedRef.current = false
  }, [adapter])

  // Load trust config from Supabase on mount
  useEffect(() => {
    if (!adapter || loadedRef.current) return

    setLoading(true)
    adapter.getTrustConfig()
      .then((config) => {
        loadedRef.current = true
        setTrustLevel(config.globalLevel)
        setCountdownSeconds(config.countdownSeconds)
        setOverrides(config.overrides)
        if (config.dailySpendLimitCents !== undefined) setDailySpendLimitCents(config.dailySpendLimitCents)
        if (config.dailyCallLimit !== undefined) setDailyCallLimit(config.dailyCallLimit)
      })
      .catch((err) => {
        loadedRef.current = false // allow retry on next render/reconnect
        console.warn('[useTrustLevel] Failed to load from Supabase, using local state:', err.message)
      })
      .finally(() => setLoading(false))
  }, [adapter, setTrustLevel, setCountdownSeconds, setOverrides, setDailySpendLimitCents, setDailyCallLimit, setLoading])

  const trustConfig = TRUST_LEVEL_CONFIGS[trustLevel]

  const setLevel = useCallback((level: TrustLevel) => {
    if (level === 'autonomous' && !hasActiveConsent()) {
      // Caller must check return value and show consent modal
      return false
    }
    setSaveError(null)
    setTrustLevel(level)

    // Persist to Supabase — revert on failure using store's current state
    if (adapter) {
      adapter.updateTrustConfig({ globalLevel: level }).catch((err) => {
        console.warn('[useTrustLevel] Failed to save trust level, reverting:', err.message)
        const current = useTrustStore.getState().trustLevel
        if (current === level) setTrustLevel(trustLevel)
        setSaveError('Failed to save trust level. Change reverted.')
      })
    }

    return true
  }, [hasActiveConsent, setTrustLevel, adapter, trustLevel])

  const setOverride = useCallback((override: ActionOverride) => {
    setSaveError(null)
    const updated = [...overrides.filter(o => o.actionType !== override.actionType), override]
    setOverrides(updated)

    // Persist to Supabase — revert on failure using store's current state
    if (adapter) {
      adapter.updateTrustConfig({ overrides: updated }).catch((err) => {
        console.warn('[useTrustLevel] Failed to save overrides, reverting:', err.message)
        const current = useTrustStore.getState().overrides
        if (current === updated) setOverrides(overrides)
        setSaveError('Failed to save override. Change reverted.')
      })
    }
  }, [overrides, setOverrides, adapter])

  const removeOverride = useCallback((actionType: string) => {
    setSaveError(null)
    const updated = overrides.filter(o => o.actionType !== actionType)
    setOverrides(updated)

    // Persist to Supabase — revert on failure using store's current state
    if (adapter) {
      adapter.updateTrustConfig({ overrides: updated }).catch((err) => {
        console.warn('[useTrustLevel] Failed to save overrides, reverting:', err.message)
        const current = useTrustStore.getState().overrides
        if (current === updated) setOverrides(overrides)
        setSaveError('Failed to save override. Change reverted.')
      })
    }
  }, [overrides, setOverrides, adapter])

  return {
    trustLevel,
    trustConfig,
    countdownSeconds,
    overrides,
    dailySpendLimitCents,
    dailyCallLimit,
    headerMode,
    loading,
    saveError,
    clearSaveError: useCallback(() => setSaveError(null), []),
    setLevel,
    setOverride,
    removeOverride,
    setCountdownSeconds,
    setDailySpendLimitCents,
    setDailyCallLimit,
    setHeaderMode,
  }
}
