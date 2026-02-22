// src/features/deals/components/stage-stepper-constants.ts
// Constants, types, and helpers for the StageStepper component

import { DealStage } from '../types';

// ============================================
// Types
// ============================================

export interface StageStepperProps {
  currentStage: DealStage;
  /** Deal ID for context (used for stage updates) */
  dealId?: string;
  onStagePress?: (stage: DealStage) => void;
  /** @deprecated No longer used - compact pill is always shown */
  compact?: boolean;
  /** @deprecated No longer used - stage label is always displayed in pill */
  showCurrentStageLabel?: boolean;
}

// Define the ordered stages for the stepper (excludes closed_lost which is a terminal state)
export const ORDERED_STAGES: DealStage[] = [
  'new',
  'contacted',
  'appointment_set',
  'analyzing',
  'offer_sent',
  'negotiating',
  'under_contract',
  'closed_won',
];

// Average days at each stage (for stage info)
export const STAGE_AVG_DAYS: Record<DealStage, number> = {
  initial_contact: 2,
  new: 1,
  contacted: 3,
  appointment_set: 5,
  analyzing: 7,
  offer_sent: 10,
  negotiating: 14,
  under_contract: 21,
  closed_won: 0,
  closed_lost: 0,
};

// Stage descriptions for the selection sheet
export function getStageDescription(stage: DealStage): string {
  switch (stage) {
    case 'new':
      return 'New lead added to pipeline';
    case 'contacted':
      return 'Initial contact made with seller';
    case 'appointment_set':
      return 'Property viewing scheduled';
    case 'analyzing':
      return 'Running comps and estimating repairs';
    case 'offer_sent':
      return 'Offer submitted to seller';
    case 'negotiating':
      return 'Working through counter-offers';
    case 'under_contract':
      return 'Contract signed, coordinating close';
    case 'closed_won':
      return 'Deal successfully closed';
    case 'closed_lost':
      return 'Deal did not close';
    default:
      return 'Review deal details';
  }
}

export const DOT_SIZE = 6;
export const DOT_GAP = 4;
