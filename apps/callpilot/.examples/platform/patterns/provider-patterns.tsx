/**
 * Provider and Error Boundary Patterns (13-14)
 *
 * Error boundaries and context providers for platform-specific behavior
 */

import React from 'react'
import { Platform, View, Text } from 'react-native'
import { PlatformUtils } from '../utils/platformDetection'
import { styles } from './styles'
import { getPlatformErrorMessage } from './utils/platform-utils'
import type { ErrorBoundaryState, PlatformContextValue } from './types'

/**
 * PATTERN 13: Platform-Specific Error Boundaries
 *
 * Use when:
 * - Platform-specific error handling
 * - Different error UI per platform
 * - Platform-specific recovery strategies
 */
export class PlatformErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Platform-specific error logging
    if (Platform.OS === 'ios') {
      // Log to iOS crash reporting
      console.error('iOS Error:', error, errorInfo)
    } else if (Platform.OS === 'android') {
      // Log to Android crash reporting
      console.error('Android Error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{getPlatformErrorMessage()}</Text>
        </View>
      )
    }

    return this.props.children
  }
}

/**
 * PATTERN 14: Platform-Specific Context Providers
 *
 * Use when:
 * - Platform-specific global state
 * - Different providers per platform
 * - Platform-specific initialization
 */
const PlatformContext = React.createContext<PlatformContextValue | null>(null)

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = React.useState({
    haptics: false,
    biometrics: false,
    widgets: false,
  })

  React.useEffect(() => {
    // Check feature availability
    setFeatures({
      haptics: PlatformUtils.supportsHaptics(),
      biometrics: PlatformUtils.supportsBiometrics(),
      widgets: PlatformUtils.supportsWidgets(),
    })
  }, [])

  const value: PlatformContextValue = {
    platform: Platform.OS as 'ios' | 'android' | 'web',
    features,
  }

  return (
    <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
  )
}

export function usePlatform() {
  const context = React.useContext(PlatformContext)
  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider')
  }
  return context
}
