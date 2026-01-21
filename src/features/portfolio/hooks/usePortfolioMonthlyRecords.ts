// src/features/portfolio/hooks/usePortfolioMonthlyRecords.ts
// Hook for managing monthly financial records

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  PortfolioMonthlyRecord,
  MonthlyRecordInput,
  PortfolioExpenseBreakdown,
} from '../types';

/**
 * Hook for CRUD operations on monthly financial records
 */
export function usePortfolioMonthlyRecords(portfolioEntryId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch all monthly records for a portfolio entry
  const {
    data: records = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-monthly-records', portfolioEntryId],
    queryFn: async (): Promise<PortfolioMonthlyRecord[]> => {
      if (!portfolioEntryId) return [];

      const { data, error } = await supabase
        .from('re_portfolio_monthly_records')
        .select('*')
        .eq('portfolio_entry_id', portfolioEntryId)
        .order('month', { ascending: false });

      if (error) {
        console.error('Error fetching monthly records:', error);
        throw error;
      }

      return (data || []).map(transformRecord);
    },
    enabled: !!portfolioEntryId,
  });

  // Create a new monthly record
  const createRecord = useMutation({
    mutationFn: async (input: MonthlyRecordInput): Promise<PortfolioMonthlyRecord> => {
      const expenses = calculateExpenseTotal(input.expenses);

      const { data, error } = await supabase
        .from('re_portfolio_monthly_records')
        .upsert(
          {
            portfolio_entry_id: input.portfolio_entry_id,
            month: input.month,
            rent_collected: input.rent_collected,
            expenses: JSON.parse(JSON.stringify(expenses)),
            occupancy_status: input.occupancy_status,
            notes: input.notes,
          },
          {
            onConflict: 'portfolio_entry_id,month',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return transformRecord(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-monthly-records', portfolioEntryId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-performance'] });
    },
  });

  // Update a monthly record
  const updateRecord = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<MonthlyRecordInput>;
    }): Promise<PortfolioMonthlyRecord> => {
      const updateData: Record<string, unknown> = {};

      if (updates.rent_collected !== undefined) {
        updateData.rent_collected = updates.rent_collected;
      }
      if (updates.expenses !== undefined) {
        updateData.expenses = calculateExpenseTotal(updates.expenses);
      }
      if (updates.occupancy_status !== undefined) {
        updateData.occupancy_status = updates.occupancy_status;
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }

      const { data, error } = await supabase
        .from('re_portfolio_monthly_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformRecord(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-monthly-records', portfolioEntryId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-performance'] });
    },
  });

  // Delete a monthly record
  const deleteRecord = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('re_portfolio_monthly_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-monthly-records', portfolioEntryId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-performance'] });
    },
  });

  // Calculate summary stats
  const summary = calculateRecordsSummary(records);

  return {
    records,
    summary,
    isLoading,
    error,
    refetch,
    createRecord: createRecord.mutateAsync,
    updateRecord: updateRecord.mutateAsync,
    deleteRecord: deleteRecord.mutateAsync,
    isCreating: createRecord.isPending,
    isUpdating: updateRecord.isPending,
    isDeleting: deleteRecord.isPending,
  };
}

// Helper to transform database record to typed record
function transformRecord(data: Record<string, unknown>): PortfolioMonthlyRecord {
  return {
    id: data.id as string,
    portfolio_entry_id: data.portfolio_entry_id as string,
    month: data.month as string,
    rent_collected: (data.rent_collected as number) || 0,
    expenses: (data.expenses as PortfolioExpenseBreakdown) || { total: 0 },
    occupancy_status: (data.occupancy_status as 'occupied' | 'vacant' | 'partial') || 'occupied',
    notes: data.notes as string | undefined,
    created_at: data.created_at as string | undefined,
    updated_at: data.updated_at as string | undefined,
  };
}

// Helper to calculate expense total from partial input
function calculateExpenseTotal(
  expenses: Partial<PortfolioExpenseBreakdown>
): PortfolioExpenseBreakdown {
  const total =
    (expenses.mortgage_piti || 0) +
    (expenses.property_tax || 0) +
    (expenses.insurance || 0) +
    (expenses.hoa || 0) +
    (expenses.repairs || 0) +
    (expenses.utilities || 0) +
    (expenses.property_management || 0) +
    (expenses.other || 0);

  return {
    ...expenses,
    total,
  };
}

// Helper to calculate summary from records
function calculateRecordsSummary(records: PortfolioMonthlyRecord[]) {
  if (records.length === 0) {
    return {
      totalRentCollected: 0,
      totalExpenses: 0,
      totalCashFlow: 0,
      averageMonthlyRent: 0,
      averageMonthlyExpenses: 0,
      averageMonthlyCashFlow: 0,
      monthsTracked: 0,
      occupancyRate: 0,
    };
  }

  const totalRentCollected = records.reduce((sum, r) => sum + r.rent_collected, 0);
  const totalExpenses = records.reduce((sum, r) => sum + (r.expenses.total || 0), 0);
  const totalCashFlow = totalRentCollected - totalExpenses;
  const occupiedMonths = records.filter((r) => r.occupancy_status === 'occupied').length;

  return {
    totalRentCollected,
    totalExpenses,
    totalCashFlow,
    averageMonthlyRent: Math.round(totalRentCollected / records.length),
    averageMonthlyExpenses: Math.round(totalExpenses / records.length),
    averageMonthlyCashFlow: Math.round(totalCashFlow / records.length),
    monthsTracked: records.length,
    occupancyRate: Math.round((occupiedMonths / records.length) * 100),
  };
}

/**
 * Get the first day of a month in YYYY-MM-DD format
 */
export function getMonthFirstDay(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Format a month string (YYYY-MM-DD) for display
 */
export function formatMonth(monthString: string): string {
  const date = new Date(monthString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
