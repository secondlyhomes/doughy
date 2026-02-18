/**
 * useQueue Hook
 *
 * Wraps the queue store with gateway adapter calls.
 * Manages countdown timer logic: 1-second interval checks countdownEndsAt
 * against Date.now(), auto-marks expired items as executed.
 *
 * Subscribes to Supabase Realtime changes on claw.action_queue for live updates.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQueueStore } from '@/stores/useQueueStore'
import { useConnectionContext } from '@/contexts/ConnectionContext'
import { supabase } from '@/lib/supabase'
import { useTrustStore } from '@/stores/useTrustStore'
import { useActivityStore } from '@/stores/useActivityStore'
import { queueItemToActivityEntry } from '@/utils/queueToActivity'
import type { ConnectionId, QueueItem } from '@/types'

function rowToQueueItem(row: any): QueueItem {
  return {
    id: row.id,
    connectionId: row.connection_id as ConnectionId,
    actionType: row.action_type,
    title: row.title,
    summary: row.summary || '',
    status: row.status as QueueItem['status'],
    riskLevel: row.risk_level as QueueItem['riskLevel'],
    countdownEndsAt: row.countdown_ends_at,
    createdAt: row.created_at,
  }
}

export const useQueue = () => {
  const {
    items, loading, error,
    setItems, updateItem,
    setLoading, setError,
    getCountdownItems,
  } = useQueueStore()

  const { adapter, isConnected } = useConnectionContext()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadQueue = useCallback(async () => {
    if (!adapter) return
    setLoading(true)
    setError(null)
    try {
      const data = await adapter.getQueueItems()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }, [adapter, setItems, setLoading, setError])

  const bridgeToActivity = useCallback((item: QueueItem, status: QueueItem['status']) => {
    const trustLevel = useTrustStore.getState().trustLevel
    const entry = queueItemToActivityEntry({ ...item, status }, { trustLevel })
    useActivityStore.getState().addEntry(entry)
  }, [])

  const cancel = useCallback(async (id: string) => {
    if (!adapter) return
    const prev = useQueueStore.getState().items.find(i => i.id === id)
    updateItem(id, { status: 'cancelled' })
    try {
      await adapter.cancelQueueItem(id)
      if (prev) bridgeToActivity(prev, 'cancelled')
    } catch (err) {
      if (prev) updateItem(id, { status: prev.status })
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }, [adapter, updateItem, setError, bridgeToActivity])

  const approve = useCallback(async (id: string) => {
    if (!adapter) return
    const prev = useQueueStore.getState().items.find(i => i.id === id)
    updateItem(id, { status: 'approved' })
    try {
      await adapter.approveQueueItem(id)
      if (prev) bridgeToActivity(prev, 'approved')
    } catch (err) {
      if (prev) updateItem(id, { status: prev.status })
      setError(err instanceof Error ? err.message : 'Failed to approve')
    }
  }, [adapter, updateItem, setError, bridgeToActivity])

  const deny = useCallback(async (id: string) => {
    if (!adapter) return
    const prev = useQueueStore.getState().items.find(i => i.id === id)
    updateItem(id, { status: 'denied' })
    try {
      await adapter.denyQueueItem(id)
      if (prev) bridgeToActivity(prev, 'denied')
    } catch (err) {
      if (prev) updateItem(id, { status: prev.status })
      setError(err instanceof Error ? err.message : 'Failed to deny')
    }
  }, [adapter, updateItem, setError, bridgeToActivity])

  // Countdown timer: check every second for expired items
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const countdownItems = getCountdownItems()
      for (const item of countdownItems) {
        if (item.countdownEndsAt && new Date(item.countdownEndsAt).getTime() <= now) {
          updateItem(item.id, { status: 'executed' })
          bridgeToActivity(item, 'executed')
        }
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [getCountdownItems, updateItem, bridgeToActivity])

  // Supabase Realtime subscription for live queue updates
  useEffect(() => {
    if (!isConnected) return

    const channel = supabase
      .channel('queue-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'claw', table: 'action_queue' },
        (payload) => {
          const state = useQueueStore.getState()
          if (payload.eventType === 'INSERT') {
            const newItem = rowToQueueItem(payload.new)
            if ((newItem.status === 'pending' || newItem.status === 'countdown')
              && !state.items.some(i => i.id === newItem.id)) {
              state.setItems([...state.items, newItem])
            }
          } else if (payload.eventType === 'UPDATE') {
            state.updateItem(payload.new.id, {
              status: payload.new.status,
              countdownEndsAt: payload.new.countdown_ends_at,
            })
          } else if (payload.eventType === 'DELETE') {
            state.setItems(state.items.filter(i => i.id !== payload.old.id))
          }
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('[Queue Realtime] Subscription status:', status, err.message)
        }
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.error('[Queue Realtime] Subscription ended:', status)
          useQueueStore.getState().setError('Live updates disconnected. Pull to refresh.')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isConnected])

  const countdownItems = useMemo(() => items.filter(i => i.status === 'countdown'), [items])
  const pendingItems = useMemo(() => items.filter(i => i.status === 'pending'), [items])
  const pendingCount = pendingItems.length

  return {
    items,
    pendingCount,
    countdownItems,
    pendingItems,
    loading,
    error,
    loadQueue,
    cancel,
    approve,
    deny,
  }
}
