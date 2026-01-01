// src/routes/RootNavigator.tsx
// Root navigation container for the app
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// Zone B: Auth Provider and Hook (COMPLETE)
import { AuthProvider } from '@/features/auth/context/AuthProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootStack() {
  // Zone B: Using real auth hook
  // const { isAuthenticated, isLoading } = useAuth();
  // TEMP: Bypass auth for testing Zone C
  const isAuthenticated = true;
  const isLoading = false;

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {isAuthenticated ? (
        // Authenticated routes
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        // Auth routes
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <RootStack />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
