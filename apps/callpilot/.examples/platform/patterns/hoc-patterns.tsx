/**
 * HOC and Wrapper Patterns (5-6)
 *
 * Higher-order components and component wrappers for platform-specific behavior
 */

import React from 'react'
import { Platform, Text } from 'react-native'
import { platformComponent } from '../utils/platformSelect'
import {
  IOSDatePicker,
  AndroidDatePicker,
  WebDatePicker,
} from './placeholder-components'

/**
 * PATTERN 5: HOC for Platform-Specific Behavior
 *
 * Use when:
 * - Want to add platform-specific props/behavior
 * - Share common component logic
 * - Enhance existing components
 */
export function withPlatformBehavior<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    const platformProps = Platform.select({
      ios: {
        hapticFeedback: true,
        animationDuration: 300,
      },
      android: {
        rippleEffect: true,
        animationDuration: 250,
      },
      default: {
        hapticFeedback: false,
        rippleEffect: false,
        animationDuration: 200,
      },
    })

    return <Component {...props} {...platformProps} />
  }
}

/**
 * PATTERN 6: Platform Component Wrapper
 *
 * Use when:
 * - Need to switch entire components
 * - Type-safe component selection
 * - Clean component API
 */
export const DatePicker = platformComponent({
  ios: IOSDatePicker,
  android: AndroidDatePicker,
  web: WebDatePicker,
})

// Usage example
export function DateSelector() {
  const [date, setDate] = React.useState(new Date())

  if (!DatePicker) {
    return <Text>Date picker not available</Text>
  }

  return <DatePicker value={date} onChange={setDate} />
}
