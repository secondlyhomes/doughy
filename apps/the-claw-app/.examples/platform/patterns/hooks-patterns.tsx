/**
 * Hooks and Render Props Patterns (7-8)
 *
 * Custom hooks and render props for platform-specific logic
 */

import React from 'react'
import { Platform, View, Text, TouchableOpacity } from 'react-native'
import { PlatformUtils } from '../utils/platformDetection'
import type { PlatformRenderProps, PlatformFeatures } from './types'
import {
  IOSSpecificFeature,
  AndroidSpecificFeature,
  GenericFeature,
} from './placeholder-components'

/**
 * PATTERN 7: Render Props with Platform Logic
 *
 * Use when:
 * - Need flexible rendering
 * - Platform logic affects children
 * - Want inversion of control
 */
export function PlatformRender({ children }: PlatformRenderProps) {
  const platform = {
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    version: PlatformUtils.iOSVersion || PlatformUtils.androidVersion,
  }

  return <>{children(platform)}</>
}

// Usage example
export function PlatformRenderExample() {
  return (
    <PlatformRender>
      {({ isIOS, isAndroid, version }) => (
        <View>
          {isIOS && version! >= 16 ? (
            <IOSSpecificFeature />
          ) : isAndroid && version! >= 31 ? (
            <AndroidSpecificFeature />
          ) : (
            <GenericFeature />
          )}
        </View>
      )}
    </PlatformRender>
  )
}

/**
 * PATTERN 8: Custom Hooks for Platform Logic
 *
 * Use when:
 * - Platform logic is reusable
 * - Need to encapsulate complexity
 * - Multiple components need same logic
 */
export function usePlatformFeatures(): PlatformFeatures {
  const supportsHaptics = PlatformUtils.supportsHaptics()
  const supportsWidgets = PlatformUtils.supportsWidgets()
  const supportsLiveActivities = PlatformUtils.supportsLiveActivities()

  const triggerHaptic = React.useCallback(() => {
    if (!supportsHaptics) return

    if (Platform.OS === 'ios') {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else if (Platform.OS === 'android') {
      // Vibration.vibrate(50)
    }
  }, [supportsHaptics])

  return {
    supportsHaptics,
    supportsWidgets,
    supportsLiveActivities,
    triggerHaptic,
  }
}

// Usage example
export function InteractiveComponent() {
  const { supportsHaptics, triggerHaptic } = usePlatformFeatures()

  const handlePress = () => {
    if (supportsHaptics) {
      triggerHaptic()
    }
    // Handle press
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>Press Me</Text>
    </TouchableOpacity>
  )
}
