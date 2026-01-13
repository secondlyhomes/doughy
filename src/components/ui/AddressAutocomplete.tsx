// src/components/ui/AddressAutocomplete.tsx
// Address input with autocomplete suggestions
// Supports manual entry and optional Google Places API integration

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal as RNModal, ViewProps } from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';
import { SearchBar } from './SearchBar';
import { useAddressSearch, AddressValue, PlacePrediction } from './hooks/useAddressSearch';
import { AddressSuggestionList } from './AddressSuggestionList';

export type { AddressValue } from './hooks/useAddressSearch';

export interface AddressAutocompleteProps extends ViewProps {
  value?: AddressValue;
  onChange?: (address: AddressValue | undefined) => void;
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
  const colors = useThemeColors();

  const {
    searchText,
    setSearchText,
    predictions,
    isLoading,
    locationLoading,
    fetchPlaceDetails,
    getCurrentLocation,
    reset,
  } = useAddressSearch({ apiKey, isOpen });

  const handleSelectPrediction = useCallback(async (prediction: PlacePrediction) => {
    if (apiKey) {
      const details = await fetchPlaceDetails(prediction.place_id);
      onChange?.(details || { formatted: prediction.description, placeId: prediction.place_id });
    } else {
      onChange?.({ formatted: prediction.description, placeId: prediction.place_id });
    }
    setIsOpen(false);
    reset();
  }, [apiKey, fetchPlaceDetails, onChange, reset]);

  const handleManualEntry = useCallback(() => {
    if (searchText.trim()) {
      onChange?.({ formatted: searchText.trim() });
    }
    setIsOpen(false);
    reset();
  }, [searchText, onChange, reset]);

  const handleCurrentLocation = useCallback(async () => {
    const address = await getCurrentLocation();
    if (address) {
      onChange?.(address);
      setIsOpen(false);
    }
  }, [getCurrentLocation, onChange]);

  const handleClear = useCallback(() => {
    onChange?.(undefined);
  }, [onChange]);

  return (
    <View className={cn('w-full', className)} {...props}>
      {label && <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text>}

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
        <MapPin size={16} color={colors.mutedForeground} />
        <Text className={cn('ml-2 flex-1 text-sm', value?.formatted ? 'text-foreground' : 'text-muted-foreground')} numberOfLines={2}>
          {value?.formatted || placeholder}
        </Text>
        {value && !disabled && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error && <Text className="mt-1 text-sm text-destructive">{error}</Text>}

      {/* Search modal */}
      <RNModal visible={isOpen} animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search address..."
              size="sm"
              autoFocus
              isLoading={isLoading}
              onSubmit={handleManualEntry}
              className="flex-1"
            />
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text className="text-sm font-medium text-primary">Cancel</Text>
            </TouchableOpacity>
          </View>

          <AddressSuggestionList
            predictions={predictions}
            searchText={searchText}
            isLoading={isLoading}
            locationLoading={locationLoading}
            showCurrentLocation={showCurrentLocation}
            hasApiKey={!!apiKey}
            onSelectPrediction={handleSelectPrediction}
            onCurrentLocation={handleCurrentLocation}
            onManualEntry={handleManualEntry}
          />
        </View>
      </RNModal>
    </View>
  );
}
