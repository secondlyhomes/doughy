// src/features/rental-properties/screens/rental-properties-list/PropertyFiltersSheet.tsx
// Filter bottom sheet for rental properties list

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { RentalType } from '../../types';
import { QUICK_FILTERS, STATUS_OPTIONS, SORT_OPTIONS } from './constants';
import type { RentalPropertyFilters } from './types';

interface PropertyFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilter: RentalType | 'all';
  onActiveFilterChange: (filter: RentalType | 'all') => void;
  advancedFilters: RentalPropertyFilters;
  onAdvancedFiltersChange: (
    updater: (prev: RentalPropertyFilters) => RentalPropertyFilters
  ) => void;
  onClearAll: () => void;
}

export function PropertyFiltersSheet({
  visible,
  onClose,
  activeFilter,
  onActiveFilterChange,
  advancedFilters,
  onAdvancedFiltersChange,
  onClearAll,
}: PropertyFiltersSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Property Filters">
      {/* Quick Filter Pills - Rental Type */}
      <BottomSheetSection title="Rental Type">
        <View className="flex-row flex-wrap gap-2">
          {QUICK_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => onActiveFilterChange(filter.key)}
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${filter.label}${
                  isActive ? ', selected' : ''
                }`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: isActive ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Status Filter */}
      <BottomSheetSection title="Status">
        <View className="flex-row flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isActive = advancedFilters.status === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() =>
                  onAdvancedFiltersChange((prev) => ({
                    ...prev,
                    status: option.value,
                  }))
                }
                className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                style={{
                  backgroundColor: isActive
                    ? withOpacity(colors.primary, 'muted')
                    : colors.muted,
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? colors.primary : 'transparent',
                }}
                accessibilityRole="button"
                accessibilityLabel={`Status: ${option.label}${
                  isActive ? ', selected' : ''
                }`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  className="text-sm"
                  style={{
                    color: isActive ? colors.primary : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
                {isActive && <Check size={14} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Sort By */}
      <BottomSheetSection title="Sort By">
        <View className="flex-row flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => {
            const isActive = advancedFilters.sortBy === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() =>
                  onAdvancedFiltersChange((prev) => ({
                    ...prev,
                    sortBy: option.value,
                  }))
                }
                className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                style={{
                  backgroundColor: isActive
                    ? withOpacity(colors.primary, 'muted')
                    : colors.muted,
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? colors.primary : 'transparent',
                }}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${option.label}${
                  isActive ? ', selected' : ''
                }`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  className="text-sm"
                  style={{
                    color: isActive ? colors.primary : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
                {isActive && <Check size={14} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Sort Order */}
      <BottomSheetSection title="Sort Order">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor:
                advancedFilters.sortOrder === 'desc' ? colors.primary : colors.muted,
            }}
            onPress={() =>
              onAdvancedFiltersChange((prev) => ({ ...prev, sortOrder: 'desc' }))
            }
            accessibilityRole="button"
            accessibilityLabel={`Newest first${
              advancedFilters.sortOrder === 'desc' ? ', selected' : ''
            }`}
            accessibilityState={{ selected: advancedFilters.sortOrder === 'desc' }}
          >
            <Text
              className="font-medium"
              style={{
                color:
                  advancedFilters.sortOrder === 'desc'
                    ? colors.primaryForeground
                    : colors.foreground,
              }}
            >
              Newest First
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor:
                advancedFilters.sortOrder === 'asc' ? colors.primary : colors.muted,
            }}
            onPress={() =>
              onAdvancedFiltersChange((prev) => ({ ...prev, sortOrder: 'asc' }))
            }
            accessibilityRole="button"
            accessibilityLabel={`Oldest first${
              advancedFilters.sortOrder === 'asc' ? ', selected' : ''
            }`}
            accessibilityState={{ selected: advancedFilters.sortOrder === 'asc' }}
          >
            <Text
              className="font-medium"
              style={{
                color:
                  advancedFilters.sortOrder === 'asc'
                    ? colors.primaryForeground
                    : colors.foreground,
              }}
            >
              Oldest First
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetSection>

      {/* Action buttons */}
      <View className="flex-row gap-3 pt-4 pb-6">
        <Button variant="outline" onPress={onClearAll} className="flex-1">
          Clear Filters
        </Button>
        <Button onPress={onClose} className="flex-1">
          Done
        </Button>
      </View>
    </BottomSheet>
  );
}
