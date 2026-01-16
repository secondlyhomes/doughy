// src/features/deals/hooks/useCreativeFinance.ts
// Hooks for creative finance calculations and analysis

import { useMemo, useCallback } from 'react';
import type { Deal, DealStrategy, OfferTerms } from '../types';

// ============================================
// Types
// ============================================

export interface SellerFinanceTerms {
  purchasePrice: number;
  downPayment: number;
  interestRate: number; // Annual rate as decimal (e.g., 0.06 for 6%)
  termYears: number;
  balloonPayment?: number;
  balloonDueYears?: number;
}

export interface SellerFinanceAnalysis {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  loanAmount: number;
  downPaymentPercent: number;
  effectiveRate: number;
  balloonAmount?: number;
  amortizationSchedule?: AmortizationEntry[];
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface SubjectToTerms {
  existingLoanBalance: number;
  existingMonthlyPayment: number;
  existingInterestRate: number;
  existingYearsRemaining: number;
  catchUpAmount?: number;
  sellerCarryBack?: number;
}

export interface SubjectToAnalysis {
  totalAcquisitionCost: number;
  monthlyPayment: number;
  remainingLoanTerm: number;
  equityAtClose: number;
  principalPaydownYear1: number;
  totalInterestRemaining: number;
}

export interface OfferComparison {
  strategy: DealStrategy;
  label: string;
  totalCost: number;
  monthlyPayment: number;
  cashAtClose: number;
  roi?: number;
  sellerNet: number;
  pros: string[];
  cons: string[];
}

// ============================================
// Seller Finance Calculations
// ============================================

/**
 * Calculate monthly payment for seller-financed deal
 * Uses standard amortization formula: M = P[i(1+i)^n]/[(1+i)^n-1]
 */
export function calculateSellerFinancePayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRate <= 0) return principal / (termYears * 12);

  const monthlyRate = annualRate / 12;
  const numPayments = termYears * 12;
  const factor = Math.pow(1 + monthlyRate, numPayments);

  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Generate full amortization schedule
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  balloonDueYears?: number
): AmortizationEntry[] {
  const schedule: AmortizationEntry[] = [];
  const monthlyRate = annualRate / 12;
  const monthlyPayment = calculateSellerFinancePayment(principal, annualRate, termYears);
  const balloonMonth = balloonDueYears ? balloonDueYears * 12 : undefined;

  let balance = principal;

  for (let month = 1; month <= termYears * 12 && balance > 0; month++) {
    const interest = balance * monthlyRate;
    const principalPortion = monthlyPayment - interest;
    balance = Math.max(0, balance - principalPortion);

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPortion,
      interest,
      balance,
    });

    // Check for balloon payment
    if (balloonMonth && month === balloonMonth) {
      break;
    }
  }

  return schedule;
}

/**
 * Analyze seller finance terms
 */
export function analyzeSellerFinance(terms: SellerFinanceTerms): SellerFinanceAnalysis {
  const loanAmount = terms.purchasePrice - terms.downPayment;
  const monthlyPayment = calculateSellerFinancePayment(
    loanAmount,
    terms.interestRate,
    terms.termYears
  );

  const effectiveTermYears = terms.balloonDueYears || terms.termYears;
  const totalPayments = monthlyPayment * effectiveTermYears * 12;

  const schedule = generateAmortizationSchedule(
    loanAmount,
    terms.interestRate,
    terms.termYears,
    terms.balloonDueYears
  );

  const totalInterest = schedule.reduce((sum, entry) => sum + entry.interest, 0);
  const balloonAmount = terms.balloonDueYears
    ? schedule[schedule.length - 1]?.balance || 0
    : undefined;

  return {
    monthlyPayment,
    totalPayments: totalPayments + terms.downPayment + (balloonAmount || 0),
    totalInterest,
    loanAmount,
    downPaymentPercent: (terms.downPayment / terms.purchasePrice) * 100,
    effectiveRate: terms.interestRate,
    balloonAmount,
    amortizationSchedule: schedule,
  };
}

// ============================================
// Subject-To Calculations
// ============================================

/**
 * Analyze subject-to acquisition
 */
export function analyzeSubjectTo(
  terms: SubjectToTerms,
  purchasePrice: number,
  arv: number
): SubjectToAnalysis {
  const equityAtClose = arv - terms.existingLoanBalance;
  const totalAcquisitionCost = (terms.catchUpAmount || 0) + (terms.sellerCarryBack || 0);

  // Calculate principal paydown in year 1
  const monthlyRate = terms.existingInterestRate / 12;
  let balance = terms.existingLoanBalance;
  let principalPaydown = 0;

  for (let month = 1; month <= 12; month++) {
    const interest = balance * monthlyRate;
    const principal = terms.existingMonthlyPayment - interest;
    principalPaydown += principal;
    balance -= principal;
  }

  // Calculate total interest remaining
  const totalPaymentsRemaining = terms.existingMonthlyPayment * terms.existingYearsRemaining * 12;
  const totalInterestRemaining = totalPaymentsRemaining - terms.existingLoanBalance;

  return {
    totalAcquisitionCost,
    monthlyPayment: terms.existingMonthlyPayment,
    remainingLoanTerm: terms.existingYearsRemaining,
    equityAtClose,
    principalPaydownYear1: principalPaydown,
    totalInterestRemaining,
  };
}

// ============================================
// Hook: useSellerFinanceCalculator
// ============================================

/**
 * Hook for seller finance calculations
 */
