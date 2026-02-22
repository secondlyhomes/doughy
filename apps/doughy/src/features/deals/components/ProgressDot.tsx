// src/features/deals/components/ProgressDot.tsx
// Small progress dot indicator for the StageStepper pill

import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { DOT_SIZE, DOT_GAP } from './stage-stepper-constants';

// ============================================
// Types
// ============================================

export interface ProgressDotProps {
  status: 'completed' | 'current' | 'future';
}

// ============================================
// Component
// ============================================

export function ProgressDot({ status }: ProgressDotProps) {
  const colors = useThemeColors();

  const dotColor =
    status === 'completed'
      ? colors.success
      : status === 'current'
        ? colors.primary
        : colors.muted;

  return (
    <View
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: dotColor,
        marginHorizontal: DOT_GAP / 2,
      }}
    />
  );
}
