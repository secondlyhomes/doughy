/**
 * Call Coaching Hook
 *
 * Loads coaching data for a contact's active call.
 * Provides markSuggestionUsed to dim/check off used suggestions.
 */

import { useState, useEffect, useCallback } from 'react'
import type { CallCoaching } from '@/types'
import * as coachingService from '@/services/coachingService'

export interface UseCallCoachingReturn {
  coaching: CallCoaching | null
  isLoading: boolean
  error: string | null
  markSuggestionUsed: (id: string) => void
}

export function useCallCoaching(contactId: string): UseCallCoachingReturn {
  const [coaching, setCoaching] = useState<CallCoaching | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const data = await coachingService.getCoachingForContact(contactId)
        if (!cancelled) {
          setCoaching(data)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load coaching')
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [contactId])

  const markSuggestionUsed = useCallback((id: string) => {
    setCoaching((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        suggestions: prev.suggestions.map((s) =>
          s.id === id ? { ...s, used: true } : s
        ),
      }
    })
  }, [])

  return { coaching, isLoading, error, markSuggestionUsed }
}
