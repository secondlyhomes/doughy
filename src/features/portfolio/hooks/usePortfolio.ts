// src/features/portfolio/hooks/usePortfolio.ts
// Hook for managing the user's portfolio of properties

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { PortfolioProperty, PortfolioSummary, AddToPortfolioInput } from '../types';
import type { PropertyImage } from '@/features/real-estate/types';

// Empty portfolio state for when no data exists
const EMPTY_PORTFOLIO: { properties: PortfolioProperty[]; summary: PortfolioSummary } = {
  properties: [],
  summary: {
    totalProperties: 0,
    totalValue: 0,
    totalEquity: 0,
    monthlyCashFlow: 0,
  },
};

/**
 * Transform a database property record into a PortfolioProperty
 */
function transformToPortfolioProperty(
  property: Record<string, unknown>,
  overrides: {
    purchasePrice: number;
    monthlyRent: number;
    monthlyExpenses: number;
    acquisitionDate?: string;
    dealId?: string;
    images?: PropertyImage[];
    portfolioEntryId?: string;
    groupId?: string;
  }
): PortfolioProperty {
  const currentValue = overrides.purchasePrice; // Use purchase price as current value for now

  return {
    id: property.id as string,
    address: (property.address_line_1 as string) || '',
    address_line_1: property.address_line_1 as string,
    address_line_2: property.address_line_2 as string | undefined,
    city: (property.city as string) || '',
    state: (property.state as string) || '',
    zip: (property.zip as string) || '',
    county: property.county as string | undefined,
    square_feet: (property.square_feet as number) || 0,
    sqft: (property.square_feet as number) || 0,
    bedrooms: (property.bedrooms as number) || 0,
    bathrooms: (property.bathrooms as number) || 0,
    year_built: property.year_built as number | undefined,
    yearBuilt: property.year_built as number | undefined,
    lot_size: property.lot_size as number | undefined,
    lotSize: property.lot_size as number | undefined,
    property_type: property.property_type as string | undefined,
    propertyType: (property.property_type as string) || 'other',
    notes: property.notes as string | undefined,
    arv: (property.arv as number | undefined) || overrides.purchasePrice || undefined,
    purchase_price: overrides.purchasePrice,
    current_value: currentValue,
    equity: 0, // Will be calculated when we have proper valuations
    monthly_rent: overrides.monthlyRent,
    monthly_expenses: overrides.monthlyExpenses,
    monthly_cash_flow: overrides.monthlyRent - overrides.monthlyExpenses,
    acquisition_date: overrides.acquisitionDate,
    deal_id: overrides.dealId,
    portfolio_entry_id: overrides.portfolioEntryId,
    group_id: overrides.groupId,
    status: property.status as string | undefined,
    tags: property.tags as string[] | undefined,
    mls_id: property.mls_id as string | undefined,
    created_at: property.created_at as string | undefined,
    updated_at: property.updated_at as string | undefined,
    images: overrides.images,
  };
}

/**
 * Hook for fetching and managing the user's property portfolio
 * Fetches from both closed_won deals and manual portfolio entries
 */
