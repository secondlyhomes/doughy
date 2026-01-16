// src/features/deals/hooks/useNextAction.ts
// Next Best Action (NBA) engine for deals
// Rule-based system that suggests the next action based on deal state

import { useMemo } from 'react';
import {
  Deal,
  DealStage,
  DEAL_STAGE_CONFIG,
  isDealClosed,
} from '../types';

// ============================================
// Types
// ============================================

export interface NextAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: ActionCategory;
  dueDate?: string;
  isOverdue?: boolean;
}

export type ActionCategory =
  | 'contact'
  | 'analyze'
  | 'walkthrough'
  | 'underwrite'
  | 'offer'
  | 'negotiate'
  | 'close'
  | 'followup'
  | 'document';

// ============================================
// NBA Rules Engine
// ============================================

/**
 * Stage-based default actions
 */
const STAGE_DEFAULT_ACTIONS: Record<DealStage, { action: string; category: ActionCategory }> = {
  initial_contact: {
    action: 'Review lead details and make initial contact',
    category: 'contact',
  },
  new: {
    action: 'Review lead details and make initial contact',
    category: 'contact',
  },
  contacted: {
    action: 'Schedule appointment to view property',
    category: 'contact',
  },
  appointment_set: {
    action: 'Complete property walkthrough',
    category: 'walkthrough',
  },
  analyzing: {
    action: 'Complete underwriting analysis',
    category: 'underwrite',
  },
  offer_sent: {
    action: 'Follow up on offer with seller',
    category: 'followup',
  },
  negotiating: {
    action: 'Respond to counter offer',
    category: 'negotiate',
  },
  under_contract: {
    action: 'Coordinate closing with title company',
    category: 'close',
  },
  closed_won: {
    action: 'Deal closed - no action needed',
    category: 'close',
  },
  closed_lost: {
    action: 'Deal closed - consider follow-up in 3 months',
    category: 'followup',
  },
};

/**
 * Calculate the next best action for a deal
 */
export function calculateNextAction(deal: Deal): NextAction {
  // If deal has a manual next_action set, use that
  if (deal.next_action) {
    // Normalize dates to start-of-day for consistent timezone-safe comparison
    // This prevents edge cases where a due date at midnight could be marked
    // overdue or not depending on the user's timezone
    const isOverdue = (() => {
      if (!deal.next_action_due) return false;
      const dueDate = new Date(deal.next_action_due);
      const now = new Date();
      // Set both to start of day (local time) for fair comparison
      dueDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return dueDate < now;
    })();

    return {
      action: deal.next_action,
      priority: isOverdue ? 'high' : 'medium',
      category: inferCategoryFromAction(deal.next_action, deal.stage),
      dueDate: deal.next_action_due,
      isOverdue,
    };
  }

  // Check for missing critical data
  const missingDataAction = checkMissingData(deal);
  if (missingDataAction) {
    return missingDataAction;
  }

  // Check for stage-specific conditions
  const stageSpecificAction = checkStageConditions(deal);
  if (stageSpecificAction) {
    return stageSpecificAction;
  }

  // Fall back to default stage action
  const defaultAction = STAGE_DEFAULT_ACTIONS[deal.stage];

  // Handle unknown stages gracefully (e.g., from database with different stage values)
  if (!defaultAction) {
    return {
      action: 'Review deal and update stage',
      priority: 'medium',
      category: 'followup',
    };
  }

  return {
    action: defaultAction.action,
    priority: getPriorityForStage(deal.stage),
    category: defaultAction.category,
  };
}

/**
 * Check for missing critical data that should be addressed
 */
function checkMissingData(deal: Deal): NextAction | null {
  // No property linked
  if (!deal.property_id && !deal.property) {
    return {
      action: 'Link or add property to this deal',
      priority: 'high',
      category: 'document',
    };
  }

  // No lead linked
  if (!deal.lead_id && !deal.lead) {
    return {
      action: 'Link or add lead contact to this deal',
      priority: 'high',
      category: 'contact',
    };
  }

  // In analyzing stage but no ARV
  if (deal.stage === 'analyzing' && deal.property && !deal.property.arv) {
    return {
      action: 'Run comps to determine ARV',
      priority: 'high',
      category: 'analyze',
    };
  }

  // In analyzing stage but no repair estimate
  if (deal.stage === 'analyzing' && deal.property && !deal.property.repair_cost) {
    return {
      action: 'Complete walkthrough to estimate repairs',
      priority: 'high',
      category: 'walkthrough',
    };
  }

  // Ready to send offer but no strategy selected
  if (deal.stage === 'analyzing' && !deal.strategy) {
    return {
      action: 'Select exit strategy (Cash, Seller Finance, Subject-To)',
      priority: 'medium',
      category: 'underwrite',
    };
  }

  return null;
}

