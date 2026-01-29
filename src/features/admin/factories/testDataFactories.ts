// src/features/admin/factories/testDataFactories.ts
// Zone B: Deterministic test data factories for database seeding
//
// IMPORTANT: All data is deterministic (not randomized) to enable reproducible testing.
// Each factory returns the same data for the same index, allowing consistent test scenarios.
//
// Data Distribution:
// - 80% Happy Path: Normal, expected scenarios
// - 20% Edge Cases: Boundary conditions, special characters, extreme values

import type { TablesInsert } from '@/integrations/supabase/types';
import type { CaptureItemType, CaptureItemStatus } from '@/features/capture/types';
import type {
  InvestorChannel,
  InvestorConversationStatus,
  InvestorSender,
  MessageDirection,
  AIQueueStatus,
} from '@/features/lead-inbox/types/investor-conversations.types';

// Type aliases for cleaner function signatures
type LeadInsert = TablesInsert<'crm_leads'>;
type PropertyInsert = TablesInsert<'re_properties'>;
type DealInsert = TablesInsert<'deals'>;

// ============================================================================
// LEADS DATA (60 total: 48 happy path + 12 edge cases)
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
    // Edge: Special characters test - accents, apostrophes, hyphens
  },
  {
    name: 'X',
    email: 'x@example.com',
    phone: '512-555-9003',
    status: 'active' as const,
    score: 95,
    tags: ['wholesaler'],
    // Edge: Minimum name length test (single character)
  },
  {
    name: '김철수',
    email: 'kim@example.com',
    phone: '512-555-9004',
    status: 'active' as const,
    score: 65,
    tags: ['investor', 'buyer'],
    // Edge: Korean characters test - tests unicode handling
  },
  {
    name: '',
    email: 'noemailtest@example.com',
    phone: '',
    status: 'inactive' as const,
    score: 5,
    tags: [],
    // Edge: Empty contact info test - tests validation and required fields
  },
  {
    name: 'Zero Score Lead',
    email: 'zeroscore@example.com',
    phone: '512-555-9005',
    status: 'new' as const,
    score: 0,
    tags: ['seller'],
    // Edge: Zero score - tests minimum score boundary
  },
  {
    name: 'Perfect Score Lead',
    email: 'perfect@example.com',
    phone: '512-555-9006',
    status: 'active' as const,
    score: 100,
    tags: ['buyer', 'investor', 'motivated'],
    // Edge: Maximum score of 100 - tests maximum score boundary
  },
  {
    name: 'DNC Status Lead',
    email: 'dnc-status@example.com',
    phone: '512-555-9007',
    status: 'do_not_contact' as const,
    score: 0,
    tags: [],
    opt_status: 'opted_out' as const,
    // Edge: do_not_contact status - tests filtering and display
  },
  {
    name: 'Very Long Email Address Person',
    email: 'this.is.a.very.extremely.long.email.address.for.testing.purposes.and.ui.overflow@example-domain-that-is-also-quite-long.com',
    phone: '512-555-9008',
    status: 'active' as const,
    score: 50,
    tags: ['buyer'],
    // Edge: Very long email - tests UI overflow and text truncation
  },
  {
    name: 'International Phone Format',
    email: 'intl@example.com',
    phone: '+44 20 7946 0958',
    status: 'active' as const,
    score: 70,
    tags: ['investor'],
    // Edge: International phone format - tests phone parsing
  },
  {
    name: '<script>alert("test")</script>',
    email: 'xss-test@example.com',
    phone: '512-555-9010',
    status: 'inactive' as const,
    score: 1,
    tags: ['test'],
    // SECURITY TEST: XSS injection attempt in user-facing field
    // Verifies that UI components properly escape HTML when rendering lead names.
    // If this causes a script to execute in the browser, XSS protection is broken.
  },
  {
    name: '🏠 Emoji Seller 🔥',
    email: 'emoji@example.com',
    phone: '512-555-9011',
    status: 'active' as const,
    score: 88,
    tags: ['seller', 'motivated'],
    // Edge: Emoji in name - tests unicode emoji handling
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
  },
  {
    name: 'Victoria Hughes',
    email: 'vhughes@example.com',
    phone: '512-555-0046',
    status: 'active' as const,
    score: 78,
    tags: ['seller', 'investor'],
  },
  {
    name: 'Walter Price',
    email: 'wprice@example.com',
    phone: '512-555-0047',
    status: 'new' as const,
    score: 55,
    tags: ['buyer'],
  },
  {
    name: 'Helen Richardson',
    email: 'hrichardson@example.com',
    phone: '512-555-0048',
    status: 'active' as const,
    score: 82,
    tags: ['wholesaler', 'investor'],
  },
];

/**
 * Create a deterministic test lead by index.
 * Returns the same lead data for the same index every time.
 *
 * @param index - Index (0-59) of the lead to create
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
// PROPERTIES DATA (100 total: 80 happy path + 20 edge cases)
// ============================================================================

/**
 * Template interface for property test data.
 * year_built is nullable to support testing null/missing values.
 */
interface PropertyTemplate {
  address_line_1: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  year_built: number | null;
  purchase_price: number;
  arv: number;
  notes?: string;
  primary_image_url?: string;
}

// Unsplash real estate photos for property listings
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', // Modern white house
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', // Suburban home
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', // Luxury home exterior
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', // Modern house pool
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', // Contemporary home
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80', // Ranch style home
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80', // Classic American home
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', // Luxury villa
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80', // Modern minimal
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', // Craftsman home
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80', // Two-story home
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', // Colonial style
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80', // Red door house
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80', // Modern architecture
  'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=800&q=80', // Brick home
  'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800&q=80', // House with garage
  'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&q=80', // Night shot
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80', // Kitchen interior
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80', // Living room
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', // Modern facade
];

const EDGE_CASE_PROPERTIES: PropertyTemplate[] = [
  {
    address_line_1: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    property_type: 'single_family',
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 500,
    year_built: 1850,
    purchase_price: 1, // $1 house
    arv: 1,
    // Edge: $1 house - tests minimum value handling
  },
  {
    address_line_1: '9999 Luxury Ln',
    city: 'Austin',
    state: 'TX',
    zip: '78746',
    property_type: 'single_family',
    bedrooms: 10,
    bathrooms: 12,
    square_feet: 15000,
    year_built: 2020,
    purchase_price: 50000000, // $50M mansion
    arv: 55000000,
    // Edge: $50M mansion - tests large numbers
  },
  {
    address_line_1: '456 Tiny House Rd',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
    property_type: 'single_family',
    bedrooms: 0,
    bathrooms: 1,
    square_feet: 200,
    year_built: 2015,
    purchase_price: 50000,
    arv: 60000,
    // Edge: 0 bedrooms tiny house
  },
  {
    address_line_1: '123456789012345678901234567890123456789012345678901234567890 Very Long Street Name Boulevard',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    property_type: 'single_family',
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1200,
    year_built: 2000,
    purchase_price: 200000,
    arv: 220000,
    // Edge: Very long address - UI overflow test
  },
  {
    address_line_1: '0 Null Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    property_type: 'single_family',
    bedrooms: 0,
    bathrooms: 0,
    square_feet: 0,
    year_built: null,  // Edge case: null year_built tests missing data handling
    purchase_price: 0,
    arv: 0,
    // Edge: All zeros, null year_built
  },
  {
    address_line_1: '999 Future St',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1800,
    year_built: 2030,
    purchase_price: 350000,
    arv: 400000,
    // Edge: Future year_built - tests date validation
  },
  {
    address_line_1: '1 Ancient Rd',
    city: 'Houston',
    state: 'TX',
    zip: '77001',
    property_type: 'single_family',
    bedrooms: 2,
    bathrooms: 1,
    square_feet: 900,
    year_built: 1800,
    purchase_price: 75000,
    arv: 100000,
    // Edge: Very old property (1800)
  },
  {
    address_line_1: '500 Half Bath Ln',
    city: 'San Antonio',
    state: 'TX',
    zip: '78201',
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 0.5,
    square_feet: 1000,
    year_built: 1950,
    purchase_price: 95000,
    arv: 120000,
    // Edge: Only half bath (0.5 bathrooms)
  },
  {
    address_line_1: '100 Bathroom Ave',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76101',
    property_type: 'single_family',
    bedrooms: 8,
    bathrooms: 10,
    square_feet: 8000,
    year_built: 2010,
    purchase_price: 2000000,
    arv: 2500000,
    // Edge: Many bathrooms (10)
  },
  {
    address_line_1: 'Unit #123-A, Building 5',
    city: 'Austin',
    state: 'TX',
    zip: '78702',
    property_type: 'single_family',
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1100,
    year_built: 2015,
    purchase_price: 275000,
    arv: 300000,
    // Edge: Complex address with unit number
  },
  {
    address_line_1: '🏠 Emoji House 🏡',
    city: 'Dallas',
    state: 'TX',
    zip: '75202',
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1500,
    year_built: 2000,
    purchase_price: 250000,
    arv: 280000,
    // Edge: Emoji in address - unicode handling
  },
  {
    address_line_1: '42 Negative Rd',
    city: 'Houston',
    state: 'TX',
    zip: '77002',
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1600,
    year_built: 1990,
    purchase_price: 150000,
    arv: 100000, // ARV less than purchase price
    // Edge: Negative equity (ARV < purchase price)
  },
  {
    address_line_1: '1 Decimal Test',
    city: 'San Antonio',
    state: 'TX',
    zip: '78202',
    property_type: 'single_family',
    bedrooms: 4,
    bathrooms: 3.75,
    square_feet: 2500,
    year_built: 2005,
    purchase_price: 399999.99,
    arv: 449999.99,
    // Edge: Decimal prices and 3/4 bath
  },
  {
    address_line_1: '10000 Big Sqft Dr',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76102',
    property_type: 'single_family',
    bedrooms: 12,
    bathrooms: 8,
    square_feet: 25000,
    year_built: 2015,
    purchase_price: 5000000,
    arv: 6000000,
    // Edge: Very large sqft (25,000)
  },
  {
    address_line_1: "O'Brien's Property",
    city: 'Austin',
    state: 'TX',
    zip: '78703',
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1700,
    year_built: 1985,
    purchase_price: 310000,
    arv: 350000,
    // SECURITY TEST: Apostrophe in address - tests SQL parameterization
    // Single quotes can break SQL if not properly escaped/parameterized.
    // Supabase uses parameterized queries, but this verifies correct handling.
  },
  {
    address_line_1: '"; DROP TABLE properties; --',
    city: 'Dallas',
    state: 'TX',
    zip: '75203',
    property_type: 'single_family',
    bedrooms: 2,
    bathrooms: 1,
    square_feet: 1000,
    year_built: 1995,
    purchase_price: 150000,
    arv: 175000,
    // SECURITY TEST: SQL injection attempt in address field
    // Classic Bobby Tables attack vector. If database queries are vulnerable,
    // this could execute malicious SQL. Supabase RLS + parameterized queries protect against this.
  },
  {
    address_line_1: '777 Lucky St',
    city: 'Houston',
    state: 'TX',
    zip: '77003',
    property_type: 'single_family',
    bedrooms: 7,
    bathrooms: 7,
    square_feet: 7777,
    year_built: 1977,
    purchase_price: 777777,
    arv: 877777,
    // Edge: All 7s - pattern testing
  },
  {
    address_line_1: '1234567890 Numbers Only St',
    city: 'San Antonio',
    state: 'TX',
    zip: '78203',
    property_type: 'single_family',
    bedrooms: 5,
    bathrooms: 4,
    square_feet: 3000,
    year_built: 2012,
    purchase_price: 425000,
    arv: 500000,
    // Edge: Long numeric street number
  },
  {
    address_line_1: 'PO Box 123',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76103',
    property_type: 'single_family',
    bedrooms: 0,
    bathrooms: 0,
    square_feet: 0,
    year_built: 2020,
    purchase_price: 100000,
    arv: 150000,
    // Edge: PO Box as address (unusual)
  },
  {
    address_line_1: '1 Whitespace   Test   Street',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
    property_type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1400,
    year_built: 1999,
    purchase_price: 225000,
    arv: 260000,
    // Edge: Multiple whitespaces in address
  },
];

