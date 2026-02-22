// src/lib/financial-calculations.ts
// Financial calculation utilities for real estate deal analysis

/**
 * Amortization schedule entry
 */
export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
}

/**
 * Loan summary data
 */
export interface LoanSummary {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  totalCost: number;
  effectiveRate: number;
}

/**
 * Deal analysis input
 */
export interface DealAnalysisInput {
  purchasePrice: number;
  afterRepairValue: number;
  repairCosts: number;
  holdingCosts?: number;
  closingCosts?: number;
  sellingCosts?: number;
  downPayment?: number;
  loanAmount?: number;
  interestRate?: number;
  loanTermYears?: number;
}

/**
 * Deal analysis result
 */
export interface DealAnalysisResult {
  totalInvestment: number;
  projectedProfit: number;
  returnOnInvestment: number;
  cashOnCashReturn: number;
  maxAllowableOffer: number;
  equity: number;
  monthlyPayment?: number;
}

/**
 * Calculate monthly mortgage payment (Principal & Interest)
 *
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate (e.g., 7.5 for 7.5%)
 * @param termYears - Loan term in years
 * @returns Monthly payment amount
 *
 * @example
 * ```typescript
 * const payment = calculateMonthlyPayment(300000, 7.5, 30);
 * // $2,097.64
 * ```
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0 || termYears <= 0) return 0;

  // Handle 0% interest (simple division)
  if (annualRate <= 0) {
    return principal / (termYears * 12);
  }

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Generate a complete amortization schedule
 *
 * @example
 * ```typescript
 * const schedule = generateAmortizationSchedule(300000, 7.5, 30);
 * console.log(schedule[0]); // First month
 * console.log(schedule[359]); // Last month
 * ```
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number
): AmortizationEntry[] {
  if (principal <= 0 || termYears <= 0) return [];

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);

  const schedule: AmortizationEntry[] = [];
  let balance = principal;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  for (let month = 1; month <= numPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;

    balance -= principalPayment;
    totalInterestPaid += interestPayment;
    totalPrincipalPaid += principalPayment;

    schedule.push({
      month,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
      totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
      totalPrincipalPaid: Math.round(totalPrincipalPaid * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Calculate total interest paid over the life of a loan
 *
 * @example
 * ```typescript
 * const totalInterest = calculateTotalInterest(300000, 7.5, 30);
 * // $455,151
 * ```
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const totalPayments = monthlyPayment * termYears * 12;
  return Math.round((totalPayments - principal) * 100) / 100;
}

/**
 * Get a comprehensive loan summary
 *
 * @example
 * ```typescript
 * const summary = getLoanSummary(300000, 7.5, 30);
 * console.log(summary.monthlyPayment); // 2097.64
 * console.log(summary.totalInterest); // 455151
 * ```
 */
export function getLoanSummary(
  principal: number,
  annualRate: number,
  termYears: number
): LoanSummary {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const totalPayments = monthlyPayment * termYears * 12;
  const totalInterest = totalPayments - principal;
  const effectiveRate = (totalInterest / principal) * 100;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayments: Math.round(totalPayments * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalCost: Math.round((principal + totalInterest) * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
  };
}

/**
 * Calculate loan balance at a specific point in time
 *
 * @param principal - Original loan amount
 * @param annualRate - Annual interest rate
 * @param termYears - Original loan term
 * @param monthsElapsed - Number of months since loan origination
 * @returns Remaining balance
 */
export function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  termYears: number,
  monthsElapsed: number
): number {
  const schedule = generateAmortizationSchedule(principal, annualRate, termYears);
  if (monthsElapsed <= 0) return principal;
  if (monthsElapsed >= schedule.length) return 0;
  return schedule[monthsElapsed - 1].balance;
}

/**
 * Calculate equity at a specific point in time
 *
 * @param propertyValue - Current property value
 * @param loanBalance - Current loan balance
 * @returns Equity amount
 */
export function calculateEquity(
  propertyValue: number,
  loanBalance: number
): number {
  return Math.max(0, propertyValue - loanBalance);
}

/**
 * Analyze a real estate deal
 *
 * @example
 * ```typescript
 * const analysis = analyzeDeal({
 *   purchasePrice: 200000,
 *   afterRepairValue: 300000,
 *   repairCosts: 30000,
 *   holdingCosts: 5000,
 *   closingCosts: 8000,
 *   sellingCosts: 18000,
 * });
 *
 * console.log(analysis.projectedProfit); // 39000
 * console.log(analysis.returnOnInvestment); // 16%
 * ```
 */
