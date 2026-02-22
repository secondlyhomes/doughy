// src/features/auth/guards/AdminGuard.tsx
// Guard component that requires admin role

import React from 'react';
import { View, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useThemeColors } from '@/contexts/ThemeContext';

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
  const colors = useThemeColors();

  // Still loading
  if (isLoading) {
    return fallback ?? null;
  }

  // Not authenticated - redirect to sign in
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Not admin - redirect to main if redirectOnFail, otherwise show access denied
  if (!canViewAdminPanel) {
    if (redirectOnFail) {
      return <Redirect href="/(tabs)" />;
    }
    return fallback ?? (
      <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: colors.background }}>
        <ShieldAlert size={64} color={colors.destructive} />
        <Text className="text-xl font-semibold mt-4" style={{ color: colors.foreground }}>
          Access Denied
        </Text>
        <Text className="text-center mt-2" style={{ color: colors.mutedForeground }}>
          You don{'\''}t have permission to access this area.
          {'\n'}Please contact an administrator if you believe this is an error.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
