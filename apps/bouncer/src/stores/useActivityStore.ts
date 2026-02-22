/**
 * Activity Store
 *
 * Zustand store with AsyncStorage persistence for the activity history.
 * Stores the full audit trail of all actions taken by the AI agent.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ActionHistoryEntry } from '@/types'

interface ActivityState {
  entries: ActionHistoryEntry[]
  loading: boolean
  error: string | null
}

interface ActivityActions {
  setEntries(entries: ActionHistoryEntry[]): void
  addEntry(entry: ActionHistoryEntry): void
  updateEntry(id: string, updates: Partial<ActionHistoryEntry>): void
  undoEntry(id: string): void
  setLoading(loading: boolean): void
  setError(error: string | null): void
  getPendingEntries(): ActionHistoryEntry[]
  getResolvedEntries(): ActionHistoryEntry[]
}

export const useActivityStore = create<ActivityState & ActivityActions>()(
  persist(
    (set, get) => ({
      entries: [],
      loading: false,
      error: null,

      setEntries: (entries) => set({ entries, error: null }),

      addEntry: (entry) =>
        set((state) => {
          if (state.entries.some(e => e.id === entry.id)) return state
          return { entries: [entry, ...state.entries] }
        }),

      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        })),

      undoEntry: (id) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, undoneAt: new Date().toISOString() } : e,
          ),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      getPendingEntries: () =>
        get().entries.filter((e) => e.status === 'pending'),

      getResolvedEntries: () =>
        get().entries.filter((e) => e.status !== 'pending'),
    }),
    {
      name: '@the-claw/activity-history',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
)
