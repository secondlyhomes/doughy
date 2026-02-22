// src/features/deals/hooks/dealTypes.ts
// Type definitions for deal hooks

import type { Database } from '@/integrations/supabase/types';
import type { DealStrategy } from '../types';

// Type alias for the deals table row with joined relations
export type DealRow = Database['public']['Tables']['deals']['Row'] & {
  strategy?: DealStrategy;
  risk_score?: number;
};

export type DealWithRelations = DealRow & {
  lead?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    status: string;
    score: number | null;
    tags?: string[] | null;
  } | null;
  property?: {
    id: string;
    address_line_1: string | null;
    address_line_2?: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    county?: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    square_feet: number | null;
    lot_size?: number | null;
    year_built?: number | null;
    property_type?: string | null;
    arv: number | null;
    purchase_price: number | null;
    notes?: string | null;
    status?: string | null;
  } | null;
};

export interface DealsFilters {
  stage?: string | 'all';
  strategy?: DealStrategy;
  search?: string;
  activeOnly?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'next_action_due' | 'stage';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateDealInput {
  lead_id?: string;
  property_id?: string;
  stage?: string;
  strategy?: DealStrategy;
  next_action?: string;
  next_action_due?: string;
  title?: string;
}

// Pagination constants
export const PAGE_SIZE = 20;

// Paginated result interface
export interface PaginatedDealsResult {
  deals: Deal[];
  nextCursor: number | null;
  hasMore: boolean;
}

// Re-export Deal type for convenience
import type { Deal } from '../types';
export type { Deal };
