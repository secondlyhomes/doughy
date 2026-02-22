// src/features/admin/screens/claw-dashboard/claw-loaders.ts
// Individual data-loading functions for Claw Dashboard
// Each function queries a specific claw schema table

import { clawFrom } from './claw-query-helpers';

import type {
  AgentProfileRow,
  TaskRow,
  AgentRunRow,
  ApprovalRow,
  BudgetLimitRow,
  KillSwitchRow,
} from './claw-query-helpers';

// ── Individual loaders ───────────────────────────────────────────────

export async function loadAgentProfiles(): Promise<AgentProfileRow[]> {
  const { data, error } = await clawFrom('agent_profiles')
    .select('*')
    .order('name');

  if (error) {
    console.error('[ClawDashboard] Error loading agent profiles:', error);
    return [];
  }

  return (data || []) as unknown as AgentProfileRow[];
}

export async function loadTodayTasks(todayISO: string): Promise<TaskRow[]> {
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

export async function loadTodayAgentRuns(todayISO: string): Promise<AgentRunRow[]> {
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

export async function loadPendingApprovals(): Promise<ApprovalRow[]> {
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

export async function loadRecentApprovals(): Promise<ApprovalRow[]> {
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

export async function loadBudgetLimits(): Promise<BudgetLimitRow[]> {
  const { data, error } = await clawFrom('budget_limits')
    .select('*');

  if (error) {
    console.error('[ClawDashboard] Error loading budget limits:', error);
    return [];
  }

  return (data || []) as unknown as BudgetLimitRow[];
}

export async function loadRecentKillSwitchLogs(): Promise<KillSwitchRow[]> {
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
