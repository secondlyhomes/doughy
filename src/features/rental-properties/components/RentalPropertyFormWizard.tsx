// src/features/rental-properties/components/RentalPropertyFormWizard.tsx
// Multi-step form wizard for creating/editing rental properties
// Follows ADHD-friendly design: max 5 fields per step, progress indicator

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { haptic } from '@/lib/haptics';
import { Button, Progress } from '@/components/ui';
import { useFormValidation, useFieldRef } from '@/hooks';
import { rentalPropertyFormSchema, rentalPropertyFieldOrder } from '@/lib/validation';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import {
  RentalPropertyFormData,
  defaultRentalPropertyFormValues,
} from '../types/form';
import { WIZARD_STEPS } from './wizard-form-constants';
import { WizardStepLocation } from './WizardStepLocation';
import { WizardStepDetails } from './WizardStepDetails';
import { WizardStepRental } from './WizardStepRental';
import { WizardStepAmenities } from './WizardStepAmenities';
import type { FieldName } from './wizard-form-types';

interface RentalPropertyFormWizardProps {
  initialValues?: Partial<RentalPropertyFormData>;
  onSubmit: (data: RentalPropertyFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function RentalPropertyFormWizard({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Create Property',
}: RentalPropertyFormWizardProps) {
  const colors = useThemeColors();
  const [currentStep, setCurrentStep] = useState(0);

  // Field refs for scroll-to-error
  const fieldRefs = useFieldRef<FieldName>();

  // Form validation hook
  const form = useFormValidation<RentalPropertyFormData>({
    initialValues: {
      ...defaultRentalPropertyFormValues,
      ...initialValues,
    },
    schema: rentalPropertyFormSchema,
    validationMode: 'onChange',
    debounceMs: 300,
    fieldOrder: rentalPropertyFieldOrder,
    onScrollToError: (fieldName) => {
      fieldRefs.scrollToField(fieldName as FieldName);
    },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  // Validate current step fields synchronously
  // This runs synchronous validation to avoid race condition with debounced onChange validation
  const validateCurrentStep = useCallback((): boolean => {
    // Run synchronous validation on the current step's fields
    const validateFields = (fields: (keyof RentalPropertyFormData)[]) => {
      let isValid = true;
      for (const field of fields) {
        form.setFieldTouched(field);
        // Trigger synchronous validation for this field
        const error = form.validateSingleField?.(field) ?? form.getFieldError(field);
        if (error) {
          isValid = false;
        }
      }
      return isValid;
    };

    switch (currentStep) {
      case 0: // Location - required fields
        const locationFields: (keyof RentalPropertyFormData)[] = ['name', 'address', 'city', 'state'];
        const locationValid = validateFields(locationFields);
        // Also check that required values are present (not just error-free)
        const hasRequiredValues = !!form.values.name?.trim() &&
          !!form.values.address?.trim() &&
          !!form.values.city?.trim() &&
          !!form.values.state?.trim();
        return locationValid && hasRequiredValues;
      case 1: // Details - optional fields
        return true;
      case 2: // Rental Settings - base_rate required
        const rentalFields: (keyof RentalPropertyFormData)[] = ['base_rate'];
        const rentalValid = validateFields(rentalFields);
        const hasBaseRate = !!form.values.base_rate && Number(form.values.base_rate) > 0;
        return rentalValid && hasBaseRate;
      case 3: // Amenities & Status - optional
        return true;
      default:
        return true;
    }
  }, [currentStep, form]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      return;
    }
    if (currentStep < WIZARD_STEPS.length - 1) {
      haptic.light();
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateCurrentStep]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      haptic.light();
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Handle form submission
  const handleSubmitForm = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }
    haptic.medium();
    try {
      await form.handleSubmit();
    } catch (err) {
      // Error is already handled by form's onError or the parent component
      // This catch prevents unhandled promise rejection
      console.error('[RentalPropertyFormWizard] Submit error:', err);
    }
  }, [validateCurrentStep, form]);

  // Handle cancel with confirmation
  const handleCancel = useCallback(() => {
    if (onCancel) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onCancel },
        ]
      );
    }
  }, [onCancel]);

  // Render step content
  const stepProps = { form, fieldRefs, colors };
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WizardStepLocation {...stepProps} />;
      case 1:
        return <WizardStepDetails {...stepProps} />;
      case 2:
        return <WizardStepRental {...stepProps} />;
      case 3:
        return <WizardStepAmenities {...stepProps} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const progress = (currentStep + 1) / WIZARD_STEPS.length;

  return (
    <View className="flex-1">
      {/* Progress Header */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md }}>
        {/* Progress Bar */}
        <View className="flex-row items-center justify-between mb-2">
          <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <Progress value={progress * 100} />

        {/* Step Title */}
        <Text
          style={{
            color: colors.foreground,
            fontSize: FONT_SIZES.lg,
            fontWeight: '600',
            marginTop: SPACING.md,
          }}
        >
          {WIZARD_STEPS[currentStep].title}
        </Text>
      </View>

      {/* Step Content */}
      <ScrollView
        ref={fieldRefs.scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View
        className="flex-row gap-3"
        style={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: SPACING.xl,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        {currentStep === 0 ? (
          onCancel ? (
            <Button
              variant="secondary"
              onPress={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X size={20} color={colors.foreground} />
              Cancel
            </Button>
          ) : (
            <View className="flex-1" />
          )
        ) : (
          <Button
            variant="secondary"
            onPress={handleBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            <ArrowLeft size={20} color={colors.foreground} />
            Back
          </Button>
        )}

        {isLastStep ? (
          <Button
            onPress={handleSubmitForm}
            disabled={isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            {!isSubmitting && <Check size={20} color={colors.primaryForeground} />}
            {submitLabel}
          </Button>
        ) : (
          <Button
            onPress={handleNext}
            disabled={isSubmitting}
            className="flex-1"
          >
            Next
            <ArrowRight size={20} color={colors.primaryForeground} />
          </Button>
        )}
      </View>
    </View>
  );
}

export default RentalPropertyFormWizard;
