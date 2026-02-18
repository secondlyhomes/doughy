// src/features/contacts/screens/contacts-list/FilterChip.tsx
// Reusable filter chip component

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { FilterChipProps } from './types';

export function FilterChip({ label, isActive, onPress, accessibilityLabel }: FilterChipProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-3 py-2 rounded-lg flex-row items-center gap-1"
      style={{
        backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted,
        borderWidth: isActive ? 1 : 0,
        borderColor: isActive ? colors.primary : 'transparent',
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isActive }}
    >
      <Text className="text-sm" style={{ color: isActive ? colors.primary : colors.foreground }}>
        {label}
      </Text>
      {isActive && <Check size={14} color={colors.primary} />}
    </TouchableOpacity>
  );
}