const HAPPY_PATH_PROPERTIES: PropertyTemplate[] = [
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
    property_type: 'single_family',
    bedrooms: 4,
    bathrooms: 2.5,
    square_feet: 2300,
    year_built: 1998,
    purchase_price: 310000,
    arv: 360000,
  },
  // Additional properties 17-80 (64 more)
  { address_line_1: '100 Pecan Way', city: 'Austin', state: 'TX', zip: '78705', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1650, year_built: 1992, purchase_price: 285000, arv: 335000 },
  { address_line_1: '101 Mesquite Dr', city: 'Dallas', state: 'TX', zip: '75204', property_type: 'single_family', bedrooms: 4, bathrooms: 3, square_feet: 2400, year_built: 2005, purchase_price: 375000, arv: 425000 },
  { address_line_1: '102 Bluebonnet Ln', city: 'Houston', state: 'TX', zip: '77004', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1800, year_built: 1988, purchase_price: 245000, arv: 290000 },
  { address_line_1: '103 Hackberry St', city: 'San Antonio', state: 'TX', zip: '78204', property_type: 'single_family', bedrooms: 2, bathrooms: 1, square_feet: 1100, year_built: 1965, purchase_price: 135000, arv: 170000 },
  { address_line_1: '104 Cypress Ct', city: 'Fort Worth', state: 'TX', zip: '76104', property_type: 'single_family', bedrooms: 5, bathrooms: 3, square_feet: 2800, year_built: 2012, purchase_price: 445000, arv: 510000 },
  { address_line_1: '105 Live Oak Blvd', city: 'Plano', state: 'TX', zip: '75023', property_type: 'single_family', bedrooms: 4, bathrooms: 2.5, square_feet: 2200, year_built: 2000, purchase_price: 385000, arv: 440000 },
  { address_line_1: '106 Cottonwood Ave', city: 'Arlington', state: 'TX', zip: '76010', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1500, year_built: 1985, purchase_price: 225000, arv: 270000 },
  { address_line_1: '107 Magnolia Pl', city: 'Irving', state: 'TX', zip: '75060', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1700, year_built: 1990, purchase_price: 265000, arv: 310000 },
  { address_line_1: '108 Peachtree Rd', city: 'Garland', state: 'TX', zip: '75040', property_type: 'single_family', bedrooms: 4, bathrooms: 2, square_feet: 1900, year_built: 1982, purchase_price: 245000, arv: 295000 },
  { address_line_1: '109 Juniper Way', city: 'Frisco', state: 'TX', zip: '75034', property_type: 'single_family', bedrooms: 5, bathrooms: 4, square_feet: 3200, year_built: 2015, purchase_price: 525000, arv: 595000 },
  { address_line_1: '110 Mulberry Dr', city: 'Austin', state: 'TX', zip: '78721', property_type: 'single_family', bedrooms: 2, bathrooms: 1, square_feet: 950, year_built: 1958, purchase_price: 175000, arv: 225000 },
  { address_line_1: '111 Aspen Rd', city: 'Dallas', state: 'TX', zip: '75205', property_type: 'single_family', bedrooms: 4, bathrooms: 3.5, square_feet: 2900, year_built: 2008, purchase_price: 485000, arv: 550000 },
  { address_line_1: '112 Chestnut St', city: 'Houston', state: 'TX', zip: '77005', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1600, year_built: 1975, purchase_price: 295000, arv: 350000 },
  { address_line_1: '113 Laurel Ln', city: 'San Antonio', state: 'TX', zip: '78205', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1450, year_built: 1995, purchase_price: 195000, arv: 240000 },
  { address_line_1: '114 Acacia Ave', city: 'Fort Worth', state: 'TX', zip: '76105', property_type: 'single_family', bedrooms: 4, bathrooms: 2, square_feet: 2000, year_built: 1988, purchase_price: 275000, arv: 325000 },
  { address_line_1: '115 Mimosa Ct', city: 'McKinney', state: 'TX', zip: '75069', property_type: 'single_family', bedrooms: 4, bathrooms: 3, square_feet: 2600, year_built: 2010, purchase_price: 395000, arv: 455000 },
  { address_line_1: '116 Dogwood Ln', city: 'Round Rock', state: 'TX', zip: '78664', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1750, year_built: 2003, purchase_price: 315000, arv: 365000 },
  { address_line_1: '117 Hawthorn St', city: 'Denton', state: 'TX', zip: '76201', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1550, year_built: 1998, purchase_price: 245000, arv: 290000 },
  { address_line_1: '118 Sweetgum Dr', city: 'Waco', state: 'TX', zip: '76701', property_type: 'single_family', bedrooms: 3, bathrooms: 1.5, square_feet: 1400, year_built: 1972, purchase_price: 165000, arv: 205000 },
  { address_line_1: '119 Redbud Way', city: 'Austin', state: 'TX', zip: '78722', property_type: 'single_family', bedrooms: 2, bathrooms: 2, square_feet: 1200, year_built: 2018, purchase_price: 325000, arv: 375000 },
  { address_line_1: '120 Catalpa Rd', city: 'Dallas', state: 'TX', zip: '75206', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1850, year_built: 1960, purchase_price: 315000, arv: 385000 },
  { address_line_1: '121 Locust Ave', city: 'Houston', state: 'TX', zip: '77006', property_type: 'single_family', bedrooms: 4, bathrooms: 2.5, square_feet: 2100, year_built: 2002, purchase_price: 365000, arv: 420000 },
  { address_line_1: '122 Persimmon Pl', city: 'San Antonio', state: 'TX', zip: '78206', property_type: 'single_family', bedrooms: 2, bathrooms: 1, square_feet: 900, year_built: 1955, purchase_price: 115000, arv: 155000 },
  { address_line_1: '123 Sassafras Ct', city: 'Fort Worth', state: 'TX', zip: '76106', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1650, year_built: 1993, purchase_price: 235000, arv: 280000 },
  { address_line_1: '124 Sumac St', city: 'Lewisville', state: 'TX', zip: '75067', property_type: 'single_family', bedrooms: 4, bathrooms: 2.5, square_feet: 2300, year_built: 2007, purchase_price: 335000, arv: 390000 },
  { address_line_1: '125 Tupelo Dr', city: 'Cedar Park', state: 'TX', zip: '78613', property_type: 'single_family', bedrooms: 4, bathrooms: 3, square_feet: 2500, year_built: 2011, purchase_price: 405000, arv: 465000 },
  { address_line_1: '126 Boxwood Ln', city: 'Carrollton', state: 'TX', zip: '75006', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1600, year_built: 1986, purchase_price: 275000, arv: 320000 },
  { address_line_1: '127 Alder Way', city: 'Killeen', state: 'TX', zip: '76541', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1350, year_built: 2000, purchase_price: 175000, arv: 215000 },
  { address_line_1: '128 Buckeye Rd', city: 'Austin', state: 'TX', zip: '78723', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1500, year_built: 1978, purchase_price: 295000, arv: 355000 },
  { address_line_1: '129 Beech Ave', city: 'Dallas', state: 'TX', zip: '75207', property_type: 'single_family', bedrooms: 5, bathrooms: 3, square_feet: 2700, year_built: 2014, purchase_price: 475000, arv: 540000 },
  { address_line_1: '130 Fir St', city: 'Houston', state: 'TX', zip: '77007', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1700, year_built: 1990, purchase_price: 285000, arv: 340000 },
  { address_line_1: '131 Ginkgo Ct', city: 'San Antonio', state: 'TX', zip: '78207', property_type: 'single_family', bedrooms: 4, bathrooms: 2, square_feet: 1800, year_built: 1983, purchase_price: 205000, arv: 255000 },
  { address_line_1: '132 Hemlock Pl', city: 'Fort Worth', state: 'TX', zip: '76107', property_type: 'single_family', bedrooms: 3, bathrooms: 2.5, square_feet: 1950, year_built: 2001, purchase_price: 295000, arv: 345000 },
  { address_line_1: '133 Ironwood Dr', city: 'Allen', state: 'TX', zip: '75002', property_type: 'single_family', bedrooms: 4, bathrooms: 3, square_feet: 2800, year_built: 2013, purchase_price: 445000, arv: 505000 },
  { address_line_1: '134 Larch Ln', city: 'Georgetown', state: 'TX', zip: '78626', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1600, year_built: 2005, purchase_price: 305000, arv: 355000 },
  { address_line_1: '135 Mahogany St', city: 'Sugar Land', state: 'TX', zip: '77478', property_type: 'single_family', bedrooms: 4, bathrooms: 3.5, square_feet: 3100, year_built: 2016, purchase_price: 495000, arv: 560000 },
  { address_line_1: '136 Nutmeg Way', city: 'Pearland', state: 'TX', zip: '77581', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1750, year_built: 2008, purchase_price: 285000, arv: 335000 },
  { address_line_1: '137 Olive Rd', city: 'Austin', state: 'TX', zip: '78724', property_type: 'single_family', bedrooms: 2, bathrooms: 1, square_feet: 1050, year_built: 1962, purchase_price: 215000, arv: 275000 },
  { address_line_1: '138 Palm Ave', city: 'Dallas', state: 'TX', zip: '75208', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1550, year_built: 1976, purchase_price: 265000, arv: 320000 },
  { address_line_1: '139 Quince Ct', city: 'Houston', state: 'TX', zip: '77008', property_type: 'single_family', bedrooms: 4, bathrooms: 2, square_feet: 1900, year_built: 1985, purchase_price: 325000, arv: 385000 },
  { address_line_1: '140 Rosewood Pl', city: 'San Antonio', state: 'TX', zip: '78208', property_type: 'single_family', bedrooms: 3, bathrooms: 1.5, square_feet: 1300, year_built: 1970, purchase_price: 145000, arv: 190000 },
  { address_line_1: '141 Sandalwood Dr', city: 'Fort Worth', state: 'TX', zip: '76108', property_type: 'single_family', bedrooms: 5, bathrooms: 3, square_feet: 2600, year_built: 2009, purchase_price: 375000, arv: 435000 },
  { address_line_1: '142 Tamarind Ln', city: 'Flower Mound', state: 'TX', zip: '75028', property_type: 'single_family', bedrooms: 4, bathrooms: 3, square_feet: 2700, year_built: 2012, purchase_price: 425000, arv: 485000 },
  { address_line_1: '143 Umbrella Way', city: 'Pflugerville', state: 'TX', zip: '78660', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1650, year_built: 2006, purchase_price: 305000, arv: 355000 },
  { address_line_1: '144 Vine St', city: 'Richardson', state: 'TX', zip: '75080', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1700, year_built: 1992, purchase_price: 315000, arv: 365000 },
  { address_line_1: '145 Walnut Rd', city: 'Temple', state: 'TX', zip: '76501', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1500, year_built: 1997, purchase_price: 185000, arv: 225000 },
  { address_line_1: '146 Yew Ave', city: 'Austin', state: 'TX', zip: '78725', property_type: 'single_family', bedrooms: 4, bathrooms: 2.5, square_feet: 2100, year_built: 2004, purchase_price: 365000, arv: 420000 },
  { address_line_1: '147 Zelkova Ct', city: 'Dallas', state: 'TX', zip: '75209', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1600, year_built: 1968, purchase_price: 295000, arv: 355000 },
  { address_line_1: '148 Bayberry Pl', city: 'Houston', state: 'TX', zip: '77009', property_type: 'single_family', bedrooms: 2, bathrooms: 2, square_feet: 1400, year_built: 2015, purchase_price: 335000, arv: 385000 },
  { address_line_1: '149 Cranberry Dr', city: 'San Antonio', state: 'TX', zip: '78209', property_type: 'single_family', bedrooms: 4, bathrooms: 2.5, square_feet: 2200, year_built: 2001, purchase_price: 275000, arv: 330000 },
  { address_line_1: '150 Dewberry Ln', city: 'Fort Worth', state: 'TX', zip: '76109', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1550, year_built: 1995, purchase_price: 255000, arv: 305000 },
  { address_line_1: '151 Elderberry St', city: 'Keller', state: 'TX', zip: '76248', property_type: 'single_family', bedrooms: 4, bathrooms: 3, square_feet: 2500, year_built: 2010, purchase_price: 395000, arv: 455000 },
  { address_line_1: '152 Fern Way', city: 'Hutto', state: 'TX', zip: '78634', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1700, year_built: 2014, purchase_price: 295000, arv: 345000 },
  { address_line_1: '153 Goldenrod Rd', city: 'The Woodlands', state: 'TX', zip: '77380', property_type: 'single_family', bedrooms: 5, bathrooms: 4, square_feet: 3500, year_built: 2008, purchase_price: 585000, arv: 660000 },
  { address_line_1: '154 Holly Ave', city: 'League City', state: 'TX', zip: '77573', property_type: 'single_family', bedrooms: 4, bathrooms: 2.5, square_feet: 2300, year_built: 2011, purchase_price: 345000, arv: 400000 },
  { address_line_1: '155 Ivy Ct', city: 'Austin', state: 'TX', zip: '78726', property_type: 'single_family', bedrooms: 4, bathrooms: 3, square_feet: 2800, year_built: 2017, purchase_price: 495000, arv: 560000 },
  { address_line_1: '156 Jasmine Pl', city: 'Dallas', state: 'TX', zip: '75210', property_type: 'single_family', bedrooms: 2, bathrooms: 1, square_feet: 1000, year_built: 1952, purchase_price: 165000, arv: 220000 },
  { address_line_1: '157 Kiwi Dr', city: 'Houston', state: 'TX', zip: '77010', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1600, year_built: 1988, purchase_price: 275000, arv: 330000 },
  { address_line_1: '158 Lilac Ln', city: 'San Antonio', state: 'TX', zip: '78210', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1450, year_built: 1979, purchase_price: 185000, arv: 235000 },
  { address_line_1: '159 Marigold St', city: 'Fort Worth', state: 'TX', zip: '76110', property_type: 'single_family', bedrooms: 4, bathrooms: 2, square_feet: 1800, year_built: 1996, purchase_price: 265000, arv: 315000 },
  { address_line_1: '160 Nasturtium Way', city: 'Southlake', state: 'TX', zip: '76092', property_type: 'single_family', bedrooms: 5, bathrooms: 4.5, square_feet: 4200, year_built: 2005, purchase_price: 725000, arv: 820000 },
  { address_line_1: '161 Orchid Rd', city: 'Buda', state: 'TX', zip: '78610', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1600, year_built: 2013, purchase_price: 305000, arv: 355000 },
  { address_line_1: '162 Pansy Ave', city: 'Mesquite', state: 'TX', zip: '75149', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1550, year_built: 1984, purchase_price: 225000, arv: 275000 },
  { address_line_1: '163 Quince Ct', city: 'Conroe', state: 'TX', zip: '77301', property_type: 'single_family', bedrooms: 4, bathrooms: 2.5, square_feet: 2100, year_built: 2007, purchase_price: 295000, arv: 350000 },
  { address_line_1: '164 Rose Pl', city: 'Austin', state: 'TX', zip: '78727', property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1700, year_built: 2000, purchase_price: 345000, arv: 400000 },
];

