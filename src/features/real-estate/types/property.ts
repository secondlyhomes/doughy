// src/features/real-estate/types/property.ts
// Core property types

import { Document } from './documents';
import { PropertyAnalysis } from './analysis';
import { PropertyComp } from './comps';
import { RepairEstimate } from './repairs';
import { FinancingScenario } from './financing';

export interface DBProperty {
  id: string;
  address_line_1: string;
  address?: string; // For backward compatibility
  address_line_2?: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  square_feet: number;
  bedrooms: number;
  bathrooms: number;
  year_built?: number;
  lot_size?: number;
  property_type?: string;
  notes?: string;
  arv?: number;
  purchase_price?: number;
  status?: string;
  tags?: string[];
  mls_id?: string;
  geo_point?: any;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  mortgage_balance?: number;
  owner_occupied?: boolean;
  vacant?: boolean;
  hoa?: boolean;

  [key: string]: any;
}

export interface Property {
  id: string;

  address: string;
  address_line_1?: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  square_feet: number;
  sqft?: number;
  bedrooms: number;
  bathrooms: number;
  year_built?: number;
  yearBuilt?: number;
  lot_size?: number;
  lotSize?: number;
  property_type?: string;
  propertyType: string;
  notes?: string;
  arv?: number;
  purchase_price?: number;
  status?: string;
  tags?: string[];
  mls_id?: string;
  geo_point?: any;
  lead_id?: string;
  profile_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  properties?: Property[];
  leadIds?: string[];
  owner_occupied?: boolean;
  vacant?: boolean;
  mortgage_balance?: number;
  hoa?: boolean;

  // Financial fields (computed/aggregated)
  repair_cost?: number;
  total_repair_cost?: number;
  monthly_rent?: number;
  estimated_rent?: number;

  // For component compatibility
  documents?: Document[];
  financingScenarios?: FinancingScenario[];
  images?: PropertyImage[];
  repairs?: RepairEstimate[];
  analyses?: PropertyAnalysis[];
  comps?: PropertyComp[];
}

export interface DBPropertyInsert {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  square_feet?: number;
  bedrooms?: number;
  bathrooms?: number;
  year_built?: number;
  lot_size?: number;
  property_type?: string;
  notes?: string;
  arv?: number;
  purchase_price?: number;
  status?: string;
  created_at: string;
  updated_at: string;
  geo_point?: any;
  profile_id?: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  filename?: string;
  label?: string;
  is_primary?: boolean;
  created_at?: string;
}

export interface EnhancedPropertyInfo {
  [key: string]: any;
  schoolDistrict?: string;
  floodZone?: string;
  hoaInfo?: {
    fee?: number;
    frequency?: string;
    name?: string;
  };
  taxInfo?: {
    annualAmount?: number;
    assessedValue?: number;
  };
  zoningInfo?: string;
  utilities?: {
    water?: string;
    sewer?: string;
    electric?: string;
    gas?: string;
  };
}

