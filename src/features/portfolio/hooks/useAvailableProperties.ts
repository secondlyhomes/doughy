// src/features/portfolio/hooks/useAvailableProperties.ts
// Hook to fetch properties available for adding to portfolio

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Property } from '@/features/real-estate/types';
import { dbToFeatureProperty } from '@/features/real-estate/types';

export interface AvailableProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  purchase_price?: number;
  property_type?: string;
}

/**
 * Fetches properties that can be added to the portfolio
 * Excludes properties already in portfolio (via re_portfolio_entries or closed_won deals)
 */
export function useAvailableProperties() {
  const { user } = useAuth();

  const {
    data: properties,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['available-properties', user?.id],
    queryFn: async (): Promise<AvailableProperty[]> => {
      if (!user?.id) return [];

      // Get all properties for the user
      const { data: allProperties, error: propertiesError } = await supabase
        .from('re_properties')
        .select('id, address_line_1, city, state, zip, purchase_price, property_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        throw propertiesError;
      }

      if (!allProperties || allProperties.length === 0) {
        return [];
      }

      // Get property IDs already in portfolio entries
      const { data: portfolioEntries, error: entriesError } = await supabase
        .from('re_portfolio_entries')
        .select('property_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (entriesError) {
        console.error('Error fetching portfolio entries:', entriesError);
        // Continue without filtering by entries if table doesn't exist yet
      }

      // Get property IDs from closed_won deals
      const { data: closedDeals, error: dealsError } = await supabase
        .from('deals')
        .select('property_id')
        .eq('user_id', user.id)
        .eq('stage', 'closed_won')
        .not('property_id', 'is', null);

      if (dealsError) {
        console.error('Error fetching closed deals:', dealsError);
      }

      // Create set of excluded property IDs
      const excludedIds = new Set<string>();

      portfolioEntries?.forEach(entry => {
        if (entry.property_id) excludedIds.add(entry.property_id);
      });

      closedDeals?.forEach(deal => {
        if (deal.property_id) excludedIds.add(deal.property_id);
      });

      // Filter out properties already in portfolio
      const availableProperties = allProperties
        .filter(p => !excludedIds.has(p.id))
        .map(p => ({
          id: p.id,
          address: p.address_line_1 || '',
          city: p.city || '',
          state: p.state || '',
          zip: p.zip || '',
          purchase_price: p.purchase_price ?? undefined,
          property_type: p.property_type ?? undefined,
        }));

      return availableProperties;
    },
    enabled: !!user?.id,
  });

  return {
    properties: properties || [],
    isLoading,
    error,
    refetch,
  };
}
