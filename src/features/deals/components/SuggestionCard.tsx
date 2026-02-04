// src/features/deals/components/SuggestionCard.tsx
// AI Suggestion Card - Zone G Week 9
// Displays AI-generated suggestions with actionable buttons

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Phone,
  Camera,
  Calculator,
  FileText,
  MessageCircle,
  CheckCircle,
  Clock,
  FolderPlus,
  BarChart2,
  ChevronRight,
  X,
  Lightbulb,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from 'react-native-reanimated';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES, PRESS_OPACITY, DEFAULT_HIT_SLOP } from '@/constants/design-tokens';
import { Badge } from '@/components/ui';
import { AISuggestion } from '../services/ai-suggestions';
import { ActionCategory } from '../hooks/useNextAction';

// ============================================
// Types
// ============================================

export interface SuggestionCardProps {
  suggestion: AISuggestion;
  onAction: (suggestion: AISuggestion) => void;
  onDismiss?: (suggestion: AISuggestion) => void;
  index?: number;
  compact?: boolean;
}

export interface SuggestionListProps {
  suggestions: AISuggestion[];
  onAction: (suggestion: AISuggestion) => void;
  onDismiss?: (suggestion: AISuggestion) => void;
  title?: string;
  maxVisible?: number;
}

// ============================================
// Category Config
// ============================================

const CATEGORY_CONFIG: Record<ActionCategory, {
  icon: typeof Phone;
  color: string;
  label: string;
}> = {
  contact: { icon: Phone, color: '#3B82F6', label: 'Contact' },
  analyze: { icon: BarChart2, color: '#8B5CF6', label: 'Analyze' },
  walkthrough: { icon: Camera, color: '#F59E0B', label: 'Walkthrough' },
  underwrite: { icon: Calculator, color: '#10B981', label: 'Underwrite' },
  offer: { icon: FileText, color: '#EC4899', label: 'Offer' },
  negotiate: { icon: MessageCircle, color: '#6366F1', label: 'Negotiate' },
  close: { icon: CheckCircle, color: '#22C55E', label: 'Close' },
  followup: { icon: Clock, color: '#F97316', label: 'Follow-up' },
  document: { icon: FolderPlus, color: '#64748B', label: 'Document' },
};

// ============================================
// Priority Badge
// ============================================

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const colors = useThemeColors();

  const config = {
    high: { label: 'High', color: colors.destructive },
    medium: { label: 'Medium', color: colors.warning },
    low: { label: 'Low', color: colors.mutedForeground },
  };

  const { label, color } = config[priority];

  return (
    <View
      style={{
        paddingHorizontal: SPACING.xs,
        paddingVertical: SPACING.xxs,
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: withOpacity(color, 'subtle'),
      }}
    >
      <Text style={{ fontSize: FONT_SIZES['2xs'], fontWeight: '600', color }}>
        {label}
      </Text>
    </View>
  );
}

// ============================================
// Confidence Indicator
// ============================================

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const colors = useThemeColors();

  const getColor = () => {
    if (confidence >= 80) return colors.success;
    if (confidence >= 60) return colors.warning;
    return colors.mutedForeground;
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs }}>
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: getColor(),
        }}
      />
      <Text style={{ fontSize: FONT_SIZES['2xs'], color: colors.mutedForeground }}>
        {confidence}%
      </Text>
    </View>
  );
}

// ============================================
// Single Suggestion Card
// ============================================

