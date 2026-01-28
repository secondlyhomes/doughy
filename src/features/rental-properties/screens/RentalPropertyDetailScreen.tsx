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
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Edit2,
  MapPin,
  DollarSign,
  Calendar,
  ChevronRight,
  ExternalLink,
  Trash2,
  Home,
  ToggleLeft,
  ToggleRight,
  Wrench,
  ImageIcon,
  User,
  Clock,
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
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SPACING } from '@/constants/design-tokens';
import { PropertyStatsRow } from '../components/PropertyStatsRow';
import { RoomsList } from '../components/RoomsList';
import {
  useRentalPropertyDetail,
  useRentalPropertyMutations,
} from '../hooks/useRentalPropertyDetail';
import { RentalProperty, PropertyStatus } from '../types';
import { BookingWithRelations } from '@/stores/rental-bookings-store';

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
  const suffixes: Record<string, string> = {
    nightly: '/night',
    weekly: '/week',
    monthly: '/mo',
    yearly: '/year',
  };
  return suffixes[rateType] || '/mo';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
}

function Section({ title, children, rightElement }: SectionProps) {
  const colors = useThemeColors();

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text
          style={{ color: colors.foreground, fontSize: 18, fontWeight: '600' }}
        >
          {title}
        </Text>
        {rightElement}
      </View>
      {children}
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
        style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 8 }}
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
      <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
        {label}
      </Text>
      <Text
        style={{
          color: valueColor || colors.foreground,
          fontSize: 14,
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
      <Text style={{ color: colors.foreground, fontSize: 13 }}>{amenity}</Text>
    </View>
  );
}

// Booking Card for upcoming bookings
interface UpcomingBookingCardProps {
  booking: BookingWithRelations;
  onPress: () => void;
}

