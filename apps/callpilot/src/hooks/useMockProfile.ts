/**
 * Mock Profile Hook
 *
 * Provides user profile data.
 * Will be replaced with real Supabase auth + profile in Phase 1.
 */

import type { UserProfile } from '@/types'
import { mockUserProfile } from '@/mocks'

export interface UseMockProfileReturn {
  profile: UserProfile
  isOnboarded: boolean
  greeting: string
}

export function useMockProfile(): UseMockProfileReturn {
  const profile = mockUserProfile

  const hour = new Date().getHours()
  let timeOfDay = 'morning'
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
  if (hour >= 17) timeOfDay = 'evening'

  return {
    profile,
    isOnboarded: profile.onboardingCompleted,
    greeting: `Good ${timeOfDay}, ${profile.firstName}`,
  }
}
