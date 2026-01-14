// src/components/ui/ScreenHeader.tsx
// Reusable screen header component for consistent layout across screens

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export interface ScreenHeaderProps {
  /** Main title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Show back button (auto-navigates back) */
  backButton?: boolean;
  /** Custom back handler (overrides default router.back) */
  onBack?: () => void;
  /** Right-side action element(s) */
  rightAction?: React.ReactNode;
  /** Optional className for container */
  className?: string;
  /** Use border bottom separator */
  bordered?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  backButton = false,
  onBack,
  rightAction,
  className,
  bordered = false,
}: ScreenHeaderProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      className={cn(
        'px-4 pt-4 pb-2 flex-row items-center justify-between',
        bordered && 'border-b border-border',
        className
      )}
    >
      <View className="flex-row items-center flex-1">
        {backButton && (
          <TouchableOpacity
            onPress={handleBack}
            className="mr-3 p-1"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
          {subtitle && (
            <Text className="text-muted-foreground">{subtitle}</Text>
          )}
        </View>
      </View>
      {rightAction && <View className="ml-3">{rightAction}</View>}
    </View>
  );
}
