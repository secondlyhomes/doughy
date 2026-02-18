/**
 * Modal Header Component
 *
 * Header bar for the AI Assistant modal with title and close button.
 */

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { styles } from './ai-assistant.styles'

interface ModalHeaderProps {
  title: string
  onClose: () => void
}

/**
 * Header for AI Assistant modal
 *
 * @example
 * ```tsx
 * <ModalHeader title="AI Assistant" onClose={handleClose} />
 * ```
 */
export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}
