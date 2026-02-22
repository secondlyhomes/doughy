// src/features/real-estate/components/WizardNavigation.tsx
// Navigation buttons bar for PropertyFormWizard (Cancel/Back + Next/Submit)

import React from 'react';
import { View } from 'react-native';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui';

interface WizardNavigationProps {
  currentStep: number;
  isLastStep: boolean;
  isLoading: boolean;
  submitLabel: string;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function WizardNavigation({
  currentStep,
  isLastStep,
  isLoading,
  submitLabel,
  onCancel,
  onBack,
  onNext,
  onSubmit,
}: WizardNavigationProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row gap-3 px-4 pt-2 pb-4">
      {currentStep === 0 ? (
        <Button
          variant="secondary"
          onPress={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          <X size={20} color={colors.foreground} />
          Cancel
        </Button>
      ) : (
        <Button
          variant="secondary"
          onPress={onBack}
          disabled={isLoading}
          className="flex-1"
        >
          <ArrowLeft size={20} color={colors.foreground} />
          Back
        </Button>
      )}

      {isLastStep ? (
        <Button
          onPress={onSubmit}
          disabled={isLoading}
          loading={isLoading}
          className="flex-1"
        >
          {!isLoading && <Check size={20} color={colors.primaryForeground} />}
          {submitLabel}
        </Button>
      ) : (
        <Button
          onPress={onNext}
          disabled={isLoading}
          className="flex-1"
        >
          Next
          <ArrowRight size={20} color={colors.primaryForeground} />
        </Button>
      )}
    </View>
  );
}