/**
 * Create a deterministic test property by index.
 * Returns the same property data for the same index every time.
 *
 * @param index - Index (0-99) of the property to create
 * @param userId - User ID to associate the property with
 * @param workspaceId - Not used (properties don't have workspace_id)
 * @param leadId - Optional lead ID to link the property to a seller
 * @returns PropertyInsert object ready for database insertion
 */
export function createTestProperty(
  index: number,
  userId: string,
  workspaceId: string,
  leadId?: string
): Omit<PropertyInsert, 'id' | 'created_at' | 'updated_at'> {
  const allProperties = [...HAPPY_PATH_PROPERTIES, ...EDGE_CASE_PROPERTIES];
  const template = allProperties[index] || allProperties[0];

  // Assign an Unsplash image based on index (cycle through available images)
  const imageIndex = index % PROPERTY_IMAGES.length;
  const primary_image_url = PROPERTY_IMAGES[imageIndex];

  return {
    ...template,
    user_id: userId,
    lead_id: leadId,
    primary_image_url,
    // Note: re_properties table does not have workspace_id column
    status: 'active' as const,
  };
}

// ============================================================================
// DEALS DATA (50 total: 40 happy path + 10 edge cases)
// ============================================================================

/**
 * Create a deterministic test deal linking a lead to a property.
 *
 * @param index - Index (0-49) of the deal to create
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

  // Edge cases (last 10 deals: index 40-49)
  if (index === 40) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: 'Zero Probability Deal',
      stage: 'initial_contact', status: 'active' as const,
      probability: 0,
      expected_close_date: futureDate(90),
    };
  }
  if (index === 41) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: 'Sure Thing - 100% Probability',
      stage: 'initial_contact', status: 'active' as const,
      probability: 100,
      expected_close_date: futureDate(15),
    };
  }
  if (index === 42) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: 'Past Due Deal',
      stage: 'initial_contact', status: 'active' as const,
      probability: 50,
      expected_close_date: pastDate(30),
    };
  }
  if (index === 43) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: 'Very Past Due - 90 Days',
      stage: 'initial_contact', status: 'active' as const,
      probability: 25,
      expected_close_date: pastDate(90),
    };
  }
  if (index === 44) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: 'Closing Today',
      stage: 'initial_contact', status: 'active' as const,
      probability: 99,
      expected_close_date: futureDate(0),
    };
  }
  if (index === 45) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: 'Long Term Deal - 1 Year Out',
      stage: 'initial_contact', status: 'active' as const,
      probability: 10,
      expected_close_date: futureDate(365),
    };
  }
  if (index === 46) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: '1% Probability - Nearly Dead',
      stage: 'initial_contact', status: 'active' as const,
      probability: 1,
      expected_close_date: futureDate(120),
    };
  }
  if (index === 47) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: 'Closing Tomorrow',
      stage: 'initial_contact', status: 'active' as const,
      probability: 95,
      expected_close_date: futureDate(1),
    };
  }
  if (index === 48) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: 'Very Long Title That Goes On And On For Testing UI Truncation And Overflow Behavior In Cards And Lists',
      stage: 'initial_contact', status: 'active' as const,
      probability: 50,
      expected_close_date: futureDate(45),
    };
  }
  if (index === 49) {
    return {
      user_id: userId, lead_id: leadId, property_id: propertyId,
      title: '🔥 Emoji Deal 🏠',
      stage: 'initial_contact', status: 'active' as const,
      probability: 75,
      expected_close_date: futureDate(30),
    };
  }

  // Discriminated union types for deal templates
  // Deal status values: 'active' | 'won' | 'lost' | 'archived' (from DB constraint)
  interface ClosedDealTemplate {
    readonly _type: 'closed';
    title: string;
    stage: 'closed_won';
    probability: 100;
    days_ago: number;
  }

  interface ActiveDealTemplate {
    readonly _type: 'active';
    title: string;
    stage: string;
    probability: number;
    days_to_close: number;
  }

  type DealTemplate = ClosedDealTemplate | ActiveDealTemplate;

  function isClosedDealTemplate(template: DealTemplate): template is ClosedDealTemplate {
    return template._type === 'closed';
  }

  // Happy path deals (40 total)
  // First 8 deals are closed_won for Portfolio tab display
  const happyPathDeals: DealTemplate[] = [
    { _type: 'closed', title: 'Closed - Oak Street Flip', stage: 'closed_won', probability: 100, days_ago: 45 },
    { _type: 'closed', title: 'Closed - Maple Ave Rental', stage: 'closed_won', probability: 100, days_ago: 30 },
    { _type: 'closed', title: 'Closed - Pine Road Wholesale', stage: 'closed_won', probability: 100, days_ago: 60 },
    { _type: 'closed', title: 'Closed - Cedar Lane BRRRR', stage: 'closed_won', probability: 100, days_ago: 15 },
    { _type: 'closed', title: 'Closed - Birch Street Rehab', stage: 'closed_won', probability: 100, days_ago: 90 },
    { _type: 'closed', title: 'Closed - Elm Court Subject-To', stage: 'closed_won', probability: 100, days_ago: 20 },
    { _type: 'closed', title: 'Closed - Spruce Way Duplex', stage: 'closed_won', probability: 100, days_ago: 75 },
    { _type: 'closed', title: 'Closed - Willow Drive Portfolio', stage: 'closed_won', probability: 100, days_ago: 10 },
    // Active deals start here (index 8+)
    { _type: 'active', title: 'Initial Conversation - Went Well', stage: 'initial_contact', probability: 25, days_to_close: 75 },
    { _type: 'active', title: 'Subject-To Opportunity', stage: 'initial_contact', probability: 50, days_to_close: 60 },
    { _type: 'active', title: 'Competitive Offer', stage: 'initial_contact', probability: 75, days_to_close: 25 },
    { _type: 'active', title: 'Cold Lead - Low Interest', stage: 'initial_contact', probability: 5, days_to_close: 90 },
    // Additional 28 happy path deals
    { _type: 'active', title: 'Motivated Seller - Quick Close', stage: 'initial_contact', probability: 85, days_to_close: 14 },
    { _type: 'active', title: 'Probate Property Analysis', stage: 'initial_contact', probability: 40, days_to_close: 75 },
    { _type: 'active', title: 'Foreclosure Opportunity', stage: 'initial_contact', probability: 60, days_to_close: 45 },
    { _type: 'active', title: 'REO Bank Property', stage: 'initial_contact', probability: 55, days_to_close: 60 },
    { _type: 'active', title: 'Wholesale Deal Pipeline', stage: 'initial_contact', probability: 70, days_to_close: 21 },
    { _type: 'active', title: 'Fix and Flip Candidate', stage: 'initial_contact', probability: 65, days_to_close: 35 },
    { _type: 'active', title: 'Buy and Hold Rental', stage: 'initial_contact', probability: 55, days_to_close: 50 },
    { _type: 'active', title: 'Multi-Family Acquisition', stage: 'initial_contact', probability: 45, days_to_close: 90 },
    { _type: 'active', title: 'Commercial Conversion', stage: 'initial_contact', probability: 35, days_to_close: 120 },
    { _type: 'active', title: 'Lease Option Negotiation', stage: 'initial_contact', probability: 50, days_to_close: 60 },
    { _type: 'active', title: 'Short Sale in Progress', stage: 'initial_contact', probability: 30, days_to_close: 90 },
    { _type: 'active', title: 'Estate Sale Processing', stage: 'initial_contact', probability: 55, days_to_close: 45 },
    { _type: 'active', title: 'Divorce Settlement Deal', stage: 'initial_contact', probability: 65, days_to_close: 30 },
    { _type: 'active', title: 'Relocation Seller', stage: 'initial_contact', probability: 80, days_to_close: 21 },
    { _type: 'active', title: 'Tired Landlord Exit', stage: 'initial_contact', probability: 70, days_to_close: 40 },
    { _type: 'active', title: 'Portfolio Purchase', stage: 'initial_contact', probability: 45, days_to_close: 75 },
    { _type: 'active', title: '1031 Exchange Buyer', stage: 'initial_contact', probability: 60, days_to_close: 45 },
    { _type: 'active', title: 'Vacant Property Opportunity', stage: 'initial_contact', probability: 55, days_to_close: 50 },
    { _type: 'active', title: 'Code Violation Property', stage: 'initial_contact', probability: 40, days_to_close: 60 },
    { _type: 'active', title: 'Tax Lien Property', stage: 'initial_contact', probability: 35, days_to_close: 90 },
    { _type: 'active', title: 'Absentee Owner Outreach', stage: 'initial_contact', probability: 20, days_to_close: 120 },
    { _type: 'active', title: 'High Equity Homeowner', stage: 'initial_contact', probability: 30, days_to_close: 90 },
    { _type: 'active', title: 'Pre-Foreclosure Save', stage: 'initial_contact', probability: 50, days_to_close: 45 },
    { _type: 'active', title: 'Off-Market Pocket Listing', stage: 'initial_contact', probability: 75, days_to_close: 28 },
    { _type: 'active', title: 'FSBO Conversion', stage: 'initial_contact', probability: 45, days_to_close: 55 },
    { _type: 'active', title: 'Inherited Property Deal', stage: 'initial_contact', probability: 60, days_to_close: 40 },
    { _type: 'active', title: 'Land Acquisition', stage: 'initial_contact', probability: 40, days_to_close: 75 },
    { _type: 'active', title: 'New Construction Purchase', stage: 'initial_contact', probability: 50, days_to_close: 90 },
  ];

  const template = happyPathDeals[index] ?? happyPathDeals[0];

  // Use type guard for proper type narrowing (no unsafe type assertions needed)
  // Note: DB constraint allows status: 'active' | 'won' | 'lost' | 'archived'
  if (isClosedDealTemplate(template)) {
    return {
      user_id: userId,
      lead_id: leadId,
      property_id: propertyId,
      title: template.title,
      stage: template.stage,
      status: 'won' as const, // 'won' = deal closed successfully
      probability: template.probability,
      expected_close_date: pastDate(template.days_ago),
    };
  }

  return {
    user_id: userId,
    lead_id: leadId,
    property_id: propertyId,
    title: template.title,
    stage: template.stage,
    status: 'active' as const,
    probability: template.probability,
    expected_close_date: futureDate(template.days_to_close),
  };
}

// ============================================================================
// CAPTURE ITEMS DATA (60 total: 48 happy path + 12 edge cases)
// ============================================================================

// Type: recording (12), call (12), note (12), photo (9), document (6), transcript (4), email (3), text (2)
// Status: pending (18), processing (9), ready (15), assigned (12), dismissed (6)

/**
 * Database insert type for capture items during seeding.
 * Includes all fields that can be set during initial creation.
 */
