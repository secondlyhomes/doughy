/**
 * Platform-Specific Navigation Patterns
 *
 * Entry point for platform-appropriate navigation patterns for iOS and Android
 * in React Native + Expo apps using React Navigation.
 *
 * This module re-exports all navigation configurations and utilities.
 * See individual files for detailed implementations:
 * - ios/IOSNavigation.tsx - iOS-specific patterns
 * - android/AndroidNavigation.tsx - Android-specific patterns
 * - utils/navigation-utils.ts - Shared utilities and defaults
 * - navigation-types.ts - TypeScript type definitions
 */

import { Platform } from 'react-native'
import { platformSelect } from '../utils/platformSelect'

// iOS configurations
import {
  IOS_TAB_BAR_CONFIG,
  IOS_SCREEN_TRANSITIONS,
  IOS_HEADER_CONFIG,
  IOS_MODAL_CONFIG,
  IOS_BACK_GESTURE,
  IOS_ACTION_SHEET_CONFIG,
  IOS_CONTEXT_MENU_CONFIG,
  IOS_DRAWER_CONFIG,
  IOS_BOTTOM_SHEET_CONFIG,
  IOSSearchBar,
} from './ios/IOSNavigation'

// Android configurations
import {
  ANDROID_TAB_BAR_CONFIG,
  ANDROID_SCREEN_TRANSITIONS,
  ANDROID_HEADER_CONFIG,
  ANDROID_MODAL_CONFIG,
  ANDROID_BACK_GESTURE,
  ANDROID_ACTION_SHEET_CONFIG,
  ANDROID_CONTEXT_MENU_CONFIG,
  ANDROID_DRAWER_CONFIG,
  ANDROID_BOTTOM_SHEET_CONFIG,
  AndroidSearchBar,
} from './android/AndroidNavigation'

// Default configurations
import {
  DEFAULT_TAB_BAR_CONFIG,
  DEFAULT_SCREEN_TRANSITIONS,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_MODAL_CONFIG,
  DEFAULT_BACK_GESTURE,
  DEFAULT_ACTION_SHEET_CONFIG,
  DEFAULT_CONTEXT_MENU_CONFIG,
  DEFAULT_DRAWER_CONFIG,
  DEFAULT_BOTTOM_SHEET_CONFIG,
  DefaultSearchBar,
  getCardBackgroundColor,
} from './utils/navigation-utils'

// Platform-specific configurations using platformSelect

export const TAB_BAR_CONFIG = platformSelect({
  ios: IOS_TAB_BAR_CONFIG,
  android: ANDROID_TAB_BAR_CONFIG,
  default: DEFAULT_TAB_BAR_CONFIG,
})

export const SCREEN_TRANSITIONS = platformSelect({
  ios: IOS_SCREEN_TRANSITIONS,
  android: ANDROID_SCREEN_TRANSITIONS,
  default: DEFAULT_SCREEN_TRANSITIONS,
})

export const HEADER_CONFIG = platformSelect({
  ios: IOS_HEADER_CONFIG,
  android: ANDROID_HEADER_CONFIG,
  default: DEFAULT_HEADER_CONFIG,
})

export const MODAL_CONFIG = platformSelect({
  ios: IOS_MODAL_CONFIG,
  android: ANDROID_MODAL_CONFIG,
  default: DEFAULT_MODAL_CONFIG,
})

export const ACTION_SHEET_CONFIG = platformSelect({
  ios: IOS_ACTION_SHEET_CONFIG,
  android: ANDROID_ACTION_SHEET_CONFIG,
  default: DEFAULT_ACTION_SHEET_CONFIG,
})

export const CONTEXT_MENU_CONFIG = platformSelect({
  ios: IOS_CONTEXT_MENU_CONFIG,
  android: ANDROID_CONTEXT_MENU_CONFIG,
  default: DEFAULT_CONTEXT_MENU_CONFIG,
})

export const DRAWER_CONFIG = platformSelect({
  ios: IOS_DRAWER_CONFIG,
  android: ANDROID_DRAWER_CONFIG,
  default: DEFAULT_DRAWER_CONFIG,
})

export const BOTTOM_SHEET_CONFIG = platformSelect({
  ios: IOS_BOTTOM_SHEET_CONFIG,
  android: ANDROID_BOTTOM_SHEET_CONFIG,
  default: DEFAULT_BOTTOM_SHEET_CONFIG,
})

/**
 * Hook to get back gesture configuration for current platform
 */
export function useBackGesture() {
  if (Platform.OS === 'ios') {
    return IOS_BACK_GESTURE
  }
  if (Platform.OS === 'android') {
    return ANDROID_BACK_GESTURE
  }
  return DEFAULT_BACK_GESTURE
}

/**
 * Platform-specific search bar component
 */
export function PlatformSearchBar() {
  if (Platform.OS === 'ios') {
    return IOSSearchBar()
  }
  if (Platform.OS === 'android') {
    return AndroidSearchBar()
  }
  return DefaultSearchBar()
}

/**
 * Get platform-specific stack navigator configuration
 */
export function getPlatformStackConfig() {
  return {
    screenOptions: {
      ...HEADER_CONFIG,
      ...SCREEN_TRANSITIONS,
      cardStyle: {
        backgroundColor: getCardBackgroundColor(),
      },
    },
  }
}
