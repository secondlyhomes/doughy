// src/features/vendors/screens/vendor-detail/DetailRow.tsx
// Reusable detail row component for vendor info display

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';
import type { DetailRowProps } from './types';

export function DetailRow({ icon: Icon, label, value, valueColor, onPress }: DetailRowProps) {
  const colors = useThemeColors();
  if (!value) return null;

  const Content = (
    <View className="flex-row items-center py-3">
      <Icon size={18} color={colors.mutedForeground} />
      <View className="ml-3 flex-1">
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
          {label}
        </Text>
        <Text
          style={{
            color: valueColor || colors.foreground,
            fontSize: FONT_SIZES.base,
            fontWeight: '500',
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}
