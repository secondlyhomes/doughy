// src/features/portfolio/hooks/usePortfolioPerformance.ts
// Hook for calculating portfolio property performance metrics

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
  PortfolioPropertyPerformance,
  PortfolioBenchmark,
  PortfolioMonthlyRecord,
  PortfolioMortgage,
  PortfolioValuation,
} from '../types';

const DEFAULT_APPRECIATION_RATE = 0.03; // 3% annual appreciation
const DEFAULT_SP500_RETURN = 0.10; // 10% historical average

/**
 * Hook for calculating performance metrics for a single portfolio property
 */
export function usePortfolioPerformance(portfolioEntryId: string | undefined) {
  const { user } = useAuth();

  const {
    data: performance,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-performance', portfolioEntryId],
    queryFn: async (): Promise<PortfolioPropertyPerformance | null> => {
      if (!portfolioEntryId || !user?.id) return null;

      // Fetch portfolio entry
      const { data: entry, error: entryError } = await supabase
        .from('investor_portfolio_entries')
        .select('*')
        .eq('id', portfolioEntryId)
        .single();

      if (entryError || !entry) {
        console.error('Error fetching portfolio entry:', entryError);
        return null;
      }

      // Fetch monthly records
      const { data: monthlyRecords, error: recordsError } = await supabase
        .from('investor_portfolio_monthly_records')
        .select('*')
        .eq('portfolio_entry_id', portfolioEntryId)
        .order('month', { ascending: true });

      if (recordsError) {
        console.error('Error fetching monthly records:', recordsError);
      }

      // Fetch mortgages
      const { data: mortgages, error: mortgagesError } = await supabase
        .from('investor_portfolio_mortgages')
        .select('*')
        .eq('portfolio_entry_id', portfolioEntryId);

      if (mortgagesError) {
        console.error('Error fetching mortgages:', mortgagesError);
      }

      // Fetch valuations
      const { data: valuations, error: valuationsError } = await supabase
        .from('investor_portfolio_valuations')
        .select('*')
        .eq('property_id', entry.property_id)
        .order('valuation_date', { ascending: true });

      if (valuationsError) {
        console.error('Error fetching valuations:', valuationsError);
      }

      return calculatePerformance(
        entry,
        (monthlyRecords || []) as unknown as PortfolioMonthlyRecord[],
        (mortgages || []) as unknown as PortfolioMortgage[],
        (valuations || []) as unknown as PortfolioValuation[]
      );
    },
    enabled: !!portfolioEntryId && !!user?.id,
  });

  // Get benchmark data
  const benchmark = calculateBenchmark(performance);

  return {
    performance,
    benchmark,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Calculate performance metrics from raw data
 */
function calculatePerformance(
  entry: Record<string, unknown>,
  monthlyRecords: PortfolioMonthlyRecord[],
  mortgages: PortfolioMortgage[],
  valuations: PortfolioValuation[]
): PortfolioPropertyPerformance {
  const acquisitionDate = entry.acquisition_date as string;
  const acquisitionPrice = (entry.acquisition_price as number) || 0;
  const propertyId = entry.property_id as string;

  // Calculate months owned
  const startDate = new Date(acquisitionDate);
  const now = new Date();
  const monthsOwned = Math.max(
    1,
    (now.getFullYear() - startDate.getFullYear()) * 12 +
      (now.getMonth() - startDate.getMonth())
  );

  // Calculate cash flow metrics from monthly records
  const totalRentCollected = monthlyRecords.reduce((sum, r) => sum + (r.rent_collected || 0), 0);
  const totalExpenses = monthlyRecords.reduce((sum, r) => sum + (r.expenses?.total || 0), 0);
  const totalCashFlow = totalRentCollected - totalExpenses;
  const averageMonthlyCashFlow = monthlyRecords.length > 0
    ? totalCashFlow / monthlyRecords.length
    : (entry.monthly_rent as number || 0) - (entry.monthly_expenses as number || 0);

  // Build cash flow history
  const cashFlowHistory = monthlyRecords.map((r) => ({
    month: r.month,
    amount: r.rent_collected - (r.expenses?.total || 0),
    rent: r.rent_collected,
    expenses: r.expenses?.total || 0,
  }));

  // Get current mortgage balance
  const primaryMortgage = mortgages.find((m) => m.is_primary);
  const currentMortgageBalance = mortgages.reduce((sum, m) => sum + m.current_balance, 0);

  // Get current value from latest valuation or estimate
  const latestValuation = valuations.length > 0 ? valuations[valuations.length - 1] : null;
  const currentValue = latestValuation
    ? latestValuation.estimated_value
    : estimateCurrentValue(acquisitionPrice, monthsOwned);

  // Calculate current equity
  const currentEquity = currentValue - currentMortgageBalance;

  // Build equity history (simplified - based on monthly records timeline)
  const equityHistory = buildEquityHistory(
    acquisitionPrice,
    acquisitionDate,
    currentMortgageBalance,
    primaryMortgage,
    valuations,
    monthsOwned
  );

  // Calculate return metrics
  const downPayment = acquisitionPrice - (primaryMortgage?.original_balance || acquisitionPrice);
  const totalCashInvested = downPayment + totalExpenses;

  // Cash-on-cash return (annual cash flow / cash invested)
  const annualCashFlow = averageMonthlyCashFlow * 12;
  const cashOnCashReturn = totalCashInvested > 0
    ? (annualCashFlow / totalCashInvested) * 100
    : 0;

  // Cap rate (NOI / current value)
  const noi = annualCashFlow + (primaryMortgage?.monthly_payment || 0) * 12; // Add back mortgage
  const capRate = currentValue > 0 ? (noi / currentValue) * 100 : 0;

  // Total ROI (total returns / cash invested)
  const appreciation = currentValue - acquisitionPrice;
  const principalPaydown = (primaryMortgage?.original_balance || 0) - currentMortgageBalance;
  const totalReturns = totalCashFlow + appreciation + principalPaydown;
  const totalRoi = totalCashInvested > 0 ? (totalReturns / totalCashInvested) * 100 : 0;

  // Annualized return
  const yearsOwned = monthsOwned / 12;
  const annualizedReturn = yearsOwned > 0
    ? (Math.pow(1 + totalRoi / 100, 1 / yearsOwned) - 1) * 100
    : 0;

  // Projections (using default appreciation rate)
  const projected5yr = projectEquity(currentValue, currentMortgageBalance, primaryMortgage, 60);
  const projected10yr = projectEquity(currentValue, currentMortgageBalance, primaryMortgage, 120);

  return {
    property_id: propertyId,
    portfolio_entry_id: entry.id as string,

    // Cash flow metrics
    total_cash_flow: totalCashFlow,
    total_rent_collected: totalRentCollected,
    total_expenses: totalExpenses,
    average_monthly_cash_flow: Math.round(averageMonthlyCashFlow),

    // Historical data
    cash_flow_history: cashFlowHistory,
    equity_history: equityHistory,

    // Return metrics
    cash_on_cash_return: Math.round(cashOnCashReturn * 10) / 10,
    cap_rate: Math.round(capRate * 10) / 10,
    total_roi: Math.round(totalRoi * 10) / 10,
    annualized_return: Math.round(annualizedReturn * 10) / 10,

    // Current snapshot
    current_equity: Math.round(currentEquity),
    current_mortgage_balance: currentMortgageBalance,
    current_value: currentValue,

    // Projections
    projected_equity_5yr: projected5yr.equity,
    projected_equity_10yr: projected10yr.equity,
    projected_value_5yr: projected5yr.value,
    projected_value_10yr: projected10yr.value,

    // Ownership duration
    months_owned: monthsOwned,
    acquisition_date: acquisitionDate,
  };
}

/**
 * Estimate current value based on appreciation
 */
function estimateCurrentValue(acquisitionPrice: number, monthsOwned: number): number {
  const yearsOwned = monthsOwned / 12;
  return Math.round(acquisitionPrice * Math.pow(1 + DEFAULT_APPRECIATION_RATE, yearsOwned));
}

/**
 * Build equity history over time
 */
function buildEquityHistory(
  acquisitionPrice: number,
  acquisitionDate: string,
  currentMortgageBalance: number,
  primaryMortgage: PortfolioMortgage | undefined,
  valuations: PortfolioValuation[],
  monthsOwned: number
): Array<{ date: string; equity: number; mortgage: number; value: number }> {
  const history: Array<{ date: string; equity: number; mortgage: number; value: number }> = [];

  const startDate = new Date(acquisitionDate);
  const originalBalance = primaryMortgage?.original_balance || 0;
  const monthlyRate = primaryMortgage
    ? primaryMortgage.interest_rate / 100 / 12
    : 0;
  const monthlyPayment = primaryMortgage?.monthly_payment || 0;

  let balance = originalBalance;

  // Generate monthly points
  const intervals = Math.min(monthsOwned, 60); // Cap at 5 years for performance
  const step = Math.max(1, Math.floor(monthsOwned / intervals));

  for (let i = 0; i <= monthsOwned; i += step) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    const dateStr = date.toISOString().split('T')[0];

    // Get value at this point (from valuation or estimate)
    const valuation = valuations.find((v) => v.valuation_date <= dateStr);
    const value = valuation
      ? valuation.estimated_value
      : estimateCurrentValue(acquisitionPrice, i);

    // Calculate mortgage balance at this point
    if (primaryMortgage && monthlyRate > 0) {
      // Simple amortization calculation
      for (let j = history.length > 0 ? step : 0; j > 0; j--) {
        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        balance = Math.max(0, balance - principal);
      }
    }

    const mortgage = Math.round(balance);
    const equity = value - mortgage;

    history.push({ date: dateStr, equity, mortgage, value });
  }

  return history;
}

