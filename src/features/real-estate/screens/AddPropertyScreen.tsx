/**
 * AddPropertyScreen
 *
 * Screen for creating a new property using the multi-step form wizard.
 */

import React, { useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PropertyFormWizard } from '../components/PropertyFormWizard';
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
        'Property Created!',
        'Your property has been added successfully.',
        [
          {
            text: 'View Property',
            onPress: () => navigation.replace('PropertyDetail', { id: newProperty.id }),
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
  }, [createProperty, error, navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-background border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Add Property</Text>
        <Text className="text-muted-foreground mt-0.5">
          Add a new property to your portfolio
        </Text>
      </View>

      <PropertyFormWizard
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        submitLabel="Create Property"
      />
    </SafeAreaView>
  );
}
