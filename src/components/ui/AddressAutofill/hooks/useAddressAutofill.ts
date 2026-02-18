// src/components/ui/AddressAutofill/hooks/useAddressAutofill.ts
// Main hook that combines database and OSM search with save functionality

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks';
import { useVerifiedAddressSearch } from './useVerifiedAddressSearch';
import { useOpenStreetMapSearch } from './useOpenStreetMapSearch';
import type { AddressSuggestion, AddressValue, AddressSource } from '../types';

interface UseAddressAutofillOptions {
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Minimum characters before searching */
  minChars?: number;
}

interface UseAddressAutofillReturn {
  /** Current search text */
  searchText: string;
  /** Set search text */
  setSearchText: (text: string) => void;
  /** Combined suggestions from all sources */
  suggestions: AddressSuggestion[];
  /** Loading state */
  isLoading: boolean;
  /** Whether dropdown should be open */
  isOpen: boolean;
  /** Set dropdown open state */
  setIsOpen: (open: boolean) => void;
  /** Handle selecting a suggestion */
  handleSelectSuggestion: (suggestion: AddressSuggestion) => Promise<AddressValue>;
  /** Handle manual entry (user typed without selecting) */
  handleManualEntry: (text: string) => Promise<AddressValue>;
  /** Reset the search state */
  reset: () => void;
}

/**
 * Main hook for address autofill functionality.
 * Combines database search and OSM geocoding with save logic.
 *
 * Behavior:
 * - Type 3+ chars → suggestions appear (DB first, then OSM)
 * - Pick suggestion → verified address saved to DB as public
 * - Submit without selecting → manual address saved as private
 */
export function useAddressAutofill(
  options: UseAddressAutofillOptions = {}
): UseAddressAutofillReturn {
  const { debounceMs = 300, minChars = 3 } = options;

  // State
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Debounced search text
  const debouncedSearch = useDebounce(searchText, debounceMs);

  // Sub-hooks
  const {
    searchVerifiedAddresses,
    isLoading: dbLoading,
    incrementUsageCount,
  } = useVerifiedAddressSearch({ minChars });

  const {
    searchOpenStreetMap,
    isLoading: osmLoading,
  } = useOpenStreetMapSearch({ minChars });

  // Track if search is active
  const searchActiveRef = useRef(false);

  // Combined search effect
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch || debouncedSearch.length < minChars) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      searchActiveRef.current = true;
      setIsLoading(true);

      try {
        // Search both sources in parallel
        const [dbResults, osmResults] = await Promise.all([
          searchVerifiedAddresses(debouncedSearch),
          searchOpenStreetMap(debouncedSearch),
        ]);

        // Only update if still active
        if (!searchActiveRef.current) return;

        // Deduplicate: prefer DB results over OSM
        const seenAddresses = new Set<string>();
        const combined: AddressSuggestion[] = [];

        // Add DB results first (higher priority)
        for (const suggestion of dbResults) {
          const key = suggestion.address.formatted.toLowerCase();
          if (!seenAddresses.has(key)) {
            seenAddresses.add(key);
            combined.push(suggestion);
          }
        }

        // Add OSM results that aren't duplicates
        for (const suggestion of osmResults) {
          const key = suggestion.address.formatted.toLowerCase();
          // Also check by OSM place ID
          const osmKey = suggestion.address.osmPlaceId || '';
          if (!seenAddresses.has(key) && !seenAddresses.has(osmKey)) {
            seenAddresses.add(key);
            if (osmKey) seenAddresses.add(osmKey);
            combined.push(suggestion);
          }
        }

        setSuggestions(combined.slice(0, 10)); // Limit to 10 total
        setIsOpen(combined.length > 0);
      } catch (err) {
        console.error('Error in address search:', err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();

    return () => {
      searchActiveRef.current = false;
    };
  }, [debouncedSearch, minChars, searchVerifiedAddresses, searchOpenStreetMap]);

  // Save address to database
  const saveAddress = useCallback(
    async (address: AddressValue): Promise<AddressValue> => {
      try {
        // Build insert data
        const insertData = {
          formatted_address: address.formatted,
          street_address: address.street || '',
          city: address.city || '',
          state: address.state || '',
          zip: address.zip || '',
          county: address.county || null,
          country: address.country || 'US',
          latitude: address.lat || null,
          longitude: address.lng || null,
          source: address.source,
          osm_place_id: address.osmPlaceId || null,
          is_verified: address.isVerified,
          is_public: address.isPublic,
          usage_count: 1,
          // workspace_id and user_id are set by trigger
        };

        // Upsert to handle duplicates
        // Note: Type assertion used because verified_addresses table is new
        // Types will be generated after migration is run with `npm run db:types`
        const { data, error } = await (supabase as any)
          .from('verified_addresses')
          .upsert(insertData, {
            onConflict: 'formatted_address,workspace_id,osm_place_id',
            ignoreDuplicates: false,
          })
          .select('id')
          .single();

        if (error) {
          // If conflict on insert, try to find existing and increment usage
          if (error.code === '23505') {
            const { data: existing } = await (supabase as any)
              .from('verified_addresses')
              .select('id')
              .eq('formatted_address', address.formatted)
              .single();

            if (existing) {
              await incrementUsageCount(existing.id);
              return { ...address, verifiedAddressId: existing.id };
            }
          }
          throw error;
        }

        return { ...address, verifiedAddressId: data?.id };
      } catch (err) {
        // Non-critical - address still works without saving
        console.warn('Failed to save address to database:', err);
        return address;
      }
    },
    [incrementUsageCount]
  );

  // Handle selecting a suggestion
  const handleSelectSuggestion = useCallback(
    async (suggestion: AddressSuggestion): Promise<AddressValue> => {
      const address = suggestion.address;

      // If already in DB, just increment usage
      if (address.verifiedAddressId) {
        await incrementUsageCount(address.verifiedAddressId);
        return address;
      }

      // Save new verified address to DB
      const savedAddress = await saveAddress(address);

      // Close dropdown and reset
      setIsOpen(false);
      setSearchText('');
      setSuggestions([]);

      return savedAddress;
    },
    [incrementUsageCount, saveAddress]
  );

  // Handle manual entry (user typed without selecting)
  const handleManualEntry = useCallback(
    async (text: string): Promise<AddressValue> => {
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('Address cannot be empty');
      }

      // Create manual address (private to user)
      const manualAddress: AddressValue = {
        formatted: trimmed,
        street: trimmed, // Best guess - user can edit city/state/zip separately
        isVerified: false,
        isPublic: false, // Private to creator
        source: 'manual',
      };

      // Save to database as private
      const savedAddress = await saveAddress(manualAddress);

      // Close dropdown and reset
      setIsOpen(false);
      setSuggestions([]);

      return savedAddress;
    },
    [saveAddress]
  );

  // Reset state
  const reset = useCallback(() => {
    searchActiveRef.current = false;
    setSearchText('');
    setSuggestions([]);
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  return {
    searchText,
    setSearchText,
    suggestions,
    isLoading: isLoading || dbLoading || osmLoading,
    isOpen,
    setIsOpen,
    handleSelectSuggestion,
    handleManualEntry,
    reset,
  };
}

export default useAddressAutofill;
