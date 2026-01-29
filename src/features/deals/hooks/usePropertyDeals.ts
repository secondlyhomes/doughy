// src/features/deals/hooks/usePropertyDeals.ts
// Hook for fetching deals associated with a property

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Deal } from '../types';

interface PropertyDeal extends Deal {
  lead?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
}

/**
 * Fetch all deals associated with a specific property
 * This helps show the history of deals/offers on a property
 */
export function usePropertyDeals(propertyId: string | null) {
  return useQuery({
    queryKey: ['property-deals', propertyId],
    queryFn: async (): Promise<PropertyDeal[]> => {
      if (!propertyId) return [];

      // Query deals with linked lead data
      // Note: Table is 'deals', not 're_deals'
      const { data, error } = await supabase
        .from('investor_deals_pipeline')
        .select(`
          *,
          lead:crm_leads(id, name, phone, email)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching property deals:', error);
        throw error;
      }

      // Map to our Deal type
      // Note: strategy and risk_score columns don't exist in DB yet
      return (data || []).map(row => ({
        id: row.id,
        lead_id: row.lead_id,
        property_id: row.property_id,
        stage: row.stage || 'new',
        next_action: row.next_action,
        next_action_due: row.next_action_due,
        created_at: row.created_at,
        updated_at: row.updated_at,
        lead: row.lead,
      })) as PropertyDeal[];
    },
    enabled: !!propertyId,
  });
}

export type { PropertyDeal };
