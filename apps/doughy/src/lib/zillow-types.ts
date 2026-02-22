// src/lib/zillow-types.ts
// Type definitions for Zillow/Property data

/**
 * Property data from Zillow/property API
 */
export interface ZillowPropertyData {
  zpid?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  price?: number;
  zestimate?: number;
  rentZestimate?: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  lastSoldPrice?: number;
  lastSoldDate?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  photos?: string[];
}

/**
 * Comparable property data
 */
export interface ComparableProperty {
  address: string;
  price: number;
  soldDate?: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  pricePerSqft: number;
  distance?: number; // miles from subject property
  similarity?: number; // 0-1 score
}

/**
 * Filters for comparable property search
 */
export interface CompFilters {
  /** Search radius in miles (default: 1) */
  radius?: number;
  /** Minimum square footage (default: -20% of subject) */
  minSqft?: number;
  /** Maximum square footage (default: +20% of subject) */
  maxSqft?: number;
  /** Only properties sold in last N months (default: 6) */
  soldInLastMonths?: number;
  /** Minimum bedrooms */
  minBedrooms?: number;
  /** Maximum bedrooms */
  maxBedrooms?: number;
  /** Property type filter */
  propertyType?: 'single_family' | 'condo' | 'townhouse' | 'multi_family';
  /** Maximum number of comps to return (default: 5) */
  limit?: number;
}

/**
 * Property valuation result
 */
export interface PropertyValuation {
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  confidence: number; // 0-1
  lastUpdated: string;
  source: 'zillow' | 'calculated' | 'manual';
  methodology?: string;
}
