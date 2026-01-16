// src/features/admin/factories/testDataFactories.ts
// Zone B: Deterministic test data factories for database seeding
//
// IMPORTANT: All data is deterministic (not randomized) to enable reproducible testing.
// Each factory returns the same data for the same index, allowing consistent test scenarios.
//
// Data Distribution:
// - 80% Happy Path: Normal, expected scenarios
// - 20% Edge Cases: Boundary conditions, special characters, extreme values

import type {
  LeadInsert,
  PropertyInsert,
  DealInsert,
  ContactInsert,
  DocumentInsert,
  MessageInsert,
} from '@/integrations/supabase/types';

// ============================================================================
// LEADS DATA (50 total: 45 happy path + 5 edge cases)
// ============================================================================

const EDGE_CASE_LEADS = [
  {
    name: 'Christopher Alexander Montgomery-Wellington III',
    email: 'chris.wellington@example.com',
    phone: '512-555-9001',
    status: 'active' as const,
    score: 75,
    tags: ['buyer', 'investor'],
    opt_status: "opted_in" as const,
  },
  {
    name: 'José O\'Brien-García',
    email: 'jose.garcia@example.com',
    phone: '512-555-9002',
    
    status: 'new' as const,
    score: 85,
    tags: ['seller', 'motivated'],
    
    
    // notes: 'Special characters test: accents, apostrophes, hyphens',
  },
  {
    name: 'X',
    email: 'x@example.com',
    phone: '512-555-9003',

    status: 'active' as const,
    score: 95,
    tags: ['wholesaler'],


    // notes: 'Minimum name length test (single character)',
  },
  {
    name: '김철수',
    email: 'kim@example.com',
    phone: '512-555-9004',
    
    status: 'active' as const,
    score: 65,
    tags: ['investor', 'buyer'],
    
    
    // notes: 'Korean characters test - tests unicode handling',
  },
  {
    name: '',
    email: 'noemailtest@example.com',
    phone: '',

    status: 'inactive' as const,
    score: 5,
    tags: [],


    // notes: 'Empty contact info test - tests validation and required fields',
  },
];

