// src/features/leads/screens/leads-list/LeadFiltersSheet.tsx
// Filters bottom sheet for leads list screen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import type { LeadFilters } from './types';
import { QUICK_FILTERS, STATUS_OPTIONS, SOURCE_OPTIONS, SORT_OPTIONS } from './constants';

export interface LeadFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilter: string;
  onActiveFilterChange: (filter: string) => void;
  advancedFilters: LeadFilters;
  onAdvancedFiltersChange: React.Dispatch<React.SetStateAction<LeadFilters>>;
  onClearAll: () => void;
}

export function LeadFiltersSheet({
  visible,
  onClose,
  activeFilter,
  onActiveFilterChange,
  advancedFilters,
  onAdvancedFiltersChange,
  onClearAll,
}: LeadFiltersSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Lead Filters">
      <BottomSheetSection title="Quick Filter">
        <View className="flex-row flex-wrap gap-2">
          {QUICK_FILTERS.map(filter => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => onActiveFilterChange(filter.key)}
                className="px-4 py-2 rounded-full border"
                style={{ backgroundColor: isActive ? colors.primary : colors.muted, borderColor: isActive ? colors.primary : colors.border }}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${filter.label}${isActive ? ', selected' : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text className="text-sm font-medium" style={{ color: isActive ? colors.primaryForeground : colors.foreground }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      <BottomSheetSection title="Status">
        <View className="flex-row flex-wrap gap-2">
          {STATUS_OPTIONS.map(option => {
            const isActive = advancedFilters.status === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => onAdvancedFiltersChange(prev => ({ ...prev, status: option.value }))}
                className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                style={{ backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted, borderWidth: isActive ? 1 : 0, borderColor: isActive ? colors.primary : 'transparent' }}
                accessibilityRole="button"
                accessibilityLabel={`Status: ${option.label}${isActive ? ', selected' : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text className="text-sm" style={{ color: isActive ? colors.primary : colors.foreground }}>{option.label}</Text>
                {isActive && <Check size={14} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      <BottomSheetSection title="Source">
        <View className="flex-row flex-wrap gap-2">
          {SOURCE_OPTIONS.map(option => {
            const isActive = advancedFilters.source === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => onAdvancedFiltersChange(prev => ({ ...prev, source: option.value }))}
                className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                style={{ backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted, borderWidth: isActive ? 1 : 0, borderColor: isActive ? colors.primary : 'transparent' }}
                accessibilityRole="button"
                accessibilityLabel={`Source: ${option.label}${isActive ? ', selected' : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text className="text-sm" style={{ color: isActive ? colors.primary : colors.foreground }}>{option.label}</Text>
                {isActive && <Check size={14} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      <BottomSheetSection title="Sort By">
        <View className="flex-row flex-wrap gap-2">
          {SORT_OPTIONS.map(option => {
            const isActive = advancedFilters.sortBy === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => onAdvancedFiltersChange(prev => ({ ...prev, sortBy: option.value }))}
                className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                style={{ backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted, borderWidth: isActive ? 1 : 0, borderColor: isActive ? colors.primary : 'transparent' }}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${option.label}${isActive ? ', selected' : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text className="text-sm" style={{ color: isActive ? colors.primary : colors.foreground }}>{option.label}</Text>
                {isActive && <Check size={14} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      <BottomSheetSection title="Sort Order">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center"
            style={{ backgroundColor: advancedFilters.sortOrder === 'desc' ? colors.primary : colors.muted }}
            onPress={() => onAdvancedFiltersChange(prev => ({ ...prev, sortOrder: 'desc' }))}
            accessibilityRole="button"
            accessibilityLabel={`Newest first${advancedFilters.sortOrder === 'desc' ? ', selected' : ''}`}
            accessibilityState={{ selected: advancedFilters.sortOrder === 'desc' }}
          >
            <Text className="font-medium" style={{ color: advancedFilters.sortOrder === 'desc' ? colors.primaryForeground : colors.foreground }}>
              Newest First
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center"
            style={{ backgroundColor: advancedFilters.sortOrder === 'asc' ? colors.primary : colors.muted }}
            onPress={() => onAdvancedFiltersChange(prev => ({ ...prev, sortOrder: 'asc' }))}
            accessibilityRole="button"
            accessibilityLabel={`Oldest first${advancedFilters.sortOrder === 'asc' ? ', selected' : ''}`}
            accessibilityState={{ selected: advancedFilters.sortOrder === 'asc' }}
          >
            <Text className="font-medium" style={{ color: advancedFilters.sortOrder === 'asc' ? colors.primaryForeground : colors.foreground }}>
              Oldest First
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetSection>

      <View className="flex-row gap-3 pt-4 pb-6">
        <Button variant="outline" onPress={onClearAll} className="flex-1">Clear Filters</Button>
        <Button onPress={onClose} className="flex-1">Done</Button>
      </View>
    </BottomSheet>
  );
}
