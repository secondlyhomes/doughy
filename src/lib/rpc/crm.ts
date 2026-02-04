// src/lib/rpc/crm.ts
// RPC wrapper functions for CRM domain
// These replace PostgREST cross-schema queries with proper RPC calls

import { supabase } from '@/lib/supabase';
import type { SkipTraceResultRPC } from '@/types/rpc-types';

// ============================================================================
// Skip Trace
// ============================================================================

export interface GetSkipTraceResultsParams {
  contactId?: string;
  leadId?: string;
  propertyId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch skip trace results with contact, lead, and property data
 * Replaces: supabase.schema('crm').from('skip_trace_results').select('*, contact:contacts!contact_id(...), lead:leads!lead_id(...), property:properties!property_id(...), matched_property:properties!matched_property_id(...)')
 */
export async function getSkipTraceResults(params: GetSkipTraceResultsParams = {}): Promise<SkipTraceResultRPC[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('crm').rpc('get_skip_trace_results', {
    p_user_id: user.id,
    p_contact_id: params.contactId || null,
    p_lead_id: params.leadId || null,
    p_property_id: params.propertyId || null,
    p_limit: params.limit || 50,
    p_offset: params.offset || 0,
  });

  if (error) throw error;
  return (data || []) as SkipTraceResultRPC[];
}

/**
 * Fetch a single skip trace result by ID with full relations
 */
export async function getSkipTraceResultById(resultId: string): Promise<SkipTraceResultRPC | null> {
  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('crm').rpc('get_skip_trace_result_by_id', {
    p_result_id: resultId,
  });

  if (error) throw error;
  const results = data as SkipTraceResultRPC[] | null;
  return results?.[0] || null;
}
