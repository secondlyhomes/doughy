/**
 * AddPropertyScreen
 *
 * Screen for creating a new property using the multi-step form wizard.
 */

import React, { useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader } from '@/components/ui';
import { PropertyFormWizard } from '../components/PropertyFormWizard';
import { usePropertyMutations } from '../hooks/useProperties';
import { Property } from '../types';

export function AddPropertyScreen() {
  const router = useRouter();
  const { createProperty, isLoading, error } = usePropertyMutations();

  const handleSubmit = useCallback(async (data: Partial<Property>) => {
    const newProperty = await createProperty(data);

    if (newProperty) {
      Alert.alert(
        'Property Created!',
        'Your property has been added successfully.',
        [
          {
            text: 'View Property',
            onPress: () => router.replace(`/(tabs)/properties/${newProperty.id}`),
          },
          {
            text: 'Add Another',
            style: 'cancel',
            onPress: () => {
              // Stay on the screen - the wizard will reset
            },
          },
        ]
      );
    } else if (error) {
      Alert.alert('Error', error.message || 'Failed to create property. Please try again.');
    }
  }, [createProperty, error, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <ScreenHeader
        title="Add Property"
        subtitle="Add a new property to your portfolio"
        bordered
      />

      <PropertyFormWizard
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        submitLabel="Create Property"
      />
    </ThemedSafeAreaView>
  );
}
