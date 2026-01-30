// src/features/deals/hooks/useDealsWithEvents.ts
// Hook that automatically logs timeline events when deal state changes

import { useQueryClient } from '@tanstack/react-query';
import type { Deal } from '../types';
import { DEAL_STAGE_CONFIG } from '../types';
import { logDealEvent } from './useDealEvents';
import { useUpdateDeal } from './useDealMutations';

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
    const result = await updateDealMutation.mutateAsync({
      id: dealId,
      data: updates,
    });

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
    if (
      updates.risk_score !== undefined &&
      updates.risk_score !== oldDeal.risk_score
    ) {
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
      description: amount
        ? `Draft offer for $${amount.toLocaleString()}`
        : undefined,
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
      description: amount
        ? `Offer for $${amount.toLocaleString()} sent to seller`
        : undefined,
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
    const eventType =
      status === 'started' ? 'walkthrough_started' : 'walkthrough_completed';
    await logDealEvent({
      deal_id: dealId,
      event_type: eventType,
      title:
        status === 'started' ? 'Walkthrough started' : 'Walkthrough completed',
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
    const eventType =
      action === 'uploaded' ? 'document_uploaded' : 'document_signed';
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
    isUpdating: updateDealMutation.isPending,
  };
}
