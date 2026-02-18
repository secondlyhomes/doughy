// src/features/deals/data/mockDeals.ts
// Mock deal data for client-side development

import { Lead } from '../../leads/types';
import { Property } from '../../real-estate/types/property';
import {
  Deal,
  DealOffer,
  DealEvidence,
  DealWalkthrough,
  DealSellerReport,
  AISummary,
  WalkthroughItem,
} from '../types';

// ============================================
// Mock Leads
// ============================================

export const mockLeads: Lead[] = [
  {
    id: 'lead-001',
    name: 'John Martinez',
    status: 'active',
    phone: '(555) 123-4567',
    email: 'john.martinez@email.com',
    address_line_1: '123 Oak Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    source: 'Direct Mail',
    tags: ['motivated', 'divorce'],
    score: 85,
    starred: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'lead-002',
    name: 'Sarah Thompson',
    status: 'active',
    phone: '(555) 234-5678',
    email: 'sarah.t@email.com',
    address_line_1: '456 Maple Ave',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    source: 'Referral',
    tags: ['inherited', 'out-of-state'],
    score: 72,
    created_at: '2024-01-18T14:30:00Z',
  },
  {
    id: 'lead-003',
    name: 'Robert Chen',
    status: 'active',
    phone: '(555) 345-6789',
    email: 'rchen@email.com',
    address_line_1: '789 Pine Blvd',
    city: 'Houston',
    state: 'TX',
    zip: '77001',
    source: 'Driving for Dollars',
    tags: ['vacant', 'code-violations'],
    score: 90,
    starred: true,
    created_at: '2024-01-20T09:15:00Z',
  },
  {
    id: 'lead-004',
    name: 'Maria Garcia',
    status: 'active',
    phone: '(555) 456-7890',
    email: 'mgarcia@email.com',
    address_line_1: '321 Elm Court',
    city: 'San Antonio',
    state: 'TX',
    zip: '78201',
    source: 'Cold Call',
    tags: ['pre-foreclosure'],
    score: 68,
    created_at: '2024-01-22T11:00:00Z',
  },
  {
    id: 'lead-005',
    name: 'David Wilson',
    status: 'active',
    phone: '(555) 567-8901',
    email: 'dwilson@email.com',
    address_line_1: '654 Cedar Lane',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76101',
    source: 'Bandit Signs',
    tags: ['tired-landlord'],
    score: 75,
    created_at: '2024-01-25T16:45:00Z',
  },
];

// ============================================
// Mock Properties
// ============================================

export const mockProperties: Property[] = [
  {
    id: 'prop-001',
    address: '123 Oak Street',
    address_line_1: '123 Oak Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    square_feet: 1850,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 1975,
    propertyType: 'single-family',
    purchase_price: 185000,
    arv: 285000,
    repair_cost: 45000,
    monthly_rent: 2200,
    status: 'analyzing',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'prop-002',
    address: '456 Maple Ave',
    address_line_1: '456 Maple Ave',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    square_feet: 2200,
    bedrooms: 4,
    bathrooms: 2.5,
    year_built: 1985,
    propertyType: 'single-family',
    purchase_price: 220000,
    arv: 340000,
    repair_cost: 55000,
    monthly_rent: 2800,
    mortgage_balance: 120000,
    status: 'new',
    created_at: '2024-01-18T14:30:00Z',
  },
  {
    id: 'prop-003',
    address: '789 Pine Blvd',
    address_line_1: '789 Pine Blvd',
    city: 'Houston',
    state: 'TX',
    zip: '77001',
    square_feet: 1600,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 1968,
    propertyType: 'single-family',
    purchase_price: 95000,
    arv: 175000,
    repair_cost: 35000,
    monthly_rent: 1600,
    vacant: true,
    status: 'offer-sent',
    created_at: '2024-01-20T09:15:00Z',
  },
  {
    id: 'prop-004',
    address: '321 Elm Court',
    address_line_1: '321 Elm Court',
    city: 'San Antonio',
    state: 'TX',
    zip: '78201',
    square_feet: 1400,
    bedrooms: 2,
    bathrooms: 1,
    year_built: 1960,
    propertyType: 'single-family',
    purchase_price: 75000,
    arv: 135000,
    repair_cost: 28000,
    monthly_rent: 1200,
    mortgage_balance: 45000,
    status: 'contacted',
    created_at: '2024-01-22T11:00:00Z',
  },
  {
    id: 'prop-005',
    address: '654 Cedar Lane',
    address_line_1: '654 Cedar Lane',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76101',
    square_feet: 1950,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 1980,
    propertyType: 'single-family',
    purchase_price: 165000,
    arv: 245000,
    repair_cost: 40000,
    monthly_rent: 1900,
    status: 'under-contract',
    created_at: '2024-01-25T16:45:00Z',
  },
];

