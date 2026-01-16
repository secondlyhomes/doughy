// src/features/portfolio/hooks/usePortfolio.ts
// Hook for managing the user's portfolio of properties

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { PortfolioProperty, PortfolioSummary } from '../types';

// Empty portfolio state for when no data exists
const EMPTY_PORTFOLIO: { properties: PortfolioProperty[]; summary: PortfolioSummary } = {
  properties: [],
  summary: {
    totalProperties: 0,
    totalValue: 0,
    totalEquity: 0,
    monthlyCashFlow: 0,
  },
};

/**
 * Hook for fetching and managing the user's property portfolio
 */
export function usePortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async (): Promise<{ properties: PortfolioProperty[]; summary: PortfolioSummary }> => {
      if (!user?.id) {
        return { properties: [], summary: { totalProperties: 0, totalValue: 0, totalEquity: 0, monthlyCashFlow: 0 } };
      }

      try {
        // Get all deals marked as added to portfolio (closed_won deals)
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select(`
            *,
            property:re_properties(*)
          `)
          .eq('user_id', user.id)
          .eq('stage', 'closed_won');

        if (dealsError) {
          console.error('Error fetching portfolio deals:', dealsError);
          throw dealsError;
        }

        if (!deals || deals.length === 0) {
          return EMPTY_PORTFOLIO;
        }

        // Transform deals into portfolio properties
        const properties: PortfolioProperty[] = await Promise.all(
          (deals || []).map(async (deal) => {
            // Try to get latest valuation for this property
            let currentValue = deal.property?.purchase_price || 0;
            try {
              const { data: valuation } = await supabase
                .from('re_portfolio_valuations')
                .select('*')
                .eq('property_id', deal.property_id)
                .order('valuation_date', { ascending: false })
                .limit(1)
                .single();

              if (valuation?.estimated_value) {
                currentValue = valuation.estimated_value;
              }
            } catch {
              // Valuation table may not exist yet, use purchase price
            }

            const purchasePrice = deal.property?.purchase_price || 0;
            const monthlyRent = deal.property?.monthly_rent || 0;
            const monthlyExpenses = deal.property?.monthly_expenses || 0;

            return {
              ...deal.property,
              purchase_price: purchasePrice,
              current_value: currentValue,
              equity: currentValue - purchasePrice,
              monthly_rent: monthlyRent,
              monthly_expenses: monthlyExpenses,
              monthly_cash_flow: monthlyRent - monthlyExpenses,
              acquisition_date: deal.updated_at,
              deal_id: deal.id,
            } as PortfolioProperty;
          })
        );

        // Calculate summary metrics
        const summary: PortfolioSummary = {
          totalProperties: properties.length,
          totalValue: properties.reduce((sum, p) => sum + (p.current_value || 0), 0),
          totalEquity: properties.reduce((sum, p) => sum + (p.equity || 0), 0),
          monthlyCashFlow: properties.reduce((sum, p) => sum + (p.monthly_cash_flow || 0), 0),
        };

        return { properties, summary };
      } catch (err) {
        console.error('Error in usePortfolio:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
  });

  // Add property to portfolio (mark deal as closed_won)
  const addToPortfolio = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from('deals')
        .update({
          stage: 'closed_won',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  // Remove property from portfolio (revert to previous stage)
  const removeFromPortfolio = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from('deals')
        .update({
          stage: 'negotiating', // Revert to negotiating
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  return {
    properties: data?.properties || [],
    summary: data?.summary || { totalProperties: 0, totalValue: 0, totalEquity: 0, monthlyCashFlow: 0 },
    isLoading,
    error,
    refetch,
    addToPortfolio: addToPortfolio.mutate,
    removeFromPortfolio: removeFromPortfolio.mutate,
    isAdding: addToPortfolio.isPending,
    isRemoving: removeFromPortfolio.isPending,
  };
}
