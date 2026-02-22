// src/components/ui/FocusedSheetProgressBar.tsx
// Progress bar sub-component for multi-step FocusedSheet flows

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { styles } from '@/components/ui/focused-sheet-styles';

interface FocusedSheetProgressBarProps {
  progress: number;
  stepText?: string;
}

export function FocusedSheetProgressBar({ progress, stepText }: FocusedSheetProgressBarProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.progressContainer}>
      {stepText && (
        <Text style={[styles.stepText, { color: colors.mutedForeground }]}>
          {stepText}
        </Text>
      )}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}
