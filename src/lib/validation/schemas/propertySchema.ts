// src/lib/validation/schemas/propertySchema.ts
// Validation schemas for property form wizard steps
// NOTE: Inlines validators to avoid circular dependency with ../index.ts

import type { ValidationSchema } from '../index';
import type { Step1Data, Step2Data, Step3Data } from '@/features/real-estate/components';

// Inline regex constant to avoid circular import
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

// Current year for year validation
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Step 1: Address validation schema
 */
export const propertyStep1Schema: ValidationSchema<Step1Data> = {
  address: {
    required: 'Street address is required',
    minLength: { value: 5, message: 'Please enter a complete street address' },
  },
  city: {
    required: 'City is required',
  },
  state: {
    required: 'State is required',
  },
  zip: {
    required: 'ZIP code is required',
    pattern: {
      regex: ZIP_REGEX,
      message: 'Please enter a valid ZIP code',
    },
  },
};

/**
 * Step 2: Property details validation schema
 */
export const propertyStep2Schema: ValidationSchema<Step2Data> = {
  bedrooms: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (isNaN(Number(value))) return 'Bedrooms must be a number';
      return undefined;
    },
  },
  bathrooms: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (isNaN(Number(value))) return 'Bathrooms must be a number';
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
  lot_size: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num)) return 'Lot size must be a number';
      if (num <= 0) return 'Lot size must be positive';
      return undefined;
    },
  },
  year_built: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const year = Number(value);
      if (isNaN(year) || year < 1800 || year > CURRENT_YEAR + 5) {
        return `Please enter a valid year (1800-${CURRENT_YEAR + 5})`;
      }
      return undefined;
    },
  },
};

/**
 * Step 3: Financial validation schema
 */
export const propertyStep3Schema: ValidationSchema<Step3Data> = {
  arv: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num)) return 'ARV must be a number';
      if (num <= 0) return 'ARV must be positive';
      return undefined;
    },
  },
  purchase_price: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num)) return 'Purchase price must be a number';
      if (num <= 0) return 'Purchase price must be positive';
      return undefined;
    },
  },
  repair_cost: {
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (isNaN(Number(value))) return 'Repair cost must be a number';
      return undefined;
    },
    min: { value: 0, message: 'Repair cost cannot be negative' },
  },
};

/**
 * Field order for Step 1 scroll-to-error
 */
export const propertyStep1FieldOrder: Array<keyof Step1Data> = [
  'address',
  'address_line_2',
  'city',
  'state',
  'zip',
  'county',
  'propertyType',
];

/**
 * Field order for Step 2 scroll-to-error
 */
export const propertyStep2FieldOrder: Array<keyof Step2Data> = [
  'bedrooms',
  'bathrooms',
  'square_feet',
  'lot_size',
  'year_built',
];

/**
 * Field order for Step 3 scroll-to-error
 */
export const propertyStep3FieldOrder: Array<keyof Step3Data> = [
  'arv',
  'purchase_price',
  'repair_cost',
];
