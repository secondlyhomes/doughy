// src/features/dev/screens/simulate-inquiry/QuickTestSection.tsx
// Quick test card with one-tap platform buttons

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

import { PLATFORM_CONFIGS } from './constants';
import type { Platform } from './types';

interface QuickTestSectionProps {
  isCreating: boolean;
  onQuickTest: (platform: Platform) => void;
}

export function QuickTestSection({ isCreating, onQuickTest }: QuickTestSectionProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        ...getShadowStyle(colors, { size: 'sm' }),
      }}
    >
      <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.lg, marginBottom: SPACING.sm }}>
        Quick Test
      </Text>
      <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.md }}>
        One tap to create a test inquiry with sample data
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {PLATFORM_CONFIGS.slice(0, 4).map((config) => (
          <TouchableOpacity
            key={config.id}
            onPress={() => onQuickTest(config.id)}
            disabled={isCreating}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.sm,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: colors.muted,
              gap: SPACING.xs,
            }}
          >
            <Text style={{ fontSize: 16 }}>{config.icon}</Text>
            <Text style={{ color: colors.foreground, fontWeight: '500' }}>{config.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
