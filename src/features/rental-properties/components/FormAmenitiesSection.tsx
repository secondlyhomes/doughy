// src/features/rental-properties/components/FormAmenitiesSection.tsx
// Amenities section: chip-style multi-select for common amenities

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { withOpacity } from '@/lib/design-utils';
import { COMMON_AMENITIES } from '../types/form';
import type { FormSectionProps } from './rental-property-form-types';

type AmenitiesSectionProps = Pick<FormSectionProps, 'form' | 'colors'>;

export function FormAmenitiesSection({ form, colors }: AmenitiesSectionProps) {
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
      {/* Section: Amenities */}
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>
        Amenities
      </Text>
      <Text className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
        Select all that apply
      </Text>

      <View className="flex-row flex-wrap gap-2 mb-4">
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
    </>
  );
}
