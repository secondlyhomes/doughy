// src/components/ui/hooks/useAddressSearch.ts
// Address search hook with Google Places API and location support

import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { useDebounce } from '@/hooks';

export interface AddressValue {
  formatted: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface UseAddressSearchOptions {
  apiKey?: string;
  isOpen: boolean;
}

export function useAddressSearch({ apiKey, isOpen }: UseAddressSearchOptions) {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const debouncedSearch = useDebounce(searchText, 300);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!apiKey || input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`
      );
      const data = await response.json();
      setPredictions(data.status === 'OK' && data.predictions ? data.predictions : []);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const fetchPlaceDetails = useCallback(async (placeId: string): Promise<AddressValue | null> => {
    if (!apiKey) return null;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,address_components,geometry&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const { formatted_address, address_components, geometry } = data.result;
        const getComponent = (type: string) =>
          address_components?.find((c: { types: string[] }) => c.types.includes(type))?.long_name;

        return {
          formatted: formatted_address,
          street: `${getComponent('street_number') || ''} ${getComponent('route') || ''}`.trim(),
          city: getComponent('locality') || getComponent('sublocality'),
          state: getComponent('administrative_area_level_1'),
          zip: getComponent('postal_code'),
          country: getComponent('country'),
          lat: geometry?.location?.lat,
          lng: geometry?.location?.lng,
          placeId,
        };
      }
    } catch (err) {
      console.error('Error fetching place details:', err);
    }
    return null;
  }, [apiKey]);

  const getCurrentLocation = useCallback(async (): Promise<AddressValue | null> => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode) {
        const formatted = [
          reverseGeocode.streetNumber,
          reverseGeocode.street,
          reverseGeocode.city,
          reverseGeocode.region,
          reverseGeocode.postalCode,
        ].filter(Boolean).join(', ');

        return {
          formatted,
          street: `${reverseGeocode.streetNumber || ''} ${reverseGeocode.street || ''}`.trim(),
          city: reverseGeocode.city || undefined,
          state: reverseGeocode.region || undefined,
          zip: reverseGeocode.postalCode || undefined,
          country: reverseGeocode.country || undefined,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
      }
    } catch (err) {
      console.error('Error getting current location:', err);
    } finally {
      setLocationLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    if (debouncedSearch && isOpen) {
      fetchPredictions(debouncedSearch);
    } else {
      setPredictions([]);
    }
  }, [debouncedSearch, isOpen, fetchPredictions]);

  const reset = useCallback(() => {
    setSearchText('');
    setPredictions([]);
  }, []);

  return {
    searchText,
    setSearchText,
    predictions,
    isLoading,
    locationLoading,
    fetchPlaceDetails,
    getCurrentLocation,
    reset,
    apiKey,
  };
}
