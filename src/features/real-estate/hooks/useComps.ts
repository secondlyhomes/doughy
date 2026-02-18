// src/features/real-estate/hooks/useComps.ts
// Hook for managing comparable properties (comps) for a property

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PropertyComp } from '../types';

interface UseCompsOptions {
  propertyId: string | null;
}

interface UseCompsReturn {
  comps: PropertyComp[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  calculatedARV: number | null;
  arvPerSqft: number | null;
}

/**
 * Hook for fetching comps for a property
 */
export function useComps({ propertyId }: UseCompsOptions): UseCompsReturn {
  const [comps, setComps] = useState<PropertyComp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchComps = useCallback(async () => {
    if (!propertyId) {
      setComps([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .schema('investor').from('comps')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setComps(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching comps:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchComps();
  }, [fetchComps]);

  // Calculate ARV based on comps
  const { calculatedARV, arvPerSqft } = calculateARV(comps);

  return {
    comps,
    isLoading,
    error,
    refetch: fetchComps,
    calculatedARV,
    arvPerSqft,
  };
}

/**
 * Calculate ARV from comparable properties
 * Uses average price per sqft of comps
 */
function calculateARV(comps: PropertyComp[]): { calculatedARV: number | null; arvPerSqft: number | null } {
  if (comps.length === 0) {
    return { calculatedARV: null, arvPerSqft: null };
  }

  // Calculate average price per sqft
  let totalPricePerSqft = 0;
  let validComps = 0;

  for (const comp of comps) {
    const sqft = comp.square_feet || comp.sqft;
    const price = comp.sold_price || comp.salePrice;

    if (sqft && sqft > 0 && price && price > 0) {
      totalPricePerSqft += price / sqft;
      validComps++;
    }
  }

  if (validComps === 0) {
    // Fall back to simple average if no sqft data
    const totalPrice = comps.reduce((sum, comp) => sum + (comp.sold_price || comp.salePrice || 0), 0);
    // Guard against zero total price (all comps have no price data)
    if (totalPrice === 0 || comps.length === 0) {
      return { calculatedARV: null, arvPerSqft: null };
    }
    return {
      calculatedARV: Math.round(totalPrice / comps.length),
      arvPerSqft: null,
    };
  }

  const avgPricePerSqft = totalPricePerSqft / validComps;

  return {
    calculatedARV: null, // This will be calculated when combined with subject property sqft
    arvPerSqft: Math.round(avgPricePerSqft),
  };
}

/**
 * Hook for comp mutations (create, update, delete)
 */
export function useCompMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createComp = useCallback(async (
    propertyId: string,
    compData: Partial<PropertyComp>
  ): Promise<PropertyComp | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const insertData = {
        property_id: propertyId,
        user_id: user.id,
        address: compData.address || compData.address_line_1 || '',
        address_line_1: compData.address_line_1 || compData.address || '',
        address_line_2: compData.address_line_2 || null,
        city: compData.city || '',
        state: compData.state || '',
        zip: compData.zip || '',
        bedrooms: compData.bedrooms || null,
        bathrooms: compData.bathrooms || null,
        square_feet: compData.square_feet || compData.sqft || null,
        year_built: compData.year_built || compData.yearBuilt || null,
        lot_size: compData.lot_size || compData.lotSize || null,
        sold_price: compData.sold_price || compData.salePrice || null,
        sold_date: compData.sold_date || compData.saleDate || null,
        days_on_market: compData.days_on_market || null,
        distance: compData.distance || null,
        price_per_sqft: compData.price_per_sqft || null,
        source: compData.source || 'manual',
      };

      const { data, error: insertError } = await supabase
        .schema('investor').from('comps')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error creating comp:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateComp = useCallback(async (
    compId: string,
    updates: Partial<PropertyComp>
  ): Promise<PropertyComp | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Build update data with proper typing
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Map fields - only include defined values
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.address_line_1 !== undefined) updateData.address_line_1 = updates.address_line_1;
      if (updates.address_line_2 !== undefined) updateData.address_line_2 = updates.address_line_2;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.state !== undefined) updateData.state = updates.state;
      if (updates.zip !== undefined) updateData.zip = updates.zip;
      if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms;
      if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms;
      if (updates.square_feet !== undefined) updateData.square_feet = updates.square_feet;
      if (updates.year_built !== undefined) updateData.year_built = updates.year_built;
      if (updates.lot_size !== undefined) updateData.lot_size = updates.lot_size;
      if (updates.sold_price !== undefined) updateData.sold_price = updates.sold_price;
      if (updates.sold_date !== undefined) updateData.sold_date = updates.sold_date;
      if (updates.distance !== undefined) updateData.distance = updates.distance;

      const { data, error: updateError } = await supabase
        .schema('investor').from('comps')
        .update(updateData)
        .eq('id', compId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error updating comp:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteComp = useCallback(async (compId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .schema('investor').from('comps')
        .delete()
        .eq('id', compId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deleting comp:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createComp,
    updateComp,
    deleteComp,
    isLoading,
    error,
  };
}
