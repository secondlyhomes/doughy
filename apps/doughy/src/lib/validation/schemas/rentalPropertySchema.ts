// src/lib/validation/schemas/rentalPropertySchema.ts
// Validation schema for rental property forms

import type { ValidationSchema } from '../index';
import type { RentalPropertyFormData } from '@/features/rental-properties/types/form';

// Inline regex constant to avoid circular import
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

/**
 * Validation schema for AddRentalPropertyScreen form
 */
export const rentalPropertyFormSchema: ValidationSchema<RentalPropertyFormData> = {
  name: {
    required: 'Property name is required',
    minLength: { value: 2, message: 'Name must be at least 2 characters' },
  },
  address: {
    required: 'Street address is required',
    minLength: { value: 5, message: 'Please enter a complete street address' },
  },
  city: {
    required: 'City is required',
  },
  state: {
    required: 'State is required',
    minLength: { value: 2, message: 'State must be 2 characters' },
    maxLength: { value: 2, message: 'State must be 2 characters' },
  },
  zip: {
    pattern: {
      regex: ZIP_REGEX,
      message: 'Please enter a valid ZIP code',
    },
  },
  bedrooms: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num)) return 'Bedrooms must be a number';
      if (num < 0) return 'Bedrooms cannot be negative';
      return undefined;
    },
  },
  bathrooms: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num)) return 'Bathrooms must be a number';
      if (num < 0) return 'Bathrooms cannot be negative';
      return undefined;
    },
  },
  square_feet: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num)) return 'Square feet must be a number';
      if (num <= 0) return 'Square feet must be positive';
      return undefined;
    },
  },
  base_rate: {
    required: 'Base rate is required',
    custom: (value) => {
      if (value === undefined || value === null || value === '') return 'Base rate is required';
      const num = Number(value);
      if (isNaN(num)) return 'Base rate must be a number';
      if (num <= 0) return 'Base rate must be positive';
      return undefined;
    },
  },
  cleaning_fee: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num)) return 'Cleaning fee must be a number';
      if (num < 0) return 'Cleaning fee cannot be negative';
      return undefined;
    },
  },
  security_deposit: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num)) return 'Security deposit must be a number';
      if (num < 0) return 'Security deposit cannot be negative';
      return undefined;
    },
  },
};

/**
 * Field order for scroll-to-error (top to bottom in form)
 */
export const rentalPropertyFieldOrder: Array<keyof RentalPropertyFormData> = [
  'name',
  'address',
  'city',
  'state',
  'zip',
  'property_type',
  'bedrooms',
  'bathrooms',
  'square_feet',
  'rental_type',
  'base_rate',
  'rate_type',
  'cleaning_fee',
  'security_deposit',
  'amenities',
  'status',
];
