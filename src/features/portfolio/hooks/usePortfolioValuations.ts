// src/features/portfolio/hooks/usePortfolioValuations.ts
// Hook for managing property valuations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { PortfolioValuation } from '../types';

interface ValuationInput {
  property_id: string;
  estimated_value: number;
  valuation_date: string;
  source?: string;
  notes?: string;
}

/**
 * Hook for CRUD operations on property valuations
 */
export function usePortfolioValuations(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all valuations for a property
  const {
    data: valuations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-valuations', propertyId],
    queryFn: async (): Promise<PortfolioValuation[]> => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('investor_portfolio_valuations')
        .select('*')
        .eq('property_id', propertyId)
        .order('valuation_date', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.message.includes('does not exist')) {
          return [];
        }
        console.error('Error fetching valuations:', error);
        throw error;
      }

      return (data || []).map(transformValuation);
    },
    enabled: !!propertyId,
  });

  // Create a new valuation
  const createValuation = useMutation({
    mutationFn: async (input: ValuationInput): Promise<PortfolioValuation> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('investor_portfolio_valuations')
        .insert({
          property_id: input.property_id,
          estimated_value: input.estimated_value,
          valuation_date: input.valuation_date,
          source: input.source,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return transformValuation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-valuations', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-performance'] });
    },
  });

  // Update a valuation
  const updateValuation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ValuationInput>;
    }): Promise<PortfolioValuation> => {
      const { data, error } = await supabase
        .from('investor_portfolio_valuations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformValuation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-valuations', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-performance'] });
    },
  });

  // Delete a valuation
  const deleteValuation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('investor_portfolio_valuations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-valuations', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-performance'] });
    },
  });

  // Calculate appreciation metrics
  const appreciationMetrics = calculateAppreciationMetrics(valuations);

  return {
    valuations,
    latestValuation: valuations[0],
    appreciationMetrics,
    isLoading,
    error,
    refetch,
    createValuation: createValuation.mutateAsync,
    updateValuation: updateValuation.mutateAsync,
    deleteValuation: deleteValuation.mutateAsync,
    isCreating: createValuation.isPending,
    isUpdating: updateValuation.isPending,
    isDeleting: deleteValuation.isPending,
  };
}

// Transform database record to typed valuation
function transformValuation(data: Record<string, unknown>): PortfolioValuation {
  return {
    id: data.id as string,
    property_id: data.property_id as string,
    estimated_value: (data.estimated_value as number) || 0,
    valuation_date: data.valuation_date as string,
    source: data.source as string | undefined,
    notes: data.notes as string | undefined,
  };
}

// Calculate appreciation metrics from valuations
function calculateAppreciationMetrics(valuations: PortfolioValuation[]) {
  if (valuations.length === 0) {
    return {
      currentValue: 0,
      purchaseValue: 0,
      totalAppreciation: 0,
      percentAppreciation: 0,
      annualizedAppreciation: 0,
    };
  }

  // Valuations are sorted newest first
  const currentValue = valuations[0].estimated_value;
  const oldestValuation = valuations[valuations.length - 1];
  const purchaseValue = oldestValuation.estimated_value;

  const totalAppreciation = currentValue - purchaseValue;
  const percentAppreciation = purchaseValue > 0
    ? (totalAppreciation / purchaseValue) * 100
    : 0;

  // Calculate annualized appreciation
  const startDate = new Date(oldestValuation.valuation_date);
  const endDate = new Date(valuations[0].valuation_date);
  const years = Math.max(
    0.1,
    (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const annualizedAppreciation = purchaseValue > 0
    ? (Math.pow(currentValue / purchaseValue, 1 / years) - 1) * 100
    : 0;

  return {
    currentValue,
    purchaseValue,
    totalAppreciation,
    percentAppreciation: Math.round(percentAppreciation * 10) / 10,
    annualizedAppreciation: Math.round(annualizedAppreciation * 10) / 10,
  };
}

/**
 * Valuation source values for database storage (must match DB CHECK constraint)
 * DB constraint: CHECK(source IN ('zillow', 'manual', 'appraisal', 'redfin', 'rentcast', 'cma', 'tax_assessment', 'other'))
 */
export const VALUATION_SOURCES = [
  'zillow',
  'redfin',
  'appraisal',
  'cma',
  'tax_assessment',
  'manual',
  'other',
] as const;

export type ValuationSource = (typeof VALUATION_SOURCES)[number];

/**
 * Display name mapping for valuation sources
 */
export const VALUATION_SOURCE_LABELS: Record<ValuationSource, string> = {
  zillow: 'Zillow',
  redfin: 'Redfin',
  appraisal: 'Appraisal',
  cma: 'CMA',
  tax_assessment: 'Tax Assessment',
  manual: 'Manual Estimate',
  other: 'Other',
};

/**
 * Format valuation source for display
 */
export function formatValuationSource(source: string | undefined): string {
  if (!source) return 'Unknown';
  return VALUATION_SOURCE_LABELS[source as ValuationSource] || source;
}
