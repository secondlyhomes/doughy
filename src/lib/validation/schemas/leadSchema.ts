// src/lib/validation/schemas/leadSchema.ts
// Validation schema for lead forms
// NOTE: Inlines validators to avoid circular dependency with ../index.ts

import type { ValidationSchema } from '../index';
import type { LeadFormData } from '@/features/leads/types';

// Inline regex constants to avoid circular import
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-()]+$/;

/**
 * Validation schema for the AddLeadScreen form
 */
export const leadFormSchema: ValidationSchema<LeadFormData> = {
  name: {
    required: 'Name is required',
    minLength: { value: 2, message: 'Name must be at least 2 characters' },
  },
  email: {
    pattern: {
      regex: EMAIL_REGEX,
      message: 'Please enter a valid email address',
    },
  },
  phone: {
    pattern: {
      regex: PHONE_REGEX,
      message: 'Please enter a valid phone number',
    },
  },
  company: {
    maxLength: { value: 100, message: 'Company name is too long' },
  },
  notes: {
    maxLength: { value: 2000, message: 'Notes cannot exceed 2000 characters' },
  },
};

/**
 * Field order for scroll-to-error (top to bottom in form)
 */
export const leadFormFieldOrder: Array<keyof LeadFormData> = [
  'name',
  'email',
  'phone',
  'company',
  'status',
  'tags',
  'notes',
];
