// src/features/admin/components/UserRoleButton.tsx
// Role selection button for user management

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface UserRoleButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled: boolean;
}

export function UserRoleButton({ label, active, onPress, disabled }: UserRoleButtonProps) {
  return (
    <TouchableOpacity
      className={`flex-1 py-3 rounded-lg items-center ${active ? 'bg-primary' : 'bg-card border border-border'} ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || active}
    >
      <Text className={`font-medium ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
