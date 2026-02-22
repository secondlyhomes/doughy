// src/components/ui/FilterSheet.tsx
// Base component for filter sheets with consistent structure
// Provides header (close, title, reset), scrollable content, and footer (clear, apply)

import React from 'react';
import { View, Modal, ScrollView } from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { BottomSheet, BottomSheetSection } from './BottomSheet';
import { Button } from './Button';
import { FilterSheetHeader } from './FilterSheetHeader';
import { FilterSheetFooter } from './FilterSheetFooter';
import type { FilterSheetProps } from './filter-sheet-types';

/**
 * FilterSheet - Base component for filter sheets
 *
 * Provides consistent structure for filter UIs:
 * - Header with close, title, and reset buttons
 * - Scrollable content area
 * - Footer with action buttons
 *
 * @example Modal presentation with apply button (deferred filters)
 * ```tsx
 * <FilterSheet
 *   visible={showFilters}
 *   onClose={() => setShowFilters(false)}
 *   title="Filter Leads"
 *   onReset={resetFilters}
 *   onApply={handleApply}
 *   hasActiveFilters={hasActiveFilters}
 *   hasUnsavedChanges={hasUnsavedChanges}
 *   presentation="modal"
 *   footerStyle="apply"
 * >
 *   <FilterSection title="Status">
 *     {statusOptions.map(...)}
 *   </FilterSection>
 * </FilterSheet>
 * ```
 *
 * @example Bottom sheet with done button (immediate filters)
 * ```tsx
 * <FilterSheet
 *   visible={showFilters}
 *   onClose={() => setShowFilters(false)}
 *   title="Contact Filters"
 *   onReset={resetFilters}
 *   hasActiveFilters={hasActiveFilters}
 *   presentation="sheet"
 *   footerStyle="done"
 * >
 *   <FilterSection title="Type">
 *     {typeOptions.map(...)}
 *   </FilterSection>
 * </FilterSheet>
 * ```
 */
export function FilterSheet({
  visible,
  onClose,
  title = 'Filters',
  onReset,
  onApply,
  hasActiveFilters = false,
  hasUnsavedChanges = false,
  children,
  presentation = 'modal',
  footerStyle = 'apply',
  applyLabel = 'Apply Filters',
  clearLabel = 'Clear Filters',
}: FilterSheetProps) {
  // Modal presentation
  if (presentation === 'modal') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <ThemedSafeAreaView className="flex-1" edges={['top']}>
          <FilterSheetHeader
            title={title}
            hasActiveFilters={hasActiveFilters}
            onClose={onClose}
            onReset={onReset}
          />
          <ScrollView className="flex-1 px-4 pt-4">
            {children}
            {/* Bottom padding for scroll content */}
            <View className="h-24" />
          </ScrollView>
          <FilterSheetFooter
            footerStyle={footerStyle}
            onClose={onClose}
            onApply={onApply}
            onReset={onReset}
            applyLabel={applyLabel}
            clearLabel={clearLabel}
          />
        </ThemedSafeAreaView>
      </Modal>
    );
  }

  // Bottom sheet presentation
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {children}
      {footerStyle !== 'none' && (
        <View className="flex-row gap-3 pt-4 pb-6">
          {footerStyle === 'apply' ? (
            <Button onPress={onApply ?? onClose} size="lg" className="w-full">
              {applyLabel}
            </Button>
          ) : (
            <>
              <Button variant="outline" onPress={onReset} className="flex-1">
                {clearLabel}
              </Button>
              <Button onPress={onClose} className="flex-1">
                Done
              </Button>
            </>
          )}
        </View>
      )}
    </BottomSheet>
  );
}

// Re-export BottomSheetSection as FilterSection for convenience
export { BottomSheetSection as FilterSection };
export type { BottomSheetSectionProps as FilterSectionProps } from './BottomSheet';

// Re-export types and control components from extracted files
export type { FilterSheetProps, FilterOptionButtonProps, FilterChipProps, FilterToggleRowProps } from './filter-sheet-types';
export { FilterOptionButton, FilterChip, FilterToggleRow } from './FilterSheetControls';

export default FilterSheet;
