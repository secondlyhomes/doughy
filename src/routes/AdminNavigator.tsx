// src/routes/AdminNavigator.tsx
// Admin stack navigator with role protection

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';
import { AdminGuard } from '@/features/auth/guards/AdminGuard';

// Import admin screens
import { AdminDashboardScreen } from '@/features/admin/screens/AdminDashboardScreen';
import { UserManagementScreen } from '@/features/admin/screens/UserManagementScreen';
import { UserDetailScreen } from '@/features/admin/screens/UserDetailScreen';
import { IntegrationsScreen } from '@/features/admin/screens/IntegrationsScreen';
import { SystemLogsScreen } from '@/features/admin/screens/SystemLogsScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminLoadingFallback() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}

export function AdminNavigator() {
  return (
    <AdminGuard redirectOnFail fallback={<AdminLoadingFallback />}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminUsers" component={UserManagementScreen} />
        <Stack.Screen name="UserDetail" component={UserDetailScreen} />
        <Stack.Screen name="AdminIntegrations" component={IntegrationsScreen} />
        <Stack.Screen name="AdminLogs" component={SystemLogsScreen} />
      </Stack.Navigator>
    </AdminGuard>
  );
}
