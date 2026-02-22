// src/hooks/useFormValidation.ts
// Enhanced form hook with real-time validation, debouncing, and scroll-to-error support

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ValidationSchema,
  ValidationErrors,
  validateField,
  validateForm,
  isFormValid,
  getFirstErrorField,
} from '@/lib/validation';
import { useDebounce } from './useDebounce';

/**
 * Validation mode - when to trigger validation
 */
export type ValidationMode = 'onSubmit' | 'onChange' | 'onBlur';

/**
 * Field state - tracks individual field metadata
 */
export interface FieldState {
  /** Field has been focused at least once */
  touched: boolean;
  /** Field value has changed from initial */
  dirty: boolean;
}

/**
 * Options for useFormValidation hook
 */
export interface UseFormValidationOptions<T extends object> {
  /** Initial form values */
  initialValues: T;
  /** Validation schema */
  schema: ValidationSchema<T>;
  /** When to run validation (default: onChange) */
  validationMode?: ValidationMode;
  /** Debounce delay for onChange validation in ms (default: 300) */
  debounceMs?: number;
  /** Submit handler */
  onSubmit: (values: T) => Promise<void> | void;
  /** Called on successful submission */
  onSuccess?: () => void;
  /** Called on validation or submission error */
  onError?: (error: Error | ValidationErrors<T>) => void;
  /** Field order for scroll-to-error (top to bottom) */
  fieldOrder?: Array<keyof T>;
  /** Callback when scroll-to-error is triggered */
  onScrollToError?: (fieldName: keyof T) => void;
}

/**
 * Return type for useFormValidation hook
 */
export interface UseFormValidationReturn<T extends object> {
  /** Current form values */
  values: T;
  /** Current validation errors */
  errors: ValidationErrors<T>;
  /** Field states (touched, dirty) */
  fieldStates: Record<keyof T, FieldState>;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Whether any field has been modified */
  isDirty: boolean;
  /** Whether form is valid (no errors) */
  isValid: boolean;
  /** Update a single field value */
  updateField: (field: keyof T, value: unknown) => void;
  /** Update multiple fields at once */
  setValues: (values: Partial<T>) => void;
  /** Set field as touched (e.g., on blur) */
  setFieldTouched: (field: keyof T) => void;
  /** Set multiple fields as touched */
  setFieldsTouched: (fields: Array<keyof T>) => void;
  /** Set errors manually */
  setErrors: (errors: ValidationErrors<T>) => void;
  /** Clear a specific field error */
  clearError: (field: keyof T) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Validate entire form, returns true if valid */
  validate: () => boolean;
  /** Validate a single field */
  validateSingleField: (field: keyof T) => string | undefined;
  /** Handle form submission */
  handleSubmit: () => Promise<void>;
  /** Reset form to initial values */
  reset: () => void;
  /** Get error for field (only if touched or submitted) */
  getFieldError: (field: keyof T) => string | undefined;
  /** Get first field with error (for scroll-to-error) */
  getFirstErrorField: () => keyof T | undefined;
  /** Mark form as submitted (shows all errors) */
  markSubmitted: () => void;
  /** Whether form has been submitted at least once */
  hasSubmitted: boolean;
}

/**
 * Enhanced form validation hook with real-time validation and scroll-to-error support
 *
 * @example
 * ```tsx
 * const form = useFormValidation({
 *   initialValues: { email: '', name: '' },
 *   schema: {
 *     email: validators.combine(validators.required(), validators.email()),
 *     name: validators.required('Name is required'),
 *   },
 *   validationMode: 'onChange',
 *   onSubmit: async (values) => {
 *     await api.submit(values);
 *   },
 * });
 *
 * return (
 *   <FormField
 *     value={form.values.email}
 *     onChangeText={(text) => form.updateField('email', text)}
 *     onBlur={() => form.setFieldTouched('email')}
 *     error={form.getFieldError('email')}
 *   />
 * );
 * ```
 */
