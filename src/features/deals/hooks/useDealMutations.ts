// src/features/deals/hooks/useDealMutations.ts
// Mutation hooks for deal CRUD operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Deal, DealStage } from '../types';
import type { CreateDealInput } from './dealTypes';
import { createDeal, updateDeal, deleteDeal } from './dealApi';

/**
 * Create a new deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
    onError: (error) => {
      console.error('[useCreateDeal] Failed to create deal:', error);
    },
  });
}

/**
 * Update an existing deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Deal> }) =>
      updateDeal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', variables.id] });
    },
    onError: (error, variables) => {
      console.error(
        `[useUpdateDeal] Failed to update deal ${variables.id}:`,
        error
      );
    },
  });
}

/**
 * Delete a deal (hard delete)
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
    onError: (error) => {
      console.error('[useDeleteDeal] Failed to delete deal:', error);
    },
  });
}

/**
 * Update deal stage
 */
export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      updateDeal(id, { stage }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', variables.id] });
    },
    onError: (error, variables) => {
      console.error(
        `[useUpdateDealStage] Failed to update stage for deal ${variables.id}:`,
        error
      );
    },
  });
}
