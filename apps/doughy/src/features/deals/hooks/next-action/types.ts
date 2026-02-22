// src/features/deals/hooks/next-action/types.ts
// Type definitions for Next Best Action engine

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
