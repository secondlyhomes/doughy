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
  ToggleLeft,
  ToggleRight,
  Wrench,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  MoreVertical,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  Button,
  Badge,
  BottomSheet,
  BottomSheetSection,
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Separator,
} from '@/components/ui';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
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

// ============================================
// Constants
// ============================================

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// Helper Functions
// ============================================

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRateType(rateType: string): string {
  // Database only has: nightly, weekly, monthly (no 'yearly')
  const suffixes: Record<string, string> = {
    nightly: '/night',
    weekly: '/week',
    monthly: '/mo',
  };
  return suffixes[rateType] || '/mo';
}

function getStatusInfo(status: PropertyStatus): {
  label: string;
  variant: 'success' | 'secondary' | 'warning';
  icon: React.ElementType;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'success', icon: ToggleRight };
    case 'inactive':
      return { label: 'Inactive', variant: 'secondary', icon: ToggleLeft };
    case 'maintenance':
      return { label: 'Maintenance', variant: 'warning', icon: Wrench };
    default:
      return { label: status, variant: 'secondary', icon: ToggleLeft };
  }
}

// ============================================
// Section Components
// ============================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
  /** If true, section can be collapsed */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

function Section({ title, children, rightElement, collapsible = false, defaultCollapsed = false }: SectionProps) {
  const colors = useThemeColors();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggle = useCallback(() => {
    if (collapsible) {
      setIsCollapsed((prev) => !prev);
    }
  }, [collapsible]);

  return (
    <View className="mb-6">
      <TouchableOpacity
        onPress={handleToggle}
        disabled={!collapsible}
        activeOpacity={collapsible ? 0.7 : 1}
        className="flex-row items-center justify-between mb-3"
      >
        <View className="flex-row items-center flex-1">
          <Text
            style={{ color: colors.foreground, fontSize: FONT_SIZES.lg, fontWeight: '600' }}
          >
            {title}
          </Text>
          {collapsible && (
            isCollapsed ? (
              <ChevronDown size={20} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
            ) : (
              <ChevronUp size={20} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
            )
          )}
        </View>
        {rightElement}
      </TouchableOpacity>
      {!isCollapsed && children}
    </View>
  );
}

// Property Image Placeholder
function PropertyImagePlaceholder() {
  const colors = useThemeColors();

  return (
    <View
      className="w-full h-48 rounded-xl items-center justify-center mb-4"
      style={{ backgroundColor: colors.muted }}
    >
      <ImageIcon size={48} color={colors.mutedForeground} />
      <Text
        style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginTop: 8 }}
      >
        No Photos Added
      </Text>
    </View>
  );
}

// Financial Row Item
interface FinancialRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function FinancialRow({ label, value, valueColor }: FinancialRowProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row justify-between py-2">
      <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}>
        {label}
      </Text>
      <Text
        style={{
          color: valueColor || colors.foreground,
          fontSize: FONT_SIZES.sm,
          fontWeight: '600',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// Amenity Chip
function AmenityChip({ amenity }: { amenity: string }) {
  const colors = useThemeColors();

  return (
    <View
      className="px-3 py-1 rounded-full mr-2 mb-2"
      style={{ backgroundColor: colors.muted }}
    >
      <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>{amenity}</Text>
    </View>
  );
}

// ============================================
// Main Screen Component
// ============================================

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
    isLoadingBookings,
    error,
    refetch,
    refetchRooms,
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
    // Navigate to add room screen
    router.push(
      `/(tabs)/rental-properties/${propertyId}/rooms/add` as never
    );
  }, [router, propertyId]);

  const handleRoomPress = useCallback(
    (room: { id: string }) => {
      router.push(
        `/(tabs)/rental-properties/${propertyId}/rooms/${room.id}` as never
      );
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
        <ArrowLeft size={24} color={colors.foreground} />
      </TouchableOpacity>
    ),
    headerRight: property
      ? () => (
          <TouchableOpacity onPress={() => setShowStatusSheet(true)} style={{ padding: SPACING.sm }}>
            <MoreVertical size={24} color={colors.foreground} />
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
            <Home size={48} color={colors.mutedForeground} />
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
            style={{ width: '100%', height: 192, borderRadius: 12, marginBottom: 16 }}
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
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <MapPin size={20} color={colors.primary} />
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
            <ExternalLink size={18} color={colors.mutedForeground} />
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

        {/* Note: Bookings are now accessible via the Hub Grid above */}

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
                        <ExternalLink size={16} color={colors.primary} />
                      </TouchableOpacity>
                    )
                )}
              </View>
            </Section>
          )}
      </ScrollView>

      {/* Edit FAB */}
      <SimpleFAB
        icon={<Edit2 size={24} color={colors.primaryForeground} />}
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
                      size={20}
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
          <Trash2 size={20} color={colors.destructive} />
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
