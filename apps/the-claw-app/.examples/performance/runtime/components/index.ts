/**
 * VirtualizedList - High-Performance List Components
 *
 * @module VirtualizedList
 */

// Main component
export { VirtualizedList } from './VirtualizedList'

// Types
export type {
  ListItem,
  VirtualizedListProps,
  ListItemProps,
  HeaderListItemProps,
  EmptyListProps,
} from './types'

// Item components (for custom composition)
export { SimpleListItem } from './SimpleListItem'
export { DetailedListItem } from './DetailedListItem'
export { HeaderListItem } from './HeaderListItem'
export { EmptyListComponent } from './EmptyListComponent'

// Hooks (for custom implementations)
export {
  useListCallbacks,
  useEndReachedHandler,
  useListComponents,
  DEFAULT_FLASH_LIST_CONFIG,
} from './hooks/useVirtualization'

// Styles (for custom theming)
export { styles as virtualizedListStyles } from './virtualized-list.styles'
