/**
 * Centralized haptic feedback utility
 *
 * Provides consistent haptic feedback across the app with fallback handling
 * for platforms where haptics aren't available.
 *
 * @example
 * import { haptic } from '@/lib/haptics';
 *
 * // Light tap for selections, toggles
 * haptic.light();
 *
 * // Medium impact for confirmations
 * haptic.medium();
 *
 * // Success notification for completed actions
 * haptic.success();
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Check if haptics are available on the current platform
 */
const isHapticsAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Safe haptic wrapper that handles errors gracefully
 */
async function safeHaptic(callback: () => Promise<void>): Promise<void> {
  if (!isHapticsAvailable) return;

  try {
    await callback();
  } catch {
    // Haptics not available - native module not linked or running in unsupported environment
  }
}

/**
 * Haptic feedback functions for different interaction types
 */
export const haptic = {
  /**
   * Light impact - for selections, toggles, tab switches
   * Use for: checkbox toggles, tab selection, filter changes
   */
  light: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /**
   * Medium impact - for button presses, confirmations
   * Use for: primary button presses, starting/stopping recordings
   */
  medium: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /**
   * Heavy impact - for significant actions
   * Use for: destructive actions, major state changes
   */
  heavy: () => safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  /**
   * Selection feedback - for picker changes
   * Use for: scroll pickers, option selection in lists
   */
  selection: () => safeHaptic(() => Haptics.selectionAsync()),

  /**
   * Success notification - for completed actions
   * Use for: form submission success, save complete, sync done
   */
  success: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  /**
   * Warning notification - for attention needed
   * Use for: validation warnings, approaching limits
   */
  warning: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  /**
   * Error notification - for failures
   * Use for: form validation errors, failed operations
   */
  error: () => safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
} as const;

/**
 * Type-safe haptic type for dynamic usage
 */
export type HapticType = keyof typeof haptic;

/**
 * Trigger haptic by type name (useful for dynamic scenarios)
 *
 * @example
 * triggerHaptic(isSuccess ? 'success' : 'error');
 */
export function triggerHaptic(type: HapticType): void {
  haptic[type]();
}

export default haptic;
