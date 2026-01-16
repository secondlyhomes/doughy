/**
 * Zillow API Edge Function
 * Description: Property data and valuation via Zillow/RapidAPI
 * Phase: Sprint 2 - Portfolio Integrations
 * Zone: D (Integrations)
 *
 * Note: Zillow API access requires a paid RapidAPI subscription.
 * This function gracefully handles missing API keys by returning null values.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors-standardized.ts';
import { decryptServer } from '../_shared/crypto-server.ts';

interface ZillowRequest {
  action: 'getPropertyValue' | 'getPropertyDetails' | 'getComps' | 'searchProperties';
  address?: string;
  filters?: {
    radius?: number;
    minSqft?: number;
    maxSqft?: number;
    soldInLastMonths?: number;
    minBedrooms?: number;
    maxBedrooms?: number;
    propertyType?: string;
    limit?: number;
  };
  criteria?: {
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
  };
}

interface ZillowPropertyData {
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
}

// RapidAPI Zillow endpoint
const ZILLOW_API_HOST = 'zillow-com1.p.rapidapi.com';
const ZILLOW_API_URL = `https://${ZILLOW_API_HOST}`;

/**
 * Get Zillow API key from encrypted storage
 */
async function getZillowApiKey(
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('security_api_keys')
      .select('key_ciphertext')
      .or('service.ilike.%zillow%,service.ilike.%rapidapi%')
      .maybeSingle();

    if (error || !data?.key_ciphertext) {
      console.warn('[Zillow-API] No Zillow/RapidAPI key found');
      return null;
    }

    return await decryptServer(data.key_ciphertext);
  } catch (error) {
    console.error('[Zillow-API] Error getting API key:', error);
    return null;
  }
}

/**
 * Make a request to the Zillow RapidAPI
 */
