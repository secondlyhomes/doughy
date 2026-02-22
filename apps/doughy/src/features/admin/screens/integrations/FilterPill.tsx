// src/features/admin/screens/integrations/FilterPill.tsx
// Filter pill component for integrations screen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

export interface FilterPillProps {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
  color?: string;
  colors: ReturnType<typeof useThemeColors>;
}

export const FilterPill = React.memo(function FilterPill({ label, count, active, onPress, color, colors }: FilterPillProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-3 py-1.5 rounded-full"
      style={{ backgroundColor: active ? colors.primary : colors.muted }}
      onPress={onPress}
    >
      {color && !active && (
        <View
          className="w-2 h-2 rounded-full mr-1.5"
          style={{ backgroundColor: color }}
        />
      )}
      <Text
        className="text-sm"
        style={{ color: active ? colors.primaryForeground : colors.mutedForeground }}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <Text
          className="text-xs ml-1"
          style={{
            color: active
              ? withOpacity(colors.primaryForeground, 'strong')
              : colors.mutedForeground,
          }}
        >
          ({count})
        </Text>
      )}
    </TouchableOpacity>
  );
});
