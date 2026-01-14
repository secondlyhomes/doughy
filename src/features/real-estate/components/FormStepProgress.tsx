// src/features/real-estate/components/FormStepProgress.tsx
// Progress indicator for multi-step property form wizard

import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

export interface FormStep {
  id: string;
  title: string;
  shortTitle: string;
}

interface FormStepProgressProps {
  steps: FormStep[];
  currentStepIndex: number;
}

export function FormStepProgress({ steps, currentStepIndex }: FormStepProgressProps) {
  const colors = useThemeColors();
  return (
    <View className="px-4 py-4">
      {/* Step indicators */}
      <View className="flex-row items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          const getCircleStyle = () => {
            if (isCompleted || isCurrent) {
              return { backgroundColor: colors.primary };
            }
            return { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 2 };
          };

          const getLabelStyle = () => {
            if (isCurrent) return { color: colors.primary };
            if (isCompleted) return { color: colors.foreground };
            return { color: colors.mutedForeground };
          };

          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <View className="items-center">
                <View
                  style={getCircleStyle()}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  {isCompleted ? (
                    <Check size={16} color={colors.primaryForeground} strokeWidth={3} />
                  ) : (
                    <Text
                      style={{ color: isCurrent ? colors.primaryForeground : colors.mutedForeground }}
                      className="text-sm font-semibold"
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                {/* Step label */}
                <Text
                  style={getLabelStyle()}
                  className={`text-xs mt-1 ${isCurrent ? 'font-medium' : ''}`}
                >
                  {step.shortTitle}
                </Text>
              </View>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <View
                  style={{ backgroundColor: index < currentStepIndex ? colors.primary : colors.border }}
                  className="flex-1 h-0.5 mx-2"
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Current step title */}
      <View className="mt-4">
        <Text style={{ color: colors.foreground }} className="text-lg font-semibold">
          {steps[currentStepIndex]?.title}
        </Text>
        <Text style={{ color: colors.mutedForeground }} className="text-sm">
          Step {currentStepIndex + 1} of {steps.length}
        </Text>
      </View>
    </View>
  );
}

// Default form steps
export const PROPERTY_FORM_STEPS: FormStep[] = [
  { id: 'address', title: 'Property Address', shortTitle: 'Address' },
  { id: 'details', title: 'Property Details', shortTitle: 'Details' },
  { id: 'pricing', title: 'Pricing & Value', shortTitle: 'Pricing' },
  { id: 'images', title: 'Property Photos', shortTitle: 'Photos' },
  { id: 'review', title: 'Review & Submit', shortTitle: 'Review' },
];
