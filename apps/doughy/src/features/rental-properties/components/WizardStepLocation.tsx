// src/features/rental-properties/components/WizardStepLocation.tsx
// Step 1: Location fields for the rental property form wizard

import React from 'react';
import { View } from 'react-native';
import { Home, MapPin } from 'lucide-react-native';
import { FormField } from '@/components/ui';
import type { WizardStepProps } from './wizard-form-types';

export function WizardStepLocation({ form, fieldRefs }: WizardStepProps) {
  return (
    <>
      <FormField
        ref={(ref) => fieldRefs.registerInputRef('name', ref)}
        onLayoutContainer={fieldRefs.createLayoutHandler('name')}
        label="Property Name"
        value={form.values.name}
        onChangeText={(text) => form.updateField('name', text)}
        onBlur={() => form.setFieldTouched('name')}
        error={form.getFieldError('name')}
        placeholder="e.g., Beach House, Downtown Condo"
        required
        icon={Home}
        autoCapitalize="words"
      />

      <FormField
        ref={(ref) => fieldRefs.registerInputRef('address', ref)}
        onLayoutContainer={fieldRefs.createLayoutHandler('address')}
        label="Street Address"
        value={form.values.address}
        onChangeText={(text) => form.updateField('address', text)}
        onBlur={() => form.setFieldTouched('address')}
        error={form.getFieldError('address')}
        placeholder="123 Main Street"
        required
        icon={MapPin}
        autoCapitalize="words"
      />

      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('city', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('city')}
            label="City"
            value={form.values.city}
            onChangeText={(text) => form.updateField('city', text)}
            onBlur={() => form.setFieldTouched('city')}
            error={form.getFieldError('city')}
            placeholder="City"
            required
            autoCapitalize="words"
          />
        </View>
        <View style={{ width: 80 }}>
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('state', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('state')}
            label="State"
            value={form.values.state}
            onChangeText={(text) => form.updateField('state', text.toUpperCase())}
            onBlur={() => form.setFieldTouched('state')}
            error={form.getFieldError('state')}
            placeholder="ST"
            required
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>
        <View style={{ width: 100 }}>
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('zip', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('zip')}
            label="ZIP"
            value={form.values.zip}
            onChangeText={(text) => form.updateField('zip', text)}
            onBlur={() => form.setFieldTouched('zip')}
            error={form.getFieldError('zip')}
            placeholder="12345"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
      </View>
    </>
  );
}
