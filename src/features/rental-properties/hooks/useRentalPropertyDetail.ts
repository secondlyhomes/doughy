// src/features/rental-properties/hooks/useRentalPropertyDetail.ts
// Hook for fetching property details with linked rooms and upcoming bookings

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RentalProperty } from '../types';
import { Room, useRentalRoomsStore } from '@/stores/rental-rooms-store';
import { BookingWithRelations } from '@/stores/rental-bookings-store';
import { rentalPropertyKeys } from './useRentalProperties';

// ============================================
// Query Keys
// ============================================

export const rentalPropertyDetailKeys = {
  all: ['rental-property-detail'] as const,
  detail: (id: string) => [...rentalPropertyDetailKeys.all, id] as const,
  rooms: (propertyId: string) =>
    [...rentalPropertyDetailKeys.all, propertyId, 'rooms'] as const,
  bookings: (propertyId: string) =>
    [...rentalPropertyDetailKeys.all, propertyId, 'bookings'] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchPropertyById(id: string): Promise<RentalProperty | null> {
  const { data, error } = await supabase
    .from('landlord_properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching rental property:', error);
    throw error;
  }

  return data as unknown as RentalProperty;
}

async function fetchRoomsByPropertyId(propertyId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('landlord_rooms')
    .select('*')
    .eq('property_id', propertyId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }

  return (data || []) as Room[];
}

async function fetchUpcomingBookingsByPropertyId(
  propertyId: string
): Promise<BookingWithRelations[]> {
  const today = new Date().toISOString().split('T')[0];

  // Filter for upcoming/active booking statuses
  // Note: 'hold' may be defined in app types but not yet in DB enum
  const upcomingStatuses = [
    'inquiry',
    'pending',
    'confirmed',
    'active',
  ] as const;

  const { data, error } = await supabase
    .from('landlord_bookings')
    .select(
      `
      *,
      contact:crm_contacts(id, first_name, last_name, email, phone),
      room:landlord_rooms!landlord_bookings_room_id_fkey(id, name)
    `
    )
    .eq('property_id', propertyId)
    .gte('start_date', today)
    .in('status', upcomingStatuses)
    .order('start_date', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return (data || []) as unknown as BookingWithRelations[];
}

// ============================================
// Main Hook
// ============================================

export interface UseRentalPropertyDetailReturn {
  // Data
  property: RentalProperty | null | undefined;
  rooms: Room[];
  upcomingBookings: BookingWithRelations[];

  // Loading states
  isLoading: boolean;
  isLoadingRooms: boolean;
  isLoadingBookings: boolean;

  // Error
  error: Error | null;

  // Actions
  refetch: () => Promise<void>;
  refetchRooms: () => Promise<void>;
  refetchBookings: () => Promise<void>;
}

export function useRentalPropertyDetail(
  propertyId: string | null | undefined
): UseRentalPropertyDetailReturn {
  const queryClient = useQueryClient();
  const roomsStore = useRentalRoomsStore();

  // Fetch property
  const {
    data: property,
    isLoading: isLoadingProperty,
    error: propertyError,
    refetch: refetchProperty,
  } = useQuery({
    queryKey: rentalPropertyDetailKeys.detail(propertyId || ''),
    queryFn: () => fetchPropertyById(propertyId!),
    enabled: !!propertyId,
  });

  // Fetch rooms
  const {
    data: rooms = [],
    isLoading: isLoadingRooms,
    error: roomsError,
    refetch: refetchRoomsQuery,
  } = useQuery({
    queryKey: rentalPropertyDetailKeys.rooms(propertyId || ''),
    queryFn: () => fetchRoomsByPropertyId(propertyId!),
    enabled: !!propertyId,
  });

  // Sync rooms to store
  useEffect(() => {
    if (propertyId && rooms.length > 0) {
      // The store will be updated via the query
    }
  }, [propertyId, rooms]);

  // Fetch upcoming bookings
  const {
    data: upcomingBookings = [],
    isLoading: isLoadingBookings,
    error: bookingsError,
    refetch: refetchBookingsQuery,
  } = useQuery({
    queryKey: rentalPropertyDetailKeys.bookings(propertyId || ''),
    queryFn: () => fetchUpcomingBookingsByPropertyId(propertyId!),
    enabled: !!propertyId,
  });

  // Combined refetch
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchProperty(),
      refetchRoomsQuery(),
      refetchBookingsQuery(),
    ]);
  }, [refetchProperty, refetchRoomsQuery, refetchBookingsQuery]);

  const refetchRooms = useCallback(async () => {
    await refetchRoomsQuery();
  }, [refetchRoomsQuery]);

  const refetchBookings = useCallback(async () => {
    await refetchBookingsQuery();
  }, [refetchBookingsQuery]);

  // Combined error
  const error = propertyError || roomsError || bookingsError || null;

  return {
    property,
    rooms,
    upcomingBookings,
    isLoading: isLoadingProperty,
    isLoadingRooms,
    isLoadingBookings,
    error: error as Error | null,
    refetch,
    refetchRooms,
    refetchBookings,
  };
}