// Helper functions for property conversion
export const dbToFeatureProperty = (dbProperty: DBProperty): Property => {
  // Determine address from either field for maximum compatibility
  const address = dbProperty.address_line_1 || (dbProperty as any).address || '';

  // Create base property with required fields
  const result: any = {
    id: dbProperty.id,
    address: address,
    address_line_1: address,
    propertyType: dbProperty.property_type || 'other',
  };

  // Add optional fields only if they exist in the DB result
  if (dbProperty.address_line_2 !== undefined) result.address_line_2 = dbProperty.address_line_2;
  if (dbProperty.city !== undefined) result.city = dbProperty.city;
  if (dbProperty.state !== undefined) result.state = dbProperty.state;
  if (dbProperty.zip !== undefined) result.zip = dbProperty.zip;
  if (dbProperty.county !== undefined) result.county = dbProperty.county;

  // Handle numeric fields with defaults
  result.square_feet = dbProperty.square_feet !== undefined ? dbProperty.square_feet : 0;
  result.sqft = dbProperty.square_feet !== undefined ? dbProperty.square_feet : 0;
  result.bedrooms = dbProperty.bedrooms !== undefined ? dbProperty.bedrooms : 0;
  result.bathrooms = dbProperty.bathrooms !== undefined ? dbProperty.bathrooms : 0;

  // Other numeric fields without defaults
  if (dbProperty.year_built !== undefined) {
    result.year_built = dbProperty.year_built;
    result.yearBuilt = dbProperty.year_built;
  }

  if (dbProperty.lot_size !== undefined) {
    result.lot_size = dbProperty.lot_size;
    result.lotSize = dbProperty.lot_size;
  }

  // Property type fields
  if (dbProperty.property_type !== undefined) {
    result.property_type = dbProperty.property_type;
  }

  // Add remaining fields only if they exist
  if (dbProperty.notes !== undefined) result.notes = dbProperty.notes;
  if (dbProperty.arv !== undefined) result.arv = dbProperty.arv;
  if (dbProperty.purchase_price !== undefined) result.purchase_price = dbProperty.purchase_price;
  if (dbProperty.status !== undefined) result.status = dbProperty.status;
  if (dbProperty.tags !== undefined) result.tags = dbProperty.tags;
  if (dbProperty.mls_id !== undefined) result.mls_id = dbProperty.mls_id;
  if (dbProperty.geo_point !== undefined) result.geo_point = dbProperty.geo_point;

  // Add dates
  if (dbProperty.created_at !== undefined) result.created_at = dbProperty.created_at;
  if (dbProperty.updated_at !== undefined) result.updated_at = dbProperty.updated_at;
  if (dbProperty.created_by !== undefined) result.created_by = dbProperty.created_by;

  // Other fields
  if (dbProperty.mortgage_balance !== undefined) result.mortgage_balance = dbProperty.mortgage_balance;
  if (dbProperty.owner_occupied !== undefined) result.owner_occupied = dbProperty.owner_occupied;
  if (dbProperty.vacant !== undefined) result.vacant = dbProperty.vacant;
  if (dbProperty.hoa !== undefined) result.hoa = dbProperty.hoa;

  return result;
};

export const featureToDbProperty = (property: Property): DBProperty => {
  // Get the address from the appropriate property field
  const addressValue = property.address || property.address_line_1 || '';

  // Start with only the ID
  const result: any = {
    id: property.id
  };

  // Only add fields that are present in the input property
  if (addressValue) result.address_line_1 = addressValue;

  // Explicitly handle address_line_2, only include if present
  if (property.address_line_2 !== undefined) {
    result.address_line_2 = property.address_line_2;
  }

  // Include only non-undefined fields
  if (property.city !== undefined) result.city = property.city;
  if (property.state !== undefined) result.state = property.state;
  if (property.zip !== undefined) result.zip = property.zip;
  if (property.county !== undefined) result.county = property.county;

  // Handle numeric values
  if (property.square_feet !== undefined) result.square_feet = property.square_feet;
  else if (property.sqft !== undefined) result.square_feet = property.sqft;

  if (property.bedrooms !== undefined) result.bedrooms = property.bedrooms;
  if (property.bathrooms !== undefined) result.bathrooms = property.bathrooms;
  if (property.year_built !== undefined) result.year_built = property.year_built;
  else if (property.yearBuilt !== undefined) result.year_built = property.yearBuilt;

  if (property.lot_size !== undefined) result.lot_size = property.lot_size;
  else if (property.lotSize !== undefined) result.lot_size = property.lotSize;

  // Handle property type
  if (property.propertyType !== undefined) result.property_type = property.propertyType;
  else if (property.property_type !== undefined) result.property_type = property.property_type;

  // Add remaining fields only if they exist
  if (property.notes !== undefined) result.notes = property.notes;
  if (property.arv !== undefined) result.arv = property.arv;
  if (property.purchase_price !== undefined) result.purchase_price = property.purchase_price;
  if (property.status !== undefined) result.status = property.status;
  if (property.tags !== undefined) result.tags = property.tags;
  if (property.mls_id !== undefined) result.mls_id = property.mls_id;

  // Set geo_point to null to avoid geometry parse errors
  result.geo_point = null;

  // Timestamps
  if (property.created_at !== undefined) result.created_at = property.created_at;
  if (property.updated_at !== undefined) result.updated_at = property.updated_at;
  if (property.created_by !== undefined) result.created_by = property.created_by;

  // Other fields
  if (property.mortgage_balance !== undefined) result.mortgage_balance = property.mortgage_balance;
  if (property.owner_occupied !== undefined) result.owner_occupied = property.owner_occupied;
  if (property.vacant !== undefined) result.vacant = property.vacant;
  if (property.hoa !== undefined) result.hoa = property.hoa;

  return result;
};
