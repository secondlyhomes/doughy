/**
 * EditPropertyScreen
 *
 * Screen for editing an existing property using the multi-step form wizard.
 */

import React, { useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, LoadingSpinner } from '@/components/ui';
import { PropertyFormWizard } from '../components/PropertyFormWizard';
import { useProperty, usePropertyMutations } from '../hooks/useProperties';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Property } from '../types';

export function EditPropertyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;
  const colors = useThemeColors();

  const { property, isLoading: isLoadingProperty, error: loadError } = useProperty(propertyId);
  const { updateProperty, isLoading: isUpdating, error: updateError } = usePropertyMutations();

  const handleSubmit = useCallback(async (data: Partial<Property>) => {
    const updatedProperty = await updateProperty(propertyId, data);

    if (updatedProperty) {
      Alert.alert(
        'Property Updated!',
        'Your changes have been saved.',
        [
          {
            text: 'View Property',
            onPress: () => router.replace(`/(tabs)/properties/${propertyId}`),
          },
        ]
      );
    } else if (updateError) {
      Alert.alert('Error', updateError.message || 'Failed to update property. Please try again.');
    }
  }, [updateProperty, propertyId, updateError, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoadingProperty) {
    return (
      <ThemedSafeAreaView className="flex-1">
        <LoadingSpinner fullScreen text="Loading property..." />
      </ThemedSafeAreaView>
    );
  }

  if (loadError || !property) {
    return (
      <View className="flex-1 items-center justify-center px-4" style={{ backgroundColor: colors.background }}>
        <Text className="text-center mb-4" style={{ color: colors.destructive }}>
          {loadError?.message || 'Property not found'}
        </Text>
      </View>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <ScreenHeader
        title="Edit Property"
        subtitle={property.address || 'Unknown address'}
        bordered
      />

      <PropertyFormWizard
        initialData={property}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isUpdating}
        submitLabel="Save Changes"
      />
    </ThemedSafeAreaView>
  );
}
