// src/features/real-estate/types/comps.ts
// Comparable properties types

export interface PropertyComp {
  id: string;
  property_id?: string;
  // Keep address for backward compatibility
  address: string;
  // Add new standardized fields
  address_line_1?: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  zip: string;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  sqft?: number | null;
  year_built?: number | null;
  yearBuilt?: number | null;
  // Made nullable to match database types
  sold_price?: number | null;
  salePrice?: number | null;
  sold_date?: string | null;
  saleDate?: string | null;
  days_on_market?: number | null;
  distance?: number | null;
  price_per_sqft?: number | null;
  status?: string | null;
  special_features?: string | null;
  lot_size?: number | null;
  lotSize?: number | null;
  // Add fields that are used in hooks
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  user_id?: string | null;
  features_json?: unknown;
  source?: string | null;
}
