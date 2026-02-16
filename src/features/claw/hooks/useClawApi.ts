// The Claw API hooks — communicates with openclaw-server /api/claw/* endpoints

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, SUPABASE_URL } from '@/lib/supabase';

const CLAW_API_BASE = process.env.EXPO_PUBLIC_OPENCLAW_URL || 'https://openclaw.doughy.app';

interface ClawApproval {
  id: string;
  task_id: string | null;
  status: string;
  action_type: string;
  title: string;
  description: string | null;
  draft_content: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  expires_at: string | null;
  created_at: string;
  decided_at: string | null;
}

interface ClawMessage {
  id: string;
  channel: string;
  role: string;
  content: string;
  task_id: string | null;
  created_at: string;
}

interface ClawAgentRun {
  id: string;
  agent_profile_id: string;
  task_id: string;
  status: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_cents: string | null;
  duration_ms: number | null;
  tool_calls: unknown[] | null;
  created_at: string;
  completed_at: string | null;
}

interface ActivityItem {
  id: string;
  kind: 'task' | 'approval';
  type: string;
  status: string;
  title: string;
  summary: string;
  recipient_name?: string;
  created_at: string;
  resolved_at: string | null;
}

interface BriefingResponse {
  briefing: string;
  data: Record<string, unknown>;
}

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function clawFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${CLAW_API_BASE}/api/claw${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Try refreshing session
    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      const retryResponse = await fetch(`${CLAW_API_BASE}/api/claw${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
          ...options.headers,
        },
      });
      if (!retryResponse.ok) throw new Error(`API error: ${retryResponse.status}`);
      return retryResponse.json() as Promise<T>;
    }
    throw new Error('Authentication expired');
  }

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}

// ============================================================================
// Briefing
// ============================================================================

export function useBriefing() {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await clawFetch<BriefingResponse>('/briefing');
      setBriefing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load briefing');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { briefing, fetchBriefing, isLoading, error };
}

// ============================================================================
// Approvals
// ============================================================================

export function useApprovals() {
  const [approvals, setApprovals] = useState<ClawApproval[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = useCallback(async (status = 'pending') => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await clawFetch<{ approvals: ClawApproval[] }>(`/approvals?status=${status}`);
      setApprovals(data.approvals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const decideApproval = useCallback(async (
    approvalId: string,
    action: 'approve' | 'reject',
    editedContent?: string,
  ) => {
    const data = await clawFetch<{ success: boolean; status: string }>(
      `/approvals/${approvalId}/decide`,
      {
        method: 'POST',
        body: JSON.stringify({ action, edited_content: editedContent }),
      },
    );
    // Remove from local list after decision
    setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
    return data;
  }, []);

  const batchDecide = useCallback(async (
    decisions: Array<{ approval_id: string; action: 'approve' | 'reject'; edited_content?: string }>,
  ) => {
    const data = await clawFetch<{ results: unknown[]; approved: number; rejected: number }>(
      '/approvals/batch',
      {
        method: 'POST',
        body: JSON.stringify({ decisions }),
      },
    );
    // Refresh list after batch
    await fetchApprovals();
    return data;
  }, [fetchApprovals]);

  return { approvals, fetchApprovals, decideApproval, batchDecide, isLoading, error };
}

// ============================================================================
// Activity feed
// ============================================================================

export function useActivity() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async (limit = 30) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await clawFetch<{ activity: ActivityItem[] }>(`/activity?limit=${limit}`);
      setActivity(data.activity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { activity, fetchActivity, isLoading, error };
}

// ============================================================================
// Messages
// ============================================================================

export function useMessages() {
  const [messages, setMessages] = useState<ClawMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async (channel?: string, limit = 50) => {
    setIsLoading(true);
    try {
      const params = channel ? `?channel=${channel}&limit=${limit}` : `?limit=${limit}`;
      const data = await clawFetch<{ messages: ClawMessage[] }>(`/messages${params}`);
      setMessages(data.messages);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    const data = await clawFetch<{ response: string; intent: string }>('/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return data;
  }, []);

  return { messages, fetchMessages, sendMessage, isLoading };
}

// ============================================================================
// Agent Runs (for Agent Status screen)
// ============================================================================

export function useAgentRuns() {
  const [runs, setRuns] = useState<ClawAgentRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async (limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      // Agent runs are returned from the tasks endpoint with agent data
      const data = await clawFetch<{ tasks: ClawAgentRun[] }>(`/tasks?limit=${limit}`);
      setRuns(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent runs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { runs, fetchRuns, isLoading, error };
}

export type { ClawApproval, ClawMessage, ClawAgentRun, ActivityItem, BriefingResponse };
