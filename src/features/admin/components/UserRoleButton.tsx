// src/features/admin/components/UserRoleButton.tsx
// Role selection button for user management

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface UserRoleButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled: boolean;
}

export function UserRoleButton({ label, active, onPress, disabled }: UserRoleButtonProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className={`flex-1 py-3 rounded-lg items-center ${disabled ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: active ? colors.primary : colors.card,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
      }}
      onPress={onPress}
      disabled={disabled || active}
    >
      <Text className="font-medium" style={{ color: active ? colors.primaryForeground : colors.foreground }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
