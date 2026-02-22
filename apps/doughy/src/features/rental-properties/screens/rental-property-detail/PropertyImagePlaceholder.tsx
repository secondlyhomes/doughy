// src/features/rental-properties/screens/rental-property-detail/PropertyImagePlaceholder.tsx
// Placeholder component when property has no images

import React from 'react';
import { View, Text } from 'react-native';
import { ImageIcon } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';

export function PropertyImagePlaceholder() {
  const colors = useThemeColors();

  return (
    <View
      className="w-full h-48 rounded-xl items-center justify-center mb-4"
      style={{ backgroundColor: colors.muted }}
    >
      <ImageIcon size={48} color={colors.mutedForeground} />
      <Text
        style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginTop: 8 }}
      >
        No Photos Added
      </Text>
    </View>
  );
}
