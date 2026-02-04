// src/features/deals/hooks/dealApi.ts
// API functions for deal CRUD operations
// Uses RPC functions for cross-schema queries

import { supabase, db } from '@/lib/supabase';
import { getDealsWithLead, getDealById as getDealByIdRPC } from '@/lib/rpc/investor';
import { mapDealRPC } from '@/lib/rpc/mappers';
import type { Deal } from '../types';
import type {
  DealRow,
  DealsFilters,
  CreateDealInput,
  PaginatedDealsResult,
} from './dealTypes';
import { PAGE_SIZE } from './dealTypes';

// ============================================
// Fetch functions (using RPC)
// ============================================

export async function fetchDeals(filters?: DealsFilters): Promise<Deal[]> {
  const data = await getDealsWithLead({
    stage: filters?.stage !== 'all' ? filters?.stage : undefined,
    strategy: filters?.strategy,
    activeOnly: filters?.activeOnly,
    sortBy: filters?.sortBy as 'created_at' | 'updated_at' | 'next_action_due',
    sortDirection: filters?.sortDirection,
  });

  return data.map(mapDealRPC) as Deal[];
}

export async function fetchDealsPaginated(
  pageParam: number = 0,
  filters?: DealsFilters
): Promise<PaginatedDealsResult> {
  const from = pageParam * PAGE_SIZE;

  const data = await getDealsWithLead({
    stage: filters?.stage !== 'all' ? filters?.stage : undefined,
    strategy: filters?.strategy,
    activeOnly: filters?.activeOnly,
    sortBy: filters?.sortBy as 'created_at' | 'updated_at' | 'next_action_due',
    sortDirection: filters?.sortDirection,
    limit: PAGE_SIZE,
    offset: from,
  });

  const deals = data.map(mapDealRPC) as Deal[];
  // RPC doesn't return count, so we determine hasMore by checking if we got a full page
  const hasMore = data.length === PAGE_SIZE;

  return {
    deals,
    nextCursor: hasMore ? pageParam + 1 : null,
    hasMore,
  };
}

export async function fetchDealById(id: string): Promise<Deal | null> {
  const data = await getDealByIdRPC(id);
  if (!data) return null;
  return mapDealRPC(data) as Deal;
}

// ============================================
// Mutation functions
// ============================================

export async function createDeal(dealData: CreateDealInput): Promise<Deal> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const insertData = {
    user_id: user.id,
    lead_id: dealData.lead_id || null,
    property_id: dealData.property_id || null,
    stage: dealData.stage || 'new',
    next_action: dealData.next_action || 'Review lead and property details',
    next_action_due: dealData.next_action_due || null,
    title: dealData.title || 'New Deal',
    status: 'active',
  };

  const { data, error } = await supabase
    .schema('investor').from('deals_pipeline')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating deal:', error);
    throw error;
  }

  const createdDeal = data as DealRow;
  return {
    id: createdDeal.id,
    user_id: createdDeal.user_id,
    lead_id: createdDeal.lead_id,
    property_id: createdDeal.property_id,
    stage: createdDeal.stage,
    strategy: createdDeal.strategy,
    next_action: createdDeal.next_action,
    next_action_due: createdDeal.next_action_due,
    created_at: createdDeal.created_at,
    updated_at: createdDeal.updated_at,
  } as Deal;
}

export async function updateDeal(
  id: string,
  updates: Partial<Deal>
): Promise<Deal> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.stage !== undefined) updateData.stage = updates.stage;
  if (updates.next_action !== undefined) updateData.next_action = updates.next_action;
  if (updates.next_action_due !== undefined)
    updateData.next_action_due = updates.next_action_due;
  if (updates.lead_id !== undefined) updateData.lead_id = updates.lead_id;
  if (updates.property_id !== undefined) updateData.property_id = updates.property_id;

  const { data, error } = await supabase
    .schema('investor').from('deals_pipeline')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating deal:', error);
    throw error;
  }

  const updatedDeal = data as DealRow;
  return {
    id: updatedDeal.id,
    user_id: updatedDeal.user_id,
    lead_id: updatedDeal.lead_id,
    property_id: updatedDeal.property_id,
    stage: updatedDeal.stage,
    strategy: updatedDeal.strategy,
    next_action: updatedDeal.next_action,
    next_action_due: updatedDeal.next_action_due,
    risk_score: updatedDeal.risk_score,
    created_at: updatedDeal.created_at,
    updated_at: updatedDeal.updated_at,
  } as Deal;
}

export async function deleteDeal(id: string): Promise<void> {
  const { error } = await supabase
    .schema('investor').from('deals_pipeline')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
}
