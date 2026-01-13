// src/features/real-estate/hooks/useDealAnalysis.ts
// Hook for deal analysis calculations

import { useMemo } from 'react';
import { Property } from '../types';

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
 */
export function useDealAnalysis(
  property: Property,
  rentalAssumptions?: Partial<RentalAssumptions>
): DealMetrics {
  return useMemo(() => {
    // Merge default assumptions with provided ones
    const assumptions: RentalAssumptions = {
      ...DEFAULT_RENTAL_ASSUMPTIONS,
      ...rentalAssumptions,
    };

    // Basic property values
    const purchasePrice = property.purchase_price || 0;
    const repairCost = property.repair_cost || 0;
    const arv = property.arv || 0;

    // Estimate closing/holding costs (typically ~3% of purchase price)
    const closingCosts = purchasePrice * 0.03;
    const holdingCosts = purchasePrice * 0.02; // ~2% for holding during rehab

    // Total investment
    const totalInvestment = purchasePrice + repairCost + closingCosts + holdingCosts;

    // === FLIP ANALYSIS ===
    // Selling costs (typically ~8% for agent fees + closing)
    const sellingCosts = arv * 0.08;
    const grossProfit = arv - totalInvestment;
    const netProfit = arv - totalInvestment - sellingCosts;
    const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    // MAO (Maximum Allowable Offer) using 70% rule
    const mao = arv > 0 ? arv * 0.7 - repairCost : 0;

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
  }, [property, rentalAssumptions]);
}
