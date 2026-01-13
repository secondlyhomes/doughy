// src/components/ui/AddressAutocomplete.tsx
// Address input with autocomplete suggestions
// Supports manual entry and optional Google Places API integration
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal as RNModal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ViewProps,
} from 'react-native';
import { MapPin, Search, X, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks';

// Address value structure
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

// Google Places API prediction type
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export interface AddressAutocompleteProps extends ViewProps {
  value?: AddressValue;
  onChange?: (address: AddressValue) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  apiKey?: string;
  showCurrentLocation?: boolean;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Enter address',
  label,
  error,
  disabled = false,
  apiKey,
  showCurrentLocation = true,
  className,
  ...props
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const debouncedSearch = useDebounce(searchText, 300);

  // Fetch predictions from Google Places API
  const fetchPredictions = useCallback(async (input: string) => {
    if (!apiKey || input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&types=address&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setPredictions(data.predictions);
      } else {
        setPredictions([]);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  // Fetch place details
  const fetchPlaceDetails = useCallback(async (placeId: string): Promise<AddressValue | null> => {
    if (!apiKey) return null;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,address_components,geometry&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const { formatted_address, address_components, geometry } = data.result;

        // Parse address components
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

  // Effect to fetch predictions when search text changes
  useEffect(() => {
    if (debouncedSearch && isOpen) {
      fetchPredictions(debouncedSearch);
    } else {
      setPredictions([]);
    }
  }, [debouncedSearch, isOpen, fetchPredictions]);

  // Handle prediction selection
  const handleSelectPrediction = useCallback(async (prediction: PlacePrediction) => {
    setIsLoading(true);

    if (apiKey) {
      const details = await fetchPlaceDetails(prediction.place_id);
      if (details) {
        onChange?.(details);
      } else {
        // Fallback to basic address
        onChange?.({
          formatted: prediction.description,
          placeId: prediction.place_id,
        });
      }
    } else {
      onChange?.({
        formatted: prediction.description,
        placeId: prediction.place_id,
      });
    }

    setIsOpen(false);
    setSearchText('');
    setIsLoading(false);
  }, [apiKey, fetchPlaceDetails, onChange]);

  // Handle manual address entry
  const handleManualEntry = useCallback(() => {
    if (searchText.trim()) {
      onChange?.({
        formatted: searchText.trim(),
      });
    }
    setIsOpen(false);
    setSearchText('');
  }, [searchText, onChange]);

  // Get current location
  const handleCurrentLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return;
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
        ]
          .filter(Boolean)
          .join(', ');

        onChange?.({
          formatted,
          street: `${reverseGeocode.streetNumber || ''} ${reverseGeocode.street || ''}`.trim(),
          city: reverseGeocode.city || undefined,
          state: reverseGeocode.region || undefined,
          zip: reverseGeocode.postalCode || undefined,
          country: reverseGeocode.country || undefined,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Error getting current location:', err);
    } finally {
      setLocationLoading(false);
    }
  }, [onChange]);

  // Clear value
  const handleClear = useCallback(() => {
    onChange?.(undefined as unknown as AddressValue);
  }, [onChange]);

  // Render prediction item
  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      className="flex-row items-center gap-3 border-b border-border px-4 py-3"
      onPress={() => handleSelectPrediction(item)}
      activeOpacity={0.7}
    >
      <MapPin size={16} color="#64748b" />
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
          {item.structured_formatting?.main_text || item.description}
        </Text>
        {item.structured_formatting?.secondary_text && (
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {item.structured_formatting.secondary_text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className={cn('w-full', className)} {...props}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text>
      )}

      {/* Input trigger */}
      <TouchableOpacity
        className={cn(
          'min-h-[40px] flex-row items-center rounded-md border border-input bg-background px-3 py-2',
          disabled && 'opacity-50',
          error && 'border-destructive'
        )}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <MapPin size={16} color="#64748b" />
        <Text
          className={cn(
            'ml-2 flex-1 text-sm',
            value?.formatted ? 'text-foreground' : 'text-muted-foreground'
          )}
          numberOfLines={2}
        >
          {value?.formatted || placeholder}
        </Text>
        {value && !disabled && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error && (
        <Text className="mt-1 text-sm text-destructive">{error}</Text>
      )}

      {/* Search modal */}
      <RNModal
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
            <View className="flex-1 flex-row items-center rounded-md border border-input bg-muted/30 px-3 py-2">
              <Search size={16} color="#64748b" />
              <TextInput
                ref={inputRef}
                className="ml-2 flex-1 text-sm text-foreground"
                placeholder="Search address..."
                placeholderTextColor="#94a3b8"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleManualEntry}
              />
              {isLoading && <ActivityIndicator size="small" color="#64748b" />}
            </View>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text className="text-sm font-medium text-primary">Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Current location button */}
          {showCurrentLocation && (
            <TouchableOpacity
              className="flex-row items-center gap-3 border-b border-border px-4 py-3"
              onPress={handleCurrentLocation}
              disabled={locationLoading}
              activeOpacity={0.7}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Navigation size={16} color="#3b82f6" />
              )}
              <Text className="text-sm font-medium text-primary">
                {locationLoading ? 'Getting location...' : 'Use current location'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Predictions list */}
          {predictions.length > 0 ? (
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.place_id}
              renderItem={renderPrediction}
            />
          ) : searchText.length >= 3 && !isLoading ? (
            <View className="items-center py-8">
              <Text className="text-sm text-muted-foreground">
                {apiKey ? 'No addresses found' : 'Enter address manually'}
              </Text>
              {searchText && (
                <TouchableOpacity
                  className="mt-4 rounded-md bg-primary px-4 py-2"
                  onPress={handleManualEntry}
                >
                  <Text className="text-sm font-medium text-primary-foreground">
                    Use "{searchText}"
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="items-center py-8">
              <Text className="text-sm text-muted-foreground">
                Type at least 3 characters to search
              </Text>
            </View>
          )}
        </View>
      </RNModal>
    </View>
  );
}
