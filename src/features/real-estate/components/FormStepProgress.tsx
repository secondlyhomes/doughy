// src/features/real-estate/components/FormStepProgress.tsx
// Progress indicator for multi-step property form wizard

import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';

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
  return (
    <View className="px-4 py-4">
      {/* Step indicators */}
      <View className="flex-row items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <View className="items-center">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isCompleted
                      ? 'bg-primary'
                      : isCurrent
                      ? 'bg-primary'
                      : 'bg-muted border-2 border-border'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} color="white" strokeWidth={3} />
                  ) : (
                    <Text
                      className={`text-sm font-semibold ${
                        isCurrent ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                {/* Step label */}
                <Text
                  className={`text-xs mt-1 ${
                    isCurrent
                      ? 'text-primary font-medium'
                      : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.shortTitle}
                </Text>
              </View>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <View
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Current step title */}
      <View className="mt-4">
        <Text className="text-lg font-semibold text-foreground">
          {steps[currentStepIndex]?.title}
        </Text>
        <Text className="text-sm text-muted-foreground">
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
