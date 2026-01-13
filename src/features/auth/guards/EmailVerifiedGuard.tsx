// src/features/auth/guards/EmailVerifiedGuard.tsx
// Guard component that requires email verification

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

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
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    } else if (!isLoading && isAuthenticated && !isEmailVerified) {
      // Navigate to verify email screen
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'Auth', params: { screen: 'VerifyEmail' } },
          ],
        })
      );
    }
  }, [isAuthenticated, isLoading, isEmailVerified, navigation]);

  // Still loading
  if (isLoading) {
    return fallback ?? (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Not authenticated or not verified - will redirect
  if (!isAuthenticated || !isEmailVerified) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
