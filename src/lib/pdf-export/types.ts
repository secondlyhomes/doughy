// src/lib/pdf-export/types.ts
// Type definitions for PDF export functionality

/**
 * Deal information for PDF export
 */
export interface DealInfo {
  address: string;
  purchasePrice: number;
  afterRepairValue?: number;
  repairCosts?: number;
}

/**
 * Loan information for PDF export
 */
export interface LoanInfo {
  loanAmount: number;
  interestRate: number;
  termYears: number;
  downPayment?: number;
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  uri?: string;
  error?: string;
}
