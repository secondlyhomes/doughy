// src/features/rental-properties/screens/RentalPropertiesListScreen.tsx
// List screen for rental properties with search, filters, and FAB
// Follows the pattern from src/features/leads/screens/LeadsListScreen.tsx

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
  BottomSheet,
  BottomSheetSection,
  Button,
  SimpleFAB,
} from '@/components/ui';
import { DataCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Home, Search, Check } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RentalProperty, RentalType, PropertyStatus } from '../types';
import { useRentalPropertiesWithRooms } from '../hooks/useRentalProperties';
import { RentalPropertyCard } from '../components/RentalPropertyCard';

// ============================================
// Spacing Constants
// ============================================

const SEARCH_BAR_CONTAINER_HEIGHT =
  SPACING.sm + // pt-2 (8px top padding)
  40 + // SearchBar size="md" estimated height
  SPACING.xs; // pb-1 (4px bottom padding)

const SEARCH_BAR_TO_CONTENT_GAP = SPACING.lg; // 16px comfortable gap

// ============================================
// Filter Types
// ============================================

export interface RentalPropertyFilters {
  rentalType: RentalType | 'all';
  status: PropertyStatus | 'all';
  sortBy: 'name' | 'created_at' | 'base_rate';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: RentalPropertyFilters = {
  rentalType: 'all',
  status: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

// ============================================
// Quick Filter Tabs Configuration
// ============================================

const QUICK_FILTERS: { key: RentalType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'str', label: 'STR' },
  { key: 'mtr', label: 'MTR' },
  { key: 'ltr', label: 'LTR' },
];

// ============================================
// Advanced Filters Options
// ============================================

const STATUS_OPTIONS: { label: string; value: PropertyStatus | 'all' }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
];

const SORT_OPTIONS: { label: string; value: 'name' | 'created_at' | 'base_rate' }[] = [
  { label: 'Date Added', value: 'created_at' },
  { label: 'Name', value: 'name' },
  { label: 'Rate', value: 'base_rate' },
];

// ============================================
// Extended type with room counts
// ============================================

interface RentalPropertyWithRooms extends RentalProperty {
  rooms_count: number;
  occupied_rooms: number;
}

// ============================================
// Main Component
// ============================================

