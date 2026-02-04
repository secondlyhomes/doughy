// src/features/rental-properties/screens/AddRentalPropertyScreen.tsx
// Add Rental Property Screen - Create new rental property
// Follows AddLeadScreen pattern with form validation

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks';
import { useErrorHandler } from '@/contexts/ErrorContext';

import { useCreateRentalProperty } from '../hooks/useRentalProperties';
import { RentalPropertyForm } from '../components/RentalPropertyForm';
import type { RentalPropertyFormData } from '../types/form';
import type { RentalProperty } from '../types';

export function AddRentalPropertyScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: true });
  const createProperty = useCreateRentalProperty();
  const { showError } = useErrorHandler();

  const handleSubmit = useCallback(async (formData: RentalPropertyFormData) => {
    // Transform form data to match the RentalProperty type
    // Helper to safely parse numbers, returning null for invalid/empty values
    const safeNumber = (value: string | number | undefined | null): number | null => {
      if (value === undefined || value === null || value === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    const propertyData: Partial<RentalProperty> = {
      name: formData.name,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip || '',
      property_type: formData.property_type,
      bedrooms: safeNumber(formData.bedrooms) ?? 0,
      bathrooms: safeNumber(formData.bathrooms) ?? 0,
      square_feet: safeNumber(formData.square_feet),
      rental_type: formData.rental_type,
      base_rate: safeNumber(formData.base_rate) ?? 0,
      rate_type: formData.rate_type,
      cleaning_fee: safeNumber(formData.cleaning_fee),
      security_deposit: safeNumber(formData.security_deposit),
      amenities: formData.amenities,
      status: formData.status,
    };

    try {
      await createProperty.mutateAsync(propertyData);
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create property';
      showError(message, { retryable: true });
      throw error;
    }
  }, [createProperty, router, showError]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
          Add Rental Property
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
      >
        <RentalPropertyForm
          onSubmit={handleSubmit}
          isSubmitting={createProperty.isPending}
          submitLabel="Create Property"
        />
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

export default AddRentalPropertyScreen;
