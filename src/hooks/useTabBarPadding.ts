// src/hooks/useTabBarPadding.ts
// Centralized hook for tab bar padding calculations
// Ensures consistent spacing across all screens with floating tab bar
//
// DOCUMENTATION: See docs/DESIGN_SYSTEM.md#tab-bar-spacing--bottom-padding
// TROUBLESHOOTING: See docs/TROUBLESHOOTING.md#bottom-padding-with-floating-tab-bar

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SAFE_PADDING, TAB_BAR_HEIGHT } from '@/components/ui';

/**
 * Hook that provides consistent bottom padding values for screens with NativeTabs.
 *
 * WHY THIS EXISTS:
 * With NativeTabs (native iOS UITabBarController), iOS automatically handles scroll view
 * content insets for the tab bar and safe area. This hook provides minimal breathing room
 * for visual consistency, plus values for absolutely positioned elements.
 *
 * IMPORTANT: With NativeTabs, we do NOT add insets.bottom to content padding because
 * iOS handles this automatically. Adding it would cause double-padding.
 *
 * CURRENT VALUES:
 * - TAB_BAR_SAFE_PADDING: 16px (minimal visual breathing room)
 * - TAB_BAR_HEIGHT: 49px (native iOS tab bar height, for reference)
 *
 * RETURNS:
 * - contentPadding: Use for ScrollView/FlatList paddingBottom (16px, iOS handles tab bar)
 * - buttonBottom: Use for absolutely positioned buttons (49px + device insets)
 * - tabBarHeight: Native tab bar height (49px)
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
    /** Bottom padding for ScrollView/FlatList content (16px breathing room, iOS handles tab bar) */
    contentPadding: TAB_BAR_SAFE_PADDING,

    /** Bottom position for absolutely positioned buttons (49px tab bar + device insets) */
    buttonBottom: TAB_BAR_HEIGHT + insets.bottom,

    /** Native tab bar height constant (49px) */
    tabBarHeight: TAB_BAR_HEIGHT,

    /** Device-specific bottom safe area inset (0px on older devices, ~34px on iPhone X+) */
    safeAreaBottom: insets.bottom,
  };
}
