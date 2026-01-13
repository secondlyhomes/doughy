// src/features/real-estate/components/PropertyListEmpty.tsx
// Empty state components for property list

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, Plus } from 'lucide-react-native';

interface PropertyListEmptyProps {
  isLoading: boolean;
  error: Error | null;
  hasFilters: boolean;
  onRetry: () => void;
  onAddProperty: () => void;
  onClearFilters: () => void;
}

export function PropertyListEmpty({
  isLoading,
  error,
  hasFilters,
  onRetry,
  onAddProperty,
  onClearFilters,
}: PropertyListEmptyProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-4">Loading properties...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-4">
        <Text className="text-destructive text-center mb-4">Error loading properties</Text>
        <TouchableOpacity onPress={onRetry} className="bg-primary px-4 py-2 rounded-lg">
          <Text className="text-primary-foreground font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasFilters) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Search size={48} className="text-muted-foreground mb-4" />
        <Text className="text-lg font-semibold text-foreground mb-2">No Results Found</Text>
        <Text className="text-muted-foreground text-center mb-6 px-8">
          Try adjusting your search or filters to find what you're looking for.
        </Text>
        <TouchableOpacity onPress={onClearFilters} className="bg-muted px-4 py-2 rounded-lg">
          <Text className="text-foreground font-medium">Clear All Filters</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-xl font-semibold text-foreground mb-2">No Properties Yet</Text>
      <Text className="text-muted-foreground text-center mb-6 px-8">
        Add your first property to get started tracking your real estate investments.
      </Text>
      <TouchableOpacity
        onPress={onAddProperty}
        className="bg-primary px-6 py-3 rounded-lg flex-row items-center"
      >
        <Plus size={20} color="white" />
        <Text className="text-primary-foreground font-semibold ml-2">Add Property</Text>
      </TouchableOpacity>
    </View>
  );
}
