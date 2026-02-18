/**
 * Empty list component displayed when no items are available
 */

import { memo } from 'react'
import { View, Text } from 'react-native'
import type { EmptyListProps } from './types'
import { styles } from './virtualized-list.styles'

/**
 * Empty list component
 * Displayed when the list has no items
 */
export const EmptyListComponent = memo<EmptyListProps>(({ text }) => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{text || 'No items to display'}</Text>
    </View>
  )
})

EmptyListComponent.displayName = 'EmptyListComponent'
