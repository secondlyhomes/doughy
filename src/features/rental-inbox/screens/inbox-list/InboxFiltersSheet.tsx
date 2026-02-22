// src/features/rental-inbox/screens/inbox-list/InboxFiltersSheet.tsx
// Filters and sort bottom sheet for InboxListScreen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';

import {
  BottomSheet,
  BottomSheetSection,
  Button,
} from '@/components/ui';
import { withOpacity } from '@/lib/design-utils';

import { FILTER_OPTIONS, SORT_OPTIONS } from './constants';
import type { InboxFilter, InboxSort } from '../../types';

interface InboxFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilter: InboxFilter;
  setActiveFilter: (filter: InboxFilter) => void;
  activeSort: InboxSort;
  setActiveSort: (sort: InboxSort) => void;
  onClearFilters: () => void;
  colors: Record<string, string>;
}

export function InboxFiltersSheet({
  visible,
  onClose,
  activeFilter,
  setActiveFilter,
  activeSort,
  setActiveSort,
  onClearFilters,
  colors,
}: InboxFiltersSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filter Conversations"
    >
      {/* Filter Options */}
      <BottomSheetSection title="Show">
        <View className="flex-row flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.key;
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => setActiveFilter(option.key)}
                className="px-4 py-2 rounded-full border flex-row items-center"
                style={{
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderColor: isActive ? colors.primary : colors.border,
                  gap: 6,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${option.label}${isActive ? ', selected' : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <IconComponent
                  size={14}
                  color={isActive ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: isActive ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Sort Options */}
      <BottomSheetSection title="Sort By">
        <View className="flex-row flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => {
            const isActive = activeSort === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => setActiveSort(option.key)}
                className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                style={{
                  backgroundColor: isActive
                    ? withOpacity(colors.primary, 'muted')
                    : colors.muted,
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? colors.primary : 'transparent',
                }}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${option.label}${isActive ? ', selected' : ''}`}
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

      {/* Action buttons */}
      <View className="flex-row gap-3 pt-4 pb-6">
        <Button variant="outline" onPress={onClearFilters} className="flex-1">
          Clear Filters
        </Button>
        <Button onPress={onClose} className="flex-1">
          Done
        </Button>
      </View>
    </BottomSheet>
  );
}
