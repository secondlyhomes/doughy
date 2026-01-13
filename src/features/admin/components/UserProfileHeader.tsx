// src/features/admin/components/UserProfileHeader.tsx
// Profile header for user detail screen

import React from 'react';
import { View, Text } from 'react-native';
import { User } from 'lucide-react-native';

interface UserProfileHeaderProps {
  name: string | null;
  email: string;
  isDeleted: boolean;
}

export function UserProfileHeader({ name, email, isDeleted }: UserProfileHeaderProps) {
  return (
    <View className="items-center py-8 border-b border-border">
      <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center">
        <User size={48} color="#3b82f6" />
      </View>
      <Text className="text-xl font-semibold text-foreground mt-4">
        {name || 'No Name'}
      </Text>
      <Text className="text-muted-foreground">{email}</Text>
      <View className="flex-row items-center mt-2">
        <View
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: isDeleted ? '#ef4444' : '#22c55e' }}
        />
        <Text className="text-sm text-muted-foreground">
          {isDeleted ? 'Deleted' : 'Active'}
        </Text>
      </View>
    </View>
  );
}
