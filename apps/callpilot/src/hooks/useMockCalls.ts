/**
 * Mock Calls Hook
 *
 * Provides call history data with filtering capabilities.
 * Will be replaced with real Supabase hook in Phase 1.
 */

import { useState, useMemo, useCallback } from 'react'
import type { Call, CallOutcome } from '@/types'
import { mockCalls } from '@/mocks'

export type CallFilter = CallOutcome | 'all' | 'this_week' | 'needs_follow_up'

export interface UseMockCallsReturn {
  calls: Call[]
  filteredCalls: Call[]
  filter: CallFilter
  setFilter: (filter: CallFilter) => void
  getCall: (id: string) => Call | undefined
  getCallsForContact: (contactId: string) => Call[]
  recentCalls: Call[]
  callsThisWeek: number
}

export function useMockCalls(): UseMockCallsReturn {
  const [filter, setFilter] = useState<CallFilter>('all')

  const calls = mockCalls

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
    (id: string) => calls.find((c) => c.id === id),
    [calls]
  )

  const getCallsForContact = useCallback(
    (contactId: string) =>
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
  }
}
