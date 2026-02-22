// src/features/portfolio/hooks/useAddToPortfolioForm.ts
// Form state management for adding properties to portfolio

import { useState, useCallback, useEffect } from 'react';
import type { AddToPortfolioFormState, AddToPortfolioInput } from '../types';
import type { AvailableProperty } from './useAvailableProperties';

const initialFormState: AddToPortfolioFormState = {
  mode: 'existing',
  property_id: '',
  acquisition_date: new Date().toISOString().split('T')[0],
  acquisition_price: '',
  monthly_rent: '',
  monthly_expenses: '',
  notes: '',
  // New property fields
  address: '',
  city: '',
  state: '',
  zip: '',
  property_type: 'single_family',
  bedrooms: '',
  bathrooms: '',
  square_feet: '',
  year_built: '',
};

export function useAddToPortfolioForm(selectedProperty?: AvailableProperty | null) {
  const [formData, setFormData] = useState<AddToPortfolioFormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when a property is selected
  useEffect(() => {
    if (selectedProperty) {
      setFormData(prev => ({
        ...prev,
        property_id: selectedProperty.id,
        acquisition_price: selectedProperty.purchase_price?.toString() || prev.acquisition_price,
      }));
    }
  }, [selectedProperty]);

  const updateField = useCallback(<K extends keyof AddToPortfolioFormState>(
    field: K,
    value: AddToPortfolioFormState[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!formData.acquisition_date) {
      newErrors.acquisition_date = 'Acquisition date is required';
    }

    const acquisitionPrice = parseFloat(formData.acquisition_price);
    if (!formData.acquisition_price || isNaN(acquisitionPrice) || acquisitionPrice <= 0) {
      newErrors.acquisition_price = 'Valid acquisition price is required';
    }

    if (formData.mode === 'existing') {
      // Validate existing property selection
      if (!formData.property_id) {
        newErrors.property_id = 'Please select a property';
      }
    } else {
      // Validate new property fields
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!formData.state.trim()) {
        newErrors.state = 'State is required';
      }
      if (!formData.zip.trim()) {
        newErrors.zip = 'ZIP code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const getSubmitData = useCallback((): AddToPortfolioInput => {
    const base: AddToPortfolioInput = {
      acquisition_date: formData.acquisition_date,
      acquisition_price: parseFloat(formData.acquisition_price) || 0,
      monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : undefined,
      monthly_expenses: formData.monthly_expenses ? parseFloat(formData.monthly_expenses) : undefined,
      notes: formData.notes.trim() || undefined,
    };

    if (formData.mode === 'existing') {
      return {
        ...base,
        property_id: formData.property_id,
      };
    } else {
      return {
        ...base,
        newProperty: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip: formData.zip.trim(),
          property_type: formData.property_type || 'single_family',
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
          square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
          year_built: formData.year_built ? parseInt(formData.year_built) : undefined,
          purchase_price: parseFloat(formData.acquisition_price) || undefined,
        },
      };
    }
  }, [formData]);

  const reset = useCallback(() => {
    setFormData(initialFormState);
    setErrors({});
  }, []);

  const setMode = useCallback((mode: 'existing' | 'new') => {
    setFormData(prev => ({
      ...prev,
      mode,
      // Clear the opposite mode's data
      property_id: mode === 'new' ? '' : prev.property_id,
      address: mode === 'existing' ? '' : prev.address,
      city: mode === 'existing' ? '' : prev.city,
      state: mode === 'existing' ? '' : prev.state,
      zip: mode === 'existing' ? '' : prev.zip,
    }));
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    updateField,
    validate,
    getSubmitData,
    reset,
    setMode,
  };
}
