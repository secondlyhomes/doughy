// src/hooks/useTabBarPadding.ts
// Centralized hook for tab bar padding calculations
// Ensures consistent spacing across all screens with floating tab bar
//
// DOCUMENTATION: See docs/DESIGN_SYSTEM.md#tab-bar-spacing--bottom-padding
// TROUBLESHOOTING: See docs/TROUBLESHOOTING.md#bottom-padding-with-floating-tab-bar

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SAFE_PADDING, TAB_BAR_HEIGHT } from '@/components/ui';

/**
 * Hook that provides consistent bottom padding values for screens with floating tab bar.
 *
 * WHY THIS EXISTS:
 * The floating tab bar is absolutely positioned and uses device safe area insets to position
 * itself above the home indicator. Content padding must match this to prevent content from
 * going under the tab bar on devices with home indicators (iPhone X+).
 *
 * PATTERN:
 * - Old devices (iPhone 8): TAB_BAR_SAFE_PADDING (100px) + 0px safe area = 100px
 * - New devices (iPhone 14 Pro): TAB_BAR_SAFE_PADDING (100px) + 34px safe area = 134px
 *
 * RETURNS:
 * - contentPadding: Use for ScrollView/FlatList contentContainerStyle paddingBottom (100px + device insets)
 * - buttonBottom: Use for absolutely positioned buttons/wizard bars (80px + device insets)
 * - tabBarHeight: Raw tab bar height constant (80px)
 * - safeAreaBottom: Device-specific safe area inset (0px on older devices, ~34px on iPhone X+)
 *
 * @example For ScrollView/FlatList content
 * ```tsx
 * const { contentPadding } = useTabBarPadding();
 *
 * <ScrollView contentContainerStyle={{ paddingBottom: contentPadding }}>
 *   {content}
 * </ScrollView>
 * ```
 *
 * @example For absolutely positioned buttons
 * ```tsx
 * const { buttonBottom } = useTabBarPadding();
 *
 * <View style={{ position: 'absolute', bottom: buttonBottom, left: 0, right: 0 }}>
 *   {wizardButtons}
 * </View>
 * ```
 *
 * @see docs/DESIGN_SYSTEM.md#tab-bar-spacing--bottom-padding - Full pattern guide
 * @see docs/TROUBLESHOOTING.md#bottom-padding-with-floating-tab-bar - Troubleshooting common issues
 */
export function useTabBarPadding() {
  const insets = useSafeAreaInsets();

  return {
    /** Bottom padding for ScrollView/FlatList content (100px + device insets) */
    contentPadding: TAB_BAR_SAFE_PADDING + insets.bottom,

    /** Bottom position for absolutely positioned buttons (80px tab bar + device insets) */
    buttonBottom: TAB_BAR_HEIGHT + insets.bottom,

    /** Raw tab bar height constant (80px) */
    tabBarHeight: TAB_BAR_HEIGHT,

    /** Device-specific bottom safe area inset (0px on older devices, ~34px on iPhone X+) */
    safeAreaBottom: insets.bottom,
  };
}
