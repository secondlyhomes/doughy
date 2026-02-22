/**
 * PropertyFormDetailsSection
 *
 * Property details section including property type picker,
 * bedrooms, bathrooms, square footage, lot size, and year built.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, Home } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FormField } from '@/components/ui';
import { PropertyConstants } from '../types';
import { FormData } from './property-form-types';

interface PropertyFormDetailsSectionProps {
  values: FormData;
  errors: Partial<Record<keyof FormData, string>>;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  isLoading: boolean;
}

export function PropertyFormDetailsSection({
  values,
  errors,
  updateField,
  isLoading,
}: PropertyFormDetailsSectionProps) {
  const colors = useThemeColors();
  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);

  const getPropertyTypeLabel = (type: string): string => {
    const option = PropertyConstants.TYPE_OPTIONS.find(opt => opt.value === type);
    return option?.label || type;
  };

  return (
    <>
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>Property Details</Text>

      {/* Property Type Picker */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Property Type</Text>
        <TouchableOpacity
          onPress={() => setShowPropertyTypePicker(!showPropertyTypePicker)}
          className="rounded-lg px-4 py-3 flex-row justify-between items-center"
          style={{ backgroundColor: colors.muted }}
          disabled={isLoading}
        >
          <Text style={{ color: colors.foreground }}>
            {getPropertyTypeLabel(values.propertyType)}
          </Text>
          <ChevronDown size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        {showPropertyTypePicker && (
          <View className="rounded-lg mt-2 max-h-60 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <ScrollView nestedScrollEnabled>
              {PropertyConstants.TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    updateField('propertyType', option.value);
                    setShowPropertyTypePicker(false);
                  }}
                  className="px-4 py-3 border-b"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: values.propertyType === option.value ? colors.primary + '1A' : undefined,
                  }}
                >
                  <Text
                    style={{
                      color: values.propertyType === option.value ? colors.primary : colors.foreground,
                      fontWeight: values.propertyType === option.value ? '500' : 'normal',
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Bedrooms"
            value={values.bedrooms}
            onChangeText={(text) => updateField('bedrooms', text)}
            error={errors.bedrooms}
            placeholder="3"
            keyboardType="numeric"
            icon={Home}
            editable={!isLoading}
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Bathrooms"
            value={values.bathrooms}
            onChangeText={(text) => updateField('bathrooms', text)}
            error={errors.bathrooms}
            placeholder="2"
            keyboardType="decimal-pad"
            icon={Home}
            editable={!isLoading}
          />
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Square Feet"
            value={values.square_feet}
            onChangeText={(text) => updateField('square_feet', text)}
            error={errors.square_feet}
            placeholder="1500"
            keyboardType="numeric"
            editable={!isLoading}
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Lot Size (sqft)"
            value={values.lot_size}
            onChangeText={(text) => updateField('lot_size', text)}
            placeholder="5000"
            keyboardType="numeric"
            editable={!isLoading}
          />
        </View>
      </View>

      <FormField
        label="Year Built"
        value={values.year_built}
        onChangeText={(text) => updateField('year_built', text)}
        error={errors.year_built}
        placeholder="1990"
        keyboardType="numeric"
        editable={!isLoading}
      />
    </>
  );
}
