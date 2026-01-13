// src/features/auth/guards/AuthGuard.tsx
// Guard component that requires authentication

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Guard that requires user to be authenticated
 * Redirects to login if not authenticated
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Reset navigation to auth stack
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    }
  }, [isAuthenticated, isLoading, navigation]);

  // Show loading state
  if (isLoading) {
    return fallback ?? (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
