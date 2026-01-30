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
  Platform,
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

import { RentalProperty, RentalType, PropertyStatus } from '../types';
import { useRentalPropertiesWithRooms } from '../hooks/useRentalProperties';
import { PropertyImageCard } from '@/components/ui';
import { formatCurrency } from '@/utils/format';

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
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<RentalType | 'all'>('all');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<RentalPropertyFilters>(defaultFilters);

  const { properties, isLoading, refetch, error } = useRentalPropertiesWithRooms();

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
    ({ item }: { item: RentalPropertyWithRooms }) => {
      // Badge based on rental type - STR gets standout styling
      const rentalTypeBadge = {
        str: { label: 'STR', variant: 'success' as const },
        mtr: { label: 'MTR', variant: 'info' as const },
        ltr: { label: 'LTR', variant: 'secondary' as const },
      }[item.rental_type] || { label: 'LTR', variant: 'secondary' as const };

      // Format rate with period label
      const rateLabel = item.rate_type === 'nightly'
        ? '/night'
        : item.rate_type === 'weekly'
          ? '/week'
          : '/mo';

      // Build occupancy footer for room-by-room properties
      const occupancyFooter = item.is_room_by_room_enabled && item.rooms_count > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.muted,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                borderRadius: 3,
                width: `${(item.occupied_rooms / item.rooms_count) * 100}%`,
                backgroundColor: item.occupied_rooms === item.rooms_count
                  ? colors.success
                  : colors.primary,
              }}
            />
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '500' }}>
            {item.occupied_rooms}/{item.rooms_count}
          </Text>
        </View>
      ) : undefined;

      return (
        <PropertyImageCard
          imageUrl={item.primary_image_url}
          badgeOverlay={rentalTypeBadge}
          title={item.name}
          subtitle={`${item.city}, ${item.state}`}
          metrics={[
            {
              label: 'Rate',
              value: `${formatCurrency(item.base_rate)}${rateLabel}`,
              color: colors.success,
            },
            { label: 'Beds', value: String(item.bedrooms) },
            { label: 'Baths', value: String(item.bathrooms) },
          ]}
          footerContent={occupancyFooter}
          onPress={() => handlePropertyPress(item)}
          variant="glass"
        />
      );
    },
    [handlePropertyPress, colors]
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
        {/* Search Bar - in normal flow */}
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm }}>
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

        {/* Error Banner */}
        {error && (
          <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
            <View
              style={{
                backgroundColor: colors.destructive + '20',
                borderRadius: 8,
                padding: SPACING.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.destructive, flex: 1, fontSize: 14 }}>
                Failed to load properties. Pull down to retry.
              </Text>
            </View>
          </View>
        )}

        {/* Properties List */}
        {isLoading && !properties?.length ? (
          <View style={{ paddingHorizontal: SPACING.md }}>
            <SkeletonList count={5} component={DataCardSkeleton} />
          </View>
        ) : (
          <FlatList
            data={filteredProperties}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingHorizontal: SPACING.md,
              paddingBottom: TAB_BAR_SAFE_PADDING,
            }}
            contentInsetAdjustmentBehavior="automatic"
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
