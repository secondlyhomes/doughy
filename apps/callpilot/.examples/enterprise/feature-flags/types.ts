/**
 * Feature Flags Type Definitions
 */

export interface FeatureFlag {
  key: string
  name: string
  description?: string
  enabled: boolean
  rolloutPercentage?: number // 0-100
  targetUsers?: string[]
  targetOrganizations?: string[]
  targetRoles?: string[]
  startDate?: string
  endDate?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FeatureFlagEvaluation {
  key: string
  enabled: boolean
  reason: string
  variant?: string
}

export interface FeatureFlagContextValue {
  flags: Map<string, boolean>
  loading: boolean
  isEnabled: (key: string) => boolean
  getVariant: (key: string) => string | undefined
  refresh: () => Promise<void>
  evaluations: Map<string, FeatureFlagEvaluation>
}

export interface FeatureFlagProviderProps {
  children: React.ReactNode
}

export interface FeatureGateProps {
  flag: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export interface CachedFlags {
  flags: Map<string, boolean>
  evaluations: Map<string, FeatureFlagEvaluation>
}
