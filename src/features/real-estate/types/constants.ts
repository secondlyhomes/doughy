// src/features/real-estate/types/constants.ts
// Enums and constants

export enum PropertyStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  SOLD = 'Sold',
  WITHDRAWN = 'Withdrawn',
  EXPIRED = 'Expired',
  OFF_MARKET = 'Off Market'
}

export enum PropertyType {
  SINGLE_FAMILY = 'single_family',
  MULTI_FAMILY = 'multi_family',
  CONDO = 'condo',
  TOWNHOUSE = 'townhouse',
  DUPLEX = 'duplex',
  TRIPLEX = 'triplex',
  FOURPLEX = 'fourplex',
  APARTMENT = 'apartment',
  MOBILE_HOME = 'mobile_home',
  LAND = 'land',
  LOT = 'lot',
  FARM = 'farm',
  RANCH = 'ranch',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  RETAIL = 'retail',
  OFFICE = 'office',
  MIXED_USE = 'mixed_use',
  OTHER = 'other'
}

// Update PropertyConstants to include Types and Status objects for direct access
export const PropertyConstants = {
  STATUS_OPTIONS: [
    { value: PropertyStatus.ACTIVE, label: 'Active' },
    { value: PropertyStatus.PENDING, label: 'Pending' },
    { value: PropertyStatus.SOLD, label: 'Sold' },
    { value: PropertyStatus.WITHDRAWN, label: 'Withdrawn' },
    { value: PropertyStatus.EXPIRED, label: 'Expired' },
    { value: PropertyStatus.OFF_MARKET, label: 'Off Market' }
  ],
  TYPE_OPTIONS: [
    { value: PropertyType.SINGLE_FAMILY, label: 'Single Family' },
    { value: PropertyType.MULTI_FAMILY, label: 'Multi Family' },
    { value: PropertyType.CONDO, label: 'Condo' },
    { value: PropertyType.TOWNHOUSE, label: 'Townhouse' },
    { value: PropertyType.DUPLEX, label: 'Duplex' },
    { value: PropertyType.TRIPLEX, label: 'Triplex' },
    { value: PropertyType.FOURPLEX, label: 'Fourplex' },
    { value: PropertyType.APARTMENT, label: 'Apartment' },
    { value: PropertyType.MOBILE_HOME, label: 'Mobile Home' },
    { value: PropertyType.LAND, label: 'Land' },
    { value: PropertyType.LOT, label: 'Vacant Lot' },
    { value: PropertyType.FARM, label: 'Farm' },
    { value: PropertyType.RANCH, label: 'Ranch' },
    { value: PropertyType.COMMERCIAL, label: 'Commercial' },
    { value: PropertyType.INDUSTRIAL, label: 'Industrial' },
    { value: PropertyType.RETAIL, label: 'Retail' },
    { value: PropertyType.OFFICE, label: 'Office' },
    { value: PropertyType.MIXED_USE, label: 'Mixed Use' },
    { value: PropertyType.OTHER, label: 'Other' }
  ],
  // Add Types and Status objects for direct access in components
  Types: {
    SINGLE_FAMILY: PropertyType.SINGLE_FAMILY,
    MULTI_FAMILY: PropertyType.MULTI_FAMILY,
    CONDO: PropertyType.CONDO,
    TOWNHOUSE: PropertyType.TOWNHOUSE,
    DUPLEX: PropertyType.DUPLEX,
    TRIPLEX: PropertyType.TRIPLEX,
    FOURPLEX: PropertyType.FOURPLEX,
    APARTMENT: PropertyType.APARTMENT,
    MOBILE_HOME: PropertyType.MOBILE_HOME,
    LAND: PropertyType.LAND,
    LOT: PropertyType.LOT,
    FARM: PropertyType.FARM,
    RANCH: PropertyType.RANCH,
    COMMERCIAL: PropertyType.COMMERCIAL,
    INDUSTRIAL: PropertyType.INDUSTRIAL,
    RETAIL: PropertyType.RETAIL,
    OFFICE: PropertyType.OFFICE,
    MIXED_USE: PropertyType.MIXED_USE,
    OTHER: PropertyType.OTHER
  },
  Status: {
    ACTIVE: PropertyStatus.ACTIVE,
    PENDING: PropertyStatus.PENDING,
    SOLD: PropertyStatus.SOLD,
    WITHDRAWN: PropertyStatus.WITHDRAWN,
    EXPIRED: PropertyStatus.EXPIRED,
    OFF_MARKET: PropertyStatus.OFF_MARKET
  }
};
