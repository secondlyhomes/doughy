/**
 * Feature Flag Provider
 *
 * Manages feature flag state and evaluation for the application
 *
 * @example
 * ```tsx
 * <FeatureFlagProvider>
 *   <App />
 * </FeatureFlagProvider>
 * ```
 */

import React, { useEffect, useState } from 'react'
import { supabase } from '@/services/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { FeatureFlagContext } from './hooks/useFeatureFlags'
import { loadFromCache, saveToCache, evaluateFlag } from './utils'
import type {
  FeatureFlagProviderProps,
  FeatureFlagEvaluation,
  FeatureFlagContextValue,
} from './types'

export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const [flags, setFlags] = useState<Map<string, boolean>>(new Map())
  const [evaluations, setEvaluations] = useState<Map<string, FeatureFlagEvaluation>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeatureFlags()
  }, [user?.id, currentOrg?.id])

  async function loadFeatureFlags() {
    try {
      setLoading(true)

      // Try cache first
      const cached = await loadFromCache()
      if (cached) {
        setFlags(cached.flags)
        setEvaluations(cached.evaluations)
        setLoading(false)
        // Refresh in background
        refreshFlags()
        return
      }

      // Load from database
      await refreshFlags()
    } catch (error) {
      console.error('Failed to load feature flags:', error)
    } finally {
      setLoading(false)
    }
  }

  async function refreshFlags() {
    if (!user || !currentOrg) {
      setFlags(new Map())
      setEvaluations(new Map())
      return
    }

    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('key')

    if (error) {
      console.error('Error loading feature flags:', error)
      return
    }

    const evaluatedFlags = new Map<string, boolean>()
    const evaluationResults = new Map<string, FeatureFlagEvaluation>()

    for (const flag of data) {
      const evaluation = evaluateFlag(flag, user.id, currentOrg.id, user.role)
      evaluatedFlags.set(flag.key, evaluation.enabled)
      evaluationResults.set(flag.key, evaluation)
    }

    setFlags(evaluatedFlags)
    setEvaluations(evaluationResults)
    await saveToCache(evaluatedFlags, evaluationResults)
  }

  function isEnabled(key: string): boolean {
    return flags.get(key) || false
  }

  function getVariant(key: string): string | undefined {
    const evaluation = evaluations.get(key)
    return evaluation?.variant
  }

  const value: FeatureFlagContextValue = {
    flags,
    loading,
    isEnabled,
    getVariant,
    refresh: refreshFlags,
    evaluations,
  }

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}
