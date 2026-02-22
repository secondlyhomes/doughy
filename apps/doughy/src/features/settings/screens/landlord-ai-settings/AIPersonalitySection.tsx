// src/features/settings/screens/landlord-ai-settings/AIPersonalitySection.tsx
// AI personality settings section

import React from 'react';
import { View, Text, Switch, TextInput } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SettingSection } from './SettingSection';

interface AIPersonalitySectionProps {
  useEmojis: boolean;
  greetingStyle: string;
  signOff: string;
  onEmojiToggle: (value: boolean) => void;
  onGreetingChange: (value: string) => void;
  onSignOffChange: (value: string) => void;
}

export function AIPersonalitySection({
  useEmojis,
  greetingStyle,
  signOff,
  onEmojiToggle,
  onGreetingChange,
  onSignOffChange,
}: AIPersonalitySectionProps) {
  const colors = useThemeColors();

  return (
    <SettingSection title="AI PERSONALITY">
      <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
        {/* Use Emojis */}
        <View
          className="flex-row items-center p-4"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Sparkles size={20} color={colors.mutedForeground} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground }}>Use Emojis</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Add emojis to responses
            </Text>
          </View>
          <Switch
            value={useEmojis}
            onValueChange={onEmojiToggle}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbTintColor={colors.card}
          />
        </View>

        {/* Greeting Style */}
        <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.foreground }}>Greeting Style</Text>
          <TextInput
            className="mt-2 p-3 rounded-lg"
            style={{
              backgroundColor: colors.background,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            value={greetingStyle}
            onChangeText={onGreetingChange}
            placeholder="Hi {first_name}!"
            placeholderTextColor={colors.mutedForeground}
          />
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            Use {'{first_name}'} or {'{name}'} for personalization
          </Text>
        </View>

        {/* Sign Off */}
        <View className="p-4">
          <Text style={{ color: colors.foreground }}>Sign Off</Text>
          <TextInput
            className="mt-2 p-3 rounded-lg"
            style={{
              backgroundColor: colors.background,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            value={signOff}
            onChangeText={onSignOffChange}
            placeholder="Best"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>
    </SettingSection>
  );
}
