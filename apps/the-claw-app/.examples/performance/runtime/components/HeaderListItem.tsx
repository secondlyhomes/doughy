/**
 * Header list item component (non-interactive section header)
 */

import { memo } from 'react'
import { View, Text } from 'react-native'
import type { HeaderListItemProps } from './types'
import { styles } from './virtualized-list.styles'

/**
 * Header list item (non-interactive)
 * Memoized to prevent unnecessary re-renders
 */
export const HeaderListItem = memo<HeaderListItemProps>(({ item }) => {
  return (
    <View style={styles.headerItem}>
      <Text style={styles.headerTitle}>{item.title}</Text>
    </View>
  )
})

HeaderListItem.displayName = 'HeaderListItem'
