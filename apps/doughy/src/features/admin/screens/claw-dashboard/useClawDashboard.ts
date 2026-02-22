// src/features/admin/screens/claw-dashboard/useClawDashboard.ts
// Composition hook for Claw Control Panel Dashboard
// Orchestrates data loading, transformation, and mutations

import { useState, useEffect, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/supabase';

import { getTodayISO, clawFrom } from './claw-query-helpers';
import {
  loadAgentProfiles,
  loadTodayTasks,
  loadTodayAgentRuns,
  loadPendingApprovals,
  loadRecentApprovals,
  loadBudgetLimits,
  loadRecentKillSwitchLogs,
} from './claw-loaders';
import {
  buildAgentsWithStats,
  buildActivityFeed,
  buildApprovalItems,
  buildBudgetLimitItems,
} from './claw-transformers';

import type { AgentRunRow, TaskRow } from './claw-query-helpers';
import type {
  AgentWithStats,
  ActivityItem,
  ApprovalItem,
  BudgetLimit,
  ClawDashboardData,
} from './types';

// ── Hook ─────────────────────────────────────────────────────────────

export function useClawDashboard(): ClawDashboardData {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agents, setAgents] = useState<AgentWithStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [pendingApprovalsList, setPendingApprovalsList] = useState<ApprovalItem[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [todayRuns, setTodayRuns] = useState<AgentRunRow[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskRow[]>([]);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      const todayISO = getTodayISO();

      const [
        profileRows,
        taskRows,
        runRows,
        pendingApprovalRows,
        recentApprovalRows,
        budgetRows,
        killSwitchRows,
      ] = await Promise.all([
        loadAgentProfiles(),
        loadTodayTasks(todayISO),
        loadTodayAgentRuns(todayISO),
        loadPendingApprovals(),
        loadRecentApprovals(),
        loadBudgetLimits(),
        loadRecentKillSwitchLogs(),
      ]);

      // Build lookup maps
      const agentNameMap = new Map<string, string>(
        profileRows.map((p) => [p.id, p.name]),
      );
      const agentRunMap = new Map<string, AgentRunRow>(
        runRows.map((r) => [r.id, r]),
      );

      // Transform data
      const agentsWithStats = buildAgentsWithStats(profileRows, runRows);
      const activity = buildActivityFeed(
        taskRows,
        recentApprovalRows,
        runRows,
        killSwitchRows,
        agentNameMap,
      );
      const approvalItems = buildApprovalItems(
        pendingApprovalRows,
        agentRunMap,
        agentNameMap,
      );
      const budgetItems = buildBudgetLimitItems(budgetRows, agentNameMap);

      // Derive kill switch state from latest global log entry
      const latestGlobal = killSwitchRows.find(
        (k) => k.action === 'deactivate_global' || k.action === 'activate_global',
      );
      setIsKillSwitchActive(latestGlobal?.action === 'deactivate_global');

      setAgents(agentsWithStats);
      setRecentActivity(activity);
      setPendingApprovalsList(approvalItems);
      setBudgetLimits(budgetItems);
      setTodayRuns(runRows);
      setTodayTasks(taskRows);
      setError(null);
    } catch (err) {
      console.error('[ClawDashboard] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadAllData();
      setIsLoading(false);
    };
    load();
  }, [loadAllData]);

  // Refresh handler (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  // Computed stats
  const activeAgents = useMemo(
    () => agents.filter((a) => a.isActive).length,
    [agents],
  );

  const pausedAgents = useMemo(
    () => agents.filter((a) => !a.isActive).length,
    [agents],
  );

  const pendingApprovals = useMemo(
    () => pendingApprovalsList.length,
    [pendingApprovalsList],
  );

  const todayCostCents = useMemo(
    () => todayRuns.reduce((sum, r) => sum + (r.cost_cents || 0), 0),
    [todayRuns],
  );

  const todayTokens = useMemo(
    () =>
      todayRuns.reduce(
        (sum, r) => sum + (r.input_tokens || 0) + (r.output_tokens || 0),
        0,
      ),
    [todayRuns],
  );

  const tasksToday = useMemo(() => todayTasks.length, [todayTasks]);

  // ── Mutations ──────────────────────────────────────────────────────

  const toggleAgent = useCallback(
    async (agentId: string, newActive: boolean) => {
      const { error: updateError } = await clawFrom('agent_profiles')
        .update({ is_active: newActive, updated_at: new Date().toISOString() })
        .eq('id', agentId);

      if (updateError) {
        console.error('[ClawDashboard] Toggle agent error:', updateError);
        setError(`Failed to ${newActive ? 'enable' : 'disable'} agent`);
        return;
      }

      // Optimistic update
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, isActive: newActive } : a)),
      );

      // Log the change (non-blocking — agent toggle already succeeded)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: logError } = await clawFrom('kill_switch_log').insert({
            user_id: user.id,
            action: newActive ? 'activate_agent' : 'deactivate_agent',
            agent_profile_id: agentId,
            reason: `${newActive ? 'Enabled' : 'Disabled'} via admin dashboard`,
          });
          if (logError) console.error('[ClawDashboard] Audit log failed:', logError);
        }
      } catch (err) {
        console.error('[ClawDashboard] Audit log error:', err);
      }
    },
    [],
  );

  const toggleKillSwitch = useCallback(
    async (activate: boolean, reason?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      if (activate) {
        // Deactivate ALL agents
        const { error: updateError } = await clawFrom('agent_profiles')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // update all rows

        if (updateError) {
          console.error('[ClawDashboard] Kill switch error:', updateError);
          setError('Failed to activate kill switch');
          return;
        }

        setAgents((prev) => prev.map((a) => ({ ...a, isActive: false })));
        setIsKillSwitchActive(true);
      } else {
        // Reactivate all agents
        const { error: updateError } = await clawFrom('agent_profiles')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (updateError) {
          console.error('[ClawDashboard] Kill switch deactivate error:', updateError);
          setError('Failed to deactivate kill switch');
          return;
        }

        setAgents((prev) => prev.map((a) => ({ ...a, isActive: true })));
        setIsKillSwitchActive(false);
      }

      // Log the kill switch event (non-blocking — toggle already succeeded)
      try {
        const { error: logError } = await clawFrom('kill_switch_log').insert({
          user_id: user.id,
          action: activate ? 'deactivate_global' : 'activate_global',
          reason: reason || (activate ? 'Kill switch activated' : 'Kill switch deactivated'),
          agents_affected: agents.length,
        });
        if (logError) {
          console.error('[ClawDashboard] Kill switch audit log failed:', logError);
          setError('Kill switch toggled but audit log failed');
        }
      } catch (err) {
        console.error('[ClawDashboard] Kill switch audit log error:', err);
      }
    },
    [agents.length],
  );

  return {
    // Stats
    activeAgents,
    pausedAgents,
    pendingApprovals,
    todayCostCents,
    todayTokens,
    tasksToday,

    // Lists
    agents,
    recentActivity,
    pendingApprovalsList,
    budgetLimits,

    // Kill switch
    isKillSwitchActive,

    // State
    isLoading,
    isRefreshing,
    error,

    // Actions
    handleRefresh,
    toggleAgent,
    toggleKillSwitch,
  };
}
