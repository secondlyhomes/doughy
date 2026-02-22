// src/features/real-estate/components/FilterStatusSection.tsx
// Status chip toggles for PropertyFiltersSheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetSection } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PropertyStatus, PropertyConstants } from '../types';

interface FilterStatusSectionProps {
  selectedStatuses: PropertyStatus[];
  onToggleStatus: (status: PropertyStatus) => void;
}

export function FilterStatusSection({ selectedStatuses, onToggleStatus }: FilterStatusSectionProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Status">
      <View className="flex-row flex-wrap gap-2">
        {PropertyConstants.STATUS_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onToggleStatus(option.value as PropertyStatus)}
            className="px-4 py-2 rounded-full border"
            style={{
              backgroundColor: selectedStatuses.includes(option.value as PropertyStatus)
                ? colors.primary
                : colors.muted,
              borderColor: selectedStatuses.includes(option.value as PropertyStatus)
                ? colors.primary
                : colors.border,
            }}
          >
            <Text
              className="text-sm font-medium"
              style={{
                color: selectedStatuses.includes(option.value as PropertyStatus)
                  ? colors.primaryForeground
                  : colors.foreground,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheetSection>
  );
}
