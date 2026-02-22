// src/features/admin/screens/claw-dashboard/claw-transformers.ts
// Data transformation functions for Claw Dashboard
// Convert raw DB rows into domain types used by the UI

import type {
  AgentProfileRow,
  TaskRow,
  AgentRunRow,
  ApprovalRow,
  BudgetLimitRow,
  KillSwitchRow,
} from './claw-query-helpers';

import type {
  AgentWithStats,
  ActivityItem,
  ApprovalItem,
  BudgetLimit,
} from './types';

// ── Data transformers ────────────────────────────────────────────────

export function buildAgentsWithStats(
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

export function buildActivityFeed(
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

export function buildApprovalItems(
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

export function buildBudgetLimitItems(
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