/**
 * Check stage-specific conditions for smart actions
 */
function checkStageConditions(deal: Deal): NextAction | null {
  switch (deal.stage) {
    case 'analyzing':
      // Has all data needed - suggest creating offer
      if (deal.property?.arv && deal.property?.repair_cost && deal.strategy) {
        return {
          action: 'Create and send offer package',
          priority: 'high',
          category: 'offer',
        };
      }
      break;

    case 'offer_sent':
      // Check if we have an offer that was sent
      const sentOffer = deal.offers?.find((o) => o.status === 'sent');
      if (sentOffer) {
        // Calculate days since offer sent
        const daysSinceSent = sentOffer.created_at
          ? Math.floor(
              (Date.now() - new Date(sentOffer.created_at).getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        if (daysSinceSent >= 3) {
          return {
            action: `Follow up on offer (${daysSinceSent} days since sent)`,
            priority: 'high',
            category: 'followup',
          };
        }
      }
      break;

    case 'negotiating':
      // Check for counter offers
      const counterOffer = deal.offers?.find((o) => o.status === 'countered');
      if (counterOffer) {
        return {
          action: 'Review and respond to counter offer',
          priority: 'high',
          category: 'negotiate',
        };
      }
      break;

    case 'under_contract':
      // Check for missing documents
      if (!deal.seller_report) {
        return {
          action: 'Generate seller options report',
          priority: 'medium',
          category: 'document',
        };
      }
      break;
  }

  return null;
}

/**
 * Infer action category from action text
 */
function inferCategoryFromAction(action: string, stage: DealStage): ActionCategory {
  const lowerAction = action.toLowerCase();

  if (lowerAction.includes('call') || lowerAction.includes('contact') || lowerAction.includes('reach')) {
    return 'contact';
  }
  if (lowerAction.includes('walkthrough') || lowerAction.includes('visit') || lowerAction.includes('view')) {
    return 'walkthrough';
  }
  if (lowerAction.includes('offer') || lowerAction.includes('send')) {
    return 'offer';
  }
  if (lowerAction.includes('counter') || lowerAction.includes('negotiate')) {
    return 'negotiate';
  }
  if (lowerAction.includes('analyze') || lowerAction.includes('underwrite') || lowerAction.includes('run')) {
    return 'underwrite';
  }
  if (lowerAction.includes('close') || lowerAction.includes('title') || lowerAction.includes('escrow')) {
    return 'close';
  }
  if (lowerAction.includes('follow') || lowerAction.includes('check')) {
    return 'followup';
  }
  if (lowerAction.includes('document') || lowerAction.includes('upload') || lowerAction.includes('report')) {
    return 'document';
  }

  // Fall back to stage default
  return STAGE_DEFAULT_ACTIONS[stage].category;
}

/**
 * Get priority based on stage
 */
function getPriorityForStage(stage: DealStage): 'high' | 'medium' | 'low' {
  switch (stage) {
    case 'negotiating':
    case 'under_contract':
      return 'high';
    case 'analyzing':
    case 'offer_sent':
      return 'medium';
    default:
      return 'low';
  }
}

// ============================================
// Hook
// ============================================

/**
 * Hook to get the next best action for a deal
 */
export function useNextAction(deal: Deal | null | undefined): NextAction | null {
  return useMemo(() => {
    if (!deal) return null;
    if (isDealClosed(deal)) {
      return {
        action: deal.stage === 'closed_won' ? 'Deal closed successfully!' : 'Deal closed - no action needed',
        priority: 'low',
        category: 'close',
      };
    }
    return calculateNextAction(deal);
  }, [deal]);
}

/**
 * Get action button text based on category
 */
export function getActionButtonText(category: ActionCategory): string {
  switch (category) {
    case 'contact':
      return 'Contact Seller';
    case 'analyze':
      return 'Run Analysis';
    case 'walkthrough':
      return 'Start Walkthrough';
    case 'underwrite':
      return 'Quick Underwrite';
    case 'offer':
      return 'Create Offer';
    case 'negotiate':
      return 'View Counter';
    case 'close':
      return 'View Details';
    case 'followup':
      return 'Follow Up';
    case 'document':
      return 'Add Documents';
    default:
      return 'Take Action';
  }
}

/**
 * Get action icon name based on category
 */
export function getActionIcon(category: ActionCategory): string {
  switch (category) {
    case 'contact':
      return 'phone';
    case 'analyze':
      return 'bar-chart-2';
    case 'walkthrough':
      return 'camera';
    case 'underwrite':
      return 'calculator';
    case 'offer':
      return 'file-text';
    case 'negotiate':
      return 'message-circle';
    case 'close':
      return 'check-circle';
    case 'followup':
      return 'clock';
    case 'document':
      return 'folder-plus';
    default:
      return 'play';
  }
}

export default useNextAction;
