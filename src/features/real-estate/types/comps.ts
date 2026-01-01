// src/features/real-estate/types/comps.ts
// Comparable properties types

export interface PropertyComp {
  id: string;
  property_id?: string;
  // Keep address for backward compatibility
  address: string;
  // Add new standardized fields
  address_line_1?: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  sqft?: number;
  year_built?: number;
  yearBuilt?: number;
  sold_price: number;
  salePrice?: number;
  sold_date?: string;
  saleDate?: string;
  days_on_market?: number;
  distance: number;
  price_per_sqft: number;
  status?: string;
  special_features?: string;
  lot_size?: number;
  lotSize?: number;
  // Add fields that are used in hooks
  created_at?: string;
  updated_at?: string;
  features_json?: any;
  source?: string;
}
