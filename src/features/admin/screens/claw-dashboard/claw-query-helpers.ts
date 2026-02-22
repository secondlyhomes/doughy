// src/features/admin/screens/claw-dashboard/claw-query-helpers.ts
// Shared helpers and row types for Claw Dashboard data fetching

import { supabase } from '@/lib/supabase';

// ── Helpers ──────────────────────────────────────────────────────────

/** Returns today's date at midnight in ISO format for query filtering */
export function getTodayISO(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

/** Claw schema query helper — casts table names for non-generated schemas */
export function clawFrom(table: string) {
  return supabase.schema('claw').from(table as unknown as 'profiles');
}

// ── Row types (raw DB shapes) ────────────────────────────────────────

export interface AgentProfileRow {
  id: string;
  name: string;
  slug: string;
  model: string;
  is_active: boolean;
  requires_approval: boolean;
  tools: unknown;
}

export interface TaskRow {
  id: string;
  user_id: string | null;
  type: string;
  status: string;
  title: string;
  created_at: string;
}

export interface AgentRunRow {
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

export interface ApprovalRow {
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

export interface BudgetLimitRow {
  id: string;
  agent_profile_id: string | null;
  limit_type: string;
  limit_value: number;
  current_value: number;
  is_exceeded: boolean;
}

export interface KillSwitchRow {
  id: string;
  action: string;
  agent_profile_id: string | null;
  reason: string | null;
  created_at: string;
}
