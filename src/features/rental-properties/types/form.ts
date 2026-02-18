// src/features/rental-properties/types/form.ts
// Form types for rental property creation/editing

import type { PropertyType, RentalType, RateType, PropertyStatus } from './index';

/**
 * Form data shape for AddRentalPropertyScreen
 */
export interface RentalPropertyFormData {
  // Basic Info
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;

  // Property Details
  property_type: PropertyType;
  bedrooms: number | string;
  bathrooms: number | string;
  square_feet: number | string;

  // Rental Settings
  rental_type: RentalType;
  base_rate: number | string;
  rate_type: RateType;
  cleaning_fee: number | string;
  security_deposit: number | string;

  // Amenities
  amenities: string[];

  // Status
  status: PropertyStatus;
}

/**
 * Default values for a new rental property form
 */
export const defaultRentalPropertyFormValues: RentalPropertyFormData = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  property_type: 'single_family',
  bedrooms: '',
  bathrooms: '',
  square_feet: '',
  rental_type: 'ltr',
  base_rate: '',
  rate_type: 'monthly',
  cleaning_fee: '',
  security_deposit: '',
  amenities: [],
  status: 'active',
};

/**
 * Common amenities for selection
 */
export const COMMON_AMENITIES = [
  'WiFi',
  'Parking',
  'Washer/Dryer',
  'Air Conditioning',
  'Heating',
  'Pool',
  'Gym',
  'Pet Friendly',
  'Furnished',
  'Kitchen',
  'TV',
  'Dishwasher',
  'Hot Tub',
  'Fireplace',
  'Balcony',
  'Patio',
  'BBQ Grill',
  'Security System',
  'Garage',
  'Storage',
];
