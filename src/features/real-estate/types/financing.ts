// src/features/real-estate/types/financing.ts
// Financing-related types

export interface FinancingScenario {
  id: string;
  name: string;
  // Made nullable to match database types
  description?: string | null;
  pros_cons?: string | null;
  scenario_type?: string | null;
  property_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  workspace_id?: string | null;
  is_primary?: boolean | null;
  input_json?: ScenarioDetails | null;
  result_json?: Record<string, unknown> | null;
  // For compatibility with hooks
  details?: ScenarioDetails;
}

export interface ScenarioDetails {
  purchasePrice: number | null;
  loanAmount: number | null;
  interestRate: number | null;
  // Add all potential fields used in scenarios to prevent TypeScript errors
  downPayment?: number | null;
  loanTerm?: number | null;
  monthlyPayment?: number | null;
  currentMortgageBalance?: number | null;
  currentInterestRate?: number | null;
  currentMonthlyPayment?: number | null;
  term?: number | null;
  sellerIncentive?: number | null;
  remainingYears?: number | null;
  balloonPayment?: number | null;
  monthlyRent?: number | null;
  repairs?: number | null;
  holdingCosts?: number | null;
  closingCosts?: number | null;
  miscCosts?: number | null;
  investorDiscount?: number | null;
  wholesaleFee?: number | null;
  optionPrice?: number | null;
  optionFee?: number | null;
  leaseTerm?: number | null;
  [key: string]: number | null | undefined;
}
