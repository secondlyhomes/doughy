/**
 * Type definitions for Conditional Rendering Patterns
 */

import React from 'react'

/**
 * Button component props
 */
export interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

/**
 * Platform render props for render prop pattern
 */
export interface PlatformRenderProps {
  children: (platform: {
    isIOS: boolean
    isAndroid: boolean
    version: number | null
  }) => React.ReactNode
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Platform context value
 */
export interface PlatformContextValue {
  platform: 'ios' | 'android' | 'web'
  features: {
    haptics: boolean
    biometrics: boolean
    widgets: boolean
  }
}

/**
 * Platform features returned by usePlatformFeatures hook
 */
export interface PlatformFeatures {
  supportsHaptics: boolean
  supportsWidgets: boolean
  supportsLiveActivities: boolean
  triggerHaptic: () => void
}

/**
 * Animation configuration per platform
 */
export interface AnimationConfig {
  duration: number
  useNativeDriver: boolean
}

/**
 * Platform-specific style options
 */
export interface PlatformStyleOptions {
  ios?: Record<string, unknown>
  android?: Record<string, unknown>
  web?: Record<string, unknown>
  default?: Record<string, unknown>
}

/**
 * Date picker props
 */
export interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
}