const HAPPY_PATH_LEADS = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '512-555-0001',
    
    status: 'active' as const,
    score: 85,
    tags: ['seller', 'motivated'],
    
    
    // notes: 'Looking to sell investment property in Austin',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '512-555-0002',
    
    status: 'new' as const,
    score: 50,
    tags: ['buyer'],
    
    
    // notes: 'First-time buyer, pre-approved for $300k',
  },
  {
    name: 'Mike Davis',
    email: 'mike.davis@example.com',
    phone: '512-555-0003',

    status: 'active' as const,
    score: 95,
    tags: ['investor', 'wholesaler'],


    // notes: 'Active investor looking for fix-and-flip opportunities',
  },
  {
    name: 'Emily Chen',
    email: 'emily.chen@example.com',
    phone: '512-555-0004',
    
    status: 'active' as const,
    score: 75,
    tags: ['seller'],
    
    
    // notes: 'Inherited property, needs quick sale',
  },
  {
    name: 'Robert Wilson',
    email: 'rwilson@example.com',
    phone: '512-555-0005',
    
    status: 'active' as const,
    score: 65,
    tags: ['buyer', 'investor'],
    
    
    // notes: 'Looking for multi-family properties',
  },
  {
    name: 'Jessica Martinez',
    email: 'jmartinez@example.com',
    phone: '512-555-0006',
    
    status: 'new' as const,
    score: 40,
    tags: ['seller'],
    
    
    // notes: 'Downsizing, wants to sell family home',
  },
  {
    name: 'David Brown',
    email: 'dbrown@example.com',
    phone: '512-555-0007',
    
    status: 'active' as const,
    score: 85,
    tags: ['investor'],
    
    
    // notes: 'Portfolio investor, cash buyer',
  },
  {
    name: 'Jennifer Taylor',
    email: 'jtaylor@example.com',
    phone: '512-555-0008',

    status: 'active' as const,
    score: 90,
    tags: ['wholesaler', 'investor'],


    // notes: 'Experienced wholesaler with buyer list',
  },
  {
    name: 'Chris Anderson',
    email: 'canderson@example.com',
    phone: '512-555-0009',
    
    status: 'new' as const,
    score: 45,
    tags: ['buyer'],
    
    
    // notes: 'Relocating to Austin for work',
  },
  {
    name: 'Amanda White',
    email: 'awhite@example.com',
    phone: '512-555-0010',
    
    status: 'active' as const,
    score: 70,
    tags: ['seller', 'motivated'],
    
    
    // notes: 'Divorce situation, needs quick closing',
  },
  {
    name: 'Brian Miller',
    email: 'bmiller@example.com',
    phone: '512-555-0011',
    
    status: 'active' as const,
    score: 80,
    tags: ['investor', 'buyer'],
    
    
    // notes: 'Looking for rental properties under $250k',
  },
  {
    name: 'Lisa Garcia',
    email: 'lgarcia@example.com',
    phone: '512-555-0012',
    
    status: 'new' as const,
    score: 55,
    tags: ['seller'],
    
    
    // notes: 'Testing market, not urgent',
  },
  {
    name: 'Kevin Lee',
    email: 'klee@example.com',
    phone: '512-555-0013',

    status: 'inactive' as const,
    score: 25,
    tags: [],


    // notes: 'Not interested at this time',
  },
  {
    name: 'Maria Rodriguez',
    email: 'mrodriguez@example.com',
    phone: '512-555-0014',
    
    status: 'active' as const,
    score: 75,
    tags: ['buyer', 'investor'],
    
    
    // notes: 'First investment property purchase',
  },
  {
    name: 'Thomas Moore',
    email: 'tmoore@example.com',
    phone: '512-555-0015',

    status: 'active' as const,
    score: 85,
    tags: ['seller', 'motivated'],


    // notes: 'Job relocation, must sell within 60 days',
  },
  {
    name: 'Nancy Harris',
    email: 'nharris@example.com',
    phone: '512-555-0016',
    
    status: 'active' as const,
    score: 65,
    tags: ['wholesaler'],
    
    
    // notes: 'New to wholesaling, needs mentorship',
  },
  {
    name: 'Daniel Clark',
    email: 'dclark@example.com',
    phone: '512-555-0017',
    
    status: 'new' as const,
    score: 50,
    tags: ['buyer'],
    
    
    // notes: 'Exploring investment options',
  },
  {
    name: 'Karen Lewis',
    email: 'klewis@example.com',
    phone: '512-555-0018',
    
    status: 'active' as const,
    score: 70,
    tags: ['seller'],
    
    
    // notes: 'Out-of-state property owner',
  },
  {
    name: 'Jason Walker',
    email: 'jwalker@example.com',
    phone: '512-555-0019',

    status: 'active' as const,
    score: 90,
    tags: ['investor', 'buyer'],


    // notes: 'Experienced flipper, cash ready',
  },
  {
    name: 'Michelle Hall',
    email: 'mhall@example.com',
    phone: '512-555-0020',
    
    status: 'active' as const,
    score: 80,
    tags: ['seller', 'motivated'],
    
    
    // notes: 'Estate sale, executor of will',
  },
  {
    name: 'Steven Allen',
    email: 'sallen@example.com',
    phone: '512-555-0021',
    
    status: 'new' as const,
    score: 60,
    tags: ['buyer'],
    
    
    // notes: 'Looking for turnkey properties',
  },
  {
    name: 'Patricia Young',
    email: 'pyoung@example.com',
    phone: '512-555-0022',
    
    status: 'active' as const,
    score: 75,
    tags: ['investor'],
    
    
    // notes: 'Building rental portfolio',
  },
  {
    name: 'Ryan King',
    email: 'rking@example.com',
    phone: '512-555-0023',

    status: 'inactive' as const,
    score: 10,
    tags: [],


    // notes: 'Already working with another agent',
  },
  {
    name: 'Sandra Wright',
    email: 'swright@example.com',
    phone: '512-555-0024',
    
    status: 'active' as const,
    score: 85,
    tags: ['seller', 'motivated'],
    
    
    // notes: 'Pre-foreclosure situation',
  },
  {
    name: 'Mark Scott',
    email: 'mscott@example.com',
    phone: '512-555-0025',

    status: 'active' as const,
    score: 95,
    tags: ['wholesaler', 'investor'],


    // notes: 'High-volume wholesaler, strong track record',
  },
  {
    name: 'Betty Green',
    email: 'bgreen@example.com',
    phone: '512-555-0026',
    
    status: 'new' as const,
    score: 40,
    tags: ['buyer'],
    
    
    // notes: 'Just started house hunting',
  },
  {
    name: 'Paul Adams',
    email: 'padams@example.com',
    phone: '512-555-0027',
    
    status: 'active' as const,
    score: 70,
    tags: ['seller'],
    
    
    // notes: 'Upgrading to larger home',
  },
  {
    name: 'Dorothy Baker',
    email: 'dbaker@example.com',
    phone: '512-555-0028',
    
    status: 'active' as const,
    score: 65,
    tags: ['investor'],
    
    
    // notes: 'Looking for commercial properties',
  },
  {
    name: 'Andrew Nelson',
    email: 'anelson@example.com',
    phone: '512-555-0029',
    
    status: 'new' as const,
    score: 50,
    tags: ['buyer'],
    
    
    // notes: 'Military relocation',
  },
  {
    name: 'Carol Carter',
    email: 'ccarter@example.com',
    phone: '512-555-0030',

    status: 'active' as const,
    score: 80,
    tags: ['seller', 'motivated'],


    // notes: 'Retirement downsizing',
  },
  {
    name: 'Joshua Mitchell',
    email: 'jmitchell@example.com',
    phone: '512-555-0031',
    
    status: 'active' as const,
    score: 75,
    tags: ['wholesaler'],
    
    
    // notes: 'Expanding into new market',
  },
  {
    name: 'Laura Perez',
    email: 'lperez@example.com',
    phone: '512-555-0032',
    
    status: 'new' as const,
    score: 45,
    tags: ['buyer'],
    
    
    // notes: 'First-time homebuyer program participant',
  },
  {
    name: 'Kenneth Roberts',
    email: 'kroberts@example.com',
    phone: '512-555-0033',
    
    status: 'active' as const,
    score: 70,
    tags: ['investor'],
    
    
    // notes: '1031 exchange buyer',
  },
  {
    name: 'Sharon Turner',
    email: 'sturner@example.com',
    phone: '512-555-0034',

    status: 'inactive' as const,
    score: 15,
    tags: [],


    // notes: 'Credit issues, not ready to buy',
  },
  {
    name: 'Edward Phillips',
    email: 'ephillips@example.com',
    phone: '512-555-0035',
    
    status: 'active' as const,
    score: 85,
    tags: ['seller', 'motivated'],
    
    
    // notes: 'Landlord tired of managing rentals',
  },
  {
    name: 'Donna Campbell',
    email: 'dcampbell@example.com',
    phone: '512-555-0036',

    status: 'active' as const,
    score: 90,
    tags: ['investor', 'buyer'],


    // notes: 'Self-directed IRA investor',
  },
  {
    name: 'Gregory Parker',
    email: 'gparker@example.com',
    phone: '512-555-0037',
    
    status: 'new' as const,
    score: 55,
    tags: ['wholesaler'],
    
    
    // notes: 'Learning the business',
  },
  {
    name: 'Ruth Evans',
    email: 'revans@example.com',
    phone: '512-555-0038',
    
    status: 'active' as const,
    score: 75,
    tags: ['seller'],
    
    
    // notes: 'Empty nest, downsizing',
  },
  {
    name: 'Frank Edwards',
    email: 'fedwards@example.com',
    phone: '512-555-0039',
    
    status: 'active' as const,
    score: 80,
    tags: ['buyer', 'investor'],
    
    
    // notes: 'Vacation rental investor',
  },
  {
    name: 'Catherine Collins',
    email: 'ccollins@example.com',
    phone: '512-555-0040',

    status: 'active' as const,
    score: 85,
    tags: ['seller', 'motivated'],


    // notes: 'Medical emergency, needs cash quickly',
  },
  {
    name: 'Raymond Stewart',
    email: 'rstewart@example.com',
    phone: '512-555-0041',
    
    status: 'new' as const,
    score: 60,
    tags: ['buyer'],
    
    
    // notes: 'Tech worker relocation',
  },
  {
    name: 'Deborah Sanchez',
    email: 'dsanchez@example.com',
    phone: '512-555-0042',
    
    status: 'active' as const,
    score: 70,
    tags: ['investor'],
    
    
    // notes: 'Looking for value-add opportunities',
  },
  {
    name: 'Jerry Morris',
    email: 'jmorris@example.com',
    phone: '512-555-0043',

    status: 'do_not_contact' as const,
    score: 0,
    tags: [],


    // notes: 'Deal closed - no longer active',
  },
  {
    name: 'Debra Rogers',
    email: 'drogers@example.com',
    phone: '512-555-0044',
    
    status: 'active' as const,
    score: 75,
    tags: ['seller'],
    
    
    // notes: 'Inherited property in probate',
  },
  {
    name: 'Gerald Reed',
    email: 'greed@example.com',
    phone: '512-555-0045',

    status: 'do_not_contact' as const,
    score: 0,
    tags: ['buyer'],


    // notes: 'Successfully purchased property',
  },
];

