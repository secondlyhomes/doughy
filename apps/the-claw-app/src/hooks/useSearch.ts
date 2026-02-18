/**
 * useSearch Hook
 *
 * Debounced cross-section search with filter support.
 * Reads raw data from queue/activity/connections/cost stores,
 * applies text search + filters, returns filtered data arrays.
 * When search is inactive, returns original data unchanged.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useSearchStore } from '@/stores/useSearchStore'
import { useQueueStore } from '@/stores/useQueueStore'
import { useActivityStore } from '@/stores/useActivityStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useCostStore } from '@/stores/useCostStore'
import {
  ACTION_TYPE_CATEGORIES,
  SERVICE_CONNECTION_MAP,
  getActiveFilterLabels,
} from '@/types/search'
import type { QueueItem, ActionHistoryEntry, ServiceConnection, MonthlyCostSummary } from '@/types'
import type { SearchFilters } from '@/types/search'

const DEBOUNCE_MS = 300

function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(q))
}

function matchesActionType(actionType: SearchFilters['actionType'], itemActionType: string | null | undefined): boolean {
  if (actionType === 'all') return true
  if (!itemActionType) return false
  const matchTypes = ACTION_TYPE_CATEGORIES[actionType]
  return matchTypes.includes(itemActionType)
}

function matchesDateRange(dateRange: SearchFilters['dateRange'], dateStr: string | null | undefined): boolean {
  if (dateRange === 'all') return true
  if (!dateStr) return false
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return true // include items with malformed dates rather than silently excluding
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (dateRange) {
    case 'today':
      return date >= startOfDay
    case 'this-week': {
      const startOfWeek = new Date(startOfDay)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      return date >= startOfWeek
    }
    case 'this-month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return date >= startOfMonth
    }
    default:
      return true
  }
}

function matchesService(service: SearchFilters['service'], connectionId: string | null | undefined): boolean {
  if (service === 'all') return true
  if (connectionId == null) return false
  const matchIds = SERVICE_CONNECTION_MAP[service]
  return matchIds.includes(connectionId as any)
}

export function useSearch() {
  const {
    query, debouncedQuery, filters, filterSheetVisible,
    setQuery, setDebouncedQuery, setFilters, resetFilter, resetAll, setFilterSheetVisible,
  } = useSearchStore()

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce query
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, DEBOUNCE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, setDebouncedQuery])

  // Read raw data from stores
  const queueItems = useQueueStore((s) => s.items)
  const activityEntries = useActivityStore((s) => s.entries)
  const connections = useConnectionStore((s) => s.connections)
  const costSummary = useCostStore((s) => s.summary)

  // Derived from subscribed state (not imperative get())
  const hasActiveSearch = debouncedQuery.length > 0 ||
    filters.actionType !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.service !== 'all'

  // Filter queue items
  const filteredQueue = useMemo(() => {
    if (!hasActiveSearch) return queueItems
    return queueItems.filter((item: QueueItem) =>
      matchesQuery(debouncedQuery, item.title, item.summary, item.actionType) &&
      matchesActionType(filters.actionType, item.actionType) &&
      matchesDateRange(filters.dateRange, item.createdAt) &&
      matchesService(filters.service, item.connectionId),
    )
  }, [queueItems, debouncedQuery, filters, hasActiveSearch])

  // Filter activity entries
  const filteredActivity = useMemo(() => {
    if (!hasActiveSearch) return activityEntries
    return activityEntries.filter((entry: ActionHistoryEntry) =>
      matchesQuery(debouncedQuery, entry.description, entry.tool) &&
      matchesActionType(filters.actionType, entry.tool) &&
      matchesDateRange(filters.dateRange, entry.requestedAt) &&
      matchesService(filters.service, entry.connectionId),
    )
  }, [activityEntries, debouncedQuery, filters, hasActiveSearch])

  // Filter connections (text query only — date/service filters don't apply to connection objects)
  const filteredConnections = useMemo(() => {
    if (!hasActiveSearch) return connections
    if (!debouncedQuery) return connections
    return connections.filter((conn: ServiceConnection) =>
      matchesQuery(debouncedQuery, conn.name, conn.summary, conn.id),
    )
  }, [connections, debouncedQuery, hasActiveSearch])

  // Cost summary: pass through (not filterable by text, but include if any text matches breakdown labels)
  const filteredCost = useMemo((): MonthlyCostSummary | null => {
    if (!hasActiveSearch || !costSummary) return costSummary
    if (!debouncedQuery) return costSummary
    const matchesBreakdown = costSummary.breakdown.some((item) =>
      matchesQuery(debouncedQuery, item.label),
    )
    return matchesBreakdown ? costSummary : null
  }, [costSummary, debouncedQuery, hasActiveSearch])

  const totalResults =
    filteredQueue.length +
    filteredActivity.length +
    filteredConnections.length +
    (filteredCost ? 1 : 0)

  // Derived from subscribed filters (not imperative get())
  const activeFilterLabels = useMemo(() => getActiveFilterLabels(filters), [filters])

  return {
    query,
    setQuery,
    filters,
    setFilters,
    resetFilter,
    resetAll,
    activeFilterLabels,
    hasActiveSearch,
    totalResults,
    filteredQueue,
    filteredActivity,
    filteredConnections,
    filteredCost,
    filterSheetVisible,
    setFilterSheetVisible,
  }
}
