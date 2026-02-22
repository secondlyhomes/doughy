/**
 * Search Store
 *
 * Zustand store for search query, filters, and filter sheet visibility.
 * No persistence — search state resets on app restart.
 */

import { create } from 'zustand'
import { DEFAULT_SEARCH_FILTERS } from '@/types/search'
import type { SearchFilters } from '@/types/search'

interface SearchState {
  query: string
  debouncedQuery: string
  filters: SearchFilters
  filterSheetVisible: boolean
}

interface SearchActions {
  setQuery(query: string): void
  setDebouncedQuery(query: string): void
  setFilters(filters: Partial<SearchFilters>): void
  resetFilter(key: keyof SearchFilters): void
  resetAll(): void
  setFilterSheetVisible(visible: boolean): void
}

export const useSearchStore = create<SearchState & SearchActions>()(
  (set) => ({
    query: '',
    debouncedQuery: '',
    filters: { ...DEFAULT_SEARCH_FILTERS },
    filterSheetVisible: false,

    setQuery: (query) => set({ query }),
    setDebouncedQuery: (debouncedQuery) => set({ debouncedQuery }),

    setFilters: (partial) =>
      set((state) => ({ filters: { ...state.filters, ...partial } })),

    resetFilter: (key) =>
      set((state) => ({ filters: { ...state.filters, [key]: DEFAULT_SEARCH_FILTERS[key] } })),

    resetAll: () => set({ query: '', debouncedQuery: '', filters: { ...DEFAULT_SEARCH_FILTERS } }),

    setFilterSheetVisible: (visible) => set({ filterSheetVisible: visible }),
  }),
)
