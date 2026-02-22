// src/features/rental-properties/components/FormBasicInfoSection.tsx
// Basic Info section: property name, address, city/state/zip

import React from 'react';
import { View, Text } from 'react-native';
import { Home, MapPin } from 'lucide-react-native';
import { FormField, AddressAutofill } from '@/components/ui';
import type { AddressAutofillValue } from '@/components/ui';
import type { FormSectionProps } from './rental-property-form-types';

export function FormBasicInfoSection({ form, fieldRefs, colors }: FormSectionProps) {
  return (
    <>
      {/* Section: Basic Info */}
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>
        Basic Info
      </Text>

      {/* Property Name */}
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

      {/* Address with Autofill */}
      <View onLayout={fieldRefs.createLayoutHandler('address')}>
        <AddressAutofill
          label="Street Address"
          value={form.values.address}
          onChange={(addr) => {
            if (typeof addr === 'object' && addr) {
              form.updateField('address', addr.formatted);
            } else {
              form.updateField('address', '');
            }
          }}
          onAddressSelected={(addr: AddressAutofillValue) => {
            // Auto-fill city, state, zip from verified address
            if (addr.city) form.updateField('city', addr.city);
            if (addr.state) form.updateField('state', addr.state);
            if (addr.zip) form.updateField('zip', addr.zip);
          }}
          placeholder="Start typing an address..."
          error={form.getFieldError('address')}
          required
          icon={MapPin}
        />
      </View>

      {/* City, State, ZIP in a row */}
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