export function SuggestionCard({
  suggestion,
  onAction,
  onDismiss,
  index = 0,
  compact = false,
}: SuggestionCardProps) {
  const colors = useThemeColors();
  const categoryConfig = CATEGORY_CONFIG[suggestion.category] || CATEGORY_CONFIG.followup;
  const Icon = categoryConfig.icon;

  const handleAction = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction(suggestion);
  }, [suggestion, onAction]);

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.(suggestion);
  }, [suggestion, onDismiss]);

  if (compact) {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        exiting={FadeOutUp}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          onPress={handleAction}
          activeOpacity={PRESS_OPACITY.DEFAULT}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.sm,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            gap: SPACING.sm,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: withOpacity(categoryConfig.color, 'muted'),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={14} color={categoryConfig.color} />
          </View>
          <Text
            style={{ flex: 1, fontSize: FONT_SIZES.sm, color: colors.foreground }}
            numberOfLines={1}
          >
            {suggestion.action}
          </Text>
          <ChevronRight size={ICON_SIZES.md} color={colors.mutedForeground} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      exiting={FadeOutUp}
      layout={Layout.springify()}
      style={{
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...getShadowStyle(colors, { size: 'sm' }),
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
          paddingBottom: SPACING.sm,
          gap: SPACING.sm,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: withOpacity(categoryConfig.color, 'light'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={categoryConfig.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
            <Badge variant="outline" size="sm">
              {categoryConfig.label}
            </Badge>
            <PriorityBadge priority={suggestion.priority} />
            <View style={{ flex: 1 }} />
            <ConfidenceIndicator confidence={suggestion.confidence} />
          </View>
        </View>
        {onDismiss && (
          <TouchableOpacity
            onPress={handleDismiss}
            hitSlop={DEFAULT_HIT_SLOP}
          >
            <X size={ICON_SIZES.md} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Action */}
      <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
          {suggestion.action}
        </Text>
      </View>

      {/* Reason */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACING.md,
          paddingBottom: SPACING.md,
          gap: SPACING.xs,
        }}
      >
        <Lightbulb size={12} color={colors.mutedForeground} />
        <Text style={{ fontSize: 12, color: colors.mutedForeground, flex: 1 }}>
          {suggestion.reason}
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={handleAction}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.xs,
          paddingVertical: SPACING.sm,
          backgroundColor: withOpacity(categoryConfig.color, 'subtle'),
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: categoryConfig.color }}>
          Take Action
        </Text>
        <ChevronRight size={ICON_SIZES.md} color={categoryConfig.color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// Suggestion List
// ============================================

export function SuggestionList({
  suggestions,
  onAction,
  onDismiss,
  title = 'AI Suggestions',
  maxVisible = 3,
}: SuggestionListProps) {
  const colors = useThemeColors();
  const visibleSuggestions = suggestions.slice(0, maxVisible);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: SPACING.md }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
        <Sparkles size={ICON_SIZES.sm} color={colors.primary} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
          {title}
        </Text>
        {suggestions.length > maxVisible && (
          <Badge variant="secondary" size="sm">
            +{suggestions.length - maxVisible} more
          </Badge>
        )}
      </View>

      {/* Cards */}
      <View style={{ gap: SPACING.sm }}>
        {visibleSuggestions.map((suggestion, index) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAction={onAction}
            onDismiss={onDismiss}
            index={index}
            compact={suggestions.length > 2}
          />
        ))}
      </View>
    </View>
  );
}

// ============================================
// Compact Suggestion Banner
// ============================================

export function SuggestionBanner({
  suggestion,
  onAction,
}: {
  suggestion: AISuggestion;
  onAction: (suggestion: AISuggestion) => void;
}) {
  const colors = useThemeColors();
  const categoryConfig = CATEGORY_CONFIG[suggestion.category] || CATEGORY_CONFIG.followup;
  const Icon = categoryConfig.icon;

  const handleAction = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction(suggestion);
  }, [suggestion, onAction]);

  return (
    <TouchableOpacity
      onPress={handleAction}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: withOpacity(colors.primary, 'subtle'),
        borderWidth: 1,
        borderColor: withOpacity(colors.primary, 'light'),
        gap: SPACING.sm,
      }}
    >
      <Sparkles size={ICON_SIZES.md} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: FONT_SIZES.sm, fontWeight: '500', color: colors.foreground }}
          numberOfLines={1}
        >
          {suggestion.action}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: SPACING.sm,
          paddingVertical: SPACING.xs,
          borderRadius: BORDER_RADIUS.full,
          backgroundColor: colors.primary,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primaryForeground }}>
          Go
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default SuggestionCard;