async function callZillowApi(
  apiKey: string,
  endpoint: string,
  params: Record<string, string>
): Promise<unknown> {
  const url = new URL(`${ZILLOW_API_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': ZILLOW_API_HOST,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Zillow-API] API error:', response.status, errorText);
    throw new Error(`Zillow API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get property value (Zestimate)
 */
async function getPropertyValue(
  apiKey: string,
  address: string
): Promise<{ zestimate: number | null; price: number | null }> {
  try {
    const data = await callZillowApi(apiKey, 'property', { address }) as {
      zestimate?: number;
      price?: number;
    };
    return {
      zestimate: data.zestimate || null,
      price: data.price || null,
    };
  } catch (error) {
    console.error('[Zillow-API] getPropertyValue error:', error);
    return { zestimate: null, price: null };
  }
}

/**
 * Get detailed property data
 */
async function getPropertyDetails(
  apiKey: string,
  address: string
): Promise<ZillowPropertyData | null> {
  try {
    const data = await callZillowApi(apiKey, 'property', { address }) as Record<string, unknown>;

    return {
      zpid: data.zpid as string,
      address: (data.streetAddress as string) || address.split(',')[0],
      city: data.city as string || '',
      state: data.state as string || '',
      zipcode: data.zipcode as string || '',
      price: data.price as number,
      zestimate: data.zestimate as number,
      rentZestimate: data.rentZestimate as number,
      bedrooms: data.bedrooms as number || 0,
      bathrooms: data.bathrooms as number || 0,
      sqft: data.livingArea as number || data.sqft as number || 0,
      lotSize: data.lotSize as number,
      yearBuilt: data.yearBuilt as number,
      propertyType: data.homeType as string,
      lastSoldPrice: data.lastSoldPrice as number,
      lastSoldDate: data.dateSold as string,
      latitude: data.latitude as number,
      longitude: data.longitude as number,
    };
  } catch (error) {
    console.error('[Zillow-API] getPropertyDetails error:', error);
    return null;
  }
}

/**
 * Get comparable properties
 */
async function getComps(
  apiKey: string,
  address: string,
  filters?: ZillowRequest['filters']
): Promise<{ comps: ZillowPropertyData[] }> {
  try {
    // First get the property to find its zpid
    const property = await getPropertyDetails(apiKey, address);
    if (!property?.zpid) {
      return { comps: [] };
    }

    const params: Record<string, string> = {
      zpid: property.zpid,
    };

    if (filters?.limit) {
      params.count = String(filters.limit);
    }

    const data = await callZillowApi(apiKey, 'similarProperty', params) as {
      props?: Array<Record<string, unknown>>;
    };

    const comps: ZillowPropertyData[] = (data.props || [])
      .slice(0, filters?.limit || 5)
      .map((prop) => ({
        zpid: prop.zpid as string,
        address: prop.streetAddress as string || '',
        city: prop.city as string || '',
        state: prop.state as string || '',
        zipcode: prop.zipcode as string || '',
        price: prop.price as number,
        zestimate: prop.zestimate as number,
        bedrooms: prop.bedrooms as number || 0,
        bathrooms: prop.bathrooms as number || 0,
        sqft: prop.livingArea as number || 0,
        yearBuilt: prop.yearBuilt as number,
        propertyType: prop.homeType as string,
      }))
      .filter((comp) => {
        // Apply filters
        if (filters?.minSqft && comp.sqft < filters.minSqft) return false;
        if (filters?.maxSqft && comp.sqft > filters.maxSqft) return false;
        if (filters?.minBedrooms && comp.bedrooms < filters.minBedrooms) return false;
        if (filters?.maxBedrooms && comp.bedrooms > filters.maxBedrooms) return false;
        return true;
      });

    return { comps };
  } catch (error) {
    console.error('[Zillow-API] getComps error:', error);
    return { comps: [] };
  }
}

/**
 * Search properties by criteria
 */
async function searchProperties(
  apiKey: string,
  criteria: ZillowRequest['criteria']
): Promise<{ properties: ZillowPropertyData[] }> {
  try {
    if (!criteria) {
      return { properties: [] };
    }

    const params: Record<string, string> = {};

    if (criteria.city) params.city = criteria.city;
    if (criteria.state) params.state = criteria.state;
    if (criteria.zipcode) params.zipcode = criteria.zipcode;
    if (criteria.minPrice) params.minPrice = String(criteria.minPrice);
    if (criteria.maxPrice) params.maxPrice = String(criteria.maxPrice);
    if (criteria.minBedrooms) params.bedsMin = String(criteria.minBedrooms);
    if (criteria.maxBedrooms) params.bedsMax = String(criteria.maxBedrooms);
    if (criteria.minBathrooms) params.bathsMin = String(criteria.minBathrooms);
    if (criteria.maxBathrooms) params.bathsMax = String(criteria.maxBathrooms);
    if (criteria.minSqft) params.sqftMin = String(criteria.minSqft);
    if (criteria.maxSqft) params.sqftMax = String(criteria.maxSqft);

    const data = await callZillowApi(apiKey, 'propertySearch', params) as {
      props?: Array<Record<string, unknown>>;
    };

    const properties: ZillowPropertyData[] = (data.props || [])
      .slice(0, criteria.limit || 10)
      .map((prop) => ({
        zpid: prop.zpid as string,
        address: prop.streetAddress as string || '',
        city: prop.city as string || '',
        state: prop.state as string || '',
        zipcode: prop.zipcode as string || '',
        price: prop.price as number,
        zestimate: prop.zestimate as number,
        rentZestimate: prop.rentZestimate as number,
        bedrooms: prop.bedrooms as number || 0,
        bathrooms: prop.bathrooms as number || 0,
        sqft: prop.livingArea as number || 0,
        lotSize: prop.lotSize as number,
        yearBuilt: prop.yearBuilt as number,
        propertyType: prop.homeType as string,
      }));

    return { properties };
  } catch (error) {
    console.error('[Zillow-API] searchProperties error:', error);
    return { properties: [] };
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await req.json() as ZillowRequest;

    // Validate action
    const validActions = ['getPropertyValue', 'getPropertyDetails', 'getComps', 'searchProperties'];
    if (!body.action || !validActions.includes(body.action)) {
      return new Response(
        JSON.stringify({
          error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get API key
    const apiKey = await getZillowApiKey(supabase);

    if (!apiKey) {
      // Return graceful response when API is not configured
      // Client-side code should handle null values appropriately
      console.log('[Zillow-API] API key not configured, returning null values');

      let result: Record<string, unknown> = {};

      switch (body.action) {
        case 'getPropertyValue':
          result = { zestimate: null, price: null };
          break;
        case 'getPropertyDetails':
          result = null as unknown as Record<string, unknown>;
          break;
        case 'getComps':
          result = { comps: [] };
          break;
        case 'searchProperties':
          result = { properties: [] };
          break;
      }

      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate address for address-based actions
    if (['getPropertyValue', 'getPropertyDetails', 'getComps'].includes(body.action)) {
      if (!body.address) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: address' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Execute action
    let result: unknown;

    switch (body.action) {
      case 'getPropertyValue':
        result = await getPropertyValue(apiKey, body.address!);
        break;
      case 'getPropertyDetails':
        result = await getPropertyDetails(apiKey, body.address!);
        break;
      case 'getComps':
        result = await getComps(apiKey, body.address!, body.filters);
        break;
      case 'searchProperties':
        result = await searchProperties(apiKey, body.criteria);
        break;
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Zillow-API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
