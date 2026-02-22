/**
 * PropertyFormFinancialSection
 *
 * Financial fields (ARV, purchase price) and notes section of the PropertyForm.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { DollarSign, FileText } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FormField } from '@/components/ui';
import { FormData } from './property-form-types';

interface PropertyFormFinancialSectionProps {
  values: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  isLoading: boolean;
}

export function PropertyFormFinancialSection({
  values,
  updateField,
  isLoading,
}: PropertyFormFinancialSectionProps) {
  const colors = useThemeColors();

  return (
    <>
      {/* Financial Section */}
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>Financial</Text>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Property Value (ARV)"
            value={values.arv}
            onChangeText={(text) => updateField('arv', text)}
            placeholder="350000"
            keyboardType="numeric"
            icon={DollarSign}
            editable={!isLoading}
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Purchase Price"
            value={values.purchase_price}
            onChangeText={(text) => updateField('purchase_price', text)}
            placeholder="300000"
            keyboardType="numeric"
            icon={DollarSign}
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Notes Section */}
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>Notes</Text>
      <FormField
        label="Notes"
        value={values.notes}
        onChangeText={(text) => updateField('notes', text)}
        placeholder="Add any additional notes about this property..."
        multiline
        numberOfLines={4}
        icon={FileText}
        editable={!isLoading}
      />
    </>
  );
}
