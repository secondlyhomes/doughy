// src/components/ui/AddressAutofill/hooks/useVerifiedAddressSearch.ts
// Hook for searching verified addresses from the database

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AddressSuggestion, VerifiedAddressRow } from '../types';

interface UseVerifiedAddressSearchOptions {
  /** Minimum characters before searching */
  minChars?: number;
  /** Maximum results to return */
  limit?: number;
}

interface UseVerifiedAddressSearchReturn {
  /** Search for addresses matching query */
  searchVerifiedAddresses: (query: string) => Promise<AddressSuggestion[]>;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Increment usage count for an address */
  incrementUsageCount: (addressId: string) => Promise<void>;
}

/**
 * Hook for searching verified addresses from the database.
 * RLS policies automatically filter to:
 * - Public addresses in user's workspace
 * - User's own private addresses
 */
export function useVerifiedAddressSearch(
  options: UseVerifiedAddressSearchOptions = {}
): UseVerifiedAddressSearchReturn {
  const { minChars = 3, limit = 5 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchVerifiedAddresses = useCallback(
    async (query: string): Promise<AddressSuggestion[]> => {
      if (!query || query.length < minChars) {
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        // Search using ilike for simple prefix/contains matching
        // RLS policies will automatically filter to accessible addresses
        // Note: Type assertion used because verified_addresses table is new
        // Types will be generated after migration is run with `npm run db:types`
        const { data, error: queryError } = await (supabase as any)
          .from('verified_addresses')
          .select('*')
          .or(`formatted_address.ilike.%${query}%,city.ilike.%${query}%,street_address.ilike.%${query}%`)
          .order('usage_count', { ascending: false })
          .limit(limit);

        if (queryError) {
          throw queryError;
        }

        // Transform database rows to suggestions
        const suggestions: AddressSuggestion[] = (data as VerifiedAddressRow[] || []).map(
          (row): AddressSuggestion => ({
            id: `db-${row.id}`,
            primaryText: row.street_address,
            secondaryText: `${row.city}, ${row.state} ${row.zip}`,
            address: {
              formatted: row.formatted_address,
              street: row.street_address,
              city: row.city,
              state: row.state,
              zip: row.zip,
              county: row.county || undefined,
              country: row.country || 'US',
              lat: row.latitude || undefined,
              lng: row.longitude || undefined,
              isVerified: row.is_verified,
              isPublic: row.is_public,
              source: row.source,
              verifiedAddressId: row.id,
              osmPlaceId: row.osm_place_id || undefined,
            },
            badge: row.usage_count > 0 ? 'recent' : 'verified',
          })
        );

        return suggestions;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to search addresses';
        setError(message);
        console.error('Error searching verified addresses:', err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [minChars, limit]
  );

  const incrementUsageCount = useCallback(async (addressId: string): Promise<void> => {
    try {
      // Direct increment via raw SQL update
      // Note: Type assertion used because verified_addresses table is new
      const { error } = await (supabase as any)
        .from('verified_addresses')
        .update({ usage_count: (supabase as any).rpc('increment_usage_count') })
        .eq('id', addressId);

      // If that fails, try a simple increment approach
      if (error) {
        // Fallback: fetch current count, increment, update
        const { data: current } = await (supabase as any)
          .from('verified_addresses')
          .select('usage_count')
          .eq('id', addressId)
          .single();

        if (current) {
          await (supabase as any)
            .from('verified_addresses')
            .update({ usage_count: (current.usage_count || 0) + 1 })
            .eq('id', addressId);
        }
      }
    } catch (err) {
      // Non-critical - just log and continue
      console.warn('Failed to increment address usage count:', err);
    }
  }, []);

  return {
    searchVerifiedAddresses,
    isLoading,
    error,
    incrementUsageCount,
  };
}

export default useVerifiedAddressSearch;
