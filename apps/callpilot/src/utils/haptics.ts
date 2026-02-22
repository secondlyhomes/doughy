/**
 * Safe haptics wrapper.
 *
 * Catches errors from expo-haptics on unsupported hardware
 * so haptic failures never block user interaction.
 */

import * as Haptics from 'expo-haptics'

export function triggerImpact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium): void {
  Haptics.impactAsync(style).catch(() => {})
}

export function triggerNotification(type: Haptics.NotificationFeedbackType): void {
  Haptics.notificationAsync(type).catch(() => {})
}
