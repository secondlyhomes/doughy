// src/features/real-estate/components/PropertySortSheet.tsx
// Bottom sheet for sorting properties

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SortOption, SORT_OPTIONS } from '../hooks/usePropertyFilters';

interface PropertySortSheetProps {
  visible: boolean;
  onClose: () => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}

export function PropertySortSheet({
  visible,
  onClose,
  sortBy,
  onSortChange,
}: PropertySortSheetProps) {
  const colors = useThemeColors();
  const handleSortChange = useCallback((option: SortOption) => {
    onSortChange(option);
    onClose();
  }, [onSortChange, onClose]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Sort By"
      maxHeight="auto"
    >
      <View className="py-2">
        {SORT_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            onPress={() => handleSortChange(option.value)}
            className={`flex-row items-center justify-between py-4 px-2 rounded-lg ${
              sortBy === option.value ? 'bg-primary/10' : ''
            }`}
          >
            <Text
              className={`text-base ${
                sortBy === option.value
                  ? 'text-primary font-semibold'
                  : 'text-foreground'
              }`}
            >
              {option.label}
            </Text>
            {sortBy === option.value && (
              <Check size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}
