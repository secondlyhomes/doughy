// src/features/portfolio/hooks/usePortfolioMortgages.ts
// Hook for managing portfolio mortgage/debt records

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PortfolioMortgage, MortgageInput, LoanType } from '../types';
import {
  calculatePaymentBreakdown,
  calculateRemainingAmortization,
  calculateExtraPaymentImpact,
} from '@/lib/amortization';

/**
 * Hook for CRUD operations on portfolio mortgages
 */
export function usePortfolioMortgages(portfolioEntryId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch all mortgages for a portfolio entry
  const {
    data: mortgages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-mortgages', portfolioEntryId],
    queryFn: async (): Promise<PortfolioMortgage[]> => {
      if (!portfolioEntryId) return [];

      const { data, error } = await supabase
        .schema('investor').from('portfolio_mortgages')
        .select('*')
        .eq('portfolio_entry_id', portfolioEntryId)
        .order('is_primary', { ascending: false });

      if (error) {
        console.error('Error fetching mortgages:', error);
        throw error;
      }

      return (data || []).map(transformMortgage);
    },
    enabled: !!portfolioEntryId,
  });

  // Create a new mortgage
  const createMortgage = useMutation({
    mutationFn: async (input: MortgageInput): Promise<PortfolioMortgage> => {
      // If this is primary, unset any existing primary
      if (input.is_primary !== false) {
        const { error: unsetError } = await supabase
          .schema('investor').from('portfolio_mortgages')
          .update({ is_primary: false })
          .eq('portfolio_entry_id', input.portfolio_entry_id);

        if (unsetError) {
          console.error('[usePortfolioMortgages] Failed to unset existing primary:', unsetError);
          throw new Error('Failed to update existing mortgages. Please try again.');
        }
      }

      const { data, error } = await supabase
        .schema('investor').from('portfolio_mortgages')
        .insert({
          portfolio_entry_id: input.portfolio_entry_id,
          lender_name: input.lender_name,
          loan_type: input.loan_type,
          original_balance: input.original_balance,
          current_balance: input.current_balance,
          interest_rate: input.interest_rate,
          monthly_payment: input.monthly_payment,
          start_date: input.start_date,
          maturity_date: input.maturity_date,
          term_months: input.term_months,
          is_primary: input.is_primary !== false,
          escrow_amount: input.escrow_amount,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return transformMortgage(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-mortgages', portfolioEntryId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-performance'] });
    },
  });

  // Update a mortgage
  const updateMortgage = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<MortgageInput>;
    }): Promise<PortfolioMortgage> => {
      // If setting as primary, unset any existing primary
      if (updates.is_primary === true && portfolioEntryId) {
        const { error: unsetError } = await supabase
          .schema('investor').from('portfolio_mortgages')
          .update({ is_primary: false })
          .eq('portfolio_entry_id', portfolioEntryId)
          .neq('id', id);

        if (unsetError) {
          console.error('[usePortfolioMortgages] Failed to unset existing primary:', unsetError);
          throw new Error('Failed to update existing mortgages. Please try again.');
        }
      }

      const { data, error } = await supabase
        .schema('investor').from('portfolio_mortgages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformMortgage(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-mortgages', portfolioEntryId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-performance'] });
    },
  });

  // Delete a mortgage
  const deleteMortgage = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .schema('investor').from('portfolio_mortgages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-mortgages', portfolioEntryId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-performance'] });
    },
  });

  // Get primary mortgage
  const primaryMortgage = mortgages.find((m) => m.is_primary);

  // Calculate totals
  const totalDebt = mortgages.reduce((sum, m) => sum + m.current_balance, 0);
  const totalMonthlyPayment = mortgages.reduce((sum, m) => sum + m.monthly_payment, 0);

  // Get amortization details for primary mortgage
  const primaryAmortization = primaryMortgage
    ? calculateRemainingAmortization(
        primaryMortgage.current_balance,
        primaryMortgage.interest_rate,
        primaryMortgage.monthly_payment,
        new Date().toISOString().split('T')[0]
      )
    : null;

  // Get this month's payment breakdown for primary
  const thisMonthBreakdown = primaryMortgage
    ? calculatePaymentBreakdown(
        primaryMortgage.current_balance,
        primaryMortgage.interest_rate,
        primaryMortgage.monthly_payment
      )
    : null;

  // Calculate extra payment scenarios for primary mortgage
  const extraPaymentScenarios = primaryMortgage
    ? calculateExtraPaymentImpact(
        primaryMortgage.current_balance,
        primaryMortgage.interest_rate,
        primaryMortgage.monthly_payment,
        [100, 200, 500],
        new Date().toISOString().split('T')[0]
      )
    : [];

  return {
    mortgages,
    primaryMortgage,
    totalDebt,
    totalMonthlyPayment,
    primaryAmortization,
    thisMonthBreakdown,
    extraPaymentScenarios,
    isLoading,
    error,
    refetch,
    createMortgage: createMortgage.mutateAsync,
    updateMortgage: updateMortgage.mutateAsync,
    deleteMortgage: deleteMortgage.mutateAsync,
    isCreating: createMortgage.isPending,
    isUpdating: updateMortgage.isPending,
    isDeleting: deleteMortgage.isPending,
  };
}

// Helper to transform database record to typed mortgage
function transformMortgage(data: Record<string, unknown>): PortfolioMortgage {
  return {
    id: data.id as string,
    portfolio_entry_id: data.portfolio_entry_id as string,
    lender_name: data.lender_name as string | undefined,
    loan_type: (data.loan_type as LoanType) || 'conventional',
    original_balance: (data.original_balance as number) || 0,
    current_balance: (data.current_balance as number) || 0,
    interest_rate: (data.interest_rate as number) || 0,
    monthly_payment: (data.monthly_payment as number) || 0,
    start_date: data.start_date as string,
    maturity_date: data.maturity_date as string | undefined,
    term_months: data.term_months as number | undefined,
    is_primary: (data.is_primary as boolean) ?? true,
    escrow_amount: data.escrow_amount as number | undefined,
    notes: data.notes as string | undefined,
    created_at: data.created_at as string | undefined,
    updated_at: data.updated_at as string | undefined,
  };
}

/**
 * Format loan type for display
 */
export function formatLoanType(loanType: LoanType): string {
  const labels: Record<LoanType, string> = {
    conventional: 'Conventional',
    fha: 'FHA',
    va: 'VA',
    seller_finance: 'Seller Finance',
    hard_money: 'Hard Money',
    heloc: 'HELOC',
    other: 'Other',
  };
  return labels[loanType] || loanType;
}