export function analyzeDeal(input: DealAnalysisInput): DealAnalysisResult {
  const {
    purchasePrice,
    afterRepairValue,
    repairCosts,
    holdingCosts = 0,
    closingCosts = 0,
    sellingCosts = 0,
    downPayment = purchasePrice,
    loanAmount = 0,
    interestRate = 0,
    loanTermYears = 30,
  } = input;

  // Calculate total investment
  const totalInvestment =
    downPayment + repairCosts + holdingCosts + closingCosts;

  // Calculate selling costs if not provided (typically 6% of ARV)
  const actualSellingCosts = sellingCosts || afterRepairValue * 0.06;

  // Calculate projected profit
  const projectedProfit =
    afterRepairValue - purchasePrice - repairCosts - holdingCosts - closingCosts - actualSellingCosts;

  // Calculate ROI
  const returnOnInvestment =
    totalInvestment > 0 ? (projectedProfit / totalInvestment) * 100 : 0;

  // Calculate cash-on-cash return (if using financing)
  const cashInvested = downPayment + repairCosts + holdingCosts + closingCosts;
  const cashOnCashReturn = cashInvested > 0 ? (projectedProfit / cashInvested) * 100 : 0;

  // Calculate Maximum Allowable Offer (MAO) using 70% rule
  // MAO = ARV * 0.70 - Repair Costs
  const maxAllowableOffer = afterRepairValue * 0.7 - repairCosts;

  // Calculate equity
  const equity = afterRepairValue - (loanAmount > 0 ? loanAmount : 0);

  // Calculate monthly payment if financing
  const monthlyPayment =
    loanAmount > 0
      ? calculateMonthlyPayment(loanAmount, interestRate, loanTermYears)
      : undefined;

  return {
    totalInvestment: Math.round(totalInvestment),
    projectedProfit: Math.round(projectedProfit),
    returnOnInvestment: Math.round(returnOnInvestment * 10) / 10,
    cashOnCashReturn: Math.round(cashOnCashReturn * 10) / 10,
    maxAllowableOffer: Math.round(maxAllowableOffer),
    equity: Math.round(equity),
    monthlyPayment,
  };
}

/**
 * Calculate the 70% rule for Maximum Allowable Offer
 *
 * @param arv - After Repair Value
 * @param repairCosts - Estimated repair costs
 * @returns Maximum offer price
 */
export function calculate70PercentRule(
  arv: number,
  repairCosts: number
): number {
  return Math.round(arv * 0.7 - repairCosts);
}

/**
 * Calculate rental property cash flow
 *
 * @example
 * ```typescript
 * const cashFlow = calculateRentalCashFlow({
 *   monthlyRent: 2000,
 *   monthlyExpenses: 500,
 *   monthlyMortgage: 1200,
 *   vacancyRate: 0.08,
 * });
 * // { monthlyCashFlow: 140, annualCashFlow: 1680, ... }
 * ```
 */
export function calculateRentalCashFlow(input: {
  monthlyRent: number;
  monthlyExpenses: number;
  monthlyMortgage: number;
  vacancyRate?: number;
  propertyManagementRate?: number;
}): {
  grossMonthlyIncome: number;
  effectiveGrossIncome: number;
  netOperatingIncome: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
} {
  const {
    monthlyRent,
    monthlyExpenses,
    monthlyMortgage,
    vacancyRate = 0.08,
    propertyManagementRate = 0,
  } = input;

  const grossMonthlyIncome = monthlyRent;
  const vacancyLoss = monthlyRent * vacancyRate;
  const effectiveGrossIncome = grossMonthlyIncome - vacancyLoss;

  const propertyManagement = monthlyRent * propertyManagementRate;
  const totalExpenses = monthlyExpenses + propertyManagement;

  const netOperatingIncome = effectiveGrossIncome - totalExpenses;
  const monthlyCashFlow = netOperatingIncome - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;

  return {
    grossMonthlyIncome: Math.round(grossMonthlyIncome),
    effectiveGrossIncome: Math.round(effectiveGrossIncome),
    netOperatingIncome: Math.round(netOperatingIncome),
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualCashFlow: Math.round(annualCashFlow),
  };
}

/**
 * Calculate cap rate (Capitalization Rate)
 *
 * @param netOperatingIncome - Annual NOI
 * @param propertyValue - Current market value
 * @returns Cap rate as a percentage
 */
export function calculateCapRate(
  netOperatingIncome: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) return 0;
  return Math.round((netOperatingIncome / propertyValue) * 10000) / 100;
}

/**
 * Calculate debt service coverage ratio (DSCR)
 *
 * @param netOperatingIncome - Annual NOI
 * @param annualDebtService - Annual mortgage payments
 * @returns DSCR ratio
 */
export function calculateDSCR(
  netOperatingIncome: number,
  annualDebtService: number
): number {
  if (annualDebtService <= 0) return 0;
  return Math.round((netOperatingIncome / annualDebtService) * 100) / 100;
}
