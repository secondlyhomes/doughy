// src/features/lead-inbox/screens/LeadInboxListScreen.tsx
// Lead inbox list screen for RE Investor platform
// Displays lead conversations with AI-suggested responses for review
// Standalone tab screen (renamed from Focus tab)

import React, { useState, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedSafeAreaView } from '@/components';
import { SearchBar } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';
import { useUnreadCounts } from '@/features/layout/hooks/useUnreadCounts';

import { useLeadInbox, useFilteredLeadInbox } from '../hooks/useLeadInbox';
import type {
  LeadInboxFilter,
  LeadInboxSort,
  InvestorConversationWithRelations,
} from '../types';
import {
  useLeadInboxSections,
  ErrorBanner,
  FiltersSheet,
  ConversationSectionList,
} from './lead-inbox-list';

export function LeadInboxListScreen() {
  const router = useRouter();
  const { setInvestorInbox } = useUnreadCounts();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<LeadInboxFilter>('all');
  const [activeSort, setActiveSort] = useState<LeadInboxSort>('pending_first');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Data hooks
  const { pendingCount, unreadCount, pendingResponses, isLoading, isRefreshing, error, subscriptionError, refresh, quickApprove, clearError } = useLeadInbox();
  const filteredConversations = useFilteredLeadInbox(activeFilter, activeSort, debouncedSearch);
  const sections = useLeadInboxSections(filteredConversations, pendingResponses, activeFilter, debouncedSearch);

  // Sync investor inbox badge count with pending + unread
  useEffect(() => {
    const totalCount = pendingCount + unreadCount;

    // Validate the count is a valid number
    if (typeof totalCount !== 'number' || isNaN(totalCount) || totalCount < 0) {
      console.error('[LeadInboxListScreen] Invalid badge count calculated', {
        pendingCount,
        unreadCount,
        totalCount,
      });
      return;
    }

    setInvestorInbox(totalCount);
  }, [pendingCount, unreadCount, setInvestorInbox]);

  // Event handlers
  const handleConversationPress = useCallback(
    (conversation: InvestorConversationWithRelations) => {
      router.push(`/(tabs)/investor-inbox/${conversation.id}`);
    },
    [router]
  );

  const handleQuickApprove = useCallback(
    async (conversationId: string) => {
      const pending = pendingResponses.find((p) => p.conversation_id === conversationId);
      if (!pending) {
        console.warn('[LeadInboxListScreen] Quick approve failed: pending response not found', {
          conversationId,
          pendingCount: pendingResponses.length,
        });
        return;
      }

      const success = await quickApprove(pending.id);
      if (!success) {
        console.warn('[LeadInboxListScreen] Quick approve returned false', {
          conversationId,
          pendingId: pending.id,
        });
      }
    },
    [quickApprove, pendingResponses]
  );

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleClearFilters = useCallback(() => {
    setActiveFilter('all');
    setActiveSort('pending_first');
    setSearchQuery('');
  }, []);

  const hasActiveFilters = activeFilter !== 'all' || activeSort !== 'pending_first';

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm }}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search leads..."
          size="md"
          glass={true}
          onFilter={() => setShowFiltersSheet(true)}
          hasActiveFilters={hasActiveFilters}
        />
      </View>

      {/* Error Banner */}
      <ErrorBanner
        error={error}
        subscriptionError={subscriptionError}
        onRetry={handleRefresh}
        onDismiss={clearError}
      />

      {/* Conversation List */}
      <ConversationSectionList
        sections={sections}
        pendingResponses={pendingResponses}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        filteredCount={filteredConversations.length}
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        onConversationPress={handleConversationPress}
        onQuickApprove={handleQuickApprove}
        onRefresh={handleRefresh}
        onClearSearch={() => setSearchQuery('')}
      />

      {/* Filters Bottom Sheet */}
      <FiltersSheet
        visible={showFiltersSheet}
        onClose={() => setShowFiltersSheet(false)}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activeSort={activeSort}
        onSortChange={setActiveSort}
        onClearFilters={handleClearFilters}
      />
    </ThemedSafeAreaView>
  );
}

export default LeadInboxListScreen;
