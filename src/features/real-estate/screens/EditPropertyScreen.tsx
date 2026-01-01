/**
 * EditPropertyScreen
 *
 * Screen for editing an existing property.
 */

import React, { useCallback } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PropertyForm } from '../components/PropertyForm';
import { useProperty, usePropertyMutations } from '../hooks/useProperties';
import { Property } from '../types';

type RootStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { id: string };
  EditProperty: { id: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProperty'>;
type EditPropertyRouteProp = RouteProp<RootStackParamList, 'EditProperty'>;

export function EditPropertyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditPropertyRouteProp>();
  const { id: propertyId } = route.params;

  const { property, isLoading: isLoadingProperty, error: loadError } = useProperty(propertyId);
  const { updateProperty, isLoading: isUpdating, error: updateError } = usePropertyMutations();

  const handleSubmit = useCallback(async (data: Partial<Property>) => {
    const updatedProperty = await updateProperty(propertyId, data);

    if (updatedProperty) {
      Alert.alert(
        'Success',
        'Property updated successfully!',
        [
          {
            text: 'View Property',
            onPress: () => navigation.replace('PropertyDetail', { id: propertyId }),
          },
        ]
      );
    } else if (updateError) {
      Alert.alert('Error', updateError.message || 'Failed to update property. Please try again.');
    }
  }, [updateProperty, propertyId, updateError, navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-background border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Edit Property</Text>
        <Text className="text-muted-foreground mt-1" numberOfLines={1}>
          {property.address || 'Unknown address'}
        </Text>
      </View>

      <PropertyForm
        initialData={property}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isUpdating}
        submitLabel="Save Changes"
      />
    </View>
  );
}
