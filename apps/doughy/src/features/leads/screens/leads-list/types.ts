// src/features/leads/screens/leads-list/types.ts
// Types for leads list screen

import type { LeadStatus } from '../../types';

export interface LeadFilters {
  status: LeadStatus | 'all';
  source: string | 'all';
  starred: boolean | null;
  sortBy: 'name' | 'created_at';
  sortOrder: 'asc' | 'desc';
}
