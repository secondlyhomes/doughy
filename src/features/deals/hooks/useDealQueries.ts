// src/features/deals/hooks/useDealQueries.ts
// Query hooks for fetching deals

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { isValidUuid } from '@/lib/validation';
import type { DealsFilters } from './dealTypes';
import { fetchDeals, fetchDealsPaginated, fetchDealById } from './dealApi';

/**
 * Fetch all deals with optional filters
 */
export function useDeals(filters?: DealsFilters) {
  const {
    data: deals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deals', filters],
    queryFn: () => fetchDeals(filters),
  });

  return {
    deals,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Paginated deals hook using useInfiniteQuery
 * Use this for large datasets where infinite scroll is needed
 */
export function useDealsPaginated(filters?: DealsFilters) {
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['deals', 'paginated', filters],
    queryFn: ({ pageParam = 0 }) => fetchDealsPaginated(pageParam, filters),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const deals = data?.pages.flatMap((page) => page.deals) ?? [];

  return {
    deals,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}

/**
 * Fetch a single deal by ID
 */
export function useDeal(id: string) {
  const {
    data: deal,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => fetchDealById(id),
    // Only fetch if id is a valid UUID (prevents "new" or other strings from hitting DB)
    enabled: isValidUuid(id),
  });

  return {
    deal,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetch deals with upcoming actions (for Inbox)
 */
export function useDealsWithActions(limit: number = 5) {
  const {
    data: deals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deals', 'actions', limit],
    queryFn: async () => {
      const allDeals = await fetchDeals({
        activeOnly: true,
        sortBy: 'next_action_due',
        sortDirection: 'asc',
      });
      return allDeals.slice(0, limit);
    },
  });

  return {
    deals,
    isLoading,
    error,
    refetch,
  };
}
