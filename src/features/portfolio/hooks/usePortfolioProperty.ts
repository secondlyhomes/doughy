// src/features/portfolio/hooks/usePortfolioProperty.ts
// Hook for fetching a single portfolio property with all related data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isValidUuid } from '@/lib/validation';
import type {
  PortfolioEntry,
  PortfolioProperty,
  PortfolioGroup,
  PortfolioPropertyDetail,
} from '../types';
import type { PropertyImage } from '@/features/real-estate/types';

/**
 * Hook for fetching and managing a single portfolio property
 */
export function usePortfolioProperty(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-property', propertyId],
    queryFn: async (): Promise<{
      entry: PortfolioEntry;
      property: PortfolioProperty;
      group?: PortfolioGroup;
    } | null> => {
      if (!propertyId || !user?.id) return null;

      // First try to find portfolio entry by property_id
      const { data: entry, error: entryError } = await supabase
        .from('re_portfolio_entries')
        .select(`
          *,
          group:re_portfolio_groups(*)
        `)
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (entryError && !entryError.message.includes('not found')) {
        console.error('Error fetching portfolio entry:', entryError);
      }

      // Fetch the property
      const { data: property, error: propertyError } = await supabase
        .from('re_properties')
        .select(`
          *,
          images:re_property_images(id, url, is_primary, label, filename)
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError) {
        console.error('Error fetching property:', propertyError);
        throw propertyError;
      }

      // If no portfolio entry but property exists, check if it's from a closed deal
      if (!entry) {
        const { data: deal } = await supabase
          .from('deals')
          .select('*')
          .eq('property_id', propertyId)
          .eq('user_id', user.id)
          .eq('stage', 'closed_won')
          .single();

        if (!deal) {
          // Property exists but not in portfolio
          return null;
        }

        // Create a synthetic entry from the deal
        const syntheticEntry: PortfolioEntry = {
          id: `deal-${deal.id}`,
          user_id: user.id,
          property_id: propertyId,
          acquisition_date: deal.updated_at || deal.created_at || new Date().toISOString(),
          acquisition_source: 'deal',
          acquisition_price: property.purchase_price || 0,
          deal_id: deal.id,
          monthly_rent: 0,
          monthly_expenses: 0,
          is_active: true,
        };

        return {
          entry: syntheticEntry,
          property: transformProperty(property),
        };
      }

      return {
        entry: transformEntry(entry),
        property: transformProperty(property),
        group: entry.group ? transformGroup(entry.group) : undefined,
      };
    },
    // Only fetch if propertyId is a valid UUID (prevents "new" or other strings from hitting DB)
    enabled: isValidUuid(propertyId) && !!user?.id,
  });

  // Update portfolio entry
  const updateEntry = useMutation({
    mutationFn: async (updates: Partial<PortfolioEntry>): Promise<void> => {
      if (!data?.entry.id || data.entry.id.startsWith('deal-')) {
        throw new Error('Cannot update synthetic entry');
      }

      const { error } = await supabase
        .from('re_portfolio_entries')
        .update(updates)
        .eq('id', data.entry.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  // Remove entry from portfolio
  const removeEntry = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!data?.entry) throw new Error('No entry to remove');

      // For deal-based entries, revert deal stage back to negotiating
      if (data.entry.deal_id && data.entry.id.startsWith('deal-')) {
        const { error } = await supabase
          .from('deals')
          .update({ stage: 'negotiating', updated_at: new Date().toISOString() })
          .eq('id', data.entry.deal_id)
          .eq('user_id', user?.id); // Security: ensure user owns the deal

        if (error) throw error;
      } else {
        // For manual entries, soft delete by setting is_active = false
        const { error } = await supabase
          .from('re_portfolio_entries')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', data.entry.id)
          .eq('user_id', user?.id); // Security: ensure user owns the entry

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-property', propertyId] });
    },
  });

  return {
    entry: data?.entry,
    property: data?.property,
    group: data?.group,
    portfolioEntryId: data?.entry?.id.startsWith('deal-') ? undefined : data?.entry?.id,
    isLoading,
    error,
    refetch,
    updateEntry: updateEntry.mutateAsync,
    isUpdating: updateEntry.isPending,
    removeEntry: removeEntry.mutateAsync,
    isRemoving: removeEntry.isPending,
  };
}

/**
 * Hook for fetching portfolio property by entry ID
 */
export function usePortfolioPropertyByEntryId(entryId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['portfolio-property-entry', entryId],
    queryFn: async () => {
      if (!entryId || !user?.id) return null;

      const { data: entry, error: entryError } = await supabase
        .from('re_portfolio_entries')
        .select(`
          *,
          group:re_portfolio_groups(*),
          property:re_properties(
            *,
            images:re_property_images(id, url, is_primary, label, filename)
          )
        `)
        .eq('id', entryId)
        .single();

      if (entryError) {
        console.error('Error fetching portfolio entry:', entryError);
        throw entryError;
      }

      return {
        entry: transformEntry(entry),
        property: transformProperty(entry.property),
        group: entry.group ? transformGroup(entry.group) : undefined,
      };
    },
    // Only fetch if entryId is a valid UUID (prevents "new" or other strings from hitting DB)
    enabled: isValidUuid(entryId) && !!user?.id,
  });
}

// Transform database entry to typed entry
function transformEntry(data: Record<string, unknown>): PortfolioEntry {
  return {
    id: data.id as string,
    user_id: data.user_id as string,
    property_id: data.property_id as string,
    acquisition_date: data.acquisition_date as string,
    acquisition_source: (data.acquisition_source as 'deal' | 'manual' | 'import') || 'manual',
    acquisition_price: (data.acquisition_price as number) || 0,
    deal_id: data.deal_id as string | null,
    group_id: data.group_id as string | null,
    monthly_rent: (data.monthly_rent as number) || 0,
    monthly_expenses: (data.monthly_expenses as number) || 0,
    projected_monthly_rent: data.projected_monthly_rent as number | undefined,
    projected_monthly_expenses: data.projected_monthly_expenses as number | undefined,
    property_manager_name: data.property_manager_name as string | undefined,
    property_manager_phone: data.property_manager_phone as string | undefined,
    ownership_percent: (data.ownership_percent as number) || 100,
    is_active: (data.is_active as boolean) ?? true,
    notes: data.notes as string | undefined,
    created_at: data.created_at as string | undefined,
    updated_at: data.updated_at as string | undefined,
  };
}

// Transform database property to typed property
function transformProperty(data: Record<string, unknown>): PortfolioProperty {
  const images = (data.images as PropertyImage[]) || [];

  return {
    id: data.id as string,
    address: (data.address_line_1 as string) || '',
    address_line_1: data.address_line_1 as string,
    address_line_2: data.address_line_2 as string | undefined,
    city: (data.city as string) || '',
    state: (data.state as string) || '',
    zip: (data.zip as string) || '',
    county: data.county as string | undefined,
    square_feet: (data.square_feet as number) || 0,
    sqft: (data.square_feet as number) || 0,
    bedrooms: (data.bedrooms as number) || 0,
    bathrooms: (data.bathrooms as number) || 0,
    year_built: data.year_built as number | undefined,
    yearBuilt: data.year_built as number | undefined,
    lot_size: data.lot_size as number | undefined,
    lotSize: data.lot_size as number | undefined,
    property_type: data.property_type as string | undefined,
    propertyType: (data.property_type as string) || 'other',
    notes: data.notes as string | undefined,
    purchase_price: data.purchase_price as number | undefined,
    arv: data.arv as number | undefined,
    status: data.status as string | undefined,
    tags: data.tags as string[] | undefined,
    mls_id: data.mls_id as string | undefined,
    created_at: data.created_at as string | undefined,
    updated_at: data.updated_at as string | undefined,
    images,
  };
}

// Transform database group to typed group
function transformGroup(data: Record<string, unknown>): PortfolioGroup {
  return {
    id: data.id as string,
    user_id: data.user_id as string,
    name: data.name as string,
    color: data.color as string | undefined,
    sort_order: (data.sort_order as number) || 0,
    created_at: data.created_at as string | undefined,
    updated_at: data.updated_at as string | undefined,
  };
}
