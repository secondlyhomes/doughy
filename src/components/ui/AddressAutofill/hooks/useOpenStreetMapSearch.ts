// src/components/ui/AddressAutofill/hooks/useOpenStreetMapSearch.ts
// Hook for searching addresses via OpenStreetMap Nominatim API

import { useState, useCallback, useRef } from 'react';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import type { AddressSuggestion, OSMGeocodingResult } from '../types';

interface UseOpenStreetMapSearchOptions {
  /** Minimum characters before searching */
  minChars?: number;
  /** Maximum results to return */
  limit?: number;
  /** Country codes to filter (default: 'us') */
  countryCodes?: string;
}

interface UseOpenStreetMapSearchReturn {
  /** Search for addresses using OSM */
  searchOpenStreetMap: (query: string) => Promise<AddressSuggestion[]>;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Hook for searching addresses via OpenStreetMap Nominatim API.
 * Uses the existing edge function pattern for proxied API calls.
 */
export function useOpenStreetMapSearch(
  options: UseOpenStreetMapSearchOptions = {}
): UseOpenStreetMapSearchReturn {
  const { minChars = 3, limit = 8, countryCodes = 'us' } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchOpenStreetMap = useCallback(
    async (query: string): Promise<AddressSuggestion[]> => {
      if (!query || query.length < minChars) {
        return [];
      }

      // Abort any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setIsLoading(true);
      setError(null);

      try {
        // Get session for authenticated request
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          console.warn('No session available for geocoding');
          return [];
        }

        // Call OSM via Nominatim directly (or edge function if available)
        // Using Nominatim directly since edge function doesn't exist
        const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
        nominatimUrl.searchParams.set('q', query);
        nominatimUrl.searchParams.set('format', 'json');
        nominatimUrl.searchParams.set('limit', limit.toString());
        nominatimUrl.searchParams.set('addressdetails', '1');
        nominatimUrl.searchParams.set('countrycodes', countryCodes);

        const response = await fetch(nominatimUrl.toString(), {
          headers: {
            'User-Agent': 'DoughyApp/1.0 (contact@doughy.ai)',
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(`Geocoding error: ${response.statusText}`);
        }

        const data: OSMGeocodingResult[] = await response.json();

        // Transform results to suggestions
        const suggestions: AddressSuggestion[] = data
          .filter((item) => item.address) // Only items with address details
          .map((item): AddressSuggestion | null => {
            const addr = item.address || {};

            // Build street address
            const street = [addr.house_number, addr.road || addr.street]
              .filter(Boolean)
              .join(' ')
              .trim();

            // Get city (try multiple fields)
            const city = addr.city || addr.town || addr.village || addr.hamlet || '';

            // Get state and zip
            const state = addr.state || '';
            const zip = addr.postcode || '';

            // Skip if missing critical fields
            if (!street || !city) {
              return null;
            }

            const formatted = `${street}, ${city}, ${state} ${zip}`.replace(/\s+/g, ' ').trim();

            return {
              id: `osm-${item.place_id}`,
              primaryText: street,
              secondaryText: `${city}, ${state} ${zip}`.trim(),
              address: {
                formatted,
                street,
                city,
                state,
                zip,
                county: addr.county || undefined,
                country: addr.country || 'US',
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                isVerified: true,
                isPublic: true, // OSM addresses are always public when saved
                source: 'openstreetmap',
                osmPlaceId: item.place_id,
              },
            };
          })
          .filter((item): item is AddressSuggestion => item !== null);

        // Sort by completeness
        suggestions.sort((a, b) => {
          const scoreA =
            (a.address.street ? 2 : 0) +
            (a.address.city ? 1 : 0) +
            (a.address.state ? 1 : 0) +
            (a.address.zip ? 1 : 0);
          const scoreB =
            (b.address.street ? 2 : 0) +
            (b.address.city ? 1 : 0) +
            (b.address.state ? 1 : 0) +
            (b.address.zip ? 1 : 0);
          return scoreB - scoreA;
        });

        return suggestions;
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return [];
        }

        const message = err instanceof Error ? err.message : 'Failed to search addresses';
        setError(message);
        console.error('Error searching OpenStreetMap:', err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [minChars, limit, countryCodes]
  );

  return {
    searchOpenStreetMap,
    isLoading,
    error,
  };
}

export default useOpenStreetMapSearch;