export interface CaptureItemSeedInsert {
  user_id: string;
  type: CaptureItemType;
  status: CaptureItemStatus;
  title?: string;
  content?: string;
  transcript?: string;
  duration_seconds?: number;
  ai_summary?: string;
  ai_confidence?: number;
  source?: string;
  suggested_lead_id?: string;
  suggested_property_id?: string;
  assigned_lead_id?: string;
  assigned_property_id?: string;
  assigned_deal_id?: string;
}

interface CaptureItemTemplate {
  type: CaptureItemType;
  status: CaptureItemStatus;
  title: string;
  content?: string;
  transcript?: string;
  duration_seconds?: number;
  ai_summary?: string;
  ai_confidence?: number;
  source?: string;
}

const HAPPY_PATH_CAPTURE_ITEMS: CaptureItemTemplate[] = [
  // Recordings (10)
  { type: 'recording', status: 'pending', title: 'Initial call with seller', duration_seconds: 180, source: 'app_recording' },
  { type: 'recording', status: 'processing', title: 'Property walkthrough audio', duration_seconds: 420, source: 'app_recording' },
  { type: 'recording', status: 'ready', title: 'Negotiation call recording', duration_seconds: 900, ai_summary: 'Seller wants $250k, buyer offering $220k', ai_confidence: 0.85, source: 'app_recording' },
  { type: 'recording', status: 'assigned', title: 'Closing call with title company', duration_seconds: 600, ai_summary: 'Closing scheduled for next Friday', ai_confidence: 0.92, source: 'upload' },
  { type: 'recording', status: 'ready', title: 'Follow-up call - motivated seller', duration_seconds: 300, ai_summary: 'Seller motivated due to job relocation', ai_confidence: 0.88, source: 'app_recording' },
  { type: 'recording', status: 'pending', title: 'Voicemail from potential buyer', duration_seconds: 45, source: 'upload' },
  { type: 'recording', status: 'ready', title: 'Property condition discussion', duration_seconds: 720, ai_summary: 'Needs new roof and HVAC', ai_confidence: 0.78, source: 'app_recording' },
  { type: 'recording', status: 'assigned', title: 'Contractor estimate call', duration_seconds: 540, ai_summary: 'Repairs estimated at $35k', ai_confidence: 0.90, source: 'upload' },
  { type: 'recording', status: 'processing', title: 'Investor pitch recording', duration_seconds: 1200, source: 'app_recording' },
  { type: 'recording', status: 'pending', title: 'Market analysis discussion', duration_seconds: 480, source: 'app_recording' },
  // Calls (10)
  { type: 'call', status: 'pending', title: 'Inbound lead call', duration_seconds: 240, source: 'manual' },
  { type: 'call', status: 'ready', title: 'Cold call to absentee owner', duration_seconds: 120, ai_summary: 'Owner interested, requested callback', ai_confidence: 0.75, source: 'manual' },
  { type: 'call', status: 'assigned', title: 'Attorney consultation', duration_seconds: 900, ai_summary: 'Legal review complete, clear to proceed', ai_confidence: 0.95, source: 'manual' },
  { type: 'call', status: 'dismissed', title: 'Wrong number call', duration_seconds: 30, source: 'manual' },
  { type: 'call', status: 'ready', title: 'Lender pre-approval call', duration_seconds: 600, ai_summary: 'Pre-approved for $350k loan', ai_confidence: 0.92, source: 'manual' },
  { type: 'call', status: 'pending', title: 'Property manager inquiry', duration_seconds: 360, source: 'manual' },
  { type: 'call', status: 'processing', title: 'Insurance quote call', duration_seconds: 300, source: 'manual' },
  { type: 'call', status: 'ready', title: 'Home inspector scheduling', duration_seconds: 180, ai_summary: 'Inspection scheduled for Thursday 2pm', ai_confidence: 0.98, source: 'manual' },
  { type: 'call', status: 'assigned', title: 'Seller counteroffer discussion', duration_seconds: 420, ai_summary: 'Counter at $235k, seller firm', ai_confidence: 0.87, source: 'manual' },
  { type: 'call', status: 'pending', title: 'Utility company verification', duration_seconds: 150, source: 'manual' },
  // Notes (10)
  { type: 'note', status: 'pending', title: 'Meeting notes - property viewing', content: 'Property in good condition overall. Minor repairs needed in bathroom.', source: 'manual' },
  { type: 'note', status: 'ready', title: 'Seller motivation notes', content: 'Seller is motivated - job transfer in 30 days. Willing to negotiate on price.', ai_summary: 'Motivated seller due to job transfer', ai_confidence: 0.90, source: 'manual' },
  { type: 'note', status: 'assigned', title: 'Repair estimate breakdown', content: 'Roof: $12k, HVAC: $8k, Plumbing: $5k, Electrical: $3k, Cosmetic: $7k', ai_summary: 'Total repairs ~$35k', ai_confidence: 0.85, source: 'manual' },
  { type: 'note', status: 'pending', title: 'Comparable sales research', content: '123 Main sold for $245k, 456 Oak sold for $260k, 789 Elm sold for $238k', source: 'manual' },
  { type: 'note', status: 'ready', title: 'Neighborhood analysis', content: 'Growing area, new shopping center planned. Schools rated 8/10.', ai_summary: 'Strong neighborhood with growth potential', ai_confidence: 0.82, source: 'manual' },
  { type: 'note', status: 'dismissed', title: 'Outdated property info', content: 'Property already sold - remove from list', source: 'manual' },
  { type: 'note', status: 'processing', title: 'Title search notes', content: 'Checking for liens and encumbrances...', source: 'manual' },
  { type: 'note', status: 'ready', title: 'Exit strategy options', content: 'Options: 1) Wholesale at $15k assignment, 2) Fix/flip for $45k profit, 3) Hold as rental at $1,500/mo', ai_summary: 'Three viable exit strategies identified', ai_confidence: 0.88, source: 'manual' },
  { type: 'note', status: 'assigned', title: 'Buyer requirements list', content: 'Cash buyer, wants 3+ bed, max $300k, prefers south side', ai_summary: 'Cash buyer seeking 3BR under $300k south side', ai_confidence: 0.95, source: 'manual' },
  { type: 'note', status: 'pending', title: 'Follow-up action items', content: '1) Call seller Tuesday, 2) Order inspection, 3) Send contracts', source: 'manual' },
  // Photos (8)
  { type: 'photo', status: 'pending', title: 'Front exterior photo', source: 'upload' },
  { type: 'photo', status: 'ready', title: 'Kitchen condition photo', ai_summary: 'Kitchen needs updating, cabinets worn', ai_confidence: 0.80, source: 'upload' },
  { type: 'photo', status: 'assigned', title: 'Roof damage documentation', ai_summary: 'Visible damage on south side of roof', ai_confidence: 0.88, source: 'upload' },
  { type: 'photo', status: 'pending', title: 'Bathroom renovation needed', source: 'upload' },
  { type: 'photo', status: 'ready', title: 'Backyard and fence', ai_summary: 'Large backyard, fence needs repair', ai_confidence: 0.75, source: 'upload' },
  { type: 'photo', status: 'processing', title: 'HVAC unit condition', source: 'upload' },
  { type: 'photo', status: 'dismissed', title: 'Blurry photo - retake needed', source: 'upload' },
  { type: 'photo', status: 'ready', title: 'Street view and curb appeal', ai_summary: 'Good curb appeal, well-maintained landscaping', ai_confidence: 0.85, source: 'upload' },
  // Documents (5)
  { type: 'document', status: 'pending', title: 'Purchase agreement draft', source: 'upload' },
  { type: 'document', status: 'ready', title: 'Property deed copy', ai_summary: 'Clear title, no liens found', ai_confidence: 0.95, source: 'upload' },
  { type: 'document', status: 'assigned', title: 'Inspection report PDF', ai_summary: 'Major issues: roof, minor: plumbing', ai_confidence: 0.92, source: 'upload' },
  { type: 'document', status: 'processing', title: 'Tax assessment records', source: 'upload' },
  { type: 'document', status: 'ready', title: 'HOA documents', ai_summary: 'Monthly HOA $150, no special assessments', ai_confidence: 0.90, source: 'upload' },
  // Transcripts (3)
  { type: 'transcript', status: 'ready', title: 'Negotiation call transcript', transcript: 'Seller: I need at least $250k. Buyer: Our max is $235k...', ai_summary: 'Price gap of $15k', ai_confidence: 0.93, source: 'app_recording' },
  { type: 'transcript', status: 'assigned', title: 'Walkthrough transcript', transcript: 'Agent: Notice the water damage here on the ceiling...', ai_summary: 'Water damage identified in master bedroom', ai_confidence: 0.88, source: 'app_recording' },
  { type: 'transcript', status: 'pending', title: 'Initial consultation transcript', transcript: 'Seller: We inherited this property last year...', source: 'app_recording' },
  // Emails (2)
  { type: 'email', status: 'ready', title: 'Offer acceptance email', content: 'We are pleased to accept your offer of $240,000...', ai_summary: 'Offer accepted at $240k', ai_confidence: 0.98, source: 'email_import' },
  { type: 'email', status: 'pending', title: 'Inspection scheduling email', content: 'Please confirm if Thursday at 2pm works for the inspection...', source: 'email_import' },
];

