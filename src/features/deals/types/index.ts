// src/features/deals/types/index.ts
// Deal OS core types

import { Lead } from '../../leads/types';
import { Property } from '../../real-estate/types/property';

/**
 * Deal pipeline stages
 */
export type DealStage =
  | 'initial_contact'
  | 'new'
  | 'contacted'
  | 'appointment_set'
  | 'analyzing'
  | 'offer_sent'
  | 'negotiating'
  | 'under_contract'
  | 'closed_won'
  | 'closed_lost';

/**
 * Deal strategy types
 */
export type DealStrategy =
  | 'cash'
  | 'seller_finance'
  | 'subject_to'
  | 'wholesale'
  | 'fix_and_flip'
  | 'brrrr'
  | 'buy_and_hold';

/**
 * Evidence source types for "Why?" trails
 */
export type EvidenceSource = 'comps' | 'manual' | 'ai_estimate' | 'appraisal' | 'walkthrough';

/**
 * Core Deal entity - combines Lead + Property + Strategy
 */
export interface Deal {
  id: string;
  workspace_id?: string;
  user_id?: string;

  // Linked entities
  lead_id?: string;
  property_id?: string;
  lead?: Lead;
  property?: Property;

  // Pipeline
  stage: DealStage;
  next_action?: string;
  next_action_due?: string;

  // Strategy
  strategy?: DealStrategy;

  // Risk scoring (1-5 scale)
  risk_score?: number; // Manual override
  risk_score_auto?: number; // Rule-based calculation

  // Metadata
  created_at?: string;
  updated_at?: string;

  // Related data (populated from hooks)
  offers?: DealOffer[];
  evidence?: DealEvidence[];
  walkthrough?: DealWalkthrough;
  seller_report?: DealSellerReport;

  // Activity tracking (Zone G)
  photos?: DealPhoto[];
  last_activity_at?: string;
}

/**
 * Deal photo for walkthrough progress tracking
 */
export interface DealPhoto {
  id: string;
  deal_id?: string;
  bucket?: string;
  category?: string;
  file_url?: string;
  created_at?: string;
}

/**
 * Deal offer (one of potentially many per deal)
 */
export interface DealOffer {
  id: string;
  deal_id: string;
  offer_type: DealStrategy;
  offer_amount?: number;
  terms_json?: OfferTerms;
  status: OfferStatus;
  pdf_url?: string;
  created_at?: string;
}

export type OfferStatus = 'draft' | 'sent' | 'countered' | 'accepted' | 'rejected';

/**
 * Offer terms by strategy type
 */
export interface OfferTerms {
  // Common
  purchase_price?: number;
  earnest_money?: number;
  closing_date?: string;
  contingencies?: string[];

  // Cash specific
  proof_of_funds?: boolean;

  // Seller finance specific
  down_payment?: number;
  interest_rate?: number;
  term_years?: number;
  monthly_payment?: number;
  balloon_payment?: number;
  balloon_due_years?: number;

  // Subject-to specific
  existing_loan_balance?: number;
  existing_monthly_payment?: number;
  existing_interest_rate?: number;
  catch_up_amount?: number; // Arrears to be caught up
}

/**
 * Evidence trail for "Why?" links
 */
export interface DealEvidence {
  id: string;
  deal_id: string;
  field_key: string; // 'arv', 'repair_cost', 'mao', etc.
  value?: string;
  source: EvidenceSource;
  source_url?: string;
  changed_by?: string;
  changed_at?: string;
}

/**
 * Walkthrough for Field Mode Lite
 */
export interface DealWalkthrough {
  id: string;
  deal_id: string;
  status: WalkthroughStatus;
  ai_summary?: AISummary;
  items?: WalkthroughItem[];
  created_at?: string;
  completed_at?: string;
}

export type WalkthroughStatus = 'in_progress' | 'completed' | 'organized';

/**
 * Photo bucket categories for Field Mode
 */
export type PhotoBucket =
  | 'exterior_roof'
  | 'kitchen'
  | 'baths'
  | 'basement_mechanical'
  | 'electrical_plumbing'
  | 'notes_other';

/**
 * Individual walkthrough item (photo or voice memo)
 */
export interface WalkthroughItem {
  id: string;
  walkthrough_id: string;
  bucket: PhotoBucket;
  item_type: 'photo' | 'voice_memo';
  file_url?: string;
  transcript?: string; // AI transcribed from voice memo
  notes?: string;
  created_at?: string;
}

/**
 * AI-organized walkthrough summary
 */
export interface AISummary {
  issues: string[];
  questions: string[];
  scope_bullets: string[];
}

/**
 * Seller Options Report
 */
export interface DealSellerReport {
  id: string;
  deal_id: string;
  pdf_url?: string;
  share_token?: string; // For view-only link
  options_json?: SellerReportOptions;
  we_handle_json?: WeHandleOptions;
  assumptions_json?: ReportAssumptions;
  viewed_at?: string;
  created_at?: string;
}

