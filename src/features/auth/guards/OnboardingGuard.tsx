// src/features/auth/guards/OnboardingGuard.tsx
// Guard component that requires completed onboarding

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

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
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    } else if (!isLoading && isAuthenticated && !isOnboardingComplete) {
      // Navigate to onboarding survey
      // Note: Email verification should happen first
      if (!isEmailVerified) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'Auth', params: { screen: 'VerifyEmail' } },
            ],
          })
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'Auth', params: { screen: 'OnboardingSurvey' } },
            ],
          })
        );
      }
    }
  }, [isAuthenticated, isLoading, isOnboardingComplete, isEmailVerified, navigation]);

  // Still loading
  if (isLoading) {
    return fallback ?? (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Not authenticated or onboarding incomplete - will redirect
  if (!isAuthenticated || !isOnboardingComplete) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
