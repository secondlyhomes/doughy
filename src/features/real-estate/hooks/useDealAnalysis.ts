// src/features/real-estate/hooks/useDealAnalysis.ts
// Hook for deal analysis calculations

import { useMemo } from 'react';
import { Property } from '../types';
import { IBuyingCriteria } from '../types/store';

export interface DealMetrics {
  // Purchase Analysis
  purchasePrice: number;
  repairCost: number;
  closingCosts: number;
  holdingCosts: number;
  totalInvestment: number;

  // Flip Analysis
  arv: number;
  grossProfit: number;
  netProfit: number;
  roi: number;
  mao: number; // Maximum Allowable Offer (70% rule)

  // Cash Flow Analysis (Rental)
  monthlyRent: number;
  monthlyExpenses: number;
  monthlyMortgage: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  grossRentMultiplier: number;

  // Data availability
  hasFlipData: boolean;
  hasRentalData: boolean;
}

export interface RentalAssumptions {
  monthlyRent: number;
  vacancyRate: number;      // percentage (e.g., 8 = 8%)
  managementFee: number;    // percentage of rent
  maintenanceRate: number;  // percentage of rent
  insuranceAnnual: number;
  propertyTaxAnnual: number;
  hoaMonthly: number;
  // Mortgage assumptions
  loanAmount: number;
  interestRate: number;     // annual rate (e.g., 7 = 7%)
  loanTermYears: number;
}

export const DEFAULT_RENTAL_ASSUMPTIONS: RentalAssumptions = {
  monthlyRent: 0,
  vacancyRate: 8,
  managementFee: 10,
  maintenanceRate: 5,
  insuranceAnnual: 1200,
  propertyTaxAnnual: 3000,
  hoaMonthly: 0,
  loanAmount: 0,
  interestRate: 7,
  loanTermYears: 30,
};

/**
 * Default values for flip analysis calculations
 * These can be overridden by passing buyingCriteria
 */
export const DEFAULT_FLIP_CONSTANTS = {
  closingCostsPct: 0.03,      // 3% of purchase price
  holdingCostsPct: 0.02,      // 2% of purchase price (or can use holdingMonths * monthlyHoldingCost)
  sellingCostsPct: 0.08,      // 8% of ARV (includes agent commission)
  maoRulePct: 0.70,           // 70% rule for Maximum Allowable Offer
};

/**
 * Calculate monthly mortgage payment (P&I)
 */
