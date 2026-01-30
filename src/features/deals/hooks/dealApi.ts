// src/features/deals/hooks/dealApi.ts
// API functions for deal CRUD operations

import { supabase } from '@/lib/supabase';
import type { Deal } from '../types';
import type {
  DealRow,
  DealWithRelations,
  DealsFilters,
  CreateDealInput,
  PaginatedDealsResult,
} from './dealTypes';
import { PAGE_SIZE } from './dealTypes';

// ============================================
// Mappers
// ============================================

function mapDealRowToDeal(row: DealWithRelations): Deal {
  return {
    id: row.id,
    user_id: row.user_id,
    lead_id: row.lead_id,
    property_id: row.property_id,
    stage: row.stage || 'new',
    strategy: row.strategy,
    next_action: row.next_action,
    next_action_due: row.next_action_due,
    risk_score: row.risk_score,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lead: row.lead
      ? {
          id: row.lead.id,
          name: row.lead.name,
          phone: row.lead.phone,
          email: row.lead.email,
          status: row.lead.status,
          score: row.lead.score,
          tags: row.lead.tags,
        }
      : undefined,
    property: row.property
      ? {
          id: row.property.id,
          address: row.property.address_line_1,
          address_line_1: row.property.address_line_1,
          address_line_2: row.property.address_line_2,
          city: row.property.city,
          state: row.property.state,
          zip: row.property.zip,
          county: row.property.county,
          bedrooms: row.property.bedrooms,
          bathrooms: row.property.bathrooms,
          sqft: row.property.square_feet,
          square_feet: row.property.square_feet,
          lot_size: row.property.lot_size,
          lotSize: row.property.lot_size,
          year_built: row.property.year_built,
          yearBuilt: row.property.year_built,
          propertyType: row.property.property_type,
          property_type: row.property.property_type,
          arv: row.property.arv,
          purchase_price: row.property.purchase_price,
          notes: row.property.notes,
          status: row.property.status,
        }
      : undefined,
  } as Deal;
}

// ============================================
// Query builders
// ============================================

const DEAL_SELECT_QUERY = `
  *,
  lead:crm_leads(id, name, phone, email, status, score),
  property:investor_properties(id, address_line_1, city, state, zip, bedrooms, bathrooms, square_feet, arv, purchase_price)
`;

const DEAL_SELECT_QUERY_FULL = `
  *,
  lead:crm_leads(id, name, phone, email, status, score, tags),
  property:investor_properties(id, address_line_1, address_line_2, city, state, zip, county, bedrooms, bathrooms, square_feet, lot_size, year_built, property_type, arv, purchase_price, notes, status)
`;

function applyFilters(
  query: ReturnType<typeof supabase.from>,
  filters?: DealsFilters
) {
  let q = query;

  if (filters?.stage && filters.stage !== 'all') {
    q = q.eq('stage', filters.stage);
  }

  if (filters?.strategy) {
    q = q.eq('strategy', filters.strategy);
  }

  if (filters?.activeOnly) {
    q = q.not('stage', 'in', '(closed_won,closed_lost)');
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at';
  const ascending = filters?.sortDirection === 'asc';
  q = q.order(sortBy, { ascending, nullsFirst: false });

  return q;
}

// ============================================
// Fetch functions
// ============================================

export async function fetchDeals(filters?: DealsFilters): Promise<Deal[]> {
  let query = supabase.from('investor_deals_pipeline').select(DEAL_SELECT_QUERY);

  query = applyFilters(query, filters);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }

  return (data || []).map((row: DealWithRelations) => mapDealRowToDeal(row));
}

export async function fetchDealsPaginated(
  pageParam: number = 0,
  filters?: DealsFilters
): Promise<PaginatedDealsResult> {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('investor_deals_pipeline')
    .select(DEAL_SELECT_QUERY, { count: 'exact' });

  query = applyFilters(query, filters);
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching paginated deals:', error);
    throw error;
  }

  const deals = (data || []).map((row: DealWithRelations) => mapDealRowToDeal(row));
  const totalCount = count || 0;
  const hasMore = (pageParam + 1) * PAGE_SIZE < totalCount;

  return {
    deals,
    nextCursor: hasMore ? pageParam + 1 : null,
    hasMore,
  };
}

export async function fetchDealById(id: string): Promise<Deal | null> {
  const { data, error } = await supabase
    .from('investor_deals_pipeline')
    .select(DEAL_SELECT_QUERY_FULL)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching deal:', error);
    throw error;
  }

  if (!data) return null;

  return mapDealRowToDeal(data as DealWithRelations);
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
    .from('investor_deals_pipeline')
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
    .from('investor_deals_pipeline')
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
    .from('investor_deals_pipeline')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
}
