// src/features/rental-properties/components/RentalPropertyForm.tsx
// Form component for creating/editing rental properties
// Follows AddLeadScreen pattern with useFormValidation

import React from 'react';
import { ScrollView } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useFormValidation, useFieldRef } from '@/hooks';
import { rentalPropertyFormSchema, rentalPropertyFieldOrder } from '@/lib/validation';
import {
  RentalPropertyFormData,
  defaultRentalPropertyFormValues,
} from '../types/form';
import type { FieldName, RentalPropertyFormProps } from './rental-property-form-types';
import { FormBasicInfoSection } from './FormBasicInfoSection';
import { FormPropertyDetailsSection } from './FormPropertyDetailsSection';
import { FormRentalSettingsSection } from './FormRentalSettingsSection';
import { FormAmenitiesSection } from './FormAmenitiesSection';
import { FormStatusSubmitSection } from './FormStatusSubmitSection';

export function RentalPropertyForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Create Property',
}: RentalPropertyFormProps) {
  const colors = useThemeColors();

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

  return (
    <ScrollView
      ref={fieldRefs.scrollViewRef}
      className="flex-1"
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <FormBasicInfoSection form={form} fieldRefs={fieldRefs} colors={colors} />
      <FormPropertyDetailsSection form={form} fieldRefs={fieldRefs} colors={colors} />
      <FormRentalSettingsSection form={form} fieldRefs={fieldRefs} colors={colors} />
      <FormAmenitiesSection form={form} colors={colors} />
      <FormStatusSubmitSection
        form={form}
        fieldRefs={fieldRefs}
        colors={colors}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
      />
    </ScrollView>
  );
}

export default RentalPropertyForm;
