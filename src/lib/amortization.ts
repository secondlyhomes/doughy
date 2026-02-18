// src/lib/amortization.ts
// Amortization calculation utilities for mortgage tracking

import type {
  AmortizationEntry,
  AmortizationSchedule,
  ExtraPaymentScenario,
} from '@/features/portfolio/types';

/**
 * Calculate monthly payment for a loan
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate as percentage (e.g., 6.875)
 * @param termMonths - Loan term in months
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return principal / termMonths;

  const monthlyRate = annualRate / 100 / 12;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Generate full amortization schedule
 * @param principal - Original loan balance
 * @param annualRate - Annual interest rate as percentage
 * @param termMonths - Loan term in months
 * @param startDate - Loan start date (YYYY-MM-DD)
 * @param extraMonthlyPayment - Optional extra monthly payment towards principal
 * @returns Amortization schedule with all entries and summary
 */
export function calculateAmortization(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: string,
  extraMonthlyPayment: number = 0
): AmortizationSchedule {
  const entries: AmortizationEntry[] = [];
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);

  let balance = principal;
  let totalPrincipal = 0;
  let totalInterest = 0;
  let month = 1;

  const start = new Date(startDate);

  while (balance > 0 && month <= termMonths * 2) {
    // Cap at 2x term for safety
    const interest = Math.round(balance * monthlyRate * 100) / 100;
    let principalPayment = monthlyPayment - interest + extraMonthlyPayment;

    // Handle final payment
    if (principalPayment >= balance) {
      principalPayment = balance;
    }

    balance = Math.max(0, Math.round((balance - principalPayment) * 100) / 100);
    totalPrincipal += principalPayment;
    totalInterest += interest;

    // Calculate date for this payment
    const paymentDate = new Date(start);
    paymentDate.setMonth(paymentDate.getMonth() + month);

    entries.push({
      month,
      date: paymentDate.toISOString().split('T')[0],
      payment: Math.round((principalPayment + interest) * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    });

    if (balance <= 0) break;
    month++;
  }

  const lastEntry = entries[entries.length - 1];

  return {
    entries,
    summary: {
      totalPayments: entries.length,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      payoffDate: lastEntry?.date || startDate,
      originalBalance: principal,
      interestRate: annualRate,
      monthlyPayment: monthlyPayment + extraMonthlyPayment,
      termMonths,
    },
  };
}

/**
 * Calculate remaining schedule from current balance
 * @param currentBalance - Current loan balance
 * @param annualRate - Annual interest rate as percentage
 * @param monthlyPayment - Current monthly payment
 * @param startDate - Date to start calculations from (today)
 * @param extraMonthlyPayment - Optional extra payment
 * @returns Amortization schedule from current point
 */
