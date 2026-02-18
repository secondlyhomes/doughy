/**
 * FieldIcon Component
 *
 * Renders an icon (emoji or React node) in a form field
 */

import React from 'react'
import { View } from 'react-native'
import { Text } from '@/components'
import { FieldIconProps } from '../types'
import { styles } from '../styles'

/**
 * FieldIcon - Displays an icon in left or right position of a form field
 *
 * @example
 * ```tsx
 * <FieldIcon icon="📧" position="left" />
 * <FieldIcon icon={<CustomIcon />} position="right" />
 * ```
 */
export function FieldIcon({ icon, position }: FieldIconProps) {
  const positionStyle = position === 'left' ? styles.leftIcon : styles.rightIcon

  return (
    <View style={[styles.icon, positionStyle]}>
      {typeof icon === 'string' ? <Text>{icon}</Text> : icon}
    </View>
  )
}
