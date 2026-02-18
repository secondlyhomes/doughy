// src/features/dev/screens/simulate-inquiry/PresetButton.tsx
// Preset inquiry button component

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import type { PlatformConfig } from './types';

interface PresetButtonProps {
  config: PlatformConfig;
  onPress: () => void;
  isSelected: boolean;
}

export function PresetButton({ config, onPress, isSelected }: PresetButtonProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: isSelected ? withOpacity(colors.primary, 'light') : colors.card,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? colors.primary : colors.border,
        marginBottom: SPACING.sm,
        ...getShadowStyle(colors, { size: 'sm' }),
      }}
      accessibilityRole="button"
      accessibilityLabel={`Create ${config.name} test inquiry`}
    >
      <Text style={{ fontSize: 24, marginRight: SPACING.sm }}>{config.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {config.name}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
          {config.sampleProfession} inquiry
        </Text>
      </View>
      {config.replyMethod === 'platform_only' && (
        <View
          style={{
            backgroundColor: withOpacity(colors.warning, 'light'),
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: BORDER_RADIUS.full,
          }}
        >
          <Text style={{ color: colors.warning, fontSize: FONT_SIZES['2xs'], fontWeight: '600' }}>
            In-app only
          </Text>
        </View>
      )}
      <ArrowRight size={18} color={colors.mutedForeground} style={{ marginLeft: SPACING.sm }} />
    </TouchableOpacity>
  );
}
