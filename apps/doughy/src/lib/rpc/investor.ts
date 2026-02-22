// src/lib/rpc/investor.ts
// RPC wrapper functions for investor domain
// These replace PostgREST cross-schema queries with proper RPC calls

import { supabase } from '@/lib/supabase';
import type {
  DealWithLeadRPC,
  PropertyDealRPC,
  NudgeDealRPC,
  PropertyWithLeadRPC,
  InvestorConversationRPC,
  MailHistoryRPC,
  MailHistoryStatsRPC,
} from '@/types/rpc-types';

// ============================================================================
// Deals
// ============================================================================

export interface GetDealsParams {
  stage?: string | null;
  activeOnly?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'next_action_due';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Fetch deals with lead and property data
 * Replaces: supabase.schema('investor').from('deals_pipeline').select('*, lead:leads!lead_id(...), property:properties!property_id(...)')
 */
export async function getDealsWithLead(params: GetDealsParams = {}): Promise<DealWithLeadRPC[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await supabase.schema('investor').rpc('get_deals_with_lead', {
    p_user_id: user.id,
    p_stage: params.stage || null,
    p_active_only: params.activeOnly || false,
    p_sort_by: params.sortBy || 'created_at',
    p_sort_direction: params.sortDirection || 'desc',
    p_limit: params.limit || 50,
    p_offset: params.offset || 0,
  });

  if (error) throw error;
  return (data || []) as DealWithLeadRPC[];
}

/**
 * Fetch a single deal by ID with full relations
 * Replaces: supabase.schema('investor').from('deals_pipeline').select('*, lead:leads!lead_id(...), property:properties!property_id(...)').eq('id', id).single()
 */
export async function getDealById(dealId: string): Promise<DealWithLeadRPC | null> {
  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('investor').rpc('get_deal_by_id', {
    p_deal_id: dealId,
  });

  if (error) throw error;
  const results = data as DealWithLeadRPC[] | null;
  return results?.[0] || null;
}

/**
 * Fetch deals for a specific property
 * Replaces: supabase.schema('investor').from('deals_pipeline').select('*, lead:leads!lead_id(...)').eq('property_id', propertyId)
 */
export async function getPropertyDeals(propertyId: string): Promise<PropertyDealRPC[]> {
  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('investor').rpc('get_property_deals', {
    p_property_id: propertyId,
  });

  if (error) throw error;
  return (data || []) as PropertyDealRPC[];
}

/**
 * Fetch active deals for nudge calculations
 * Replaces: complex nudge query with lead/property joins
 */
export async function getNudgeDeals(limit: number = 50): Promise<NudgeDealRPC[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('investor').rpc('get_nudge_deals', {
    p_user_id: user.id,
    p_limit: limit,
  });

  if (error) throw error;
  return (data || []) as NudgeDealRPC[];
}

// ============================================================================
// Properties
// ============================================================================

/**
 * Fetch properties by IDs with lead and primary image data
 * Replaces: supabase.schema('investor').from('properties').select('*, lead:leads!lead_id(...), images:property_images(...)')
 */
export async function getPropertiesWithLead(propertyIds: string[]): Promise<PropertyWithLeadRPC[]> {
  if (propertyIds.length === 0) return [];

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('investor').rpc('get_properties_with_lead', {
    p_property_ids: propertyIds,
  });

  if (error) throw error;
  return (data || []) as PropertyWithLeadRPC[];
}

// ============================================================================
// Conversations
// ============================================================================

/**
 * Fetch investor conversations with lead, property, and deal data
 * Replaces: supabase.schema('investor').from('conversations').select('*, lead:leads!lead_id(...), property:properties(...), deal:deals_pipeline(...)')
 */
export async function getConversationsWithLead(
  conversationIds?: string[]
): Promise<InvestorConversationRPC[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('investor').rpc('get_conversations_with_lead', {
    p_user_id: user.id,
    p_conversation_ids: conversationIds || null,
  });

  if (error) throw error;
  return (data || []) as InvestorConversationRPC[];
}

/**
 * Fetch a single investor conversation by ID
 */
export async function getConversationById(conversationId: string): Promise<InvestorConversationRPC | null> {
  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('investor').rpc('get_investor_conversation_by_id', {
    p_conversation_id: conversationId,
  });

  if (error) throw error;
  const results = data as InvestorConversationRPC[] | null;
  return results?.[0] || null;
}

// ============================================================================
// Mail History
// ============================================================================

export interface GetMailHistoryParams {
  status?: string;
  mailPieceType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch mail history with enrollment and contact data
 * Replaces: supabase.schema('investor').from('drip_touch_logs').select('*, enrollment:drip_enrollments(contact:contacts!contact_id(...))')
 */
export async function getMailHistory(params: GetMailHistoryParams = {}): Promise<MailHistoryRPC[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('investor').rpc('get_mail_history', {
    p_user_id: user.id,
    p_status: params.status || null,
    p_mail_piece_type: params.mailPieceType || null,
    p_limit: params.limit || 50,
    p_offset: params.offset || 0,
  });

  if (error) throw error;
  return (data || []) as MailHistoryRPC[];
}

/**
 * Fetch aggregate mail history stats
 */
export async function getMailHistoryStats(): Promise<MailHistoryStatsRPC> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // @ts-expect-error - schema not in generated types yet
  const { data, error } = await
  supabase.schema('investor').rpc('get_mail_history_stats', {
    p_user_id: user.id,
  });

  if (error) throw error;
  const results = data as MailHistoryStatsRPC[] | null;
  return results?.[0] || {
    total_sent: 0,
    total_delivered: 0,
    total_failed: 0,
    total_pending: 0,
    total_cost: 0,
  };
}
