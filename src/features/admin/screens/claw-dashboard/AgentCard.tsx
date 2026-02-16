// src/features/admin/screens/claw-dashboard/AgentCard.tsx
// Agent status card showing model, runs, tokens, cost

import React from 'react';
import { View, Text } from 'react-native';
import { Bot, Pause, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import type { useThemeColors } from '@/contexts/ThemeContext';

import type { AgentWithStats } from './types';

interface AgentCardProps {
  agent: AgentWithStats;
  colors: ReturnType<typeof useThemeColors>;
}

export function AgentCard({ agent, colors }: AgentCardProps) {
  const statusColor = agent.isActive ? colors.success : colors.mutedForeground;
  const StatusIcon = agent.isActive ? CheckCircle : Pause;

  const modelShort = agent.model.includes('haiku')
    ? 'Haiku'
    : agent.model.includes('sonnet')
      ? 'Sonnet'
      : agent.model.includes('opus')
        ? 'Opus'
        : agent.model.split('-').pop() || agent.model;

  return (
    <View
      style={{
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        padding: SPACING.md,
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        borderLeftWidth: 3,
        borderLeftColor: statusColor,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: SPACING.sm }}>
          <Bot size={ICON_SIZES.sm} color={colors.foreground} />
          <Text className="font-semibold" style={{ color: colors.foreground }}>
            {agent.name}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: SPACING.xs }}>
          <StatusIcon size={14} color={statusColor} />
          <Text className="text-xs" style={{ color: statusColor }}>
            {agent.isActive ? 'Active' : 'Paused'}
          </Text>
        </View>
      </View>

      {/* Model + Approval badge */}
      <View
        className="flex-row items-center"
        style={{ gap: SPACING.sm, marginTop: SPACING.xs }}
      >
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>
          {modelShort}
        </Text>
        {agent.requiresApproval && (
          <View
            style={{
              backgroundColor: colors.warning + '20',
              paddingHorizontal: SPACING.xs,
              paddingVertical: 2,
              borderRadius: BORDER_RADIUS.sm,
            }}
          >
            <Text style={{ color: colors.warning, fontSize: 10 }}>
              Requires Approval
            </Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View
        className="flex-row justify-between"
        style={{ marginTop: SPACING.sm }}
      >
        <StatPill label="Runs" value={`${agent.runsToday}`} colors={colors} />
        <StatPill
          label="Tokens"
          value={agent.tokensToday.toLocaleString()}
          colors={colors}
        />
        <StatPill
          label="Cost"
          value={`${agent.costToday}c`}
          colors={colors}
        />
        <StatPill
          label="Last"
          value={agent.lastRunAt ? formatRelative(agent.lastRunAt) : '—'}
          colors={colors}
        />
      </View>
    </View>
  );
}

function StatPill({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View className="items-center">
      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
        {label}
      </Text>
      <Text
        className="text-sm font-medium"
        style={{ color: colors.foreground }}
      >
        {value}
      </Text>
    </View>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
