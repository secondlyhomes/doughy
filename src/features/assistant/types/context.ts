// src/features/assistant/types/context.ts
// Assistant context snapshot types for page-aware AI without HTML scraping

import { DealStage, DealStrategy } from '../../deals/types';

/**
 * User subscription plan tiers
 */
export type UserPlan = 'starter' | 'pro' | 'elite';

/**
 * Platform types
 */
export type Platform = 'ios' | 'android' | 'web';

/**
 * App metadata
 */
export interface AppContext {
  version: string;
  platform: Platform;
}

/**
 * Current user context
 */
export interface UserContext {
  id: string;
  plan: UserPlan;
  timezone: string;
}

/**
 * Screen/route context
 */
export interface ScreenContext {
  name: string;
  route: string;
}

/**
 * User permissions for current context
 */
export interface PermissionsContext {
  canWrite: boolean;
  canSendForESign: boolean;
  canGenerateReports: boolean;
}

/**
 * Currently selected entities
 */
export interface SelectionContext {
  dealId?: string;
  leadId?: string;
  propertyId?: string;
  offerId?: string;
}

/**
 * One-liner summary of current context
 */
export interface SummaryContext {
  oneLiner: string;
  lastUpdated: string;
}

/**
 * Base assistant context snapshot - always present
 */
export interface AssistantContextSnapshot {
  app: AppContext;
  user: UserContext;
  screen: ScreenContext;
  permissions: PermissionsContext;
  focusMode: boolean;
  selection: SelectionContext;
  summary: SummaryContext;
  payload: ScreenPayload;
}

/**
 * Union type for all screen-specific payloads
 */
export type ScreenPayload =
  | DealCockpitPayload
  | UnderwritePayload
  | OfferBuilderPayload
  | FieldModePayload
  | PropertyDetailPayload
  | LeadsListPayload
  | InboxPayload
  | GenericPayload;

/**
 * Deal Cockpit screen payload
 */
export interface DealCockpitPayload {
  type: 'deal_cockpit';
  deal: {
    id: string;
    stage: DealStage;
    strategy?: DealStrategy;
    nextAction?: {
      id?: string;
      label: string;
      dueDate?: string;
      isOverdue?: boolean;
      blockedBy?: string[];
    };
    numbers: {
      mao?: { value: number; confidence: 'high' | 'med' | 'low'; sourceCount: number };
      profit?: { value: number; confidence: 'high' | 'med' | 'low'; sourceCount: number };
      risk?: { value: number; band: 'low' | 'med' | 'high' };
    };
    property?: {
      address: string;
      arv?: number;
      repairCost?: number;
    };
    lead?: {
      name: string;
      motivation?: string;
    };
  };
  missingInfo: Array<{
    key: string;
    label: string;
    severity: 'high' | 'med' | 'low';
  }>;
  recentEvents: Array<{
    eventId: string;
    type: string;
    title: string;
    ts: string;
  }>;
}

/**
 * Underwrite (Quick Underwrite) screen payload
 */
export interface UnderwritePayload {
  type: 'underwrite';
  dealId: string;
  assumptions: Record<string, {
    value: number;
    source: string;
    confidence: 'high' | 'med' | 'low';
  }>;
  scenarioOutputs: {
    flip?: {
      mao: number;
      profit: number;
      roi: number;
    };
    rental?: {
      cashFlow: number;
      capRate: number;
      cashOnCash: number;
    };
  };
  deltasSinceLastRun?: Array<{
    field: string;
    oldValue: number;
    newValue: number;
    impact: string;
  }>;
}

/**
 * Offer Builder screen payload
 */
export interface OfferBuilderPayload {
  type: 'offer_builder';
  dealId: string;
  currentTerms?: {
    strategy: DealStrategy;
    purchasePrice?: number;
    earnestMoney?: number;
    closingDate?: string;
    downPayment?: number;
    interestRate?: number;
    termYears?: number;
  };
  lastOfferSummary?: {
    offerId: string;
    status: string;
    sentAt?: string;
    counterAmount?: number;
  };
  sellerPainPoints?: string[];
  chosenStrategy?: DealStrategy;
}

/**
 * Field Mode (Walkthrough) screen payload
 */
export interface FieldModePayload {
  type: 'field_mode';
  dealId: string;
  walkthroughId?: string;
  captureProgress: {
    totalBuckets: number;
    completedBuckets: number;
    buckets: Record<string, { photoCount: number; hasVoiceMemo: boolean }>;
  };
  lastTranscriptSnippet?: string;
  missingShots: string[];
  aiSummary?: {
    issues: string[];
    questions: string[];
  };
}

/**
 * Property Detail screen payload
 */
export interface PropertyDetailPayload {
  type: 'property_detail';
  propertyId: string;
  property: {
    address: string;
    type?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    yearBuilt?: number;
    arv?: number;
    purchasePrice?: number;
    repairCost?: number;
    status?: string;
  };
  analysisMetrics?: {
    mao?: number;
    profit?: number;
    roi?: number;
    capRate?: number;
    cashFlow?: number;
  };
  financingScenarios?: Array<{
    name: string;
    type: string;
    monthlyPayment?: number;
  }>;
  compsCount?: number;
  repairsTotal?: number;
}

/**
 * Leads List screen payload
 */
export interface LeadsListPayload {
  type: 'leads_list';
  totalLeads: number;
  filters?: {
    status?: string;
    source?: string;
    dateRange?: string;
  };
  topLeads?: Array<{
    id: string;
    name: string;
    score?: number;
  }>;
}

/**
 * Inbox/Dashboard screen payload
 */
export interface InboxPayload {
  type: 'inbox';
  pendingTasks: number;
  overdueActions: number;
  todaysActions: Array<{
    dealId: string;
    dealName: string;
    action: string;
    dueAt?: string;
  }>;
  recentActivity?: Array<{
    type: string;
    title: string;
    ts: string;
  }>;
}

/**
 * Generic payload for screens without specific context
 */
export interface GenericPayload {
  type: 'generic';
  screenName: string;
  data?: Record<string, unknown>;
}

/**
 * Screen name to payload type mapping
 */
export const SCREEN_PAYLOAD_MAP: Record<string, ScreenPayload['type']> = {
  DealCockpit: 'deal_cockpit',
  QuickUnderwrite: 'underwrite',
  OfferBuilder: 'offer_builder',
  FieldMode: 'field_mode',
  PropertyDetail: 'property_detail',
  LeadsList: 'leads_list',
  Inbox: 'inbox',
};

/**
 * Helper to create a minimal context when data is loading or unavailable
 */
export function createEmptyContext(
  screen: ScreenContext,
  selection: SelectionContext = {}
): AssistantContextSnapshot {
  return {
    app: { version: '1.0.0', platform: 'ios' },
    user: { id: '', plan: 'starter', timezone: 'America/New_York' },
    screen,
    permissions: { canWrite: true, canSendForESign: false, canGenerateReports: false },
    focusMode: false,
    selection,
    summary: { oneLiner: 'Loading...', lastUpdated: new Date().toISOString() },
    payload: { type: 'generic', screenName: screen.name },
  };
}
