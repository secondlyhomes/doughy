// src/features/portfolio/components/NewPropertyFields.tsx
// New property form fields for AddToPortfolioSheet

import React from 'react';
import { View } from 'react-native';
import { Home } from 'lucide-react-native';
import { FocusedSheetSection, FormField, Select, AddressAutofill } from '@/components/ui';
import type { AddressAutofillValue } from '@/components/ui';
import { PROPERTY_TYPES } from './add-to-portfolio-constants';
import type { NewPropertyFieldsProps } from './add-to-portfolio-types';

export function NewPropertyFields({ formData, errors, updateField }: NewPropertyFieldsProps) {
  return (
    <FocusedSheetSection title="Property Details">
      <AddressAutofill
        label="Street Address"
        value={formData.address}
        onChange={(addr) => {
          if (typeof addr === 'object' && addr) {
            updateField('address', addr.formatted);
          } else {
            updateField('address', '');
          }
        }}
        onAddressSelected={(addr: AddressAutofillValue) => {
          // Auto-fill city, state, zip from verified address
          if (addr.city) updateField('city', addr.city);
          if (addr.state) updateField('state', addr.state);
          if (addr.zip) updateField('zip', addr.zip);
        }}
        error={errors.address}
        placeholder="Start typing an address..."
        required
        icon={Home}
      />

      <View className="flex-row gap-3 mb-0">
        <View className="flex-1">
          <FormField
            label="City"
            value={formData.city}
            onChangeText={(value) => updateField('city', value)}
            error={errors.city}
            placeholder="Austin"
            required
          />
        </View>
        <View style={{ width: 80 }}>
          <FormField
            label="State"
            value={formData.state}
            onChangeText={(value) => updateField('state', value.toUpperCase())}
            error={errors.state}
            placeholder="TX"
            autoCapitalize="characters"
            maxLength={2}
            required
          />
        </View>
      </View>

      <View className="flex-row gap-3 mb-0">
        <View style={{ width: 120 }}>
          <FormField
            label="ZIP Code"
            value={formData.zip}
            onChangeText={(value) => updateField('zip', value)}
            error={errors.zip}
            placeholder="78701"
            keyboardType="numeric"
            maxLength={10}
            required
          />
        </View>
        <View className="flex-1">
          <View className="mb-4">
            <Select
              label="Property Type"
              value={formData.property_type}
              onValueChange={(value) => updateField('property_type', value)}
              options={PROPERTY_TYPES}
              placeholder="Select type"
            />
          </View>
        </View>
      </View>

      <View className="flex-row gap-3 mb-0">
        <View className="flex-1">
          <FormField
            label="Bedrooms"
            value={formData.bedrooms}
            onChangeText={(value) => updateField('bedrooms', value)}
            placeholder="3"
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Bathrooms"
            value={formData.bathrooms}
            onChangeText={(value) => updateField('bathrooms', value)}
            placeholder="2"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View className="flex-row gap-3 mb-0">
        <View className="flex-1">
          <FormField
            label="Square Feet"
            value={formData.square_feet}
            onChangeText={(value) => updateField('square_feet', value)}
            placeholder="1500"
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Year Built"
            value={formData.year_built}
            onChangeText={(value) => updateField('year_built', value)}
            placeholder="2000"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>
    </FocusedSheetSection>
  );
}
