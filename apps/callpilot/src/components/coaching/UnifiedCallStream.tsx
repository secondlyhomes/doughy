/**
 * UnifiedCallStream
 *
 * FlatList-based renderer for the merged transcript + suggestion stream.
 * Auto-scrolls when at bottom; shows "Jump to latest" pill when scrolled up.
 */

import { useRef, useState, useCallback } from 'react'
import { FlatList, View, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { TranscriptBubble } from './TranscriptBubble'
import { InlineSuggestionCard } from './InlineSuggestionCard'
import type { StreamItem } from '@/types/callStream'

export interface UnifiedCallStreamProps {
  items: StreamItem[]
  onDismissSuggestion: (id: string) => void
  emptyMessage?: string
}

export function UnifiedCallStream({
  items,
  onDismissSuggestion,
  emptyMessage = 'Waiting for conversation...',
}: UnifiedCallStreamProps) {
  const { theme } = useTheme()
  const listRef = useRef<FlatList<StreamItem>>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const contentHeightRef = useRef(0)
  const layoutHeightRef = useRef(0)

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y
      setIsAtBottom(distanceFromBottom < 60)
    },
    [],
  )

  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentHeightRef.current = h
      if (isAtBottom && listRef.current) {
        listRef.current.scrollToEnd({ animated: true })
      }
    },
    [isAtBottom],
  )

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      layoutHeightRef.current = e.nativeEvent.layout.height
    },
    [],
  )

  const jumpToLatest = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true })
    setIsAtBottom(true)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: StreamItem }) => {
      if (item.type === 'transcript') {
        return <TranscriptBubble item={item} />
      }
      return (
        <InlineSuggestionCard item={item} onDismiss={onDismissSuggestion} />
      )
    },
    [onDismissSuggestion],
  )

  if (items.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: theme.tokens.spacing[6],
        }}
      >
        <Text variant="bodySmall" color={theme.colors.text.tertiary}>
          {emptyMessage}
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          padding: theme.tokens.spacing[4],
          gap: theme.tokens.spacing[3],
          paddingBottom: theme.tokens.spacing[8],
        }}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        showsVerticalScrollIndicator={false}
      />

      {/* Jump to latest pill */}
      {!isAtBottom && (
        <View
          style={{
            position: 'absolute',
            bottom: theme.tokens.spacing[2],
            alignSelf: 'center',
          }}
        >
          <TouchableOpacity
            onPress={jumpToLatest}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: theme.colors.primary[500],
              paddingHorizontal: theme.tokens.spacing[3],
              paddingVertical: theme.tokens.spacing[1],
              borderRadius: theme.tokens.borderRadius.full,
            }}
          >
            <Ionicons
              name="arrow-down"
              size={12}
              color={theme.tokens.colors.white}
            />
            <Text
              variant="caption"
              weight="semibold"
              style={{ color: theme.tokens.colors.white }}
            >
              Jump to latest
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
