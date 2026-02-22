// src/features/deals/index.ts
// Main exports for the deals feature

// Types
export * from './types';

// Hooks
export {
  useDeals,
  useDeal,
  useDealsWithActions,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useUpdateDealStage,
} from './hooks/useDeals';
export type { DealsFilters, CreateDealInput } from './hooks/useDeals';

export {
  useNextAction,
  calculateNextAction,
  getActionButtonText,
  getActionIcon,
} from './hooks/useNextAction';
export type { NextAction, ActionCategory } from './hooks/useNextAction';

// Mock data (for development)
export {
  mockDeals,
  mockLeads,
  mockProperties,
  getMockDealById,
  getMockDealsByStage,
  getActiveMockDeals,
  getMockDealsWithActions,
  searchMockDeals,
} from './data/mockDeals';

// Screens
export { DealsListScreen } from './screens/DealsListScreen';
export { DealCockpitScreen } from './screens/DealCockpitScreen';
export { QuickUnderwriteScreen } from './screens/QuickUnderwriteScreen';
export { DealDocsScreen } from './screens/DealDocsScreen';
