/**
 * Feature Flag Hooks
 */

import { createContext, useContext } from 'react'
import type { FeatureFlagContextValue } from '../types'

// Default context value
const defaultContextValue: FeatureFlagContextValue = {
  flags: new Map(),
  loading: true,
  isEnabled: () => false,
  getVariant: () => undefined,
  refresh: async () => {},
  evaluations: new Map(),
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue>(defaultContextValue)

/**
 * Hook to access all feature flag functionality
 */
export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider')
  }
  return context
}

/**
 * Hook to check a single feature flag
 */
export function useFeatureFlag(key: string): boolean {
  const { isEnabled } = useFeatureFlags()
  return isEnabled(key)
}
