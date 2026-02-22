// src/features/lead-inbox/screens/lead-inbox-list/ConversationSectionList.tsx
// SectionList wrapper for lead inbox conversations with render callbacks

import React, { useCallback } from 'react';
import { View, SectionList, RefreshControl } from 'react-native';
import { MessageSquare, Search } from 'lucide-react-native';

import { ListEmptyState, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { ConversationCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';

import { LeadConversationCard } from '../../components/LeadConversationCard';
import type {
  LeadConversationListItem,
  InvestorConversationWithRelations,
  InvestorAIQueueItem,
} from '../../types';

import { QuickActionCard } from './QuickActionCard';
import { SectionHeader } from './SectionHeader';
import type { LeadInboxSection } from './types';

// Module-level separator component for SectionList
const ItemSeparator = () => <View style={{ height: SPACING.xs }} />;

export interface ConversationSectionListProps {
  sections: LeadInboxSection[];
  pendingResponses: InvestorAIQueueItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  filteredCount: number;
  searchQuery: string;
  activeFilter: string;
  onConversationPress: (conversation: InvestorConversationWithRelations) => void;
  onQuickApprove: (conversationId: string) => void;
  onRefresh: () => void;
  onClearSearch: () => void;
}

export function ConversationSectionList({
  sections,
  pendingResponses,
  isLoading,
  isRefreshing,
  filteredCount,
  searchQuery,
  activeFilter,
  onConversationPress,
  onQuickApprove,
  onRefresh,
  onClearSearch,
}: ConversationSectionListProps) {
  const colors = useThemeColors();

  const renderSectionItem = useCallback(
    ({ item, section }: { item: LeadConversationListItem; section: LeadInboxSection }) => {
      if (section.title === 'AI Waiting Approval') {
        const pending = pendingResponses.find((p) => p.conversation_id === item.id);
        return (
          <QuickActionCard
            conversation={item}
            pendingResponse={pending}
            onPress={() => onConversationPress(item)}
            onQuickApprove={() => onQuickApprove(item.id)}
            colors={colors}
          />
        );
      }

      return (
        <LeadConversationCard
          conversation={item}
          onPress={() => onConversationPress(item)}
        />
      );
    },
    [onConversationPress, onQuickApprove, colors, pendingResponses]
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

  if (isLoading && !filteredCount) {
    return (
      <View style={{ paddingHorizontal: SPACING.md }}>
        <SkeletonList count={5} component={ConversationCardSkeleton} />
      </View>
    );
  }

  return (
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
          onRefresh={onRefresh}
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
            onPress: searchQuery ? onClearSearch : onRefresh,
          }}
        />
      }
    />
  );
}
