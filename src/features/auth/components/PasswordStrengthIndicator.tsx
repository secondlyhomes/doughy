// src/features/auth/components/PasswordStrengthIndicator.tsx
// Password strength indicator component

import React from 'react';
import { View, Text } from 'react-native';
import type { PasswordStrength } from '../services/passwordResetService';
import { useThemeColors } from '@/context/ThemeContext';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  showSuggestions?: boolean;
}

export function PasswordStrengthIndicator({
  strength,
  showSuggestions = true,
}: PasswordStrengthIndicatorProps) {
  const colors = useThemeColors();
  // Resolve semantic color key to actual theme color
  const strengthColor = colors[strength.colorKey];
  return (
    <View className="mt-2">
      {/* Strength bars */}
      <View className="flex-row gap-1 mb-1">
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            className="flex-1 h-1 rounded-full"
            style={{
              backgroundColor: index < strength.score ? strengthColor : colors.muted,
            }}
          />
        ))}
      </View>

      {/* Label */}
      <View className="flex-row items-center justify-between">
        <Text
          className="text-xs font-medium capitalize"
          style={{ color: strengthColor }}
        >
          {strength.label}
        </Text>
      </View>

      {/* Suggestions */}
      {showSuggestions && strength.suggestions.length > 0 && (
        <View className="mt-2">
          {strength.suggestions.map((suggestion, index) => (
            <Text key={index} className="text-xs" style={{ color: colors.mutedForeground }}>
              • {suggestion}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