// ============================================
// Property Mutations Hook
// ============================================

export interface UseRentalPropertyMutationsReturn {
  /** Updates property. Throws on error - caller should handle with try/catch. */
  updateProperty: (data: Partial<RentalProperty>) => Promise<RentalProperty>;
  /** Updates property status. Throws on error - caller should handle with try/catch. */
  updateStatus: (status: 'active' | 'inactive' | 'maintenance') => Promise<void>;
  /** Deletes property. Throws on error - caller should handle with try/catch. */
  deleteProperty: () => Promise<void>;
  isSaving: boolean;
}

export function useRentalPropertyMutations(
  propertyId: string
): UseRentalPropertyMutationsReturn {
  const queryClient = useQueryClient();

  // Update property mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<RentalProperty>) => {
      // Build update data, excluding fields that shouldn't be sent
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only map fields that are provided and valid for updates
      if (data.name !== undefined) updateData.name = data.name;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.state !== undefined) updateData.state = data.state;
      if (data.zip !== undefined) updateData.zip = data.zip;
      if (data.property_type !== undefined) updateData.property_type = data.property_type;
      if (data.rental_type !== undefined) updateData.rental_type = data.rental_type;
      if (data.bedrooms !== undefined) updateData.bedrooms = data.bedrooms;
      if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms;
      if (data.square_feet !== undefined) updateData.square_feet = data.square_feet;
      if (data.base_rate !== undefined) updateData.base_rate = data.base_rate;
      if (data.rate_type !== undefined) updateData.rate_type = data.rate_type;
      if (data.cleaning_fee !== undefined) updateData.cleaning_fee = data.cleaning_fee;
      if (data.security_deposit !== undefined) updateData.security_deposit = data.security_deposit;
      if (data.is_room_by_room_enabled !== undefined) updateData.is_room_by_room_enabled = data.is_room_by_room_enabled;
      if (data.amenities !== undefined) updateData.amenities = data.amenities;
      if (data.house_rules !== undefined) updateData.house_rules = data.house_rules;
      if (data.listing_urls !== undefined) updateData.listing_urls = data.listing_urls;
      if (data.status !== undefined) updateData.status = data.status;

      const { data: updated, error } = await supabase
        .from('landlord_properties')
        .update(updateData)
        .eq('id', propertyId)
        .select()
        .single();

      if (error) throw error;
      return updated as unknown as RentalProperty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: rentalPropertyDetailKeys.detail(propertyId),
      });
      queryClient.invalidateQueries({ queryKey: rentalPropertyKeys.lists() });
    },
    onError: (error) => {
      // Log error for debugging and re-throw to propagate to caller
      console.error('Failed to update property:', error);
    },
  });

  // Delete property mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('landlord_properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalPropertyKeys.lists() });
    },
    onError: (error) => {
      // Log error for debugging and re-throw to propagate to caller
      console.error('Failed to delete property:', error);
    },
  });

  const updateProperty = useCallback(
    async (data: Partial<RentalProperty>): Promise<RentalProperty> => {
      // Let errors propagate to caller for proper handling
      return await updateMutation.mutateAsync(data);
    },
    [updateMutation]
  );

  const updateStatus = useCallback(
    async (status: 'active' | 'inactive' | 'maintenance'): Promise<void> => {
      // Let errors propagate to caller for proper handling
      await updateMutation.mutateAsync({ status });
    },
    [updateMutation]
  );

  const deleteProperty = useCallback(async (): Promise<void> => {
    // Let errors propagate to caller for proper handling
    await deleteMutation.mutateAsync();
  }, [deleteMutation]);

  return {
    updateProperty,
    updateStatus,
    deleteProperty,
    isSaving: updateMutation.isPending || deleteMutation.isPending,
  };
}

export default useRentalPropertyDetail;
