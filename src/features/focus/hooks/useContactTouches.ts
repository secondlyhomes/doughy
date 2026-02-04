// src/features/focus/hooks/useContactTouches.ts
// Hook for managing contact touches (call logging, responsiveness tracking)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ============================================
// Types
// ============================================

export type TouchType = 'first_call' | 'follow_up' | 'voicemail' | 'email' | 'text' | 'in_person';
export type TouchOutcome = 'connected' | 'no_answer' | 'voicemail_left' | 'callback_scheduled' | 'not_interested' | 'other';

export interface ContactTouch {
  id: string;
  user_id: string;
  lead_id: string | null;
  property_id: string | null;
  deal_id: string | null;
  touch_type: TouchType;
  outcome: TouchOutcome;
  responded: boolean;
  notes: string | null;
  callback_scheduled_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TouchInsert {
  lead_id?: string;
  property_id?: string;
  deal_id?: string;
  touch_type: TouchType;
  outcome: TouchOutcome;
  responded: boolean;
  notes?: string;
  callback_scheduled_at?: string;
}

export interface LeadTouchStats {
  totalTouches: number;
  respondedTouches: number;
  lastTouchDate: string | null;
  responsiveness: number | null;
  daysSinceLastTouch: number | null;
}

// ============================================
// Fetch functions
// ============================================

async function fetchTouchesForLead(leadId: string): Promise<ContactTouch[]> {
  const { data, error } = await supabase
    .schema('crm').from('touches')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching touches for lead:', error);
    throw error;
  }

  return data || [];
}

async function fetchRecentTouches(limit: number = 20): Promise<ContactTouch[]> {
  const { data, error } = await supabase
    .schema('crm').from('touches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent touches:', error);
    throw error;
  }

  return data || [];
}

async function fetchLeadTouchStats(leadId: string): Promise<LeadTouchStats> {
  const { data, error } = await supabase
    .schema('crm').from('touches')
    .select('*')
    .eq('lead_id', leadId);

  if (error) {
    console.error('Error fetching lead touch stats:', error);
    throw error;
  }

  const touches = data || [];
  const totalTouches = touches.length;
  const respondedTouches = touches.filter(t => t.responded).length;
  const lastTouch = touches.length > 0
    ? touches.reduce((latest, t) => t.created_at > latest.created_at ? t : latest)
    : null;

  let daysSinceLastTouch: number | null = null;
  if (lastTouch) {
    const lastDate = new Date(lastTouch.created_at);
    const now = new Date();
    daysSinceLastTouch = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    totalTouches,
    respondedTouches,
    lastTouchDate: lastTouch?.created_at || null,
    responsiveness: totalTouches > 0 ? respondedTouches / totalTouches : null,
    daysSinceLastTouch,
  };
}

async function createTouch(touch: TouchInsert): Promise<ContactTouch> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .schema('crm').from('touches')
    .insert({
      ...touch,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating touch:', error);
    throw error;
  }

  return data;
}

async function updateTouch(id: string, updates: Partial<TouchInsert>): Promise<ContactTouch> {
  const { data, error } = await supabase
    .schema('crm').from('touches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating touch:', error);
    throw error;
  }

  return data;
}

async function deleteTouch(id: string): Promise<void> {
  const { error } = await supabase
    .schema('crm').from('touches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting touch:', error);
    throw error;
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch all touches for a specific lead
 */
export function useTouchesForLead(leadId: string | null) {
  const {
    data: touches = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contact-touches', 'lead', leadId],
    queryFn: () => fetchTouchesForLead(leadId!),
    enabled: !!leadId,
  });

  return {
    touches,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch recent touches across all leads
 */
export function useRecentTouches(limit: number = 20) {
  const {
    data: touches = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contact-touches', 'recent', limit],
    queryFn: () => fetchRecentTouches(limit),
  });

  return {
    touches,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch touch statistics for a lead
 */
export function useLeadTouchStats(leadId: string | null) {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contact-touches', 'stats', leadId],
    queryFn: () => fetchLeadTouchStats(leadId!),
    enabled: !!leadId,
  });

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to create a new touch record
 */
export function useCreateTouch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTouch,
    onSuccess: (data) => {
      // Invalidate all touch-related queries
      queryClient.invalidateQueries({ queryKey: ['contact-touches'] });
      // Also invalidate nudges to update stale lead status
      // Use the correct query key that matches useNudges.ts
      queryClient.invalidateQueries({ queryKey: ['nudges-leads-with-touches'] });
      queryClient.invalidateQueries({ queryKey: ['nudges-deals'] });
    },
  });
}

/**
 * Hook to update an existing touch
 */
export function useUpdateTouch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TouchInsert> }) =>
      updateTouch(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-touches'] });
    },
  });
}

/**
 * Hook to delete a touch
 */
export function useDeleteTouch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTouch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-touches'] });
    },
  });
}

export default useTouchesForLead;
