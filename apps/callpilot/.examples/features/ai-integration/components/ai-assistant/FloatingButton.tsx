/**
 * Floating Button Component
 *
 * The floating action button that opens the AI Assistant.
 */

import React from 'react'
import { TouchableOpacity, Text } from 'react-native'
import { styles, getPositionStyles } from './ai-assistant.styles'
import type { FloatingButtonProps } from './types'

/**
 * Floating button to trigger AI Assistant
 *
 * @example
 * ```tsx
 * <FloatingButton position="bottom-right" onPress={() => setIsOpen(true)} />
 * ```
 */
export function FloatingButton({ position, onPress }: FloatingButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.floatingButton, getPositionStyles(position)]}
      onPress={onPress}
    >
      <Text style={styles.floatingButtonText}>🤖</Text>
    </TouchableOpacity>
  )
}
