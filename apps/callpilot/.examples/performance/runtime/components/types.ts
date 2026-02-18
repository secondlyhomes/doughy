/**
 * Type definitions for VirtualizedList components
 */

import type { ViewToken } from 'react-native'

/**
 * Base list item interface
 * All items in the virtualized list must extend this interface
 */
export interface ListItem {
  id: string
  title: string
  description?: string
  type: 'simple' | 'detailed' | 'header'
  data?: any
}

/**
 * Props for the VirtualizedList component
 */
export interface VirtualizedListProps<T extends ListItem> {
  /** Array of items to render */
  data: T[]
  /** Callback when an item is pressed */
  onItemPress?: (item: T) => void
  /** Callback when the end of the list is reached (for infinite scrolling) */
  onEndReached?: () => void
  /** How far from the end to trigger onEndReached (0-1) */
  onEndReachedThreshold?: number
  /** Estimated height of each item (for better scroll performance) */
  estimatedItemSize?: number
  /** Whether the list is currently loading */
  loading?: boolean
  /** Text to display when the list is empty */
  emptyText?: string
  /** Component to render at the top of the list */
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null
  /** Component to render at the bottom of the list */
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null
  /** Callback when viewable items change */
  onViewableItemsChanged?: (info: {
    viewableItems: ViewToken[]
    changed: ViewToken[]
  }) => void
}

/**
 * Props for list item components
 */
export interface ListItemProps {
  item: ListItem
  onPress?: (item: ListItem) => void
}

/**
 * Props for header list item (non-interactive)
 */
export interface HeaderListItemProps {
  item: ListItem
}

/**
 * Props for empty list component
 */
export interface EmptyListProps {
  text?: string
}
