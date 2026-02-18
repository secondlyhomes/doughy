/**
 * Briefs Hook
 *
 * Production hook that loads pre-call briefs from briefsService.
 * Same return type as useMockBriefs.
 */

import { useState, useEffect, useCallback } from 'react'
import type { PreCallBrief } from '@/types'
import * as briefsService from '@/services/briefsService'

export interface UseBriefsReturn {
  briefs: PreCallBrief[]
  getBriefForContact: (contactId: string) => PreCallBrief | undefined
  isLoading: boolean
  error: string | null
}

export function useBriefs(): UseBriefsReturn {
  const [briefs, setBriefs] = useState<PreCallBrief[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const data = await briefsService.getBriefs()
        if (!cancelled) {
          setBriefs(data)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load briefs')
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const getBriefForContact = useCallback(
    (contactId: string): PreCallBrief | undefined =>
      briefs.find((b) => b.contactId === contactId),
    [briefs]
  )

  return {
    briefs,
    getBriefForContact,
    isLoading,
    error,
  }
}
