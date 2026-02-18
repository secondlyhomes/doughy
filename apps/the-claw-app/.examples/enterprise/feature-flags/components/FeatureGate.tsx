/**
 * FeatureGate Component
 *
 * Conditionally renders children based on feature flag status
 *
 * @example
 * ```tsx
 * <FeatureGate flag="new-ui" fallback={<OldUI />}>
 *   <NewUI />
 * </FeatureGate>
 * ```
 */

import React from 'react'
import { useFeatureFlags } from '../hooks/useFeatureFlags'
import type { FeatureGateProps } from '../types'

export function FeatureGate({
  flag,
  children,
  fallback = null,
}: FeatureGateProps): React.ReactElement {
  const { isEnabled } = useFeatureFlags()

  if (isEnabled(flag)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
