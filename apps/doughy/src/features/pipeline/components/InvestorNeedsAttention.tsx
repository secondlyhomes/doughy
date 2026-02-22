// src/features/pipeline/components/InvestorNeedsAttention.tsx
// "Needs Attention" section for investor module - shows urgent deal actions
// ADHD-friendly: color-coded urgency, cards over tables, progressive disclosure

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  AlertTriangle,
  Clock,
  Briefcase,
  Phone,
  FileText,
  ChevronRight,
  CheckCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  ICON_SIZES,
  PRESS_OPACITY,
  GLASS_INTENSITY,
} from '@/constants/design-tokens';
import { GlassView } from '@/components/ui/GlassView';

export interface InvestorAttentionItem {
  id: string;
  type: 'overdue_action' | 'follow_up' | 'deal_stale' | 'offer_pending';
  title: string;
  subtitle: string;
  urgency: 'high' | 'medium' | 'low';
  onPress: () => void;
}

interface InvestorNeedsAttentionProps {
  items: InvestorAttentionItem[];
  isLoading?: boolean;
}

export function InvestorNeedsAttention({ items, isLoading }: InvestorNeedsAttentionProps) {
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AlertTriangle size={ICON_SIZES.md} color={colors.warning} />
          <Text style={[styles.headerText, { color: colors.foreground }]}>
            Needs Attention
          </Text>
        </View>
        <GlassView intensity={GLASS_INTENSITY.light} style={[styles.emptyCard, { borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Loading...
          </Text>
        </GlassView>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <GlassView intensity={GLASS_INTENSITY.light} style={[styles.allClearCard, { borderColor: colors.border }]}>
          <CheckCircle size={ICON_SIZES.xl} color={colors.success} />
          <View style={styles.allClearText}>
            <Text style={[styles.allClearTitle, { color: colors.foreground }]}>
              All caught up!
            </Text>
            <Text style={[styles.allClearSubtitle, { color: colors.mutedForeground }]}>
              No deals or follow-ups need your attention
            </Text>
          </View>
        </GlassView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={ICON_SIZES.md} color={colors.warning} />
        <Text style={[styles.headerText, { color: colors.foreground }]}>
          Needs Attention
        </Text>
        <View style={[styles.countBadge, { backgroundColor: withOpacity(colors.destructive, 'light') }]}>
          <Text style={[styles.countText, { color: colors.destructive }]}>
            {items.length}
          </Text>
        </View>
      </View>
      {items.slice(0, 3).map((item) => (
        <AttentionCard key={item.id} item={item} />
      ))}
      {items.length > 3 && (
        <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
          +{items.length - 3} more items
        </Text>
      )}
    </View>
  );
}

function AttentionCard({ item }: { item: InvestorAttentionItem }) {
  const colors = useThemeColors();

  const getUrgencyColor = () => {
    switch (item.urgency) {
      case 'high': return colors.destructive;
      case 'medium': return colors.warning;
      case 'low': return colors.info;
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case 'overdue_action': return Clock;
      case 'follow_up': return Phone;
      case 'deal_stale': return Briefcase;
      case 'offer_pending': return FileText;
      default: return AlertTriangle;
    }
  };

  const Icon = getIcon();
  const urgencyColor = getUrgencyColor();

  return (
    <TouchableOpacity
      onPress={item.onPress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={styles.itemWrapper}
    >
      <GlassView
        intensity={GLASS_INTENSITY.light}
        style={[styles.itemCard, { borderColor: colors.border, borderLeftColor: urgencyColor, borderLeftWidth: 3 }]}
      >
        <View style={[styles.itemIconContainer, { backgroundColor: withOpacity(urgencyColor, 'subtle') }]}>
          <Icon size={ICON_SIZES.md} color={urgencyColor} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
        <ChevronRight size={ICON_SIZES.md} color={colors.mutedForeground} />
      </GlassView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  headerText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
  },
  allClearCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  allClearText: {
    flex: 1,
  },
  allClearTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  allClearSubtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  itemWrapper: {
    marginBottom: SPACING.sm,
  },
  itemCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  moreText: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    paddingTop: SPACING.xs,
  },
});
