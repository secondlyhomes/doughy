// src/features/real-estate/types/analysis.ts
// Property analysis types

export interface PropertyAnalysis {
  id: string;
  property_id: string;
  name?: string;
  analysis_type?: string;
  input_json: any;
  result_json: any;
  created_at?: string;
}

export interface ExitAnalysisBaseProps {
  propertyValue?: number;
  loanBalance?: number;
  onPropertyValueChange?: (value: number) => void;
  interestRate?: number;
  onInterestRateChange?: (value: number) => void;
  buyingCriteria?: {
    yourProfit: number;
    sellingCommission: number;
    holdingCostsMonths: number;
    buyerCredit: number;
    closingExpenses: number;
    buyersProfit: number;
    maxInterestRate: number;
  };
}

export interface ExitAnalysisCommonState {
  propertyARV: number;
  profitPercentage: number;
  profitAmount: number;
  holdingCostsMonthly?: number;
  holdingCostsTotalMonths?: number;
  holdingCostsTotal?: number;
  closingExpenses: number;
  repairs: number;
  miscellaneousCosts?: number;
  maximumPurchasePrice: number;
  loanBalance: number;
  finalDecision: "proceed" | "needs_partner" | "no_deal";
}
