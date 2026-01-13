// src/features/auth/guards/AdminGuard.tsx
// Guard component that requires admin role

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectOnFail?: boolean;
}

/**
 * Guard that requires user to have admin role
 * Shows access denied or redirects if not admin
 */
export function AdminGuard({
  children,
  fallback,
  redirectOnFail = false,
}: AdminGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { canViewAdminPanel } = usePermissions();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    } else if (!isLoading && isAuthenticated && !canViewAdminPanel && redirectOnFail) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    }
  }, [isAuthenticated, isLoading, canViewAdminPanel, redirectOnFail, navigation]);

  // Still loading
  if (isLoading) {
    return fallback ?? null;
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return fallback ?? null;
  }

  // Not admin - show access denied
  if (!canViewAdminPanel) {
    return fallback ?? (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <ShieldAlert size={64} color="#ef4444" />
        <Text className="text-xl font-semibold text-foreground mt-4">
          Access Denied
        </Text>
        <Text className="text-muted-foreground text-center mt-2">
          You don't have permission to access this area.
          {'\n'}Please contact an administrator if you believe this is an error.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
