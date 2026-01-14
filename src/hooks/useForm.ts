// src/hooks/useForm.ts
// Standardized form state management hook with validation
// Consolidates form logic across AddCompSheet, AddRepairSheet, AddFinancingSheet, etc.

import { useState, useCallback } from 'react';

export interface UseFormOptions<T> {
  /** Initial form values */
  initialValues: T;
  /** Validation function - returns error object */
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  /** Submit handler */
  onSubmit: (values: T) => Promise<void> | void;
  /** Called on successful submission */
  onSuccess?: () => void;
  /** Called on validation or submission error */
  onError?: (error: Error) => void;
}

export interface UseFormReturn<T> {
  /** Current form values */
  values: T;
  /** Current form errors */
  errors: Partial<Record<keyof T, string>>;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether form has been modified */
  isDirty: boolean;
  /** Update a single field value */
  updateField: (field: keyof T, value: any) => void;
  /** Update multiple fields at once */
  setValues: (values: Partial<T>) => void;
  /** Set errors manually */
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  /** Clear a specific field error */
  clearError: (field: keyof T) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Validate the form */
  validate: () => boolean;
  /** Handle form submission */
  handleSubmit: () => Promise<void>;
  /** Reset form to initial values */
  reset: () => void;
}

/**
 * Form state management hook with validation
 *
 * @example
 * const { values, errors, updateField, handleSubmit } = useForm({
 *   initialValues: { name: '', email: '' },
 *   validate: (vals) => {
 *     const errs = {};
 *     if (!vals.name) errs.name = 'Name is required';
 *     if (!vals.email) errs.email = 'Email is required';
 *     return errs;
 *   },
 *   onSubmit: async (vals) => {
 *     await api.submit(vals);
 *   },
 * });
 *
 * return (
 *   <>
 *     <FormField
 *       label="Name"
 *       value={values.name}
 *       onChangeText={(text) => updateField('name', text)}
 *       error={errors.name}
 *     />
 *     <Button onPress={handleSubmit}>Submit</Button>
 *   </>
 * );
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validate: validateFn,
  onSubmit,
  onSuccess,
  onError,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Update a single field value
   */
  const updateField = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for this field when user starts typing
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Update multiple fields at once
   */
  const setValuesCallback = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
    setIsDirty(true);
  }, []);

  /**
   * Set errors manually
   */
  const setErrorsCallback = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
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
   * Validate the form
   * Returns true if valid, false if invalid
   */
  const validate = useCallback((): boolean => {
    if (!validateFn) return true;

    const validationErrors = validateFn(values);
    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  }, [values, validateFn]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    // Validate first
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(values);
      onSuccess?.();
      setIsDirty(false);
    } catch (error) {
      console.error('Form submission error:', error);
      onError?.(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, onSuccess, onError]);

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    updateField,
    setValues: setValuesCallback,
    setErrors: setErrorsCallback,
    clearError,
    clearErrors,
    validate,
    handleSubmit,
    reset,
  };
}

export default useForm;
