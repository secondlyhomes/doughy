// src/features/capture/screens/CaptureAction.tsx
// Individual capture action button (Record, Upload, Photo, etc.)

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import type { CaptureActionProps } from './capture-screen-types';

export function CaptureAction({ icon: Icon, label, color, onPress }: CaptureActionProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={{
        alignItems: 'center',
        gap: SPACING.xs,
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: BORDER_RADIUS.lg,
          backgroundColor: withOpacity(color, 'light'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={ICON_SIZES.lg} color={color} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '500', color: colors.foreground }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
