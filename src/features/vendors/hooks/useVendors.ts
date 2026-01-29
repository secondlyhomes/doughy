// src/features/vendors/hooks/useVendors.ts
// React Query hooks for vendor management

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Vendor,
  VendorCategory,
  CreateVendorInput,
  UpdateVendorInput,
} from '../types';

// ============================================
// Query Keys
// ============================================

export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (propertyId?: string) => [...vendorKeys.lists(), propertyId || 'global'] as const,
  byCategory: (propertyId?: string, category?: VendorCategory) =>
    [...vendorKeys.list(propertyId), category] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
  counts: (propertyId?: string) => [...vendorKeys.all, 'counts', propertyId || 'global'] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchVendors(propertyId?: string): Promise<Vendor[]> {
  let query = supabase
    .from('landlord_vendors')
    .select('*')
    .eq('is_active', true)
    .order('is_primary', { ascending: false })
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  // If propertyId provided, get property-specific + global vendors
  if (propertyId) {
    query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }

  return (data || []) as Vendor[];
}

async function fetchVendor(id: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('landlord_vendors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching vendor:', error);
    throw error;
  }

  return data as Vendor;
}

async function fetchVendorCount(propertyId?: string): Promise<number> {
  let query = supabase
    .from('landlord_vendors')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (propertyId) {
    query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error fetching vendor count:', error);
    throw error;
  }

  return count || 0;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch vendors for a property (or all global vendors)
 */
export function useVendors(propertyId?: string | null) {
  return useQuery({
    queryKey: vendorKeys.list(propertyId || undefined),
    queryFn: () => fetchVendors(propertyId || undefined),
  });
}

/**
 * Hook to fetch a single vendor
 */
export function useVendor(id: string | null | undefined) {
  return useQuery({
    queryKey: vendorKeys.detail(id || ''),
    queryFn: () => fetchVendor(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch vendor count (for hub badge)
 */
export function useVendorCount(propertyId?: string | null) {
  return useQuery({
    queryKey: vendorKeys.counts(propertyId || undefined),
    queryFn: () => fetchVendorCount(propertyId || undefined),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for vendor mutations (create, update, delete)
 */
export function useVendorMutations(propertyId?: string) {
  const queryClient = useQueryClient();

  // Create vendor mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateVendorInput) => {
      const { data: newVendor, error } = await supabase
        .from('landlord_vendors')
        .insert({
          ...data,
          is_active: true,
          total_jobs: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return newVendor as Vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.counts(propertyId) });
    },
  });

  // Update vendor mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVendorInput }) => {
      const { data: updated, error } = await supabase
        .from('landlord_vendors')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as Vendor;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(variables.id) });
    },
  });

  // Delete vendor mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landlord_vendors')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.counts(propertyId) });
    },
  });

  // Set as primary vendor mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: VendorCategory }) => {
      // First, unset any existing primary for this category
      await supabase
        .from('landlord_vendors')
        .update({ is_primary: false })
        .eq('category', category)
        .eq('is_primary', true);

      // Then set this vendor as primary
      const { data: updated, error } = await supabase
        .from('landlord_vendors')
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as Vendor;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.list(propertyId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(variables.id) });
    },
  });

  // Wrapped functions
  const createVendor = useCallback(
    async (data: CreateVendorInput): Promise<Vendor> => {
      return await createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const updateVendor = useCallback(
    async (id: string, data: UpdateVendorInput): Promise<Vendor> => {
      return await updateMutation.mutateAsync({ id, data });
    },
    [updateMutation]
  );

  const deleteVendor = useCallback(
    async (id: string): Promise<boolean> => {
      return await deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  const setPrimaryVendor = useCallback(
    async (id: string, category: VendorCategory): Promise<Vendor> => {
      return await setPrimaryMutation.mutateAsync({ id, category });
    },
    [setPrimaryMutation]
  );

  return {
    createVendor,
    updateVendor,
    deleteVendor,
    setPrimaryVendor,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending || setPrimaryMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      setPrimaryMutation.isPending,
  };
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Group vendors by category
 */
export function useVendorsGroupedByCategory(propertyId?: string | null) {
  const { data: vendors = [], ...rest } = useVendors(propertyId);

  const grouped = vendors.reduce<Record<VendorCategory, Vendor[]>>(
    (acc, vendor) => {
      if (!acc[vendor.category]) {
        acc[vendor.category] = [];
      }
      acc[vendor.category].push(vendor);
      return acc;
    },
    {
      plumber: [],
      electrician: [],
      hvac: [],
      cleaner: [],
      handyman: [],
      locksmith: [],
      pest_control: [],
      landscaper: [],
      appliance_repair: [],
      pool_service: [],
      other: [],
    }
  );

  // Filter out empty categories
  const nonEmptyGroups = Object.entries(grouped).filter(
    ([_, vendors]) => vendors.length > 0
  ) as [VendorCategory, Vendor[]][];

  return {
    grouped,
    nonEmptyGroups,
    ...rest,
  };
}

/**
 * Get primary vendor by category
 */
export function usePrimaryVendor(
  category: VendorCategory,
  propertyId?: string | null
) {
  const { data: vendors = [], ...rest } = useVendors(propertyId);

  const primaryVendor = vendors.find(
    (v) => v.category === category && v.is_primary
  );

  return {
    data: primaryVendor || null,
    ...rest,
  };
}