export function useSellerFinanceCalculator() {
  const calculate = useCallback((terms: SellerFinanceTerms) => {
    return analyzeSellerFinance(terms);
  }, []);

  const calculatePayment = useCallback(
    (principal: number, rate: number, years: number) => {
      return calculateSellerFinancePayment(principal, rate, years);
    },
    []
  );

  const getAmortization = useCallback(
    (principal: number, rate: number, years: number, balloonYears?: number) => {
      return generateAmortizationSchedule(principal, rate, years, balloonYears);
    },
    []
  );

  return {
    calculate,
    calculatePayment,
    getAmortization,
  };
}

// ============================================
// Hook: useOfferComparison
// ============================================

interface OfferComparisonInput {
  arv: number;
  repairCost: number;
  askingPrice: number;
  cashOffer?: number;
  sellerFinanceTerms?: SellerFinanceTerms;
  subjectToTerms?: SubjectToTerms;
}

/**
 * Hook for comparing multiple offer strategies
 */
export function useOfferComparison(input: OfferComparisonInput) {
  const comparison = useMemo((): OfferComparison[] => {
    const results: OfferComparison[] = [];
    const { arv, repairCost, askingPrice, cashOffer, sellerFinanceTerms, subjectToTerms } = input;

    // Cash offer analysis
    if (cashOffer !== undefined) {
      const sellerNet = cashOffer;
      const roi = arv > 0 ? ((arv - cashOffer - repairCost) / (cashOffer + repairCost)) * 100 : 0;

      results.push({
        strategy: 'cash',
        label: 'Cash Offer',
        totalCost: cashOffer + repairCost,
        monthlyPayment: 0,
        cashAtClose: cashOffer,
        roi,
        sellerNet,
        pros: [
          'Quick close (7-14 days)',
          'Simple transaction',
          'No financing contingencies',
          'Attractive to motivated sellers',
        ],
        cons: [
          'Requires significant capital',
          'Ties up cash reserves',
          'Lower total profit than creative strategies',
        ],
      });
    }

    // Seller finance analysis
    if (sellerFinanceTerms) {
      const analysis = analyzeSellerFinance(sellerFinanceTerms);

      results.push({
        strategy: 'seller_finance',
        label: 'Seller Finance',
        totalCost: analysis.totalPayments + repairCost,
        monthlyPayment: analysis.monthlyPayment,
        cashAtClose: sellerFinanceTerms.downPayment,
        roi: arv > 0 ? ((arv - analysis.totalPayments - repairCost) / analysis.totalPayments) * 100 : 0,
        sellerNet: sellerFinanceTerms.purchasePrice,
        pros: [
          'Lower cash at close',
          'Higher seller price possible',
          'Builds relationships',
          'Flexible terms',
        ],
        cons: [
          'Longer negotiation',
          'Seller must agree to terms',
          'Monthly payment obligations',
          'Potential balloon risk',
        ],
      });
    }

    // Subject-to analysis
    if (subjectToTerms) {
      const analysis = analyzeSubjectTo(subjectToTerms, askingPrice, arv);

      results.push({
        strategy: 'subject_to',
        label: 'Subject-To',
        totalCost: analysis.totalAcquisitionCost + repairCost,
        monthlyPayment: analysis.monthlyPayment,
        cashAtClose: analysis.totalAcquisitionCost,
        roi: arv > 0 ? ((arv - subjectToTerms.existingLoanBalance - repairCost) / analysis.totalAcquisitionCost) * 100 : 0,
        sellerNet: askingPrice - subjectToTerms.existingLoanBalance,
        pros: [
          'Lowest cash at close',
          'Take over favorable financing',
          'Quick acquisition possible',
          'Build equity through paydown',
        ],
        cons: [
          'Due-on-sale clause risk',
          'Requires distressed seller',
          'Complex legal structure',
          'Must keep payments current',
        ],
      });
    }

    // Sort by ROI
    return results.sort((a, b) => (b.roi || 0) - (a.roi || 0));
  }, [input]);

  const bestStrategy = useMemo(() => {
    return comparison[0] || null;
  }, [comparison]);

  return {
    comparison,
    bestStrategy,
  };
}

// ============================================
// Hook: useMAOCalculator
// ============================================

interface MAOInput {
  arv: number;
  repairCost: number;
  targetProfit?: number; // As decimal (e.g., 0.15 for 15%)
  holdingCosts?: number;
  closingCosts?: number;
  wholesaleFee?: number;
}

/**
 * Hook for Maximum Allowable Offer calculation
 */
export function useMAOCalculator(input: MAOInput) {
  const mao = useMemo(() => {
    const {
      arv,
      repairCost,
      targetProfit = 0.15,
      holdingCosts = 0,
      closingCosts = 0,
      wholesaleFee = 0,
    } = input;

    if (arv <= 0) return 0;

    // Standard MAO formula: ARV × (1 - profit%) - repairs - costs
    const profitMargin = arv * targetProfit;
    const totalCosts = repairCost + holdingCosts + closingCosts + wholesaleFee;

    return Math.max(0, arv - profitMargin - totalCosts);
  }, [input]);

  const atPercent = useCallback(
    (arvPercent: number) => {
      return input.arv * (arvPercent / 100) - input.repairCost;
    },
    [input.arv, input.repairCost]
  );

  return {
    mao,
    atPercent,
    seventyPercent: atPercent(70),
    sixtyFivePercent: atPercent(65),
  };
}
