// src/features/auth/guards/AuthGuard.tsx
// Guard component that requires authentication

import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';

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
  const colors = useThemeColors();

  // Show loading state
  if (isLoading) {
    return fallback ?? (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <LoadingSpinner fullScreen />
      </View>
    );
  }

  // Not authenticated - redirect to sign in
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <>{children}</>;
}
