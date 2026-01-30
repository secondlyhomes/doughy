// src/features/settings/screens/landlord-ai-settings/ReviewTopicsSection.tsx
// Topics that always require review section

import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { REVIEW_TOPICS } from './constants';
import { SettingSection } from './SettingSection';

interface ReviewTopicsSectionProps {
  enabledTopics: string[];
  onToggleTopic: (topicKey: string) => void;
}

export function ReviewTopicsSection({ enabledTopics, onToggleTopic }: ReviewTopicsSectionProps) {
  const colors = useThemeColors();

  return (
    <SettingSection title="TOPICS THAT ALWAYS NEED REVIEW">
      <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
        {REVIEW_TOPICS.map((topic, index) => {
          const isEnabled = enabledTopics.includes(topic.key);
          const isLast = index === REVIEW_TOPICS.length - 1;

          return (
            <View
              key={topic.key}
              className="flex-row items-center p-4"
              style={!isLast ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
            >
              <View className="flex-1">
                <Text style={{ color: colors.foreground }}>{topic.label}</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  {topic.description}
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={() => onToggleTopic(topic.key)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbTintColor={colors.card}
              />
            </View>
          );
        })}
      </View>
    </SettingSection>
  );
}
