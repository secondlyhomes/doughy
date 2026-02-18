/**
 * Advanced Conditional Rendering Patterns (9-12)
 *
 * Patterns for styles, native modules, animations, and lazy loading
 */

import React from 'react'
import { Platform, View, Text, TouchableOpacity } from 'react-native'
import { platformSelect } from '../utils/platformSelect'
import { PlatformUtils } from '../utils/platformDetection'
import { styles } from './styles'
import { getAnimationConfig, getBiometricLabel } from './utils/platform-utils'

/**
 * PATTERN 9: Platform-Specific Styles with Theme
 *
 * Use when:
 * - Using theme system
 * - Want consistent platform adaptations
 * - Need to reference theme values
 */
export function ThemedButton() {
  const platformStyles = platformSelect({
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

  return (
    <TouchableOpacity style={[styles.themedButton, platformStyles]}>
      <Text>Themed Button</Text>
    </TouchableOpacity>
  )
}

/**
 * PATTERN 10: Conditional Native Module Usage
 *
 * Use when:
 * - Using platform-specific native modules
 * - Module might not be available
 * - Need graceful fallback
 */
export function BiometricAuth() {
  const [isAvailable, setIsAvailable] = React.useState(false)

  React.useEffect(() => {
    checkBiometricAvailability()
  }, [])

  const checkBiometricAvailability = async () => {
    if (!PlatformUtils.supportsBiometrics()) {
      setIsAvailable(false)
      return
    }

    try {
      // const available = await LocalAuthentication.hasHardwareAsync()
      // setIsAvailable(available)
    } catch (error) {
      console.error('Error checking biometrics:', error)
      setIsAvailable(false)
    }
  }

  if (!isAvailable) {
    return (
      <View>
        <Text>Biometric authentication not available</Text>
        <Text>Please use password instead</Text>
      </View>
    )
  }

  return (
    <TouchableOpacity onPress={() => {}}>
      <Text>{getBiometricLabel()}</Text>
    </TouchableOpacity>
  )
}

/**
 * PATTERN 11: Platform-Specific Animations
 *
 * Use when:
 * - Animation behavior differs per platform
 * - Different animation libraries needed
 * - Performance considerations
 */
export function AnimatedComponent() {
  const animationConfig = getAnimationConfig()

  // Use animationConfig in your animations
  return <View>{/* Animated content */}</View>
}

/**
 * PATTERN 12: Conditional Import with React.lazy
 *
 * Use when:
 * - Large platform-specific components
 * - Want code splitting
 * - Reduce initial bundle size
 */
const HeavyIOSComponent = React.lazy(() => import('./HeavyComponent.ios'))
const HeavyAndroidComponent = React.lazy(() => import('./HeavyComponent.android'))

export function LazyPlatformComponent() {
  const Component = Platform.select({
    ios: HeavyIOSComponent,
    android: HeavyAndroidComponent,
    default: () => <Text>Not supported</Text>,
  })

  return (
    <React.Suspense fallback={<Text>Loading...</Text>}>
      {Component && <Component />}
    </React.Suspense>
  )
}
