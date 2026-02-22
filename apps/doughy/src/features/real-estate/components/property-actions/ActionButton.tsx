// src/features/real-estate/components/property-actions/ActionButton.tsx
// Reusable action button for property actions sheet

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

export interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showArrow?: boolean;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function ActionButton({
  icon,
  label,
  onPress,
  destructive,
  showArrow,
  disabled,
  isProcessing,
}: ActionButtonProps) {
  const colors = useThemeColors();
  const textColor = destructive ? colors.destructive : colors.foreground;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-between py-4 px-2 border-b ${disabled ? 'opacity-50' : ''}`}
      style={{ borderColor: colors.border }}
    >
      <View className="flex-row items-center flex-1">
        {icon}
        <Text className="font-medium ml-3" style={{ color: textColor }}>
          {label}
        </Text>
      </View>
      {isProcessing ? (
        <ActivityIndicator size="small" />
      ) : showArrow ? (
        <ChevronRight size={20} color={colors.mutedForeground} />
      ) : null}
    </TouchableOpacity>
  );
}
