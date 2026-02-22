// src/features/deals/hooks/next-action/rules.ts
// Rules engine for Next Best Action calculation

import type { Deal, DealStage } from '../../types';
import type { NextAction, ActionContext, ActionCategory } from './types';
import { STAGE_DEFAULT_ACTIONS } from './constants';
import { buildActionContext } from './context';

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
function checkContactRecency(
  deal: Deal,
  context: ActionContext
): NextAction | null {
  const { daysSinceLastContact } = context;

  // Only for active deal stages
  const activeStages: DealStage[] = [
    'contacted',
    'appointment_set',
    'analyzing',
    'offer_sent',
    'negotiating',
  ];
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

  if (
    daysSinceLastContact !== undefined &&
    daysSinceLastContact >= 3 &&
    deal.stage === 'negotiating'
  ) {
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
function checkWalkthroughCompleteness(
  deal: Deal,
  context: ActionContext
): NextAction | null {
  const { walkthroughProgress, missingPhotoBuckets } = context;

  // Only for walkthrough stage
  if (deal.stage !== 'appointment_set' && deal.stage !== 'analyzing')
    return null;

  // If walkthrough started but incomplete
  if (
    walkthroughProgress !== undefined &&
    walkthroughProgress > 0 &&
    walkthroughProgress < 70
  ) {
    const nextBucket = missingPhotoBuckets?.[0];
    const friendlyBucketName =
      nextBucket?.replace(/_/g, ' ') || 'remaining areas';

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
  if (
    deal.stage === 'analyzing' &&
    deal.property &&
    !deal.property.repair_cost
  ) {
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
              (Date.now() - new Date(sentOffer.created_at).getTime()) /
                (1000 * 60 * 60 * 24)
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
export function inferCategoryFromAction(
  action: string,
  stage: DealStage
): ActionCategory {
  const lowerAction = action.toLowerCase();

  if (
    lowerAction.includes('call') ||
    lowerAction.includes('contact') ||
    lowerAction.includes('reach')
  ) {
    return 'contact';
  }
  if (
    lowerAction.includes('walkthrough') ||
    lowerAction.includes('visit') ||
    lowerAction.includes('view')
  ) {
    return 'walkthrough';
  }
  if (lowerAction.includes('offer') || lowerAction.includes('send')) {
    return 'offer';
  }
  if (lowerAction.includes('counter') || lowerAction.includes('negotiate')) {
    return 'negotiate';
  }
  if (
    lowerAction.includes('analyze') ||
    lowerAction.includes('underwrite') ||
    lowerAction.includes('run')
  ) {
    return 'underwrite';
  }
  if (
    lowerAction.includes('close') ||
    lowerAction.includes('title') ||
    lowerAction.includes('escrow')
  ) {
    return 'close';
  }
  if (lowerAction.includes('follow') || lowerAction.includes('check')) {
    return 'followup';
  }
  if (
    lowerAction.includes('document') ||
    lowerAction.includes('upload') ||
    lowerAction.includes('report')
  ) {
    return 'document';
  }

  // Fall back to stage default (with fallback for unknown stages)
  return STAGE_DEFAULT_ACTIONS[stage]?.category || 'followup';
}

/**
 * Get priority based on stage
 */
export function getPriorityForStage(
  stage: DealStage
): 'high' | 'medium' | 'low' {
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
