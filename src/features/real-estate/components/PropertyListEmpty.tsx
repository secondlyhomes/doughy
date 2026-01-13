// src/features/real-estate/components/PropertyListEmpty.tsx
// Empty state components for property list

import React from 'react';
import { View, Text } from 'react-native';
import { Search, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Button, LoadingSpinner } from '@/components/ui';

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
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <LoadingSpinner fullScreen text="Loading properties..." className="py-20" />
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-4">
        <Text className="text-destructive text-center mb-4">Error loading properties</Text>
        <Button onPress={onRetry}>Try Again</Button>
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
        <Button variant="secondary" onPress={onClearFilters}>Clear All Filters</Button>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-xl font-semibold text-foreground mb-2">No Properties Yet</Text>
      <Text className="text-muted-foreground text-center mb-6 px-8">
        Add your first property to get started tracking your real estate investments.
      </Text>
      <Button onPress={onAddProperty} size="lg">
        <Plus size={20} color={colors.primaryForeground} />
        <Text className="text-primary-foreground font-semibold ml-2">Add Property</Text>
      </Button>
    </View>
  );
}
