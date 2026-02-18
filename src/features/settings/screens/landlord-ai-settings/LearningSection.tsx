// src/features/settings/screens/landlord-ai-settings/LearningSection.tsx
// Adaptive learning settings section

import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Brain } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SettingSection } from './SettingSection';

interface LearningSectionProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function LearningSection({ enabled, onToggle }: LearningSectionProps) {
  const colors = useThemeColors();

  return (
    <SettingSection title="ADAPTIVE LEARNING">
      <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
        <View className="flex-row items-center p-4">
          <Brain size={20} color={colors.mutedForeground} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground }}>Enable Learning</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              AI learns from your review patterns to improve over time
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbTintColor={colors.card}
          />
        </View>
      </View>

      <Text className="text-sm mt-3 px-2" style={{ color: colors.mutedForeground }}>
        When enabled, the AI analyzes which responses you approve unchanged vs edit,
        and adjusts its confidence accordingly. After ~50 reviews, auto-send behavior
        becomes personalized to your preferences.
      </Text>
    </SettingSection>
  );
}
