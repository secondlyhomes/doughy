// src/features/auth/guards/EmailVerifiedGuard.tsx
// Guard component that requires email verification

import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';

interface EmailVerifiedGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Guard that requires user to have verified email
 * Redirects to verify email screen if not verified
 */
export function EmailVerifiedGuard({ children, fallback }: EmailVerifiedGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isEmailVerified } = usePermissions();
  const colors = useThemeColors();

  // Still loading
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

  // Not verified - redirect to verify email
  if (!isEmailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return <>{children}</>;
}
