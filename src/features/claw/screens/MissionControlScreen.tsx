// The Claw — Mission Control Screen
// Briefing overview, quick stats, and action shortcuts

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Activity,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES } from '@/constants/design-tokens';
import { useBriefing, useApprovals, useActivity } from '../hooks/useClawApi';

export function MissionControlScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { briefing, fetchBriefing, isLoading: briefingLoading } = useBriefing();
  const { approvals, fetchApprovals, isLoading: approvalsLoading } = useApprovals();
  const { activity, fetchActivity, isLoading: activityLoading } = useActivity();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBriefing();
    fetchApprovals();
    fetchActivity(10);
  }, [fetchBriefing, fetchApprovals, fetchActivity]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchBriefing(), fetchApprovals(), fetchActivity(10)]);
    setRefreshing(false);
  }, [fetchBriefing, fetchApprovals, fetchActivity]);

  const pendingCount = approvals.length;
  const recentTasks = activity.filter((a) => a.kind === 'task').length;

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader title="Mission Control" />

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: TAB_BAR_SAFE_PADDING }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Quick Stats Row */}
        <View className="flex-row gap-3 mb-5">
          <StatCard
            icon={<AlertTriangle size={ICON_SIZES.lg} color={colors.warning} />}
            label="Pending"
            value={String(pendingCount)}
            bg={withOpacity(colors.warning, 'muted')}
            colors={colors}
            onPress={() => router.push('/(tabs)/ai-assistant/approvals')}
          />
          <StatCard
            icon={<Activity size={ICON_SIZES.lg} color={colors.info} />}
            label="Tasks"
            value={String(recentTasks)}
            bg={withOpacity(colors.info, 'muted')}
            colors={colors}
            onPress={() => router.push('/(tabs)/ai-assistant/agents')}
          />
          <StatCard
            icon={<CheckCircle size={ICON_SIZES.lg} color={colors.success} />}
            label="Sent"
            value={String(activity.filter((a) => a.status === 'executed').length)}
            bg={withOpacity(colors.success, 'muted')}
            colors={colors}
          />
        </View>

        {/* Briefing Card */}
        <View
          className="rounded-2xl p-4 mb-5"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center mb-3">
            <Zap size={ICON_SIZES.lg} color={colors.primary} />
            <Text className="ml-2 text-base font-semibold" style={{ color: colors.foreground }}>
              Daily Briefing
            </Text>
          </View>
          {briefingLoading ? (
            <View className="py-6 items-center">
              <Text style={{ color: colors.mutedForeground }}>Generating briefing...</Text>
            </View>
          ) : briefing ? (
            <Text className="text-sm leading-5" style={{ color: colors.foreground }}>
              {briefing.briefing.slice(0, 600)}
              {briefing.briefing.length > 600 ? '...' : ''}
            </Text>
          ) : (
            <TouchableOpacity
              className="py-6 items-center"
              onPress={fetchBriefing}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.primary }}>Tap to load briefing</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pending Approvals Preview */}
        {pendingCount > 0 && (
          <View className="mb-5">
            <TouchableOpacity
              className="flex-row items-center justify-between mb-3"
              onPress={() => router.push('/(tabs)/ai-assistant/approvals')}
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                Pending Approvals ({pendingCount})
              </Text>
              <ChevronRight size={ICON_SIZES.lg} color={colors.mutedForeground} />
            </TouchableOpacity>

            {approvals.slice(0, 3).map((approval) => (
              <ApprovalPreviewCard key={approval.id} approval={approval} colors={colors} />
            ))}
          </View>
        )}

        {/* Recent Activity */}
        <View className="mb-5">
          <Text className="text-base font-semibold mb-3" style={{ color: colors.foreground }}>
            Recent Activity
          </Text>
          {activity.length === 0 ? (
            <Text style={{ color: colors.mutedForeground }}>No recent activity</Text>
          ) : (
            activity.slice(0, 5).map((item) => (
              <ActivityRow key={item.id} item={item} colors={colors} />
            ))
          )}
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
  colors,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  colors: ReturnType<typeof useThemeColors>;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      className="flex-1 rounded-xl p-3 items-center"
      style={{ backgroundColor: bg }}
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
    >
      {icon}
      <Text className="text-2xl font-bold mt-1" style={{ color: colors.foreground }}>
        {value}
      </Text>
      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
        {label}
      </Text>
    </Wrapper>
  );
}

function ApprovalPreviewCard({
  approval,
  colors,
}: {
  approval: { id: string; title: string; draft_content: string; recipient_name: string | null; created_at: string };
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      className="rounded-xl p-3 mb-2"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
        {approval.recipient_name || approval.title}
      </Text>
      <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }} numberOfLines={2}>
        {approval.draft_content}
      </Text>
    </View>
  );
}

function ActivityRow({
  item,
  colors,
}: {
  item: { id: string; kind: string; type: string; status: string; title: string; summary: string; created_at: string };
  colors: ReturnType<typeof useThemeColors>;
}) {
  const statusColor =
    item.status === 'completed' || item.status === 'executed'
      ? colors.success
      : item.status === 'pending'
        ? colors.warning
        : item.status === 'failed'
          ? colors.destructive
          : colors.mutedForeground;

  return (
    <View
      className="flex-row items-center py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: statusColor }} />
      <View className="flex-1">
        <Text className="text-sm font-medium" style={{ color: colors.foreground }} numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }} numberOfLines={1}>
          {item.summary.slice(0, 100)}
        </Text>
      </View>
      <Text className="text-xs ml-2" style={{ color: colors.mutedForeground }}>
        {formatTimeAgo(item.created_at)}
      </Text>
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default MissionControlScreen;
