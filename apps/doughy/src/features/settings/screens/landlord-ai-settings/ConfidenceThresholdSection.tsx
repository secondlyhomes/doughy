// src/features/settings/screens/landlord-ai-settings/ConfidenceThresholdSection.tsx
// Confidence threshold slider section

import React from 'react';
import { View, Text, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SettingSection } from './SettingSection';

interface ConfidenceThresholdSectionProps {
  threshold: number;
  onThresholdChange: (value: number) => void;
  onThresholdComplete: (value: number) => void;
  fastResponseEnabled: boolean;
  leadThreshold: number;
  onFastResponseToggle: (value: boolean) => void;
}

export function ConfidenceThresholdSection({
  threshold,
  onThresholdChange,
  onThresholdComplete,
  fastResponseEnabled,
  leadThreshold,
  onFastResponseToggle,
}: ConfidenceThresholdSectionProps) {
  const colors = useThemeColors();

  const getThresholdColor = () => {
    if (threshold >= 85) return colors.success;
    if (threshold >= 70) return colors.warning;
    return colors.destructive;
  };

  const getThresholdLabel = () => {
    if (threshold >= 85) return 'High';
    if (threshold >= 70) return 'Medium';
    return 'Low';
  };

  return (
    <SettingSection title="AUTO-SEND CONFIDENCE THRESHOLD">
      <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
        <View className="flex-row items-center justify-between mb-2">
          <Text style={{ color: colors.foreground }}>
            Confidence Level: {threshold}%
          </Text>
          <View
            className="px-2 py-1 rounded"
            style={{ backgroundColor: withOpacity(getThresholdColor(), 'light') }}
          >
            <Text className="text-xs font-medium" style={{ color: getThresholdColor() }}>
              {getThresholdLabel()}
            </Text>
          </View>
        </View>

        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={50}
          maximumValue={100}
          step={5}
          value={threshold}
          onValueChange={onThresholdChange}
          onSlidingComplete={onThresholdComplete}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.muted}
          thumbTintColor={colors.primary}
        />

        <Text className="text-sm mt-2" style={{ color: colors.mutedForeground }}>
          Responses with confidence above {threshold}% will be sent automatically.
          Lower values mean more automation; higher values mean more review.
        </Text>

        <View
          className="flex-row items-center justify-between mt-4 pt-4"
          style={{ borderTopWidth: 1, borderTopColor: colors.border }}
        >
          <View className="flex-1">
            <Text style={{ color: colors.foreground }}>Fast Lead Response</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Use lower threshold ({leadThreshold}%) for new leads
            </Text>
          </View>
          <Switch
            value={fastResponseEnabled}
            onValueChange={onFastResponseToggle}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbTintColor={colors.card}
          />
        </View>
      </View>
    </SettingSection>
  );
}
