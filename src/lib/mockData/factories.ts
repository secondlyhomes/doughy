// src/lib/mockData/factories.ts
// Faker-based data generators for mock data

import { faker } from '@faker-js/faker';
import { DEV_MODE_CONFIG } from '@/config/devMode';

// Seed faker for deterministic data
faker.seed(
  DEV_MODE_CONFIG.mockDataSeed
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
);

/**
 * Generate a mock lead
 */
export const createMockLead = (overrides?: Partial<MockLead>): MockLead => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  phone: faker.phone.number(),
  company: faker.company.name(),
  status: faker.helpers.arrayElement(['new', 'active', 'won', 'closed', 'lost']),
  score: faker.number.int({ min: 0, max: 100 }),
  tags: faker.helpers.arrayElements(
    ['VIP', 'Hot Lead', 'Referral', 'Cold', 'Follow-up'],
    { min: 0, max: 3 }
  ),
  opt_status: faker.helpers.arrayElement([
    'opted_in',
    'opted_out',
    'pending',
    'new',
  ]),
  workspace_id: null,
  is_deleted: false,
  created_at: faker.date.past({ years: 1 }).toISOString(),
  updated_at: faker.date.recent({ days: 30 }).toISOString(),
  inserted_at: faker.date.past({ years: 1 }).toISOString(),
  ...overrides,
});

/**
 * Generate a mock profile (user)
 */
export const createMockProfile = (
  overrides?: Partial<MockProfile>
): MockProfile => ({
  id: faker.string.uuid(),
  email: faker.internet.email().toLowerCase(),
  role: faker.helpers.arrayElement(['user', 'admin']),
  workspace_id: null,
  created_at: faker.date.past({ years: 1 }).toISOString(),
  ...overrides,
});

/**
 * Generate a mock property
 */
export const createMockProperty = (
  overrides?: Partial<MockProperty>
): MockProperty => ({
  id: faker.string.uuid(),
  profile_id: faker.string.uuid(),
  address_line_1: faker.location.streetAddress(),
  address_line_2: faker.helpers.maybe(() => `Apt ${faker.number.int(999)}`) ?? null,
  city: faker.location.city(),
  state: faker.location.state({ abbreviated: true }),
  zip: faker.location.zipCode(),
  bedrooms: faker.number.int({ min: 1, max: 6 }),
  bathrooms: faker.number.float({ min: 1, max: 4, fractionDigits: 1 }),
  square_feet: faker.number.int({ min: 800, max: 4500 }),
  lot_size: faker.number.float({ min: 0.1, max: 2, fractionDigits: 2 }),
  year_built: faker.number.int({ min: 1950, max: 2024 }),
  property_type: faker.helpers.arrayElement([
    'single_family',
    'multi_family',
    'condo',
    'townhouse',
  ]),
  purchase_price: faker.number.int({ min: 100000, max: 800000 }),
  arv: faker.number.int({ min: 150000, max: 1000000 }),
  mls_id: faker.helpers.maybe(() => `MLS${faker.number.int(999999)}`) ?? null,
  status: faker.helpers.arrayElement(['active', 'pending', 'closed', 'archived']),
  tags: faker.helpers.arrayElements(
    ['Flip', 'Rental', 'Wholesale', 'Buy & Hold'],
    { min: 0, max: 2 }
  ),
  notes: faker.helpers.maybe(() => faker.lorem.paragraph()) ?? null,
  geo_point: null,
  created_by: faker.string.uuid(),
  created_at: faker.date.past({ years: 1 }).toISOString(),
  updated_at: faker.date.recent({ days: 30 }).toISOString(),
  ...overrides,
});

/**
 * Generate a mock contact
 */
export const createMockContact = (
  overrides?: Partial<MockContact>
): MockContact => ({
  id: faker.string.uuid(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email().toLowerCase(),
  emails: [faker.internet.email().toLowerCase()],
  phone: faker.phone.number(),
  phones: [faker.phone.number()],
  company: faker.company.name(),
  job_title: faker.person.jobTitle(),
  address: faker.location.streetAddress(),
  sms_opt_status: faker.helpers.arrayElement([
    'opted_in',
    'opted_out',
    'pending',
  ]),
  created_at: faker.date.past({ years: 1 }).toISOString(),
  updated_at: faker.date.recent({ days: 30 }).toISOString(),
  ...overrides,
});

/**
 * Generate a mock message
 */
export const createMockMessage = (
  overrides?: Partial<MockMessage>
): MockMessage => ({
  id: faker.string.uuid(),
  lead_id: faker.string.uuid(),
  channel: faker.helpers.arrayElement(['sms', 'email']),
  direction: faker.helpers.arrayElement(['incoming', 'outgoing']),
  body: faker.lorem.paragraph(),
  subject: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
  status: faker.helpers.arrayElement(['sent', 'delivered', 'failed', 'pending']),
  testing: false,
  created_at: faker.date.past({ years: 1 }).toISOString(),
  updated_at: faker.date.recent({ days: 30 }).toISOString(),
  ...overrides,
});

/**
 * Generate a mock comp (comparable sale)
 */
export const createMockComp = (overrides?: Partial<MockComp>): MockComp => ({
  id: faker.string.uuid(),
  property_id: faker.string.uuid(),
  address: faker.location.streetAddress(),
  city: faker.location.city(),
  state: faker.location.state({ abbreviated: true }),
  zip: faker.location.zipCode(),
  bedrooms: faker.number.int({ min: 1, max: 6 }),
  bathrooms: faker.number.float({ min: 1, max: 4, fractionDigits: 1 }),
  square_feet: faker.number.int({ min: 800, max: 4500 }),
  lot_size: faker.number.float({ min: 0.1, max: 2, fractionDigits: 2 }),
  year_built: faker.number.int({ min: 1950, max: 2024 }),
  sale_price: faker.number.int({ min: 100000, max: 800000 }),
  sale_date: faker.date.past({ years: 2 }).toISOString().split('T')[0],
  days_on_market: faker.number.int({ min: 5, max: 120 }),
  price_per_sqft: faker.number.float({ min: 100, max: 500, fractionDigits: 2 }),
  distance: faker.number.float({ min: 0.1, max: 2, fractionDigits: 2 }),
  source: faker.helpers.arrayElement(['MLS', 'Zillow', 'Redfin', 'Manual']),
  special_features: faker.helpers.arrayElements(
    ['Pool', 'Garage', 'Updated Kitchen', 'New Roof'],
    { min: 0, max: 2 }
  ),
  features_json: null,
  status: 'active',
  created_by: faker.string.uuid(),
  created_at: faker.date.past({ years: 1 }).toISOString(),
  updated_at: faker.date.recent({ days: 30 }).toISOString(),
  ...overrides,
});

/**
 * Generate a mock user plan
 */
export const createMockUserPlan = (
  overrides?: Partial<MockUserPlan>
): MockUserPlan => ({
  user_id: faker.string.uuid(),
  tier: faker.helpers.arrayElement([
    'free',
    'starter',
    'personal',
    'professional',
  ]),
  status: 'active',
  monthly_token_cap: faker.number.int({ min: 1000, max: 100000 }),
  last_login: faker.date.recent({ days: 7 }).toISOString(),
  email_domain: null,
  trial_ends_at: null,
  ...overrides,
});

// Type definitions for mock data
export interface MockLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  score: number | null;
  tags: string[] | null;
  opt_status: string | null;
  workspace_id: string | null;
  is_deleted: boolean | null;
  created_at: string | null;
  updated_at: string;
  inserted_at: string;
}