export function calculateRemainingAmortization(
  currentBalance: number,
  annualRate: number,
  monthlyPayment: number,
  startDate: string,
  extraMonthlyPayment: number = 0
): AmortizationSchedule {
  const entries: AmortizationEntry[] = [];
  const monthlyRate = annualRate / 100 / 12;

  let balance = currentBalance;
  let totalPrincipal = 0;
  let totalInterest = 0;
  let month = 1;

  const start = new Date(startDate);
  const maxMonths = 360; // 30 years max

  while (balance > 0 && month <= maxMonths) {
    const interest = Math.round(balance * monthlyRate * 100) / 100;
    let principalPayment = monthlyPayment - interest + extraMonthlyPayment;

    // Handle final payment
    if (principalPayment >= balance) {
      principalPayment = balance;
    }

    // Check if payment covers interest
    if (principalPayment <= 0) {
      // Payment doesn't cover interest - loan will never pay off
      break;
    }

    balance = Math.max(0, Math.round((balance - principalPayment) * 100) / 100);
    totalPrincipal += principalPayment;
    totalInterest += interest;

    const paymentDate = new Date(start);
    paymentDate.setMonth(paymentDate.getMonth() + month);

    entries.push({
      month,
      date: paymentDate.toISOString().split('T')[0],
      payment: Math.round((principalPayment + interest) * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    });

    if (balance <= 0) break;
    month++;
  }

  const lastEntry = entries[entries.length - 1];

  return {
    entries,
    summary: {
      totalPayments: entries.length,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      payoffDate: lastEntry?.date || startDate,
      originalBalance: currentBalance,
      interestRate: annualRate,
      monthlyPayment: monthlyPayment + extraMonthlyPayment,
      termMonths: entries.length,
    },
  };
}

/**
 * Calculate impact of extra monthly payments
 * @param currentBalance - Current loan balance
 * @param annualRate - Annual interest rate as percentage
 * @param monthlyPayment - Current monthly payment
 * @param extraAmounts - Array of extra monthly payment amounts to calculate
 * @param startDate - Date to start calculations from
 * @returns Array of scenarios showing impact of each extra amount
 */
export function calculateExtraPaymentImpact(
  currentBalance: number,
  annualRate: number,
  monthlyPayment: number,
  extraAmounts: number[],
  startDate: string
): ExtraPaymentScenario[] {
  // Calculate baseline (no extra payments)
  const baseline = calculateRemainingAmortization(
    currentBalance,
    annualRate,
    monthlyPayment,
    startDate,
    0
  );

  return extraAmounts.map((extraAmount) => {
    const withExtra = calculateRemainingAmortization(
      currentBalance,
      annualRate,
      monthlyPayment,
      startDate,
      extraAmount
    );

    return {
      extraMonthlyAmount: extraAmount,
      newPayoffDate: withExtra.summary.payoffDate,
      monthsSaved: baseline.summary.totalPayments - withExtra.summary.totalPayments,
      interestSaved: Math.round((baseline.summary.totalInterest - withExtra.summary.totalInterest) * 100) / 100,
      totalInterestWithExtra: withExtra.summary.totalInterest,
    };
  });
}

/**
 * Calculate payoff date for a loan
 * @param currentBalance - Current balance
 * @param annualRate - Annual interest rate as percentage
 * @param monthlyPayment - Monthly payment
 * @returns Payoff date string
 */
export function calculatePayoffDate(
  currentBalance: number,
  annualRate: number,
  monthlyPayment: number
): string {
  const schedule = calculateRemainingAmortization(
    currentBalance,
    annualRate,
    monthlyPayment,
    new Date().toISOString().split('T')[0]
  );
  return schedule.summary.payoffDate;
}

/**
 * Calculate principal and interest breakdown for a specific payment
 * @param balance - Current balance before payment
 * @param annualRate - Annual interest rate as percentage
 * @param monthlyPayment - Monthly payment amount
 * @returns Object with principal and interest portions
 */
export function calculatePaymentBreakdown(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): { principal: number; interest: number } {
  const monthlyRate = annualRate / 100 / 12;
  const interest = Math.round(balance * monthlyRate * 100) / 100;
  const principal = Math.round((monthlyPayment - interest) * 100) / 100;

  return { principal, interest };
}

/**
 * Calculate current loan balance based on original terms and elapsed time
 * @param originalBalance - Original loan amount
 * @param annualRate - Annual interest rate as percentage
 * @param termMonths - Original loan term in months
 * @param monthsElapsed - Number of months since loan start
 * @returns Estimated current balance
 */
export function estimateCurrentBalance(
  originalBalance: number,
  annualRate: number,
  termMonths: number,
  monthsElapsed: number
): number {
  const schedule = calculateAmortization(
    originalBalance,
    annualRate,
    termMonths,
    new Date().toISOString().split('T')[0]
  );

  const entry = schedule.entries[Math.min(monthsElapsed, schedule.entries.length - 1)];
  return entry?.balance ?? 0;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercent(rate: number): string {
  return `${rate.toFixed(3)}%`;
}

/**
 * Calculate years and months from total months
 */
export function formatMonthsAsYearsMonths(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  return `${years}y ${months}m`;
}