// ============================================
// Mock AI Summary for walkthrough
// ============================================

const mockAISummary: AISummary = {
  issues: [
    'Roof has visible damage on north side - needs inspection',
    'Kitchen cabinets are outdated and have water damage under sink',
    'HVAC unit is 18+ years old - likely needs replacement',
    'Foundation shows minor settling cracks in garage',
    'Electrical panel is 100A - may need upgrade for modern use',
  ],
  questions: [
    'When was the roof last replaced?',
    'Has there been any water intrusion in the basement?',
    'Are there any permits pulled for recent work?',
    'What is the current status of the HVAC maintenance?',
  ],
  scope_bullets: [
    'Roof: Full replacement - $8,000-12,000',
    'Kitchen: Cabinet replacement + countertops - $6,000-9,000',
    'HVAC: New unit + ductwork inspection - $5,000-8,000',
    'Foundation: Seal cracks + monitor - $800-1,500',
    'Electrical: Panel upgrade to 200A - $1,500-2,500',
    'Paint: Interior + exterior - $4,000-6,000',
    'Flooring: LVP throughout main level - $3,500-5,000',
  ],
};

// ============================================
// Mock Walkthrough Items
// ============================================

const mockWalkthroughItems: WalkthroughItem[] = [
  {
    id: 'wt-item-001',
    walkthrough_id: 'wt-001',
    bucket: 'exterior_roof',
    item_type: 'photo',
    file_url: 'https://example.com/photos/exterior1.jpg',
    notes: 'Front of house - needs paint',
    created_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'wt-item-002',
    walkthrough_id: 'wt-001',
    bucket: 'exterior_roof',
    item_type: 'voice_memo',
    file_url: 'https://example.com/audio/roof-notes.m4a',
    transcript: 'The roof looks like it has some damage on the north side. I can see a few missing shingles and what looks like some water staining on the fascia.',
    created_at: '2024-01-20T10:05:00Z',
  },
  {
    id: 'wt-item-003',
    walkthrough_id: 'wt-001',
    bucket: 'kitchen',
    item_type: 'photo',
    file_url: 'https://example.com/photos/kitchen1.jpg',
    notes: 'Cabinets are dated, countertops cracked',
    created_at: '2024-01-20T10:10:00Z',
  },
];

// ============================================
// Mock Walkthroughs
// ============================================

const mockWalkthroughs: Record<string, DealWalkthrough> = {
  'deal-001': {
    id: 'wt-001',
    deal_id: 'deal-001',
    status: 'organized',
    ai_summary: mockAISummary,
    items: mockWalkthroughItems,
    created_at: '2024-01-20T09:30:00Z',
    completed_at: '2024-01-20T11:00:00Z',
  },
  'deal-003': {
    id: 'wt-003',
    deal_id: 'deal-003',
    status: 'in_progress',
    items: [
      {
        id: 'wt-item-010',
        walkthrough_id: 'wt-003',
        bucket: 'exterior_roof',
        item_type: 'photo',
        file_url: 'https://example.com/photos/vacant1.jpg',
        notes: 'Overgrown yard, broken window on side',
        created_at: '2024-01-21T14:00:00Z',
      },
    ],
    created_at: '2024-01-21T14:00:00Z',
  },
};

// ============================================
// Mock Offers
// ============================================

