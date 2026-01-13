// src/features/admin/components/UserInfoRow.tsx
// Reusable info row for user details

import React from 'react';
import { View, Text } from 'react-native';

interface UserInfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hideBorder?: boolean;
}

export function UserInfoRow({ icon, label, value, hideBorder }: UserInfoRowProps) {
  return (
    <View className={`flex-row items-center p-4 ${!hideBorder ? 'border-b border-border' : ''}`}>
      {icon}
      <Text className="text-muted-foreground ml-3 w-28">{label}</Text>
      <Text className="flex-1 text-foreground">{value}</Text>
    </View>
  );
}
