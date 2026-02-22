// src/features/guest-communication/components/SelectedTemplateBanner.tsx
// Indicates which template is active, with a "Change" action to go back

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import {
  GuestMessageTemplate,
  TEMPLATE_TYPE_CONFIG,
} from '../types';

export interface SelectedTemplateBannerProps {
  template: GuestMessageTemplate;
  onReset: () => void;
}

export function SelectedTemplateBanner({
  template,
  onReset,
}: SelectedTemplateBannerProps) {
  const colors = useThemeColors();

  return (
    <View className="px-4 mb-4">
      <TouchableOpacity
        onPress={onReset}
        className="flex-row items-center justify-between p-3 rounded-lg"
        style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
        activeOpacity={PRESS_OPACITY.DEFAULT}
      >
        <View className="flex-row items-center gap-2">
          <Text style={{ fontSize: 16 }}>
            {TEMPLATE_TYPE_CONFIG[template.type].emoji}
          </Text>
          <Text
            style={{
              color: colors.primary,
              fontSize: FONT_SIZES.sm,
              fontWeight: '500',
            }}
          >
            {template.name}
          </Text>
        </View>
        <Text
          style={{
            color: colors.primary,
            fontSize: FONT_SIZES.xs,
          }}
        >
          Change
        </Text>
      </TouchableOpacity>
    </View>
  );
}