const mockOffers: Record<string, DealOffer[]> = {
  'deal-001': [
    {
      id: 'offer-001',
      deal_id: 'deal-001',
      offer_type: 'cash',
      offer_amount: 175000,
      status: 'sent',
      terms_json: {
        purchase_price: 175000,
        earnest_money: 5000,
        closing_date: '2024-02-15',
        contingencies: ['inspection', 'title'],
        proof_of_funds: true,
      },
      created_at: '2024-01-22T10:00:00Z',
    },
  ],
  'deal-003': [
    {
      id: 'offer-003',
      deal_id: 'deal-003',
      offer_type: 'cash',
      offer_amount: 85000,
      status: 'countered',
      terms_json: {
        purchase_price: 85000,
        earnest_money: 2500,
        closing_date: '2024-02-20',
        contingencies: ['inspection'],
        proof_of_funds: true,
      },
      created_at: '2024-01-23T14:00:00Z',
    },
    {
      id: 'offer-003b',
      deal_id: 'deal-003',
      offer_type: 'seller_finance',
      offer_amount: 95000,
      status: 'draft',
      terms_json: {
        purchase_price: 95000,
        down_payment: 10000,
        interest_rate: 6,
        term_years: 5,
        monthly_payment: 1644,
        balloon_payment: 75000,
        balloon_due_years: 5,
      },
      created_at: '2024-01-24T09:00:00Z',
    },
  ],
  'deal-005': [
    {
      id: 'offer-005',
      deal_id: 'deal-005',
      offer_type: 'cash',
      offer_amount: 155000,
      status: 'accepted',
      terms_json: {
        purchase_price: 155000,
        earnest_money: 5000,
        closing_date: '2024-02-28',
        proof_of_funds: true,
      },
      created_at: '2024-01-26T11:00:00Z',
    },
  ],
};

// ============================================
// Mock Evidence (Why? trails)
// ============================================

const mockEvidence: Record<string, DealEvidence[]> = {
  'deal-001': [
    {
      id: 'ev-001',
      deal_id: 'deal-001',
      field_key: 'arv',
      value: '285000',
      source: 'comps',
      source_url: '/properties/prop-001/comps',
      changed_at: '2024-01-18T10:00:00Z',
    },
    {
      id: 'ev-002',
      deal_id: 'deal-001',
      field_key: 'repair_cost',
      value: '45000',
      source: 'walkthrough',
      changed_at: '2024-01-20T11:00:00Z',
    },
    {
      id: 'ev-003',
      deal_id: 'deal-001',
      field_key: 'mao',
      value: '154500',
      source: 'manual',
      changed_at: '2024-01-21T09:00:00Z',
    },
  ],
  'deal-003': [
    {
      id: 'ev-010',
      deal_id: 'deal-003',
      field_key: 'arv',
      value: '175000',
      source: 'comps',
      changed_at: '2024-01-21T10:00:00Z',
    },
    {
      id: 'ev-011',
      deal_id: 'deal-003',
      field_key: 'repair_cost',
      value: '35000',
      source: 'ai_estimate',
      changed_at: '2024-01-21T10:30:00Z',
    },
  ],
};

// ============================================
// Mock Seller Reports
// ============================================

const mockSellerReports: Record<string, DealSellerReport> = {
  'deal-001': {
    id: 'sr-001',
    deal_id: 'deal-001',
    share_token: 'abc123xyz',
    options_json: {
      cash: {
        price_low: 170000,
        price_high: 180000,
        close_days_low: 7,
        close_days_high: 14,
      },
      seller_finance: {
        price_low: 195000,
        price_high: 210000,
        monthly_payment: 1800,
        term_years: 5,
        down_payment: 15000,
      },
    },
    we_handle_json: {
      cleanout: true,
      closing_costs: true,
      title_search: true,
      outstanding_liens: false,
      repairs: false,
    },
    assumptions_json: {
      arv_estimate: 285000,
      arv_source: '3 comparable sales',
      repair_estimate: 45000,
      repair_source: 'Walkthrough assessment',
      comps_count: 3,
    },
    created_at: '2024-01-22T14:00:00Z',
  },
};

// ============================================
// Mock Deals (fully assembled)
// ============================================

