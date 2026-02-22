// src/features/conversations/components/ConversationItemCard.tsx
// Expandable card for a single conversation item (SMS, call, voice memo, email, note)

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { Badge } from '@/components/ui';
import { ConversationItem, TYPE_CONFIG } from './conversation-types';

// ============================================
// Conversation Item Component
// ============================================

export interface ConversationItemCardProps {
  item: ConversationItem;
  onPress: () => void;
}

export function ConversationItemCard({ item, onPress }: ConversationItemCardProps) {
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
