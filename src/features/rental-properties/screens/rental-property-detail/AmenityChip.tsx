// src/features/rental-properties/screens/rental-property-detail/AmenityChip.tsx
// Amenity chip component for property detail

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';

export interface AmenityChipProps {
  amenity: string;
}

export function AmenityChip({ amenity }: AmenityChipProps) {
  const colors = useThemeColors();

  return (
    <View
      className="px-3 py-1 rounded-full mr-2 mb-2"
      style={{ backgroundColor: colors.muted }}
    >
      <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>{amenity}</Text>
    </View>
  );
}
