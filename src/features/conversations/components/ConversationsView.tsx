// src/features/conversations/components/ConversationsView.tsx
// Unified Conversation Timeline - Zone G Week 8
// Shows all conversations (SMS, calls, voice memos, notes) in chronological order

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import {
  MessageSquare,
  Phone,
  Mic,
  Mail,
  StickyNote,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Plus,
  Search,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { Badge, SearchBar, EmptyState, LoadingSpinner } from '@/components/ui';

// ============================================
// Types
// ============================================

export type ConversationType = 'sms' | 'call' | 'voice_memo' | 'email' | 'note';
export type ConversationDirection = 'inbound' | 'outbound' | 'internal';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface ConversationItem {
  id: string;
  type: ConversationType;
  direction: ConversationDirection;
  content?: string;
  transcript?: string;
  subject?: string;
  duration_seconds?: number;
  sentiment?: Sentiment;
  key_phrases?: string[];
  action_items?: string[];
  ai_summary?: string;
  occurred_at: string;
  created_at: string;
}

export interface ConversationsViewProps {
  items: ConversationItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddConversation?: (type: ConversationType) => void;
  onItemPress?: (item: ConversationItem) => void;
  /** Pagination: callback when user scrolls near the end */
  onLoadMore?: () => void;
  /** Pagination: whether there are more items to load */
  hasMore?: boolean;
  /** Pagination: whether more items are currently loading */
  isLoadingMore?: boolean;
}

// ============================================
// Type Config
// ============================================

const TYPE_CONFIG: Record<ConversationType, {
  icon: React.ComponentType<any>;
  label: string;
  color: string;
}> = {
  sms: { icon: MessageSquare, label: 'SMS', color: '#3B82F6' },
  call: { icon: Phone, label: 'Call', color: '#10B981' },
  voice_memo: { icon: Mic, label: 'Voice Memo', color: '#8B5CF6' },
  email: { icon: Mail, label: 'Email', color: '#F59E0B' },
  note: { icon: StickyNote, label: 'Note', color: '#6B7280' },
};

// ============================================
// Conversation Item Component
// ============================================

interface ConversationItemCardProps {
  item: ConversationItem;
  onPress: () => void;
}

function ConversationItemCard({ item, onPress }: ConversationItemCardProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const toggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => !prev);
  }, []);

  // Format duration for calls/voice memos
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Get sentiment icon
  const getSentimentIcon = () => {
    switch (item.sentiment) {
      case 'positive':
        return <TrendingUp size={12} color={colors.success} />;
      case 'negative':
        return <TrendingDown size={12} color={colors.destructive} />;
      default:
        return <Minus size={12} color={colors.mutedForeground} />;
    }
  };

  // Get display content
  const displayContent = item.content || item.transcript || item.ai_summary || 'No content';

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
        ...getShadowStyle(colors, { size: 'sm' }),
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
          gap: SPACING.sm,
        }}
      >
        {/* Type Icon */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: withOpacity(config.color, 'muted'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={config.color} />
        </View>

        {/* Content Preview */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              {config.label}
            </Text>
            {item.direction && (
              <Badge variant={item.direction === 'inbound' ? 'secondary' : 'outline'} size="sm">
                {item.direction === 'inbound' ? 'In' : item.direction === 'outbound' ? 'Out' : 'Note'}
              </Badge>
            )}
            {item.sentiment && getSentimentIcon()}
          </View>
          <Text
            style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}
            numberOfLines={expanded ? undefined : 2}
          >
            {displayContent}
          </Text>
        </View>

        {/* Time & Duration */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            {formatTime(item.occurred_at)}
          </Text>
          {item.duration_seconds && (
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {formatDuration(item.duration_seconds)}
            </Text>
          )}
        </View>
      </View>

      {/* Expandable Content */}
      {(item.key_phrases?.length || item.action_items?.length || item.transcript) && (
        <TouchableOpacity onPress={toggleExpand} style={{ paddingHorizontal: SPACING.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: SPACING.xs,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            {expanded ? (
              <ChevronUp size={ICON_SIZES.md} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={ICON_SIZES.md} color={colors.mutedForeground} />
            )}
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginLeft: SPACING.xs }}>
              {expanded ? 'Less' : 'More details'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Expanded Content */}
      {expanded && (
        <View
          style={{
            padding: SPACING.md,
            paddingTop: 0,
            gap: SPACING.sm,
          }}
        >
          {/* Transcript */}
          {item.transcript && item.transcript !== item.content && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                TRANSCRIPT
              </Text>
              <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 18 }}>
                {item.transcript}
              </Text>
            </View>
          )}

          {/* Key Phrases */}
          {item.key_phrases && item.key_phrases.length > 0 && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                KEY PHRASES
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
                {item.key_phrases.map((phrase, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {phrase}
                  </Badge>
                ))}
              </View>
            </View>
          )}

          {/* Action Items */}
          {item.action_items && item.action_items.length > 0 && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                ACTION ITEMS
              </Text>
              {item.action_items.map((action, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                  <Text style={{ color: colors.primary, marginRight: SPACING.xs }}>•</Text>
                  <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>{action}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================
// Filter Chips
// ============================================

interface FilterChipsProps {
  activeFilters: ConversationType[];
  onToggleFilter: (type: ConversationType) => void;
}

function FilterChips({ activeFilters, onToggleFilter }: FilterChipsProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        gap: SPACING.xs,
      }}
    >
      {Object.entries(TYPE_CONFIG).map(([type, config]) => {
        const isActive = activeFilters.length === 0 || activeFilters.includes(type as ConversationType);
        return (
          <TouchableOpacity
            key={type}
            onPress={() => onToggleFilter(type as ConversationType)}
            style={{
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xs,
              borderRadius: BORDER_RADIUS.full,
              backgroundColor: isActive ? withOpacity(config.color, 'light') : colors.muted,
              borderWidth: 1,
              borderColor: isActive ? config.color : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: isActive ? config.color : colors.mutedForeground,
              }}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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
