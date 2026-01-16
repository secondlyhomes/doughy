// src/features/deals/hooks/useDeals.ts
// Deal hooks for fetching and managing deals
// Uses supabase.from() which auto-switches between mock/real based on EXPO_PUBLIC_USE_MOCK_DATA

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Deal,
  DealStage,
  DealStrategy,
  DEAL_STAGE_CONFIG,
} from '../types';
import { logDealEvent } from './useDealEvents';

// ============================================
// Types
// ============================================

export interface DealsFilters {
  stage?: DealStage | 'all';
  strategy?: DealStrategy;
  search?: string;
  activeOnly?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'next_action_due' | 'stage';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateDealInput {
  lead_id?: string;
  property_id?: string;
  stage?: DealStage;
  strategy?: DealStrategy;
  next_action?: string;
  next_action_due?: string;
  title?: string;
}

// ============================================
// Fetch functions
// ============================================

async function fetchDeals(filters?: DealsFilters): Promise<Deal[]> {
  // Build query with related data
  let query = supabase
    .from('deals')
    .select(`
      *,
      lead:leads(id, name, phone, email, status, score),
      property:re_properties(id, address_line_1, city, state, zip, bedrooms, bathrooms, square_feet, arv, purchase_price)
    `);

  // Apply filters
  if (filters?.stage && filters.stage !== 'all') {
    query = query.eq('stage', filters.stage);
  }

  if (filters?.strategy) {
    query = query.eq('strategy', filters.strategy);
  }

  if (filters?.activeOnly) {
    query = query.not('stage', 'in', '(closed_won,closed_lost)');
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'created_at';
  const ascending = filters?.sortDirection === 'asc';
  query = query.order(sortBy, { ascending, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }

  // Map database response to Deal type
  return (data || []).map((row: any) => ({
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
    // Nested relations
    lead: row.lead ? {
      id: row.lead.id,
      name: row.lead.name,
      phone: row.lead.phone,
      email: row.lead.email,
      status: row.lead.status,
      score: row.lead.score,
    } : undefined,
    property: row.property ? {
      id: row.property.id,
      address: row.property.address_line_1,
      address_line_1: row.property.address_line_1,
      city: row.property.city,
      state: row.property.state,
      zip: row.property.zip,
      bedrooms: row.property.bedrooms,
      bathrooms: row.property.bathrooms,
      sqft: row.property.square_feet,
      square_feet: row.property.square_feet,
      arv: row.property.arv,
      purchase_price: row.property.purchase_price,
    } : undefined,
  })) as Deal[];
}

async function fetchDealById(id: string): Promise<Deal | null> {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      lead:leads(id, name, phone, email, status, score, tags),
      property:re_properties(id, address_line_1, address_line_2, city, state, zip, county, bedrooms, bathrooms, square_feet, lot_size, year_built, property_type, arv, purchase_price, notes, status)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching deal:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    lead_id: data.lead_id,
    property_id: data.property_id,
    stage: data.stage || 'new',
    strategy: data.strategy,
    next_action: data.next_action,
    next_action_due: data.next_action_due,
    risk_score: data.risk_score,
    created_at: data.created_at,
    updated_at: data.updated_at,
    lead: data.lead ? {
      id: data.lead.id,
      name: data.lead.name,
      phone: data.lead.phone,
      email: data.lead.email,
      status: data.lead.status,
      score: data.lead.score,
      tags: data.lead.tags,
    } : undefined,
    property: data.property ? {
      id: data.property.id,
      address: data.property.address_line_1,
      address_line_1: data.property.address_line_1,
      address_line_2: data.property.address_line_2,
      city: data.property.city,
      state: data.property.state,
      zip: data.property.zip,
      county: data.property.county,
      bedrooms: data.property.bedrooms,
      bathrooms: data.property.bathrooms,
      sqft: data.property.square_feet,
      square_feet: data.property.square_feet,
      lot_size: data.property.lot_size,
      lotSize: data.property.lot_size,
      year_built: data.property.year_built,
      yearBuilt: data.property.year_built,
      propertyType: data.property.property_type,
      property_type: data.property.property_type,
      arv: data.property.arv,
      purchase_price: data.property.purchase_price,
      notes: data.property.notes,
      status: data.property.status,
    } : undefined,
  } as Deal;
}

async function createDeal(dealData: CreateDealInput): Promise<Deal> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Note: strategy and risk_score columns don't exist in DB yet
  // These can be added via migration when needed
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
    .from('deals')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating deal:', error);
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    lead_id: data.lead_id,
    property_id: data.property_id,
    stage: data.stage,
    strategy: data.strategy,
    next_action: data.next_action,
    next_action_due: data.next_action_due,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as Deal;
}

async function updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Map fields - only columns that exist in the database
  // Note: strategy and risk_score columns don't exist yet
  if (updates.stage !== undefined) updateData.stage = updates.stage;
  if (updates.next_action !== undefined) updateData.next_action = updates.next_action;
  if (updates.next_action_due !== undefined) updateData.next_action_due = updates.next_action_due;
  if (updates.lead_id !== undefined) updateData.lead_id = updates.lead_id;
  if (updates.property_id !== undefined) updateData.property_id = updates.property_id;

