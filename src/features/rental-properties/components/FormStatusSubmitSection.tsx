// src/features/rental-properties/components/FormStatusSubmitSection.tsx
// Status picker and submit button section

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { withOpacity } from '@/lib/design-utils';
import { WizardInlinePicker } from './WizardInlinePicker';
import { STATUS_OPTIONS } from './rental-property-form-constants';
import type { FormSectionProps } from './rental-property-form-types';

interface FormStatusSubmitSectionProps extends FormSectionProps {
  isSubmitting: boolean;
  submitLabel: string;
}

export function FormStatusSubmitSection({
  form,
  colors,
  isSubmitting,
  submitLabel,
}: FormStatusSubmitSectionProps) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  return (
    <>
      {/* Section: Status */}
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>
        Status
      </Text>

      <WizardInlinePicker
        label="Property Status"
        value={form.values.status}
        options={STATUS_OPTIONS}
        placeholder="Select status"
        showPicker={showStatusPicker}
        setShowPicker={setShowStatusPicker}
        onChange={(value) => form.updateField('status', value)}
        colors={colors}
      />

      {/* Submit Button */}
      <TouchableOpacity
        className="rounded-lg py-4 items-center mt-4"
        style={{
          backgroundColor: isSubmitting
            ? withOpacity(colors.primary, 'opaque')
            : colors.primary,
        }}
        onPress={form.handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text className="font-semibold text-base" style={{ color: colors.primaryForeground }}>
            {submitLabel}
          </Text>
        )}
      </TouchableOpacity>

      {/* Bottom padding for keyboard */}
      <View style={{ height: 100 }} />
    </>
  );
}
