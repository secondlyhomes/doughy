// src/features/admin/screens/claw-dashboard/ClawDashboardScreen.tsx
// Claw Control Panel — Agent dashboard for monitoring AI agents, approvals, costs

import React from 'react';
import { View, Text, ScrollView, RefreshControl, Switch, Alert } from 'react-native';
import { Bot, Shield, DollarSign, Zap, OctagonX } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { useThemeColors } from '@/contexts/ThemeContext';

import { useClawDashboard } from './useClawDashboard';
import { AgentCard } from './AgentCard';
import { ActivityFeed } from './ActivityFeed';
import { ApprovalQueue } from './ApprovalQueue';
import { BudgetSection } from './BudgetSection';

export function ClawDashboardScreen() {
  const colors = useThemeColors();
  const {
    activeAgents,
    pausedAgents,
    pendingApprovals,
    todayCostCents,
    todayTokens,
    tasksToday,
    agents,
    recentActivity,
    pendingApprovalsList,
    budgetLimits,
    isKillSwitchActive,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    toggleAgent,
    toggleKillSwitch,
  } = useClawDashboard();

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading Claw dashboard..." />;
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{
          paddingBottom: TAB_BAR_SAFE_PADDING + SPACING['4xl'] * 2,
        }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg }}>
          <Text
            className="text-2xl font-bold"
            style={{ color: colors.foreground }}
          >
            Claw Control Panel
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ color: colors.mutedForeground }}
          >
            AI agent monitoring & approvals
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View
            style={{
              margin: SPACING.lg,
              padding: SPACING.md,
              backgroundColor: colors.destructive + '20',
              borderRadius: BORDER_RADIUS.md,
            }}
          >
            <Text style={{ color: colors.destructive, fontSize: 14 }}>
              {error}
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        <View
          className="flex-row flex-wrap"
          style={{ paddingHorizontal: SPACING.sm, marginTop: SPACING.md }}
        >
          <StatTile
            icon={<Bot size={20} color={colors.primary} />}
            label="Active Agents"
            value={`${activeAgents}`}
            subtitle={pausedAgents > 0 ? `${pausedAgents} paused` : 'All running'}
            bgColor={colors.primary + '15'}
          />
          <StatTile
            icon={<Shield size={20} color={colors.warning} />}
            label="Pending"
            value={`${pendingApprovals}`}
            subtitle="Approvals"
            bgColor={colors.warning + '15'}
          />
          <StatTile
            icon={<DollarSign size={20} color={colors.success} />}
            label="Today Cost"
            value={`$${(todayCostCents / 100).toFixed(2)}`}
            subtitle={`${todayTokens.toLocaleString()} tokens`}
            bgColor={colors.success + '15'}
          />
          <StatTile
            icon={<Zap size={20} color={colors.info} />}
            label="Tasks Today"
            value={`${tasksToday}`}
            subtitle={`${agents.reduce((s, a) => s + a.runsToday, 0)} runs`}
            bgColor={colors.info + '15'}
          />
        </View>

        {/* Kill Switch */}
        <View
          style={{
            marginHorizontal: SPACING.lg,
            marginTop: SPACING.lg,
            padding: SPACING.md,
            backgroundColor: isKillSwitchActive
              ? colors.destructive + '15'
              : colors.card,
            borderRadius: BORDER_RADIUS.lg,
            borderWidth: isKillSwitchActive ? 1 : 0,
            borderColor: colors.destructive + '40',
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1" style={{ gap: SPACING.sm }}>
              <OctagonX
                size={20}
                color={isKillSwitchActive ? colors.destructive : colors.mutedForeground}
              />
              <View className="flex-1">
                <Text
                  className="font-semibold"
                  style={{
                    color: isKillSwitchActive
                      ? colors.destructive
                      : colors.foreground,
                  }}
                >
                  Kill Switch
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: colors.mutedForeground }}
                >
                  {isKillSwitchActive
                    ? 'All agents stopped'
                    : 'Stop all agent execution'}
                </Text>
              </View>
            </View>
            <Switch
              value={isKillSwitchActive}
              onValueChange={(val) => {
                if (val) {
                  Alert.alert(
                    'Activate Kill Switch?',
                    'This will immediately disable ALL agents. They will not process any messages until reactivated.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Stop All Agents',
                        style: 'destructive',
                        onPress: () => toggleKillSwitch(true),
                      },
                    ],
                  );
                } else {
                  toggleKillSwitch(false);
                }
              }}
              trackColor={{ false: colors.muted, true: colors.destructive + '60' }}
              thumbColor={isKillSwitchActive ? colors.destructive : colors.mutedForeground}
            />
          </View>
        </View>

        {/* Approval Queue */}
        {pendingApprovalsList.length > 0 && (
          <ApprovalQueue
            approvals={pendingApprovalsList}
            colors={colors}
          />
        )}

        {/* Agents */}
        <SectionHeader title="Agents" count={agents.length} colors={colors} />
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            colors={colors}
            onToggle={toggleAgent}
          />
        ))}

        {/* Activity Feed */}
        <ActivityFeed activity={recentActivity} colors={colors} />

        {/* Budget */}
        {budgetLimits.length > 0 && (
          <BudgetSection limits={budgetLimits} colors={colors} />
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

// ── Internal Components ──────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  subtitle,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  bgColor: string;
}) {
  const colors = useThemeColors();

  return (
    <View className="w-1/2" style={{ padding: SPACING.xs }}>
      <View
        style={{
          backgroundColor: bgColor,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.md,
        }}
      >
        {icon}
        <Text
          className="text-xl font-bold"
          style={{ color: colors.foreground, marginTop: SPACING.xs }}
        >
          {value}
        </Text>
        <Text className="text-sm" style={{ color: colors.foreground }}>
          {label}
        </Text>
        <Text
          className="text-xs"
          style={{ color: colors.mutedForeground }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  count,
  colors,
}: {
  title: string;
  count?: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.sm,
      }}
    >
      <Text
        className="text-lg font-semibold"
        style={{ color: colors.foreground }}
      >
        {title}
      </Text>
      {count !== undefined && (
        <Text
          className="text-sm"
          style={{ color: colors.mutedForeground }}
        >
          {count}
        </Text>
      )}
    </View>
  );
}
