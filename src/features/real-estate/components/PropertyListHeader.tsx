// src/features/real-estate/components/PropertyListHeader.tsx
// Header component for property list with search, filters, and view toggle

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Search, Plus, Filter, Grid, List, ArrowUpDown, X } from 'lucide-react-native';
import { PropertyFilters, SORT_OPTIONS, SortOption } from '../hooks/usePropertyFilters';

interface PropertyListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  filters: PropertyFilters;
  sortBy: SortOption;
  onShowFilters: () => void;
  onShowSort: () => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export function PropertyListHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  activeFilterCount,
  filters,
  sortBy,
  onShowFilters,
  onShowSort,
  onResetFilters,
  totalCount,
  filteredCount,
}: PropertyListHeaderProps) {
  const getCurrentSortLabel = () => {
    const option = SORT_OPTIONS.find(o => o.value === sortBy);
    return option?.label || 'Newest First';
  };

  return (
    <View className="mb-4">
      {/* Search Bar */}
      <View className="flex-row items-center bg-muted rounded-xl px-4 py-2">
        <Search size={20} className="text-muted-foreground" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search properties..."
          placeholderTextColor="#9CA3AF"
          className="flex-1 ml-2 text-foreground text-base"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClearSearch} className="p-1">
            <X size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter, Sort, and View Toggle */}
      <View className="flex-row justify-between items-center mt-4">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onShowFilters}
            className={`flex-row items-center px-3 py-2 rounded-lg ${
              hasActiveFilters ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Filter size={16} color={hasActiveFilters ? 'white' : '#9CA3AF'} />
            <Text className={`ml-2 font-medium ${
              hasActiveFilters ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onShowSort}
            className="flex-row items-center bg-muted px-3 py-2 rounded-lg"
          >
            <ArrowUpDown size={16} className="text-muted-foreground" />
            <Text className="text-muted-foreground ml-2 font-medium">
              {getCurrentSortLabel()}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row bg-muted rounded-lg">
          <TouchableOpacity
            onPress={() => onViewModeChange('list')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-primary' : ''}`}
          >
            <List size={18} color={viewMode === 'list' ? 'white' : '#9CA3AF'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onViewModeChange('grid')}
            className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary' : ''}`}
          >
            <Grid size={18} color={viewMode === 'grid' ? 'white' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {filters.status.length > 0 && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">
                Status: {filters.status.length}
              </Text>
            </View>
          )}
          {filters.propertyType.length > 0 && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">
                Type: {filters.propertyType.length}
              </Text>
            </View>
          )}
          {(filters.priceMin !== null || filters.priceMax !== null) && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">Price Range</Text>
            </View>
          )}
          {(filters.arvMin !== null || filters.arvMax !== null) && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">ARV Range</Text>
            </View>
          )}
          {(filters.city || filters.state) && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">Location</Text>
            </View>
          )}
          <TouchableOpacity onPress={onResetFilters} className="flex-row items-center px-3 py-1">
            <X size={14} color="#6366f1" />
            <Text className="text-primary text-sm font-medium ml-1">Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      <Text className="text-muted-foreground text-sm mt-4">
        {filteredCount} {filteredCount === 1 ? 'property' : 'properties'}
        {(searchQuery || hasActiveFilters) && totalCount !== filteredCount ? ` of ${totalCount}` : ''}
      </Text>
    </View>
  );
}