const EDGE_CASE_CAPTURE_ITEMS: CaptureItemTemplate[] = [
  // Edge: Zero duration recording
  { type: 'recording', status: 'pending', title: 'Failed recording - 0 duration', duration_seconds: 0, source: 'app_recording' },
  // Edge: Very long recording
  { type: 'recording', status: 'ready', title: 'Marathon negotiation session', duration_seconds: 7200, ai_summary: 'Extended negotiation over 2 hours', ai_confidence: 0.70, source: 'app_recording' },
  // Edge: Very long content
  { type: 'note', status: 'ready', title: 'Comprehensive property analysis', content: 'A'.repeat(10000) + '...detailed analysis...', ai_summary: 'Comprehensive analysis document', ai_confidence: 0.65, source: 'manual' },
  // Edge: Very long title
  { type: 'note', status: 'pending', title: 'This is an extremely long title that should test UI truncation behavior across various screen sizes and card layouts in the capture items list view and detail views', content: 'Content here', source: 'manual' },
  // Edge: AI confidence extremes
  { type: 'document', status: 'ready', title: 'High confidence extraction', ai_summary: 'Perfect extraction', ai_confidence: 1.00, source: 'upload' },
  { type: 'document', status: 'ready', title: 'Low confidence extraction', ai_summary: 'Uncertain extraction - manual review needed', ai_confidence: 0.01, source: 'upload' },
  // Edge: Unicode/emoji content
  { type: 'note', status: 'pending', title: '🏠 Property notes with emojis 🔑💰', content: 'Great deal! 🎉 Seller is motivated! 🔥', source: 'manual' },
  // Edge: Empty content
  { type: 'note', status: 'dismissed', title: 'Empty note', content: '', source: 'manual' },
  // SECURITY TEST: Special characters that could break HTML/SQL if not properly escaped
  // Tests: apostrophes, ampersands, angle brackets, and quotes in user input
  { type: 'call', status: 'pending', title: "O'Brien's & Associates < > \" ' call", duration_seconds: 300, source: 'manual' },
  // SECURITY TEST: SQL injection attempt in title field
  // Tests that database queries are properly parameterized and won't execute injected SQL
  { type: 'note', status: 'dismissed', title: "'; DROP TABLE capture_items; --", content: 'Injection test', source: 'manual' },
  // Edge: Text message type (rare)
  { type: 'text', status: 'ready', title: 'SMS from seller', content: 'Can we meet tomorrow at 3pm?', ai_summary: 'Meeting request for tomorrow 3pm', ai_confidence: 0.95, source: 'manual' },
  // Edge: All assignment fields null
  { type: 'photo', status: 'pending', title: 'Orphan capture - no associations', source: 'upload' },
];

