// src/features/auth/guards/OnboardingGuard.tsx
// Guard component that requires completed onboarding

import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Guard that requires user to have completed onboarding
 * Redirects to onboarding survey if not completed
 */
export function OnboardingGuard({ children, fallback }: OnboardingGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isOnboardingComplete, isEmailVerified } = usePermissions();
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

  // Email verification should happen first
  if (!isEmailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  // Onboarding not complete - redirect to onboarding survey
  if (!isOnboardingComplete) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <>{children}</>;
}
