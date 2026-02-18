/**
 * Virtualization hooks for FlashList performance optimization
 */

import { useCallback, useMemo } from 'react'
import { View, ActivityIndicator } from 'react-native'
import type { ListItem, VirtualizedListProps } from '../types'
import { EmptyListComponent } from '../EmptyListComponent'

/**
 * Hook for list item rendering logic
 *
 * Returns memoized callbacks for FlashList optimization:
 * - keyExtractor: Extracts unique key for each item
 * - getItemType: Returns item type for view recycling
 */
export function useListCallbacks<T extends ListItem>() {
  /**
   * Extracts unique key for each item
   * Important for React to track which items changed
   */
  const keyExtractor = useCallback((item: T) => item.id, [])

  /**
   * Returns item type for FlashList recycling
   * This is CRITICAL for performance with heterogeneous lists
   *
   * FlashList uses this to recycle views of the same type
   * Without this, FlashList will create new views for each item
   */
  const getItemType = useCallback((item: T) => item.type, [])

  return { keyExtractor, getItemType }
}

/**
 * Hook for end reached handling with loading state
 *
 * Prevents multiple calls when scrolling quickly by checking loading state
 */
export function useEndReachedHandler(
  loading: boolean,
  onEndReached?: () => void
) {
  return useCallback(() => {
    if (!loading && onEndReached) {
      onEndReached()
    }
  }, [loading, onEndReached])
}

/**
 * Hook for list empty and footer components
 *
 * Returns memoized components based on loading state
 */
export function useListComponents<T extends ListItem>(
  loading: boolean,
  dataLength: number,
  emptyText?: string,
  ListFooterComponent?: VirtualizedListProps<T>['ListFooterComponent']
) {
  const emptyComponent = useMemo(() => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )
    }
    return <EmptyListComponent text={emptyText} />
  }, [loading, emptyText])

  const footerComponent = useMemo(() => {
    if (loading && dataLength > 0) {
      return (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )
    }
    return ListFooterComponent || null
  }, [loading, dataLength, ListFooterComponent])

  return { emptyComponent, footerComponent }
}

/**
 * Default FlashList configuration for optimal performance
 *
 * These values are optimized for most use cases:
 * - drawDistance: 500 - How far ahead to render
 * - estimatedListSize: Approximate viewport size
 * - removeClippedSubviews: Android performance optimization
 * - maxToRenderPerBatch: 10 - Items per render batch
 * - updateCellsBatchingPeriod: 50ms - Batch update delay
 * - initialNumToRender: 10 - Initial items to render
 * - windowSize: 5 - Screen heights to render
 */
export const DEFAULT_FLASH_LIST_CONFIG = {
  drawDistance: 500,
  estimatedListSize: { height: 800, width: 400 },
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 10,
  windowSize: 5,
  disableAutoLayout: false,
} as const
