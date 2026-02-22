// src/features/settings/screens/settings-screen/ProfileHeader.tsx
// Profile card shown at the top of the Settings screen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getInitials } from './settings-screen-helpers';

export function ProfileHeader() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, profile } = useAuth();

  return (
    <View className="px-4 py-2">
      <TouchableOpacity
        className="flex-row items-center rounded-lg p-4"
        style={{ backgroundColor: colors.card }}
        onPress={() => router.push('/(tabs)/settings/profile')}
      >
        {/* Avatar */}
        <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
          <Text className="text-xl font-bold" style={{ color: colors.primaryForeground }}>
            {getInitials(profile?.full_name, user?.email)}
          </Text>
        </View>

        {/* User Info */}
        <View className="flex-1 ml-4">
          <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
            {profile?.full_name || 'User'}
          </Text>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>{user?.email}</Text>
          <Text className="text-xs capitalize mt-1" style={{ color: colors.primary }}>
            {profile?.role || 'user'} account
          </Text>
        </View>

        <ChevronRight size={20} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}
