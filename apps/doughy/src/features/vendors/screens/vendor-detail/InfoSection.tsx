// src/features/vendors/screens/vendor-detail/InfoSection.tsx
// Reusable section card for vendor info display

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';

export interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

export function InfoSection({ title, children }: InfoSectionProps) {
  const colors = useThemeColors();

  return (
    <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card }}>
      <Text
        style={{
          color: colors.foreground,
          fontSize: FONT_SIZES.lg,
          fontWeight: '600',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
