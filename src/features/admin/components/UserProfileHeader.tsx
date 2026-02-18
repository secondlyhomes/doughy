// src/features/admin/components/UserProfileHeader.tsx
// Profile header for user detail screen

import React from 'react';
import { View, Text } from 'react-native';
import { User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

interface UserProfileHeaderProps {
  name: string | null;
  email: string;
  isDeleted: boolean;
}

export function UserProfileHeader({ name, email, isDeleted }: UserProfileHeaderProps) {
  const colors = useThemeColors();
  return (
    <View className="items-center py-8 border-b" style={{ borderColor: colors.border }}>
      <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
        <User size={48} color={colors.info} />
      </View>
      <Text className="text-xl font-semibold mt-4" style={{ color: colors.foreground }}>
        {name || 'No Name'}
      </Text>
      <Text style={{ color: colors.mutedForeground }}>{email}</Text>
      <View className="flex-row items-center mt-2">
        <View
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: isDeleted ? colors.destructive : colors.success }}
        />
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>
          {isDeleted ? 'Deleted' : 'Active'}
        </Text>
      </View>
    </View>
  );
}
