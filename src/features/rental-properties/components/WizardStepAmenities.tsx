// src/features/rental-properties/components/WizardStepAmenities.tsx
// Step 4: Amenities & status fields for the rental property form wizard

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { withOpacity } from '@/lib/design-utils';
import { COMMON_AMENITIES } from '../types/form';
import { WizardInlinePicker } from './WizardInlinePicker';
import { STATUS_OPTIONS } from './wizard-form-constants';
import type { WizardStepProps } from './wizard-form-types';
import type { PropertyStatus } from '../types';

export function WizardStepAmenities({ form, colors }: WizardStepProps) {
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const handleAmenityToggle = useCallback((amenity: string) => {
    const currentAmenities = form.values.amenities || [];
    if (currentAmenities.includes(amenity)) {
      form.updateField('amenities', currentAmenities.filter(a => a !== amenity));
    } else {
      form.updateField('amenities', [...currentAmenities, amenity]);
    }
  }, [form]);

  return (
    <>
      <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
        Amenities
      </Text>
      <Text className="text-xs mb-3" style={{ color: colors.mutedForeground }}>
        Select all that apply
      </Text>

      <View className="flex-row flex-wrap gap-2 mb-6">
        {COMMON_AMENITIES.map((amenity) => {
          const isSelected = form.values.amenities?.includes(amenity);
          return (
            <TouchableOpacity
              key={amenity}
              className="px-3 py-2 rounded-full"
              style={{
                backgroundColor: isSelected
                  ? withOpacity(colors.primary, 'muted')
                  : colors.muted,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
              }}
              onPress={() => handleAmenityToggle(amenity)}
            >
              <Text
                className="text-sm"
                style={{
                  color: isSelected ? colors.primary : colors.foreground,
                  fontWeight: isSelected ? '500' : 'normal',
                }}
              >
                {amenity}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <WizardInlinePicker<PropertyStatus>
        label="Property Status"
        value={form.values.status}
        options={STATUS_OPTIONS}
        placeholder="Select status"
        showPicker={showStatusPicker}
        setShowPicker={setShowStatusPicker}
        onChange={(value) => form.updateField('status', value)}
        colors={colors}
      />
    </>
  );
}
