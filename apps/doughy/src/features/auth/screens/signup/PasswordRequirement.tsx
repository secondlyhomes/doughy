// src/features/auth/screens/signup/PasswordRequirement.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

export function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center mt-1">
      {met ? (
        <Check size={14} color={colors.success} />
      ) : (
        <View className="w-3.5 h-3.5 rounded-full" style={{ borderWidth: 1, borderColor: colors.mutedForeground }} />
      )}
      <Text
        className="ml-2 text-sm"
        style={{ color: met ? colors.success : colors.mutedForeground }}
      >
        {text}
      </Text>
    </View>
  );
}
