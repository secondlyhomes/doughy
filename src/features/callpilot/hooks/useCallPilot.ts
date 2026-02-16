// CallPilot API hooks — communicates with openclaw-server /api/calls/* endpoints

import { useState, useCallback } from 'react';
import { supabase, SUPABASE_URL } from '@/lib/supabase';

const CLAW_API_BASE = process.env.EXPO_PUBLIC_OPENCLAW_URL || 'https://openclaw.doughy.app';

// Types matching callpilot schema
interface Call {
  id: string;
  user_id: string;
  lead_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  direction: 'inbound' | 'outbound';
  phone_number: string;
  twilio_call_sid: string | null;
  status: 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'missed' | 'voicemail';
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  script_template_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface PreCallBriefing {
  id: string;
  call_id: string;
  lead_id: string | null;
  briefing_content: {
    lead_name?: string;
    lead_score?: number;
    property_address?: string;
    last_interaction?: string;
    talking_points?: string[];
    questions_to_ask?: string[];
    deal_context?: string;
    opening_script?: string;
    warnings?: string[];
  };
  was_viewed: boolean;
  created_at: string;
}

interface CoachingCard {
  id: string;
  call_id: string;
  card_type: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  phase: string | null;
  context: string | null;
  was_dismissed: boolean;
  timestamp_ms: number | null;
  created_at: string;
}

interface CallSummary {
  id: string;
  call_id: string;
  summary: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' | null;
  key_points: string[];
  lead_temperature: 'hot' | 'warm' | 'cold' | 'dead' | null;
  closing_recommendation: string | null;
  unanswered_questions: string[];
  created_at: string;
}

interface ActionItem {
  id: string;
  call_id: string;
  description: string;
  category: string | null;
  due_date: string | null;
  status: 'pending' | 'approved' | 'completed' | 'dismissed';
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ScriptTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  opening_script: string | null;
  starter_questions: string[];
  required_questions: string[];
  is_default: boolean;
}

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function callsFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${CLAW_API_BASE}/api/calls${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      const retryResponse = await fetch(`${CLAW_API_BASE}/api/calls${path}`, {
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
// Call History
// ============================================================================

export function useCallHistory() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async (limit = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callsFetch<{ calls: Call[] }>(`?limit=${limit}`);
      setCalls(data.calls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { calls, fetchCalls, isLoading, error };
}

// ============================================================================
// Pre-Call Briefing
// ============================================================================

export function usePreCallBriefing() {
  const [briefing, setBriefing] = useState<PreCallBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBriefing = useCallback(async (params: {
    contact_id?: string;
    lead_id?: string;
    deal_id?: string;
    phone_number?: string;
    script_template_id?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callsFetch<{ briefing: PreCallBriefing; call: Call }>('/pre-call', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      setBriefing(data.briefing);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate briefing');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { briefing, generateBriefing, isLoading, error };
}

// ============================================================================
// Active Call (coaching cards stream)
// ============================================================================

export function useActiveCall() {
  const [cards, setCards] = useState<CoachingCard[]>([]);
  const [currentCard, setCurrentCard] = useState<CoachingCard | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startCall = useCallback(async (callId: string) => {
    setIsActive(true);
    setCards([]);
    // Start polling for coaching cards
    return callsFetch<{ success: boolean }>(`/${callId}/start`, { method: 'POST' });
  }, []);

  const endCall = useCallback(async (callId: string) => {
    setIsActive(false);
    return callsFetch<{ summary: CallSummary }>(`/${callId}/end`, { method: 'POST' });
  }, []);

  const fetchCoachingCards = useCallback(async (callId: string, sinceMs?: number) => {
    try {
      const params = sinceMs ? `?since_ms=${sinceMs}` : '';
      const data = await callsFetch<{ cards: CoachingCard[] }>(`/${callId}/coaching${params}`);
      if (data.cards.length > 0) {
        setCards((prev) => [...prev, ...data.cards]);
        setCurrentCard(data.cards[data.cards.length - 1]);
      }
      return data.cards;
    } catch {
      return [];
    }
  }, []);

  const dismissCard = useCallback(async (callId: string, cardId: string) => {
    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, was_dismissed: true } : c));
    if (currentCard?.id === cardId) setCurrentCard(null);
    await callsFetch(`/${callId}/coaching/${cardId}/dismiss`, { method: 'POST' }).catch(() => {});
  }, [currentCard]);

  return { cards, currentCard, isActive, startCall, endCall, fetchCoachingCards, dismissCard };
}

// ============================================================================
// Post-Call Summary
// ============================================================================

export function usePostCallSummary() {
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = useCallback(async (callId: string) => {
    setIsLoading(true);
    try {
      const data = await callsFetch<{ summary: CallSummary; action_items: ActionItem[] }>(`/${callId}/summary`);
      setSummary(data.summary);
      setActionItems(data.action_items);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveActionItem = useCallback(async (callId: string, itemId: string) => {
    await callsFetch(`/${callId}/actions/${itemId}/approve`, { method: 'POST' });
    setActionItems((prev) => prev.map((a) => a.id === itemId ? { ...a, status: 'approved' as const } : a));
  }, []);

  const dismissActionItem = useCallback(async (callId: string, itemId: string) => {
    await callsFetch(`/${callId}/actions/${itemId}/dismiss`, { method: 'POST' });
    setActionItems((prev) => prev.map((a) => a.id === itemId ? { ...a, status: 'dismissed' as const } : a));
  }, []);

  return { summary, actionItems, fetchSummary, approveActionItem, dismissActionItem, isLoading };
}

// ============================================================================
// Script Templates
// ============================================================================

export function useScriptTemplates() {
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callsFetch<{ templates: ScriptTemplate[] }>('/templates');
      setTemplates(data.templates);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { templates, fetchTemplates, isLoading };
}

export type { Call, PreCallBriefing, CoachingCard, CallSummary, ActionItem, ScriptTemplate };
