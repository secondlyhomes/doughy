// src/lib/validation/index.ts
// Lightweight validation system with schema-based rules
// No external dependencies (Zod/Yup) - keeps bundle small

/**
 * Validation rule definition for a single field
 */
export interface ValidationRule<T = unknown> {
  /** Field is required (string message or true for default message) */
  required?: boolean | string;
  /** Pattern validation with regex */
  pattern?: { regex: RegExp; message: string };
  /** Minimum length for strings */
  minLength?: { value: number; message: string };
  /** Maximum length for strings */
  maxLength?: { value: number; message: string };
  /** Minimum value for numbers */
  min?: { value: number; message: string };
  /** Maximum value for numbers */
  max?: { value: number; message: string };
  /** Custom validation function */
  custom?: (value: unknown, allValues: T) => string | undefined;
}

/**
 * Validation schema - maps field names to validation rules
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T>;
};

/**
 * Validation errors - maps field names to error messages
 */
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Validate a single field against its rules
 */
export function validateField<T>(
  fieldName: keyof T,
  value: unknown,
  rules: ValidationRule<T>,
  allValues: T
): string | undefined {
  // Required validation
  if (rules.required) {
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '');
    if (isEmpty) {
      return typeof rules.required === 'string'
        ? rules.required
        : `${String(fieldName)} is required`;
    }
  }

  // Skip other validations if field is empty and not required
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const stringValue = typeof value === 'string' ? value : String(value);
  const numValue = typeof value === 'number' ? value : Number(value);

  // Pattern validation
  if (rules.pattern && typeof value === 'string') {
    if (!rules.pattern.regex.test(value)) {
      return rules.pattern.message;
    }
  }

  // MinLength validation
  if (rules.minLength && stringValue.length < rules.minLength.value) {
    return rules.minLength.message;
  }

  // MaxLength validation
  if (rules.maxLength && stringValue.length > rules.maxLength.value) {
    return rules.maxLength.message;
  }

  // Min value validation
  if (rules.min && !isNaN(numValue) && numValue < rules.min.value) {
    return rules.min.message;
  }

  // Max value validation
  if (rules.max && !isNaN(numValue) && numValue > rules.max.value) {
    return rules.max.message;
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value, allValues);
    if (customError) {
      return customError;
    }
  }

  return undefined;
}

/**
 * Validate all fields in a form against a schema
 */
export function validateForm<T extends object>(
  values: T,
  schema: ValidationSchema<T>
): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {};

  for (const fieldName of Object.keys(schema) as Array<keyof T>) {
    const rules = schema[fieldName];
    if (rules) {
      const error = validateField(fieldName, values[fieldName], rules, values);
      if (error) {
        errors[fieldName] = error;
      }
    }
  }

  return errors;
}

/**
 * Check if errors object is empty (form is valid)
 */
export function isFormValid<T>(errors: ValidationErrors<T>): boolean {
  return Object.keys(errors).length === 0;
}

/**
 * Get first error field name (useful for scroll-to-error)
 */
export function getFirstErrorField<T>(
  errors: ValidationErrors<T>,
  fieldOrder?: Array<keyof T>
): keyof T | undefined {
  if (fieldOrder) {
    return fieldOrder.find((field) => errors[field]);
  }
  return Object.keys(errors)[0] as keyof T | undefined;
}

// ===== Common Validators =====

/** UUID regex pattern (v4 format) */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 * Prevents invalid IDs (like "new", route slugs) from hitting the database
 */
export function isValidUuid(id: string | undefined | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

/** Email regex pattern */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Phone regex pattern (flexible US format) */
export const PHONE_REGEX = /^[\d\s\-()]+$/;

/** ZIP code regex (5 digit or 5+4) */
export const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

/** URL regex pattern */
export const URL_REGEX = /^https?:\/\/.+/;

/**
 * Common validation rules factory
 */
export const validators = {
  /** Email validation rule */
  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    pattern: { regex: EMAIL_REGEX, message },
  }),

  /** Phone validation rule */
  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    pattern: { regex: PHONE_REGEX, message },
  }),

  /** ZIP code validation rule */
  zip: (message = 'Please enter a valid ZIP code'): ValidationRule => ({
    pattern: { regex: ZIP_REGEX, message },
  }),

  /** URL validation rule */
  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    pattern: { regex: URL_REGEX, message },
  }),

  /** Required field validation rule */
  required: (message?: string): ValidationRule => ({
    required: message || true,
  }),

  /** Min length validation rule */
  minLength: (value: number, message?: string): ValidationRule => ({
    minLength: {
      value,
      message: message || `Must be at least ${value} characters`,
    },
  }),

  /** Max length validation rule */
  maxLength: (value: number, message?: string): ValidationRule => ({
    maxLength: {
      value,
      message: message || `Must be no more than ${value} characters`,
    },
  }),

  /** Numeric range validation rule */
  range: (min: number, max: number, message?: string): ValidationRule => ({
    min: { value: min, message: message || `Must be at least ${min}` },
    max: { value: max, message: message || `Must be no more than ${max}` },
  }),

  /** Year validation rule */
  year: (minYear = 1800, maxYear = new Date().getFullYear() + 5): ValidationRule => ({
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const year = Number(value);
      if (isNaN(year) || year < minYear || year > maxYear) {
        return `Please enter a valid year (${minYear}-${maxYear})`;
      }
      return undefined;
    },
  }),

  /** Numeric only validation rule */
  numeric: (message = 'Must be a number'): ValidationRule => ({
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (isNaN(Number(value))) {
        return message;
      }
      return undefined;
    },
  }),

  /** Positive number validation rule */
  positive: (message = 'Must be a positive number'): ValidationRule => ({
    custom: (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return message;
      }
      return undefined;
    },
  }),

  /** Combine multiple validation rules */
  combine: (...rules: ValidationRule[]): ValidationRule => {
    const combined: ValidationRule = {};
    for (const rule of rules) {
      Object.assign(combined, rule);
      // Special handling for custom validators - chain them
      if (rule.custom && combined.custom && rule.custom !== combined.custom) {
        const prevCustom = combined.custom;
        const newCustom = rule.custom;
        combined.custom = (value, allValues) => {
          const prevError = prevCustom(value, allValues);
          if (prevError) return prevError;
          return newCustom(value, allValues);
        };
      }
    }
    return combined;
  },
};

// Re-export schemas
export * from './schemas/leadSchema';
export * from './schemas/propertySchema';
export * from './schemas/rentalPropertySchema';
