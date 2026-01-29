// src/features/skip-tracing/hooks/useSkipTracing.ts
// React Query hooks for skip tracing with Tracerfy

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSkipTracingStore } from '@/stores/skip-tracing-store';
import { errorHandler, showWarning } from '@/lib/errors/errorHandler';
import type { SkipTraceInput } from '../types';

// Stale time for skip trace data (5 minutes - data doesn't change often)
const SKIP_TRACE_STALE_TIME = 1000 * 60 * 5;

// Query key factory
export const skipTracingKeys = {
  all: ['skip-tracing'] as const,
  lists: () => [...skipTracingKeys.all, 'list'] as const,
  list: (filters: { contactId?: string; leadId?: string; propertyId?: string }) =>
    [...skipTracingKeys.lists(), filters] as const,
  details: () => [...skipTracingKeys.all, 'detail'] as const,
  detail: (id: string) => [...skipTracingKeys.details(), id] as const,
  summary: () => [...skipTracingKeys.all, 'summary'] as const,
};

/**
 * Hook to fetch skip trace results with optional filters
 */
export function useSkipTraceResults(options?: {
  contactId?: string;
  leadId?: string;
  propertyId?: string;
  enabled?: boolean;
}) {
  const { fetchResults } = useSkipTracingStore();

  return useQuery({
    queryKey: skipTracingKeys.list({
      contactId: options?.contactId,
      leadId: options?.leadId,
      propertyId: options?.propertyId,
    }),
    queryFn: () =>
      fetchResults({
        contactId: options?.contactId,
        leadId: options?.leadId,
        propertyId: options?.propertyId,
      }),
    enabled: options?.enabled !== false,
    staleTime: SKIP_TRACE_STALE_TIME,
  });
}

/**
 * Hook to fetch a single skip trace result by ID
 */
export function useSkipTraceResult(resultId: string | undefined) {
  const { fetchResultById } = useSkipTracingStore();

  return useQuery({
    queryKey: skipTracingKeys.detail(resultId || ''),
    queryFn: () => {
      if (!resultId) throw new Error('Result ID is required');
      return fetchResultById(resultId);
    },
    enabled: !!resultId,
    staleTime: SKIP_TRACE_STALE_TIME,
    retry: 1, // Only retry once for individual results
  });
}

/**
 * Hook to fetch skip trace results for a specific contact
 */
export function useContactSkipTraces(contactId: string | undefined) {
  return useSkipTraceResults({
    contactId,
    enabled: !!contactId,
  });
}

/**
 * Hook to fetch skip trace results for a specific property
 */
export function usePropertySkipTraces(propertyId: string | undefined) {
  return useSkipTraceResults({
    propertyId,
    enabled: !!propertyId,
  });
}

/**
 * Hook to run a new skip trace
 * Note: The calling component should handle displaying the error via its own try-catch.
 * This onError is a fallback for unhandled errors.
 */
export function useRunSkipTrace() {
  const queryClient = useQueryClient();
  const { runSkipTrace } = useSkipTracingStore();

  return useMutation({
    mutationFn: (input: SkipTraceInput) => runSkipTrace(input),
    onSuccess: (result, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: skipTracingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: skipTracingKeys.summary() });

      // If linked to contact/property, invalidate those lists too
      if (variables.contact_id) {
        queryClient.invalidateQueries({
          queryKey: skipTracingKeys.list({ contactId: variables.contact_id }),
        });
      }
      if (variables.property_id) {
        queryClient.invalidateQueries({
          queryKey: skipTracingKeys.list({ propertyId: variables.property_id }),
        });
      }
    },
    onError: (error) => {
      // Use centralized error handler for proper logging and user feedback
      errorHandler.handle(error);
    },
  });
}

/**
 * Hook to match a skip trace result to a property
 */
export function useMatchToProperty() {
  const queryClient = useQueryClient();
  const { matchToProperty } = useSkipTracingStore();

  return useMutation({
    mutationFn: ({ resultId, propertyId }: { resultId: string; propertyId: string }) =>
      matchToProperty(resultId, propertyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: skipTracingKeys.detail(variables.resultId),
      });
      queryClient.invalidateQueries({ queryKey: skipTracingKeys.lists() });
    },
    onError: (error) => {
      // Use centralized error handler for proper logging and user feedback
      errorHandler.handle(error);
    },
  });
}

/**
 * Hook to delete a skip trace result
 * Note: SkipTraceDetailScreen wraps the mutation call in try-catch for its own error handling.
 * This onError is a fallback.
 */
export function useDeleteSkipTrace() {
  const queryClient = useQueryClient();
  const { deleteResult } = useSkipTracingStore();

  return useMutation({
    mutationFn: (resultId: string) => deleteResult(resultId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skipTracingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: skipTracingKeys.summary() });
    },
    onError: (error) => {
      // Use centralized error handler for proper logging and user feedback
      errorHandler.handle(error);
    },
  });
}

/**
 * Hook to auto-trace a new lead
 * This is typically called automatically, so user feedback is important.
 */
export function useAutoTraceNewLead() {
  const queryClient = useQueryClient();
  const { autoTraceNewLead } = useSkipTracingStore();

  return useMutation({
    mutationFn: (leadId: string) => autoTraceNewLead(leadId),
    onSuccess: (result, leadId) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: skipTracingKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: skipTracingKeys.list({ leadId }),
        });
      }
    },
    onError: (error, leadId) => {
      // Auto-trace failures should be logged but not interrupt the user aggressively
      // Show a warning instead of an error since it's a background operation
      const message = error instanceof Error ? error.message : 'Unknown error';
      showWarning(`Auto skip trace failed for lead: ${message}`, 'Skip Trace');
    },
  });
}

/**
 * Hook to get skip trace summary stats
 */
export function useSkipTraceSummary() {
  const { getSummary, results } = useSkipTracingStore();

  // Recompute summary when results change
  return {
    ...getSummary(),
    hasResults: results.length > 0,
  };
}

/**
 * Hook to get skip trace count for badges
 */
export function useSkipTraceCount(options?: { contactId?: string; propertyId?: string }) {
  const { data: results } = useSkipTraceResults({
    contactId: options?.contactId,
    propertyId: options?.propertyId,
  });

  const completedCount = results?.filter((r) => r.status === 'completed').length || 0;
  const pendingCount =
    results?.filter((r) => r.status === 'pending' || r.status === 'processing').length || 0;

  return {
    total: results?.length || 0,
    completed: completedCount,
    pending: pendingCount,
    hasPending: pendingCount > 0,
  };
}
