/**
 * useActivity Hook
 *
 * Wraps the activity store with filtering, data loading, and undo.
 */

import { useCallback, useMemo, useState } from 'react'
import { useActivityStore } from '@/stores/useActivityStore'
import { filterActivityEntries } from '@/services/activityService'
import { useConnectionContext } from '@/contexts/ConnectionContext'
import type { ActivityFilter, ActivityStatusFilter, ActivityConnectionFilter } from '@/types'

export const useActivity = () => {
  const {
    entries, loading, error,
    setEntries, updateEntry, undoEntry: storeUndo,
    setLoading, setError,
  } = useActivityStore()

  const { adapter } = useConnectionContext()

  const [timeFilter, setTimeFilter] = useState<ActivityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<ActivityStatusFilter>('all')
  const [connectionFilter, setConnectionFilter] = useState<ActivityConnectionFilter>('all')

  const filteredEntries = useMemo(
    () => filterActivityEntries(entries, timeFilter, statusFilter, connectionFilter),
    [entries, timeFilter, statusFilter, connectionFilter],
  )

  const pendingEntries = useMemo(
    () => entries.filter((e) => e.status === 'pending'),
    [entries],
  )
  const pendingCount = pendingEntries.length

  const loadActivity = useCallback(async () => {
    if (!adapter) return
    setLoading(true)
    setError(null)
    try {
      const data = await adapter.getActivityHistory()
      const existing = useActivityStore.getState().entries
      const bridgeEntries = existing.filter(
        e => e.id.startsWith('activity-') && !data.some(d => d.id === e.id),
      )
      setEntries([...bridgeEntries, ...data])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [adapter, setEntries, setLoading, setError])

  const undoEntry = useCallback(async (id: string) => {
    if (!adapter) return
    storeUndo(id)
    try {
      await adapter.undoActivity(id)
    } catch (err) {
      updateEntry(id, { undoneAt: null })
      setError(err instanceof Error ? err.message : 'Undo failed')
    }
  }, [adapter, storeUndo, updateEntry, setError])

  const approveEntry = useCallback(
    async (id: string, editedContent?: string) => {
      if (!adapter) return
      setError(null)
      try {
        const result = await adapter.approveAction(id, editedContent)
        if (result.success) {
          updateEntry(id, {
            status: result.newStatus === 'executed' ? 'executed' : 'approved',
            resolvedAt: new Date().toISOString(),
            executedAt: new Date().toISOString(),
            resolvedBy: 'manual-user',
            channel: 'app',
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approve failed')
      }
    },
    [adapter, updateEntry, setError],
  )

  const denyEntry = useCallback(
    async (id: string) => {
      if (!adapter) return
      setError(null)
      try {
        await adapter.denyAction(id)
        updateEntry(id, {
          status: 'denied',
          resolvedAt: new Date().toISOString(),
          resolvedBy: 'manual-user',
          channel: 'app',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Deny failed')
      }
    },
    [adapter, updateEntry, setError],
  )

  return {
    entries: filteredEntries,
    allEntries: entries,
    pendingEntries,
    pendingCount,
    loading,
    error,
    loadActivity,
    approveEntry,
    denyEntry,
    undoEntry,
    timeFilter,
    setTimeFilter,
    statusFilter,
    setStatusFilter,
    connectionFilter,
    setConnectionFilter,
  }
}
