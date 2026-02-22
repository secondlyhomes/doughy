// src/features/deals/hooks/next-action/context.ts
// Context calculation helpers for Next Best Action engine

import type { Deal } from '../../types';
import type { ActionContext } from './types';
import { PHOTO_BUCKETS } from './constants';

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
export function formatTimeSince(
  dateString: string | undefined
): string | undefined {
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
export function buildActionContext(deal: Deal): ActionContext {
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
