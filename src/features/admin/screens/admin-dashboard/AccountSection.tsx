// src/features/admin/screens/admin-dashboard/AccountSection.tsx
// Account actions section

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { LoadingSpinner } from '@/components/ui';
import type { AccountSectionProps } from './types';

export function AccountSection({ isSigningOut, onSignOut }: AccountSectionProps) {
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
        Account
      </Text>
      <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
        <TouchableOpacity
          className="flex-row items-center p-4"
          onPress={onSignOut}
          disabled={isSigningOut}
        >
          <LogOut size={20} color={colors.destructive} />
          <Text className="flex-1 ml-3 font-medium" style={{ color: colors.destructive }}>
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </Text>
          {isSigningOut && <LoadingSpinner size="small" color={colors.destructive} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
