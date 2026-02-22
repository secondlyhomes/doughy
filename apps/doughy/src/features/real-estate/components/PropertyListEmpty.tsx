// src/features/real-estate/components/PropertyListEmpty.tsx
// Empty state components for property list

import React from 'react';
import { Home, Search } from 'lucide-react-native';
import { ListEmptyState } from '@/components/ui';

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
  // Determine state
  const state = isLoading
    ? 'loading'
    : error
    ? 'error'
    : hasFilters
    ? 'filtered'
    : 'empty';

  // Primary action based on state
  const primaryAction = error
    ? { label: 'Try Again', onPress: onRetry }
    : hasFilters
    ? { label: 'Clear Filters', onPress: onClearFilters }
    : { label: 'Add Property', onPress: onAddProperty };

  return (
    <ListEmptyState
      state={state}
      icon={hasFilters ? Search : Home}
      title={
        error
          ? 'Error Loading Properties'
          : hasFilters
          ? 'No Results Found'
          : 'No Properties Yet'
      }
      description={
        error
          ? error.message || 'Unable to load properties. Please try again.'
          : hasFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Add your first property to get started tracking your real estate investments.'
      }
      primaryAction={primaryAction}
    />
  );
}
