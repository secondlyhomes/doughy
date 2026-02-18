/**
 * Simple list item component for basic text display
 */

import { memo, useCallback } from 'react'
import { Text, Pressable } from 'react-native'
import type { ListItemProps } from './types'
import { styles } from './virtualized-list.styles'

/**
 * Simple list item for basic text display
 * Memoized to prevent unnecessary re-renders
 */
export const SimpleListItem = memo<ListItemProps>(({ item, onPress }) => {
  const handlePress = useCallback(() => {
    onPress?.(item)
  }, [item, onPress])

  return (
    <Pressable
      style={({ pressed }) => [
        styles.simpleItem,
        pressed && styles.itemPressed,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <Text style={styles.simpleTitle}>{item.title}</Text>
    </Pressable>
  )
})

SimpleListItem.displayName = 'SimpleListItem'
