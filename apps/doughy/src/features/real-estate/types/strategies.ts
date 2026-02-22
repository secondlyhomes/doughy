// src/features/real-estate/types/strategies.ts

/**
 * Risk level for exit strategies
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'very-high';

/**
 * Common interface for all exit strategy summaries
 */
export interface ExitStrategySummary {
  id: string;
  name: string;
  netProfit: number;
  profitPercentage: number;
  cashRequired: number;
  riskScore: RiskLevel;
  propertyId: string;
  leadId?: string;
  maximumPurchasePrice: number;
  timeFrame: string; // e.g., "3-6 months"
  description: string;
}

/**
 * Outright Sale strategy specific data
 */
export interface OutrightSaleSummary extends ExitStrategySummary {
  type: 'outright-sale';
  repairs: number;
  holdingCosts: number;
  sellingCommission: number;
}

/**
 * Wholesale strategy specific data
 */
export interface WholesaleSummary extends ExitStrategySummary {
  type: 'wholesale';
  assignmentFee: number;
  buyerProfitAmount: number;
}

/**
 * Seller Financing strategy specific data
 */
export interface SellerFinancingSummary extends ExitStrategySummary {
  type: 'seller-financing';
  interestRate: number;
  loanAmount: number;
  monthlyPayment: number;
  loanTermYears: number;
}

/**
 * Lease Option strategy specific data
 */
export interface LeaseOptionSummary extends ExitStrategySummary {
  type: 'lease-option';
  optionFee: number;
  monthlyRent: number;
  optionPeriodMonths: number;
  monthlyCashflow: number;
}

/**
 * Union type for all strategy summaries
 */
export type StrategySummary =
  | OutrightSaleSummary
  | WholesaleSummary
  | SellerFinancingSummary
  | LeaseOptionSummary;

/**
 * Strategy type identifiers
 */
export type StrategyType = StrategySummary['type'];

/**
 * Strategy name mapping
 */
export const STRATEGY_NAMES: Record<StrategyType, string> = {
  'outright-sale': 'Outright Sale',
  'wholesale': 'Wholesale',
  'seller-financing': 'Seller Financing',
  'lease-option': 'Lease Option'
};

/**
 * Strategy path mapping for navigation
 */
export const STRATEGY_PATHS: Record<StrategyType, string> = {
  'outright-sale': 'outright-sale',
  'wholesale': 'wholesale',
  'seller-financing': 'seller-financing',
  'lease-option': 'lease-option'
};

/**
 * Risk display configuration
 */
export const RISK_CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  'low': { label: 'Low Risk', color: 'bg-success' },
  'medium': { label: 'Medium Risk', color: 'bg-warning' },
  'high': { label: 'High Risk', color: 'bg-warning' },
  'very-high': { label: 'Very High Risk', color: 'bg-destructive' }
};
