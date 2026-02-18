// src/features/real-estate/hooks/index.ts

export { useProperties, useProperty, usePropertyMutations } from './useProperties';
export {
  usePropertyFilters,
  DEFAULT_FILTERS,
  SORT_OPTIONS,
} from './usePropertyFilters';
export type { PropertyFilters, SortOption } from './usePropertyFilters';
export { useComps, useCompMutations } from './useComps';
export { useDealAnalysis, DEFAULT_RENTAL_ASSUMPTIONS } from './useDealAnalysis';
export type { DealMetrics, RentalAssumptions } from './useDealAnalysis';
export { useRepairEstimate, useRepairEstimateMutations, REPAIR_CATEGORIES, REPAIR_CATEGORY_LABELS } from './useRepairEstimate';
export type { RepairCategorySummary } from './useRepairEstimate';
export { useFinancingScenarios, useFinancingScenarioMutations, LOAN_TYPES, calculateMonthlyPayment } from './useFinancingScenarios';
export type { FinancingScenarioWithCalcs, LoanType } from './useFinancingScenarios';
export { usePropertyDocuments, useDocumentMutations, DOCUMENT_CATEGORIES } from './usePropertyDocuments';
export type { DocumentCategory } from './usePropertyDocuments';
export { usePropertyActions } from './usePropertyActions';
