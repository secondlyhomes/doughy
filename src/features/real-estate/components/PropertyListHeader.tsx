// src/features/real-estate/components/PropertyListHeader.tsx
// Header component for property list with search, filters, and view toggle

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Filter, Grid, List, ArrowUpDown, X } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { PropertyFilters, SORT_OPTIONS, SortOption } from '../hooks/usePropertyFilters';

interface PropertyListHeaderProps {
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  filters: PropertyFilters;
  sortBy: SortOption;
  onShowSort: () => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export function PropertyListHeader({
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  activeFilterCount,
  filters,
  sortBy,
  onShowSort,
  onResetFilters,
  totalCount,
  filteredCount,
}: PropertyListHeaderProps) {
  const colors = useThemeColors();
  const getCurrentSortLabel = () => {
    const option = SORT_OPTIONS.find(o => o.value === sortBy);
    return option?.label || 'Newest First';
  };

  return (
    <View>
      {/* Filter, Sort, and View Toggle */}
      <View className="pb-3">
        <View className="flex-row justify-between items-center">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onShowSort}
            className="flex-row items-center px-3 py-2 rounded-xl"
            style={{ backgroundColor: colors.muted }}
          >
            <ArrowUpDown size={16} color={colors.mutedForeground} />
            <Text className="ml-2 font-medium" style={{ color: colors.mutedForeground }}>
              {getCurrentSortLabel()}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row rounded-xl" style={{ backgroundColor: colors.muted }}>
          <TouchableOpacity
            onPress={() => onViewModeChange('list')}
            className="px-3 py-2 rounded-xl"
            style={viewMode === 'list' ? { backgroundColor: colors.primary } : undefined}
          >
            <List size={18} color={viewMode === 'list' ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onViewModeChange('grid')}
            className="px-3 py-2 rounded-xl"
            style={viewMode === 'grid' ? { backgroundColor: colors.primary } : undefined}
          >
            <Grid size={18} color={viewMode === 'grid' ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        </View>
      </View>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <View className="pb-3">
          <View className="flex-row flex-wrap gap-2">
          {filters.status.length > 0 && (
            <View
              className="flex-row items-center px-3 py-1 rounded-full"
              style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                Status: {filters.status.length}
              </Text>
            </View>
          )}
          {filters.propertyType.length > 0 && (
            <View
              className="flex-row items-center px-3 py-1 rounded-full"
              style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                Type: {filters.propertyType.length}
              </Text>
            </View>
          )}
          {(filters.priceMin !== null || filters.priceMax !== null) && (
            <View
              className="flex-row items-center px-3 py-1 rounded-full"
              style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>Price Range</Text>
            </View>
          )}
          {(filters.arvMin !== null || filters.arvMax !== null) && (
            <View
              className="flex-row items-center px-3 py-1 rounded-full"
              style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>ARV Range</Text>
            </View>
          )}
          {(filters.city || filters.state) && (
            <View
              className="flex-row items-center px-3 py-1 rounded-full"
              style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>Location</Text>
            </View>
          )}
          <TouchableOpacity onPress={onResetFilters} className="flex-row items-center px-3 py-1">
            <X size={14} color={colors.primary} />
            <Text className="text-sm font-medium ml-1" style={{ color: colors.primary }}>Clear</Text>
          </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Results Count */}
      <View className="pb-3">
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>
          {filteredCount} {filteredCount === 1 ? 'property' : 'properties'}
          {hasActiveFilters && totalCount !== filteredCount ? ` of ${totalCount}` : ''}
        </Text>
      </View>
    </View>
  );
}
