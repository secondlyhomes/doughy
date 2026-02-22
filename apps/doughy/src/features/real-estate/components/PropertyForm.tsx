/**
 * PropertyForm Component
 *
 * Form for creating and editing property information.
 * Refactored to use FormField + useForm (Phase 2 Migration)
 *
 * Orchestrator — delegates to section components:
 *   - PropertyFormAddressSection
 *   - PropertyFormDetailsSection
 *   - PropertyFormFinancialSection
 *   - PropertyFormActions
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useForm } from '@/hooks/useForm';
import { PropertyImagePicker } from './PropertyImagePicker';
import { PropertyFormAddressSection } from './PropertyFormAddressSection';
import { PropertyFormDetailsSection } from './PropertyFormDetailsSection';
import { PropertyFormFinancialSection } from './PropertyFormFinancialSection';
import { PropertyFormActions } from './PropertyFormActions';
import { PropertyFormProps, FormData, initialFormData } from './property-form-types';
import { validatePropertyForm, mapFormDataToProperty } from './property-form-validation';

export function PropertyForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Property',
}: PropertyFormProps) {
  const colors = useThemeColors();

  const { values, errors, updateField, handleSubmit, setValues } = useForm<FormData>({
    initialValues: initialFormData,
    validate: validatePropertyForm,
    onSubmit: async (vals) => {
      const propertyData = mapFormDataToProperty(vals);
      await onSubmit(propertyData);
    },
  });

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setValues({
        address: initialData.address || initialData.address_line_1 || '',
        address_line_2: initialData.address_line_2 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zip: initialData.zip || '',
        county: initialData.county || '',
        propertyType: initialData.propertyType || initialData.property_type || 'single_family',
        bedrooms: initialData.bedrooms?.toString() || '',
        bathrooms: initialData.bathrooms?.toString() || '',
        square_feet: (initialData.square_feet || initialData.sqft)?.toString() || '',
        lot_size: (initialData.lot_size || initialData.lotSize)?.toString() || '',
        year_built: (initialData.year_built || initialData.yearBuilt)?.toString() || '',
        arv: initialData.arv?.toString() || '',
        purchase_price: initialData.purchase_price?.toString() || '',
        notes: initialData.notes || '',
        images: initialData.images?.map(img => img.url) || [],
      });
    }
  }, [initialData, setValues]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Property Images */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Photos</Text>
          <PropertyImagePicker
            images={values.images}
            onChange={(images) => updateField('images', images)}
            maxImages={10}
            disabled={isLoading}
          />
        </View>

        <PropertyFormAddressSection
          values={values}
          errors={errors}
          updateField={updateField}
          isLoading={isLoading}
        />

        <PropertyFormDetailsSection
          values={values}
          errors={errors}
          updateField={updateField}
          isLoading={isLoading}
        />

        <PropertyFormFinancialSection
          values={values}
          updateField={updateField}
          isLoading={isLoading}
        />
      </ScrollView>

      <PropertyFormActions
        onCancel={onCancel}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={submitLabel}
      />
    </KeyboardAvoidingView>
  );
}