function calculateMonthlyMortgage(
  loanAmount: number,
  annualRate: number,
  termYears: number
): number {
  if (loanAmount <= 0 || annualRate <= 0 || termYears <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  const payment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Hook for comprehensive deal analysis calculations
 *
 * @param property - The property to analyze
 * @param rentalAssumptions - Optional rental assumptions for cash flow analysis
 * @param buyingCriteria - Optional buying criteria from user settings (overrides default percentages)
 */
export function useDealAnalysis(
  property: Property | undefined,
  rentalAssumptions?: Partial<RentalAssumptions>,
  buyingCriteria?: Partial<IBuyingCriteria>
): DealMetrics {
  return useMemo(() => {
    // Merge default assumptions with provided ones
    const assumptions: RentalAssumptions = {
      ...DEFAULT_RENTAL_ASSUMPTIONS,
      ...rentalAssumptions,
    };

    // Basic property values (handle undefined property)
    const purchasePrice = property?.purchase_price || 0;
    const repairCost = property?.repair_cost || 0;
    const arv = property?.arv || 0;

    // Calculate percentages from buyingCriteria (with defaults)
    // Note: buyingCriteria percentages are stored as whole numbers (e.g., 3 = 3%)
    // so we divide by 100 for calculations
    const closingCostsPct = buyingCriteria?.closingExpensesPct != null
      ? buyingCriteria.closingExpensesPct / 100
      : DEFAULT_FLIP_CONSTANTS.closingCostsPct;

    // Holding costs can be calculated from holdingMonths * monthlyHoldingCost
    // or use a percentage of purchase price as fallback
    const holdingCosts = buyingCriteria?.holdingMonths && buyingCriteria?.monthlyHoldingCost
      ? buyingCriteria.holdingMonths * buyingCriteria.monthlyHoldingCost
      : purchasePrice * DEFAULT_FLIP_CONSTANTS.holdingCostsPct;

    const sellingCostsPct = buyingCriteria?.sellingCommissionPct != null
      ? buyingCriteria.sellingCommissionPct / 100
      : DEFAULT_FLIP_CONSTANTS.sellingCostsPct;

    // MAO rule percentage - derived from (1 - yourProfitPct - sellingCommissionPct)
    // Default is 70% (i.e., 100% - 22% profit - 8% commission = 70%)
    const maoRulePct = buyingCriteria?.yourProfitPct != null
      ? 1 - (buyingCriteria.yourProfitPct / 100) - sellingCostsPct
      : DEFAULT_FLIP_CONSTANTS.maoRulePct;

    // Calculate costs
    const closingCosts = purchasePrice * closingCostsPct;

    // Total investment
    const totalInvestment = purchasePrice + repairCost + closingCosts + holdingCosts;

    // === FLIP ANALYSIS ===
    const sellingCosts = arv * sellingCostsPct;
    const grossProfit = arv - totalInvestment;
    const netProfit = arv - totalInvestment - sellingCosts;
    const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    // MAO (Maximum Allowable Offer) using configured rule percentage
    const mao = arv > 0 ? arv * maoRulePct - repairCost : 0;

    // === RENTAL ANALYSIS ===
    const monthlyRent = assumptions.monthlyRent || 0;

    // Calculate monthly expenses
    const vacancyLoss = monthlyRent * (assumptions.vacancyRate / 100);
    const managementFee = monthlyRent * (assumptions.managementFee / 100);
    const maintenance = monthlyRent * (assumptions.maintenanceRate / 100);
    const insuranceMonthly = assumptions.insuranceAnnual / 12;
    const propertyTaxMonthly = assumptions.propertyTaxAnnual / 12;
    const hoa = assumptions.hoaMonthly;

    const monthlyExpenses =
      vacancyLoss +
      managementFee +
      maintenance +
      insuranceMonthly +
      propertyTaxMonthly +
      hoa;

    // Mortgage payment
    const loanAmount = assumptions.loanAmount || (purchasePrice * 0.8); // Default 80% LTV
    const monthlyMortgage = calculateMonthlyMortgage(
      loanAmount,
      assumptions.interestRate,
      assumptions.loanTermYears
    );

    // Cash flow
    const monthlyCashFlow = monthlyRent - monthlyExpenses - monthlyMortgage;
    const annualCashFlow = monthlyCashFlow * 12;

    // Cash-on-cash return (based on down payment + closing costs)
    const cashInvested = purchasePrice - loanAmount + closingCosts + repairCost;
    const cashOnCashReturn = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;

    // Cap Rate (NOI / Property Value)
    const noi = (monthlyRent - monthlyExpenses) * 12;
    const propertyValue = arv > 0 ? arv : purchasePrice + repairCost;
    const capRate = propertyValue > 0 ? (noi / propertyValue) * 100 : 0;

    // Gross Rent Multiplier
    const grossRentMultiplier = monthlyRent > 0 ? propertyValue / (monthlyRent * 12) : 0;

    // Data availability flags
    const hasFlipData = purchasePrice > 0 || arv > 0;
    const hasRentalData = monthlyRent > 0;

    return {
      purchasePrice,
      repairCost,
      closingCosts: Math.round(closingCosts),
      holdingCosts: Math.round(holdingCosts),
      totalInvestment: Math.round(totalInvestment),
      arv,
      grossProfit: Math.round(grossProfit),
      netProfit: Math.round(netProfit),
      roi: Math.round(roi * 100) / 100,
      mao: Math.round(mao),
      monthlyRent,
      monthlyExpenses: Math.round(monthlyExpenses),
      monthlyMortgage: Math.round(monthlyMortgage),
      monthlyCashFlow: Math.round(monthlyCashFlow),
      annualCashFlow: Math.round(annualCashFlow),
      cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
      capRate: Math.round(capRate * 100) / 100,
      grossRentMultiplier: Math.round(grossRentMultiplier * 100) / 100,
      hasFlipData,
      hasRentalData,
    };
    // Using JSON.stringify for objects to ensure stable dependency comparison
    // since objects are compared by reference and would cause unnecessary recalculations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property, JSON.stringify(rentalAssumptions), JSON.stringify(buyingCriteria)]);
}