function UpcomingBookingCard({ booking, onPress }: UpcomingBookingCardProps) {
  const colors = useThemeColors();

  const guestName = booking.contact
    ? `${booking.contact.first_name || ''} ${booking.contact.last_name || ''}`.trim() || 'Unknown Guest'
    : 'Unknown Guest';
  const roomName = booking.room?.name;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="p-3 rounded-xl mb-2"
      style={{ backgroundColor: colors.card }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <User size={16} color={colors.primary} />
            <Text
              style={{
                color: colors.foreground,
                fontSize: 15,
                fontWeight: '600',
              }}
              numberOfLines={1}
            >
              {guestName}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 mt-1">
            <Calendar size={12} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              {formatDate(booking.start_date)}
              {booking.end_date && ` - ${formatDate(booking.end_date)}`}
            </Text>
          </View>

          {roomName && (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Room: {roomName}
            </Text>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          <Badge
            variant={
              booking.status === 'confirmed'
                ? 'success'
                : booking.status === 'active'
                ? 'default'
                : 'warning'
            }
            size="sm"
          >
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// Main Screen Component
// ============================================

export function RentalPropertyDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;

  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  } = useRentalPropertyDetail(propertyId);

  const { updateStatus, deleteProperty, isSaving } =
    useRentalPropertyMutations(propertyId);

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
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
      const success = await updateStatus(newStatus);
      if (success) {
        setShowStatusSheet(false);
        refetch();
      } else {
        Alert.alert('Error', 'Failed to update property status');
      }
    },
    [updateStatus, refetch]
  );

  const handleDelete = useCallback(async () => {
    const success = await deleteProperty();
    if (success) {
      setShowDeleteConfirm(false);
      router.back();
    } else {
      Alert.alert('Error', 'Failed to delete property');
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

  const handleBookingPress = useCallback(
    (booking: BookingWithRelations) => {
      router.push(`/(tabs)/bookings/${booking.id}` as never);
    },
    [router]
  );

  // Status info for display
  const statusInfo = useMemo(
    () => (property ? getStatusInfo(property.status) : null),
    [property]
  );

  // Loading state
  if (isLoading && !property) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading property..." />
      </ThemedSafeAreaView>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader title="Property Details" backButton onBack={handleBack} />
        <View className="flex-1 items-center justify-center p-4">
          <Home size={48} color={colors.mutedForeground} />
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 16,
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
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <ScreenHeader
        title={property.name}
        backButton
        onBack={handleBack}
        rightAction={
          statusInfo && (
            <TouchableOpacity
              onPress={() => setShowStatusSheet(true)}
              className="flex-row items-center"
            >
              <Badge variant={statusInfo.variant} size="sm">
                {statusInfo.label}
              </Badge>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING + 80,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Property Image Placeholder */}
        <PropertyImagePlaceholder />

        {/* Property Stats Row */}
        <PropertyStatsRow
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          sqft={property.sqft}
          rentalType={property.rental_type}
        />

        {/* Address Section */}
        <Section title="Address">
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
                    fontSize: 15,
                    fontWeight: '500',
                  }}
                  numberOfLines={1}
                >
                  {property.address}
                </Text>
                <Text
                  style={{ color: colors.mutedForeground, fontSize: 13 }}
                  numberOfLines={1}
                >
                  {property.city}, {property.state} {property.zip || ''}
                </Text>
              </View>
            </View>
            <ExternalLink size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </Section>

        {/* Financial Section */}
        <Section title="Financials">
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
        {property.room_by_room_enabled && (
          <Section title="">
            <RoomsList
              rooms={rooms}
              isLoading={isLoadingRooms}
              onRoomPress={handleRoomPress}
              onAddRoom={handleAddRoom}
            />
          </Section>
        )}

        {/* Upcoming Bookings Section */}
        <Section
          title="Upcoming Bookings"
          rightElement={
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(tabs)/bookings?propertyId=${propertyId}` as never
                )
              }
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                View All
              </Text>
            </TouchableOpacity>
          }
        >
          {isLoadingBookings ? (
            <View className="py-4 items-center">
              <Text style={{ color: colors.mutedForeground }}>
                Loading bookings...
              </Text>
            </View>
          ) : upcomingBookings.length === 0 ? (
            <View
              className="py-6 items-center rounded-xl"
              style={{ backgroundColor: colors.muted }}
            >
              <Calendar size={32} color={colors.mutedForeground} />
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 14,
                  marginTop: 8,
                }}
              >
                No upcoming bookings
              </Text>
            </View>
          ) : (
            <View>
              {upcomingBookings.slice(0, 3).map((booking) => (
                <UpcomingBookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={() => handleBookingPress(booking)}
                />
              ))}
              {upcomingBookings.length > 3 && (
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/(tabs)/bookings?propertyId=${propertyId}` as never
                    )
                  }
                  className="py-2 items-center"
                >
                  <Text style={{ color: colors.primary, fontSize: 14 }}>
                    +{upcomingBookings.length - 3} more bookings
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Section>

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
                            fontSize: 14,
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

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <Button
            variant="destructive"
            onPress={() => setShowDeleteConfirm(true)}
            className="flex-row items-center justify-center gap-2"
          >
            <Trash2 size={16} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Delete Property
            </Text>
          </Button>
        </Section>
      </ScrollView>

      {/* Edit FAB */}
      <SimpleFAB
        icon={<Edit2 size={24} color="white" />}
        onPress={handleEdit}
        accessibilityLabel="Edit property"
      />

      {/* Status Change Sheet */}
      <BottomSheet
        visible={showStatusSheet}
        onClose={() => setShowStatusSheet(false)}
        title="Change Status"
      >
        <BottomSheetSection title="Select Status">
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
                        ? colors.primary + '20'
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
                        fontSize: 16,
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
              fontSize: 15,
              textAlign: 'center',
            }}
          >
            Are you sure you want to delete{' '}
            <Text style={{ fontWeight: '700' }}>{property.name}</Text>?
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 14,
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
  );
}

export default RentalPropertyDetailScreen;
