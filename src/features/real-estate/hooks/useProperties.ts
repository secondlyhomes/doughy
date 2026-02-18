// src/features/real-estate/hooks/useProperties.ts
// Hook for fetching and managing property list data

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Property, DBProperty, DBPropertyWithImages, dbToFeatureProperty, PropertyStatus, PropertyType } from '../types';
import { isValidUuid } from '@/lib/validation';

export type PropertySortOption = 'created_desc' | 'created_asc' | 'updated_desc' | 'price_desc' | 'price_asc';

interface UsePropertiesOptions {
  status?: PropertyStatus;
  propertyType?: PropertyType;
  limit?: number;
  sortBy?: PropertySortOption;
}

interface UsePropertiesReturn {
  properties: Property[];
  isLoading: boolean;
  error: Error | null;
  count: number;
  refetch: () => Promise<void>;
}

export function useProperties(options: UsePropertiesOptions = {}): UsePropertiesReturn {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query with filters - join images for display
      let query = supabase
        .schema('investor').from('properties')
        .select(`
          *,
          images:property_images(id, url, is_primary, label, filename)
        `, { count: 'exact', head: false });

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.propertyType) {
        query = query.eq('property_type', options.propertyType);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_desc';
      switch (sortBy) {
        case 'created_desc':
          query = query.order('created_at', { ascending: false });
          break;
        case 'created_asc':
          query = query.order('created_at', { ascending: true });
          break;
        case 'updated_desc':
          query = query.order('updated_at', { ascending: false });
          break;
        case 'price_desc':
          query = query.order('arv', { ascending: false, nullsFirst: false });
          break;
        case 'price_asc':
          query = query.order('arv', { ascending: true, nullsFirst: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Add pagination if needed
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Execute query
      const { data, error: queryError, count: totalCount } = await query;

      if (queryError) {
        throw queryError;
      }

      // Convert DB properties to frontend format
      const convertedProperties = (data as DBPropertyWithImages[]).map(dbToFeatureProperty);

      setProperties(convertedProperties);
      if (totalCount !== null) {
        setCount(totalCount);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching properties:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [options.status, options.propertyType, options.limit, options.sortBy]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    properties,
    isLoading,
    error,
    count,
    refetch: fetchProperties,
  };
}

/**
 * Hook for fetching a single property by ID
 */
export function useProperty(propertyId: string | null) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProperty = useCallback(async () => {
    // Skip fetch if propertyId is missing or not a valid UUID (prevents "new" or other strings from hitting DB)
    if (!propertyId || !isValidUuid(propertyId)) {
      setProperty(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .schema('investor').from('properties')
        .select(`
          *,
          images:property_images(id, url, is_primary, label, filename)
        `)
        .eq('id', propertyId)
        .single();

      if (queryError) {
        throw queryError;
      }

      if (data) {
        setProperty(dbToFeatureProperty(data as DBPropertyWithImages));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching property:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  return {
    property,
    isLoading,
    error,
    refetch: fetchProperty,
  };
}

/**
 * Hook for property mutations (create, update, delete)
 */
export function usePropertyMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createProperty = useCallback(async (propertyData: Partial<Property>): Promise<Property | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      const address_line_1 = propertyData.address || propertyData.address_line_1;
      const city = propertyData.city;
      const state = propertyData.state;
      const zip = propertyData.zip;

      if (!address_line_1 || !city || !state || !zip) {
        throw new Error('Address, city, state, and zip are required');
      }

      const insertData = {
        user_id: user.id,
        address_line_1,
        address_line_2: propertyData.address_line_2 || null,
        city,
        state,
        zip,
        square_feet: propertyData.square_feet || propertyData.sqft || null,
        bedrooms: propertyData.bedrooms || null,
        bathrooms: propertyData.bathrooms || null,
        year_built: propertyData.year_built || propertyData.yearBuilt || null,
        lot_size: propertyData.lot_size || propertyData.lotSize || null,
        property_type: propertyData.propertyType || propertyData.property_type || null,
        notes: propertyData.notes || null,
        arv: propertyData.arv || null,
        purchase_price: propertyData.purchase_price || null,
        status: propertyData.status || 'active',
      };

      const { data, error: insertError } = await supabase
        .schema('investor').from('properties')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return data ? dbToFeatureProperty(data as DBProperty) : null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error creating property:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProperty = useCallback(async (
    propertyId: string,
    updates: Partial<Property>
  ): Promise<Property | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map frontend fields to database fields
      if (updates.address || updates.address_line_1) {
        updateData.address_line_1 = updates.address || updates.address_line_1;
      }
      if (updates.address_line_2 !== undefined) updateData.address_line_2 = updates.address_line_2;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.state !== undefined) updateData.state = updates.state;
      if (updates.zip !== undefined) updateData.zip = updates.zip;
      if (updates.county !== undefined) updateData.county = updates.county;
      if (updates.square_feet !== undefined || updates.sqft !== undefined) {
        updateData.square_feet = updates.square_feet || updates.sqft;
      }
      if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms;
      if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms;
      if (updates.year_built !== undefined || updates.yearBuilt !== undefined) {
        updateData.year_built = updates.year_built || updates.yearBuilt;
      }
      if (updates.lot_size !== undefined || updates.lotSize !== undefined) {
        updateData.lot_size = updates.lot_size || updates.lotSize;
      }
      if (updates.propertyType !== undefined || updates.property_type !== undefined) {
        updateData.property_type = updates.propertyType || updates.property_type;
      }
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.arv !== undefined) updateData.arv = updates.arv;
      if (updates.purchase_price !== undefined) updateData.purchase_price = updates.purchase_price;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { data, error: updateError } = await supabase
        .schema('investor').from('properties')
        .update(updateData)
        .eq('id', propertyId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return data ? dbToFeatureProperty(data as DBProperty) : null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error updating property:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProperty = useCallback(async (propertyId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .schema('investor').from('properties')
        .delete()
        .eq('id', propertyId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deleting property:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createProperty,
    updateProperty,
    deleteProperty,
    isLoading,
    error,
  };
}