/**
 * Create a deterministic test capture item by index.
 *
 * @param index - Index (0-59) of the capture item to create
 * @param userId - User ID to associate the item with
 * @param context - Optional context for assignments { leadId, propertyId, dealId }
 * @returns CaptureItemSeedInsert object ready for database insertion
 */
export function createTestCaptureItem(
  index: number,
  userId: string,
  context?: { leadId?: string; propertyId?: string; dealId?: string }
): CaptureItemSeedInsert {
  const allItems = [...HAPPY_PATH_CAPTURE_ITEMS, ...EDGE_CASE_CAPTURE_ITEMS];
  const template = allItems[index] || allItems[0];

  // Base item with required fields
  const item: CaptureItemSeedInsert = {
    user_id: userId,
    type: template.type,
    status: template.status,
    title: template.title,
    source: template.source || 'manual',
  };

  // Optional fields
  if (template.content) item.content = template.content;
  if (template.transcript) item.transcript = template.transcript;
  if (template.duration_seconds !== undefined) item.duration_seconds = template.duration_seconds;
  if (template.ai_summary) item.ai_summary = template.ai_summary;
  if (template.ai_confidence !== undefined) item.ai_confidence = template.ai_confidence;

  // Assignments for 'assigned' status items
  if (template.status === 'assigned' && context) {
    if (context.leadId) item.assigned_lead_id = context.leadId;
    if (context.propertyId) item.assigned_property_id = context.propertyId;
    if (context.dealId) item.assigned_deal_id = context.dealId;
  }

  // AI suggestions for 'ready' status items
  if (template.status === 'ready' && context) {
    if (context.leadId) item.suggested_lead_id = context.leadId;
    if (context.propertyId) item.suggested_property_id = context.propertyId;
  }

  return item;
}

// ============================================================================
// INVESTOR CONVERSATIONS DATA (for Lead Communication Inbox)
// Types imported from @/features/lead-inbox/types/investor-conversations.types
// ============================================================================

interface InvestorConversationTemplate {
  channel: InvestorChannel;
  status: InvestorConversationStatus;
  ai_enabled: boolean;
  ai_auto_respond: boolean;
  ai_confidence_threshold: number;
  unread_count: number;
  last_message_preview: string;
}

interface InvestorMessageTemplate {
  direction: MessageDirection;
  content: string;
  sent_by: InvestorSender;
  ai_confidence?: number;
}

interface InvestorAIQueueTemplate {
  suggested_response: string;
  confidence: number;
  reasoning: string;
  intent: string;
  detected_topics: string[];
  status: AIQueueStatus;
}

const INVESTOR_CONVERSATION_TEMPLATES: InvestorConversationTemplate[] = [
  // SMS conversations (most common)
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 60,
    unread_count: 2,
    last_message_preview: 'Is this still available?',
  },
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 70,
    unread_count: 1,
    last_message_preview: 'I might be interested in selling...',
  },
  // Email conversations
  {
    channel: 'email',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 65,
    unread_count: 0,
    last_message_preview: 'Thank you for reaching out about my property',
  },
  {
    channel: 'email',
    status: 'resolved',
    ai_enabled: false,
    ai_auto_respond: false,
    ai_confidence_threshold: 60,
    unread_count: 0,
    last_message_preview: 'Deal closed successfully!',
  },
  // Edge case: High confidence auto-respond enabled
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: true,
    ai_confidence_threshold: 85,
    unread_count: 3,
    last_message_preview: 'What price range are you offering?',
  },
  // Edge case: Escalated conversation
  {
    channel: 'phone',
    status: 'escalated',
    ai_enabled: false,
    ai_auto_respond: false,
    ai_confidence_threshold: 60,
    unread_count: 1,
    last_message_preview: 'I need to speak with a manager',
  },
  // Additional SMS conversations (7-14)
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 70,
    unread_count: 4,
    last_message_preview: 'We need to sell ASAP - foreclosure notice',
  },
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 65,
    unread_count: 0,
    last_message_preview: 'Not interested, please remove me from your list',
  },
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: true,
    ai_confidence_threshold: 80,
    unread_count: 1,
    last_message_preview: 'Just following up on our conversation last week',
  },
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 75,
    unread_count: 2,
    last_message_preview: 'Your offer is too low. I need at least $280k',
  },
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 70,
    unread_count: 3,
    last_message_preview: 'I inherited this house and dont know what to do',
  },
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: false,
    ai_auto_respond: false,
    ai_confidence_threshold: 60,
    unread_count: 1,
    last_message_preview: 'Going through divorce, need quick sale',
  },
  {
    channel: 'sms',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 75,
    unread_count: 2,
    last_message_preview: 'Moving to Florida next month for new job',
  },
  {
    channel: 'sms',
    status: 'escalated',
    ai_enabled: false,
    ai_auto_respond: false,
    ai_confidence_threshold: 60,
    unread_count: 5,
    last_message_preview: 'Bank says I have 30 days before auction',
  },
  // Additional Email conversations (15-18)
  {
    channel: 'email',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 70,
    unread_count: 1,
    last_message_preview: 'My realtor friend said you might be interested',
  },
  {
    channel: 'email',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 65,
    unread_count: 2,
    last_message_preview: 'RE: Probate property at 456 Elm Street',
  },
  {
    channel: 'email',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: true,
    ai_confidence_threshold: 85,
    unread_count: 0,
    last_message_preview: 'Estate sale - 3 properties available',
  },
  {
    channel: 'email',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 70,
    unread_count: 1,
    last_message_preview: 'Do you buy properties wholesale?',
  },
  // WhatsApp conversations (19-20)
  {
    channel: 'whatsapp',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 75,
    unread_count: 3,
    last_message_preview: 'I am investor from overseas, interested in US property',
  },
  {
    channel: 'whatsapp',
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 65,
    unread_count: 1,
    last_message_preview: 'Quick question - do you pay closing costs?',
  },
];

