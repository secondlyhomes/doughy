// src/features/real-estate/components/FilterSortBySection.tsx
// Sort options list for PropertyFiltersSheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetSection } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { Check } from 'lucide-react-native';
import { SortOption, SORT_OPTIONS } from '../hooks/usePropertyFilters';

interface FilterSortBySectionProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}

export function FilterSortBySection({ sortBy, onSortChange }: FilterSortBySectionProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Sort By">
      <View className="gap-2">
        {SORT_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSortChange(option.value)}
            className="flex-row items-center justify-between py-3 px-4 rounded-lg"
            style={{
              backgroundColor: sortBy === option.value ? withOpacity(colors.primary, 'muted') : colors.muted
            }}
          >
            <Text
              className="text-base"
              style={{
                color: sortBy === option.value ? colors.primary : colors.foreground,
                fontWeight: sortBy === option.value ? '600' : '400'
              }}
            >
              {option.label}
            </Text>
            {sortBy === option.value && (
              <Check size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheetSection>
  );
}
