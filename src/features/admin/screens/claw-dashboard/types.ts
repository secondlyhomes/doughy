// src/features/admin/screens/claw-dashboard/types.ts
// Type definitions for Claw Control Panel Dashboard

export interface AgentWithStats {
  id: string;
  name: string;
  slug: string;
  model: string;
  isActive: boolean;
  requiresApproval: boolean;
  runsToday: number;
  tokensToday: number;
  costToday: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
}

export interface ActivityItem {
  id: string;
  type: 'task' | 'approval' | 'agent_run' | 'kill_switch';
  title: string;
  description: string;
  status: string;
  agentName?: string;
  createdAt: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  actionType: string;
  draftContent: string | null;
  recipientName: string | null;
  status: string;
  agentName?: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface BudgetLimit {
  id: string;
  agentName: string | null;
  limitType: string;
  limitValue: number;
  currentValue: number;
  isExceeded: boolean;
}

export interface ClawDashboardData {
  // Stats
  activeAgents: number;
  pausedAgents: number;
  pendingApprovals: number;
  todayCostCents: number;
  todayTokens: number;
  tasksToday: number;

  // Lists
  agents: AgentWithStats[];
  recentActivity: ActivityItem[];
  pendingApprovalsList: ApprovalItem[];
  budgetLimits: BudgetLimit[];

  // Kill switch
  isKillSwitchActive: boolean;

  // State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  handleRefresh: () => Promise<void>;
  toggleAgent: (agentId: string, newActive: boolean) => Promise<void>;
  toggleKillSwitch: (activate: boolean, reason?: string) => Promise<void>;
}
