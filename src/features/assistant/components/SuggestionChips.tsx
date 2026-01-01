// Suggestion Chips Component - React Native
// Quick action suggestions for AI Assistant

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

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
            className="bg-muted px-3 py-1.5 rounded-full"
            onPress={() => onPress(suggestion)}
            activeOpacity={0.7}
          >
            <Text className="text-sm text-muted-foreground">{suggestion}</Text>
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
          className="bg-card border border-border rounded-xl px-4 py-3"
          onPress={() => onPress(suggestion)}
          activeOpacity={0.7}
        >
          <Text className="text-sm text-foreground text-center">
            {suggestion}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default SuggestionChips;
