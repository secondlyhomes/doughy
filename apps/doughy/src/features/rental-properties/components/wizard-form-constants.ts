// src/features/rental-properties/components/wizard-form-constants.ts
// Constants used by the RentalPropertyFormWizard and its step components

import type { PropertyType, RentalType, RateType, PropertyStatus } from '../types';

// Property type options
export const PROPERTY_TYPE_OPTIONS: { label: string; value: PropertyType }[] = [
  { label: 'Single Family', value: 'single_family' },
  { label: 'Multi-Family', value: 'multi_family' },
  { label: 'Condo', value: 'condo' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Room', value: 'room' },
];

// Rental type options
export const RENTAL_TYPE_OPTIONS: { label: string; value: RentalType }[] = [
  { label: 'Short-Term (STR)', value: 'str' },
  { label: 'Mid-Term (MTR)', value: 'mtr' },
  { label: 'Long-Term (LTR)', value: 'ltr' },
];

// Rate type options
export const RATE_TYPE_OPTIONS: { label: string; value: RateType }[] = [
  { label: 'Nightly', value: 'nightly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

// Status options
export const STATUS_OPTIONS: { label: string; value: PropertyStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
];

// Wizard steps definition
export const WIZARD_STEPS = [
  { id: 'location', title: 'Location', shortTitle: 'Location' },
  { id: 'details', title: 'Property Details', shortTitle: 'Details' },
  { id: 'rental', title: 'Rental Settings', shortTitle: 'Rental' },
  { id: 'amenities', title: 'Amenities & Status', shortTitle: 'Finish' },
];
