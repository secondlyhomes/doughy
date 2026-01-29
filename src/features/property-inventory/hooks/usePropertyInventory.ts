// src/features/property-inventory/hooks/usePropertyInventory.ts
// React Query hooks for property inventory management

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  InventoryItem,
  InventoryCategory,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from '../types';

// ============================================
// Query Keys
// ============================================

export const inventoryKeys = {
  all: ['property-inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (propertyId: string) => [...inventoryKeys.lists(), propertyId] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  counts: (propertyId: string) => [...inventoryKeys.all, 'counts', propertyId] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchInventoryByProperty(propertyId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('property_inventory')
    .select('*')
    .eq('property_id', propertyId)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }

  return (data || []) as InventoryItem[];
}

async function fetchInventoryItem(id: string): Promise<InventoryItem | null> {
  const { data, error } = await supabase
    .from('property_inventory')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching inventory item:', error);
    throw error;
  }

  return data as InventoryItem;
}

async function fetchInventoryCount(propertyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('property_inventory')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', propertyId);

  if (error) {
    console.error('Error fetching inventory count:', error);
    throw error;
  }

  return count || 0;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch inventory items for a property
 */
export function usePropertyInventory(propertyId: string | null | undefined) {
  return useQuery({
    queryKey: inventoryKeys.list(propertyId || ''),
    queryFn: () => fetchInventoryByProperty(propertyId!),
    enabled: !!propertyId,
  });
}

/**
 * Hook to fetch a single inventory item
 */
export function useInventoryItem(id: string | null | undefined) {
  return useQuery({
    queryKey: inventoryKeys.detail(id || ''),
    queryFn: () => fetchInventoryItem(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch inventory count for a property (for hub badge)
 */
export function useInventoryCount(propertyId: string | null | undefined) {
  return useQuery({
    queryKey: inventoryKeys.counts(propertyId || ''),
    queryFn: () => fetchInventoryCount(propertyId!),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for inventory mutations (create, update, delete)
 */
export function useInventoryMutations(propertyId: string) {
  const queryClient = useQueryClient();

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateInventoryItemInput) => {
      const { data: newItem, error } = await supabase
        .from('property_inventory')
        .insert({
          ...data,
          photos: data.photos || [],
        })
        .select()
        .single();

      if (error) throw error;
      return newItem as InventoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.counts(propertyId) });
    },
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInventoryItemInput }) => {
      const { data: updated, error } = await supabase
        .from('property_inventory')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as InventoryItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.id) });
    },
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('property_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.counts(propertyId) });
    },
  });

  // Wrapped functions
  const createItem = useCallback(
    async (data: CreateInventoryItemInput): Promise<InventoryItem> => {
      return await createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const updateItem = useCallback(
    async (id: string, data: UpdateInventoryItemInput): Promise<InventoryItem> => {
      return await updateMutation.mutateAsync({ id, data });
    },
    [updateMutation]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      return await deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  return {
    createItem,
    updateItem,
    deleteItem,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Group inventory items by category
 */
export function useInventoryGroupedByCategory(propertyId: string | null | undefined) {
  const { data: items = [], ...rest } = usePropertyInventory(propertyId);

  const grouped = items.reduce<Record<InventoryCategory, InventoryItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {
      appliance: [],
      hvac: [],
      structure: [],
      plumbing: [],
      furniture: [],
      electronics: [],
      other: [],
    }
  );

  // Filter out empty categories
  const nonEmptyGroups = Object.entries(grouped).filter(
    ([_, items]) => items.length > 0
  ) as [InventoryCategory, InventoryItem[]][];

  return {
    grouped,
    nonEmptyGroups,
    ...rest,
  };
}
