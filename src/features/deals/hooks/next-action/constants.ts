// src/features/deals/hooks/next-action/constants.ts
// Constants for Next Best Action engine

import type { DealStage } from '../../types';
import type { ActionCategory } from './types';

/**
 * Photo buckets for walkthrough completeness
 */
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

export type PhotoBucket = (typeof PHOTO_BUCKETS)[number];

/**
 * Stage-based default actions
 */
export const STAGE_DEFAULT_ACTIONS: Record<
  DealStage,
  { action: string; category: ActionCategory }
> = {
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
