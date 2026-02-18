// src/features/deals/screens/deals-list/constants.ts
// Constants for deals list screen

import type { DealStage } from '../../types';

export const STAGE_FILTERS: { key: DealStage | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'analyzing', label: 'Analyzing' },
  { key: 'offer_sent', label: 'Offers' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'under_contract', label: 'Contract' },
];