/**
 * Project future equity
 */
function projectEquity(
  currentValue: number,
  currentBalance: number,
  mortgage: PortfolioMortgage | undefined,
  months: number
): { equity: number; value: number } {
  // Project future value with appreciation
  const futureValue = Math.round(
    currentValue * Math.pow(1 + DEFAULT_APPRECIATION_RATE, months / 12)
  );

  // Project future mortgage balance
  let balance = currentBalance;
  if (mortgage) {
    const monthlyRate = mortgage.interest_rate / 100 / 12;
    const payment = mortgage.monthly_payment;

    for (let i = 0; i < months && balance > 0; i++) {
      const interest = balance * monthlyRate;
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
    }
  }

  const futureBalance = Math.round(balance);
  const futureEquity = futureValue - futureBalance;

  return { equity: futureEquity, value: futureValue };
}

/**
 * Calculate benchmark comparison data
 */
function calculateBenchmark(
  performance: PortfolioPropertyPerformance | null | undefined
): PortfolioBenchmark {
  return {
    sp500_annual_return: DEFAULT_SP500_RETURN * 100,
    portfolio_average_cash_flow: performance?.average_monthly_cash_flow || 0,
    portfolio_average_cap_rate: performance?.cap_rate || 0,
    comparison_period_months: performance?.months_owned || 0,
  };
}
