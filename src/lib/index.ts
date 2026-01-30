// src/lib/index.ts
// Export all library utilities

export { cn } from './utils';
export { supabase, realEstateDB, SUPABASE_URL } from './supabase';

// =============================================================================
// UI Formatting Utilities (shared across features)
// =============================================================================

export {
  formatStatus,
  getStatusBadgeVariant,
  getScoreColor,
  getRatingColor,
  formatCurrency,
  formatRelativeTime,
  formatDateRange,
  formatSquareFeet,
  formatDate,
  formatDateTime,
  // Note: formatPhoneNumber is exported from './twilio' below
  type BadgeVariant,
} from './formatters';

// =============================================================================
// Zone D: Integration Exports
// =============================================================================

// Retry utility
export {
  retryWithBackoff,
  withRetry,
  isNetworkError,
  isRetryableHttpError,
  defaultIsRetryable,
  RetryPresets,
  type RetryOptions,
} from './retry';

// OpenAI client (AI extraction & generation)
export {
  callPublicAssistant,
  callDocsAssistant,
  extractPropertyData,
  extractFromImage,
  generateDocument,
  transcribeAudio,
  type ChatMessage,
  type ExtractedPropertyData,
  type ImageExtractionResult,
  type DocumentType,
  type DocumentTemplateType,
} from './openai';

// Twilio SMS client
export {
  sendSMS,
  sendSMSSimple,
  parseSMSToLead,
  formatPhoneNumber,
  isValidPhoneNumber,
  generateSMSFromTemplate,
  sendTemplatedSMS,
  type SMSConfig,
  type SMSSendResult,
  type SMSTemplateType,
} from './twilio';

// Zillow property data client
export {
  getPropertyValue,
  getPropertyDetails,
  getComps,
  calculateARV,
  searchProperties,
  type ZillowPropertyData,
  type ComparableProperty,
  type CompFilters,
  type PropertyValuation,
} from './zillow';

// Financial calculations
export {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateTotalInterest,
  getLoanSummary,
  calculateRemainingBalance,
  calculateEquity,
  analyzeDeal,
  calculate70PercentRule,
  calculateRentalCashFlow,
  calculateCapRate,
  calculateDSCR,
  type AmortizationEntry,
  type LoanSummary,
  type DealAnalysisInput,
  type DealAnalysisResult,
} from './financial-calculations';

// PDF export
export {
  exportAmortizationToPDF,
  exportDealAnalysisToPDF,
  exportHTMLToPDF,
  type DealInfo,
  type LoanInfo,
  type ExportResult,
} from './pdf-export';
