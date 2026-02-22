/**
 * Communications Hook
 *
 * Production hook that loads communications from communicationsService.
 * Same return type as useMockCommunications.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Communication, CommunicationChannel } from '@/types'
import * as communicationsService from '@/services/communicationsService'

export type ChannelFilter = CommunicationChannel | 'all'

export interface DateGroup {
  title: string
  data: Communication[]
}

export interface UseCommunicationsReturn {
  communications: Communication[]
  filteredCommunications: Communication[]
  channelFilter: ChannelFilter
  setChannelFilter: (filter: ChannelFilter) => void
  getTimelineForContact: (contactId: string) => Communication[]
  recentActivity: Communication[]
  dateGroups: DateGroup[]
  isLoading: boolean
  error: string | null
}

function getDateGroupTitle(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  if (diffDays < 14) return 'Last Week'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function groupByDate(items: Communication[]): DateGroup[] {
  const groups = new Map<string, Communication[]>()

  for (const item of items) {
    const title = getDateGroupTitle(item.createdAt)
    const existing = groups.get(title)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(title, [item])
    }
  }

  return Array.from(groups, ([title, data]) => ({ title, data }))
}

export function useCommunications(): UseCommunicationsReturn {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const data = await communicationsService.getCommunications()
        if (!cancelled) {
          setCommunications(data)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load communications'
          )
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const sorted = useMemo(
    () =>
      [...communications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [communications]
  )

  const filteredCommunications = useMemo(() => {
    if (channelFilter === 'all') return sorted
    return sorted.filter((c) => c.channel === channelFilter)
  }, [sorted, channelFilter])

  const dateGroups = useMemo(
    () => groupByDate(filteredCommunications),
    [filteredCommunications]
  )

  const getTimelineForContact = useCallback(
    (contactId: string): Communication[] =>
      sorted.filter((c) => c.contactId === contactId),
    [sorted]
  )

  const recentActivity = useMemo(() => sorted.slice(0, 8), [sorted])

  return {
    communications: sorted,
    filteredCommunications,
    channelFilter,
    setChannelFilter,
    getTimelineForContact,
    recentActivity,
    dateGroups,
    isLoading,
    error,
  }
}
