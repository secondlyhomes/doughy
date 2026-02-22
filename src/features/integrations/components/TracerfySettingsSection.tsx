// src/features/integrations/components/TracerfySettingsSection.tsx
// Settings toggles and credits display for connected Tracerfy integration

import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';
import { TracerfyConfig } from '../types';

interface TracerfySettingsSectionProps {
  tracerfy: TracerfyConfig;
  onToggleAutoSkipTrace: (enabled: boolean) => void;
  onToggleAutoMatch: (enabled: boolean) => void;
}

export function TracerfySettingsSection({
  tracerfy,
  onToggleAutoSkipTrace,
  onToggleAutoMatch,
}: TracerfySettingsSectionProps) {
  const colors = useThemeColors();

  return (
    <View className="mb-3">
      <View
        className="flex-row items-center justify-between p-3 rounded-lg mb-2"
        style={{ backgroundColor: colors.muted }}
      >
        <View className="flex-1 mr-3">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.sm,
              fontWeight: '500',
            }}
          >
            Auto Skip Trace
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.xs,
            }}
          >
            Automatically search for contact info on new leads
          </Text>
        </View>
        <Switch
          value={tracerfy.autoSkipTrace}
          onValueChange={onToggleAutoSkipTrace}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.card}
        />
      </View>

      <View
        className="flex-row items-center justify-between p-3 rounded-lg"
        style={{ backgroundColor: colors.muted }}
      >
        <View className="flex-1 mr-3">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.sm,
              fontWeight: '500',
            }}
          >
            Auto Match to Property
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.xs,
            }}
          >
            Automatically link leads to property addresses
          </Text>
        </View>
        <Switch
          value={tracerfy.autoMatchToProperty}
          onValueChange={onToggleAutoMatch}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.card}
        />
      </View>

      {tracerfy.creditsRemaining !== undefined && (
        <View className="mt-2 p-3 rounded-lg" style={{ backgroundColor: colors.muted }}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.xs,
            }}
          >
            Credits Remaining
          </Text>
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.lg,
              fontWeight: '600',
            }}
          >
            {tracerfy.creditsRemaining}
          </Text>
        </View>
      )}
    </View>
  );
}
