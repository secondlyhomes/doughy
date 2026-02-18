// src/features/campaigns/hooks/campaigns/queryKeys.ts
// Query key factories for campaigns

import type { CampaignFilters } from './types';

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: CampaignFilters) => [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  steps: (campaignId: string) =>
    [...campaignKeys.all, 'steps', campaignId] as const,
  enrollments: (campaignId: string) =>
    [...campaignKeys.all, 'enrollments', campaignId] as const,
};
