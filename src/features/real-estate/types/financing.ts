// src/features/real-estate/types/financing.ts
// Financing-related types

export interface FinancingScenario {
  id: string;
  name: string;
  description: string;
  pros_cons: string;
  scenario_type: string;
  property_id: string;
  created_at: string;
  updated_at: string;
  input_json?: any;
  result_json?: any;
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
