// src/features/deals/hooks/useNextAction.ts
// Next Best Action (NBA) engine for deals
// Rule-based system that suggests the next action based on deal state
// Zone G Week 9: Enhanced with granular context and AI suggestion support

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
  context?: ActionContext;
}

export interface ActionContext {
  /** Walkthrough completion percentage (0-100) */
  walkthroughProgress?: number;
  /** Missing photo buckets for walkthrough */
  missingPhotoBuckets?: string[];
  /** Days since last contact with seller */
  daysSinceLastContact?: number;
  /** Time since last conversation (any type) */
  timeSinceLastConversation?: string;
  /** Recent conversation sentiment */
  recentSentiment?: 'positive' | 'neutral' | 'negative';
  /** Key phrases from recent conversations */
  recentKeyPhrases?: string[];
  /** Pending action items from conversations */
  pendingActionItems?: string[];
  /** Reason for this suggestion */
  reason?: string;
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

// Photo buckets for walkthrough completeness
export const PHOTO_BUCKETS = [
  'exterior_front',
  'exterior_back',
  'kitchen',
  'bathroom_primary',
  'living_room',
  'bedroom_primary',
  'roof',
  'hvac',
  'electrical_panel',
  'plumbing',
] as const;

export type PhotoBucket = typeof PHOTO_BUCKETS[number];

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

// ============================================
// Context Calculation Helpers
// ============================================

/**
 * Calculate walkthrough progress based on available photos
 */
export function calculateWalkthroughProgress(deal: Deal): {
  progress: number;
  missingBuckets: string[];
} {
  const photos = deal.photos || [];
  const taggedPhotos = new Set(
    photos
      .filter((p) => p.bucket || p.category)
      .map((p) => (p.bucket || p.category)?.toLowerCase())
  );

  const missingBuckets: string[] = [];
  PHOTO_BUCKETS.forEach((bucket) => {
    if (!taggedPhotos.has(bucket)) {
      missingBuckets.push(bucket);
    }
  });

  const completedCount = PHOTO_BUCKETS.length - missingBuckets.length;
  const progress = Math.round((completedCount / PHOTO_BUCKETS.length) * 100);

  return { progress, missingBuckets };
}

/**
 * Calculate days since last contact
 */
export function calculateDaysSinceLastContact(deal: Deal): number | undefined {
  // Check for last_contacted_at on lead or deal
  const lastContact = deal.lead?.last_contacted_at || deal.last_activity_at;
  if (!lastContact) return undefined;

  const contactDate = new Date(lastContact);
  const now = new Date();
  const diffMs = now.getTime() - contactDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format time since last conversation for display
 */
export function formatTimeSince(dateString: string | undefined): string | undefined {
  if (!dateString) return undefined;

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

/**
 * Build action context from deal data
 */
function buildActionContext(deal: Deal): ActionContext {
  const context: ActionContext = {};

  // Walkthrough progress (for appointment_set and analyzing stages)
  if (deal.stage === 'appointment_set' || deal.stage === 'analyzing') {
    const { progress, missingBuckets } = calculateWalkthroughProgress(deal);
    context.walkthroughProgress = progress;
    if (missingBuckets.length > 0 && missingBuckets.length <= 5) {
      context.missingPhotoBuckets = missingBuckets;
    }
  }

  // Days since last contact
  const daysSince = calculateDaysSinceLastContact(deal);
  if (daysSince !== undefined) {
    context.daysSinceLastContact = daysSince;
    context.timeSinceLastConversation = formatTimeSince(
      deal.lead?.last_contacted_at || deal.last_activity_at
    );
  }

  return context;
}

/**
 * Calculate the next best action for a deal
 */
export function calculateNextAction(deal: Deal): NextAction {
  // Build context for enhanced suggestions
  const context = buildActionContext(deal);

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
      context,
    };
  }

  // Check for contact recency issues (more than 3 days without contact in active stages)
  const contactRecencyAction = checkContactRecency(deal, context);
  if (contactRecencyAction) {
    return { ...contactRecencyAction, context };
  }

  // Check for missing critical data
  const missingDataAction = checkMissingData(deal);
  if (missingDataAction) {
    return { ...missingDataAction, context };
  }

  // Check for walkthrough completeness
  const walkthroughAction = checkWalkthroughCompleteness(deal, context);
  if (walkthroughAction) {
    return { ...walkthroughAction, context };
  }

  // Check for stage-specific conditions
  const stageSpecificAction = checkStageConditions(deal);
  if (stageSpecificAction) {
    return { ...stageSpecificAction, context };
  }

  // Fall back to default stage action
  const defaultAction = STAGE_DEFAULT_ACTIONS[deal.stage];

  // Handle unknown stages gracefully (e.g., from database with different stage values)
  if (!defaultAction) {
    return {
      action: 'Review deal and update stage',
      priority: 'medium',
      category: 'followup',
      context,
    };
  }

  return {
    action: defaultAction.action,
    priority: getPriorityForStage(deal.stage),
    category: defaultAction.category,
    context,
  };
}

/**
 * Check if contact is overdue based on recency
 */
function checkContactRecency(deal: Deal, context: ActionContext): NextAction | null {
  const { daysSinceLastContact } = context;

  // Only for active deal stages
  const activeStages: DealStage[] = ['contacted', 'appointment_set', 'analyzing', 'offer_sent', 'negotiating'];
  if (!activeStages.includes(deal.stage)) return null;

  if (daysSinceLastContact !== undefined && daysSinceLastContact >= 7) {
    return {
      action: `Follow up with seller (${daysSinceLastContact} days since last contact)`,
      priority: 'high',
      category: 'followup',
      context: {
        ...context,
        reason: 'No contact in over a week',
      },
    };
  }

  if (daysSinceLastContact !== undefined && daysSinceLastContact >= 3 && deal.stage === 'negotiating') {
    return {
      action: `Check in with seller on negotiations`,
      priority: 'high',
      category: 'contact',
      context: {
        ...context,
        reason: 'Active negotiation needs attention',
      },
    };
  }

  return null;
}

/**
 * Check walkthrough completeness and suggest next photos
 */
function checkWalkthroughCompleteness(deal: Deal, context: ActionContext): NextAction | null {
  const { walkthroughProgress, missingPhotoBuckets } = context;

  // Only for walkthrough stage
  if (deal.stage !== 'appointment_set' && deal.stage !== 'analyzing') return null;

  // If walkthrough started but incomplete
  if (walkthroughProgress !== undefined && walkthroughProgress > 0 && walkthroughProgress < 70) {
    const nextBucket = missingPhotoBuckets?.[0];
    const friendlyBucketName = nextBucket?.replace(/_/g, ' ') || 'remaining areas';

    return {
      action: `Continue walkthrough - capture ${friendlyBucketName} (${walkthroughProgress}% complete)`,
      priority: 'medium',
      category: 'walkthrough',
      context: {
        ...context,
        reason: `Walkthrough ${walkthroughProgress}% complete`,
      },
    };
  }

  return null;
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
