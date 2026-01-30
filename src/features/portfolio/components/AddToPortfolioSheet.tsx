// src/features/portfolio/components/AddToPortfolioSheet.tsx
// Bottom sheet for manually adding properties to portfolio

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Home, Plus, Building, Calendar, DollarSign, FileText } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheet, Button, FormField, DatePicker, Select } from '@/components/ui';
import { useAddToPortfolioForm } from '../hooks/useAddToPortfolioForm';
import { useAvailableProperties } from '../hooks/useAvailableProperties';
import { PropertySelector } from './PropertySelector';
import type { AddToPortfolioInput } from '../types';

interface AddToPortfolioSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: AddToPortfolioInput) => Promise<void>;
  isLoading?: boolean;
}

const PROPERTY_TYPES = [
  { label: 'Single Family', value: 'single_family' },
  { label: 'Multi-Family', value: 'multi_family' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Land', value: 'land' },
  { label: 'Other', value: 'other' },
];

export function AddToPortfolioSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: AddToPortfolioSheetProps) {
  const colors = useThemeColors();
  const { properties, isLoading: propertiesLoading } = useAvailableProperties();

  // Find the selected property for form pre-filling
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const selectedProperty = useMemo(() => {
    return properties.find(p => p.id === selectedPropertyId) || null;
  }, [properties, selectedPropertyId]);

  const {
    formData,
    errors,
    updateField,
    validate,
    getSubmitData,
    reset,
    setMode,
  } = useAddToPortfolioForm(selectedProperty);

  // Handle property selection
  const handlePropertySelect = useCallback((propertyId: string) => {
    setSelectedPropertyId(propertyId);
    updateField('property_id', propertyId);
  }, [updateField]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      const submitData = getSubmitData();
      await onSubmit(submitData);
      reset();
      setSelectedPropertyId('');
      onClose();
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      Alert.alert('Error', 'Failed to add property to portfolio. Please try again.');
    }
  }, [validate, getSubmitData, onSubmit, reset, onClose]);

  const handleClose = useCallback(() => {
    reset();
    setSelectedPropertyId('');
    onClose();
  }, [reset, onClose]);

  // Handle date change
  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      updateField('acquisition_date', date.toISOString().split('T')[0]);
    }
  }, [updateField]);

  return (
    <BottomSheet visible={visible} onClose={handleClose} snapPoints={['90%']}>
      {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
          <View>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              Add to Portfolio
            </Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Add a property you already own
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.muted }}
          >
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mode Toggle */}
          <View className="mb-5">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
              Property Source
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-3 rounded-lg border gap-2"
                style={{
                  backgroundColor: formData.mode === 'existing' ? colors.primary : colors.muted,
                  borderColor: formData.mode === 'existing' ? colors.primary : colors.border,
                }}
                onPress={() => setMode('existing')}
              >
                <Building
                  size={18}
                  color={formData.mode === 'existing' ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: formData.mode === 'existing' ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  Existing
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-3 rounded-lg border gap-2"
                style={{
                  backgroundColor: formData.mode === 'new' ? colors.primary : colors.muted,
                  borderColor: formData.mode === 'new' ? colors.primary : colors.border,
                }}
                onPress={() => setMode('new')}
              >
                <Plus
                  size={18}
                  color={formData.mode === 'new' ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: formData.mode === 'new' ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  New Property
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Property Selection (Existing Mode) */}
          {formData.mode === 'existing' && (
            <View className="mb-4">
              <PropertySelector
                value={formData.property_id}
                onValueChange={handlePropertySelect}
                properties={properties}
                isLoading={propertiesLoading}
                label="Select Property"
                placeholder="Choose a property..."
                error={errors.property_id}
              />
              {properties.length === 0 && !propertiesLoading && (
                <View className="mt-2 p-3 rounded-lg" style={{ backgroundColor: colors.muted }}>
                  <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                    No available properties. Switch to "New Property" to add one.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* New Property Fields */}
          {formData.mode === 'new' && (
            <>
              <FormField
                label="Street Address"
                value={formData.address}
                onChangeText={(value) => updateField('address', value)}
                error={errors.address}
                placeholder="123 Main Street"
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
            </>
          )}

          {/* Divider */}
          <View className="h-px my-2" style={{ backgroundColor: colors.border }} />

          {/* Acquisition Details */}
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>
            Acquisition Details
          </Text>

          <View className="mb-4">
            <DatePicker
              label="Acquisition Date"
              value={formData.acquisition_date ? new Date(formData.acquisition_date + 'T00:00:00') : undefined}
              onChange={handleDateChange}
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

          <View className="h-4" />
        </ScrollView>

      {/* Submit Button */}
      <View className="p-4 border-t" style={{ borderColor: colors.border }}>
        <Button
          onPress={handleSubmit}
          disabled={isLoading}
          loading={isLoading}
          size="lg"
          className="w-full"
        >
          {!isLoading && <Home size={18} color={colors.primaryForeground} />}
          Add to Portfolio
        </Button>
      </View>
    </BottomSheet>
  );
}
