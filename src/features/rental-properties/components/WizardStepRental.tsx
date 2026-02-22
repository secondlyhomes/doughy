// src/features/rental-properties/components/WizardStepRental.tsx
// Step 3: Rental settings fields for the rental property form wizard

import React, { useState } from 'react';
import { View } from 'react-native';
import { DollarSign } from 'lucide-react-native';
import { FormField } from '@/components/ui';
import { WizardInlinePicker } from './WizardInlinePicker';
import { RENTAL_TYPE_OPTIONS, RATE_TYPE_OPTIONS } from './wizard-form-constants';
import type { WizardStepProps } from './wizard-form-types';
import type { RentalType, RateType } from '../types';

export function WizardStepRental({ form, fieldRefs, colors }: WizardStepProps) {
  const [showRentalTypePicker, setShowRentalTypePicker] = useState(false);
  const [showRateTypePicker, setShowRateTypePicker] = useState(false);

  return (
    <>
      <WizardInlinePicker<RentalType>
        label="Rental Type"
        value={form.values.rental_type}
        options={RENTAL_TYPE_OPTIONS}
        placeholder="Select rental type"
        showPicker={showRentalTypePicker}
        setShowPicker={setShowRentalTypePicker}
        onChange={(value) => form.updateField('rental_type', value)}
        colors={colors}
      />

      <FormField
        ref={(ref) => fieldRefs.registerInputRef('base_rate', ref)}
        onLayoutContainer={fieldRefs.createLayoutHandler('base_rate')}
        label="Base Rate"
        value={String(form.values.base_rate || '')}
        onChangeText={(text) => form.updateField('base_rate', text)}
        onBlur={() => form.setFieldTouched('base_rate')}
        error={form.getFieldError('base_rate')}
        placeholder="0.00"
        keyboardType="decimal-pad"
        icon={DollarSign}
        required
        prefix="$"
      />

      <WizardInlinePicker<RateType>
        label="Rate Type"
        value={form.values.rate_type}
        options={RATE_TYPE_OPTIONS}
        placeholder="Select rate type"
        showPicker={showRateTypePicker}
        setShowPicker={setShowRateTypePicker}
        onChange={(value) => form.updateField('rate_type', value)}
        colors={colors}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('cleaning_fee', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('cleaning_fee')}
            label="Cleaning Fee"
            value={String(form.values.cleaning_fee || '')}
            onChangeText={(text) => form.updateField('cleaning_fee', text)}
            onBlur={() => form.setFieldTouched('cleaning_fee')}
            error={form.getFieldError('cleaning_fee')}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
          />
        </View>
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('security_deposit', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('security_deposit')}
            label="Security Deposit"
            value={String(form.values.security_deposit || '')}
            onChangeText={(text) => form.updateField('security_deposit', text)}
            onBlur={() => form.setFieldTouched('security_deposit')}
            error={form.getFieldError('security_deposit')}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
          />
        </View>
      </View>
    </>
  );
}
