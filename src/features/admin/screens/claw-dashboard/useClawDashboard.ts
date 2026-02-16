// src/features/admin/screens/claw-dashboard/useClawDashboard.ts
// Data fetching hook for Claw Control Panel Dashboard
// Queries claw schema tables: agent_profiles, tasks, agent_runs, approvals,
// messages, budget_limits, kill_switch_log

import { useState, useEffect, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/supabase';

import type {
  AgentWithStats,
  ActivityItem,
  ApprovalItem,
  BudgetLimit,
  ClawDashboardData,
} from './types';

// ── Helpers ──────────────────────────────────────────────────────────

/** Returns today's date at midnight in ISO format for query filtering */
function getTodayISO(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

/** Claw schema query helper — casts table names for non-generated schemas */
function clawFrom(table: string) {
  return supabase.schema('claw').from(table as unknown as 'profiles');
}

// ── Row types (raw DB shapes) ────────────────────────────────────────

interface AgentProfileRow {
  id: string;
  name: string;
  slug: string;
  model: string;
  is_active: boolean;
  requires_approval: boolean;
  tools: unknown;
}

interface TaskRow {
  id: string;
  user_id: string | null;
  type: string;
  status: string;
  title: string;
  created_at: string;
}

interface AgentRunRow {
  id: string;
  task_id: string | null;
  agent_profile_id: string | null;
  status: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_cents: number | null;
  duration_ms: number | null;
  tool_calls: unknown;
  created_at: string;
}

interface ApprovalRow {
  id: string;
  task_id: string | null;
  agent_run_id: string | null;
  status: string;
  action_type: string;
  title: string;
  draft_content: string | null;
  recipient_name: string | null;
  created_at: string;
  expires_at: string | null;
}

interface BudgetLimitRow {
  id: string;
  agent_profile_id: string | null;
  limit_type: string;
  limit_value: number;
  current_value: number;
  is_exceeded: boolean;
}

interface KillSwitchRow {
  id: string;
  action: string;
  agent_profile_id: string | null;
  reason: string | null;
  created_at: string;
}

// ── Individual loaders ───────────────────────────────────────────────

async function loadAgentProfiles(): Promise<AgentProfileRow[]> {
  const { data, error } = await clawFrom('agent_profiles')
    .select('*')
    .order('name');

  if (error) {
    console.error('[ClawDashboard] Error loading agent profiles:', error);
    return [];
  }

  return (data || []) as unknown as AgentProfileRow[];
}

async function loadTodayTasks(todayISO: string): Promise<TaskRow[]> {
  const { data, error } = await clawFrom('tasks')
    .select('*')
    .gte('created_at', todayISO)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ClawDashboard] Error loading tasks:', error);
    return [];
  }

  return (data || []) as unknown as TaskRow[];
}

async function loadTodayAgentRuns(todayISO: string): Promise<AgentRunRow[]> {
  const { data, error } = await clawFrom('agent_runs')
    .select('*')
    .gte('created_at', todayISO)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ClawDashboard] Error loading agent runs:', error);
    return [];
  }

  return (data || []) as unknown as AgentRunRow[];
}

async function loadPendingApprovals(): Promise<ApprovalRow[]> {
  const { data, error } = await clawFrom('approvals')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ClawDashboard] Error loading pending approvals:', error);
    return [];
  }

  return (data || []) as unknown as ApprovalRow[];
}

async function loadRecentApprovals(): Promise<ApprovalRow[]> {
  const { data, error } = await clawFrom('approvals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[ClawDashboard] Error loading recent approvals:', error);
    return [];
  }

  return (data || []) as unknown as ApprovalRow[];
}

async function loadBudgetLimits(): Promise<BudgetLimitRow[]> {
  const { data, error } = await clawFrom('budget_limits')
    .select('*');

  if (error) {
    console.error('[ClawDashboard] Error loading budget limits:', error);
    return [];
  }

  return (data || []) as unknown as BudgetLimitRow[];
}

async function loadRecentKillSwitchLogs(): Promise<KillSwitchRow[]> {
  const { data, error } = await clawFrom('kill_switch_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[ClawDashboard] Error loading kill switch log:', error);
    return [];
  }

  return (data || []) as unknown as KillSwitchRow[];
}

// ── Data transformers ────────────────────────────────────────────────