/**
 * Create a deterministic test lead by index.
 * Returns the same lead data for the same index every time.
 *
 * @param index - Index (0-49) of the lead to create
 * @param userId - User ID to associate the lead with
 * @param workspaceId - Workspace ID to associate the lead with
 * @returns LeadInsert object ready for database insertion
 */
export function createTestLead(index: number, userId: string, workspaceId: string): Omit<LeadInsert, 'id' | 'created_at' | 'updated_at'> {
  const allLeads = [...HAPPY_PATH_LEADS, ...EDGE_CASE_LEADS];
  const template = allLeads[index] || allLeads[0]; // Fallback to first if out of range

  return {
    ...template,
    user_id: userId,
    workspace_id: workspaceId,
    is_deleted: false,
  };
}

// ============================================================================
// PROPERTIES DATA (20 total: 16 happy path + 4 edge cases)
// ============================================================================

const EDGE_CASE_PROPERTIES = [
  {
    address_line_1: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    property_type: "single_family",
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 500,
    year_built: 1850,
    purchase_price: 1, // $1 house
    arv: 1,
    // notes: 'Edge case: $1 house - tests minimum value handling and formatting',
  },
  {
    address_line_1: '9999 Luxury Ln',
    city: 'Austin',
    state: 'TX',
    zip: '78746',
    property_type: "single_family",
    bedrooms: 10,
    bathrooms: 12,
    square_feet: 15000,
    year_built: 2020,
    purchase_price: 50000000, // $50M mansion
    arv: 55000000,
    // notes: 'Edge case: $50M mansion - tests large number handling and formatting',
  },
  {
    address_line_1: '456 Tiny House Rd',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
    property_type: "single_family",
    bedrooms: 0,
    bathrooms: 1,
    square_feet: 200,
    year_built: 2015,
    purchase_price: 50000,
    arv: 60000,
    // notes: 'Edge case: Tiny house - tests minimum bedroom/sqft values',
  },
  {
    address_line_1: '123456789012345678901234567890123456789012345678901234567890 Very Long Street Name Boulevard',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    property_type: "single_family",
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1200,
    year_built: 2000,
    purchase_price: 200000,
    arv: 220000,
    // notes: 'Edge case: Very long address - tests UI overflow and text truncation',
  },
];