const INVESTOR_MESSAGE_THREADS: InvestorMessageTemplate[][] = [
  // Thread 1: Initial outreach, lead responds
  [
    { direction: 'outbound', content: 'Hi John! I noticed your property at 123 Oak St. Would you consider selling? We buy houses as-is.', sent_by: 'user' },
    { direction: 'inbound', content: 'Is this still available?', sent_by: 'lead' },
    { direction: 'inbound', content: 'What kind of offer are you thinking?', sent_by: 'lead' },
  ],
  // Thread 2: Motivated seller
  [
    { direction: 'outbound', content: 'Hi Sarah, I received your inquiry about selling your home. I\'d love to learn more about your situation.', sent_by: 'user' },
    { direction: 'inbound', content: 'Hi, I might be interested in selling. We\'re relocating for work in 60 days.', sent_by: 'lead' },
    { direction: 'outbound', content: 'That\'s a tight timeline! We specialize in fast closings. Can I ask what price range you\'re hoping for?', sent_by: 'user' },
    { direction: 'inbound', content: 'I might be interested in selling...', sent_by: 'lead' },
  ],
  // Thread 3: Email thread
  [
    { direction: 'outbound', content: 'Dear Mr. Davis, We noticed your property at 789 Pine Road may have some deferred maintenance. We specialize in buying properties as-is...', sent_by: 'user' },
    { direction: 'inbound', content: 'Thank you for reaching out about my property. I\'ve been thinking about selling but wasn\'t sure who to call.', sent_by: 'lead' },
    { direction: 'outbound', content: 'I\'d be happy to discuss your options. We can make a cash offer within 24 hours. Would you be available for a quick call this week?', sent_by: 'ai', ai_confidence: 0.88 },
  ],
  // Thread 4: Resolved deal
  [
    { direction: 'outbound', content: 'Congratulations on the closing! It was a pleasure working with you.', sent_by: 'user' },
    { direction: 'inbound', content: 'Deal closed successfully! Thank you for making this so easy.', sent_by: 'lead' },
  ],
  // Thread 5: Active negotiation
  [
    { direction: 'outbound', content: 'Based on our analysis, we can offer $215,000 cash, closing in 14 days.', sent_by: 'user' },
    { direction: 'inbound', content: 'That\'s lower than I expected. I was hoping for at least $240,000.', sent_by: 'lead' },
    { direction: 'outbound', content: 'I understand. Our offer factors in repair costs. However, we have some flexibility...', sent_by: 'ai', ai_confidence: 0.75 },
    { direction: 'inbound', content: 'What price range are you offering?', sent_by: 'lead' },
  ],
  // Thread 6: Escalated conversation
  [
    { direction: 'inbound', content: 'I\'ve been trying to reach someone about the inspection findings.', sent_by: 'lead' },
    { direction: 'outbound', content: 'I apologize for the delay. Let me look into this right away.', sent_by: 'user' },
    { direction: 'inbound', content: 'I need to speak with a manager about these concerns.', sent_by: 'lead' },
  ],
  // Thread 7: Pre-foreclosure urgent seller
  [
    { direction: 'inbound', content: 'Hi, I got your letter. We\'re in a tough spot - got a foreclosure notice last week.', sent_by: 'lead' },
    { direction: 'outbound', content: 'I\'m sorry to hear that. We specialize in helping homeowners in your situation. How much time do you have?', sent_by: 'user' },
    { direction: 'inbound', content: 'Bank says 30 days before they start the auction process.', sent_by: 'lead' },
    { direction: 'outbound', content: 'We can definitely close faster than that. Can I stop by tomorrow to see the property and discuss options?', sent_by: 'ai', ai_confidence: 0.91 },
    { direction: 'inbound', content: 'We need to sell ASAP - foreclosure notice', sent_by: 'lead' },
  ],
  // Thread 8: Tire kicker / not interested
  [
    { direction: 'outbound', content: 'Hi! I noticed your property at 789 Oak Ave has been vacant. Would you consider selling?', sent_by: 'user' },
    { direction: 'inbound', content: 'How did you get my number?', sent_by: 'lead' },
    { direction: 'outbound', content: 'Public records. We reach out to property owners who might benefit from a cash offer.', sent_by: 'ai', ai_confidence: 0.72 },
    { direction: 'inbound', content: 'Not interested, please remove me from your list', sent_by: 'lead' },
  ],
  // Thread 9: Follow-up conversation
  [
    { direction: 'outbound', content: 'Hi Maria, just following up on our conversation from last Tuesday. Have you had a chance to think about the offer?', sent_by: 'user' },
    { direction: 'inbound', content: 'Yes, I\'ve been thinking. My sister thinks I should list with a realtor instead.', sent_by: 'lead' },
    { direction: 'outbound', content: 'I understand. The main benefits we offer are speed and certainty - no showings, no repairs, close in 2 weeks.', sent_by: 'ai', ai_confidence: 0.84 },
    { direction: 'inbound', content: 'Just following up on our conversation last week', sent_by: 'lead' },
  ],
  // Thread 10: Price negotiator
  [
    { direction: 'outbound', content: 'Based on comparable sales and condition, we can offer $245,000 cash.', sent_by: 'user' },
    { direction: 'inbound', content: 'That\'s way too low. Zillow says my house is worth $320,000.', sent_by: 'lead' },
    { direction: 'outbound', content: 'Zillow estimates don\'t account for as-is condition. Our offer reflects the $40k+ in repairs needed.', sent_by: 'user' },
    { direction: 'inbound', content: 'I\'ll consider $280k but not a penny less.', sent_by: 'lead' },
    { direction: 'outbound', content: 'Let me run the numbers again and see if we can get closer to your price point.', sent_by: 'ai', ai_confidence: 0.79 },
    { direction: 'inbound', content: 'Your offer is too low. I need at least $280k', sent_by: 'lead' },
  ],
  // Thread 11: Inherited property
  [
    { direction: 'inbound', content: 'Hi, my mom passed away and left me her house. I live in another state and don\'t know what to do with it.', sent_by: 'lead' },
    { direction: 'outbound', content: 'First, I\'m sorry for your loss. We work with many families in similar situations. Is the property currently vacant?', sent_by: 'user' },
    { direction: 'inbound', content: 'Yes, it\'s been empty for 3 months. I\'m paying the mortgage and utilities from here.', sent_by: 'lead' },
    { direction: 'outbound', content: 'That can add up quickly. We can make the process simple - one visit, one offer, you don\'t have to travel back.', sent_by: 'ai', ai_confidence: 0.87 },
    { direction: 'inbound', content: 'I inherited this house and dont know what to do', sent_by: 'lead' },
  ],
  // Thread 12: Divorce sale
  [
    { direction: 'inbound', content: 'My husband and I are divorcing. We need to sell the house and split the proceeds.', sent_by: 'lead' },
    { direction: 'outbound', content: 'I understand this is a difficult time. A quick cash sale can help both parties move forward faster.', sent_by: 'user' },
    { direction: 'inbound', content: 'We just want this done. Neither of us can afford it alone.', sent_by: 'lead' },
    { direction: 'outbound', content: 'We can work with both parties and your attorneys to make this as smooth as possible. When can I see the property?', sent_by: 'ai', ai_confidence: 0.83 },
    { direction: 'inbound', content: 'Going through divorce, need quick sale', sent_by: 'lead' },
  ],
  // Thread 13: Relocation seller
  [
    { direction: 'outbound', content: 'Hi James, I understand you\'re relocating for work. When do you need to be at your new location?', sent_by: 'user' },
    { direction: 'inbound', content: 'I start in Tampa on March 1st. So I have about 5 weeks to figure this out.', sent_by: 'lead' },
    { direction: 'outbound', content: 'That\'s tight but doable! We can close in 2 weeks if needed. Have you gotten any other offers?', sent_by: 'ai', ai_confidence: 0.89 },
    { direction: 'inbound', content: 'A realtor said 90 days minimum. That won\'t work for me.', sent_by: 'lead' },
    { direction: 'inbound', content: 'Moving to Florida next month for new job', sent_by: 'lead' },
  ],
  // Thread 14: Pre-foreclosure escalated
  [
    { direction: 'inbound', content: 'I\'m behind on payments and the bank is threatening to take my house.', sent_by: 'lead' },
    { direction: 'outbound', content: 'How many months behind are you? There may still be options to protect your credit.', sent_by: 'user' },
    { direction: 'inbound', content: '4 months. I tried to refinance but got denied.', sent_by: 'lead' },
    { direction: 'outbound', content: 'We can likely pay off your mortgage and put cash in your pocket. Can we meet tomorrow?', sent_by: 'user' },
    { direction: 'inbound', content: 'I got another letter today. Bank says I have 30 days before auction.', sent_by: 'lead' },
    { direction: 'inbound', content: 'Bank says I have 30 days before auction', sent_by: 'lead' },
  ],
  // Thread 15: Agent referral email
  [
    { direction: 'inbound', content: 'Hi, my name is Susan and I\'m a realtor. I have a client whose property needs too much work for MLS. Thought of you.', sent_by: 'lead' },
    { direction: 'outbound', content: 'Thanks for thinking of us, Susan! We love working with agents on off-market deals. What\'s the property address?', sent_by: 'user' },
    { direction: 'inbound', content: 'It\'s at 567 Pine Street. 3bed/2bath, needs about $50k in work. Seller is motivated.', sent_by: 'lead' },
    { direction: 'outbound', content: 'Perfect, that\'s right in our wheelhouse. We\'d be happy to pay you a referral fee. Can I see it this week?', sent_by: 'ai', ai_confidence: 0.86 },
    { direction: 'inbound', content: 'My realtor friend said you might be interested', sent_by: 'lead' },
  ],
  // Thread 16: Probate email
  [
    { direction: 'outbound', content: 'Dear Mr. Thompson, We understand you may have recently inherited a property. We specialize in helping executors sell estates quickly.', sent_by: 'user' },
    { direction: 'inbound', content: 'How did you know about the estate? The probate was just filed last month.', sent_by: 'lead' },
    { direction: 'outbound', content: 'We monitor public probate filings to reach out to families who might benefit from our services.', sent_by: 'ai', ai_confidence: 0.77 },
    { direction: 'inbound', content: 'I see. Well, there is a property at 456 Elm Street that the family needs to sell.', sent_by: 'lead' },
    { direction: 'inbound', content: 'RE: Probate property at 456 Elm Street', sent_by: 'lead' },
  ],
  // Thread 17: Estate sale multiple properties
  [
    { direction: 'inbound', content: 'I\'m the executor for my uncle\'s estate. He owned 3 rental properties that we need to liquidate.', sent_by: 'lead' },
    { direction: 'outbound', content: 'We\'d be interested in all three. Can you send me the addresses and any info on their current rental status?', sent_by: 'user' },
    { direction: 'inbound', content: 'Two are rented month-to-month, one is vacant. All need updates. I\'ll send the addresses.', sent_by: 'lead' },
    { direction: 'outbound', content: 'Perfect. We buy properties with tenants in place all the time. Looking forward to the details.', sent_by: 'ai', ai_confidence: 0.90 },
    { direction: 'inbound', content: 'Estate sale - 3 properties available', sent_by: 'lead' },
  ],
  // Thread 18: Wholesale inquiry
  [
    { direction: 'inbound', content: 'Hi, I\'m a wholesaler. Do you buy properties at wholesale prices? I have a deal under contract.', sent_by: 'lead' },
    { direction: 'outbound', content: 'Yes, we buy from wholesalers regularly. What\'s the property details and your assignment fee?', sent_by: 'user' },
    { direction: 'inbound', content: '3/2 SFH, 1400 sqft, ARV $285k, asking $165k with $10k assignment. Needs $40k rehab.', sent_by: 'lead' },
    { direction: 'outbound', content: 'Numbers look reasonable. Can you send the contract and property photos?', sent_by: 'ai', ai_confidence: 0.82 },
    { direction: 'inbound', content: 'Do you buy properties wholesale?', sent_by: 'lead' },
  ],
  // Thread 19: International investor WhatsApp
  [
    { direction: 'inbound', content: 'Hello, I am looking to invest in US real estate market. I am based in Dubai.', sent_by: 'lead' },
    { direction: 'outbound', content: 'Welcome! We work with international investors. Are you looking to buy properties or sell?', sent_by: 'user' },
    { direction: 'inbound', content: 'I want to buy. Looking for cash-flowing rentals in good areas. Budget $200-500k per property.', sent_by: 'lead' },
    { direction: 'outbound', content: 'We have several turnkey properties in that range. Would you like me to send our current inventory?', sent_by: 'ai', ai_confidence: 0.85 },
    { direction: 'inbound', content: 'Yes please. Also, can you handle property management?', sent_by: 'lead' },
    { direction: 'inbound', content: 'I am investor from overseas, interested in US property', sent_by: 'lead' },
  ],
  // Thread 20: Quick question WhatsApp
  [
    { direction: 'inbound', content: 'Hi, quick question - when you buy houses, who pays the closing costs?', sent_by: 'lead' },
    { direction: 'outbound', content: 'Great question! We typically pay all closing costs. The offer price is what you walk away with.', sent_by: 'ai', ai_confidence: 0.92 },
    { direction: 'inbound', content: 'Oh that\'s good. What about if there are liens on the property?', sent_by: 'lead' },
    { direction: 'outbound', content: 'We handle liens and title issues as part of our process. We\'ve bought houses with tax liens, mechanic\'s liens, etc.', sent_by: 'user' },
    { direction: 'inbound', content: 'Quick question - do you pay closing costs?', sent_by: 'lead' },
  ],
];

