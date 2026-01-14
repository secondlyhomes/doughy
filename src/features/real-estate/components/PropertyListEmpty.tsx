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
        <Text className="text-center mb-4" style={{ color: colors.destructive }}>Error loading properties</Text>
        <Button onPress={onRetry}>Try Again</Button>
      </View>
    );
  }

  if (hasFilters) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Search size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
        <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>No Results Found</Text>
        <Text className="text-center mb-6 px-8" style={{ color: colors.mutedForeground }}>
          Try adjusting your search or filters to find what you're looking for.
        </Text>
        <Button variant="secondary" onPress={onClearFilters}>Clear All Filters</Button>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-xl font-semibold mb-2" style={{ color: colors.foreground }}>No Properties Yet</Text>
      <Text className="text-center mb-6 px-8" style={{ color: colors.mutedForeground }}>
        Add your first property to get started tracking your real estate investments.
      </Text>
      <Button onPress={onAddProperty} size="lg">
        <Plus size={20} color={colors.primaryForeground} />
        <Text className="font-semibold ml-2" style={{ color: colors.primaryForeground }}>Add Property</Text>
      </Button>
    </View>
  );
}
