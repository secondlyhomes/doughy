/**
 * Queue Store
 *
 * Zustand store for the action queue (in-memory only, no persistence).
 * Holds items that are pending approval, counting down, or recently resolved.
 */

import { create } from 'zustand'
import type { QueueItem } from '@/types'

interface QueueState {
  items: QueueItem[]
  loading: boolean
  error: string | null
}

interface QueueActions {
  setItems(items: QueueItem[]): void
  updateItem(id: string, updates: Partial<QueueItem>): void
  removeItem(id: string): void
  setLoading(loading: boolean): void
  setError(error: string | null): void
  getPendingCount(): number
  getCountdownItems(): QueueItem[]
  getPendingItems(): QueueItem[]
}

export const useQueueStore = create<QueueState & QueueActions>()(
  (set, get) => ({
    items: [],
    loading: false,
    error: null,

    setItems: (items) => set({ items, error: null }),

    updateItem: (id, updates) =>
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      })),

    removeItem: (id) =>
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),

    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    getPendingCount: () =>
      get().items.filter((i) => i.status === 'pending' || i.status === 'countdown').length,

    getCountdownItems: () =>
      get().items.filter((i) => i.status === 'countdown'),

    getPendingItems: () =>
      get().items.filter((i) => i.status === 'pending'),
  }),
)
