/**
 * Platform Utility Functions
 *
 * Helper functions for platform-specific logic
 */

import { Platform } from 'react-native'
import { PlatformUtils } from '../../utils/platformDetection'
import { platformSelect } from '../../utils/platformSelect'
import type { AnimationConfig } from '../types'

/**
 * Get animation configuration for the current platform
 */
export function getAnimationConfig(): AnimationConfig {
  return platformSelect({
    ios: {
      duration: 300,
      useNativeDriver: true,
    },
    android: {
      duration: 250,
      useNativeDriver: true,
    },
    default: {
      duration: 200,
      useNativeDriver: false,
    },
  })
}

/**
 * Get platform-specific button styles
 */
export function getPlatformButtonStyles() {
  return platformSelect({
    ios: {
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    android: {
      borderRadius: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    default: {
      borderRadius: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
  })
}

/**
 * Get platform-specific shadow styles
 */
export function getPlatformShadowStyles() {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 5,
    },
  })
}

/**
 * Check if current platform supports a specific iOS version
 */
export function isIOSVersionAtLeast(version: number): boolean {
  return Platform.OS === 'ios' && (PlatformUtils.iOSVersion ?? 0) >= version
}

/**
 * Check if current platform supports a specific Android API level
 */
export function isAndroidAPIAtLeast(apiLevel: number): boolean {
  return Platform.OS === 'android' && (PlatformUtils.androidVersion ?? 0) >= apiLevel
}

/**
 * Get platform-specific error message
 */
export function getPlatformErrorMessage(): string {
  return Platform.select({
    ios: 'Please restart the app or contact support',
    android: 'Please restart the app or contact support',
    default: 'Please refresh the page',
  }) ?? 'An error occurred'
}

/**
 * Get biometric authentication label
 */
export function getBiometricLabel(): string {
  return Platform.OS === 'ios' ? 'Use Face ID / Touch ID' : 'Use Fingerprint'
}
