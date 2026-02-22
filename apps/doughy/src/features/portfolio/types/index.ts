// src/features/portfolio/types/index.ts
// Portfolio-related types

import { Property } from '@/features/real-estate/types';

export interface PortfolioProperty extends Property {
  purchase_price?: number;
  acquisition_date?: string;
  current_value?: number;
  equity?: number;
  monthly_rent?: number;
  monthly_expenses?: number;
  monthly_cash_flow?: number;
  cap_rate?: number;
  deal_id?: string;
  group_id?: string;
  portfolio_entry_id?: string;
}

export interface PortfolioSummary {
  totalProperties: number;
  totalValue: number;
  totalEquity: number;
  monthlyCashFlow: number;
  averageCapRate?: number;
}

export interface PortfolioValuation {
  id: string;
  property_id: string;
  estimated_value: number;
  valuation_date: string;
  source?: string;
  notes?: string;
}

/**
 * Portfolio entry record - represents a property in the user's portfolio
 */
export interface PortfolioEntry {
  id: string;
  user_id: string;
  property_id: string;
  acquisition_date: string;
  acquisition_source: 'deal' | 'manual' | 'import';
  acquisition_price: number;
  deal_id?: string | null;
  group_id?: string | null;
  monthly_rent: number;
  monthly_expenses: number;
  projected_monthly_rent?: number;
  projected_monthly_expenses?: number;
  property_manager_name?: string;
  property_manager_phone?: string;
  ownership_percent?: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Input for adding a property to portfolio
 */
export interface AddToPortfolioInput {
  property_id?: string;
  acquisition_date: string;
  acquisition_price: number;
  monthly_rent?: number;
  monthly_expenses?: number;
  notes?: string;
  newProperty?: {
    address: string;
    city: string;
    state: string;
    zip: string;
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    year_built?: number;
    purchase_price?: number;
  };
}

/**
 * Form state for adding to portfolio
 */
export interface AddToPortfolioFormState {
  mode: 'existing' | 'new';
  property_id: string;
  acquisition_date: string;
  acquisition_price: string;
  monthly_rent: string;
  monthly_expenses: string;
  notes: string;
  // New property fields
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  year_built: string;
}

// ============================================
// Property Groups
// ============================================

/**
 * Property group for organizing portfolio
 */
export interface PortfolioGroup {
  id: string;
  user_id: string;
  name: string;
  color?: string | null;
  sort_order: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PortfolioGroupWithStats extends PortfolioGroup {
  propertyCount: number;
  totalValue: number;
  monthlyCashFlow: number;
}

export interface CreateGroupInput {
  name: string;
  color?: string;
}

export interface UpdateGroupInput {
  id: string;
  name?: string;
  color?: string;
  sort_order?: number;
}

// ============================================
// Monthly Financial Records
// ============================================

/**
 * Expense breakdown for monthly records
 */
export interface PortfolioExpenseBreakdown {
  mortgage_piti?: number;
  property_tax?: number;
  insurance?: number;
  hoa?: number;
  repairs?: number;
  utilities?: number;
  property_management?: number;
  other?: number;
  total: number;
}

/**
 * Monthly financial record
 */
export interface PortfolioMonthlyRecord {
  id: string;
  portfolio_entry_id: string;
  month: string; // YYYY-MM-DD (first of month)
  rent_collected: number;
  expenses: PortfolioExpenseBreakdown;
  occupancy_status: 'occupied' | 'vacant' | 'partial';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyRecordInput {
  portfolio_entry_id: string;
  month: string;
  rent_collected: number;
  expenses: Partial<PortfolioExpenseBreakdown>;
  occupancy_status: 'occupied' | 'vacant' | 'partial';
  notes?: string;
}

// ============================================
// Mortgage/Debt Tracking
// ============================================

export type LoanType = 'conventional' | 'fha' | 'va' | 'seller_finance' | 'hard_money' | 'heloc' | 'other';

/**
 * Mortgage/debt tracking
 */
export interface PortfolioMortgage {
  id: string;
  portfolio_entry_id: string;
  lender_name?: string;
  loan_type: LoanType;
  original_balance: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  maturity_date?: string;
  term_months?: number;
  is_primary: boolean;
  escrow_amount?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MortgageInput {
  portfolio_entry_id: string;
  lender_name?: string;
  loan_type: LoanType;
  original_balance: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  maturity_date?: string;
  term_months?: number;
  is_primary?: boolean;
  escrow_amount?: number;
  notes?: string;
}

// ============================================
// Amortization
// ============================================

/**
 * Single entry in amortization schedule
 */
export interface AmortizationEntry {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalPrincipal: number;
  totalInterest: number;
}

/**
 * Full amortization schedule with summary
 */
export interface AmortizationSchedule {
  entries: AmortizationEntry[];
  summary: {
    totalPayments: number;
    totalPrincipal: number;
    totalInterest: number;
    payoffDate: string;
    originalBalance: number;
    interestRate: number;
    monthlyPayment: number;
    termMonths: number;
  };
}

/**
 * Extra payment scenario result
 */
export interface ExtraPaymentScenario {
  extraMonthlyAmount: number;
  newPayoffDate: string;
  monthsSaved: number;
  interestSaved: number;
  totalInterestWithExtra: number;
}

// ============================================
// Performance Metrics
// ============================================

/**
 * Performance metrics for a portfolio property
 */
export interface PortfolioPropertyPerformance {
  property_id: string;
  portfolio_entry_id: string;

  // Cash flow metrics
  total_cash_flow: number;
  total_rent_collected: number;
  total_expenses: number;
  average_monthly_cash_flow: number;

  // Historical data
  cash_flow_history: Array<{ month: string; amount: number; rent: number; expenses: number }>;
  equity_history: Array<{ date: string; equity: number; mortgage: number; value: number }>;

  // Return metrics
  cash_on_cash_return: number;
  cap_rate: number;
  total_roi: number;
  annualized_return: number;

  // Current snapshot
  current_equity: number;
  current_mortgage_balance: number;
  current_value: number;

  // Projections
  projected_equity_5yr: number;
  projected_equity_10yr: number;
  projected_value_5yr: number;
  projected_value_10yr: number;

  // Ownership duration
  months_owned: number;
  acquisition_date: string;
}

/**
 * Benchmark comparison data
 */
export interface PortfolioBenchmark {
  sp500_annual_return: number;
  portfolio_average_cash_flow: number;
  portfolio_average_cap_rate: number;
  comparison_period_months: number;
}

// ============================================
// Portfolio Property Detail
// ============================================

/**
 * Full portfolio property detail with all related data
 */
export interface PortfolioPropertyDetail {
  entry: PortfolioEntry;
  property: PortfolioProperty;
  mortgages: PortfolioMortgage[];
  monthlyRecords: PortfolioMonthlyRecord[];
  valuations: PortfolioValuation[];
  performance: PortfolioPropertyPerformance;
  group?: PortfolioGroup;
}

// ============================================
// Documents
// ============================================

export type PortfolioDocumentCategory =
  | 'insurance'
  | 'lease'
  | 'title_deed'
  | 'tax_records'
  | 'mortgage'
  | 'inspection'
  | 'repair_receipts'
  | 'other';

export interface PortfolioDocument {
  id: string;
  portfolio_entry_id: string;
  filename: string;
  url: string;
  category: PortfolioDocumentCategory;
  description?: string;
  uploaded_at: string;
}
