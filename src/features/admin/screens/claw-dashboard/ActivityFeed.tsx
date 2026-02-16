// src/features/admin/screens/claw-dashboard/ActivityFeed.tsx
// Live activity feed showing recent tasks, approvals, agent runs, kill switch events

import React from 'react';
import { View, Text } from 'react-native';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Bot,
  Shield,
  AlertOctagon,
} from 'lucide-react-native';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import type { useThemeColors } from '@/contexts/ThemeContext';

import type { ActivityItem } from './types';

interface ActivityFeedProps {
  activity: ActivityItem[];
  colors: ReturnType<typeof useThemeColors>;
}

export function ActivityFeed({ activity, colors }: ActivityFeedProps) {
  if (activity.length === 0) {
    return (
      <View style={{ padding: SPACING.lg }}>
        <Text
          className="text-lg font-semibold"
          style={{ color: colors.foreground, marginBottom: SPACING.sm }}
        >
          Activity Feed
        </Text>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>
          No recent activity
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl }}>
      <Text
        className="text-lg font-semibold"
        style={{ color: colors.foreground, marginBottom: SPACING.sm }}
      >
        Activity Feed
      </Text>

      {activity.map((item, index) => (
        <ActivityRow
          key={item.id}
          item={item}
          colors={colors}
          isLast={index === activity.length - 1}
        />
      ))}
    </View>
  );
}

function ActivityRow({
  item,
  colors,
  isLast,
}: {
  item: ActivityItem;
  colors: ReturnType<typeof useThemeColors>;
  isLast: boolean;
}) {
  const { icon, iconColor } = getItemIcon(item, colors);

  return (
    <View
      className="flex-row"
      style={{
        paddingVertical: SPACING.sm,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: iconColor + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.sm,
        }}
      >
        {icon}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-sm font-medium flex-1"
            numberOfLines={1}
            style={{ color: colors.foreground }}
          >
            {item.title}
          </Text>
          <Text
            className="text-xs"
            style={{ color: colors.mutedForeground, marginLeft: SPACING.sm }}
          >
            {formatRelative(item.createdAt)}
          </Text>
        </View>
        <Text
          className="text-xs"
          numberOfLines={1}
          style={{ color: colors.mutedForeground, marginTop: 2 }}
        >
          {item.description}
        </Text>
        {item.agentName && (
          <Text
            className="text-xs"
            style={{ color: colors.primary, marginTop: 2 }}
          >
            {item.agentName}
          </Text>
        )}
      </View>

      {/* Status badge */}
      <StatusBadge status={item.status} colors={colors} />
    </View>
  );
}

function StatusBadge({
  status,
  colors,
}: {
  status: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const { bg, fg } = getStatusColors(status, colors);

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        alignSelf: 'flex-start',
        marginLeft: SPACING.xs,
      }}
    >
      <Text style={{ color: fg, fontSize: 10, fontWeight: '500' }}>
        {status}
      </Text>
    </View>
  );
}

function getItemIcon(
  item: ActivityItem,
  colors: ReturnType<typeof useThemeColors>,
): { icon: React.ReactNode; iconColor: string } {
  switch (item.type) {
    case 'task':
      return {
        icon: <Activity size={16} color={colors.info} />,
        iconColor: colors.info,
      };
    case 'approval':
      return {
        icon: <Shield size={16} color={colors.warning} />,
        iconColor: colors.warning,
      };
    case 'agent_run':
      return {
        icon: <Bot size={16} color={colors.primary} />,
        iconColor: colors.primary,
      };
    case 'kill_switch':
      return {
        icon: <AlertOctagon size={16} color={colors.destructive} />,
        iconColor: colors.destructive,
      };
    default:
      return {
        icon: <Clock size={16} color={colors.mutedForeground} />,
        iconColor: colors.mutedForeground,
      };
  }
}

function getStatusColors(
  status: string,
  colors: ReturnType<typeof useThemeColors>,
): { bg: string; fg: string } {
  switch (status) {
    case 'done':
    case 'completed':
    case 'approved':
    case 'executed':
      return { bg: colors.success + '20', fg: colors.success };
    case 'running':
    case 'pending':
      return { bg: colors.info + '20', fg: colors.info };
    case 'awaiting_approval':
      return { bg: colors.warning + '20', fg: colors.warning };
    case 'failed':
    case 'rejected':
    case 'expired':
      return { bg: colors.destructive + '20', fg: colors.destructive };
    case 'cancelled':
      return { bg: colors.mutedForeground + '20', fg: colors.mutedForeground };
    default:
      return { bg: colors.muted, fg: colors.mutedForeground };
  }
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
