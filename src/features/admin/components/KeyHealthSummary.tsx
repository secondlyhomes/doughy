// src/features/admin/components/KeyHealthSummary.tsx
// Quick stats cards showing key health metrics

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Key,
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { SecurityHealthSummary } from '../types/security';

interface KeyHealthSummaryProps {
  /** Health summary data */
  summary: SecurityHealthSummary | null;
  /** Whether data is loading */
  loading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  loading?: boolean;
}

const StatCard = React.memo(function StatCard({
  icon,
  label,
  value,
  color,
  loading,
}: StatCardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: withOpacity(color, 'muted') },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: withOpacity(color, 'strong') }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color }]}>
        {loading ? '--' : value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
});

/**
 * KeyHealthSummary displays quick stats about API key health
 */
export const KeyHealthSummary = React.memo(function KeyHealthSummary({
  summary,
  loading = false,
}: KeyHealthSummaryProps) {
  const colors = useThemeColors();

  // Format last checked time
  const lastCheckedText = summary?.lastChecked
    ? formatRelativeTime(summary.lastChecked)
    : 'Never';

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <StatCard
          icon={<Key size={16} color={colors.info} />}
          label="Total Keys"
          value={summary?.totalKeys ?? 0}
          color={colors.info}
          loading={loading}
        />

        <StatCard
          icon={<AlertTriangle size={16} color={colors.destructive} />}
          label="Needs Rotation"
          value={summary?.staleKeys ?? 0}
          color={colors.destructive}
          loading={loading}
        />

        <StatCard
          icon={<Clock size={16} color={colors.warning} />}
          label="Aging Soon"
          value={summary?.agingKeys ?? 0}
          color={colors.warning}
          loading={loading}
        />

        <StatCard
          icon={<XCircle size={16} color={colors.destructive} />}
          label="Errors"
          value={summary?.errorKeys ?? 0}
          color={summary?.errorKeys ? colors.destructive : colors.mutedForeground}
          loading={loading}
        />
      </View>

      {/* Last check timestamp */}
      <View style={styles.lastCheckRow}>
        <RefreshCw size={12} color={colors.mutedForeground} />
        <Text style={[styles.lastCheckText, { color: colors.mutedForeground }]}>
          Last check: {loading ? 'Checking...' : lastCheckedText}
        </Text>
      </View>
    </View>
  );
});

/**
 * Format a date as relative time (e.g., "5 min ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  lastCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  lastCheckText: {
    fontSize: 11,
  },
});
