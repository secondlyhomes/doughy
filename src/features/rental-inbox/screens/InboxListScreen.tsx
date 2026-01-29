// src/features/rental-inbox/screens/InboxListScreen.tsx
// Inbox list screen for Landlord platform
// Displays conversations with AI-suggested responses for review
// Enhanced with sectioned layout: NEW LEADS, NEEDS REVIEW, AI HANDLED

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, SectionList } from 'react-native';
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
  Sparkles,
  UserPlus,
  CheckCircle2,
  ChevronRight,
  WifiOff,
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
import { useThemeColors, ThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import { useInbox, useFilteredInbox } from '../hooks/useInbox';
import { ConversationCard } from '../components/ConversationCard';
import type { InboxFilter, InboxSort } from '../types';
import type { ConversationWithRelations, AIResponseQueueItem } from '@/stores/rental-conversations-store';

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

// Extended conversation type for inbox with pending response
// hasPendingResponse comes from useFilteredInbox (always present)
// pendingResponse is added when conversation has a pending AI response
type InboxConversation = ConversationWithRelations & {
  hasPendingResponse: boolean;
  pendingResponse?: AIResponseQueueItem;
};

// Section type for the sectioned inbox
interface InboxSection {
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  iconBgColor: string;
  description?: string;
  data: InboxConversation[];
}

// Quick Action Card for AI responses
function QuickActionCard({
  conversation,
  pendingResponse,
  onPress,
  onQuickApprove,
  colors,
}: {
  conversation: ConversationWithRelations;
  pendingResponse?: AIResponseQueueItem;
  onPress: () => void;
  onQuickApprove: () => void;
  colors: ThemeColors;
}) {
  const contactName = conversation.contact
    ? `${conversation.contact.first_name || ''} ${conversation.contact.last_name || ''}`.trim() || 'Unknown'
    : 'Unknown';

  // Confidence is 0-1 scale (not 0-100), matches AIReviewCard thresholds
  const confidence = pendingResponse?.confidence || 0;
  const confidencePercent = Math.round(confidence * 100);
  const isHighConfidence = confidence >= 0.85;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: withOpacity(isHighConfidence ? colors.success : colors.warning, 'medium'),
      }}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${contactName}, ${confidencePercent}% confidence`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm }}>
        {/* Avatar */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.muted,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>
            {contactName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
              {contactName}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: withOpacity(isHighConfidence ? colors.success : colors.warning, 'light'),
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: BORDER_RADIUS.full,
              }}
            >
              <Sparkles size={12} color={isHighConfidence ? colors.success : colors.warning} />
              <Text
                style={{
                  color: isHighConfidence ? colors.success : colors.warning,
                  fontSize: FONT_SIZES['2xs'],
                  fontWeight: '600',
                }}
              >
                {confidencePercent}%
              </Text>
            </View>
          </View>

          {/* Platform and time */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: 2 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
              {conversation.platform || conversation.channel}
            </Text>
            {conversation.contact?.contact_types?.includes('lead') && (
              <View
                style={{
                  backgroundColor: withOpacity(colors.info, 'light'),
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: BORDER_RADIUS.sm,
                }}
              >
                <Text style={{ color: colors.info, fontSize: FONT_SIZES['2xs'], fontWeight: '600' }}>Lead</Text>
              </View>
            )}
          </View>

          {/* AI suggested response preview */}
          {pendingResponse && (
            <Text
              numberOfLines={2}
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.sm,
                marginTop: SPACING.xs,
                fontStyle: 'italic',
              }}
            >
              "{pendingResponse.suggested_response.slice(0, 100)}..."
            </Text>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm }}>
        <TouchableOpacity
          onPress={onPress}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: colors.muted,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>View</Text>
        </TouchableOpacity>

        {isHighConfidence && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onQuickApprove();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: colors.primary,
            }}
          >
            <Check size={14} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>
              Quick Approve
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Section Header Component
function SectionHeader({
  section,
  colors,
  collapsed,
  onToggle,
}: {
  section: InboxSection;
  colors: ThemeColors;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const IconComponent = section.icon;

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={!onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        marginTop: SPACING.md,
        marginBottom: SPACING.xs,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: section.iconBgColor,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: SPACING.sm,
        }}
      >
        <IconComponent size={18} color={section.iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {section.title}
        </Text>
        {section.description && (
          <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
            {section.description}
          </Text>
        )}
      </View>
      <View
        style={{
          backgroundColor: section.iconBgColor,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: BORDER_RADIUS.full,
        }}
      >
        <Text style={{ color: section.iconColor, fontWeight: '600', fontSize: FONT_SIZES.sm }}>
          {section.data.length}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

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
  const { pendingCount, pendingResponses, isLoading, isRefreshing, error, subscriptionError, refresh, quickApprove, clearError } = useInbox();
  const filteredConversations = useFilteredInbox(activeFilter, activeSort, debouncedSearch);

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
    const aiHandled: InboxConversation[] = [];
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
        icon: AlertCircle,
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
      if (pending) {
        await quickApprove(pending.id);
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
    ({ section }: { section: InboxSection }) => (
      <SectionHeader section={section} colors={colors} />
    ),
    [colors]
  );

  const keyExtractor = useCallback(
    (item: ConversationWithRelations) => item.id,
    []
  );

  const ItemSeparator = useCallback(
    () => <View style={{ height: SPACING.xs }} />,
    []
  );

  // Stats banner removed - section headers already show counts,
  // having both was confusing the UX flow

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

        {/* Error Banner */}
        {(error || subscriptionError) && (
          <View
            style={{
              paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SPACING.sm,
              paddingHorizontal: SPACING.md,
            }}
          >
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
          <View
            style={{
              paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
              paddingHorizontal: 16,
            }}
          >
            <SkeletonList count={5} component={ConversationCardSkeleton} />
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderSectionItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={keyExtractor}
            stickySectionHeadersEnabled={false}
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
