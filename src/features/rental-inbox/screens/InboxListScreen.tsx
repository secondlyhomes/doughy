// src/features/rental-inbox/screens/InboxListScreen.tsx
// Inbox list screen for Landlord platform
// Displays conversations with AI-suggested responses for review

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MessageSquare,
  Bot,
  Clock,
  Filter,
  Search,
  AlertCircle,
  Check,
} from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
  BottomSheet,
  BottomSheetSection,
  Button,
} from '@/components/ui';
import { ConversationCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import { useInbox, useFilteredInbox } from '../hooks/useInbox';
import { ConversationCard } from '../components/ConversationCard';
import type { InboxFilter, InboxSort } from '../types';
import type { ConversationWithRelations } from '@/stores/rental-conversations-store';

// Search bar height calculation
const SEARCH_BAR_CONTAINER_HEIGHT = SPACING.sm + 40 + SPACING.xs;
const SEARCH_BAR_TO_CONTENT_GAP = SPACING.lg;

// Filter options
const FILTER_OPTIONS: { key: InboxFilter; label: string; icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { key: 'all', label: 'All', icon: MessageSquare },
  { key: 'needs_review', label: 'Needs Review', icon: AlertCircle },
  { key: 'archived', label: 'Archived', icon: Clock },
];

// Sort options
const SORT_OPTIONS: { key: InboxSort; label: string }[] = [
  { key: 'recent', label: 'Most Recent' },
  { key: 'pending_first', label: 'Pending First' },
  { key: 'oldest', label: 'Oldest First' },
];

export function InboxListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all');
  const [activeSort, setActiveSort] = useState<InboxSort>('pending_first');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Data hooks
  const { pendingCount, isLoading, isRefreshing, error, refresh, clearError } = useInbox();
  const filteredConversations = useFilteredInbox(activeFilter, activeSort, debouncedSearch);

  // Event handlers
  const handleConversationPress = useCallback(
    (conversation: ConversationWithRelations) => {
      router.push(`/(tabs)/inbox/${conversation.id}`);
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleClearFilters = useCallback(() => {
    setActiveFilter('all');
    setActiveSort('pending_first');
    setSearchQuery('');
  }, []);

  // Check if filters are active
  const hasActiveFilters = activeFilter !== 'all' || activeSort !== 'pending_first';

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: ConversationWithRelations & { hasPendingResponse?: boolean } }) => (
      <ConversationCard
        conversation={item}
        onPress={() => handleConversationPress(item)}
      />
    ),
    [handleConversationPress]
  );

  const keyExtractor = useCallback(
    (item: ConversationWithRelations) => item.id,
    []
  );

  const ItemSeparator = useCallback(
    () => <View style={{ height: SPACING.md }} />,
    []
  );

  // Pending review header
  const ListHeaderComponent = useMemo(() => {
    if (pendingCount === 0) return null;

    return (
      <TouchableOpacity
        onPress={() => setActiveFilter('needs_review')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: withOpacity(colors.warning, 'light'),
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.lg,
          marginBottom: SPACING.md,
          borderWidth: 1,
          borderColor: withOpacity(colors.warning, 'medium'),
        }}
        accessibilityRole="button"
        accessibilityLabel={`${pendingCount} AI responses need review`}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.warning,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.sm,
          }}
        >
          <Bot size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
            }}
          >
            {pendingCount} AI Response{pendingCount > 1 ? 's' : ''} Ready
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
            }}
          >
            Tap to review and approve suggested replies
          </Text>
        </View>
        <AlertCircle size={20} color={colors.warning} />
      </TouchableOpacity>
    );
  }, [pendingCount, colors, setActiveFilter]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Glass Search Bar */}
        <View
          className="absolute top-0 left-0 right-0 z-10"
          style={{ paddingTop: insets.top }}
        >
          <View className="px-4 pt-2 pb-1">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations..."
              size="md"
              glass={true}
              onFilter={() => setShowFiltersSheet(true)}
              hasActiveFilters={hasActiveFilters}
            />
          </View>
        </View>

        {/* Conversation List */}
        {isLoading && !filteredConversations.length ? (
          <View
            style={{
              paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
              paddingHorizontal: 16,
            }}
          >
            <SkeletonList count={5} component={ConversationCardSkeleton} />
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
              paddingHorizontal: 16,
              paddingBottom: TAB_BAR_SAFE_PADDING,
            }}
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.info}
              />
            }
            ListHeaderComponent={activeFilter === 'all' ? ListHeaderComponent : null}
            ListEmptyComponent={
              <ListEmptyState
                state={searchQuery ? 'filtered' : 'empty'}
                icon={searchQuery ? Search : MessageSquare}
                title={searchQuery ? 'No Results Found' : 'No Conversations Yet'}
                description={
                  searchQuery
                    ? 'No conversations match your search.'
                    : activeFilter === 'needs_review'
                    ? 'No AI responses waiting for review.'
                    : 'Conversations with guests and leads will appear here.'
                }
                primaryAction={{
                  label: searchQuery ? 'Clear Search' : 'Refresh',
                  onPress: searchQuery ? () => setSearchQuery('') : handleRefresh,
                }}
              />
            }
          />
        )}

        {/* Filters Bottom Sheet */}
        <BottomSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          title="Filter Conversations"
        >
          {/* Filter Options */}
          <BottomSheetSection title="Show">
            <View className="flex-row flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => {
                const isActive = activeFilter === option.key;
                const IconComponent = option.icon;
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setActiveFilter(option.key)}
                    className="px-4 py-2 rounded-full border flex-row items-center"
                    style={{
                      backgroundColor: isActive ? colors.primary : colors.muted,
                      borderColor: isActive ? colors.primary : colors.border,
                      gap: 6,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <IconComponent
                      size={14}
                      color={isActive ? colors.primaryForeground : colors.foreground}
                    />
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: isActive ? colors.primaryForeground : colors.foreground,
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Sort Options */}
          <BottomSheetSection title="Sort By">
            <View className="flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => {
                const isActive = activeSort === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setActiveSort(option.key)}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive
                        ? withOpacity(colors.primary, 'muted')
                        : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: isActive ? colors.primary : colors.foreground,
                      }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Action buttons */}
          <View className="flex-row gap-3 pt-4 pb-6">
            <Button variant="outline" onPress={handleClearFilters} className="flex-1">
              Clear Filters
            </Button>
            <Button onPress={() => setShowFiltersSheet(false)} className="flex-1">
              Done
            </Button>
          </View>
        </BottomSheet>
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default InboxListScreen;
