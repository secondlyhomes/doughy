// src/features/rental-inbox/screens/InboxListScreen.tsx
// Inbox list screen for Landlord platform
// Displays conversations with AI-suggested responses for review
// Enhanced with sectioned layout: NEW LEADS, NEEDS REVIEW, AI HANDLED
// Now includes Leads|Residents toggle for focused communication

import React, { useCallback } from 'react';
import { View, RefreshControl, SectionList } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Search, UserPlus, Home } from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { SearchBar, ListEmptyState, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { ConversationCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { SPACING } from '@/constants/design-tokens';

import { ConversationCard } from '../components/ConversationCard';
import type { ConversationWithRelations } from '@/stores/rental-conversations-store';

import {
  InboxModeControl,
  QuickActionCard,
  SectionHeader,
  InboxFiltersSheet,
  InboxErrorBanner,
  useInboxListState,
  type InboxConversation,
  type InboxSection,
} from './inbox-list';

export function InboxListScreen() {
  const {
    inboxMode,
    setInboxMode,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    activeSort,
    setActiveSort,
    showFiltersSheet,
    setShowFiltersSheet,
    isLoading,
    isRefreshing,
    error,
    subscriptionError,
    filteredConversations,
    modeCounts,
    sections,
    colors,
    hasActiveFilters,
    handleConversationPress,
    handleQuickApprove,
    handleRefresh,
    handleClearFilters,
    clearError,
  } = useInboxListState();

  // Render section item
  const renderSectionItem = useCallback(
    ({ item, section }: { item: InboxConversation; section: InboxSection }) => {
      // For leads and needs review sections, use quick action cards
      if (section.title === 'New Leads' || section.title === 'Needs Your Review') {
        return (
          <QuickActionCard
            conversation={item}
            pendingResponse={item.pendingResponse}
            onPress={() => handleConversationPress(item)}
            onQuickApprove={() => handleQuickApprove(item.id)}
            colors={colors}
          />
        );
      }

      // Regular conversation card for other sections
      return (
        <ConversationCard
          conversation={item}
          onPress={() => handleConversationPress(item)}
        />
      );
    },
    [handleConversationPress, handleQuickApprove, colors]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: InboxSection }) => {
      const isFirst = sections.indexOf(section) === 0;
      return <SectionHeader section={section} colors={colors} isFirst={isFirst} />;
    },
    [colors, sections]
  );

  const keyExtractor = useCallback(
    (item: ConversationWithRelations) => item.id,
    []
  );

  const ItemSeparator = useCallback(
    () => <View style={{ height: SPACING.md }} />,
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Header - in normal flow */}
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm }}>
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
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
          <InboxModeControl
            value={inboxMode}
            onChange={setInboxMode}
            leadCount={modeCounts.leads}
            residentCount={modeCounts.residents}
          />
        </View>

        {/* Error Banner */}
        <InboxErrorBanner
          error={error}
          subscriptionError={subscriptionError}
          onRetry={handleRefresh}
          onDismiss={clearError}
          colors={colors}
        />

        {/* Conversation List */}
        {isLoading && !filteredConversations.length ? (
          <View style={{ paddingHorizontal: SPACING.md }}>
            <SkeletonList count={5} component={ConversationCardSkeleton} />
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderSectionItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={keyExtractor}
            stickySectionHeadersEnabled={false}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingHorizontal: SPACING.md,
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
            ListEmptyComponent={
              <ListEmptyState
                state={searchQuery ? 'filtered' : 'empty'}
                icon={searchQuery ? Search : inboxMode === 'leads' ? UserPlus : Home}
                title={searchQuery ? 'No Results Found' : inboxMode === 'leads' ? 'No Leads Yet' : 'No Residents Yet'}
                description={
                  searchQuery
                    ? 'No conversations match your search.'
                    : activeFilter === 'needs_review'
                    ? 'No AI responses waiting for review.'
                    : inboxMode === 'leads'
                    ? 'New inquiries and prospective tenants will appear here.'
                    : 'Conversations with current tenants and guests will appear here.'
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
        <InboxFiltersSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          onClearFilters={handleClearFilters}
          colors={colors}
        />
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default InboxListScreen;
