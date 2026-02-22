// src/components/ui/FilterSheetControls.tsx
// Reusable filter control components: FilterOptionButton, FilterChip, FilterToggleRow

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { FilterOptionButtonProps, FilterChipProps, FilterToggleRowProps } from './filter-sheet-types';

/**
 * FilterOptionButton - Selectable option for filter lists
 */
export function FilterOptionButton({ label, selected, onPress }: FilterOptionButtonProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      className="flex-row items-center justify-between px-4 py-3 rounded-lg mb-2"
      style={{
        backgroundColor: selected ? withOpacity(colors.primary, 'muted') : colors.muted,
        borderWidth: selected ? 1 : 0,
        borderColor: selected ? colors.primary : 'transparent',
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
      accessibilityState={{ selected }}
    >
      <Text
        className="text-base"
        style={{
          color: selected ? colors.primary : colors.foreground,
          fontWeight: selected ? '500' : 'normal',
        }}
      >
        {label}
      </Text>
      {selected && <Check size={18} color={colors.primary} />}
    </TouchableOpacity>
  );
}

/**
 * FilterChip - Compact pill-style filter option
 */
export function FilterChip({
  label,
  isActive,
  onPress,
  accessibilityLabel,
}: FilterChipProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-4 py-2 rounded-full border"
      style={{
        backgroundColor: isActive ? colors.primary : colors.muted,
        borderColor: isActive ? colors.primary : colors.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${label}${isActive ? ', selected' : ''}`}
      accessibilityState={{ selected: isActive }}
    >
      <Text
        className="text-sm font-medium"
        style={{ color: isActive ? colors.primaryForeground : colors.foreground }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * FilterToggleRow - Binary toggle for sort order or similar options
 */
export function FilterToggleRow({
  options,
  selectedValue,
  onSelect,
}: FilterToggleRowProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row gap-3">
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor: isSelected ? colors.primary : colors.muted,
            }}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityLabel={`${option.label}${isSelected ? ', selected' : ''}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              className="font-medium"
              style={{
                color: isSelected ? colors.primaryForeground : colors.foreground,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
