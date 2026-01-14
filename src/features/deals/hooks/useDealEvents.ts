// src/features/deals/hooks/useDealEvents.ts
// Zone B: Task B2 - Deal events hook for timeline
// Provides CRUD operations and auto-logging for deal events

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, USE_MOCK_DATA } from '@/lib/supabase';
import { DealEvent, DealEventType, KEY_EVENT_TYPES } from '../types/events';

// ============================================
// Mock data for development
// ============================================

const mockDealEvents: DealEvent[] = [
  {
    id: 'event-1',
    deal_id: 'deal-1',
    event_type: 'stage_change',
    title: 'Stage changed to Analyzing',
    description: 'Deal moved from Contacted to Analyzing stage',
    metadata: { from: 'contacted', to: 'analyzing' },
    source: 'system',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-2',
    deal_id: 'deal-1',
    event_type: 'offer_created',
    title: 'Cash offer created',
    description: 'Draft offer for $185,000',
    metadata: { offer_type: 'cash', amount: 185000 },
    source: 'user',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-3',
    deal_id: 'deal-1',
    event_type: 'walkthrough_completed',
    title: 'Walkthrough completed',
    description: '12 photos captured, 3 voice memos',
    metadata: { photos: 12, voice_memos: 3 },
    source: 'user',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-4',
    deal_id: 'deal-1',
    event_type: 'note',
    title: 'Note added',
    description: 'Seller mentioned they need to move by end of month. Motivated!',
    source: 'user',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-5',
    deal_id: 'deal-1',
    event_type: 'next_action_set',
    title: 'Send initial offer',
    metadata: { previous: 'Schedule walkthrough' },
    source: 'system',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// Data fetching functions
// ============================================

async function fetchDealEvents(dealId: string): Promise<DealEvent[]> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockDealEvents.filter((e) => e.deal_id === dealId);
  }

  // Note: deal_events table type will be available after running migrations
  const { data, error } = await (supabase as any)
    .from('deal_events')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as DealEvent[]) || [];
}

async function createDealEvent(event: Omit<DealEvent, 'id' | 'created_at'>): Promise<DealEvent> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    const newEvent: DealEvent = {
      ...event,
      id: `event-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    console.log('[Mock] Created deal event:', newEvent);
    return newEvent;
  }

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
