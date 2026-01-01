// src/features/real-estate/types/debt.ts
// Types for mortgage and debt information

export interface PropertyMortgage {
  id: string;
  property_id: string;
  mortgage_name: string;       // "First Mortgage", "Second Mortgage", etc.
  loan_amount: number;         // Principal loan amount
  monthly_payment: number;     // Regular payment amount
  arrears: number;             // Past due amount
  interest_rate?: number;      // Interest rate (e.g., 4.25%)
  term_years?: number;         // Loan term in years (e.g., 30)
  start_date?: string;         // When the loan began
  lender_name?: string;        // Name of the lender
  loan_type?: string;          // "Conventional", "FHA", "VA", etc.
  is_active: boolean;          // Whether this is an active loan
  notes?: string;              // Additional notes
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  workspace_id?: string;
}

export interface PropertyDebt {
  id: string;
  property_id: string;
  additional_liens: number;    // Value of any additional liens
  repair_estimate: number;     // Total repair costs (can be synced with repairs)
  estimated_arv: number;       // After repair value (can be synced with property ARV)
  total_assessed_value: number; // Current assessed value for taxes
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  workspace_id?: string;
}

// Combined interface for comprehensive property debt info
export interface PropertyDebtInfo {
  debt?: PropertyDebt;
  mortgages: PropertyMortgage[];
}

// Input types for creating new debt records
export interface PropertyMortgageInput {
  property_id: string;
  mortgage_name: string;
  loan_amount?: number;
  monthly_payment?: number;
  arrears?: number;
  interest_rate?: number;
  term_years?: number;
  start_date?: string;
  lender_name?: string;
  loan_type?: string;
  is_active?: boolean;
  notes?: string;
  workspace_id: string;
}

export interface PropertyDebtInput {
  property_id: string;
  additional_liens?: number;
  repair_estimate?: number;
  estimated_arv?: number;
  total_assessed_value?: number;
  notes?: string;
  workspace_id: string;
}

// Helper function to calculate total debt
export const calculateTotalDebt = (debt: PropertyDebt | null, mortgages: PropertyMortgage[]): number => {
  let total = 0;

  // Add mortgage amounts and arrears
  mortgages.forEach(mortgage => {
    if (mortgage.loan_amount) {
      total += mortgage.loan_amount;
    }

    if (mortgage.arrears) {
      total += mortgage.arrears;
    }
  });

  // Add additional liens and repair estimate if debt record exists
  if (debt) {
    if (debt.additional_liens) {
      total += debt.additional_liens;
    }

    if (debt.repair_estimate) {
      total += debt.repair_estimate;
    }
  }

  return total;
};
