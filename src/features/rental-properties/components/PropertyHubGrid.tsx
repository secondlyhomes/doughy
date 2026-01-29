// src/features/rental-properties/components/PropertyHubGrid.tsx
// Grid of navigation hubs for property management features
// Displays inventory, smart home, maintenance, vendors, turnovers, bookings

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Package,
  Wifi,
  Wrench,
  Users,
  CalendarClock,
  Calendar,
} from 'lucide-react-native';
import { HubCard } from '@/components/ui/HubCard';
import { SPACING } from '@/constants/design-tokens';

export interface PropertyHubGridProps {
  /** Property ID for navigation */
  propertyId: string;
  /** Inventory item count */
  inventoryCount?: number;
  /** Smart home status - 'Online', 'Offline', or device count */
  smartHomeStatus?: string | number;
  /** Whether smart home is online (affects badge color) */
  smartHomeOnline?: boolean;
  /** Open maintenance work orders count */
  maintenanceCount?: number;
  /** Vendor count */
  vendorCount?: number;
  /** Upcoming turnover info - 'None' or date string */
  nextTurnover?: string;
  /** Upcoming bookings count */
  bookingsCount?: number;
  /** Whether features are loading */
  isLoading?: boolean;
  /** Card variant */
  variant?: 'default' | 'glass';
}

export function PropertyHubGrid({
  propertyId,
  inventoryCount = 0,
  smartHomeStatus,
  smartHomeOnline = true,
  maintenanceCount = 0,
  vendorCount = 0,
  nextTurnover,
  bookingsCount = 0,
  isLoading = false,
  variant = 'default',
}: PropertyHubGridProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path as never);
  };

  return (
    <View style={styles.container}>
      {/* Row 1: Inventory & Smart Home */}
      <View style={styles.row}>
        <HubCard
          icon={Package}
          title="Inventory"
          badge={inventoryCount}
          badgeVariant={inventoryCount > 0 ? 'default' : 'muted'}
          onPress={() => handleNavigate(`/(tabs)/rental-properties/${propertyId}/inventory`)}
          disabled={isLoading}
          variant={variant}
          style={styles.hubCard}
        />
        <HubCard
          icon={Wifi}
          title="Smart Home"
          badge={smartHomeStatus ?? 'Setup'}
          badgeVariant={
            smartHomeStatus
              ? smartHomeOnline
                ? 'success'
                : 'danger'
              : 'muted'
          }
          onPress={() => handleNavigate(`/(tabs)/rental-properties/${propertyId}/smart-home`)}
          disabled={isLoading}
          variant={variant}
          style={styles.hubCard}
        />
      </View>

      {/* Row 2: Maintenance & Vendors */}
      <View style={styles.row}>
        <HubCard
          icon={Wrench}
          title="Maintenance"
          badge={maintenanceCount}
          badgeVariant={
            maintenanceCount > 0
              ? maintenanceCount >= 3
                ? 'danger'
                : 'warning'
              : 'success'
          }
          onPress={() => handleNavigate(`/(tabs)/rental-properties/${propertyId}/maintenance`)}
          disabled={isLoading}
          variant={variant}
          style={styles.hubCard}
        />
        <HubCard
          icon={Users}
          title="Vendors"
          badge={vendorCount}
          badgeVariant={vendorCount > 0 ? 'default' : 'muted'}
          onPress={() => handleNavigate(`/(tabs)/rental-properties/${propertyId}/vendors`)}
          disabled={isLoading}
          variant={variant}
          style={styles.hubCard}
        />
      </View>

      {/* Row 3: Turnovers & Bookings */}
      <View style={styles.row}>
        <HubCard
          icon={CalendarClock}
          title="Turnovers"
          badge={nextTurnover ?? 'None'}
          badgeVariant={nextTurnover ? 'info' : 'muted'}
          onPress={() => handleNavigate(`/(tabs)/rental-properties/${propertyId}/turnovers`)}
          disabled={isLoading}
          variant={variant}
          style={styles.hubCard}
        />
        <HubCard
          icon={Calendar}
          title="Bookings"
          badge={bookingsCount}
          badgeVariant={bookingsCount > 0 ? 'default' : 'muted'}
          onPress={() => handleNavigate(`/(tabs)/bookings?propertyId=${propertyId}`)}
          disabled={isLoading}
          variant={variant}
          style={styles.hubCard}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  hubCard: {
    flex: 1,
  },
});

export default PropertyHubGrid;
