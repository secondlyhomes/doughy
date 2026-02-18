// src/services/import/propertyNormalizer.ts
// Property data normalization utilities

import type { Property, PropertyFormData } from '@/types';

export function normalizePropertyData(data: Record<string, unknown>): PropertyFormData | null {
  const address = data.address || data.street_address || '';

  if (!address) {
    return null;
  }

  return {
    address: String(address),
    city: data.city ? String(data.city) : undefined,
    state: data.state ? String(data.state) : undefined,
    zip_code: data.zip_code || data.zipCode || data.zip
      ? String(data.zip_code || data.zipCode || data.zip)
      : undefined,
    country: data.country ? String(data.country) : undefined,
    property_type: normalizePropertyType(data.property_type || data.propertyType || data.type),
    status: normalizePropertyStatus(data.status),
    price: data.price ? Number(String(data.price).replace(/[^0-9.-]/g, '')) : undefined,
    bedrooms: data.bedrooms || data.beds ? Number(data.bedrooms || data.beds) : undefined,
    bathrooms: data.bathrooms || data.baths ? Number(data.bathrooms || data.baths) : undefined,
    sqft: data.sqft || data.square_feet || data.squareFeet
      ? Number(data.sqft || data.square_feet || data.squareFeet)
      : undefined,
    lot_size: data.lot_size || data.lotSize ? Number(data.lot_size || data.lotSize) : undefined,
    year_built: data.year_built || data.yearBuilt ? Number(data.year_built || data.yearBuilt) : undefined,
    description: data.description ? String(data.description) : undefined,
  };
}

export function normalizePropertyType(type: unknown): Property['property_type'] {
  const t = String(type).toLowerCase().replace(/[_-]/g, ' ');
  const typeMap: Record<string, Property['property_type']> = {
    'single family': 'single_family',
    'single-family': 'single_family',
    'single_family': 'single_family',
    sfh: 'single_family',
    house: 'single_family',
    'multi family': 'multi_family',
    'multi-family': 'multi_family',
    'multi_family': 'multi_family',
    multifamily: 'multi_family',
    duplex: 'multi_family',
    triplex: 'multi_family',
    fourplex: 'multi_family',
    condo: 'condo',
    condominium: 'condo',
    townhouse: 'townhouse',
    townhome: 'townhouse',
    land: 'land',
    lot: 'land',
    commercial: 'commercial',
    retail: 'commercial',
    office: 'commercial',
    other: 'other',
  };
  return typeMap[t] || 'other';
}

export function normalizePropertyStatus(status: unknown): Property['status'] {
  const s = String(status).toLowerCase();
  const statusMap: Record<string, Property['status']> = {
    active: 'active',
    available: 'active',
    'for sale': 'active',
    pending: 'pending',
    'under contract': 'pending',
    sold: 'sold',
    closed: 'sold',
    off_market: 'off_market',
    'off market': 'off_market',
    inactive: 'off_market',
  };
  return statusMap[s] || 'active';
}
