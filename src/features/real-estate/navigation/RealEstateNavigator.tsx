/**
 * RealEstateNavigator
 *
 * Stack navigator for real estate feature screens.
 * Import this into your main navigation setup.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  PropertyListScreen,
  PropertyDetailScreen,
  AddPropertyScreen,
  EditPropertyScreen,
  PropertyMapScreen,
} from '../screens';

// Define the param list for type safety
export type RealEstateStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { id: string };
  AddProperty: undefined;
  EditProperty: { id: string };
  PropertyMap: undefined;
};

const Stack = createNativeStackNavigator<RealEstateStackParamList>();

export function RealEstateNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="PropertyList"
      screenOptions={{
        headerShown: false, // We use custom headers in screens
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="PropertyList"
        component={PropertyListScreen}
        options={{
          title: 'Properties',
        }}
      />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{
          title: 'Property Details',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="AddProperty"
        component={AddPropertyScreen}
        options={{
          title: 'Add Property',
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EditProperty"
        component={EditPropertyScreen}
        options={{
          title: 'Edit Property',
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="PropertyMap"
        component={PropertyMapScreen}
        options={{
          title: 'Property Map',
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
}
