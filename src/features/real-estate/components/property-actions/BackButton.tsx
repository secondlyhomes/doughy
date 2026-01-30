// src/features/real-estate/components/property-actions/BackButton.tsx
// Back button for navigating between action views

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

export interface BackButtonProps {
  onPress: () => void;
}

export function BackButton({ onPress }: BackButtonProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center py-2 mb-2">
      <ChevronRight
        size={20}
        color={colors.mutedForeground}
        style={{ transform: [{ rotate: '180deg' }] }}
      />
      <Text className="ml-1" style={{ color: colors.mutedForeground }}>
        Back
      </Text>
    </TouchableOpacity>
  );
}
