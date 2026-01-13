// src/routes/SettingsNavigator.tsx
// Settings stack navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from './types';

// Import all settings screens
import {
  SettingsScreen,
  ProfileScreen,
  ChangePasswordScreen,
  AppearanceScreen,
  NotificationsSettingsScreen,
  SecurityScreen,
  AboutScreen,
} from '@/features/settings/screens';

// Zone D: Analytics
import { AnalyticsScreen } from '@/features/analytics';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
    </Stack.Navigator>
  );
}
