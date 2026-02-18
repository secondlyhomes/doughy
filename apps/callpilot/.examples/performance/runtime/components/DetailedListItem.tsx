/**
 * Detailed list item component with title and description
 */

import { memo, useCallback } from 'react'
import { Text, Pressable } from 'react-native'
import type { ListItemProps } from './types'
import { styles } from './virtualized-list.styles'

/**
 * Detailed list item with title and description
 * Memoized to prevent unnecessary re-renders
 */
export const DetailedListItem = memo<ListItemProps>(({ item, onPress }) => {
  const handlePress = useCallback(() => {
    onPress?.(item)
  }, [item, onPress])

  return (
    <Pressable
      style={({ pressed }) => [
        styles.detailedItem,
        pressed && styles.itemPressed,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.description || ''}`}
    >
      <Text style={styles.detailedTitle}>{item.title}</Text>
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </Pressable>
  )
})

DetailedListItem.displayName = 'DetailedListItem'