export interface SellerReportOptions {
  cash?: {
    price_low: number;
    price_high: number;
    close_days_low: number;
    close_days_high: number;
  };
  seller_finance?: {
    price_low: number;
    price_high: number;
    monthly_payment: number;
    term_years: number;
    down_payment?: number;
  };
  subject_to?: {
    price_low: number;
    price_high: number;
    catch_up_amount?: number;
  };
}

export interface WeHandleOptions {
  cleanout: boolean;
  closing_costs: boolean;
  title_search: boolean;
  outstanding_liens: boolean;
  repairs: boolean;
}

export interface ReportAssumptions {
  arv_estimate: number;
  arv_source: string;
  repair_estimate: number;
  repair_source: string;
  comps_count: number;
}

// ============================================
// Display configuration
// ============================================

export const DEAL_STAGE_CONFIG: Record<DealStage, { label: string; color: string; order: number }> = {
  initial_contact: { label: 'Initial Contact', color: 'bg-slate-500', order: 0 },
  new: { label: 'New', color: 'bg-blue-500', order: 1 },
  contacted: { label: 'Contacted', color: 'bg-indigo-500', order: 2 },
  appointment_set: { label: 'Appointment Set', color: 'bg-purple-500', order: 3 },
  analyzing: { label: 'Analyzing', color: 'bg-amber-500', order: 4 },
  offer_sent: { label: 'Offer Sent', color: 'bg-orange-500', order: 5 },
  negotiating: { label: 'Negotiating', color: 'bg-pink-500', order: 6 },
  under_contract: { label: 'Under Contract', color: 'bg-emerald-500', order: 7 },
  closed_won: { label: 'Closed Won', color: 'bg-green-600', order: 8 },
  closed_lost: { label: 'Closed Lost', color: 'bg-gray-500', order: 9 },
};

export const DEAL_STRATEGY_CONFIG: Record<DealStrategy, { label: string; description: string }> = {
  cash: {
    label: 'Cash Offer',
    description: 'All-cash purchase with quick close',
  },
  seller_finance: {
    label: 'Seller Finance',
    description: 'Seller carries the note with monthly payments',
  },
  subject_to: {
    label: 'Subject-To',
    description: 'Take over existing mortgage payments',
  },
  wholesale: {
    label: 'Wholesale',
    description: 'Assign contract to end buyer for assignment fee',
  },
  fix_and_flip: {
    label: 'Fix & Flip',
    description: 'Renovate and resell for profit',
  },
  brrrr: {
    label: 'BRRRR',
    description: 'Buy, Rehab, Rent, Refinance, Repeat',
  },
  buy_and_hold: {
    label: 'Buy & Hold',
    description: 'Long-term rental income property',
  },
};

export const PHOTO_BUCKET_CONFIG: Record<PhotoBucket, { label: string; icon: string }> = {
  exterior_roof: { label: 'Exterior / Roof', icon: 'home' },
  kitchen: { label: 'Kitchen', icon: 'utensils' },
  baths: { label: 'Bathrooms', icon: 'bath' },
  basement_mechanical: { label: 'Basement / Mechanical', icon: 'wrench' },
  electrical_plumbing: { label: 'Electrical / Plumbing', icon: 'zap' },
  notes_other: { label: 'Notes / Other', icon: 'file-text' },
};

// ============================================
// Helper functions
// ============================================

/**
 * Get full address string from a deal's property
 */
export const getDealAddress = (deal: Deal): string => {
  if (!deal.property) return 'No property linked';
  const p = deal.property;
  const parts = [p.address || p.address_line_1, p.city, p.state, p.zip].filter(Boolean);
  return parts.join(', ') || 'No address';
};

/**
 * Get lead name from a deal
 */
export const getDealLeadName = (deal: Deal): string => {
  return deal.lead?.name || 'No lead linked';
};

/**
 * Get display risk score (prefer manual, fallback to auto)
 */
export const getDealRiskScore = (deal: Deal): number | undefined => {
  return deal.risk_score ?? deal.risk_score_auto;
};

/**
 * Get risk score color based on value
 */
export const getRiskScoreColor = (score: number | undefined): string => {
  if (score === undefined) return 'text-gray-400';
  if (score <= 2) return 'text-green-500';
  if (score <= 3) return 'text-amber-500';
  return 'text-red-500';
};

/**
 * Check if deal is in a "closed" state
 */
export const isDealClosed = (deal: Deal): boolean => {
  return deal.stage === 'closed_won' || deal.stage === 'closed_lost';
};

/**
 * Get next logical stages from current stage
 */
export const getNextStages = (currentStage: DealStage): DealStage[] => {
  const config = DEAL_STAGE_CONFIG[currentStage];
  // Handle unknown stages - return empty array (no next stages)
  if (!config) return [];

  const order = config.order;
  return (Object.entries(DEAL_STAGE_CONFIG) as [DealStage, typeof DEAL_STAGE_CONFIG[DealStage]][])
    .filter(([_, stageConfig]) => stageConfig.order === order + 1)
    .map(([stage]) => stage);
};
