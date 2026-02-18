/**
 * useSearchBarFilters
 *
 * Legacy hook — SearchBar now handles inline filter pills directly.
 * Kept as a no-op re-export for any remaining imports.
 *
 * @deprecated Use SearchBar's built-in filter props instead.
 */

export interface ActivePill {
  key: string
  label: string
  onRemove: () => void
}

export interface UseSearchBarFiltersResult {
  hasFilter: boolean
  isFiltered: boolean
  activeFilterPills: ActivePill[]
  handleFilter: () => void
}

export function useSearchBarFilters(): UseSearchBarFiltersResult {
  return {
    hasFilter: false,
    isFiltered: false,
    activeFilterPills: [],
    handleFilter: () => {},
  }
}
