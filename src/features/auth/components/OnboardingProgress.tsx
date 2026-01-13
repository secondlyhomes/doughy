// src/features/auth/components/OnboardingProgress.tsx
// Progress indicator for onboarding survey

import React from 'react';
import { View } from 'react-native';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <View className="flex-row items-center justify-center gap-2 py-4">
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
  );
}
