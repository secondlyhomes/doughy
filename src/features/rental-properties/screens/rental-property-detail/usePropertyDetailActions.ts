// src/features/rental-properties/screens/rental-property-detail/usePropertyDetailActions.ts
// Hook that encapsulates navigation and action handlers for the property detail screen

import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '@/components/ui';
import type { RentalProperty, PropertyStatus } from '../../types';

interface UsePropertyDetailActionsOptions {
  propertyId: string;
  property: RentalProperty | null | undefined;
  updateStatus: (status: PropertyStatus) => Promise<void>;
  deleteProperty: () => Promise<void>;
  refetch: () => void;
  setShowStatusSheet: (show: boolean) => void;
}

export function usePropertyDetailActions({
  propertyId,
  property,
  updateStatus,
  deleteProperty,
  refetch,
  setShowStatusSheet,
}: UsePropertyDetailActionsOptions) {
  const router = useRouter();
  const { toast } = useToast();

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
      } catch (err) {
        console.error('[RentalPropertyDetailScreen] Failed to update status:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        Alert.alert('Error', `Failed to update property status: ${message}`);
      }
    },
    [updateStatus, refetch, setShowStatusSheet]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteProperty();
      toast({ title: 'Property deleted', type: 'success' });
      router.back();
    } catch (err) {
      console.error('[RentalPropertyDetailScreen] Failed to delete property:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', `Failed to delete property: ${message}`);
    }
  }, [deleteProperty, router, toast]);

  const handleAddRoom = useCallback(() => {
    router.push(`/(tabs)/rental-properties/${propertyId}/rooms/add` as never);
  }, [router, propertyId]);

  const handleRoomPress = useCallback(
    (room: { id: string }) => {
      router.push(`/(tabs)/rental-properties/${propertyId}/rooms/${room.id}` as never);
    },
    [router, propertyId]
  );

  const handleInventorySeeAll = useCallback(() => {
    router.push(`/(tabs)/rental-properties/${propertyId}/inventory` as never);
  }, [router, propertyId]);

  const handleInventoryItemPress = useCallback(
    (item: { id: string }) => {
      router.push(`/(tabs)/rental-properties/${propertyId}/inventory/${item.id}` as never);
    },
    [router, propertyId]
  );

  return {
    handleBack,
    handleEdit,
    handleOpenMap,
    handleStatusChange,
    handleDelete,
    handleAddRoom,
    handleRoomPress,
    handleInventorySeeAll,
    handleInventoryItemPress,
  };
}
