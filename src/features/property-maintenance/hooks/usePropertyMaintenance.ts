// src/features/property-maintenance/hooks/usePropertyMaintenance.ts
// React Query hooks for property maintenance management

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  MaintenanceWorkOrder,
  MaintenanceStatus,
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
} from '../types';

// ============================================
// Query Keys
// ============================================

export const maintenanceKeys = {
  all: ['property-maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (propertyId: string) => [...maintenanceKeys.lists(), propertyId] as const,
  listFiltered: (propertyId: string, status: string) =>
    [...maintenanceKeys.list(propertyId), status] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
  counts: (propertyId: string) => [...maintenanceKeys.all, 'counts', propertyId] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchMaintenanceByProperty(
  propertyId: string
): Promise<MaintenanceWorkOrder[]> {
  const { data, error } = await supabase
    .from('property_maintenance')
    .select('*')
    .eq('property_id', propertyId)
    .order('reported_at', { ascending: false });

  if (error) {
    console.error('Error fetching maintenance:', error);
    throw error;
  }

  return (data || []) as MaintenanceWorkOrder[];
}

async function fetchMaintenanceWorkOrder(
  id: string
): Promise<MaintenanceWorkOrder | null> {
  const { data, error } = await supabase
    .from('property_maintenance')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching work order:', error);
    throw error;
  }

  return data as MaintenanceWorkOrder;
}

async function fetchOpenMaintenanceCount(propertyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('property_maintenance')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', propertyId)
    .not('status', 'in', '("completed","cancelled")');

  if (error) {
    console.error('Error fetching maintenance count:', error);
    throw error;
  }

  return count || 0;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch maintenance work orders for a property
 */
export function usePropertyMaintenance(propertyId: string | null | undefined) {
  return useQuery({
    queryKey: maintenanceKeys.list(propertyId || ''),
    queryFn: () => fetchMaintenanceByProperty(propertyId!),
    enabled: !!propertyId,
  });
}

/**
 * Hook to fetch a single maintenance work order
 */
export function useMaintenanceWorkOrder(id: string | null | undefined) {
  return useQuery({
    queryKey: maintenanceKeys.detail(id || ''),
    queryFn: () => fetchMaintenanceWorkOrder(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch open maintenance count for a property (for hub badge)
 */
export function useOpenMaintenanceCount(propertyId: string | null | undefined) {
  return useQuery({
    queryKey: maintenanceKeys.counts(propertyId || ''),
    queryFn: () => fetchOpenMaintenanceCount(propertyId!),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for maintenance mutations (create, update, delete)
 */
export function useMaintenanceMutations(propertyId: string) {
  const queryClient = useQueryClient();

  // Create work order mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateMaintenanceInput) => {
      const { data: newWorkOrder, error } = await supabase
        .from('property_maintenance')
        .insert({
          ...data,
          photos: data.photos || [],
          status: 'reported',
          priority: data.priority || 'medium',
          charge_to: data.charge_to || 'owner',
        })
        .select()
        .single();

      if (error) throw error;
      return newWorkOrder as MaintenanceWorkOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.counts(propertyId) });
    },
  });

  // Update work order mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaintenanceInput;
    }) => {
      const { data: updated, error } = await supabase
        .from('property_maintenance')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as MaintenanceWorkOrder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.counts(propertyId) });
    },
  });

  // Delete work order mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_maintenance')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.counts(propertyId) });
    },
  });

  // Update status mutation (convenience wrapper)
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: MaintenanceStatus;
    }) => {
      const updateData: UpdateMaintenanceInput = { status };

      // Auto-set timestamps based on status
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updated, error } = await supabase
        .from('property_maintenance')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as MaintenanceWorkOrder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.counts(propertyId) });
    },
  });

  // Wrapped functions
  const createWorkOrder = useCallback(
    async (data: CreateMaintenanceInput): Promise<MaintenanceWorkOrder> => {
      return await createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const updateWorkOrder = useCallback(
    async (
      id: string,
      data: UpdateMaintenanceInput
    ): Promise<MaintenanceWorkOrder> => {
      return await updateMutation.mutateAsync({ id, data });
    },
    [updateMutation]
  );

  const updateStatus = useCallback(
    async (
      id: string,
      status: MaintenanceStatus
    ): Promise<MaintenanceWorkOrder> => {
      return await updateStatusMutation.mutateAsync({ id, status });
    },
    [updateStatusMutation]
  );

  const deleteWorkOrder = useCallback(
    async (id: string): Promise<boolean> => {
      return await deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  return {
    createWorkOrder,
    updateWorkOrder,
    updateStatus,
    deleteWorkOrder,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending || updateStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      updateStatusMutation.isPending ||
      deleteMutation.isPending,
  };
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Filter maintenance work orders by status
 */
export function useFilteredMaintenance(
  propertyId: string | null | undefined,
  statusFilter: MaintenanceStatus | 'all' | 'open'
) {
  const { data: workOrders = [], ...rest } = usePropertyMaintenance(propertyId);

  const filtered =
    statusFilter === 'all'
      ? workOrders
      : statusFilter === 'open'
      ? workOrders.filter(
          (wo) => !['completed', 'cancelled'].includes(wo.status)
        )
      : workOrders.filter((wo) => wo.status === statusFilter);

  return {
    data: filtered,
    openCount: workOrders.filter(
      (wo) => !['completed', 'cancelled'].includes(wo.status)
    ).length,
    completedCount: workOrders.filter((wo) => wo.status === 'completed').length,
    ...rest,
  };
}
