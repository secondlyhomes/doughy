// src/features/rental-properties/components/FormPropertyDetailsSection.tsx
// Property Details section: property type picker, bedrooms/bathrooms, square feet

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Bed, Bath, Maximize2 } from 'lucide-react-native';
import { FormField } from '@/components/ui';
import { WizardInlinePicker } from './WizardInlinePicker';
import { PROPERTY_TYPE_OPTIONS } from './rental-property-form-constants';
import type { FormSectionProps } from './rental-property-form-types';

export function FormPropertyDetailsSection({ form, fieldRefs, colors }: FormSectionProps) {
  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);

  return (
    <>
      {/* Section: Property Details */}
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>
        Property Details
      </Text>

      {/* Property Type Picker */}
      <WizardInlinePicker
        label="Property Type"
        value={form.values.property_type}
        options={PROPERTY_TYPE_OPTIONS}
        placeholder="Select property type"
        showPicker={showPropertyTypePicker}
        setShowPicker={setShowPropertyTypePicker}
        onChange={(value) => form.updateField('property_type', value)}
        colors={colors}
      />

      {/* Bedrooms & Bathrooms */}
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

      {/* Square Feet */}
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
