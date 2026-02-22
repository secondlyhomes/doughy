// src/features/conversations/components/ConversationsView.tsx
// Unified Conversation Timeline - Zone G Week 8
// Shows all conversations (SMS, calls, voice memos, notes) in chronological order

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import {
  MessageSquare,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { SearchBar, EmptyState, LoadingSpinner } from '@/components/ui';
import { ConversationItemCard } from './ConversationItemCard';
import { FilterChips } from './ConversationFilterChips';

// Re-export types so existing imports continue to work
export type {
  ConversationType,
  ConversationDirection,
  Sentiment,
  ConversationItem,
  ConversationsViewProps,
} from './conversation-types';

import type { ConversationItem, ConversationType, ConversationsViewProps } from './conversation-types';

// ============================================
// Main ConversationsView Component
// ============================================

export function ConversationsView({
  items,
  isLoading,
  onRefresh,
  onAddConversation,
  onItemPress,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ConversationsViewProps) {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ConversationType[]>([]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by type
    if (activeFilters.length > 0) {
      filtered = filtered.filter((item) => activeFilters.includes(item.type));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const content = (item.content || '').toLowerCase();
        const transcript = (item.transcript || '').toLowerCase();
        const summary = (item.ai_summary || '').toLowerCase();
        return content.includes(query) || transcript.includes(query) || summary.includes(query);
      });
    }

    return filtered;
  }, [items, activeFilters, searchQuery]);

  // Toggle filter
  const handleToggleFilter = useCallback((type: ConversationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilters((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  }, []);

  // Handle item press
  const handleItemPress = useCallback(
    (item: ConversationItem) => {
      onItemPress?.(item);
    },
    [onItemPress]
  );

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: ConversationItem }) => (
      <ConversationItemCard item={item} onPress={() => handleItemPress(item)} />
    ),
    [handleItemPress]
  );

  // Loading state
  if (isLoading && items.length === 0) {
    return <LoadingSpinner fullScreen text="Loading conversations..." />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Search Bar */}
      <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
        <SearchBar
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          glass
        />
      </View>

      {/* Filter Chips */}
      <FilterChips activeFilters={activeFilters} onToggleFilter={handleToggleFilter} />

      {/* Conversations List */}
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: SPACING.sm }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!isLoading}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          // Pagination support
          onEndReached={hasMore && onLoadMore && !isLoadingMore ? onLoadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: SPACING.md, alignItems: 'center' }}>
                <LoadingSpinner size="small" />
              </View>
            ) : hasMore ? (
              <View style={{ paddingVertical: SPACING.md, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                  Scroll for more
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <EmptyState
          title={searchQuery ? 'No results found' : 'No conversations yet'}
          description={searchQuery ? 'Try a different search term' : 'Add your first conversation to get started'}
          icon={<MessageSquare size={48} color={colors.mutedForeground} />}
          action={
            onAddConversation
              ? {
                  label: 'Add Note',
                  onPress: () => onAddConversation('note'),
                }
              : undefined
          }
        />
      )}

      {/* FAB for adding conversations */}
      {onAddConversation && items.length > 0 && (
        <TouchableOpacity
          onPress={() => onAddConversation('note')}
          style={{
            position: 'absolute',
            bottom: SPACING.xl,
            right: SPACING.md,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...getShadowStyle(colors, { size: 'lg' }),
          }}
          accessibilityLabel="Add conversation"
        >
          <Plus size={ICON_SIZES.xl} color={colors.primaryForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default ConversationsView;
