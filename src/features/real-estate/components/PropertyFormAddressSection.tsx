/**
 * PropertyFormAddressSection
 *
 * Address fields section of the PropertyForm.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FormField } from '@/components/ui';
import { FormData } from './property-form-types';

interface PropertyFormAddressSectionProps {
  values: FormData;
  errors: Partial<Record<keyof FormData, string>>;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  isLoading: boolean;
}

export function PropertyFormAddressSection({
  values,
  errors,
  updateField,
  isLoading,
}: PropertyFormAddressSectionProps) {
  const colors = useThemeColors();

  return (
    <>
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>Address</Text>
      <FormField
        label="Street Address"
        value={values.address}
        onChangeText={(text) => updateField('address', text)}
        error={errors.address}
        placeholder="123 Main Street"
        required
        icon={MapPin}
        editable={!isLoading}
      />
      <FormField
        label="Unit/Apt"
        value={values.address_line_2}
        onChangeText={(text) => updateField('address_line_2', text)}
        placeholder="Apt 4B"
        helperText="Optional"
        editable={!isLoading}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="City"
            value={values.city}
            onChangeText={(text) => updateField('city', text)}
            error={errors.city}
            placeholder="City"
            required
            editable={!isLoading}
          />
        </View>
        <View className="w-20">
          <FormField
            label="State"
            value={values.state}
            onChangeText={(text) => updateField('state', text)}
            error={errors.state}
            placeholder="CA"
            maxLength={2}
            required
            editable={!isLoading}
          />
        </View>
        <View className="w-24">
          <FormField
            label="ZIP"
            value={values.zip}
            onChangeText={(text) => updateField('zip', text)}
            error={errors.zip}
            placeholder="12345"
            keyboardType="numeric"
            required
            editable={!isLoading}
          />
        </View>
      </View>

      <FormField
        label="County"
        value={values.county}
        onChangeText={(text) => updateField('county', text)}
        placeholder="County"
        helperText="Optional"
        editable={!isLoading}
      />
    </>
  );
}
