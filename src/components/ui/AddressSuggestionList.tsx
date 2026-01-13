// src/components/ui/AddressSuggestionList.tsx
// Suggestion list for address autocomplete

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { PlacePrediction } from './hooks/useAddressSearch';
import { useThemeColors } from '@/context/ThemeContext';

interface AddressSuggestionListProps {
  predictions: PlacePrediction[];
  searchText: string;
  isLoading: boolean;
  locationLoading: boolean;
  showCurrentLocation: boolean;
  hasApiKey: boolean;
  onSelectPrediction: (prediction: PlacePrediction) => void;
  onCurrentLocation: () => void;
  onManualEntry: () => void;
}

export function AddressSuggestionList({
  predictions,
  searchText,
  isLoading,
  locationLoading,
  showCurrentLocation,
  hasApiKey,
  onSelectPrediction,
  onCurrentLocation,
  onManualEntry,
}: AddressSuggestionListProps) {
  const colors = useThemeColors();

  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      className="flex-row items-center gap-3 border-b border-border px-4 py-3"
      onPress={() => onSelectPrediction(item)}
      activeOpacity={0.7}
    >
      <MapPin size={16} color={colors.mutedForeground} />
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
    <>
      {/* Current location button */}
      {showCurrentLocation && (
        <TouchableOpacity
          className="flex-row items-center gap-3 border-b border-border px-4 py-3"
          onPress={onCurrentLocation}
          disabled={locationLoading}
          activeOpacity={0.7}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Navigation size={16} color={colors.primary} />
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
            {hasApiKey ? 'No addresses found' : 'Enter address manually'}
          </Text>
          {searchText && (
            <TouchableOpacity className="mt-4 rounded-md bg-primary px-4 py-2" onPress={onManualEntry}>
              <Text className="text-sm font-medium text-primary-foreground">Use "{searchText}"</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="items-center py-8">
          <Text className="text-sm text-muted-foreground">Type at least 3 characters to search</Text>
        </View>
      )}
    </>
  );
}