export interface MockProfile {
  id: string;
  email: string;
  role: string;
  workspace_id: string | null;
  created_at: string | null;
}

export interface MockProperty {
  id: string;
  profile_id: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  lot_size: number | null;
  year_built: number | null;
  property_type: string | null;
  purchase_price: number | null;
  arv: number | null;
  mls_id: string | null;
  status: string | null;
  tags: string[] | null;
  notes: string | null;
  geo_point: unknown | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MockContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  emails: string[] | null;
  phone: string | null;
  phones: string[] | null;
  company: string | null;
  job_title: string | null;
  address: string | null;
  sms_opt_status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MockMessage {
  id: string;
  lead_id: string | null;
  channel: string;
  direction: string;
  body: string;
  subject: string | null;
  status: string;
  testing: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MockComp {
  id: string;
  property_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  lot_size: number | null;
  year_built: number | null;
  sale_price: number | null;
  sale_date: string | null;
  days_on_market: number | null;
  price_per_sqft: number | null;
  distance: number | null;
  source: string | null;
  special_features: string[] | null;
  features_json: unknown | null;
  status: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MockUserPlan {
  user_id: string;
  tier: string | null;
  status: string | null;
  monthly_token_cap: number | null;
  last_login: string | null;
  email_domain: string | null;
  trial_ends_at: string | null;
}

/**
 * Generate a mock deal
 */
export const createMockDeal = (
  overrides?: Partial<MockDeal>
): MockDeal => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  lead_id: null,
  property_id: null,
  status: faker.helpers.arrayElement(['active', 'won', 'lost', 'archived']),
  stage: faker.helpers.arrayElement([
    'new',
    'contacted',
    'appointment_set',
    'analyzing',
    'offer_sent',
    'negotiating',
    'under_contract',
    'closed_won',
    'closed_lost',
  ]),
  title: `${faker.location.streetAddress()} Deal`,
  estimated_value: faker.number.int({ min: 10000, max: 100000 }),
  probability: faker.number.int({ min: 10, max: 100 }),
  expected_close_date: faker.date.future({ years: 1 }).toISOString().split('T')[0],
  next_action: faker.helpers.arrayElement([
    'Follow up with seller',
    'Schedule property walkthrough',
    'Run comps analysis',
    'Prepare offer',
    'Negotiate terms',
    'Send to title company',
  ]),
  next_action_due: faker.date.soon({ days: 7 }).toISOString(),
  notes: faker.helpers.maybe(() => faker.lorem.paragraph()) ?? null,
  created_at: faker.date.past({ years: 1 }).toISOString(),
  updated_at: faker.date.recent({ days: 30 }).toISOString(),
  ...overrides,
});

export interface MockDeal {
  id: string;
  user_id: string;
  lead_id: string | null;
  property_id: string | null;
  status: string;
  stage: string;
  title: string;
  estimated_value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  next_action: string | null;
  next_action_due: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Generate a mock deal event (for timeline)
 */
export const createMockDealEvent = (
  overrides?: Partial<MockDealEvent>
): MockDealEvent => ({
  id: faker.string.uuid(),
  deal_id: overrides?.deal_id || faker.string.uuid(),
  event_type: faker.helpers.arrayElement([
    'stage_change',
    'next_action_set',
    'offer_created',
    'walkthrough_completed',
    'note',
  ]),
  title: faker.lorem.sentence({ min: 3, max: 6 }),
  description: faker.helpers.maybe(() => faker.lorem.sentence()) ?? undefined,
  metadata: {},
  source: faker.helpers.arrayElement(['system', 'user', 'ai']),
  created_by: faker.helpers.maybe(() => faker.string.uuid()) ?? undefined,
  created_at: faker.date.past({ years: 1 }).toISOString(),
  ...overrides,
});

export interface MockDealEvent {
  id: string;
  deal_id: string;
  event_type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  source: 'system' | 'user' | 'ai';
  created_by?: string;
  created_at: string;
}
