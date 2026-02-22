// src/features/leads/hooks/useLeads.ts
// Lead hooks for fetching and managing leads
// Uses supabase.from() which auto-switches between mock/real based on EXPO_PUBLIC_USE_MOCK_DATA

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Lead } from '../types';
import { isValidUuid } from '@/lib/validation';
import { fetchLeads, fetchLeadsPaginated, fetchLeadById, fetchLeadsWithProperties, fetchOrphanProperties } from './leadQueries';
import { createLead, updateLead, deleteLead } from './leadMutations';

// ============================================
// Hooks
// ============================================

export function useLeads() {
  const {
    data: leads = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads', 'investor'],
    queryFn: fetchLeads,
  });

  return {
    leads,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Paginated leads hook using useInfiniteQuery
 * Use this for large datasets where infinite scroll is needed
 */
export function useLeadsPaginated() {
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['leads', 'investor', 'paginated'],
    queryFn: ({ pageParam = 0 }) => fetchLeadsPaginated(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const leads = data?.pages.flatMap((page) => page.leads) ?? [];

  return {
    leads,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}

export function useLead(id: string) {
  const {
    data: lead,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadById(id),
    // Only fetch if id is a valid UUID (prevents "new" or other strings from hitting DB)
    enabled: isValidUuid(id),
  });

  return {
    lead,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      updateLead(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

/**
 * Hook to fetch leads with their associated properties (hierarchical view)
 * Use this for the unified Leads tab showing sellers with their properties
 */
export function useLeadsWithProperties() {
  const {
    data: leads = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads', 'investor', 'with-properties'],
    queryFn: fetchLeadsWithProperties,
  });

  return {
    leads,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch orphan properties (no lead assigned)
 * Use this for the "Unknown Seller" section
 */
export function useOrphanProperties() {
  const {
    data: properties = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['properties', 'orphan'],
    queryFn: fetchOrphanProperties,
  });

  return {
    properties,
    isLoading,
    error,
    refetch,
  };
}

export default useLeads;