const HAPPY_PATH_PROPERTIES = [
  {
    address_line_1: '123 Oak Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1500,
    year_built: 1985,
    purchase_price: 225000,
    arv: 275000,
    notes: 'Classic starter home in central Austin',
  },
  {
    address_line_1: '456 Maple Ave',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    property_type: "single_family",
    bedrooms: 4,
    bathrooms: 2.5,
    square_feet: 2200,
    year_built: 1995,
    purchase_price: 300000,
    arv: 350000,
    // notes: 'Great family home in Dallas suburbs',
  },
  {
    address_line_1: '789 Pine Road',
    city: 'Houston',
    state: 'TX',
    zip: '77001',
    property_type: "single_family",
    bedrooms: 8,
    bathrooms: 4,
    square_feet: 3500,
    year_built: 1980,
    purchase_price: 450000,
    arv: 550000,
    // notes: 'Duplex with strong rental income',
  },
  {
    address_line_1: '321 Elm Street',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
    property_type: "single_family",
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1200,
    year_built: 2010,
    purchase_price: 250000,
    arv: 280000,
    // notes: 'Modern condo near downtown',
  },
  {
    address_line_1: '654 Birch Lane',
    city: 'San Antonio',
    state: 'TX',
    zip: '78201',
    property_type: "single_family",
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1800,
    year_built: 2000,
    purchase_price: 175000,
    arv: 210000,
    // notes: 'Move-in ready in San Antonio',
  },
  {
    address_line_1: '987 Cedar Court',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76101',
    property_type: "single_family",
    bedrooms: 3,
    bathrooms: 2.5,
    square_feet: 1600,
    year_built: 2015,
    purchase_price: 200000,
    arv: 230000,
    // notes: 'Townhouse in desirable neighborhood',
  },
  {
    address_line_1: '147 Willow Way',
    city: 'Austin',
    state: 'TX',
    zip: '78731',
    property_type: "single_family",
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 2500,
    year_built: 2005,
    purchase_price: 425000,
    arv: 500000,
    // notes: 'Large home with pool',
  },
  {
    address_line_1: '258 Spruce Drive',
    city: 'Dallas',
    state: 'TX',
    zip: '75202',
    property_type: "single_family",
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1700,
    year_built: 1990,
    purchase_price: 260000,
    arv: 300000,
    // notes: 'Great bones, needs cosmetic updates',
  },
  {
    address_line_1: '369 Ash Boulevard',
    city: 'Houston',
    state: 'TX',
    zip: '77002',
    property_type: "single_family",
    bedrooms: 6,
    bathrooms: 3,
    square_feet: 2800,
    year_built: 1975,
    purchase_price: 380000,
    arv: 450000,
    // notes: 'Triplex investment opportunity',
  },
  {
    address_line_1: '741 Hickory Street',
    city: 'San Antonio',
    state: 'TX',
    zip: '78202',
    property_type: "single_family",
    bedrooms: 2,
    bathrooms: 1,
    square_feet: 1200,
    year_built: 1960,
    purchase_price: 150000,
    arv: 180000,
    // notes: 'Fixer-upper with potential',
  },
  {
    address_line_1: '852 Walnut Circle',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76102',
    property_type: "single_family",
    bedrooms: 5,
    bathrooms: 3.5,
    square_feet: 3200,
    year_built: 2018,
    purchase_price: 550000,
    arv: 600000,
    // notes: 'Recently built executive home',
  },
  {
    address_line_1: '963 Poplar Place',
    city: 'Austin',
    state: 'TX',
    zip: '78745',
    property_type: "single_family",
    bedrooms: 4,
    bathrooms: 2,
    square_feet: 2000,
    year_built: 1985,
    purchase_price: 320000,
    arv: 380000,
    // notes: 'Fourplex near airport',
  },
  {
    address_line_1: '159 Magnolia Drive',
    city: 'Dallas',
    state: 'TX',
    zip: '75203',
    property_type: "single_family",
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1900,
    year_built: 2008,
    purchase_price: 290000,
    arv: 330000,
    // notes: 'Well-maintained family home',
  },
  {
    address_line_1: '357 Sycamore Lane',
    city: 'Houston',
    state: 'TX',
    zip: '77003',
    property_type: "single_family",
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 800,
    year_built: 2012,
    purchase_price: 180000,
    arv: 200000,
    // notes: 'High-rise condo with amenities',
  },
  {
    address_line_1: '468 Dogwood Court',
    city: 'San Antonio',
    state: 'TX',
    zip: '78203',
    property_type: "single_family",
    bedrooms: 10,
    bathrooms: 5,
    square_feet: 4000,
    year_built: 1970,
    purchase_price: 500000,
    arv: 600000,
    // notes: 'Five-unit apartment building',
  },
  {
    address_line_1: '579 Redwood Avenue',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76103',
    property_type: "single_family",
    bedrooms: 4,
    bathrooms: 2.5,
    square_feet: 2300,
    year_built: 1998,
    purchase_price: 310000,
    arv: 360000,
    // notes: 'Corner lot with large yard',
  },
];

