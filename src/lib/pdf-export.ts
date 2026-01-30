// src/lib/pdf-export.ts
// DEPRECATED: This file re-exports from pdf-export/ for backward compatibility
// Import directly from '@/lib/pdf-export' for new code

export {
  exportAmortizationToPDF,
  exportDealAnalysisToPDF,
  exportHTMLToPDF,
} from './pdf-export';

export type {
  DealInfo,
  LoanInfo,
  ExportResult,
} from './pdf-export';
