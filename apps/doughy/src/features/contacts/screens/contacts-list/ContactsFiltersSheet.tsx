// src/features/contacts/screens/contacts-list/ContactsFiltersSheet.tsx
// Bottom sheet for contact filters

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { CONTACT_TYPE_FILTERS, STATUS_OPTIONS, SOURCE_OPTIONS, SORT_OPTIONS } from './constants';
import { FilterChip } from './FilterChip';
import type { ContactsFiltersSheetProps } from './types';

export function ContactsFiltersSheet({
  visible,
  onClose,
  activeTypeFilter,
  advancedFilters,
  onTypeFilterChange,
  onAdvancedFiltersChange,
  onClearAll,
}: ContactsFiltersSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Contact Filters">
      {/* Contact Type Quick Filters */}
      <BottomSheetSection title="Contact Type">
        <View className="flex-row flex-wrap gap-2">
          {CONTACT_TYPE_FILTERS.map((filter) => {
            const isActive = activeTypeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => onTypeFilterChange(filter.key)}
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${filter.label}${isActive ? ', selected' : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: isActive ? colors.primaryForeground : colors.foreground }}
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
          {STATUS_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              isActive={advancedFilters.status === option.value}
              onPress={() => onAdvancedFiltersChange({ ...advancedFilters, status: option.value })}
              accessibilityLabel={`Status: ${option.label}${advancedFilters.status === option.value ? ', selected' : ''}`}
            />
          ))}
        </View>
      </BottomSheetSection>

      {/* Source Filter */}
      <BottomSheetSection title="Source">
        <View className="flex-row flex-wrap gap-2">
          {SOURCE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              isActive={advancedFilters.source === option.value}
              onPress={() => onAdvancedFiltersChange({ ...advancedFilters, source: option.value })}
              accessibilityLabel={`Source: ${option.label}${advancedFilters.source === option.value ? ', selected' : ''}`}
            />
          ))}
        </View>
      </BottomSheetSection>

      {/* Sort By */}
      <BottomSheetSection title="Sort By">
        <View className="flex-row flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              isActive={advancedFilters.sortBy === option.value}
              onPress={() => onAdvancedFiltersChange({ ...advancedFilters, sortBy: option.value })}
              accessibilityLabel={`Sort by ${option.label}${advancedFilters.sortBy === option.value ? ', selected' : ''}`}
            />
          ))}
        </View>
      </BottomSheetSection>

      {/* Sort Order */}
      <BottomSheetSection title="Sort Order">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor: advancedFilters.sortOrder === 'desc' ? colors.primary : colors.muted,
            }}
            onPress={() => onAdvancedFiltersChange({ ...advancedFilters, sortOrder: 'desc' })}
            accessibilityRole="button"
            accessibilityLabel={`Newest first${advancedFilters.sortOrder === 'desc' ? ', selected' : ''}`}
            accessibilityState={{ selected: advancedFilters.sortOrder === 'desc' }}
          >
            <Text
              className="font-medium"
              style={{
                color: advancedFilters.sortOrder === 'desc' ? colors.primaryForeground : colors.foreground,
              }}
            >
              Newest First
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor: advancedFilters.sortOrder === 'asc' ? colors.primary : colors.muted,
            }}
            onPress={() => onAdvancedFiltersChange({ ...advancedFilters, sortOrder: 'asc' })}
            accessibilityRole="button"
            accessibilityLabel={`Oldest first${advancedFilters.sortOrder === 'asc' ? ', selected' : ''}`}
            accessibilityState={{ selected: advancedFilters.sortOrder === 'asc' }}
          >
            <Text
              className="font-medium"
              style={{
                color: advancedFilters.sortOrder === 'asc' ? colors.primaryForeground : colors.foreground,
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
