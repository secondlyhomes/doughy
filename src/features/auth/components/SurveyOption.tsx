// src/features/auth/components/SurveyOption.tsx
// Single option button for survey questions

import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

interface SurveyOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function SurveyOption({
  label,
  selected,
  onPress,
  disabled = false,
}: SurveyOptionProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center p-4 rounded-lg border mb-3 ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background'
      } ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
          selected ? 'border-primary bg-primary' : 'border-muted-foreground'
        }`}
      >
        {selected && <Check size={14} color="#ffffff" />}
      </View>
      <Text
        className={`flex-1 text-base ${
          selected ? 'text-foreground font-medium' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
