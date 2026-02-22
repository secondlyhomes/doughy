// src/features/focus/components/NudgesList.tsx
// List of nudges/reminders for Inbox mode

import React from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { CheckCircle2, Phone, Calendar, Inbox } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { LoadingSpinner } from '@/components/ui';
import { Nudge, NudgeSummary } from '../types';
import { SwipeableNudgeCard, cleanExpiredSnoozes, isNudgeSnoozed } from './SwipeableNudgeCard';

interface NudgesListProps {
  nudges: Nudge[];
  summary: NudgeSummary;
  isLoading: boolean;
  onRefresh?: () => void;
  onNudgePress?: (nudge: Nudge) => void;
  onLogCall?: (leadId: string, leadName?: string) => void;
}

export function NudgesList({
  nudges,
  summary,
  isLoading,
  onRefresh,
  onNudgePress,
  onLogCall,
}: NudgesListProps) {
  const colors = useThemeColors();

  // Empty state when all caught up
  if (!isLoading && nudges.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.xl,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.success + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          <CheckCircle2 size={40} color={colors.success} />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: SPACING.xs,
          }}
        >
          All caught up!
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
            textAlign: 'center',
          }}
        >
          No pending actions or follow-ups.{'\n'}Great job staying on top of things.
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Nudge }) => (
    <SwipeableNudgeCard
      nudge={item}
      onPress={onNudgePress ? () => onNudgePress(item) : undefined}
      onLogCall={onLogCall}
    />
  );

  const renderHeader = () => {
    if (summary.total === 0) return null;

    return (
      <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.md }}>
        {/* Type-based summary breakdown */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.sm }}>
          {summary.staleLeads > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.warning + '20',
                paddingHorizontal: SPACING.sm,
                paddingVertical: SPACING.xs,
                borderRadius: BORDER_RADIUS.full,
                gap: SPACING.xs,
              }}
            >
              <Phone size={ICON_SIZES.xs} color={colors.warning} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.warning }}>
                {summary.staleLeads} stale lead{summary.staleLeads !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {summary.overdueActions > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.destructive + '20',
                paddingHorizontal: SPACING.sm,
                paddingVertical: SPACING.xs,
                borderRadius: BORDER_RADIUS.full,
                gap: SPACING.xs,
              }}
            >
              <Calendar size={ICON_SIZES.xs} color={colors.destructive} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.destructive }}>
                {summary.overdueActions} overdue action{summary.overdueActions !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {summary.pendingCaptures > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primary + '20',
                paddingHorizontal: SPACING.sm,
                paddingVertical: SPACING.xs,
                borderRadius: BORDER_RADIUS.full,
                gap: SPACING.xs,
              }}
            >
              <Inbox size={ICON_SIZES.xs} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                {summary.pendingCaptures} pending capture{summary.pendingCaptures !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Priority summary */}
        {summary.high > 0 && (
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.destructive + '15',
                paddingHorizontal: SPACING.sm,
                paddingVertical: 4,
                borderRadius: BORDER_RADIUS.full,
                gap: SPACING.xs,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.destructive,
                }}
              />
              <Text style={{ fontSize: 12, fontWeight: '500', color: colors.destructive }}>
                {summary.high} urgent
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={nudges}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={{
        padding: SPACING.md,
        paddingTop: SPACING.sm,
        gap: SPACING.sm,
      }}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        isLoading ? (
          <View style={{ padding: SPACING.xl }}>
            <LoadingSpinner />
          </View>
        ) : null
      }
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

export default NudgesList;
