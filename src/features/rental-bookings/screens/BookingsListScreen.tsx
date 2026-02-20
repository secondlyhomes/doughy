// src/features/rental-bookings/screens/BookingsListScreen.tsx
// Bookings list screen with search, filters, and sorted by check-in date

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
  Alert,
  AlertDescription,
} from '@/components/ui';
import { LeadCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Plus, Calendar, Search, Check, WifiOff } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import { BookingWithRelations, BookingStatus, BookingType } from '../types';
import { useRentalBookings } from '../hooks/useRentalBookings';
import { BookingCard } from '../components/BookingCard';

// ============================================
// Filter Options
// ============================================

const STATUS_OPTIONS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Inquiry', value: 'inquiry' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const TYPE_OPTIONS: { label: string; value: BookingType | 'all' }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Reservation', value: 'reservation' },
  { label: 'Lease', value: 'lease' },
];

const QUICK_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Past' },
];

// ============================================
// Filter State Interface
// ============================================

export interface BookingFilters {
  status: BookingStatus | 'all';
  type: BookingType | 'all';
  quickFilter: string;
}

const defaultFilters: BookingFilters = {
  status: 'all',
  type: 'all',
  quickFilter: 'all',
};

export function BookingsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const propertyId = params.propertyId;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [filters, setFilters] = useState<BookingFilters>(defaultFilters);

  const { bookings, filteredBookings, isLoading, refetch, error, clearError } = useRentalBookings({
    autoFetch: true,
    propertyId,
    searchQuery: debouncedSearchQuery,
  });

  // Apply additional filters
  const displayBookings = useMemo(() => {
    let result = filteredBookings;
    const today = new Date().toISOString().split('T')[0];

    // Apply quick filter
    switch (filters.quickFilter) {
      case 'upcoming':
        result = result.filter(
          (b) => b.start_date >= today && ['confirmed', 'pending'].includes(b.status)
        );
        break;
      case 'active':
        result = result.filter((b) => b.status === 'active');
        break;
      case 'pending':
        result = result.filter((b) => ['inquiry', 'pending'].includes(b.status));
        break;
      case 'completed':
        result = result.filter((b) => b.status === 'completed' || b.status === 'cancelled');
        break;
    }

    // Apply status filter (if not 'all' and different from quick filter)
    if (filters.status !== 'all') {
      result = result.filter((b) => b.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      result = result.filter((b) => b.booking_type === filters.type);
    }

    return result;
  }, [filteredBookings, filters]);

  // Check if any advanced filters are active
  const hasActiveFilters =
    filters.quickFilter !== 'all' || filters.status !== 'all' || filters.type !== 'all';

  const activeFiltersCount = [
    filters.status !== 'all',
    filters.type !== 'all',
  ].filter(Boolean).length;

  const handleBookingPress = useCallback(
    (booking: BookingWithRelations) => {
      router.push(`/(tabs)/bookings/${booking.id}`);
    },
    [router]
  );

  const handleAddBooking = useCallback(() => {
    // TODO: Navigate to add booking screen when implemented
    // router.push('/(tabs)/bookings/add');
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchQuery('');
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: BookingWithRelations }) => (
      <BookingCard booking={item} onPress={() => handleBookingPress(item)} />
    ),
    [handleBookingPress]
  );

  const keyExtractor = useCallback((item: BookingWithRelations) => item.id, []);

  const ItemSeparator = useCallback(() => <View style={{ height: SPACING.md }} />, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View style={{ flex: 1 }}>
          {/* Search Bar — floats above content with glass blur */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search bookings..."
              size="md"
              glass={true}
              onFilter={() => setShowFiltersSheet(true)}
              hasActiveFilters={hasActiveFilters}
            />
          </View>

          {/* Bookings List */}
          {isLoading && !bookings?.length ? (
            <View style={{ paddingHorizontal: SPACING.md, paddingTop: 64 + SPACING.md }}>
              <SkeletonList count={5} component={LeadCardSkeleton} />
            </View>
          ) : (
            <FlatList
              data={displayBookings}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: SPACING.md,
                paddingTop: 64 + SPACING.md,
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
            ListHeaderComponent={
              error ? (
                <View style={{ marginBottom: SPACING.md }}>
                  <Alert variant="destructive" icon={<WifiOff size={18} color={colors.destructive} />}>
                    <AlertDescription variant="destructive">{error}</AlertDescription>
                    <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
                      <Button size="sm" variant="outline" onPress={handleRefresh}>
                        Try Again
                      </Button>
                      <Button size="sm" variant="ghost" onPress={clearError}>
                        Dismiss
                      </Button>
                    </View>
                  </Alert>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <ListEmptyState
                state={searchQuery || hasActiveFilters ? 'filtered' : 'empty'}
                icon={searchQuery || hasActiveFilters ? Search : Calendar}
                title={searchQuery || hasActiveFilters ? 'No Results Found' : 'No Bookings Yet'}
                description={
                  searchQuery || hasActiveFilters
                    ? 'No bookings match your search or filters.'
                    : 'Add your first booking to start tracking reservations and leases.'
                }
                primaryAction={{
                  label: searchQuery || hasActiveFilters ? 'Clear Filters' : 'Add First Booking',
                  onPress: searchQuery || hasActiveFilters ? handleClearAllFilters : handleAddBooking,
                }}
              />
            }
          />
        )}
        </View>

        {/* Floating Action Button */}
        <SimpleFAB onPress={handleAddBooking} accessibilityLabel="Add new booking" />

        {/* Filters Sheet */}
        <BottomSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          title="Booking Filters"
        >
          {/* Quick Filter Pills */}
          <BottomSheetSection title="Quick Filter">
            <View className="flex-row flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => {
                const isActive = filters.quickFilter === filter.key;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setFilters((prev) => ({ ...prev, quickFilter: filter.key }))}
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: isActive ? colors.primary : colors.muted,
                      borderColor: isActive ? colors.primary : colors.border,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${filter.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: isActive ? colors.primaryForeground : colors.foreground }}
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
                const isActive = filters.status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setFilters((prev) => ({ ...prev, status: option.value }))}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive
                        ? withOpacity(colors.primary, 'muted')
                        : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Status: ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: isActive ? colors.primary : colors.foreground }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Booking Type Filter */}
          <BottomSheetSection title="Booking Type">
            <View className="flex-row flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => {
                const isActive = filters.type === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setFilters((prev) => ({ ...prev, type: option.value }))}
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive
                        ? withOpacity(colors.primary, 'muted')
                        : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Type: ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: isActive ? colors.primary : colors.foreground }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Action buttons */}
          <View className="flex-row gap-3 pt-4 pb-6">
            <Button variant="outline" onPress={handleClearAllFilters} className="flex-1">
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

export default BookingsListScreen;
