// src/features/rental-properties/screens/RentalPropertyDetailScreen.tsx
// Detail screen for viewing and editing rental property information

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import {
  Edit2,
  MapPin,
  ExternalLink,
  Trash2,
  Home,
  ArrowLeft,
  MoreVertical,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  Button,
  BottomSheet,
  BottomSheetSection,
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Separator,
} from '@/components/ui';
import { SPACING, FONT_SIZES, ICON_SIZES, BORDER_RADIUS, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { PropertyStatsRow } from '../components/PropertyStatsRow';
import { PropertyHubGrid } from '../components/PropertyHubGrid';
import { RoomsList } from '../components/RoomsList';
import {
  useRentalPropertyDetail,
  useRentalPropertyMutations,
} from '../hooks/useRentalPropertyDetail';
import { PropertyStatus } from '../types';
import { useInventoryCount } from '@/features/property-inventory';
import { useOpenMaintenanceCount } from '@/features/property-maintenance';
import { useVendorCount } from '@/features/vendors';
import { useNextTurnover } from '@/features/turnovers';

// Extracted components and utilities
import {
  UUID_REGEX,
  formatCurrency,
  formatRateType,
  getStatusInfo,
  Section,
  PropertyImagePlaceholder,
  FinancialRow,
  AmenityChip,
} from './rental-property-detail';

export function RentalPropertyDetailScreen() {
  const params = useLocalSearchParams();
  const propertyId = params.id as string;

  // Call all hooks unconditionally (before any early returns) to follow React's rules of hooks
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if propertyId is a valid UUID (hooks must be called before any returns)
  const isValidUUID = Boolean(propertyId && UUID_REGEX.test(propertyId));

  const {
    property,
    rooms,
    upcomingBookings,
    isLoading,
    isLoadingRooms,
    error,
    refetch,
  } = useRentalPropertyDetail(isValidUUID ? propertyId : '');

  const { updateStatus, deleteProperty, isSaving } =
    useRentalPropertyMutations(isValidUUID ? propertyId : '');

  // Hub counts for the property management grid
  const { data: inventoryCount = 0, isLoading: isLoadingInventory } = useInventoryCount(isValidUUID ? propertyId : '');
  const { data: maintenanceCount = 0, isLoading: isLoadingMaintenance } = useOpenMaintenanceCount(isValidUUID ? propertyId : '');
  const { data: vendorCount = 0, isLoading: isLoadingVendors } = useVendorCount(isValidUUID ? propertyId : '');
  const { data: nextTurnover, isLoading: isLoadingTurnover } = useNextTurnover(isValidUUID ? propertyId : '');

  // Guard against invalid UUIDs (e.g., "add" being captured by this route)
  // Must come AFTER all hook calls to follow React's rules of hooks
  if (!isValidUUID) {
    return <Redirect href="/(tabs)/rental-properties" />;
  }

  const isLoadingHubCounts = isLoadingInventory || isLoadingMaintenance || isLoadingVendors || isLoadingTurnover;

  // Safe back navigation with fallback
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/rental-properties');
    }
  }, [router]);

  const handleEdit = useCallback(() => {
    router.push(`/(tabs)/rental-properties/edit/${propertyId}` as never);
  }, [router, propertyId]);

  const handleOpenMap = useCallback(() => {
    if (!property) return;

    const address = encodeURIComponent(
      `${property.address}, ${property.city}, ${property.state} ${property.zip || ''}`
    );
    const url = `https://maps.google.com/?q=${address}`;
    Linking.openURL(url);
  }, [property]);

  const handleStatusChange = useCallback(
    async (newStatus: PropertyStatus) => {
      try {
        await updateStatus(newStatus);
        setShowStatusSheet(false);
        refetch();
      } catch (error) {
        console.error('[RentalPropertyDetailScreen] Failed to update status:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        Alert.alert('Error', `Failed to update property status: ${message}`);
      }
    },
    [updateStatus, refetch]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteProperty();
      setShowDeleteConfirm(false);
      router.back();
    } catch (error) {
      console.error('[RentalPropertyDetailScreen] Failed to delete property:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to delete property: ${message}`);
    }
  }, [deleteProperty, router]);

  const handleAddRoom = useCallback(() => {
    router.push(`/(tabs)/rental-properties/${propertyId}/rooms/add` as never);
  }, [router, propertyId]);

  const handleRoomPress = useCallback(
    (room: { id: string }) => {
      router.push(`/(tabs)/rental-properties/${propertyId}/rooms/${room.id}` as never);
    },
    [router, propertyId]
  );

  // Native header options for consistent iOS styling
  const headerOptions = useMemo((): NativeStackNavigationOptions => ({
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerStatusBarHeight: insets.top,
    headerTitle: () => (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {property?.name || 'Property Details'}
        </Text>
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity onPress={handleBack} style={{ padding: SPACING.sm }}>
        <ArrowLeft size={ICON_SIZES.xl} color={colors.foreground} />
      </TouchableOpacity>
    ),
    headerRight: property
      ? () => (
          <TouchableOpacity onPress={() => setShowStatusSheet(true)} style={{ padding: SPACING.sm }}>
            <MoreVertical size={ICON_SIZES.xl} color={colors.foreground} />
          </TouchableOpacity>
        )
      : undefined,
  }), [colors, insets.top, property, handleBack]);

  // Loading state
  if (isLoading && !property) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading property..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View className="flex-1 items-center justify-center p-4">
            <Home size={ICON_SIZES['3xl']} color={colors.mutedForeground} />
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.base,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              {error?.message || 'Property not found'}
            </Text>
            <Button variant="outline" onPress={handleBack} className="mt-4">
              Go Back
            </Button>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Property Image */}
        {property?.primary_image_url ? (
          <Image
            source={{ uri: property.primary_image_url }}
            style={{ width: '100%', height: 192, borderRadius: BORDER_RADIUS.lg, marginBottom: 16 }}
            resizeMode="cover"
          />
        ) : (
          <PropertyImagePlaceholder />
        )}

        {/* Property Stats Row */}
        <PropertyStatsRow
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          sqft={property.square_feet}
          rentalType={property.rental_type}
        />

        {/* Property Management Hub Grid */}
        <PropertyHubGrid
          propertyId={propertyId}
          inventoryCount={inventoryCount}
          maintenanceCount={maintenanceCount}
          vendorCount={vendorCount}
          nextTurnover={nextTurnover ?? undefined}
          bookingsCount={upcomingBookings.length}
          isLoading={isLoadingHubCounts}
        />

        {/* Address Section (Collapsible) */}
        <Section title="Address" collapsible defaultCollapsed>
          <TouchableOpacity
            onPress={handleOpenMap}
            className="p-4 rounded-xl flex-row items-center justify-between"
            style={{ backgroundColor: colors.card }}
            activeOpacity={PRESS_OPACITY.DEFAULT}
          >
            <View className="flex-row items-center flex-1">
              <MapPin size={ICON_SIZES.lg} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.base,
                    fontWeight: '500',
                  }}
                  numberOfLines={1}
                >
                  {property.address}
                </Text>
                <Text
                  style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}
                  numberOfLines={1}
                >
                  {property.city}, {property.state} {property.zip || ''}
                </Text>
              </View>
            </View>
            <ExternalLink size={ICON_SIZES.ml} color={colors.mutedForeground} />
          </TouchableOpacity>
        </Section>

        {/* Financial Section (Collapsible) */}
        <Section title="Financials" collapsible defaultCollapsed>
          <View
            className="p-4 rounded-xl"
            style={{ backgroundColor: colors.card }}
          >
            <FinancialRow
              label="Base Rate"
              value={`${formatCurrency(property.base_rate)}${formatRateType(property.rate_type)}`}
              valueColor={colors.success}
            />
            <Separator className="my-1" />
            <FinancialRow
              label="Cleaning Fee"
              value={formatCurrency(property.cleaning_fee)}
            />
            <Separator className="my-1" />
            <FinancialRow
              label="Security Deposit"
              value={formatCurrency(property.security_deposit)}
            />
          </View>
        </Section>

        {/* Amenities Section */}
        {property.amenities && property.amenities.length > 0 && (
          <Section title="Amenities">
            <View className="flex-row flex-wrap">
              {property.amenities.map((amenity, index) => (
                <AmenityChip key={index} amenity={amenity} />
              ))}
            </View>
          </Section>
        )}

        {/* Rooms Section (if room_by_room enabled) */}
        {property.is_room_by_room_enabled && (
          <Section title="">
            <RoomsList
              rooms={rooms}
              isLoading={isLoadingRooms}
              onRoomPress={handleRoomPress}
              onAddRoom={handleAddRoom}
            />
          </Section>
        )}

        {/* Listing URLs Section */}
        {property.listing_urls &&
          Object.keys(property.listing_urls).length > 0 && (
            <Section title="Listings">
              <View
                className="p-4 rounded-xl"
                style={{ backgroundColor: colors.card }}
              >
                {Object.entries(property.listing_urls).map(
                  ([platform, url]) =>
                    url && (
                      <TouchableOpacity
                        key={platform}
                        onPress={() => Linking.openURL(url)}
                        className="flex-row items-center justify-between py-2"
                      >
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: FONT_SIZES.sm,
                            textTransform: 'capitalize',
                          }}
                        >
                          {platform}
                        </Text>
                        <ExternalLink size={ICON_SIZES.md} color={colors.primary} />
                      </TouchableOpacity>
                    )
                )}
              </View>
            </Section>
          )}
      </ScrollView>

      {/* Edit FAB */}
      <SimpleFAB
        icon={<Edit2 size={ICON_SIZES.xl} color={colors.primaryForeground} />}
        onPress={handleEdit}
        accessibilityLabel="Edit property"
      />

      {/* Status Change Sheet */}
      <BottomSheet
        visible={showStatusSheet}
        onClose={() => setShowStatusSheet(false)}
        title="Property Options"
      >
        <BottomSheetSection title="Status">
          <View className="gap-2">
            {(['active', 'inactive', 'maintenance'] as PropertyStatus[]).map(
              (status) => {
                const info = getStatusInfo(status);
                const isActive = property.status === status;
                const StatusIcon = info.icon;

                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleStatusChange(status)}
                    className="flex-row items-center p-4 rounded-xl"
                    style={{
                      backgroundColor: isActive
                        ? withOpacity(colors.primary, 'light')
                        : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: colors.primary,
                    }}
                    disabled={isSaving}
                  >
                    <StatusIcon
                      size={ICON_SIZES.lg}
                      color={isActive ? colors.primary : colors.foreground}
                    />
                    <Text
                      style={{
                        color: isActive ? colors.primary : colors.foreground,
                        fontSize: FONT_SIZES.base,
                        fontWeight: '500',
                        marginLeft: 12,
                      }}
                    >
                      {info.label}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </BottomSheetSection>

        {/* Danger Zone in sheet */}
        <Separator className="my-4" />
        <TouchableOpacity
          onPress={() => {
            setShowStatusSheet(false);
            setTimeout(() => setShowDeleteConfirm(true), 300);
          }}
          className="flex-row items-center p-4 rounded-xl"
          style={{ backgroundColor: withOpacity(colors.destructive, 'light') }}
          disabled={isSaving}
        >
          <Trash2 size={ICON_SIZES.lg} color={colors.destructive} />
          <Text
            style={{
              color: colors.destructive,
              fontSize: FONT_SIZES.base,
              fontWeight: '500',
              marginLeft: 12,
            }}
          >
            Delete Property
          </Text>
        </TouchableOpacity>

        <View className="pt-4 pb-6">
          <Button
            variant="outline"
            onPress={() => setShowStatusSheet(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </View>
      </BottomSheet>

      {/* Delete Confirmation Sheet */}
      <BottomSheet
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Property"
      >
        <View className="py-4">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.base,
              textAlign: 'center',
            }}
          >
            Are you sure you want to delete{' '}
            <Text style={{ fontWeight: '700' }}>{property.name}</Text>?
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.sm,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            This action cannot be undone. All associated rooms and bookings will
            also be affected.
          </Text>
        </View>

        <View className="flex-row gap-3 pt-4 pb-6">
          <Button
            variant="outline"
            onPress={() => setShowDeleteConfirm(false)}
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onPress={handleDelete}
            className="flex-1"
            disabled={isSaving}
          >
            {isSaving ? 'Deleting...' : 'Delete'}
          </Button>
        </View>
        </BottomSheet>
      </ThemedSafeAreaView>
    </>
  );
}

export default RentalPropertyDetailScreen;
