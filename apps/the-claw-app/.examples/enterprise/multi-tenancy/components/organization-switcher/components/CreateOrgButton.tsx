/**
 * CreateOrgButton.tsx
 *
 * Button to create a new organization.
 */

import React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { styles } from '../styles'
import type { CreateOrgButtonProps } from '../types'

/**
 * Renders a button to create a new organization.
 *
 * @param onPress - Callback when the button is pressed
 */
export function CreateOrgButton({ onPress }: CreateOrgButtonProps) {
  return (
    <TouchableOpacity style={styles.createButton} onPress={onPress}>
      <Text style={styles.createButtonText}>+ Create Organization</Text>
    </TouchableOpacity>
  )
}
