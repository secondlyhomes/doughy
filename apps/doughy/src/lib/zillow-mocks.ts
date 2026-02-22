// src/lib/zillow-mocks.ts
// Mock data for Zillow API development testing

import type { ZillowPropertyData, ComparableProperty } from './zillow-types';

export const MOCK_PROPERTY_DATA: ZillowPropertyData = {
  zpid: 'mock-123',
  address: '123 Mock Street',
  city: 'Austin',
  state: 'TX',
  zipcode: '78701',
  price: 450000,
  zestimate: 445000,
  rentZestimate: 2800,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  lotSize: 6500,
  yearBuilt: 1995,
  propertyType: 'single_family',
  lastSoldPrice: 380000,
  lastSoldDate: '2021-06-15',
};

export const MOCK_COMPS: ComparableProperty[] = [
  {
    address: '456 Oak Avenue',
    price: 435000,
    soldDate: '2024-01-10',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1750,
    pricePerSqft: 249,
    distance: 0.3,
    similarity: 0.92,
  },
  {
    address: '789 Pine Street',
    price: 465000,
    soldDate: '2024-02-05',
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1900,
    pricePerSqft: 245,
    distance: 0.5,
    similarity: 0.88,
  },
  {
    address: '321 Elm Court',
    price: 425000,
    soldDate: '2023-12-18',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1650,
    pricePerSqft: 258,
    distance: 0.7,
    similarity: 0.85,
  },
];

/**
 * Generate mock search results
 */
export function generateMockSearchResults(limit: number): ZillowPropertyData[] {
  return Array(Math.min(limit, 5))
    .fill(null)
    .map((_, i) => ({
      ...MOCK_PROPERTY_DATA,
      zpid: `mock-${i}`,
      address: `${100 + i * 100} Mock Street`,
      price: 300000 + i * 50000,
      zestimate: 295000 + i * 50000,
    }));
}

/**
 * Generate mock property value based on address hash
 */
export function generateMockPropertyValue(address: string): number {
  const hash = address.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return 200000 + (hash % 500) * 1000;
}
