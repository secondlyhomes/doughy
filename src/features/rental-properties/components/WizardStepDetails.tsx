// src/features/rental-properties/components/WizardStepDetails.tsx
// Step 2: Property details fields for the rental property form wizard

import React, { useState } from 'react';
import { View } from 'react-native';
import { Bed, Bath, Maximize2 } from 'lucide-react-native';
import { FormField } from '@/components/ui';
import { WizardInlinePicker } from './WizardInlinePicker';
import { PROPERTY_TYPE_OPTIONS } from './wizard-form-constants';
import type { WizardStepProps } from './wizard-form-types';
import type { PropertyType } from '../types';

export function WizardStepDetails({ form, fieldRefs, colors }: WizardStepProps) {
  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);

  return (
    <>
      <WizardInlinePicker<PropertyType>
        label="Property Type"
        value={form.values.property_type}
        options={PROPERTY_TYPE_OPTIONS}
        placeholder="Select property type"
        showPicker={showPropertyTypePicker}
        setShowPicker={setShowPropertyTypePicker}
        onChange={(value) => form.updateField('property_type', value)}
        colors={colors}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('bedrooms', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('bedrooms')}
            label="Bedrooms"
            value={String(form.values.bedrooms || '')}
            onChangeText={(text) => form.updateField('bedrooms', text)}
            onBlur={() => form.setFieldTouched('bedrooms')}
            error={form.getFieldError('bedrooms')}
            placeholder="0"
            keyboardType="number-pad"
            icon={Bed}
          />
        </View>
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('bathrooms', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('bathrooms')}
            label="Bathrooms"
            value={String(form.values.bathrooms || '')}
            onChangeText={(text) => form.updateField('bathrooms', text)}
            onBlur={() => form.setFieldTouched('bathrooms')}
            error={form.getFieldError('bathrooms')}
            placeholder="0"
            keyboardType="decimal-pad"
            icon={Bath}
          />
        </View>
      </View>

      <FormField
        ref={(ref) => fieldRefs.registerInputRef('square_feet', ref)}
        onLayoutContainer={fieldRefs.createLayoutHandler('square_feet')}
        label="Square Feet"
        value={String(form.values.square_feet || '')}
        onChangeText={(text) => form.updateField('square_feet', text)}
        onBlur={() => form.setFieldTouched('square_feet')}
        error={form.getFieldError('square_feet')}
        placeholder="e.g., 1500"
        keyboardType="number-pad"
        icon={Maximize2}
      />
    </>
  );
}
