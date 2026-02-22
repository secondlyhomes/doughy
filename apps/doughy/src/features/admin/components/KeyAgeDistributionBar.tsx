// src/features/admin/components/KeyAgeDistributionBar.tsx
// Horizontal stacked bar showing key age distribution

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { SecurityHealthSummary } from '../types/security';

interface KeyAgeDistributionBarProps {
  /** Health summary data */
  summary: SecurityHealthSummary | null;
  /** Loading state */
  loading?: boolean;
}

/**
 * KeyAgeDistributionBar shows the distribution of key ages as a stacked bar
 *
 * - Green: Fresh keys (< 60 days)
 * - Yellow: Aging keys (60-180 days)
 * - Red: Stale keys (> 180 days)
 */
export const KeyAgeDistributionBar = React.memo(function KeyAgeDistributionBar({
  summary,
  loading = false,
}: KeyAgeDistributionBarProps) {
  const colors = useThemeColors();

  if (loading || !summary || summary.totalKeys === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Key Age Distribution
        </Text>
        <View style={[styles.barContainer, { backgroundColor: colors.muted }]}>
          <View style={[styles.emptyBar, { backgroundColor: colors.muted }]} />
        </View>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {loading ? 'Loading...' : 'No keys configured'}
        </Text>
      </View>
    );
  }

  const { freshKeys, agingKeys, staleKeys, totalKeys } = summary;

  // Calculate percentages
  const freshPercent = (freshKeys / totalKeys) * 100;
  const agingPercent = (agingKeys / totalKeys) * 100;
  const stalePercent = (staleKeys / totalKeys) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Key Age Distribution
      </Text>

      {/* Stacked bar */}
      <View style={[styles.barContainer, { backgroundColor: colors.muted }]}>
        {freshPercent > 0 && (
          <View
            style={[
              styles.segment,
              { width: `${freshPercent}%`, backgroundColor: colors.success },
            ]}
          />
        )}
        {agingPercent > 0 && (
          <View
            style={[
              styles.segment,
              { width: `${agingPercent}%`, backgroundColor: colors.warning },
            ]}
          />
        )}
        {stalePercent > 0 && (
          <View
            style={[
              styles.segment,
              { width: `${stalePercent}%`, backgroundColor: colors.destructive },
            ]}
          />
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem
          color={colors.success}
          label="Fresh"
          count={freshKeys}
          subLabel="< 60 days"
          textColor={colors.foreground}
          mutedColor={colors.mutedForeground}
        />
        <LegendItem
          color={colors.warning}
          label="Aging"
          count={agingKeys}
          subLabel="60-180 days"
          textColor={colors.foreground}
          mutedColor={colors.mutedForeground}
        />
        <LegendItem
          color={colors.destructive}
          label="Stale"
          count={staleKeys}
          subLabel="> 180 days"
          textColor={colors.foreground}
          mutedColor={colors.mutedForeground}
        />
      </View>
    </View>
  );
});

interface LegendItemProps {
  color: string;
  label: string;
  count: number;
  subLabel: string;
  textColor: string;
  mutedColor: string;
}

const LegendItem = React.memo(function LegendItem({
  color,
  label,
  count,
  subLabel,
  textColor,
  mutedColor,
}: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View>
        <Text style={[styles.legendLabel, { color: textColor }]}>
          {label}: {count}
        </Text>
        <Text style={[styles.legendSubLabel, { color: mutedColor }]}>
          {subLabel}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  barContainer: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  emptyBar: {
    flex: 1,
    height: '100%',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendSubLabel: {
    fontSize: 10,
  },
});
