/**
 * Basic Conditional Rendering Patterns (1-4)
 *
 * Simple patterns for platform-specific component rendering
 */

import React from 'react'
import { Platform, View, Text, TouchableOpacity } from 'react-native'
import { PlatformUtils } from '../utils/platformDetection'
import { styles } from './styles'
import { getPlatformShadowStyles } from './utils/platform-utils'
import {
  LiveActivityWidget,
  MaterialYouWidget,
  StandardWidget,
} from './placeholder-components'
import type { ButtonProps } from './types'

/**
 * PATTERN 1: Platform.select for Simple Style Differences
 *
 * Use when:
 * - Only styles differ between platforms
 * - Logic is the same
 * - Component is < 50 lines
 */
export function ButtonWithPlatformStyles() {
  return (
    <TouchableOpacity style={[styles.button, getPlatformShadowStyles()]}>
      <Text style={styles.buttonText}>Press Me</Text>
    </TouchableOpacity>
  )
}

/**
 * PATTERN 2: Inline Conditional Rendering
 *
 * Use when:
 * - Small portions of UI differ
 * - Simple boolean conditions
 * - Easy to read inline
 */
export function HeaderWithPlatformTitle() {
  return (
    <View style={styles.header}>
      {Platform.OS === 'ios' ? (
        <Text style={styles.iOSTitle}>iOS Header</Text>
      ) : (
        <Text style={styles.androidTitle}>Android Header</Text>
      )}
    </View>
  )
}

/**
 * PATTERN 3: Conditional Components with Guards
 *
 * Use when:
 * - Feature availability depends on platform version
 * - Need to check multiple conditions
 * - Require fallback components
 */
export function PlatformFeatureComponent() {
  // iOS 16.1+ Live Activities
  if (Platform.OS === 'ios' && PlatformUtils.iOSVersion! >= 16.1) {
    return <LiveActivityWidget />
  }

  // Android 12+ Material You
  if (Platform.OS === 'android' && PlatformUtils.androidVersion! >= 31) {
    return <MaterialYouWidget />
  }

  // Fallback for older versions or other platforms
  return <StandardWidget />
}

/**
 * PATTERN 4: Platform-Specific Component Files
 *
 * Use when:
 * - Implementations significantly differ (>50 lines)
 * - Different native modules needed
 * - Complex platform-specific logic
 *
 * File structure:
 * - Button.tsx (shared types and exports)
 * - Button.ios.tsx (iOS implementation)
 * - Button.android.tsx (Android implementation)
 *
 * React Native automatically picks the correct file.
 */

// This would be in Button.ios.tsx
export function IOSButton({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iOSButton}>
      <Text style={styles.iOSButtonText}>{title}</Text>
    </TouchableOpacity>
  )
}

// This would be in Button.android.tsx
export function AndroidButton({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.androidButton}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
    >
      <Text style={styles.androidButtonText}>{title}</Text>
    </TouchableOpacity>
  )
}
