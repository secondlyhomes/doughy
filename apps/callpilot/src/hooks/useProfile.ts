/**
 * Profile Hook
 *
 * Production hook that loads user profile from authService.
 * Same return type as useMockProfile.
 */

import { useState, useEffect } from 'react'
import type { UserProfile } from '@/types'
import * as authService from '@/services/authService'

export interface UseProfileReturn {
  profile: UserProfile | null
  isOnboarded: boolean
  greeting: string
  isLoading: boolean
  error: string | null
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const data = await authService.getCurrentUser()
        if (!cancelled) {
          setProfile(data)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile')
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const hour = new Date().getHours()
  let timeOfDay = 'morning'
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
  if (hour >= 17) timeOfDay = 'evening'

  return {
    profile,
    isOnboarded: profile?.onboardingCompleted ?? false,
    greeting: profile ? `Good ${timeOfDay}, ${profile.firstName}` : `Good ${timeOfDay}`,
    isLoading,
    error,
  }
}
