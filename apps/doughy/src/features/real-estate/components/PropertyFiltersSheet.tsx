// src/features/real-estate/components/PropertyFiltersSheet.tsx
// Bottom sheet for filtering properties — thin orchestrator

import React, { useState, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { PropertyStatus, PropertyType } from '../types';
import { PropertyFilters, DEFAULT_FILTERS } from '../hooks/usePropertyFilters';
import { PropertyFiltersSheetProps } from './property-filters-types';
import { FilterViewModeSection } from './FilterViewModeSection';
import { FilterSortBySection } from './FilterSortBySection';
import { FilterStatusSection } from './FilterStatusSection';
import { FilterPropertyTypeSection } from './FilterPropertyTypeSection';
import { FilterRangeSections } from './FilterRangeSections';

export function PropertyFiltersSheet({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: PropertyFiltersSheetProps) {
  // Local state for editing filters before applying
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);

  // Sync local filters when prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleStatus = useCallback((status: PropertyStatus) => {
    setLocalFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  }, []);

  const togglePropertyType = useCallback((type: PropertyType) => {
    setLocalFilters(prev => ({
      ...prev,
      propertyType: prev.propertyType.includes(type)
        ? prev.propertyType.filter(t => t !== type)
        : [...prev.propertyType, type],
    }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(localFilters);
    onClose();
  }, [localFilters, onApply, onClose]);

  const handleReset = useCallback(() => {
    setLocalFilters(DEFAULT_FILTERS);
    onReset();
  }, [onReset]);

  const handleClose = useCallback(() => {
    setLocalFilters(filters);
    onClose();
  }, [filters, onClose]);

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="Filters & View Options"
    >
      <FilterViewModeSection viewMode={viewMode} onViewModeChange={onViewModeChange} />
      <FilterSortBySection sortBy={sortBy} onSortChange={onSortChange} />
      <FilterStatusSection selectedStatuses={localFilters.status} onToggleStatus={toggleStatus} />
      <FilterPropertyTypeSection selectedTypes={localFilters.propertyType} onTogglePropertyType={togglePropertyType} />
      <FilterRangeSections localFilters={localFilters} setLocalFilters={setLocalFilters} />

      {/* Action Buttons */}
      <View className="flex-row gap-3 pt-4 pb-6">
        <Button
          variant="outline"
          onPress={handleReset}
          className="flex-1"
        >
          Reset
        </Button>
        <Button
          onPress={handleApply}
          className="flex-1"
        >
          Apply Filters
        </Button>
      </View>
    </BottomSheet>
  );
}
