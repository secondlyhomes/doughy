// src/features/deals/hooks/usePropertyDeals.ts
// Hook for fetching deals associated with a property
// Uses RPC functions for cross-schema queries

import { useQuery } from '@tanstack/react-query';
import { getPropertyDeals } from '@/lib/rpc/investor';
import { mapPropertyDealRPC } from '@/lib/rpc/mappers';
import { Deal } from '../types';

interface PropertyDeal extends Deal {
  lead?: {
    id: string;
    name: string | null;
    phone?: string | null;
    email?: string | null;
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

      const data = await getPropertyDeals(propertyId);
      return data.map(mapPropertyDealRPC) as PropertyDeal[];
    },
    enabled: !!propertyId,
  });
}

export type { PropertyDeal };
