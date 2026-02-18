/**
 * OrgListItem.tsx
 *
 * Individual organization item in the organization list.
 */

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { styles } from '../styles'
import type { OrgListItemProps } from '../types'
import { OrgLogo } from './OrgLogo'

/**
 * Renders a single organization item in the selection list.
 *
 * @param organization - The organization to display
 * @param isActive - Whether this org is currently selected
 * @param onPress - Callback when the item is pressed
 */
export function OrgListItem({ organization, isActive, onPress }: OrgListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.orgItem, isActive && styles.orgItemActive]}
      onPress={() => onPress(organization)}
    >
      <OrgLogo
        logoUrl={organization.logo_url}
        name={organization.name}
        size="medium"
      />

      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{organization.name}</Text>
        <Text style={styles.itemRole}>{organization.role}</Text>
      </View>

      {isActive && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  )
}
