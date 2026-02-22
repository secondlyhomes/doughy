/**
 * Calls Hook
 *
 * Production hook that loads calls from callsService.
 * Same return type as useMockCalls.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Call, CallOutcome } from '@/types'
import * as callsService from '@/services/callsService'

export type CallFilter = CallOutcome | 'all' | 'this_week' | 'needs_follow_up'

export interface UseCallsReturn {
  calls: Call[]
  filteredCalls: Call[]
  filter: CallFilter
  setFilter: (filter: CallFilter) => void
  getCall: (id: string) => Call | undefined
  getCallsForContact: (contactId: string) => Call[]
  recentCalls: Call[]
  callsThisWeek: number
  isLoading: boolean
  error: string | null
}

export function useCalls(): UseCallsReturn {
  const [calls, setCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<CallFilter>('all')

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const data = await callsService.getCalls()
        if (!cancelled) {
          setCalls(data)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load calls')
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const filteredCalls = useMemo(() => {
    let result = [...calls].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )

    if (filter === 'all') return result

    if (filter === 'this_week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return result.filter((c) => new Date(c.startedAt) >= weekAgo)
    }

    if (filter === 'needs_follow_up') {
      return result.filter((c) => c.outcome === 'follow_up' || c.outcome === 'progressed')
    }

    return result.filter((c) => c.outcome === filter)
  }, [calls, filter])

  const getCall = useCallback(
    (id: string): Call | undefined => calls.find((c) => c.id === id),
    [calls]
  )

  const getCallsForContact = useCallback(
    (contactId: string): Call[] =>
      calls
        .filter((c) => c.contactId === contactId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [calls]
  )

  const recentCalls = useMemo(
    () =>
      [...calls]
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 5),
    [calls]
  )

  const callsThisWeek = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return calls.filter((c) => new Date(c.startedAt) >= weekAgo).length
  }, [calls])

  return {
    calls,
    filteredCalls,
    filter,
    setFilter,
    getCall,
    getCallsForContact,
    recentCalls,
    callsThisWeek,
    isLoading,
    error,
  }
}
