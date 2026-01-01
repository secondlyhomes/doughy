// Define string literal types for better type safety
export type PropertyType = 'single_family' | 'multi_family' | 'commercial' | 'land' | 'other';
export type PropertyStatus = 'active' | 'pending' | 'sold' | 'off_market';
export type RelationshipType = 'owner' | 'buyer' | 'seller' | 'agent' | 'other';
export type RepairCategory = 'roof' | 'electrical' | 'plumbing' | 'hvac' | 'foundation' | 'cosmetic' | 'other';
export type AnalysisType = 'flip' | 'rental' | 'wholesale' | 'subject_to' | 'other';
export type ScenarioType = 'conventional' | 'cash' | 'hard_money' | 'seller_financing' | 'subject_to' | 'other';
export type CompStatus = 'Active' | 'Pending' | 'Closed';

// Define the property types directly rather than trying to use Tables
export interface DBProperty {
  id: string;
  profile_id: string;
  created_by: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  geo_point: unknown | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  lot_size: number | null;
  year_built: number | null;
  purchase_price: number | null;
  arv: number | null;
  status: string;
  property_type: string | null;
  mls_id: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DBPropertyImage {
  id: string;
  property_id: string;
  url: string;
  description: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBRepairEstimate {
  id: string;
  property_id: string;
  category: string;
  item_description: string;
  cost: number;
  notes: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBPropertyAnalysis {
  id: string;
  property_id: string;
  analysis_type: string | null;
  name: string | null;
  input_json: unknown;
  result_json: unknown;
  tokens_used: number | null;
  created_by: string | null;
  created_at: string | null;
}

export interface DBPropertyComp {
  id: string;
  property_id: string;
  source: string | null;
  address: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  year_built: number | null;
  sale_price: number | null;
  sale_date: string | null;
  distance: number | null;
  price_per_sqft: number | null;
  status: string | null;
  lot_size: number | null;
  days_on_market: number | null;
  special_features: string | null;
  features_json: unknown | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DBFinancingScenario {
  id: string;
  property_id: string;
  name: string;
  scenario_type: string | null;
  description: string | null;
  input_json: unknown;
  result_json: unknown | null;
  is_primary: boolean | null;
  pros_cons: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Application-level property details type
export interface PropertyDetail extends DBProperty {
  images?: DBPropertyImage[];
  repairs?: DBRepairEstimate[];
  analyses?: DBPropertyAnalysis[];
  comps?: DBPropertyComp[];
  financingScenarios?: DBFinancingScenario[];
}

// Frontend component-friendly types
export interface PropertyComp {
  id: string;
  property_id: string;
  address: string;
  address_line_1?: string | null; // Added for standardized fields
  address_line_2?: string | null; // Added for standardized fields
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  sqft: number; // For backward compatibility
  year_built?: number;
  yearBuilt?: number; // For backward compatibility
  sold_price: number;
  salePrice: number; // For backward compatibility
  sold_date: string;
  saleDate: string; // For backward compatibility
  distance: number;
  price_per_sqft: number;
  lot_size?: number;
  days_on_market?: number;
  status?: CompStatus;
  special_features?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScenarioDetails {
  purchasePrice: number;
  downPayment?: number;
  loanAmount?: number;
  interestRate?: number;
  loanTerm?: number;
  monthlyPayment?: number;
  closingCosts?: number;
  repairs?: number;
  monthlyRent?: number;
  cashFlow?: number;
  roi?: number;
  capRate?: number;
  financingType?: ScenarioType;
  currentMortgageBalance?: number;
  currentInterestRate?: number;
  currentMonthlyPayment?: number;
  term?: number;
  sellerIncentive?: number;
  remainingYears?: number;
  balloonPayment?: number;
  holdingCosts?: number;
  miscCosts?: number;
  investorDiscount?: number;
  wholesaleFee?: number;
  optionPrice?: number;
  optionFee?: number;
  leaseTerm?: number;
}

export interface FinancingScenario {
  id: string;
  name: string;
  property_id: string;
  description?: string;
  scenario_type: ScenarioType;
  details: ScenarioDetails;
  pros_cons?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
  property_id: string;
  category: 'contract' | 'inspection' | 'appraisal' | 'title' | 'other';
  name?: string;
  type?: 'purchase_agreement' | 'deed' | 'inspection' | 'appraisal' | 'loan' | 'other';
  url?: string;
  status?: 'draft' | 'signed' | 'sent';
  created_at?: string;
  updated_at?: string;
  needs_signature?: boolean;
}

export interface EnhancedPropertyInfo {
  estimatedARV?: number;
  isListed?: boolean;
  isExpiredListing?: boolean;
  condition?: string;
  drivenComps?: boolean;
  sellerMotivation?: string;
  desiredClosingDate?: string;
  closingDateReason?: string;
  totalRepairCost?: number;
}

// Helper conversion functions
export function dbPropertyToFrontend(dbProperty: DBProperty): Omit<PropertyDetail, 'images' | 'repairs' | 'analyses' | 'comps' | 'financingScenarios'> {
  return {
    ...dbProperty
  };
}

export function dbCompToFrontend(dbComp: DBPropertyComp): PropertyComp {
  return {
    id: dbComp.id,
    property_id: dbComp.property_id,
    // Use address_line_1 if available, fall back to address for backward compatibility
    address: dbComp.address_line_1 || dbComp.address,
    // Add new standardized fields
    address_line_1: dbComp.address_line_1 || dbComp.address,
    address_line_2: dbComp.address_line_2 || null,
    city: dbComp.city,
    state: dbComp.state,
    zip: dbComp.zip,
    bedrooms: dbComp.bedrooms || 0,
    bathrooms: dbComp.bathrooms || 0,
    square_feet: dbComp.square_feet || 0,
    sqft: dbComp.square_feet || 0, // For compatibility
    year_built: dbComp.year_built ?? undefined,
    yearBuilt: dbComp.year_built ?? undefined, // For compatibility
    sold_price: dbComp.sale_price || 0,
    salePrice: dbComp.sale_price || 0, // For compatibility
    sold_date: dbComp.sale_date || '',
    saleDate: dbComp.sale_date || '', // For compatibility
    distance: dbComp.distance || 0,
    price_per_sqft: dbComp.price_per_sqft || 0,
    lot_size: dbComp.lot_size ?? undefined,
    days_on_market: dbComp.days_on_market ?? undefined,
    status: (dbComp.status as CompStatus) || 'Closed',
    special_features: dbComp.special_features,
    created_at: dbComp.created_at || '',
    updated_at: dbComp.updated_at || ''
  };
}
