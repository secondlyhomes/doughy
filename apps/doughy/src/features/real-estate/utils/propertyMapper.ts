// src/features/real-estate/utils/propertyMapper.ts
// Utility functions for mapping database records to property info

import { IPropertyBasicInfo } from '../types';

export function mapDbToBasicInfo(propertyData: Record<string, unknown>): IPropertyBasicInfo {
  return {
    id: propertyData.id as string,
    address: propertyData.address_line_1 as string,
    address_line_1: propertyData.address_line_1 as string | null,
    address_line_2: propertyData.address_line_2 as string | null,
    city: propertyData.city as string,
    state: propertyData.state as string,
    zip: propertyData.zip as string,
    county: (propertyData.county as string) ?? null,
    bedrooms: propertyData.bedrooms as number | null,
    bathrooms: propertyData.bathrooms as number | null,
    square_feet: propertyData.square_feet as number | null,
    sqft: propertyData.square_feet as number | null,
    lot_size: propertyData.lot_size as number | null,
    year_built: propertyData.year_built as number | null,
    propertyType: (propertyData.property_type as string) || 'other',
    property_type: propertyData.property_type as string | null,
    owner_occupied: (propertyData.owner_occupied as boolean) ?? null,
    notes: propertyData.notes as string | null,
    geo_point: propertyData.geo_point,
    arv: propertyData.arv as number | null,
    purchase_price: propertyData.purchase_price as number | null,
    created_at: propertyData.created_at as string | null,
    updated_at: propertyData.updated_at as string | null
  };
}

export function mapBasicInfoToDbUpdate(data: Partial<IPropertyBasicInfo>): Record<string, unknown> {
  const dbData: Record<string, unknown> = {};

  if (data.address_line_1 !== undefined || data.address !== undefined) {
    dbData.address_line_1 = data.address || data.address_line_1;
  }
  if (data.address_line_2 !== undefined) dbData.address_line_2 = data.address_line_2;
  if (data.city !== undefined) dbData.city = data.city;
  if (data.state !== undefined) dbData.state = data.state;
  if (data.zip !== undefined) dbData.zip = data.zip;
  if (data.county !== undefined) dbData.county = data.county;
  if (data.bedrooms !== undefined) dbData.bedrooms = data.bedrooms;
  if (data.bathrooms !== undefined) dbData.bathrooms = data.bathrooms;
  if (data.square_feet !== undefined) dbData.square_feet = data.square_feet;
  if (data.lot_size !== undefined) dbData.lot_size = data.lot_size;
  if (data.year_built !== undefined) dbData.year_built = data.year_built;
  if (data.propertyType !== undefined || data.property_type !== undefined) {
    dbData.property_type = data.propertyType || data.property_type;
  }
  if (data.owner_occupied !== undefined) dbData.owner_occupied = data.owner_occupied;
  if (data.notes !== undefined) dbData.notes = data.notes;
  if (data.geo_point !== undefined) dbData.geo_point = data.geo_point;
  if (data.arv !== undefined) dbData.arv = data.arv;
  if (data.purchase_price !== undefined) dbData.purchase_price = data.purchase_price;

  return dbData;
}
