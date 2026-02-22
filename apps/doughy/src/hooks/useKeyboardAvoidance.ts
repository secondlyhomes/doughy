// src/hooks/useKeyboardAvoidance.ts
// Centralized keyboard avoidance configuration for consistent behavior across the app

import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '@/components/ui';

/**
 * Configuration options for keyboard avoidance
 */
export interface KeyboardAvoidanceConfig {
  /** Screen has a visible tab bar (adds TAB_BAR_HEIGHT to offset) */
  hasTabBar?: boolean;
  /** Screen has a navigation header (adds 44pt to offset - standard iOS nav bar) */
  hasNavigationHeader?: boolean;
  /** Custom additional offset in points */
  customOffset?: number;
}

/**
 * Return type for the keyboard avoidance hook
 */
export interface KeyboardAvoidanceProps {
  /** KeyboardAvoidingView behavior prop - 'padding' for iOS, 'height' for Android */
  behavior: 'padding' | 'height';
  /** Vertical offset to account for navigation bars, tab bars, and safe areas */
  keyboardVerticalOffset: number;
  /** ScrollView prop to handle taps while keyboard is visible */
  keyboardShouldPersistTaps: 'handled';
}

/**
 * Standard navigation bar height on iOS (44pt)
 */
const NAVIGATION_BAR_HEIGHT = 44;

/**
 * Hook that provides consistent keyboard handling configuration
 *
 * @param config - Optional configuration for the screen context
 * @returns Props to spread on KeyboardAvoidingView and ScrollView
 *
 * @example
 * // Screen with tab bar
 * const keyboardProps = useKeyboardAvoidance({ hasTabBar: true });
 *
 * @example
 * // Screen with navigation header only
 * const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: true });
 *
 * @example
 * // Bottom sheet (no tab bar, no nav header, custom offset)
 * const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: false, customOffset: 20 });
 */
export function useKeyboardAvoidance(config: KeyboardAvoidanceConfig = {}): KeyboardAvoidanceProps {
  const insets = useSafeAreaInsets();
  const {
    hasTabBar = false,
    hasNavigationHeader = true,
    customOffset = 0,
  } = config;

  // Calculate offset based on screen context
  // Only apply offsets on iOS - Android handles this differently
  let offset = customOffset;

  if (Platform.OS === 'ios') {
    if (hasTabBar) {
      offset += TAB_BAR_HEIGHT;
      // Account for bottom safe area (home indicator) - only needed with tab bar
      offset += insets.bottom;
    }
    if (hasNavigationHeader) {
      offset += NAVIGATION_BAR_HEIGHT;
    }
  }

  return {
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset: Platform.OS === 'ios' ? offset : 0,
    keyboardShouldPersistTaps: 'handled',
  };
}

/**
 * Get keyboard avoidance props without using a hook (for class components or static contexts)
 * Note: This doesn't include safe area insets - use the hook when possible
 *
 * @param config - Optional configuration
 * @returns Static keyboard avoidance props
 */
export function getKeyboardAvoidanceProps(config: KeyboardAvoidanceConfig = {}): Omit<KeyboardAvoidanceProps, 'keyboardVerticalOffset'> & { keyboardVerticalOffset: number } {
  const {
    hasTabBar = false,
    hasNavigationHeader = true,
    customOffset = 0,
  } = config;

  let offset = customOffset;

  if (Platform.OS === 'ios') {
    if (hasTabBar) {
      offset += TAB_BAR_HEIGHT;
      // Add a reasonable default for bottom safe area (34pt for modern iPhones) - only needed with tab bar
      offset += 34;
    }
    if (hasNavigationHeader) {
      offset += NAVIGATION_BAR_HEIGHT;
    }
  }

  return {
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset: Platform.OS === 'ios' ? offset : 0,
    keyboardShouldPersistTaps: 'handled',
  };
}
