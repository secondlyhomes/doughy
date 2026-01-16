// src/features/deals/hooks/useDealEvents.ts
// Zone B: Task B2 - Deal events hook for timeline
// Provides CRUD operations and auto-logging for deal events

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, USE_MOCK_DATA } from '@/lib/supabase';
import { DealEvent, DealEventType, KEY_EVENT_TYPES } from '../types/events';

// ============================================
// Data fetching functions
// ============================================

async function fetchDealEvents(dealId: string): Promise<DealEvent[]> {
  // Simulate network delay for mock mode
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  try {
    // Query deal_events - works for both mock and real Supabase
    const { data, error } = await (supabase as any)
      .from('deal_events')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) {
      // Log the actual error for debugging
      console.warn('[DealEvents] Query error:', error.message || error);

      // If table doesn't exist in real mode, return empty array gracefully
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('[DealEvents] Table may not exist yet - returning empty array');
        return [];
      }

      throw error;
    }

    return (data as DealEvent[]) || [];
  } catch (err) {
    console.error('[DealEvents] Fetch error:', err);
    // Return empty array instead of crashing to allow the UI to render
    return [];
  }
}

async function createDealEvent(event: Omit<DealEvent, 'id' | 'created_at'>): Promise<DealEvent> {
  // Simulate network delay for mock mode
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Insert into deal_events - works for both mock and real Supabase
  const { data, error } = await (supabase as any)
    .from('deal_events')
    .insert({
      deal_id: event.deal_id,
      event_type: event.event_type,
      title: event.title,
      description: event.description,
      metadata: event.metadata,
      source: event.source,
      created_by: event.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DealEvent;
}

// ============================================
// Hook exports
// ============================================

export interface LogEventInput {
  deal_id: string;
  event_type: DealEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  source?: 'system' | 'user' | 'ai';
}

/**
 * Hook for fetching and managing deal events (timeline)
 */
export function useDealEvents(dealId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch events for a deal
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deal-events', dealId],
    queryFn: () => fetchDealEvents(dealId!),
    enabled: !!dealId,
  });

  // Log a new event
  const logEvent = useMutation({
    mutationFn: (event: LogEventInput) =>
      createDealEvent({
        ...event,
        source: event.source || 'system',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-events', dealId] });
    },
  });

  // Filter for key events only (for Focus Mode)
  const keyEvents = events?.filter((e) =>
    KEY_EVENT_TYPES.includes(e.event_type)
  );

  // Get recent events (for context summaries)
  const recentEvents = events?.slice(0, 5);

  return {
    events,
    keyEvents,
    recentEvents,
    isLoading,
    error,
    refetch,
    logEvent,
  };
}

/**
 * Standalone function to log an event (used by auto-triggers)
 * This can be called outside of React components
 */
export async function logDealEvent(event: LogEventInput): Promise<DealEvent> {
  return createDealEvent({
    ...event,
    source: event.source || 'system',
  });
}

export default useDealEvents;
