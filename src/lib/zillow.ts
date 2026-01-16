// src/lib/zillow.ts
// Zillow/Property data client wrapper for property valuations and comparables

import { supabase, SUPABASE_URL, USE_MOCK_DATA } from './supabase';
import { retryWithBackoff, RetryPresets } from './retry';

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

// Mock data for development
const MOCK_PROPERTY_DATA: ZillowPropertyData = {
  zpid: 'mock-123',
  address: '123 Mock Street',
  city: 'Austin',
  state: 'TX',
  zipcode: '78701',
  price: 450000,
  zestimate: 445000,
  rentZestimate: 2800,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  lotSize: 6500,
  yearBuilt: 1995,
  propertyType: 'single_family',
  lastSoldPrice: 380000,
  lastSoldDate: '2021-06-15',
};

const MOCK_COMPS: ComparableProperty[] = [
  {
    address: '456 Oak Avenue',
    price: 435000,
    soldDate: '2024-01-10',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1750,
    pricePerSqft: 249,
    distance: 0.3,
    similarity: 0.92,
  },
  {
    address: '789 Pine Street',
    price: 465000,
    soldDate: '2024-02-05',
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1900,
    pricePerSqft: 245,
    distance: 0.5,
    similarity: 0.88,
  },
  {
    address: '321 Elm Court',
    price: 425000,
    soldDate: '2023-12-18',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1650,
    pricePerSqft: 258,
    distance: 0.7,
    similarity: 0.85,
  },
];

/**
 * Get property value (Zestimate) from Zillow API
 *
 * @example
 * ```typescript
 * const value = await getPropertyValue('123 Main St, Austin, TX 78701');
 * console.log('Estimated value:', value); // 450000
 * ```
 */
export async function getPropertyValue(
  address: string
): Promise<number | null> {
  // In mock mode, return simulated value
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Generate a random value based on address hash
    const hash = address.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return 200000 + (hash % 500) * 1000;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();

    const functionUrl = `${SUPABASE_URL}/functions/v1/zillow-api`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(functionUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'getPropertyValue',
            address,
          }),
        });

        if (!res.ok) {
          throw new Error(`Zillow API error: ${res.status}`);
        }

        return res.json();
      },
      RetryPresets.rateLimited
    );

    return response.zestimate || response.price || null;
  } catch (error) {
    console.error('[Zillow] Failed to get property value:', error);
    return null;
  }
}

/**
 * Get detailed property data from Zillow
 *
 * @example
 * ```typescript
 * const property = await getPropertyDetails('123 Main St, Austin, TX');
 * console.log(property.bedrooms, property.bathrooms, property.sqft);
 * ```
 */
export async function getPropertyDetails(
  address: string
): Promise<ZillowPropertyData | null> {
  // In mock mode, return simulated data
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      ...MOCK_PROPERTY_DATA,
      address: address.split(',')[0] || MOCK_PROPERTY_DATA.address,
    };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();

    const functionUrl = `${SUPABASE_URL}/functions/v1/zillow-api`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(functionUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'getPropertyDetails',
            address,
          }),
        });

        if (!res.ok) {
          throw new Error(`Zillow API error: ${res.status}`);
        }

        return res.json();
      },
      RetryPresets.rateLimited
    );

    return response as ZillowPropertyData;
  } catch (error) {
    console.error('[Zillow] Failed to get property details:', error);
    return null;
  }
}

/**
 * Get comparable properties (comps) for a given address
 *
 * @example
 * ```typescript
 * const comps = await getComps('123 Main St, Austin, TX', {
 *   radius: 0.5,
 *   soldInLastMonths: 6,
 *   limit: 5
 * });
 * ```
 */
