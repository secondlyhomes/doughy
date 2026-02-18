/**
 * Messages Inbox Screen
 *
 * headerShown: false — no React Navigation header.
 * SearchBar floats over the list (position absolute) so content
 * scrolls behind it and the GlassView translucency is visible.
 */

import { useState, useCallback } from 'react'
import { View, FlatList, ScrollView, TouchableOpacity, Text as RNText } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { triggerImpact } from '@/utils/haptics'
import { useTheme } from '@/theme'
import { EmptyState } from '@/components'
import { SearchBar } from '@/components/SearchBar'
import { SkeletonConversationRow } from '@/components/SkeletonLoader'
import { ConversationListItem } from '@/components/messages'
import { useConversations, useContacts } from '@/hooks'
import type { Conversation, ContactModule } from '@/types'

type ModuleFilter = ContactModule | 'all'

const MODULE_FILTERS: { key: ModuleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'investor', label: '\uD83D\uDCB0 Investor' },
  { key: 'landlord', label: '\uD83C\uDFE0 Landlord' },
]

/** Height of the search bar area (bar + vertical padding) */
const SEARCH_BAR_HEIGHT = 56
/** Extra height when filter row is visible */
const FILTER_ROW_HEIGHT = 40

export default function MessagesScreen() {
  const { theme, isDark } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const {
    filteredConversations,
    moduleFilter,
    setModuleFilter,
    setSearchQuery,
  } = useConversations()
  const { isLoading } = useContacts()

  const [searchQuery, setLocalSearchQuery] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  function handleSearchChange(text: string) {
    setLocalSearchQuery(text)
    setSearchQuery(text)
  }

  function handleFilterToggle() {
    triggerImpact(ImpactFeedbackStyle.Light)
    setFiltersExpanded((prev) => !prev)
  }

  const hasActiveFilters = moduleFilter !== 'all'

  const handlePress = useCallback((conversation: Conversation) => {
    router.push({
      pathname: '/messages/[contactId]',
      params: { contactId: conversation.contactId },
    })
  }, [router])

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationListItem conversation={item} onPress={handlePress} />
    ),
    [handlePress]
  )

  const keyExtractor = useCallback((item: Conversation) => item.id, [])

  const renderSeparator = useCallback(
    () => (
      <View style={{
        height: 1,
        backgroundColor: theme.colors.border,
        marginLeft: theme.tokens.spacing[4] + 48 + theme.tokens.spacing[3],
      }} />
    ),
    [theme]
  )

  const listTopPadding = insets.top + SEARCH_BAR_HEIGHT + (filtersExpanded ? FILTER_ROW_HEIGHT : 0)

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* List fills the entire screen; top padding offsets for the floating search bar */}
      {isLoading ? (
        <View style={{ flex: 1, paddingTop: listTopPadding }}>
          <SkeletonConversationRow />
          <SkeletonConversationRow />
          <SkeletonConversationRow />
          <SkeletonConversationRow />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={{ flex: 1, paddingTop: listTopPadding }}>
          <EmptyState
            title="No messages yet"
            description="Start a conversation by tapping \uD83D\uDCAC on a contact."
            icon="chatbubble"
          />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filteredConversations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={{
            paddingTop: listTopPadding,
            paddingBottom: theme.tokens.spacing[4],
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Search bar floats over the list so content scrolls behind the glass */}
      <View
        style={{
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 1,
          paddingHorizontal: theme.tokens.spacing[4],
          paddingVertical: theme.tokens.spacing[2],
        }}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search conversations..."
          onFilter={handleFilterToggle}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Filter pill row — rendered below the SearchBar when expanded */}
        {filtersExpanded && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
            style={{ marginTop: theme.tokens.spacing[2] }}
          >
            {MODULE_FILTERS.map(({ key, label }) => {
              const isActive = moduleFilter === key
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    triggerImpact(ImpactFeedbackStyle.Light)
                    setModuleFilter(key)
                  }}
                  accessibilityLabel={`Filter: ${label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 9999,
                    backgroundColor: isActive
                      ? theme.colors.primary[500]
                      : isDark ? theme.colors.neutral[700] : theme.colors.neutral[200],
                  }}
                >
                  <RNText style={{
                    fontSize: theme.tokens.fontSize.xs,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive
                      ? theme.tokens.colors.white
                      : theme.colors.text.secondary,
                  }}>
                    {label}
                  </RNText>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}
      </View>
    </View>
  )
}
