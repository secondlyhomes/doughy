// src/features/portfolio/components/AcquisitionDetailsSection.tsx
// Acquisition details form section for AddToPortfolioSheet

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FocusedSheetSection, FormField, DatePicker } from '@/components/ui';
import type { AcquisitionDetailsSectionProps } from './add-to-portfolio-types';

export function AcquisitionDetailsSection({
  formData,
  errors,
  updateField,
  onDateChange,
}: AcquisitionDetailsSectionProps) {
  const colors = useThemeColors();

  return (
    <FocusedSheetSection title="Acquisition Details">
      <View className="mb-4">
        <DatePicker
          label="Acquisition Date"
          value={formData.acquisition_date ? new Date(formData.acquisition_date + 'T00:00:00') : undefined}
          onChange={onDateChange}
          placeholder="Select date"
          maxDate={new Date()}
        />
        {errors.acquisition_date && (
          <Text className="text-xs mt-1" style={{ color: colors.destructive }}>
            {errors.acquisition_date}
          </Text>
        )}
      </View>

      <FormField
        label="Acquisition Price"
        value={formData.acquisition_price}
        onChangeText={(value) => updateField('acquisition_price', value)}
        error={errors.acquisition_price}
        placeholder="350000"
        keyboardType="numeric"
        prefix="$"
        required
      />

      {/* Optional Financial Fields */}
      <View className="flex-row gap-3 mb-0">
        <View className="flex-1">
          <FormField
            label="Monthly Rent"
            value={formData.monthly_rent}
            onChangeText={(value) => updateField('monthly_rent', value)}
            placeholder="2000"
            keyboardType="numeric"
            prefix="$"
            helperText="Optional"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Monthly Expenses"
            value={formData.monthly_expenses}
            onChangeText={(value) => updateField('monthly_expenses', value)}
            placeholder="500"
            keyboardType="numeric"
            prefix="$"
            helperText="Optional"
          />
        </View>
      </View>

      <FormField
        label="Notes"
        value={formData.notes}
        onChangeText={(value) => updateField('notes', value)}
        placeholder="Additional notes about this property..."
        multiline
        numberOfLines={2}
        helperText="Optional"
      />
    </FocusedSheetSection>
  );
}
