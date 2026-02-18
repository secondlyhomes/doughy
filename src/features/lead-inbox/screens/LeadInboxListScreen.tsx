// src/features/lead-inbox/screens/LeadInboxListScreen.tsx
// Lead inbox list screen for RE Investor platform
// Displays lead conversations with AI-suggested responses for review
// Standalone tab screen (renamed from Focus tab)

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, SectionList, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  MessageSquare,
  Sparkles,
  AlertCircle,
  Clock,
  Check,
  WifiOff,
  Search,
} from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
  BottomSheet,
  BottomSheetSection,
  Button,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { ConversationCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';
import { useUnreadCounts } from '@/features/layout/hooks/useUnreadCounts';

import { useLeadInbox, useFilteredLeadInbox } from '../hooks/useLeadInbox';
import { LeadConversationCard } from '../components/LeadConversationCard';
import type {
  LeadInboxFilter,
  LeadInboxSort,
  LeadConversationListItem,
  InvestorConversationWithRelations,
} from '../types';
import {
  FILTER_OPTIONS,
  SORT_OPTIONS,
  QuickActionCard,
  SectionHeader,
  type LeadInboxSection,
} from './lead-inbox-list';

// Module-level separator component for SectionList
const ItemSeparator = () => <View style={{ height: SPACING.xs }} />;

export function LeadInboxListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
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

  // Create sections from conversations
  const sections: LeadInboxSection[] = useMemo(() => {
    if (activeFilter !== 'all' || debouncedSearch) {
      return [
        {
          title: activeFilter === 'ai_waiting' ? 'AI Waiting Approval' : 'Conversations',
          icon: MessageSquare,
          iconColor: colors.foreground,
          iconBgColor: colors.muted,
          data: filteredConversations,
        },
      ];
    }

    // Create pending map for quick lookup
    const pendingMap = new Map(
      pendingResponses.map((p) => [p.conversation_id, p])
    );

    // Categorize conversations
    const aiWaiting: LeadConversationListItem[] = [];
    const needsResponse: LeadConversationListItem[] = [];
    const recent: LeadConversationListItem[] = [];

    filteredConversations.forEach((conv) => {
      const pending = pendingMap.get(conv.id);

      if (pending) {
        // Spread conv and add the pending response (types are compatible after narrowing)
        aiWaiting.push({ ...conv, pendingResponse: pending });
      } else if (conv.unread_count > 0) {
        needsResponse.push(conv);
      } else {
        recent.push(conv);
      }
    });

    const result: LeadInboxSection[] = [];

    if (aiWaiting.length > 0) {
      result.push({
        title: 'AI Waiting Approval',
        icon: Sparkles,
        iconColor: colors.warning,
        iconBgColor: withOpacity(colors.warning, 'light'),
        description: 'Review and approve AI responses',
        data: aiWaiting,
      });
    }

    if (needsResponse.length > 0) {
      result.push({
        title: 'Needs Response',
        icon: AlertCircle,
        iconColor: colors.destructive,
        iconBgColor: withOpacity(colors.destructive, 'light'),
        description: 'Leads waiting for your reply',
        data: needsResponse,
      });
    }

    if (recent.length > 0) {
      result.push({
        title: 'Recent',
        icon: Clock,
        iconColor: colors.info,
        iconBgColor: withOpacity(colors.info, 'light'),
        data: recent,
      });
    }

    return result;
  }, [filteredConversations, pendingResponses, activeFilter, debouncedSearch, colors]);

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
        // This could happen if the response expired or was processed elsewhere
        console.warn('[LeadInboxListScreen] Quick approve failed: pending response not found', {
          conversationId,
          pendingCount: pendingResponses.length,
        });
        return;
      }

      const success = await quickApprove(pending.id);
      if (!success) {
        // Error is already set in the store, but log for debugging
        console.warn('[LeadInboxListScreen] Quick approve returned false', {
          conversationId,
          pendingId: pending.id,
        });
        // The error banner should display via the error state from useLeadInbox
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

  // Render section item
  const renderSectionItem = useCallback(
    ({ item, section }: { item: LeadConversationListItem; section: LeadInboxSection }) => {
      if (section.title === 'AI Waiting Approval') {
        const pending = pendingResponses.find((p) => p.conversation_id === item.id);
        return (
          <QuickActionCard
            conversation={item}
            pendingResponse={pending}
            onPress={() => handleConversationPress(item)}
            onQuickApprove={() => handleQuickApprove(item.id)}
            colors={colors}
          />
        );
      }

      return (
        <LeadConversationCard
          conversation={item}
          onPress={() => handleConversationPress(item)}
        />
      );
    },
    [handleConversationPress, handleQuickApprove, colors, pendingResponses]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: LeadInboxSection }) => (
      <SectionHeader section={section} colors={colors} />
    ),
    [colors]
  );

  const keyExtractor = useCallback(
    (item: LeadConversationListItem) => item.id,
    []
  );

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header - in normal flow */}
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
      {(error || subscriptionError) && (
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
          <Alert variant="destructive" icon={<WifiOff size={18} color={colors.destructive} />}>
            <AlertDescription variant="destructive">
              {error || subscriptionError}
            </AlertDescription>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
              <Button size="sm" variant="outline" onPress={handleRefresh}>
                Try Again
              </Button>
              <Button size="sm" variant="ghost" onPress={clearError}>
                Dismiss
              </Button>
            </View>
          </Alert>
        </View>
      )}

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
              icon={searchQuery ? Search : MessageSquare}
              title={searchQuery ? 'No Results Found' : 'No Conversations Yet'}
              description={
                searchQuery
                  ? 'No conversations match your search.'
                  : activeFilter === 'ai_waiting'
                  ? 'No AI responses waiting for approval.'
                  : 'Conversations with leads will appear here when they respond.'
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
        <BottomSheetSection title="Show">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilter === option.key;
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setActiveFilter(option.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.sm,
                    borderRadius: BORDER_RADIUS.full,
                    backgroundColor: isActive ? colors.primary : colors.muted,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <IconComponent
                    size={14}
                    color={isActive ? colors.primaryForeground : colors.foreground}
                  />
                  <Text
                    style={{
                      fontSize: FONT_SIZES.sm,
                      fontWeight: '500',
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

        <BottomSheetSection title="Sort By">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
            {SORT_OPTIONS.map((option) => {
              const isActive = activeSort === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setActiveSort(option.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.sm,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted,
                    borderWidth: isActive ? 1 : 0,
                    borderColor: isActive ? colors.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SIZES.sm,
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

        <View style={{ flexDirection: 'row', gap: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.lg }}>
          <Button variant="outline" onPress={handleClearFilters} style={{ flex: 1 }}>
            Clear Filters
          </Button>
          <Button onPress={() => setShowFiltersSheet(false)} style={{ flex: 1 }}>
            Done
          </Button>
        </View>
      </BottomSheet>
    </ThemedSafeAreaView>
  );
}

export default LeadInboxListScreen;
