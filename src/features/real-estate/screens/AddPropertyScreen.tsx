/**
 * AddPropertyScreen
 *
 * Screen for creating a new property.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PropertyForm } from '../components/PropertyForm';
import { usePropertyMutations } from '../hooks/useProperties';
import { Property } from '../types';

type RootStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { id: string };
  AddProperty: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProperty'>;

export function AddPropertyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { createProperty, isLoading, error } = usePropertyMutations();

  const handleSubmit = useCallback(async (data: Partial<Property>) => {
    const newProperty = await createProperty(data);

    if (newProperty) {
      Alert.alert(
        'Success',
        'Property created successfully!',
        [
          {
            text: 'View Property',
            onPress: () => navigation.replace('PropertyDetail', { id: newProperty.id }),
          },
          {
            text: 'Add Another',
            style: 'cancel',
          },
        ]
      );
    } else if (error) {
      Alert.alert('Error', error.message || 'Failed to create property. Please try again.');
    }
  }, [createProperty, error, navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-background border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Add Property</Text>
        <Text className="text-muted-foreground mt-1">
          Enter the details for your new property
        </Text>
      </View>

      <PropertyForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        submitLabel="Create Property"
      />
    </View>
  );
}
