// src/features/deals/hooks/useDeals.ts
// Barrel export for deal hooks - maintains backward compatibility
// Uses supabase.from() which auto-switches between mock/real based on EXPO_PUBLIC_USE_MOCK_DATA

// Re-export types
export type {
  DealRow,
  DealWithRelations,
  DealsFilters,
  CreateDealInput,
  PaginatedDealsResult,
  Deal,
} from './dealTypes';

export { PAGE_SIZE } from './dealTypes';

// Re-export query hooks
export {
  useDeals,
  useDealsPaginated,
  useDeal,
  useDealsWithActions,
} from './useDealQueries';

// Re-export mutation hooks
export {
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useUpdateDealStage,
} from './useDealMutations';

// Re-export event hooks
export { useDealsWithEvents } from './useDealsWithEvents';

// Default export for backward compatibility
export { useDeals as default } from './useDealQueries';
