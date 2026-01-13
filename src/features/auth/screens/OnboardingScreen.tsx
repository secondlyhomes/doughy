// src/features/auth/screens/OnboardingScreen.tsx
// Multi-step onboarding survey screen

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { Button } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { SurveyOption } from '../components/SurveyOption';
import {
  SURVEY_QUESTIONS,
  saveOnboardingResponses,
  skipOnboarding,
  type OnboardingResponse,
  type SurveyStep,
} from '../services/onboardingService';

const STEPS: SurveyStep[] = ['referralSource', 'primaryUseCase', 'experienceLevel', 'companySize'];

export function OnboardingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { refetchProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<OnboardingResponse>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = SURVEY_QUESTIONS[STEPS[currentStep]];
  const currentValue = responses[STEPS[currentStep]];
  const isLastStep = currentStep === STEPS.length - 1;
  const isOptional = 'optional' in currentQuestion && currentQuestion.optional;

  const handleSelectOption = useCallback((value: string) => {
    setResponses(prev => ({
      ...prev,
      [STEPS[currentStep]]: value,
    }));
    setError(null);
  }, [currentStep]);

  const handleNext = useCallback(async () => {
    // Validate current step (skip validation for optional steps)
    if (!currentValue && !isOptional) {
      setError('Please select an option to continue');
      return;
    }

    if (isLastStep) {
      // Submit all responses
      setIsSubmitting(true);
      setError(null);

      const result = await saveOnboardingResponses(responses);

      if (result.success) {
        await refetchProfile();
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Failed to save responses');
        setIsSubmitting(false);
      }
    } else {
      // Move to next step
      setCurrentStep(prev => prev + 1);
      setError(null);
    }
  }, [currentStep, currentValue, isLastStep, isOptional, responses, refetchProfile, router]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setError(null);
    }
  }, [currentStep]);

  const handleSkip = useCallback(async () => {
    setIsSubmitting(true);
    const result = await skipOnboarding();

    if (result.success) {
      await refetchProfile();
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Failed to skip onboarding');
      setIsSubmitting(false);
    }
  }, [refetchProfile, router]);

  return (
    <ThemedSafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-4">
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              onPress={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className={currentStep === 0 ? 'opacity-0' : ''}
            >
              <ArrowLeft size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSkip}
              disabled={isSubmitting}
            >
              <Text className="text-muted-foreground">Skip</Text>
            </TouchableOpacity>
          </View>
          <OnboardingProgress currentStep={currentStep} totalSteps={STEPS.length} />
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome message on first step */}
          {currentStep === 0 && (
            <View className="items-center mb-6 mt-4">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                <Sparkles size={32} color={colors.info} />
              </View>
              <Text className="text-xl font-semibold text-foreground text-center">
                Let's personalize your experience
              </Text>
              <Text className="text-muted-foreground text-center mt-2">
                Answer a few quick questions to help us serve you better
              </Text>
            </View>
          )}

          {/* Question */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-1">
              {currentQuestion.question}
            </Text>
            {isOptional && (
              <Text className="text-sm text-muted-foreground">Optional</Text>
            )}
          </View>

          {/* Options */}
          <View>
            {currentQuestion.options.map((option) => (
              <SurveyOption
                key={option.value}
                label={option.label}
                selected={currentValue === option.value}
                onPress={() => handleSelectOption(option.value)}
                disabled={isSubmitting}
              />
            ))}
          </View>

          {/* Error message */}
          {error && (
            <View className="bg-destructive/10 rounded-lg p-3 mt-4">
              <Text className="text-destructive text-sm text-center">{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View className="px-4 pb-6">
          <Button
            onPress={handleNext}
            disabled={isSubmitting}
            loading={isSubmitting}
            size="lg"
            className="w-full"
          >
            {isLastStep ? 'Get Started' : 'Continue'}
            {!isLastStep && !isSubmitting && <ArrowRight size={20} color={colors.primaryForeground} />}
          </Button>

          {/* Step indicator text */}
          <Text className="text-muted-foreground text-sm text-center mt-3">
            Step {currentStep + 1} of {STEPS.length}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}
