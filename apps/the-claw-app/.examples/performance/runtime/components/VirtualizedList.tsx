/**
 * VirtualizedList Component - High-Performance List Rendering
 *
 * Uses FlashList (by Shopify) for superior performance compared to FlatList.
 * FlashList can handle 10,000+ items at 60fps with proper configuration.
 *
 * Performance Comparison:
 * - FlatList: ~30fps with 1,000 items, ~15fps with 10,000 items
 * - FlashList: ~60fps with 10,000 items, ~55fps with 100,000 items
 *
 * @see https://shopify.github.io/flash-list/
 */

import { FlashList } from '@shopify/flash-list'
import { useCallback } from 'react'

import type { ListItem, VirtualizedListProps } from './types'
import { SimpleListItem } from './SimpleListItem'
import { DetailedListItem } from './DetailedListItem'
import { HeaderListItem } from './HeaderListItem'
import {
  useListCallbacks,
  useEndReachedHandler,
  useListComponents,
  DEFAULT_FLASH_LIST_CONFIG,
} from './hooks/useVirtualization'

/**
 * High-performance virtualized list component
 *
 * Key optimizations:
 * 1. FlashList for recycling views (60fps with large lists)
 * 2. Memoized item components to prevent re-renders
 * 3. getItemType for heterogeneous lists (different item layouts)
 * 4. estimatedItemSize for better scroll performance
 * 5. optimized onEndReached for infinite scrolling
 *
 * @example
 * ```tsx
 * <VirtualizedList
 *   data={items}
 *   onItemPress={handlePress}
 *   onEndReached={loadMore}
 *   estimatedItemSize={60}
 * />
 * ```
 */
export function VirtualizedList<T extends ListItem>({
  data,
  onItemPress,
  onEndReached,
  onEndReachedThreshold = 0.5,
  estimatedItemSize = 60,
  loading = false,
  emptyText,
  ListHeaderComponent,
  ListFooterComponent,
  onViewableItemsChanged,
}: VirtualizedListProps<T>) {
  // List callbacks for key extraction and item type
  const { keyExtractor, getItemType } = useListCallbacks<T>()

  // End reached handler with loading state check
  const handleEndReached = useEndReachedHandler(loading, onEndReached)

  // Empty and footer components based on loading state
  const { emptyComponent, footerComponent } = useListComponents(
    loading,
    data.length,
    emptyText,
    ListFooterComponent
  )

  /**
   * Renders individual list items based on type
   * Uses memoized components to prevent unnecessary re-renders
   */
  const renderItem = useCallback(
    ({ item }: { item: T }) => {
      switch (item.type) {
        case 'simple':
          return <SimpleListItem item={item} onPress={onItemPress} />
        case 'detailed':
          return <DetailedListItem item={item} onPress={onItemPress} />
        case 'header':
          return <HeaderListItem item={item} />
        default:
          return <SimpleListItem item={item} onPress={onItemPress} />
      }
    },
    [onItemPress]
  )

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      estimatedItemSize={estimatedItemSize}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={footerComponent}
      ListEmptyComponent={emptyComponent}
      onViewableItemsChanged={onViewableItemsChanged}
      {...DEFAULT_FLASH_LIST_CONFIG}
    />
  )
}
