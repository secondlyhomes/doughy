// src/lib/zillow.ts
// Zillow/Property data client wrapper for property valuations and comparables

import { supabase, SUPABASE_URL, USE_MOCK_DATA } from './supabase';
import { retryWithBackoff, RetryPresets } from './retry';
import {
  MOCK_PROPERTY_DATA,
  MOCK_COMPS,
  generateMockSearchResults,
  generateMockPropertyValue,
} from './zillow-mocks';
import { calculateARV as calculateARVImpl } from './zillow-calculations';

// Re-export types from zillow-types for backward compatibility
export type {
  ZillowPropertyData,
  ComparableProperty,
  CompFilters,
  PropertyValuation,
} from './zillow-types';

// Import types for local use
import type {
  ZillowPropertyData,
  ComparableProperty,
  CompFilters,
} from './zillow-types';

/**
 * Make an authenticated request to the Zillow API edge function
 */
async function makeZillowRequest<T>(
  action: string,
  payload: Record<string, unknown>
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const functionUrl = `${SUPABASE_URL}/functions/v1/zillow-api`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (sessionData?.session?.access_token) {
    headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
  }

  return retryWithBackoff(
    async () => {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, ...payload }),
      });

      if (!res.ok) {
        throw new Error(`Zillow API error: ${res.status}`);
      }

      return res.json();
    },
    RetryPresets.rateLimited
  );
}

/**
 * Get property value (Zestimate) from Zillow API
 *
 * @example
 * ```typescript
 * const value = await getPropertyValue('123 Main St, Austin, TX 78701');
 * console.log('Estimated value:', value); // 450000
 * ```
 */
export async function getPropertyValue(address: string): Promise<number | null> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return generateMockPropertyValue(address);
  }

  try {
    const response = await makeZillowRequest<{ zestimate?: number; price?: number }>(
      'getPropertyValue',
      { address }
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
export async function getPropertyDetails(address: string): Promise<ZillowPropertyData | null> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      ...MOCK_PROPERTY_DATA,
      address: address.split(',')[0] || MOCK_PROPERTY_DATA.address,
    };
  }

  try {
    const response = await makeZillowRequest<ZillowPropertyData>(
      'getPropertyDetails',
      { address }
    );
    return response;
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
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const limit = filters?.limit || 5;
    return MOCK_COMPS.slice(0, limit);
  }

  try {
    const response = await makeZillowRequest<{ comps?: ComparableProperty[] }>(
      'getComps',
      {
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
      }
    );
    return response.comps || [];
  } catch (error) {
    console.error('[Zillow] Failed to get comps:', error);
    return [];
  }
}

/**
 * Calculate ARV (After Repair Value) from comparable sales
 * Re-exported from zillow-calculations for backward compatibility
 */
export const calculateARV = calculateARVImpl;

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
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return generateMockSearchResults(criteria.limit || 10);
  }

  try {
    const response = await makeZillowRequest<{ properties?: ZillowPropertyData[] }>(
      'searchProperties',
      { criteria }
    );
    return response.properties || [];
  } catch (error) {
    console.error('[Zillow] Failed to search properties:', error);
    return [];
  }
}