/**
 * Create a deterministic test property by index.
 * Returns the same property data for the same index every time.
 *
 * @param index - Index (0-19) of the property to create
 * @param userId - User ID to associate the property with
 * @param workspaceId - Not used (properties don't have workspace_id)
 * @returns PropertyInsert object ready for database insertion
 */
export function createTestProperty(index: number, userId: string, workspaceId: string): Omit<PropertyInsert, 'id' | 'created_at' | 'updated_at'> {
  const allProperties = [...HAPPY_PATH_PROPERTIES, ...EDGE_CASE_PROPERTIES];
  const template = allProperties[index] || allProperties[0];

  return {
    ...template,
    user_id: userId,
    // Note: re_properties table does not have workspace_id column
    status: 'active' as const,
  };
}

// ============================================================================
// DEALS DATA (15 total: 12 happy path + 3 edge cases)
// ============================================================================

/**
 * Create a deterministic test deal linking a lead to a property.
 *
 * @param index - Index (0-14) of the deal to create
 * @param userId - User ID to associate the deal with
 * @param leadId - Lead ID to link
 * @param propertyId - Property ID to link
 * @returns DealInsert object ready for database insertion
 */
export function createTestDeal(
  index: number,
  userId: string,
  leadId: string,
  propertyId: string
): Omit<DealInsert, 'id' | 'created_at' | 'updated_at'> {
  const today = new Date();
  const futureDate = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const pastDate = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  // Edge cases (last 3 deals)
  if (index === 12) {
    return {
      user_id: userId,
      lead_id: leadId,
      property_id: propertyId,
      title: 'Low Probability Deal',
      stage: 'initial_contact',
      status: 'active' as const,
      probability: 0, // 0% probability
      expected_close_date: futureDate(90),
      // notes: 'Edge case: 0% probability - tests low confidence scenarios',
    };
  }

  if (index === 13) {
    return {
      user_id: userId,
      lead_id: leadId,
      property_id: propertyId,
      title: 'Sure Thing Deal - Under Contract',
      stage: 'initial_contact',
      status: 'active' as const,
      probability: 100, // 100% probability
      expected_close_date: futureDate(15),
      // notes: 'Edge case: 100% probability - tests sure-thing scenarios',
    };
  }

  if (index === 14) {
    return {
      user_id: userId,
      lead_id: leadId,
      property_id: propertyId,
      title: 'Past Due Deal - Negotiating',
      stage: 'initial_contact',
      status: 'active' as const,
      probability: 50,
      expected_close_date: pastDate(30), // Past due
      // notes: 'Edge case: Past due deal - tests overdue handling',
    };
  }

  // Happy path deals
  const happyPathDeals = [
    {
      title: 'New Lead - Initial Contact',
      stage: 'initial_contact',
      probability: 25,
      days_to_close: 60,
      // notes: 'New lead, initial contact made',
    },
    {
      title: 'Follow-up Scheduled',
      stage: 'initial_contact',
      probability: 50,
      days_to_close: 45,
      // notes: 'Follow-up scheduled, buyer interested',
    },
    {
      title: 'Property Tour Scheduled',
      stage: 'initial_contact',
      probability: 75,
      days_to_close: 30,
      // notes: 'Property tour scheduled for next week',
    },
    {
      title: 'Running Numbers Analysis',
      stage: 'initial_contact',
      probability: 50,
      days_to_close: 60,
      // notes: 'Running numbers on this deal',
    },
    {
      title: 'Offer Submitted',
      stage: 'initial_contact',
      probability: 75,
      days_to_close: 30,
      // notes: 'Offer submitted, awaiting response',
    },
    {
      title: 'Negotiating Final Terms',
      stage: 'initial_contact',
      probability: 95,
      days_to_close: 20,
      // notes: 'Negotiating final terms',
    },
    {
      title: 'Under Contract - Pending Inspection',
      stage: 'initial_contact',
      probability: 95,
      days_to_close: 15,
      // notes: 'Contract signed, pending inspection',
    },
    {
      title: 'Seller Financing Discussion',
      stage: 'initial_contact',
      probability: 50,
      days_to_close: 90,
      // notes: 'Seller financing terms being discussed',
    },
    {
      title: 'Initial Conversation - Went Well',
      stage: 'initial_contact',
      probability: 25,
      days_to_close: 75,
      // notes: 'Initial conversation went well',
    },
    {
      title: 'Subject-To Opportunity',
      stage: 'initial_contact',
      probability: 50,
      days_to_close: 60,
      // notes: 'Evaluating subject-to opportunity',
    },
    {
      title: 'Competitive Offer',
      stage: 'initial_contact',
      probability: 75,
      days_to_close: 25,
      // notes: 'Competitive offer submitted',
    },
    {
      title: 'Cold Lead - Low Interest',
      stage: 'initial_contact',
      probability: 5,
      days_to_close: 90,
      // notes: 'Cold lead, low initial interest',
    },
  ];

  const template = happyPathDeals[index] || happyPathDeals[0];

  return {
    user_id: userId,
    lead_id: leadId,
    property_id: propertyId,
    title: template.title,
    stage: template.stage,
    status: 'active' as const,
    probability: template.probability,
    expected_close_date: futureDate(template.days_to_close),
    // notes: template.notes,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the total number of test leads available
 */
export function getTestLeadCount(): number {
  return HAPPY_PATH_LEADS.length + EDGE_CASE_LEADS.length;
}

/**
 * Get the total number of test properties available
 */
export function getTestPropertyCount(): number {
  return HAPPY_PATH_PROPERTIES.length + EDGE_CASE_PROPERTIES.length;
}

/**
 * Get the recommended number of test deals to create
 */
export function getTestDealCount(): number {
  return 15;
}
