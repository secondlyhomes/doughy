/**
 * Cost Store
 *
 * Zustand store for monthly cost summary (in-memory only, no persistence).
 */

import { create } from 'zustand'
import type { MonthlyCostSummary } from '@/types'

interface CostState {
  summary: MonthlyCostSummary | null
  loading: boolean
  error: string | null
}

interface CostActions {
  setSummary(summary: MonthlyCostSummary): void
  setLoading(loading: boolean): void
  setError(error: string | null): void
}

export const useCostStore = create<CostState & CostActions>()(
  (set) => ({
    summary: null,
    loading: false,
    error: null,

    setSummary: (summary) => set({ summary, error: null }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }),
)
