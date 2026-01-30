// src/components/ui/HeaderBackButton.tsx
// Consistent back button with safe navigation fallback for native headers

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { SPACING, PRESS_OPACITY, DEFAULT_HIT_SLOP } from '@/constants/design-tokens';

export interface HeaderBackButtonProps {
  /** Fallback route when back navigation isn't available (for deep linking scenarios) */
  fallbackRoute?: string;
  /** Custom icon size (default: 24) */
  iconSize?: number;
  /** Custom icon color (overrides theme color) */
  iconColor?: string;
  /** Custom press handler (overrides default navigation) */
  onPress?: () => void;
}

export function HeaderBackButton({
  fallbackRoute,
  iconSize = 24,
  iconColor,
  onPress,
}: HeaderBackButtonProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute as never);
    } else {
      // Default fallback
      router.replace('/(tabs)' as never);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      hitSlop={DEFAULT_HIT_SLOP}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <ArrowLeft size={iconSize} color={iconColor || colors.foreground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: SPACING.sm,
  },
});
