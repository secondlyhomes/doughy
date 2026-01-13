// src/features/real-estate/types/store.ts
// Types specific to the property store

export interface IPropertyBasicInfo {
  id: string;
  address: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city: string;
  state: string;
  zip: string;
  county?: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  sqft?: number | null;
  lot_size?: number | null;
  year_built?: number | null;
  propertyType: string | null;
  property_type?: string | null;
  owner_occupied?: boolean | null;
  notes?: string | null;
  geo_point?: unknown;
  arv?: number | null;
  purchase_price?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface IPropertyRepairItem {
  id: string;
  property_id: string;
  category: string;
  item_name: string;
  description?: string;
  cost: number;
  status: 'needed' | 'completed' | 'not_needed';
  notes?: string;
  is_custom: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IPropertyDebtItem {
  id: string;
  property_id: string;
  debt_type: 'mortgage' | 'heloc' | 'line_of_credit' | 'other';
  lender: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number;
  term_months: number;
  is_primary: boolean;
  start_date?: string;
  maturity_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IPropertyFinancials {
  id?: string;
  property_id: string;
  purchase_price?: number | null;
  arv?: number | null;
  monthly_rent?: number | null;
  vacancy_rate?: number | null;
  property_tax?: number | null;
  insurance?: number | null;
  property_management?: number | null;
  maintenance?: number | null;
  utilities?: number | null;
  hoa?: number | null;
  other_expenses?: number | null;
  capex_reserve?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface IBuyingCriteria {
  id?: string;
  user_id: string;
  yourProfitPct: number;
  sellingCommissionPct: number;
  buyerCreditPct: number;
  closingExpensesPct: number;
  holdingMonths: number;
  buyersProfitPct: number;
  maxInterestRate: number;
  monthlyHoldingCost: number;
  miscContingencyPct: number;
  minCapRatePct: number;
  minCoCPct: number;
  maxLTVPct: number;
}

export interface IProperty extends IPropertyBasicInfo {
  repairs?: IPropertyRepairItem[];
  debt?: IPropertyDebtItem[];
  financials?: IPropertyFinancials;
  status?: string;
  mortgage_balance?: number;
}

export interface KeyPropertyValues {
  propertyValue: number;
  purchasePrice: number;
  repairsTotal: number;
  monthlyRent: number;
  expenses: {
    propertyTax: number;
    insurance: number;
    maintenance: number;
    utilities: number;
    management: number;
    vacancy: number;
    capex: number;
    hoa: number;
  };
  debt: {
    loanAmount: number;
    interestRate: number;
    termYears: number;
    monthlyPayment: number;
  };
  [key: string]: unknown;
}

// Property event types
export const PROPERTY_EVENTS = {
  DATA_REFRESHED: 'property-data-refreshed',
  DATA_UPDATED: 'property-data-updated',
  VALUE_CHANGED: 'property-value-changed',
  VALUES_SYNC: 'property-values-sync',
  SAVE_COMPLETE: 'property-save-complete',
} as const;
