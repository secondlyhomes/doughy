// src/lib/rpc/public.ts
// RPC wrapper functions for public domain
// These replace PostgREST cross-schema queries with proper RPC calls

import { supabase } from '@/lib/supabase';
import type { CallWithContactRPC } from '@/types/rpc-types';

// ============================================================================
// Calls / VoIP
// ============================================================================

/**
 * Fetch recent calls with contact data
 * Replaces: supabase.from('calls').select('*, contact:contacts!contact_id(...)')
 */
export async function getRecentCalls(limit: number = 20): Promise<CallWithContactRPC[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_recent_calls', {
    p_user_id: user.id,
    p_limit: limit,
  });

  if (error) throw error;
  return (data || []) as CallWithContactRPC[];
}
