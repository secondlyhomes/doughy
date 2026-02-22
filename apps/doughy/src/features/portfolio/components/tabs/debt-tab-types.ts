// src/features/portfolio/components/tabs/debt-tab-types.ts
// Shared types for PortfolioDebtTab sub-components

import type { PortfolioMortgage, AmortizationSchedule, ExtraPaymentScenario } from '../../types';

export interface PrimaryMortgageCardProps {
  primaryMortgage: PortfolioMortgage | undefined;
  payoffProgress: number;
  onEdit: (mortgage: PortfolioMortgage) => void;
  onAdd: () => void;
}

export interface MonthlyPaymentCardProps {
  breakdown: { principal: number; interest: number };
}

export interface AmortizationCardProps {
  amortization: AmortizationSchedule;
  onViewFullSchedule: () => void;
}

export interface PayoffCalculatorCardProps {
  scenarios: ExtraPaymentScenario[];
}

export interface OtherLoansCardProps {
  mortgages: PortfolioMortgage[];
  onEdit: (mortgage: PortfolioMortgage) => void;
  onAdd: () => void;
}

export interface DebtSummaryCardProps {
  totalDebt: number;
  totalMonthlyPayment: number;
}
