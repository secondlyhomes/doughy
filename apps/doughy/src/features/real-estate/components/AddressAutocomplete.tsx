/**
 * AddressAutocomplete
 *
 * Mobile address autocomplete component using OpenStreetMap geocoding.
 * Displays suggestions in a dropdown as the user types.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Modal,
} from 'react-native';
import { MapPin, X, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { supabase, SUPABASE_URL } from '@/lib/supabase';

export interface AddressResult {
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lon: number;
  displayName?: string;
}

// Geocoding API response types
interface GeocodingAddress {
  house_number?: string;
  road?: string;
  street?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  neighbourhood?: string;
  state?: string;
  postcode?: string;
  county?: string;
  country?: string;
}

interface GeocodingResult {
  address?: GeocodingAddress;
  lat?: string;
  lon?: string;
  display_name?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelected?: (result: AddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelected,
  placeholder = 'Enter an address...',
  disabled = false,
}: AddressAutocompleteProps) {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AddressResult[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear timeout and abort pending requests on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3) return;

    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsLoading(true);

    try {
      // Get Supabase URL for edge function
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.warn('No session available for geocoding');
        setResults([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/openstreetmap-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'geocode',
            params: {
              q: query,
              format: 'json',
              limit: 8,
              addressdetails: 1,
              countrycodes: 'us',
            },
          }),
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Geocoding failed');
      }

      const data = result.data;

      // Transform the data into our expected format
      const transformedResults = (data as GeocodingResult[])
        .filter((item) => item.address)
        .map((item) => {
          const address = item.address || {};

          const street = [address.house_number, address.road || address.street]
            .filter(Boolean)
            .join(' ');

          const city =
            address.city ||
            address.town ||
            address.village ||
            address.hamlet ||
            '';
          const state = address.state || '';
          const postcode = address.postcode || '';

          const hasStreet = !!street;
          const hasAltStreet = !!(
            address.road ||
            address.street ||
            address.house_number
          );

          if ((!hasStreet && !hasAltStreet) || !city) return null;

          const finalStreet =
            street ||
            [
              address.road,
              address.street,
              address.house_number,
              address.neighbourhood,
            ]
              .filter(Boolean)
              .join(' ')
              .trim();

          const addressResult: AddressResult = {
            address: finalStreet,
            city,
            state,
            zip: postcode,
            lat: parseFloat(item.lat || '0'),
            lon: parseFloat(item.lon || '0'),
            displayName: item.display_name,
          };
          return addressResult;
        });

      // Filter out nulls and sort by completeness
      const validResults: AddressResult[] = transformedResults.filter(
        (item): item is AddressResult => item !== null
      );

      validResults.sort((a, b) => {
        const scoreA =
          (a.address.length > 0 ? 2 : 0) +
          (a.city.length > 0 ? 1 : 0) +
          (a.state.length > 0 ? 1 : 0) +
          (a.zip.length > 0 ? 1 : 0);

        const scoreB =
          (b.address.length > 0 ? 2 : 0) +
          (b.city.length > 0 ? 1 : 0) +
          (b.state.length > 0 ? 1 : 0) +
          (b.zip.length > 0 ? 1 : 0);

        return scoreB - scoreA;
      });

      setResults(validResults);

      if (validResults.length > 0) {
        setIsOpen(true);
      }
    } catch (error) {
      // Ignore abort errors - they're expected when canceling requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error searching addresses:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (input: string) => {
      onChange(input);

      if (input.length < 3) {
        setResults([]);
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        return;
      }

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (input.length >= 3) {
          searchAddress(input);
        }
      }, 600);
    },
    [onChange, searchAddress]
  );

  const handleAddressSelect = useCallback(
    (result: AddressResult) => {
      const formattedAddress = `${result.address}, ${result.city}, ${result.state} ${result.zip}`.trim();

      onChange(formattedAddress);
      setIsOpen(false);
      Keyboard.dismiss();

      if (onAddressSelected) {
        onAddressSelected(result);
      }
    },
    [onChange, onAddressSelected]
  );

  const renderItem = useCallback(
    ({ item }: { item: AddressResult }) => (
      <TouchableOpacity
        onPress={() => handleAddressSelect(item)}
        className="flex-row items-start p-3"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <MapPin size={16} color={colors.mutedForeground} className="mt-1 mr-2" />
        <View className="flex-1">
          <Text className="font-medium" style={{ color: colors.foreground }}>{item.address}</Text>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            {item.city}, {item.state} {item.zip}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [handleAddressSelect, colors]
  );

  return (
    <View>
      {/* Input Field */}
      <View className="flex-row items-center rounded-lg" style={{ backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }}>
        <MapPin size={18} color={colors.mutedForeground} className="ml-3" />
        <TextInput
          value={value}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          editable={!disabled}
          className="flex-1 px-3 py-3"
          style={{ color: colors.foreground }}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.mutedForeground} className="mr-3" />
        ) : results.length > 0 ? (
          <TouchableOpacity
            onPress={() => setIsOpen(!isOpen)}
            className="mr-3"
          >
            <ChevronDown size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Results Dropdown - Using ScrollView instead of FlatList to avoid VirtualizedList nesting warning */}
      {isOpen && results.length > 0 && (
        <View className="absolute top-14 left-0 right-0 z-50 rounded-lg shadow-lg max-h-64" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {results.map((item, index) => (
              <View key={`${item.lat}-${item.lon}-${index}`}>
                {renderItem({ item })}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default AddressAutocomplete;
