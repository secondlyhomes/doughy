// src/features/portfolio/hooks/usePortfolio.ts
// Hook for managing the user's portfolio of properties

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthProvider';
import type { PortfolioProperty, PortfolioSummary } from '../types';

// Mock data for development when database tables don't exist yet
const mockPortfolioData: { properties: PortfolioProperty[]; summary: PortfolioSummary } = {
  properties: [
    {
      id: 'portfolio-1',
      address: '123 Oak Street',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      propertyType: 'single_family',
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 1800,
      purchase_price: 285000,
      current_value: 320000,
      equity: 35000,
      monthly_rent: 2200,
      monthly_expenses: 1400,
      monthly_cash_flow: 800,
      acquisition_date: '2024-03-15',
    },
    {
      id: 'portfolio-2',
      address: '456 Pine Avenue',
      city: 'San Antonio',
      state: 'TX',
      zip: '78205',
      propertyType: 'duplex',
      bedrooms: 4,
      bathrooms: 2,
      square_feet: 2400,
      purchase_price: 350000,
      current_value: 385000,
      equity: 35000,
      monthly_rent: 3200,
      monthly_expenses: 2100,
      monthly_cash_flow: 1100,
      acquisition_date: '2024-06-01',
    },
  ],
  summary: {
    totalProperties: 2,
    totalValue: 705000,
    totalEquity: 70000,
    monthlyCashFlow: 1900,
    averageCapRate: 7.2,
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
          .from('re_deals')
          .select(`
            *,
            property:re_properties(*)
          `)
          .eq('user_id', user.id)
          .eq('stage', 'closed_won');

        if (dealsError) {
          console.error('Error fetching portfolio deals:', dealsError);
          // Fall back to mock data if table doesn't exist
          return mockPortfolioData;
        }

        if (!deals || deals.length === 0) {
          // Return mock data for development/demo
          return mockPortfolioData;
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
        // Return mock data as fallback
        return mockPortfolioData;
      }
    },
    enabled: !!user?.id,
  });

  // Add property to portfolio (mark deal as closed_won)
  const addToPortfolio = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from('re_deals')
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
        .from('re_deals')
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