const INVESTOR_AI_QUEUE_TEMPLATES: InvestorAIQueueTemplate[] = [
  {
    suggested_response: 'Thank you for your interest! I\'d be happy to discuss your property. Based on similar homes in your area, we typically offer between $200k-$250k for homes in your condition. Would you like to schedule a quick call to learn more about your situation?',
    confidence: 0.85,
    reasoning: 'Lead expressed interest in selling. Response acknowledges interest and provides general price range without commitment.',
    intent: 'price_inquiry',
    detected_topics: ['pricing', 'interest'],
    status: 'pending',
  },
  {
    suggested_response: 'I understand you need to relocate quickly! We specialize in fast closings and can often close within 2-3 weeks. Could you share more about your timeline and what price you have in mind?',
    confidence: 0.92,
    reasoning: 'Lead mentioned tight timeline due to job relocation. Response emphasizes speed of closing which matches their needs.',
    intent: 'timeline_discussion',
    detected_topics: ['urgency', 'relocation', 'timeline'],
    status: 'pending',
  },
  {
    suggested_response: 'Great question! Our offer would be based on the current condition and market value. We buy as-is, so you wouldn\'t need to make any repairs. When would be a good time to schedule a quick walkthrough?',
    confidence: 0.78,
    reasoning: 'Lead asking about offer details. Response explains as-is purchase and moves toward scheduling property viewing.',
    intent: 'condition_inquiry',
    detected_topics: ['condition', 'repairs', 'walkthrough'],
    status: 'pending',
  },
  {
    suggested_response: 'I apologize for any confusion. Our team is here to help. Would you prefer a phone call or video chat to discuss your concerns in detail?',
    confidence: 0.65,
    reasoning: 'Lead appears frustrated. Response is apologetic and offers escalation options.',
    intent: 'complaint_resolution',
    detected_topics: ['frustration', 'escalation'],
    status: 'pending',
  },
];

/**
 * Create a deterministic test investor conversation by index.
 *
 * @param index - Index of the conversation to create
 * @param userId - User ID to associate the conversation with
 * @param leadId - Lead ID to associate the conversation with
 * @param propertyId - Optional property ID to link
 * @param dealId - Optional deal ID to link
 * @returns Investor conversation data ready for database insertion
 */
export function createTestInvestorConversation(
  index: number,
  userId: string,
  leadId: string,
  propertyId?: string,
  dealId?: string
): {
  user_id: string;
  lead_id: string;
  property_id: string | null;
  deal_id: string | null;
  channel: InvestorChannel;
  status: InvestorConversationStatus;
  ai_enabled: boolean;
  ai_auto_respond: boolean;
  ai_confidence_threshold: number;
  unread_count: number;
  last_message_preview: string;
  last_message_at: string;
} {
  const template = INVESTOR_CONVERSATION_TEMPLATES[index % INVESTOR_CONVERSATION_TEMPLATES.length];

  // Generate a realistic last_message_at timestamp (within last 7 days)
  const daysAgo = index % 7;
  const hoursAgo = (index * 3) % 24;
  const lastMessageAt = new Date();
  lastMessageAt.setDate(lastMessageAt.getDate() - daysAgo);
  lastMessageAt.setHours(lastMessageAt.getHours() - hoursAgo);

  return {
    user_id: userId,
    lead_id: leadId,
    property_id: propertyId || null,
    deal_id: dealId || null,
    channel: template.channel,
    status: template.status,
    ai_enabled: template.ai_enabled,
    ai_auto_respond: template.ai_auto_respond,
    ai_confidence_threshold: template.ai_confidence_threshold,
    unread_count: template.unread_count,
    last_message_preview: template.last_message_preview,
    last_message_at: lastMessageAt.toISOString(),
  };
}

/**
 * Create deterministic test investor messages for a conversation.
 *
 * @param conversationIndex - Index of the conversation (determines which thread to use)
 * @param conversationId - Conversation ID to associate messages with
 * @returns Array of investor message data ready for database insertion
 */
export function createTestInvestorMessages(
  conversationIndex: number,
  conversationId: string
): Array<{
  conversation_id: string;
  direction: MessageDirection;
  content: string;
  content_type: 'text';
  sent_by: InvestorSender;
  ai_confidence: number | null;
  delivered_at: string;
  read_at: string | null;
  created_at: string;
}> {
  const thread = INVESTOR_MESSAGE_THREADS[conversationIndex % INVESTOR_MESSAGE_THREADS.length];

  // Create messages with realistic timestamps (newest first for the last message)
  const baseTime = new Date();
  baseTime.setHours(baseTime.getHours() - thread.length);

  return thread.map((msg, msgIndex) => {
    const createdAt = new Date(baseTime);
    createdAt.setMinutes(createdAt.getMinutes() + msgIndex * 15);

    return {
      conversation_id: conversationId,
      direction: msg.direction,
      content: msg.content,
      content_type: 'text' as const,
      sent_by: msg.sent_by,
      ai_confidence: msg.ai_confidence || null,
      delivered_at: createdAt.toISOString(),
      read_at: msg.direction === 'outbound' ? createdAt.toISOString() : null,
      created_at: createdAt.toISOString(),
    };
  });
}

/**
 * Create a deterministic test AI queue item.
 *
 * @param index - Index of the queue item to create
 * @param userId - User ID to associate the item with
 * @param conversationId - Conversation ID to associate the item with
 * @param triggerMessageId - Optional trigger message ID
 * @returns AI queue item data ready for database insertion
 */
export function createTestInvestorAIQueueItem(
  index: number,
  userId: string,
  conversationId: string,
  triggerMessageId?: string
): {
  user_id: string;
  conversation_id: string;
  trigger_message_id: string | null;
  suggested_response: string;
  confidence: number;
  reasoning: string;
  intent: string;
  detected_topics: string[];
  status: AIQueueStatus;
  expires_at: string;
} {
  const template = INVESTOR_AI_QUEUE_TEMPLATES[index % INVESTOR_AI_QUEUE_TEMPLATES.length];

  // Set expiration 4 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 4);

  return {
    user_id: userId,
    conversation_id: conversationId,
    trigger_message_id: triggerMessageId || null,
    suggested_response: template.suggested_response,
    confidence: template.confidence,
    reasoning: template.reasoning,
    intent: template.intent,
    detected_topics: template.detected_topics,
    status: template.status,
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Get the total number of investor conversation templates available
 */
export function getTestInvestorConversationCount(): number {
  return INVESTOR_CONVERSATION_TEMPLATES.length;
}

/**
 * Get the total number of AI queue templates available
 */
export function getTestInvestorAIQueueCount(): number {
  return INVESTOR_AI_QUEUE_TEMPLATES.length;
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
  return 50;
}

/**
 * Number of closed_won deals that appear in the Portfolio tab.
 * These are the first N deals in the happyPathDeals array.
 */
export const PORTFOLIO_DEALS_COUNT = 8;

/**
 * Get the number of portfolio deals (closed_won stage).
 */
export function getPortfolioDealsCount(): number {
  return PORTFOLIO_DEALS_COUNT;
}

/**
 * Get the total number of test capture items available
 */
export function getTestCaptureItemCount(): number {
  return HAPPY_PATH_CAPTURE_ITEMS.length + EDGE_CASE_CAPTURE_ITEMS.length;
}
