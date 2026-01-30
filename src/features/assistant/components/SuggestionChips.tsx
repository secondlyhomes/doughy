// Suggestion Chips Component - React Native
// Quick action suggestions for AI Assistant

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface SuggestionChipsProps {
  suggestions: string[];
  onPress: (suggestion: string) => void;
  compact?: boolean;
}

export function SuggestionChips({
  suggestions,
  onPress,
  compact = false
}: SuggestionChipsProps) {
  const colors = useThemeColors();

  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: colors.muted }}
            onPress={() => onPress(suggestion)}
            activeOpacity={0.7}
          >
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <View className="gap-2 w-full px-4">
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          className="rounded-xl px-4 py-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
          onPress={() => onPress(suggestion)}
          activeOpacity={0.7}
        >
          <Text className="text-sm text-center" style={{ color: colors.foreground }}>
            {suggestion}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default SuggestionChips;