export const mockDeals: Deal[] = [
  {
    id: 'deal-001',
    lead_id: 'lead-001',
    property_id: 'prop-001',
    lead: mockLeads[0],
    property: mockProperties[0],
    stage: 'offer_sent',
    strategy: 'cash',
    next_action: 'Follow up on offer - seller reviewing',
    next_action_due: '2024-01-25T10:00:00Z',
    risk_score: 2,
    risk_score_auto: 2,
    offers: mockOffers['deal-001'],
    evidence: mockEvidence['deal-001'],
    walkthrough: mockWalkthroughs['deal-001'],
    seller_report: mockSellerReports['deal-001'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-22T14:00:00Z',
  },
  {
    id: 'deal-002',
    lead_id: 'lead-002',
    property_id: 'prop-002',
    lead: mockLeads[1],
    property: mockProperties[1],
    stage: 'analyzing',
    strategy: 'subject_to',
    next_action: 'Schedule appointment to view property',
    next_action_due: '2024-01-26T14:00:00Z',
    risk_score_auto: 3,
    created_at: '2024-01-18T14:30:00Z',
    updated_at: '2024-01-20T09:00:00Z',
  },
  {
    id: 'deal-003',
    lead_id: 'lead-003',
    property_id: 'prop-003',
    lead: mockLeads[2],
    property: mockProperties[2],
    stage: 'negotiating',
    strategy: 'cash',
    next_action: 'Counter offer received - prepare response',
    next_action_due: '2024-01-24T09:00:00Z',
    risk_score: 3,
    risk_score_auto: 4,
    offers: mockOffers['deal-003'],
    evidence: mockEvidence['deal-003'],
    walkthrough: mockWalkthroughs['deal-003'],
    created_at: '2024-01-20T09:15:00Z',
    updated_at: '2024-01-24T08:00:00Z',
  },
  {
    id: 'deal-004',
    lead_id: 'lead-004',
    property_id: 'prop-004',
    lead: mockLeads[3],
    property: mockProperties[3],
    stage: 'contacted',
    strategy: 'seller_finance',
    next_action: 'Call back tomorrow - seller was busy',
    next_action_due: '2024-01-27T11:00:00Z',
    risk_score_auto: 3,
    created_at: '2024-01-22T11:00:00Z',
    updated_at: '2024-01-23T10:00:00Z',
  },
  {
    id: 'deal-005',
    lead_id: 'lead-005',
    property_id: 'prop-005',
    lead: mockLeads[4],
    property: mockProperties[4],
    stage: 'under_contract',
    strategy: 'cash',
    next_action: 'Order title search',
    next_action_due: '2024-01-28T09:00:00Z',
    risk_score: 1,
    risk_score_auto: 2,
    offers: mockOffers['deal-005'],
    created_at: '2024-01-25T16:45:00Z',
    updated_at: '2024-01-27T10:00:00Z',
  },
  {
    id: 'deal-006',
    lead_id: 'lead-001', // Same lead, different property scenario
    stage: 'new',
    next_action: 'Link property or create new',
    next_action_due: '2024-01-28T10:00:00Z',
    lead: mockLeads[0],
    created_at: '2024-01-27T08:00:00Z',
    updated_at: '2024-01-27T08:00:00Z',
  },
];

// ============================================
// Helper functions for mock data
// ============================================

/**
 * Get a deal by ID
 */
export const getMockDealById = (id: string): Deal | undefined => {
  return mockDeals.find((d) => d.id === id);
};

/**
 * Get deals filtered by stage
 */
export const getMockDealsByStage = (stage: string): Deal[] => {
  if (stage === 'all') return mockDeals;
  return mockDeals.filter((d) => d.stage === stage);
};

/**
 * Get active (non-closed) deals
 */
export const getActiveMockDeals = (): Deal[] => {
  return mockDeals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
};

/**
 * Get deals with upcoming actions (for Inbox)
 */
export const getMockDealsWithActions = (limit: number = 5): Deal[] => {
  return [...mockDeals]
    .filter((d) => d.next_action && d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .sort((a, b) => {
      if (!a.next_action_due) return 1;
      if (!b.next_action_due) return -1;
      return new Date(a.next_action_due).getTime() - new Date(b.next_action_due).getTime();
    })
    .slice(0, limit);
};

/**
 * Search deals by address or lead name
 */
export const searchMockDeals = (query: string): Deal[] => {
  const lowerQuery = query.toLowerCase();
  return mockDeals.filter((d) => {
    const address = d.property?.address?.toLowerCase() || '';
    const leadName = d.lead?.name?.toLowerCase() || '';
    return address.includes(lowerQuery) || leadName.includes(lowerQuery);
  });
};
