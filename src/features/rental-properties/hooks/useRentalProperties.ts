// src/features/rental-properties/hooks/useRentalProperties.ts
// Hooks for fetching and managing rental properties
// Follows the pattern from src/features/leads/hooks/useLeads.ts

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RentalProperty, RentalType } from '../types';

// ============================================
// Query Keys
// ============================================

export const rentalPropertyKeys = {
  all: ['rental-properties'] as const,
  lists: () => [...rentalPropertyKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...rentalPropertyKeys.lists(), filters] as const,
  details: () => [...rentalPropertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...rentalPropertyKeys.details(), id] as const,
  withRooms: () => [...rentalPropertyKeys.all, 'with-rooms'] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchRentalProperties(): Promise<RentalProperty[]> {
  const { data, error } = await supabase
    .schema('landlord').from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rental properties:', error);
    throw error;
  }

  return (data || []) as unknown as RentalProperty[];
}

async function fetchRentalPropertyById(id: string): Promise<RentalProperty | null> {
  const { data, error } = await supabase
    .schema('landlord').from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching rental property:', error);
    throw error;
  }

  return data as unknown as RentalProperty;
}

interface RentalPropertyWithRooms extends RentalProperty {
  rooms_count: number;
  occupied_rooms: number;
}

async function fetchRentalPropertiesWithRooms(): Promise<RentalPropertyWithRooms[]> {
  // Fetch properties with room counts
  // Note: This uses a subquery pattern - adjust based on your rooms table structure
  const { data, error } = await supabase
    .schema('landlord').from('properties')
    .select(`
      *,
      rooms:rooms(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rental properties with rooms:', error);
    throw error;
  }

  // Map to include room counts
  return (data || []).map((property) => {
    const roomsData = property.rooms as unknown as { count: number }[] | null;
    const roomsCount = roomsData?.[0]?.count ?? 0;

    return {
      ...property,
      rooms_count: roomsCount,
      occupied_rooms: 0, // TODO: Fetch from occupancy data when available
    } as unknown as RentalPropertyWithRooms;
  });
}

async function createRentalProperty(
  propertyData: Partial<RentalProperty>
): Promise<RentalProperty> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('User not authenticated');
  }

  // Map from interface fields to database columns
  const insertData: Record<string, unknown> = {
    user_id: userData.user.id,
    name: propertyData.name,
    address: propertyData.address,
    city: propertyData.city,
    state: propertyData.state,
    zip: propertyData.zip || null,
    property_type: propertyData.property_type || 'single_family',
    rental_type: propertyData.rental_type || 'ltr',
    bedrooms: propertyData.bedrooms || 0,
    bathrooms: propertyData.bathrooms || 0,
    square_feet: propertyData.square_feet || null,
    base_rate: propertyData.base_rate || 0,
    rate_type: propertyData.rate_type || 'monthly',
    cleaning_fee: propertyData.cleaning_fee || null,
    security_deposit: propertyData.security_deposit || null,
    is_room_by_room_enabled: propertyData.is_room_by_room_enabled || false,
    amenities: propertyData.amenities || [],
    house_rules: propertyData.house_rules || {},
    listing_urls: propertyData.listing_urls || {},
    status: propertyData.status || 'active',
  };

  const { data, error } = await supabase
    .schema('landlord').from('properties')
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating rental property:', error);
    throw error;
  }

  return data as unknown as RentalProperty;
}

async function updateRentalProperty(
  id: string,
  updates: Partial<RentalProperty>
): Promise<RentalProperty> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Only map fields that are provided
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.address !== undefined) updateData.address = updates.address;
  if (updates.city !== undefined) updateData.city = updates.city;
  if (updates.state !== undefined) updateData.state = updates.state;
  if (updates.zip !== undefined) updateData.zip = updates.zip;
  if (updates.property_type !== undefined) updateData.property_type = updates.property_type;
  if (updates.rental_type !== undefined) updateData.rental_type = updates.rental_type;
  if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms;
  if (updates.square_feet !== undefined) updateData.square_feet = updates.square_feet;
  if (updates.base_rate !== undefined) updateData.base_rate = updates.base_rate;
  if (updates.rate_type !== undefined) updateData.rate_type = updates.rate_type;
  if (updates.cleaning_fee !== undefined) updateData.cleaning_fee = updates.cleaning_fee;
  if (updates.security_deposit !== undefined) updateData.security_deposit = updates.security_deposit;
  if (updates.is_room_by_room_enabled !== undefined) updateData.is_room_by_room_enabled = updates.is_room_by_room_enabled;
  if (updates.amenities !== undefined) updateData.amenities = updates.amenities;
  if (updates.house_rules !== undefined) updateData.house_rules = updates.house_rules;
  if (updates.listing_urls !== undefined) updateData.listing_urls = updates.listing_urls;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { data, error } = await supabase
    .schema('landlord').from('properties')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating rental property:', error);
    throw error;
  }

  return data as unknown as RentalProperty;
}

async function deleteRentalProperty(id: string): Promise<void> {
  const { error } = await supabase
    .schema('landlord').from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting rental property:', error);
    throw error;
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch all rental properties
 */
export function useRentalProperties() {
  const {
    data: properties = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: rentalPropertyKeys.lists(),
    queryFn: fetchRentalProperties,
  });

  return {
    properties,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch rental properties with room counts
 */
export function useRentalPropertiesWithRooms() {
  const {
    data: properties = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: rentalPropertyKeys.withRooms(),
    queryFn: fetchRentalPropertiesWithRooms,
  });

  return {
    properties,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single rental property by ID
 */
export function useRentalProperty(id: string) {
  const {
    data: property,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: rentalPropertyKeys.detail(id),
    queryFn: () => fetchRentalPropertyById(id),
    enabled: !!id,
  });

  return {
    property,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to create a new rental property
 */
export function useCreateRentalProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRentalProperty,
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: rentalPropertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rentalPropertyKeys.withRooms() });
    },
    onError: (error) => {
      // Log error for debugging - errors propagate to caller via mutateAsync
      console.error('Failed to create property:', error);
    },
  });
}

/**
 * Hook to update a rental property
 */
export function useUpdateRentalProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RentalProperty> }) =>
      updateRentalProperty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rentalPropertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rentalPropertyKeys.withRooms() });
      queryClient.invalidateQueries({ queryKey: rentalPropertyKeys.detail(variables.id) });
    },
    onError: (error) => {
      // Log error for debugging - errors propagate to caller via mutateAsync
      console.error('Failed to update property:', error);
    },
  });
}

/**
 * Hook to delete a rental property
 */
export function useDeleteRentalProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRentalProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalPropertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rentalPropertyKeys.withRooms() });
    },
    onError: (error) => {
      // Log error for debugging - errors propagate to caller via mutateAsync
      console.error('Failed to delete property:', error);
    },
  });
}

/**
 * Hook to filter properties by rental type
 */
export function useFilteredRentalProperties(rentalType?: RentalType | 'all') {
  const { properties, isLoading, error, refetch } = useRentalProperties();

  const filteredProperties = useCallback(() => {
    if (!rentalType || rentalType === 'all') {
      return properties;
    }
    return properties.filter((p) => p.rental_type === rentalType);
  }, [properties, rentalType]);

  return {
    properties: filteredProperties(),
    isLoading,
    error,
    refetch,
  };
}

export default useRentalProperties;