export function useFormValidation<T extends object>({
  initialValues,
  schema,
  validationMode = 'onChange',
  debounceMs = 300,
  onSubmit,
  onSuccess,
  onError,
  fieldOrder,
  onScrollToError,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  // Form state
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Track field states
  const [fieldStates, setFieldStates] = useState<Record<keyof T, FieldState>>(() => {
    const states: Record<keyof T, FieldState> = {} as Record<keyof T, FieldState>;
    for (const key of Object.keys(initialValues) as Array<keyof T>) {
      states[key] = { touched: false, dirty: false };
    }
    return states;
  });

  // Debounced values for onChange validation
  const debouncedValues = useDebounce(values, debounceMs);

  // Ref to track if we should validate on debounce change
  const shouldValidateRef = useRef(false);

  // Run debounced validation when validationMode is onChange
  useEffect(() => {
    if (validationMode === 'onChange' && shouldValidateRef.current) {
      const newErrors = validateForm(debouncedValues, schema);
      setErrors(newErrors);
    }
  }, [debouncedValues, schema, validationMode]);

  // Computed values
  const isDirty = useMemo(
    () => Object.values(fieldStates).some((state) => (state as FieldState).dirty),
    [fieldStates]
  );

  const isValid = useMemo(() => isFormValid(errors), [errors]);

  /**
   * Update a single field value
   */
  const updateField = useCallback(
    (field: keyof T, value: unknown) => {
      setValuesState((prev) => ({ ...prev, [field]: value }));

      // Mark field as dirty
      setFieldStates((prev) => ({
        ...prev,
        [field]: { ...prev[field], dirty: true },
      }));

      // Enable debounced validation
      shouldValidateRef.current = true;

      // Clear error for this field immediately when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  /**
   * Update multiple fields at once
   */
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));

    // Mark fields as dirty
    setFieldStates((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(newValues) as Array<keyof T>) {
        updated[key] = { ...updated[key], dirty: true };
      }
      return updated;
    });

    shouldValidateRef.current = true;
  }, []);

  /**
   * Set a field as touched (e.g., on blur)
   */
  const setFieldTouched = useCallback(
    (field: keyof T) => {
      setFieldStates((prev) => ({
        ...prev,
        [field]: { ...prev[field], touched: true },
      }));

      // Validate on blur if mode is onBlur
      if (validationMode === 'onBlur') {
        const error = validateField(field, values[field], schema[field] || {}, values);
        if (error) {
          setErrors((prev) => ({ ...prev, [field]: error }));
        }
      }
    },
    [validationMode, values, schema]
  );

  /**
   * Set multiple fields as touched
   */
  const setFieldsTouched = useCallback((fields: Array<keyof T>) => {
    setFieldStates((prev) => {
      const updated = { ...prev };
      for (const field of fields) {
        updated[field] = { ...updated[field], touched: true };
      }
      return updated;
    });
  }, []);

  /**
   * Set errors manually
   */
  const setErrorsCallback = useCallback((newErrors: ValidationErrors<T>) => {
    setErrors(newErrors);
  }, []);

  /**
   * Clear a specific field error
   */
  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Validate entire form
   */
  const validate = useCallback((): boolean => {
    const newErrors = validateForm(values, schema);
    setErrors(newErrors);
    return isFormValid(newErrors);
  }, [values, schema]);

  /**
   * Validate a single field
   */
  const validateSingleField = useCallback(
    (field: keyof T): string | undefined => {
      const error = validateField(field, values[field], schema[field] || {}, values);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
      return error;
    },
    [values, schema]
  );

  /**
   * Get error for field (only if touched or form has been submitted)
   */
  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      if (hasSubmitted || fieldStates[field]?.touched) {
        return errors[field];
      }
      return undefined;
    },
    [errors, fieldStates, hasSubmitted]
  );

  /**
   * Get first field with error
   */
  const getFirstErrorFieldCallback = useCallback(
    (): keyof T | undefined => {
      return getFirstErrorField(errors, fieldOrder);
    },
    [errors, fieldOrder]
  );

  /**
   * Mark form as submitted
   */
  const markSubmitted = useCallback(() => {
    setHasSubmitted(true);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    setHasSubmitted(true);

    // Validate all fields
    const newErrors = validateForm(values, schema);
    setErrors(newErrors);

    if (!isFormValid(newErrors)) {
      // Trigger scroll-to-error
      const firstError = getFirstErrorField(newErrors, fieldOrder);
      if (firstError && onScrollToError) {
        onScrollToError(firstError);
      }
      onError?.(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      onError?.(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, schema, fieldOrder, onScrollToError, onSubmit, onSuccess, onError]);

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setIsSubmitting(false);
    setHasSubmitted(false);
    shouldValidateRef.current = false;

    // Reset field states
    const states: Record<keyof T, FieldState> = {} as Record<keyof T, FieldState>;
    for (const key of Object.keys(initialValues) as Array<keyof T>) {
      states[key] = { touched: false, dirty: false };
    }
    setFieldStates(states);
  }, [initialValues]);

  return {
    values,
    errors,
    fieldStates,
    isSubmitting,
    isDirty,
    isValid,
    updateField,
    setValues,
    setFieldTouched,
    setFieldsTouched,
    setErrors: setErrorsCallback,
    clearError,
    clearErrors,
    validate,
    validateSingleField,
    handleSubmit,
    reset,
    getFieldError,
    getFirstErrorField: getFirstErrorFieldCallback,
    markSubmitted,
    hasSubmitted,
  };
}

export default useFormValidation;
