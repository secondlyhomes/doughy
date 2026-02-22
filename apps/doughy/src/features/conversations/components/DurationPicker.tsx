// src/features/conversations/components/DurationPicker.tsx
// Duration preset picker for call logging

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Clock } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

interface DurationPickerProps {
  value: number;
  onChange: (seconds: number) => void;
}

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const colors = useThemeColors();

  const presets = [
    { label: '1 min', seconds: 60 },
    { label: '5 min', seconds: 300 },
    { label: '10 min', seconds: 600 },
    { label: '15 min', seconds: 900 },
    { label: '30 min', seconds: 1800 },
  ];

  const handlePresetPress = useCallback((seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(seconds);
  }, [onChange]);

  // Format custom display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins} min`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ gap: SPACING.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
        <Clock size={ICON_SIZES.sm} color={colors.mutedForeground} />
        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.mutedForeground }}>
          Duration
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginLeft: 'auto' }}>
          {formatDuration(value)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.seconds}
            onPress={() => handlePresetPress(preset.seconds)}
            style={{
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xs,
              borderRadius: BORDER_RADIUS.full,
              backgroundColor: value === preset.seconds ? colors.primary : colors.muted,
              borderWidth: 1,
              borderColor: value === preset.seconds ? colors.primary : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: value === preset.seconds ? colors.primaryForeground : colors.foreground,
              }}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
