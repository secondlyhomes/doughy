// src/features/portfolio/components/AddToPortfolioSheet.tsx
// Focused sheet for manually adding properties to portfolio
// Uses FocusedSheet for mode toggle + complex form that needs focus

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  Alert,
} from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FocusedSheet, FocusedSheetSection } from '@/components/ui';
import { useAddToPortfolioForm } from '../hooks/useAddToPortfolioForm';
import { useAvailableProperties } from '../hooks/useAvailableProperties';
import { PropertySelector } from './PropertySelector';
import { PortfolioModeToggle } from './PortfolioModeToggle';
import { NewPropertyFields } from './NewPropertyFields';
import { AcquisitionDetailsSection } from './AcquisitionDetailsSection';
import type { AddToPortfolioSheetProps } from './add-to-portfolio-types';

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
      <PortfolioModeToggle mode={formData.mode} onSetMode={setMode} />

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
        <NewPropertyFields
          formData={formData}
          errors={errors}
          updateField={updateField}
        />
      )}

      {/* Acquisition Details */}
      <AcquisitionDetailsSection
        formData={formData}
        errors={errors}
        updateField={updateField}
        onDateChange={handleDateChange}
      />
    </FocusedSheet>
  );
}