  const { data, error } = await supabase
    .from('deals')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating deal:', error);
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    lead_id: data.lead_id,
    property_id: data.property_id,
    stage: data.stage,
    strategy: data.strategy,
    next_action: data.next_action,
    next_action_due: data.next_action_due,
    risk_score: data.risk_score,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as Deal;
}

async function deleteDeal(id: string): Promise<void> {
  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch all deals with optional filters
 */
export function useDeals(filters?: DealsFilters) {
  const {
    data: deals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deals', filters],
    queryFn: () => fetchDeals(filters),
  });

  return {
    deals,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetch a single deal by ID
 */
export function useDeal(id: string) {
  const {
    data: deal,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => fetchDealById(id),
    enabled: !!id && id !== '',
  });

  return {
    deal,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetch deals with upcoming actions (for Inbox)
 */
export function useDealsWithActions(limit: number = 5) {
  const {
    data: deals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deals', 'actions', limit],
    queryFn: async () => {
      const allDeals = await fetchDeals({ activeOnly: true, sortBy: 'next_action_due', sortDirection: 'asc' });
      return allDeals.slice(0, limit);
    },
  });

  return {
    deals,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Create a new deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

/**
 * Update an existing deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Deal> }) => updateDeal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', variables.id] });
    },
  });
}

/**
 * Delete a deal (hard delete)
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

/**
 * Update deal stage
 */
export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      updateDeal(id, { stage }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', variables.id] });
    },
  });
}

// ============================================
// Zone B: Auto-event triggers (Task B3)
// ============================================

/**
 * Wrapper hook that automatically logs timeline events
 * when deal state changes. Use this instead of useUpdateDeal
 * when you want automatic audit trail.
 */
export function useDealsWithEvents() {
  const queryClient = useQueryClient();
  const updateDealMutation = useUpdateDeal();

  /**
   * Update a deal and automatically log timeline events
   * for stage changes, next action changes, and risk score changes
   */
  const updateDealWithEvents = async (
    dealId: string,
    updates: Partial<Deal>,
    oldDeal: Deal
  ): Promise<Deal> => {
    // Perform the actual update
    const result = await updateDealMutation.mutateAsync({ id: dealId, data: updates });

    // Auto-log stage change
    if (updates.stage && updates.stage !== oldDeal.stage) {
      const fromLabel = DEAL_STAGE_CONFIG[oldDeal.stage]?.label || oldDeal.stage;
      const toLabel = DEAL_STAGE_CONFIG[updates.stage]?.label || updates.stage;

      await logDealEvent({
        deal_id: dealId,
        event_type: 'stage_change',
        title: `Stage changed to ${toLabel}`,
        description: `Deal moved from ${fromLabel} to ${toLabel}`,
        metadata: {
          from: oldDeal.stage,
          to: updates.stage,
          from_label: fromLabel,
          to_label: toLabel,
        },
        source: 'system',
      });
    }

    // Auto-log next action change
    if (updates.next_action && updates.next_action !== oldDeal.next_action) {
      await logDealEvent({
        deal_id: dealId,
        event_type: 'next_action_set',
        title: updates.next_action,
        metadata: { previous: oldDeal.next_action },
        source: 'user',
      });
    }

    // Auto-log risk score change
    if (updates.risk_score !== undefined && updates.risk_score !== oldDeal.risk_score) {
      await logDealEvent({
        deal_id: dealId,
        event_type: 'risk_score_changed',
        title: `Risk score updated to ${updates.risk_score}`,
        metadata: { from: oldDeal.risk_score, to: updates.risk_score },
        source: 'system',
      });
    }

    // Invalidate events query so timeline updates
    queryClient.invalidateQueries({ queryKey: ['deal-events', dealId] });

    return result;
  };

  /**
   * Log an offer creation event
   */
  const logOfferCreated = async (
    dealId: string,
    offerType: string,
    amount?: number
  ) => {
    await logDealEvent({
      deal_id: dealId,
      event_type: 'offer_created',
      title: `${offerType.replace('_', ' ')} offer created`,
      description: amount ? `Draft offer for $${amount.toLocaleString()}` : undefined,
      metadata: { offer_type: offerType, amount },
      source: 'user',
    });
    queryClient.invalidateQueries({ queryKey: ['deal-events', dealId] });
  };

  /**
   * Log an offer sent event
   */
  const logOfferSent = async (
    dealId: string,
    offerType: string,
    amount?: number
  ) => {
    await logDealEvent({
      deal_id: dealId,
      event_type: 'offer_sent',
      title: `${offerType.replace('_', ' ')} offer sent`,
      description: amount ? `Offer for $${amount.toLocaleString()} sent to seller` : undefined,
      metadata: { offer_type: offerType, amount },
      source: 'user',
    });
    queryClient.invalidateQueries({ queryKey: ['deal-events', dealId] });
  };

  /**
   * Log a walkthrough event
   */
  const logWalkthroughEvent = async (
    dealId: string,
    status: 'started' | 'completed',
    metadata?: Record<string, unknown>
  ) => {
    const eventType = status === 'started' ? 'walkthrough_started' : 'walkthrough_completed';
    await logDealEvent({
      deal_id: dealId,
      event_type: eventType,
      title: status === 'started' ? 'Walkthrough started' : 'Walkthrough completed',
      metadata,
      source: 'user',
    });
    queryClient.invalidateQueries({ queryKey: ['deal-events', dealId] });
  };

  /**
   * Log a seller report generated event
   */
  const logSellerReportGenerated = async (dealId: string) => {
    await logDealEvent({
      deal_id: dealId,
      event_type: 'seller_report_generated',
      title: 'Seller report generated',
      description: 'Options report created and ready to share',
      source: 'system',
    });
    queryClient.invalidateQueries({ queryKey: ['deal-events', dealId] });
  };

  /**
   * Log a document event
   */
  const logDocumentEvent = async (
    dealId: string,
    action: 'uploaded' | 'signed',
    docName?: string
  ) => {
    const eventType = action === 'uploaded' ? 'document_uploaded' : 'document_signed';
    await logDealEvent({
      deal_id: dealId,
      event_type: eventType,
      title: action === 'uploaded' ? `Document uploaded` : `Document signed`,
      description: docName,
      source: 'user',
    });
    queryClient.invalidateQueries({ queryKey: ['deal-events', dealId] });
  };

  /**
   * Log a manual note
   */
  const logNote = async (dealId: string, note: string) => {
    await logDealEvent({
      deal_id: dealId,
      event_type: 'note',
      title: 'Note added',
      description: note,
      source: 'user',
    });
    queryClient.invalidateQueries({ queryKey: ['deal-events', dealId] });
  };

  return {
    updateDealWithEvents,
    logOfferCreated,
    logOfferSent,
    logWalkthroughEvent,
    logSellerReportGenerated,
    logDocumentEvent,
    logNote,
    // Pass through the original mutation for status
    isUpdating: updateDealMutation.isPending,
  };
}

export default useDeals;
