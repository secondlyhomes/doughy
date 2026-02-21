// src/features/rental-bookings/screens/BookingsListScreen.tsx
// Bookings list screen with search, filters, and sorted by check-in date

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
  Button,
  SimpleFAB,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { LeadCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Calendar, Search, WifiOff } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import { BookingWithRelations } from '../types';
import { useRentalBookings } from '../hooks/useRentalBookings';
import { BookingCard } from '../components/BookingCard';
import { BookingsFilterSheet } from './BookingsFilterSheet';
import { useBookingsFilters } from './useBookingsFilters';

export function BookingsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const propertyId = params.propertyId;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  const { bookings, filteredBookings, isLoading, refetch, error, clearError } = useRentalBookings({
    autoFetch: true,
    propertyId,
    searchQuery: debouncedSearchQuery,
  });

  const {
    filters,
    setFilters,
    displayBookings,
    hasActiveFilters,
    handleClearAllFilters: clearFilters,
  } = useBookingsFilters(filteredBookings);

  const handleClearAllFilters = useCallback(() => {
    clearFilters();
    setSearchQuery('');
  }, [clearFilters]);

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
        <BookingsFilterSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          filters={filters}
          onUpdateFilters={setFilters}
          onClearFilters={handleClearAllFilters}
        />
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default BookingsListScreen;
