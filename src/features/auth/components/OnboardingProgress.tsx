// src/features/auth/components/OnboardingProgress.tsx
// Progress indicator for onboarding survey with step labels

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  /** Optional step labels to display above progress indicators */
  stepLabels?: string[];
  /** Show "Step X of Y" text below progress indicators */
  showStepCounter?: boolean;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabels,
  showStepCounter = false,
}: OnboardingProgressProps) {
  const colors = useThemeColors();
  const currentLabel = stepLabels?.[currentStep];

  return (
    <View className="items-center py-4">
      {/* Current step label */}
      {currentLabel && (
        <Text
          style={{
            color: colors.primary,
            fontSize: FONT_SIZES.xs,
            fontWeight: '600',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {currentLabel}
        </Text>
      )}

      {/* Progress dots */}
      <View className="flex-row items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full ${
              index < currentStep
                ? 'bg-primary w-8'
                : index === currentStep
                ? 'bg-primary w-8'
                : 'bg-muted w-2'
            }`}
          />
        ))}
      </View>

      {/* Step counter */}
      {showStepCounter && (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: FONT_SIZES.xs,
            marginTop: 8,
          }}
        >
          Step {currentStep + 1} of {totalSteps}
        </Text>
      )}
    </View>
  );
}
