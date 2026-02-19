// src/features/portfolio/components/AddToPortfolioSheet.tsx
// Focused sheet for manually adding properties to portfolio
// Uses FocusedSheet for mode toggle + complex form that needs focus

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Home, Plus, Building } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FocusedSheet, FocusedSheetSection, FormField, DatePicker, Select, AddressAutofill } from '@/components/ui';
import type { AddressAutofillValue } from '@/components/ui';
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
    <FocusedSheet
      visible={visible}
      onClose={handleClose}
      title="Add to Portfolio"
      subtitle="Add a property you already own"
      doneLabel="Add to Portfolio"
      onDone={handleSubmit}
      isSubmitting={isLoading}
    >
      {/* Mode Toggle */}
      <FocusedSheetSection title="Property Source">
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
      </FocusedSheetSection>

      {/* Property Selection (Existing Mode) */}
      {formData.mode === 'existing' && (
        <FocusedSheetSection title="Select Property">
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
                No available properties. Switch to {'"'}New Property{'"'} to add one.
              </Text>
            </View>
          )}
        </FocusedSheetSection>
      )}

      {/* New Property Fields */}
      {formData.mode === 'new' && (
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
      )}

      {/* Acquisition Details */}
      <FocusedSheetSection title="Acquisition Details">
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
      </FocusedSheetSection>
    </FocusedSheet>
  );
}
