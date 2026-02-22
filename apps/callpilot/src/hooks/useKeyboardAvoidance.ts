/**
 * useKeyboardAvoidance
 *
 * Centralized keyboard avoidance configuration.
 * Calculates keyboardVerticalOffset based on screen context
 * (tab bar, native nav header, custom offsets).
 *
 * Pattern from Doughy — only account for elements the
 * KeyboardAvoidingView can't measure from its own layout:
 *   - Native navigation headers (not custom ones rendered inside the KAV)
 *   - Tab bars rendered outside the KAV
 */

import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const NAVIGATION_BAR_HEIGHT = 44
const TAB_BAR_HEIGHT = 88

export interface KeyboardAvoidanceConfig {
  /** Screen has a visible native tab bar outside the KAV */
  hasTabBar?: boolean
  /** Screen has a native navigation header (headerShown: true) */
  hasNavigationHeader?: boolean
  /** Custom additional offset in points */
  customOffset?: number
}

export interface KeyboardAvoidanceProps {
  behavior: 'padding' | 'height' | undefined
  keyboardVerticalOffset: number
  keyboardShouldPersistTaps: 'handled'
}

export function useKeyboardAvoidance(
  config: KeyboardAvoidanceConfig = {},
): KeyboardAvoidanceProps {
  const insets = useSafeAreaInsets()
  const {
    hasTabBar = false,
    hasNavigationHeader = false,
    customOffset = 0,
  } = config

  let offset = customOffset

  if (Platform.OS === 'ios') {
    if (hasTabBar) {
      offset += TAB_BAR_HEIGHT
      offset += insets.bottom
    }
    if (hasNavigationHeader) {
      offset += NAVIGATION_BAR_HEIGHT
    }
  }

  return {
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset: Platform.OS === 'ios' ? offset : 0,
    keyboardShouldPersistTaps: 'handled',
  }
}
