// src/hooks/useNativeHeader.tsx
// Hook to reduce boilerplate for native Stack headers across detail screens
// Follows the pattern documented in docs/ui-conventions.md

import { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

export interface UseNativeHeaderOptions {
  /** Main title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Fallback route when back navigation isn't available (for deep linking scenarios) */
  fallbackRoute?: string;
  /** Custom right action element */
  rightAction?: React.ReactNode;
  /** Custom left action element (overrides default back button) */
  leftAction?: React.ReactNode;
  /** Hide back button entirely */
  hideBackButton?: boolean;
  /** Custom back button press handler */
  onBack?: () => void;
  /** Enable glass/blur effect on the header (iOS native blur). Default: true */
  glass?: boolean;
}

export interface UseNativeHeaderReturn {
  /** Memoized header options to pass to Stack.Screen */
  headerOptions: NativeStackNavigationOptions;
  /** Handler for back navigation */
  handleBack: () => void;
  /** Safe area insets */
  insets: ReturnType<typeof useSafeAreaInsets>;
}

/**
 * Hook for creating consistent native Stack headers across detail screens.
 *
 * @example
 * ```tsx
 * const { headerOptions } = useNativeHeader({
 *   title: "Property Details",
 *   subtitle: "123 Main St",
 *   fallbackRoute: "/(tabs)/rental-properties",
 *   rightAction: (
 *     <TouchableOpacity onPress={() => setShowMenu(true)}>
 *       <MoreVertical size={24} color={colors.foreground} />
 *     </TouchableOpacity>
 *   ),
 * });
 *
 * return (
 *   <>
 *     <Stack.Screen options={headerOptions} />
 *     <ThemedSafeAreaView edges={[]}>
 *       // content
 *     </ThemedSafeAreaView>
 *   </>
 * );
 * ```
 */
export function useNativeHeader({
  title,
  subtitle,
  fallbackRoute,
  rightAction,
  leftAction,
  hideBackButton = false,
  onBack,
  glass = true,
}: UseNativeHeaderOptions): UseNativeHeaderReturn {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Safe back navigation with fallback for deep-linking scenarios
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute as never);
    } else {
      // Default fallback if none specified
      router.replace('/(tabs)' as never);
    }
  }, [router, fallbackRoute, onBack]);

  // Memoize header options to prevent infinite re-render loops
  const headerOptions = useMemo((): NativeStackNavigationOptions => {
    // iOS glass header: transparent background + native blur effect
    const shouldUseGlass = glass && Platform.OS === 'ios';

    return {
    headerShown: true,
    headerStyle: { backgroundColor: shouldUseGlass ? 'transparent' : colors.background },
    headerShadowVisible: false,
    headerStatusBarHeight: insets.top,
    ...(shouldUseGlass ? {
      headerTransparent: true,
      headerBlurEffect: 'systemChromeMaterial',
    } : {}),
    headerTitle: () => (
      <View style={styles.titleContainer}>
        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
    ),
    headerLeft: leftAction
      ? () => leftAction
      : hideBackButton
      ? undefined
      : () => (
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backButton,
              {
                backgroundColor: withOpacity(colors.muted, 'medium'),
              },
            ]}
          >
            <ChevronLeft size={ICON_SIZES.xl} color={colors.foreground} />
          </TouchableOpacity>
        ),
    headerRight: rightAction ? () => rightAction : undefined,
    };
  }, [colors, insets.top, title, subtitle, handleBack, rightAction, leftAction, hideBackButton, glass]);

  return {
    headerOptions,
    handleBack,
    insets,
  };
}

const BACK_BUTTON_SIZE = 36;

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: FONT_SIZES.base,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