export function RentalPropertiesListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<RentalType | 'all'>('all');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<RentalPropertyFilters>(defaultFilters);

  const { properties, isLoading, refetch } = useRentalPropertiesWithRooms();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();

    // Filter properties
    let filtered = (properties as RentalPropertyWithRooms[]).filter((property) => {
      // Search filter
      const matchesSearch =
        !query ||
        property.name?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.state?.toLowerCase().includes(query);

      // Quick rental type filter
      const matchesQuickFilter =
        activeFilter === 'all' || property.rental_type === activeFilter;

      // Advanced filters
      const matchesStatus =
        advancedFilters.status === 'all' ||
        property.status === advancedFilters.status;

      return matchesSearch && matchesQuickFilter && matchesStatus;
    });

    // Sort properties
    const { sortBy, sortOrder } = advancedFilters;
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'created_at') {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = aTime - bTime;
      } else if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'base_rate') {
        comparison = (a.base_rate || 0) - (b.base_rate || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [properties, debouncedSearchQuery, activeFilter, advancedFilters]);

  const activeFiltersCount = [
    advancedFilters.status !== 'all',
    advancedFilters.sortBy !== 'created_at',
    advancedFilters.sortOrder !== 'desc',
  ].filter(Boolean).length;

  // Check if any filters are active
  const hasActiveFilters = activeFilter !== 'all' || activeFiltersCount > 0;

  const handlePropertyPress = useCallback(
    (property: RentalProperty) => {
      router.push(`/(tabs)/rental-properties/${property.id}`);
    },
    [router]
  );

  const handleAddProperty = useCallback(() => {
    router.push('/(tabs)/rental-properties/add');
  }, [router]);

  const handleClearAllFilters = useCallback(() => {
    setActiveFilter('all');
    setAdvancedFilters(defaultFilters);
    setSearchQuery('');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: RentalPropertyWithRooms }) => (
      <RentalPropertyCard
        property={item}
        onPress={() => handlePropertyPress(item)}
        roomsCount={item.rooms_count}
        occupiedRooms={item.occupied_rooms}
      />
    ),
    [handlePropertyPress]
  );

  const keyExtractor = useCallback(
    (item: RentalPropertyWithRooms) => item.id,
    []
  );

  const ItemSeparator = useCallback(
    () => <View style={{ height: SPACING.md }} />,
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Glass Search Bar - positioned absolutely at top */}
        <View
          className="absolute top-0 left-0 right-0 z-10"
          style={{ paddingTop: insets.top }}
        >
          <View className="px-4 pt-2 pb-1">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search properties..."
              size="md"
              glass={true}
              onFilter={() => setShowFiltersSheet(true)}
              hasActiveFilters={hasActiveFilters}
            />
          </View>
        </View>

        {/* Properties List */}
        {isLoading && !properties?.length ? (
          <View
            style={{
              paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
              paddingHorizontal: 16,
            }}
          >
            <SkeletonList count={5} component={DataCardSkeleton} />
          </View>
        ) : (
          <FlatList
            data={filteredProperties}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
              paddingHorizontal: 16,
              paddingBottom: TAB_BAR_SAFE_PADDING,
            }}
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor={colors.info}
              />
            }
            ListEmptyComponent={
              <ListEmptyState
                state={searchQuery ? 'filtered' : 'empty'}
                icon={searchQuery ? Search : Home}
                title={searchQuery ? 'No Results Found' : 'No Properties Yet'}
                description={
                  searchQuery
                    ? 'No properties match your search criteria.'
                    : 'Add your first rental property to start managing your portfolio.'
                }
                primaryAction={{
                  label: searchQuery ? 'Clear Search' : 'Add First Property',
                  onPress: searchQuery ? () => setSearchQuery('') : handleAddProperty,
                }}
              />
            }
          />
        )}

        {/* Floating Action Button */}
        <SimpleFAB onPress={handleAddProperty} accessibilityLabel="Add new property" />

        {/* Filters Sheet */}
        <BottomSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          title="Property Filters"
        >
          {/* Quick Filter Pills - Rental Type */}
          <BottomSheetSection title="Rental Type">
            <View className="flex-row flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => {
                const isActive = activeFilter === filter.key;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setActiveFilter(filter.key)}
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: isActive ? colors.primary : colors.muted,
                      borderColor: isActive ? colors.primary : colors.border,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${filter.label}${
                      isActive ? ', selected' : ''
                    }`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: isActive
                          ? colors.primaryForeground
                          : colors.foreground,
                      }}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Status Filter */}
          <BottomSheetSection title="Status">
            <View className="flex-row flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isActive = advancedFilters.status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() =>
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        status: option.value,
                      }))
                    }
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive
                        ? withOpacity(colors.primary, 'muted')
                        : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Status: ${option.label}${
                      isActive ? ', selected' : ''
                    }`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: isActive ? colors.primary : colors.foreground,
                      }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Sort By */}
          <BottomSheetSection title="Sort By">
            <View className="flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => {
                const isActive = advancedFilters.sortBy === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() =>
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        sortBy: option.value,
                      }))
                    }
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive
                        ? withOpacity(colors.primary, 'muted')
                        : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by ${option.label}${
                      isActive ? ', selected' : ''
                    }`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: isActive ? colors.primary : colors.foreground,
                      }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Sort Order */}
          <BottomSheetSection title="Sort Order">
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center"
                style={{
                  backgroundColor:
                    advancedFilters.sortOrder === 'desc'
                      ? colors.primary
                      : colors.muted,
                }}
                onPress={() =>
                  setAdvancedFilters((prev) => ({ ...prev, sortOrder: 'desc' }))
                }
                accessibilityRole="button"
                accessibilityLabel={`Newest first${
                  advancedFilters.sortOrder === 'desc' ? ', selected' : ''
                }`}
                accessibilityState={{ selected: advancedFilters.sortOrder === 'desc' }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color:
                      advancedFilters.sortOrder === 'desc'
                        ? colors.primaryForeground
                        : colors.foreground,
                  }}
                >
                  Newest First
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center"
                style={{
                  backgroundColor:
                    advancedFilters.sortOrder === 'asc'
                      ? colors.primary
                      : colors.muted,
                }}
                onPress={() =>
                  setAdvancedFilters((prev) => ({ ...prev, sortOrder: 'asc' }))
                }
                accessibilityRole="button"
                accessibilityLabel={`Oldest first${
                  advancedFilters.sortOrder === 'asc' ? ', selected' : ''
                }`}
                accessibilityState={{ selected: advancedFilters.sortOrder === 'asc' }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color:
                      advancedFilters.sortOrder === 'asc'
                        ? colors.primaryForeground
                        : colors.foreground,
                  }}
                >
                  Oldest First
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheetSection>

          {/* Action buttons */}
          <View className="flex-row gap-3 pt-4 pb-6">
            <Button
              variant="outline"
              onPress={handleClearAllFilters}
              className="flex-1"
            >
              Clear Filters
            </Button>
            <Button onPress={() => setShowFiltersSheet(false)} className="flex-1">
              Done
            </Button>
          </View>
        </BottomSheet>
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default RentalPropertiesListScreen;
