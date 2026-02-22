// src/features/deals/data/mockSellerReport.ts
// Mock seller report data for development and testing

import {
  DealSellerReport,
  SellerReportOptions,
  WeHandleOptions,
  ReportAssumptions,
} from '../types';

/**
 * Default "We Handle" options
 */
export const defaultWeHandleOptions: WeHandleOptions = {
  cleanout: true,
  closing_costs: true,
  title_search: true,
  outstanding_liens: false,
  repairs: false,
};

/**
 * "We Handle" option display config
 */
export const WE_HANDLE_CONFIG: Record<keyof WeHandleOptions, { label: string; description: string }> = {
  cleanout: {
    label: 'Property Cleanout',
    description: 'We remove any remaining items and debris',
  },
  closing_costs: {
    label: 'Closing Costs',
    description: 'We pay all standard closing costs',
  },
  title_search: {
    label: 'Title Search',
    description: 'We handle title search and insurance',
  },
  outstanding_liens: {
    label: 'Outstanding Liens',
    description: 'We pay off any existing liens on the property',
  },
  repairs: {
    label: 'Minor Repairs',
    description: 'We handle any needed repairs',
  },
};

/**
 * Mock seller report options
 */
export const mockSellerReportOptions: SellerReportOptions = {
  cash: {
    price_low: 155000,
    price_high: 170000,
    close_days_low: 14,
    close_days_high: 30,
  },
  seller_finance: {
    price_low: 180000,
    price_high: 195000,
    monthly_payment: 1195,
    term_years: 20,
    down_payment: 25000,
  },
  subject_to: {
    price_low: 165000,
    price_high: 180000,
    catch_up_amount: 8500,
  },
};

/**
 * Mock report assumptions
 */
export const mockReportAssumptions: ReportAssumptions = {
  arv_estimate: 245000,
  arv_source: 'Comparable sales analysis (3 comps)',
  repair_estimate: 35000,
  repair_source: 'Walkthrough assessment',
  comps_count: 3,
};

/**
 * Complete mock seller report
 */
export const mockSellerReport: DealSellerReport = {
  id: 'report-1',
  deal_id: 'deal-1',
  options_json: mockSellerReportOptions,
  we_handle_json: defaultWeHandleOptions,
  assumptions_json: mockReportAssumptions,
  created_at: '2024-01-20T10:00:00Z',
};

/**
 * Empty seller report for new deals
 */
export const emptySellerReport: DealSellerReport = {
  id: '',
  deal_id: '',
  options_json: {},
  we_handle_json: defaultWeHandleOptions,
  assumptions_json: {
    arv_estimate: 0,
    arv_source: '',
    repair_estimate: 0,
    repair_source: '',
    comps_count: 0,
  },
  created_at: new Date().toISOString(),
};

/**
 * Generate share message template
 */
export const generateShareMessage = (
  sellerName: string,
  propertyAddress: string,
  shareLink: string
): string => {
  return `Hi ${sellerName},

As promised, here's the personalized options report for your property at ${propertyAddress}.

View your report here: ${shareLink}

This report outlines several options we discussed, including cash offers and creative financing solutions. Each option is designed to meet your specific needs and timeline.

Please review at your convenience and let me know if you have any questions.

Best regards`;
};

/**
 * Generate email share template
 */
export const generateShareEmail = (
  sellerName: string,
  propertyAddress: string,
  shareLink: string
): string => {
  return `Subject: Your Property Options Report - ${propertyAddress}

Dear ${sellerName},

Thank you for taking the time to discuss your property with me. As we talked about, I've put together a personalized report outlining your options for selling ${propertyAddress}.

**View Your Report:** ${shareLink}

In this report, you'll find:
- Multiple purchase options tailored to your situation
- Clear explanation of terms for each option
- What we handle as the buyer (closing costs, cleanout, etc.)
- No obligation - just information to help you make the best decision

The report is private and can only be accessed with this link. Feel free to share it with anyone who needs to be part of your decision.

If you have any questions or would like to discuss further, please don't hesitate to reach out.

Looking forward to hearing from you.

Best regards`;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format price range for display
 */
export const formatPriceRange = (low: number | undefined, high: number | undefined): string => {
  if (!low && !high) return 'TBD';
  if (low === high) return formatCurrency(low);
  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
};

/**
 * Format close time range for display
 */
export const formatCloseRange = (low: number | undefined, high: number | undefined): string => {
  if (!low && !high) return 'TBD';
  if (low === high) return `${low} days`;
  return `${low}-${high} days`;
};
