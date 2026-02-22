// src/features/real-estate/components/FilterPropertyTypeSection.tsx
// Property type chip toggles for PropertyFiltersSheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetSection } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PropertyType, PropertyConstants } from '../types';
import { COMMON_PROPERTY_TYPES } from './property-filters-types';

interface FilterPropertyTypeSectionProps {
  selectedTypes: PropertyType[];
  onTogglePropertyType: (type: PropertyType) => void;
}

export function FilterPropertyTypeSection({ selectedTypes, onTogglePropertyType }: FilterPropertyTypeSectionProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Property Type">
      <View className="flex-row flex-wrap gap-2">
        {COMMON_PROPERTY_TYPES.map(type => {
          const option = PropertyConstants.TYPE_OPTIONS.find(o => o.value === type);
          if (!option) return null;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => onTogglePropertyType(type)}
              className="px-4 py-2 rounded-full border"
              style={{
                backgroundColor: selectedTypes.includes(type)
                  ? colors.primary
                  : colors.muted,
                borderColor: selectedTypes.includes(type)
                  ? colors.primary
                  : colors.border,
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  color: selectedTypes.includes(type)
                    ? colors.primaryForeground
                    : colors.foreground,
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheetSection>
  );
}