function buildAgentsWithStats(
  profiles: AgentProfileRow[],
  todayRuns: AgentRunRow[],
): AgentWithStats[] {
  return profiles.map((agent) => {
    const agentRuns = todayRuns.filter((r) => r.agent_profile_id === agent.id);

    const tokensToday = agentRuns.reduce(
      (sum, r) => sum + (r.input_tokens || 0) + (r.output_tokens || 0),
      0,
    );
    const costToday = agentRuns.reduce(
      (sum, r) => sum + (r.cost_cents || 0),
      0,
    );

    // Most recent run for this agent (runs are already sorted DESC)
    const lastRun = agentRuns[0] ?? null;

    return {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      model: agent.model,
      isActive: agent.is_active,
      requiresApproval: agent.requires_approval,
      runsToday: agentRuns.length,
      tokensToday,
      costToday,
      lastRunAt: lastRun?.created_at ?? null,
      lastRunStatus: lastRun?.status ?? null,
    };
  });
}

function buildActivityFeed(
  tasks: TaskRow[],
  approvals: ApprovalRow[],
  runs: AgentRunRow[],
  killLogs: KillSwitchRow[],
  agentNameMap: Map<string, string>,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const task of tasks) {
    items.push({
      id: `task-${task.id}`,
      type: 'task',
      title: task.title || `${task.type} task`,
      description: `Type: ${task.type} | Status: ${task.status}`,
      status: task.status,
      createdAt: task.created_at,
    });
  }

  for (const approval of approvals) {
    items.push({
      id: `approval-${approval.id}`,
      type: 'approval',
      title: approval.title || `${approval.action_type} approval`,
      description: approval.recipient_name
        ? `To: ${approval.recipient_name} | ${approval.action_type}`
        : approval.action_type,
      status: approval.status,
      createdAt: approval.created_at,
    });
  }

  for (const run of runs) {
    const agentName = run.agent_profile_id
      ? agentNameMap.get(run.agent_profile_id)
      : undefined;
    const tokens = (run.input_tokens || 0) + (run.output_tokens || 0);

    items.push({
      id: `run-${run.id}`,
      type: 'agent_run',
      title: agentName ? `${agentName} run` : 'Agent run',
      description: `${tokens.toLocaleString()} tokens | ${run.cost_cents ?? 0}c | ${run.duration_ms ?? 0}ms`,
      status: run.status,
      agentName,
      createdAt: run.created_at,
    });
  }

  for (const log of killLogs) {
    const agentName = log.agent_profile_id
      ? agentNameMap.get(log.agent_profile_id)
      : undefined;

    items.push({
      id: `ks-${log.id}`,
      type: 'kill_switch',
      title: `Kill switch: ${log.action}`,
      description: log.reason || 'No reason provided',
      status: log.action,
      agentName,
      createdAt: log.created_at,
    });
  }

  // Sort by createdAt descending, take top 20
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, 20);
}

function buildApprovalItems(
  approvals: ApprovalRow[],
  agentRunMap: Map<string, AgentRunRow>,
  agentNameMap: Map<string, string>,
): ApprovalItem[] {
  return approvals.map((a) => {
    // Resolve agent name through the agent_run -> agent_profile chain
    let agentName: string | undefined;
    if (a.agent_run_id) {
      const run = agentRunMap.get(a.agent_run_id);
      if (run?.agent_profile_id) {
        agentName = agentNameMap.get(run.agent_profile_id);
      }
    }

    return {
      id: a.id,
      title: a.title || `${a.action_type} approval`,
      actionType: a.action_type,
      draftContent: a.draft_content,
      recipientName: a.recipient_name,
      status: a.status,
      agentName,
      createdAt: a.created_at,
      expiresAt: a.expires_at,
    };
  });
}

function buildBudgetLimitItems(
  rows: BudgetLimitRow[],
  agentNameMap: Map<string, string>,
): BudgetLimit[] {
  return rows.map((row) => ({
    id: row.id,
    agentName: row.agent_profile_id
      ? agentNameMap.get(row.agent_profile_id) ?? null
      : null,
    limitType: row.limit_type,
    limitValue: row.limit_value,
    currentValue: row.current_value,
    isExceeded: row.is_exceeded,
  }));
}

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

    // State
    isLoading,
    isRefreshing,
    error,

    // Actions
    handleRefresh,
  };
}
