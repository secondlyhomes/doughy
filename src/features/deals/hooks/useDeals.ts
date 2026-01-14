// src/features/deals/hooks/useDeals.ts
// Deal hooks for fetching and managing deals
// Client-side first - uses mock data, will connect to Supabase later

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Deal,
  DealStage,
  DealStrategy,
  DEAL_STAGE_CONFIG,
} from '../types';
import {
  mockDeals,
  getMockDealById,
  getMockDealsByStage,
  getActiveMockDeals,
  getMockDealsWithActions,
  searchMockDeals,
} from '../data/mockDeals';
import { logDealEvent } from './useDealEvents';
import type { DealEventType } from '../types/events';

// TODO: Import supabase when connecting to database
// import { supabase } from '@/lib/supabase';

// ============================================
// Fetch functions (mock data for now)
// ============================================

async function fetchDeals(filters?: DealsFilters): Promise<Deal[]> {
  // Simulate network delay for realistic dev experience
  await new Promise((resolve) => setTimeout(resolve, 300));

  let deals = [...mockDeals];

  // Apply filters
  if (filters?.stage && filters.stage !== 'all') {
    deals = deals.filter((d) => d.stage === filters.stage);
  }

  if (filters?.strategy) {
    deals = deals.filter((d) => d.strategy === filters.strategy);
  }

  if (filters?.search) {
    const query = filters.search.toLowerCase();
    deals = deals.filter((d) => {
      const address = d.property?.address?.toLowerCase() || '';
      const leadName = d.lead?.name?.toLowerCase() || '';
      return address.includes(query) || leadName.includes(query);
    });
  }

  if (filters?.activeOnly) {
    deals = deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
  }

  // Apply sorting
  if (filters?.sortBy) {
    deals.sort((a, b) => {
      const direction = filters.sortDirection === 'desc' ? -1 : 1;

      switch (filters.sortBy) {
        case 'created_at':
          return direction * (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        case 'updated_at':
          return direction * (new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime());
        case 'next_action_due':
          if (!a.next_action_due) return 1;
          if (!b.next_action_due) return -1;
          return direction * (new Date(a.next_action_due).getTime() - new Date(b.next_action_due).getTime());
        case 'stage':
          return direction * (a.stage.localeCompare(b.stage));
        default:
          return 0;
      }
    });
  }

  return deals;
}

async function fetchDealById(id: string): Promise<Deal | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));
  return getMockDealById(id) || null;
}

async function createDeal(dealData: CreateDealInput): Promise<Deal> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  // Generate a new ID (in real app, Supabase would do this)
  const newDeal: Deal = {
    id: `deal-${Date.now()}`,
    lead_id: dealData.lead_id,
    property_id: dealData.property_id,
    stage: dealData.stage || 'new',
    strategy: dealData.strategy,
    next_action: dealData.next_action || 'Review lead and property details',
    next_action_due: dealData.next_action_due,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // In real app, this would insert into Supabase
  // For now, we can't actually persist to mock data
  console.log('[Mock] Created deal:', newDeal);

  return newDeal;
}

async function updateDeal(id: string, dealData: Partial<Deal>): Promise<Deal> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const existingDeal = getMockDealById(id);
  if (!existingDeal) {
    throw new Error(`Deal ${id} not found`);
  }

  const updatedDeal: Deal = {
    ...existingDeal,
    ...dealData,
    updated_at: new Date().toISOString(),
  };

  // In real app, this would update Supabase
  console.log('[Mock] Updated deal:', updatedDeal);

  return updatedDeal;
}

async function deleteDeal(id: string): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In real app, this would soft delete in Supabase
  console.log('[Mock] Deleted deal:', id);
}

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
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch all deals with optional filters
 */
export function useDeals(filters?: DealsFilters) {
  const queryClient = useQueryClient();

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
    enabled: !!id,
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
      await new Promise((resolve) => setTimeout(resolve, 200));
      return getMockDealsWithActions(limit);
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
 * Delete a deal (soft delete)
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
    const eventType: DealEventType = status === 'started' ? 'walkthrough_started' : 'walkthrough_completed';
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
    const eventType: DealEventType = action === 'uploaded' ? 'document_uploaded' : 'document_signed';
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
