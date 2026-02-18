// src/hooks/useListFilters.ts
// Reusable hook for managing list filter state
// Consolidates filter patterns from LeadsFiltersSheet, ContactsFiltersSheet, etc.

import { useState, useCallback, useMemo, useEffect } from 'react';

export interface UseListFiltersOptions<T extends Record<string, unknown>> {
  /** Initial filter values (current applied filters) */
  initialFilters: T;
  /** Default filter values for reset */
  defaultFilters: T;
  /**
   * Apply mode:
   * - 'deferred': Changes are staged locally, then applied via applyFilters()
   * - 'immediate': Changes apply immediately via onChange callback
   */
  mode?: 'deferred' | 'immediate';
  /** Callback when filters change (required for 'immediate' mode) */
  onChange?: (filters: T) => void;
}

export interface UseListFiltersReturn<T extends Record<string, unknown>> {
  /** Current filter values (local state for deferred, applied for immediate) */
  filters: T;
  /** Update a single filter value */
  updateFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Update multiple filter values at once */
  updateFilters: (updates: Partial<T>) => void;
  /** Reset all filters to default values */
  resetFilters: () => void;
  /** Apply staged filters (deferred mode only) */
  applyFilters: () => T;
  /** Discard staged changes and revert to applied filters (deferred mode only) */
  discardChanges: () => void;
  /** Check if any filter differs from default */
  hasActiveFilters: boolean;
  /** Check if local filters differ from applied (deferred mode only) */
  hasUnsavedChanges: boolean;
  /** Sync local filters with external state (useful when sheet opens) */
  syncWithExternal: (externalFilters: T) => void;
}

/**
 * Hook for managing list filter state
 *
 * @example Deferred mode (for Modal-based filters with Apply button)
 * ```tsx
 * const {
 *   filters,
 *   updateFilter,
 *   resetFilters,
 *   applyFilters,
 *   hasActiveFilters,
 * } = useListFilters({
 *   initialFilters: appliedFilters,
 *   defaultFilters: DEFAULT_FILTERS,
 *   mode: 'deferred',
 * });
 *
 * // In Apply button handler:
 * const handleApply = () => {
 *   const newFilters = applyFilters();
 *   setAppliedFilters(newFilters);
 *   onClose();
 * };
 * ```
 *
 * @example Immediate mode (for BottomSheet filters that apply on change)
 * ```tsx
 * const {
 *   filters,
 *   updateFilter,
 *   resetFilters,
 *   hasActiveFilters,
 * } = useListFilters({
 *   initialFilters: appliedFilters,
 *   defaultFilters: DEFAULT_FILTERS,
 *   mode: 'immediate',
 *   onChange: setAppliedFilters,
 * });
 * ```
 */
export function useListFilters<T extends Record<string, unknown>>({
  initialFilters,
  defaultFilters,
  mode = 'deferred',
  onChange,
}: UseListFiltersOptions<T>): UseListFiltersReturn<T> {
  // Local filter state (for deferred mode, this is staged changes)
  const [localFilters, setLocalFilters] = useState<T>(initialFilters);

  // Track the last applied filters (for detecting unsaved changes in deferred mode)
  const [appliedFilters, setAppliedFilters] = useState<T>(initialFilters);

  // Update a single filter value
  const updateFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const newFilters = { ...localFilters, [key]: value } as T;
      setLocalFilters(newFilters);

      if (mode === 'immediate' && onChange) {
        onChange(newFilters);
        setAppliedFilters(newFilters);
      }
    },
    [localFilters, mode, onChange]
  );

  // Update multiple filter values at once
  const updateFilters = useCallback(
    (updates: Partial<T>) => {
      const newFilters = { ...localFilters, ...updates } as T;
      setLocalFilters(newFilters);

      if (mode === 'immediate' && onChange) {
        onChange(newFilters);
        setAppliedFilters(newFilters);
      }
    },
    [localFilters, mode, onChange]
  );

  // Reset all filters to default values
  const resetFilters = useCallback(() => {
    setLocalFilters(defaultFilters);

    if (mode === 'immediate' && onChange) {
      onChange(defaultFilters);
      setAppliedFilters(defaultFilters);
    }
  }, [defaultFilters, mode, onChange]);

  // Apply staged filters (deferred mode)
  const applyFilters = useCallback((): T => {
    setAppliedFilters(localFilters);
    if (onChange) {
      onChange(localFilters);
    }
    return localFilters;
  }, [localFilters, onChange]);

  // Discard changes and revert to applied state (deferred mode)
  const discardChanges = useCallback(() => {
    setLocalFilters(appliedFilters);
  }, [appliedFilters]);

  // Sync local filters with external state
  const syncWithExternal = useCallback((externalFilters: T) => {
    setLocalFilters(externalFilters);
    setAppliedFilters(externalFilters);
  }, []);

  // Check if any filter differs from default
  const hasActiveFilters = useMemo(() => {
    return Object.keys(defaultFilters).some(
      (key) => localFilters[key as keyof T] !== defaultFilters[key as keyof T]
    );
  }, [localFilters, defaultFilters]);

  // Check if local filters differ from applied (deferred mode)
  const hasUnsavedChanges = useMemo(() => {
    if (mode !== 'deferred') return false;
    return Object.keys(appliedFilters).some(
      (key) => localFilters[key as keyof T] !== appliedFilters[key as keyof T]
    );
  }, [localFilters, appliedFilters, mode]);

  return {
    filters: localFilters,
    updateFilter,
    updateFilters,
    resetFilters,
    applyFilters,
    discardChanges,
    hasActiveFilters,
    hasUnsavedChanges,
    syncWithExternal,
  };
}

export default useListFilters;
