// src/features/rental-inbox/screens/InboxListScreen.tsx
// Inbox list screen for Landlord platform
// Displays conversations with AI-suggested responses for review
// Enhanced with sectioned layout: NEW LEADS, NEEDS REVIEW, AI HANDLED
// Now includes Leads|Residents toggle for focused communication

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, SectionList, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import {
  MessageSquare,
  Search,
  Check,
  UserPlus,
  WifiOff,
  Home,
} from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
  BottomSheet,
  BottomSheetSection,
  Button,
  Alert as AlertUI,
  AlertDescription,
} from '@/components/ui';
import { ConversationCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import { useInbox, useFilteredInbox } from '../hooks/useInbox';
import { ConversationCard } from '../components/ConversationCard';
import type { InboxFilter, InboxSort } from '../types';
import type { ConversationWithRelations } from '@/stores/rental-conversations-store';

import {
  InboxModeControl,
  QuickActionCard,
  SectionHeader,
  FILTER_OPTIONS,
  SORT_OPTIONS,
  type InboxMode,
  type InboxSection,
  type InboxConversation,
} from './inbox-list';

export function InboxListScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  // State
  const [inboxMode, setInboxMode] = useState<InboxMode>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all');
  const [activeSort, setActiveSort] = useState<InboxSort>('pending_first');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Data hooks
  const { pendingCount, pendingResponses, isLoading, isRefreshing, error, subscriptionError, refresh, quickApprove, clearError } = useInbox();
  const allConversations = useFilteredInbox(activeFilter, activeSort, debouncedSearch);

  // Filter conversations by mode (leads vs residents)
  const filteredConversations = useMemo(() => {
    return allConversations.filter((conv) => {
      const isLead = conv.contact?.contact_types?.includes('lead');
      if (inboxMode === 'leads') {
        // Show leads and new inquiries (contacts without type or with lead type)
        return isLead || !conv.contact?.contact_types?.length;
      } else {
        // Show residents (guests, tenants - anyone not primarily a lead)
        return !isLead && conv.contact?.contact_types?.length;
      }
    });
  }, [allConversations, inboxMode]);

  // Count for each mode (for badges)
  const modeCounts = useMemo(() => {
    let leads = 0;
    let residents = 0;
    allConversations.forEach((conv) => {
      const isLead = conv.contact?.contact_types?.includes('lead');
      if (isLead || !conv.contact?.contact_types?.length) {
        leads++;
      } else {
        residents++;
      }
    });
    return { leads, residents };
  }, [allConversations]);

  // Create sections from conversations
  const sections: InboxSection[] = useMemo(() => {
    if (activeFilter !== 'all' || debouncedSearch) {
      // When filtered or searching, show flat list
      return [
        {
          title: activeFilter === 'needs_review' ? 'Needs Review' : 'Conversations',
          icon: MessageSquare,
          iconColor: colors.foreground,
          iconBgColor: colors.muted,
          data: filteredConversations as InboxConversation[],
        },
      ];
    }

    // Create pending map for quick lookup
    const pendingMap = new Map(
      pendingResponses.map((p) => [p.conversation_id, p])
    );

    // Categorize conversations
    const newLeads: InboxConversation[] = [];
    const needsReview: InboxConversation[] = [];
    const otherActive: InboxConversation[] = [];

    filteredConversations.forEach((conv) => {
      const pending = pendingMap.get(conv.id);
      const isLead = conv.contact?.contact_types?.includes('lead');

      if (pending) {
        // Has pending AI response
        if (isLead) {
          newLeads.push({ ...conv, pendingResponse: pending, hasPendingResponse: true });
        } else {
          needsReview.push({ ...conv, pendingResponse: pending, hasPendingResponse: true });
        }
      } else if (conv.status === 'active') {
        // Check if recently AI-handled (last message was AI)
        // For now, just add to active
        otherActive.push(conv as InboxConversation);
      } else {
        otherActive.push(conv as InboxConversation);
      }
    });

    const result: InboxSection[] = [];

    if (newLeads.length > 0) {
      result.push({
        title: 'New Leads',
        icon: UserPlus,
        iconColor: colors.success,
        iconBgColor: withOpacity(colors.success, 'light'),
        description: 'AI responded - follow up recommended',
        data: newLeads,
      });
    }

    if (needsReview.length > 0) {
      result.push({
        title: 'Needs Your Review',
        icon: MessageSquare,
        iconColor: colors.warning,
        iconBgColor: withOpacity(colors.warning, 'light'),
        description: 'AI responses waiting for approval',
        data: needsReview,
      });
    }

    if (otherActive.length > 0) {
      result.push({
        title: 'Active Conversations',
        icon: MessageSquare,
        iconColor: colors.info,
        iconBgColor: withOpacity(colors.info, 'light'),
        data: otherActive,
      });
    }

    return result;
  }, [filteredConversations, pendingResponses, activeFilter, debouncedSearch, colors]);

  // Event handlers
  const handleConversationPress = useCallback(
    (conversation: ConversationWithRelations) => {
      router.push(`/(tabs)/landlord-inbox/${conversation.id}`);
    },
    [router]
  );

  const handleQuickApprove = useCallback(
    async (conversationId: string) => {
      const pending = pendingResponses.find((p) => p.conversation_id === conversationId);
      if (!pending) {
        // Provide user feedback when pending response not found (may have been processed)
        Alert.alert('Already Processed', 'This response has already been approved or expired.');
        return;
      }

      try {
        const success = await quickApprove(pending.id);
        if (!success) {
          Alert.alert('Approval Failed', 'Could not approve this response. It may have expired.');
        }
      } catch (err) {
        console.error('[InboxListScreen] Quick approve error:', err);
        Alert.alert('Error', 'Failed to approve response. Please try again.');
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

  // Check if filters are active
  const hasActiveFilters = activeFilter !== 'all' || activeSort !== 'pending_first';

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
        {(error || subscriptionError) && (
          <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
            <AlertUI variant="destructive" icon={<WifiOff size={18} color={colors.destructive} />}>
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
            </AlertUI>
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
