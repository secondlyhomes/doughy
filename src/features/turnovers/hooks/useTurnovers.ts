// src/features/turnovers/hooks/useTurnovers.ts
// React Query hooks for turnovers feature

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTurnoversStore } from '@/stores/turnovers-store';
import {
  Turnover,
  TurnoverWithRelations,
  CreateTurnoverInput,
  UpdateTurnoverInput,
  TurnoverStatus,
} from '../types';

// Query key factory for turnovers
export const turnoverKeys = {
  all: ['turnovers'] as const,
  lists: () => [...turnoverKeys.all, 'list'] as const,
  list: (propertyId?: string) => [...turnoverKeys.lists(), { propertyId }] as const,
  upcoming: (propertyId?: string) => [...turnoverKeys.all, 'upcoming', { propertyId }] as const,
  details: () => [...turnoverKeys.all, 'detail'] as const,
  detail: (id: string) => [...turnoverKeys.details(), id] as const,
  count: (propertyId?: string) => [...turnoverKeys.all, 'count', { propertyId }] as const,
  pendingCount: (propertyId?: string) => [...turnoverKeys.all, 'pending-count', { propertyId }] as const,
};

/**
 * Hook to fetch turnovers for a property (or all turnovers)
 */
export function useTurnovers(propertyId?: string) {
  const store = useTurnoversStore();

  return useQuery({
    queryKey: turnoverKeys.list(propertyId),
    queryFn: () => store.fetchTurnovers(propertyId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch upcoming turnovers (not yet ready)
 */
export function useUpcomingTurnovers(propertyId?: string, limit = 5) {
  const store = useTurnoversStore();

  return useQuery({
    queryKey: turnoverKeys.upcoming(propertyId),
    queryFn: () => store.fetchUpcomingTurnovers(propertyId, limit),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch a single turnover by ID
 */
export function useTurnover(id: string) {
  const store = useTurnoversStore();

  return useQuery({
    queryKey: turnoverKeys.detail(id),
    queryFn: () => store.fetchTurnoverById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for getting the count of pending turnovers
 */
export function usePendingTurnoverCount(propertyId?: string) {
  const { data: turnovers = [] } = useTurnovers(propertyId);

  const pendingCount = turnovers.filter(
    (t) => t.status !== 'ready'
  ).length;

  return { data: pendingCount };
}

/**
 * Hook for getting the next turnover date string
 */
export function useNextTurnover(propertyId?: string) {
  const { data: turnovers = [], isLoading } = useUpcomingTurnovers(propertyId, 1);

  if (isLoading || turnovers.length === 0) {
    return { data: null, isLoading };
  }

  const nextTurnover = turnovers[0];
  const date = new Date(nextTurnover.checkout_at);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return { data: formatted, isLoading };
}

/**
 * Hook for turnover mutations
 */
export function useTurnoverMutations() {
  const queryClient = useQueryClient();
  const store = useTurnoversStore();

  const createMutation = useMutation({
    mutationFn: (input: CreateTurnoverInput) => store.createTurnover(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: turnoverKeys.lists() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.upcoming() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTurnoverInput }) =>
      store.updateTurnover(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: turnoverKeys.lists() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.detail(data.id) });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TurnoverStatus }) =>
      store.updateTurnoverStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: turnoverKeys.lists() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.detail(data.id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => store.deleteTurnover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: turnoverKeys.lists() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.upcoming() });
    },
  });

  const scheduleCleaningMutation = useMutation({
    mutationFn: ({
      id,
      vendorId,
      scheduledAt,
    }: {
      id: string;
      vendorId: string;
      scheduledAt: string;
    }) => store.scheduleCleaning(id, vendorId, scheduledAt),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: turnoverKeys.lists() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.detail(data.id) });
    },
  });

  const markCleaningDoneMutation = useMutation({
    mutationFn: (id: string) => store.markCleaningDone(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: turnoverKeys.lists() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.detail(data.id) });
    },
  });

  const markInspectedMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      store.markInspected(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: turnoverKeys.lists() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.detail(data.id) });
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: (id: string) => store.markReady(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: turnoverKeys.lists() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: turnoverKeys.detail(data.id) });
    },
  });

  return {
    createTurnover: createMutation.mutateAsync,
    updateTurnover: updateMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteTurnover: deleteMutation.mutateAsync,
    scheduleCleaning: scheduleCleaningMutation.mutateAsync,
    markCleaningDone: markCleaningDoneMutation.mutateAsync,
    markInspected: markInspectedMutation.mutateAsync,
    markReady: markReadyMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending || updateStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      updateStatusMutation.isPending ||
      scheduleCleaningMutation.isPending ||
      markCleaningDoneMutation.isPending ||
      markInspectedMutation.isPending ||
      markReadyMutation.isPending,
  };
}
