// src/features/rental-bookings/screens/BookingsFilterSheet.tsx
// Filter bottom sheet for the bookings list screen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  BottomSheet,
  BottomSheetSection,
  Button,
} from '@/components/ui';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import {
  BookingFilters,
  QUICK_FILTERS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from './bookings-list-constants';

interface BookingsFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: BookingFilters;
  onUpdateFilters: React.Dispatch<React.SetStateAction<BookingFilters>>;
  onClearFilters: () => void;
}

export function BookingsFilterSheet({
  visible,
  onClose,
  filters,
  onUpdateFilters,
  onClearFilters,
}: BookingsFilterSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Booking Filters"
    >
      {/* Quick Filter Pills */}
      <BottomSheetSection title="Quick Filter">
        <View className="flex-row flex-wrap gap-2">
          {QUICK_FILTERS.map((filter) => {
            const isActive = filters.quickFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                onPress={() => onUpdateFilters((prev) => ({ ...prev, quickFilter: filter.key }))}
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
          {STATUS_OPTIONS.map((option) => {
            const isActive = filters.status === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => onUpdateFilters((prev) => ({ ...prev, status: option.value }))}
                className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                style={{
                  backgroundColor: isActive
                    ? withOpacity(colors.primary, 'muted')
                    : colors.muted,
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? colors.primary : 'transparent',
                }}
                accessibilityRole="button"
                accessibilityLabel={`Status: ${option.label}${isActive ? ', selected' : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  className="text-sm"
                  style={{ color: isActive ? colors.primary : colors.foreground }}
                >
                  {option.label}
                </Text>
                {isActive && <Check size={14} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Booking Type Filter */}
      <BottomSheetSection title="Booking Type">
        <View className="flex-row flex-wrap gap-2">
          {TYPE_OPTIONS.map((option) => {
            const isActive = filters.type === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => onUpdateFilters((prev) => ({ ...prev, type: option.value }))}
                className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                style={{
                  backgroundColor: isActive
                    ? withOpacity(colors.primary, 'muted')
                    : colors.muted,
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? colors.primary : 'transparent',
                }}
                accessibilityRole="button"
                accessibilityLabel={`Type: ${option.label}${isActive ? ', selected' : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  className="text-sm"
                  style={{ color: isActive ? colors.primary : colors.foreground }}
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
