// The Claw — Agent Status Screen
// Shows agent run history, costs, and performance metrics

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Bot,
  DollarSign,
  Clock,
  Cpu,
  Wrench,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { useAgentRuns, type ClawAgentRun } from '../hooks/useClawApi';

export function AgentStatusScreen() {
  const colors = useThemeColors();
  const { runs, fetchRuns, isLoading, error } = useAgentRuns();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRuns();
    setRefreshing(false);
  }, [fetchRuns]);

  // Calculate summary stats
  const totalCost = runs.reduce((sum, r) => sum + parseFloat(r.cost_cents || '0'), 0);
  const completedRuns = runs.filter((r) => r.status === 'completed').length;
  const failedRuns = runs.filter((r) => r.status === 'failed').length;
  const avgDuration = runs.length > 0
    ? Math.round(runs.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / runs.length)
    : 0;

  const renderRun = useCallback(({ item }: { item: ClawAgentRun }) => {
    const statusIcon =
      item.status === 'completed' ? <CheckCircle size={ICON_SIZES.md} color={colors.success} />
      : item.status === 'failed' ? <XCircle size={ICON_SIZES.md} color={colors.destructive} />
      : <Loader size={ICON_SIZES.md} color={colors.warning} />;

    const cost = parseFloat(item.cost_cents || '0');
    const durationSec = item.duration_ms ? (item.duration_ms / 1000).toFixed(1) : '—';
    const toolCount = Array.isArray(item.tool_calls) ? item.tool_calls.length : 0;

    return (
      <View
        className="rounded-xl p-4 mb-3"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            {statusIcon}
            <Text className="ml-2 text-sm font-semibold flex-1" style={{ color: colors.foreground }} numberOfLines={1}>
              {item.type || item.model || 'Agent Run'}
            </Text>
          </View>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        </View>

        {/* Metrics row */}
        <View className="flex-row gap-4 mt-2">
          <MetricChip
            icon={<DollarSign size={12} color={colors.mutedForeground} />}
            label={cost > 0 ? `${cost.toFixed(3)}c` : '—'}
            colors={colors}
          />
          <MetricChip
            icon={<Clock size={12} color={colors.mutedForeground} />}
            label={`${durationSec}s`}
            colors={colors}
          />
          <MetricChip
            icon={<Wrench size={12} color={colors.mutedForeground} />}
            label={`${toolCount} tools`}
            colors={colors}
          />
          {item.input_tokens && (
            <MetricChip
              icon={<Cpu size={12} color={colors.mutedForeground} />}
              label={`${((item.input_tokens + (item.output_tokens || 0)) / 1000).toFixed(1)}k tok`}
              colors={colors}
            />
          )}
        </View>
      </View>
    );
  }, [colors]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader title="Agent Status" />

      {/* Summary Stats */}
      <View className="flex-row gap-3 mx-4 mb-4">
        <SummaryCard
          icon={<Bot size={ICON_SIZES.lg} color={colors.primary} />}
          value={String(completedRuns)}
          label="Completed"
          colors={colors}
        />
        <SummaryCard
          icon={<DollarSign size={ICON_SIZES.lg} color={colors.success} />}
          value={`${totalCost.toFixed(2)}c`}
          label="Total Cost"
          colors={colors}
        />
        <SummaryCard
          icon={<Clock size={ICON_SIZES.lg} color={colors.info} />}
          value={avgDuration > 1000 ? `${(avgDuration / 1000).toFixed(1)}s` : `${avgDuration}ms`}
          label="Avg Time"
          colors={colors}
        />
      </View>

      <FlatList
        data={runs}
        renderItem={renderRun}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: TAB_BAR_SAFE_PADDING }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Bot size={48} color={colors.mutedForeground} />
            <Text className="text-base mt-4" style={{ color: colors.mutedForeground }}>
              No agent runs yet
            </Text>
          </View>
        }
      />
    </ThemedSafeAreaView>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  colors,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      className="flex-1 rounded-xl p-3 items-center"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      {icon}
      <Text className="text-lg font-bold mt-1" style={{ color: colors.foreground }}>{value}</Text>
      <Text className="text-xs" style={{ color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}

function MetricChip({
  icon,
  label,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View className="flex-row items-center gap-1">
      {icon}
      <Text className="text-xs" style={{ color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}

export default AgentStatusScreen;
