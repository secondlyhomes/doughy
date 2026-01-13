/**
 * EditPropertyScreen
 *
 * Screen for editing an existing property using the multi-step form wizard.
 */

import React, { useCallback } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PropertyFormWizard } from '../components/PropertyFormWizard';
import { useProperty, usePropertyMutations } from '../hooks/useProperties';
import { Property } from '../types';

export function EditPropertyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;

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
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-4">Loading property...</Text>
      </View>
    );
  }

  if (loadError || !property) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Text className="text-destructive text-center mb-4">
          {loadError?.message || 'Property not found'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-background border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Edit Property</Text>
        <Text className="text-muted-foreground mt-0.5" numberOfLines={1}>
          {property.address || 'Unknown address'}
        </Text>
      </View>

      <PropertyFormWizard
        initialData={property}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isUpdating}
        submitLabel="Save Changes"
      />
    </SafeAreaView>
  );
}