export function usePortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async (): Promise<{ properties: PortfolioProperty[]; summary: PortfolioSummary }> => {
      if (!user?.id) {
        return { properties: [], summary: { totalProperties: 0, totalValue: 0, totalEquity: 0, monthlyCashFlow: 0 } };
      }

      try {
        // Map to track properties by ID to avoid duplicates
        const propertyMap = new Map<string, PortfolioProperty>();

        // 1. Get properties from closed_won deals
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select(`
            *,
            property:re_properties(
              *,
              images:re_property_images(id, url, is_primary, label, filename)
            )
          `)
          .eq('user_id', user.id)
          .eq('stage', 'closed_won');

        if (dealsError) {
          console.error('Error fetching portfolio deals:', dealsError);
          throw dealsError;
        }

        // Process deals into portfolio properties
        if (deals && deals.length > 0) {
          for (const deal of deals) {
            if (!deal.property) continue;

            const property = deal.property as Record<string, unknown>;
            const purchasePrice = (property.purchase_price as number) || 0;
            const images = (property.images as PropertyImage[]) || [];

            const portfolioProperty = transformToPortfolioProperty(property, {
              purchasePrice,
              monthlyRent: 0, // Will come from portfolio entry if exists
              monthlyExpenses: 0,
              acquisitionDate: deal.updated_at ?? undefined,
              dealId: deal.id,
              images,
              portfolioEntryId: undefined, // Deal-based entries don't have portfolio entry yet
            });

            propertyMap.set(property.id as string, portfolioProperty);
          }
        }

        // 2. Get properties from manual portfolio entries
        const { data: entries, error: entriesError } = await supabase
          .from('re_portfolio_entries')
          .select(`
            *,
            property:re_properties(
              *,
              images:re_property_images(id, url, is_primary, label, filename)
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        // If table doesn't exist yet, continue without entries
        if (entriesError && !entriesError.message.includes('does not exist')) {
          console.error('Error fetching portfolio entries:', entriesError);
        }

        // Process manual entries (these override deal-based entries for the same property)
        if (entries && entries.length > 0) {
          for (const entry of entries) {
            if (!entry.property) continue;

            const property = entry.property as Record<string, unknown>;
            const purchasePrice = entry.acquisition_price || (property.purchase_price as number) || 0;
            const images = (property.images as PropertyImage[]) || [];

            const portfolioProperty = transformToPortfolioProperty(property, {
              purchasePrice,
              monthlyRent: entry.monthly_rent || 0,
              monthlyExpenses: entry.monthly_expenses || 0,
              acquisitionDate: entry.acquisition_date,
              dealId: entry.deal_id ?? undefined,
              images,
              portfolioEntryId: entry.id,
              groupId: entry.group_id ?? undefined,
            });

            // Manual entries override deal entries for same property
            propertyMap.set(entry.property_id, portfolioProperty);
          }
        }

        // Convert map to array
        const properties = Array.from(propertyMap.values());

        if (properties.length === 0) {
          return EMPTY_PORTFOLIO;
        }

        // Calculate summary metrics
        const summary: PortfolioSummary = {
          totalProperties: properties.length,
          totalValue: properties.reduce((sum, p) => sum + (p.current_value || 0), 0),
          totalEquity: properties.reduce((sum, p) => sum + (p.equity || 0), 0),
          monthlyCashFlow: properties.reduce((sum, p) => sum + (p.monthly_cash_flow || 0), 0),
        };

        return { properties, summary };
      } catch (err) {
        console.error('Error in usePortfolio:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
  });

  // Add property to portfolio (mark deal as closed_won)
  const addToPortfolio = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from('deals')
        .update({
          stage: 'closed_won',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  // Add manual portfolio entry
  const addManualEntry = useMutation({
    mutationFn: async (input: AddToPortfolioInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      let propertyId = input.property_id;

      // Track if we created a new property (for cleanup on failure)
      let createdNewProperty = false;

      // If creating a new property, insert it first
      if (input.newProperty && !propertyId) {
        const { data: newProperty, error: propertyError } = await supabase
          .from('re_properties')
          .insert({
            address_line_1: input.newProperty.address,
            city: input.newProperty.city,
            state: input.newProperty.state,
            zip: input.newProperty.zip,
            property_type: input.newProperty.property_type || 'single_family',
            bedrooms: input.newProperty.bedrooms || 0,
            bathrooms: input.newProperty.bathrooms || 0,
            square_feet: input.newProperty.square_feet || 0,
            year_built: input.newProperty.year_built,
            purchase_price: input.newProperty.purchase_price || input.acquisition_price,
            user_id: user.id,
          })
          .select('id')
          .single();

        if (propertyError) {
          console.error('Error creating property:', propertyError);
          throw propertyError;
        }

        propertyId = newProperty.id;
        createdNewProperty = true;
      }

      if (!propertyId) {
        throw new Error('Property ID is required');
      }

      // Create or update portfolio entry (upsert handles duplicate submissions)
      const { error: entryError } = await supabase
        .from('re_portfolio_entries')
        .upsert({
          user_id: user.id,
          property_id: propertyId,
          acquisition_date: input.acquisition_date,
          acquisition_source: 'manual',
          acquisition_price: input.acquisition_price,
          monthly_rent: input.monthly_rent || 0,
          monthly_expenses: input.monthly_expenses || 0,
          notes: input.notes,
          is_active: true,
        }, {
          onConflict: 'user_id,property_id',
        });

      if (entryError) {
        console.error('Error creating portfolio entry:', entryError);
        // Cleanup: delete the orphaned property if we just created it
        if (createdNewProperty && propertyId) {
          await supabase.from('re_properties').delete().eq('id', propertyId);
        }
        throw entryError;
      }

      return { propertyId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['available-properties'] });
    },
  });

  // Remove property from portfolio (revert to previous stage)
  const removeFromPortfolio = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase
        .from('deals')
        .update({
          stage: 'negotiating', // Revert to negotiating
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  return {
    properties: data?.properties || [],
    summary: data?.summary || { totalProperties: 0, totalValue: 0, totalEquity: 0, monthlyCashFlow: 0 },
    isLoading,
    error,
    refetch,
    addToPortfolio: addToPortfolio.mutate,
    addManualEntry: addManualEntry.mutateAsync,
    isAddingManual: addManualEntry.isPending,
    removeFromPortfolio: removeFromPortfolio.mutate,
    isAdding: addToPortfolio.isPending,
    isRemoving: removeFromPortfolio.isPending,
  };
}
