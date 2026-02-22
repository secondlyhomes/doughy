/**
 * Activity Service
 *
 * Provides activity feed filtering operations.
 */

import type { ActionHistoryEntry, ActivityFilter, ActivityStatusFilter, ActivityConnectionFilter } from '@/types'

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return d >= startOfWeek
}

export function filterActivityEntries(
  entries: ActionHistoryEntry[],
  timeFilter: ActivityFilter,
  statusFilter: ActivityStatusFilter,
  connectionFilter: ActivityConnectionFilter,
): ActionHistoryEntry[] {
  let filtered = [...entries]

  if (timeFilter === 'today') {
    filtered = filtered.filter((e) => isToday(e.requestedAt))
  } else if (timeFilter === 'this-week') {
    filtered = filtered.filter((e) => isThisWeek(e.requestedAt))
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter((e) => e.status === statusFilter)
  }

  if (connectionFilter !== 'all') {
    filtered = filtered.filter((e) => e.connectionId === connectionFilter)
  }

  return filtered.sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
  )
}