export async function getComps(
  address: string,
  filters?: CompFilters
): Promise<ComparableProperty[]> {
  // In mock mode, return simulated comps
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const limit = filters?.limit || 5;
    return MOCK_COMPS.slice(0, limit);
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();

    const functionUrl = `${SUPABASE_URL}/functions/v1/zillow-api`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(functionUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'getComps',
            address,
            filters: {
              radius: filters?.radius || 1,
              minSqft: filters?.minSqft,
              maxSqft: filters?.maxSqft,
              soldInLastMonths: filters?.soldInLastMonths || 6,
              minBedrooms: filters?.minBedrooms,
              maxBedrooms: filters?.maxBedrooms,
              propertyType: filters?.propertyType,
              limit: filters?.limit || 5,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(`Zillow API error: ${res.status}`);
        }

        return res.json();
      },
      RetryPresets.rateLimited
    );

    return response.comps || [];
  } catch (error) {
    console.error('[Zillow] Failed to get comps:', error);
    return [];
  }
}

/**
 * Calculate ARV (After Repair Value) from comparable sales
 *
 * @example
 * ```typescript
 * const arv = calculateARV(comps, subjectProperty);
 * console.log('Estimated ARV:', arv.estimatedValue);
 * ```
 */
export function calculateARV(
  comps: ComparableProperty[],
  subjectSqft: number
): PropertyValuation {
  if (comps.length === 0) {
    return {
      estimatedValue: 0,
      lowEstimate: 0,
      highEstimate: 0,
      confidence: 0,
      lastUpdated: new Date().toISOString(),
      source: 'calculated',
      methodology: 'No comparable sales available',
    };
  }

  // Calculate weighted average price per sqft
  // Weight by similarity score and recency
  let totalWeight = 0;
  let weightedPricePerSqft = 0;
  const pricesPerSqft: number[] = [];

  comps.forEach((comp) => {
    const weight = comp.similarity || 0.5;
    weightedPricePerSqft += comp.pricePerSqft * weight;
    totalWeight += weight;
    pricesPerSqft.push(comp.pricePerSqft);
  });

  const avgPricePerSqft = weightedPricePerSqft / totalWeight;
  const estimatedValue = Math.round(avgPricePerSqft * subjectSqft);

  // Calculate confidence based on comp consistency
  const variance =
    pricesPerSqft.reduce((sum, p) => sum + Math.pow(p - avgPricePerSqft, 2), 0) /
    pricesPerSqft.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avgPricePerSqft;

  // Higher CV = lower confidence (more variance in comps)
  const confidence = Math.max(0, Math.min(1, 1 - coefficientOfVariation));

  // Calculate range based on variance
  const margin = stdDev * subjectSqft * 1.5;
  const lowEstimate = Math.round(estimatedValue - margin);
  const highEstimate = Math.round(estimatedValue + margin);

  return {
    estimatedValue,
    lowEstimate: Math.max(0, lowEstimate),
    highEstimate,
    confidence: Math.round(confidence * 100) / 100,
    lastUpdated: new Date().toISOString(),
    source: 'calculated',
    methodology: `Weighted average of ${comps.length} comparable sales at $${Math.round(avgPricePerSqft)}/sqft`,
  };
}

/**
 * Search for properties by criteria
 *
 * @example
 * ```typescript
 * const properties = await searchProperties({
 *   city: 'Austin',
 *   state: 'TX',
 *   minPrice: 200000,
 *   maxPrice: 400000,
 *   minBedrooms: 3
 * });
 * ```
 */
export async function searchProperties(criteria: {
  city?: string;
  state?: string;
  zipcode?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSqft?: number;
  maxSqft?: number;
  propertyType?: string;
  limit?: number;
}): Promise<ZillowPropertyData[]> {
  // In mock mode, return simulated results
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const limit = criteria.limit || 10;
    return Array(Math.min(limit, 5))
      .fill(null)
      .map((_, i) => ({
        ...MOCK_PROPERTY_DATA,
        zpid: `mock-${i}`,
        address: `${100 + i * 100} Mock Street`,
        price: 300000 + i * 50000,
        zestimate: 295000 + i * 50000,
      }));
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();

    const functionUrl = `${SUPABASE_URL}/functions/v1/zillow-api`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(functionUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'searchProperties',
            criteria,
          }),
        });

        if (!res.ok) {
          throw new Error(`Zillow API error: ${res.status}`);
        }

        return res.json();
      },
      RetryPresets.rateLimited
    );

    return response.properties || [];
  } catch (error) {
    console.error('[Zillow] Failed to search properties:', error);
    return [];
  }
}
