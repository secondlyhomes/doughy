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
  FlatList,
  ActivityIndicator,
  Keyboard,
  Modal,
} from 'react-native';
import { MapPin, X, ChevronDown } from 'lucide-react-native';
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
      const transformedResults = data
        .filter((item: any) => item.address)
        .map((item: any) => {
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

          return {
            address: finalStreet,
            city,
            state,
            zip: postcode,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            displayName: item.display_name,
          };
        })
        .filter(Boolean)
        .sort((a: AddressResult, b: AddressResult) => {
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

      setResults(transformedResults);

      if (transformedResults.length > 0) {
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
        className="flex-row items-start p-3 border-b border-border"
      >
        <MapPin size={16} color="#6b7280" className="mt-1 mr-2" />
        <View className="flex-1">
          <Text className="text-foreground font-medium">{item.address}</Text>
          <Text className="text-muted-foreground text-sm">
            {item.city}, {item.state} {item.zip}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [handleAddressSelect]
  );

  return (
    <View>
      {/* Input Field */}
      <View className="flex-row items-center bg-input border border-border rounded-lg">
        <MapPin size={18} color="#6b7280" className="ml-3" />
        <TextInput
          value={value}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          editable={!disabled}
          className="flex-1 px-3 py-3 text-foreground"
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color="#6b7280" className="mr-3" />
        ) : results.length > 0 ? (
          <TouchableOpacity
            onPress={() => setIsOpen(!isOpen)}
            className="mr-3"
          >
            <ChevronDown size={18} color="#6b7280" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <View className="absolute top-14 left-0 right-0 z-50 bg-card border border-border rounded-lg shadow-lg max-h-64">
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          />
        </View>
      )}
    </View>
  );
}

export default AddressAutocomplete;
