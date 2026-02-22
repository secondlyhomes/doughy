/**
 * Validation and submission mapping logic for PropertyForm
 */

import { Property } from '../types';
import { FormData } from './property-form-types';

export function validatePropertyForm(vals: FormData): Partial<Record<keyof FormData, string>> {
  const errs: Partial<Record<keyof FormData, string>> = {};

  if (!vals.address.trim()) errs.address = 'Address is required';
  if (!vals.city.trim()) errs.city = 'City is required';
  if (!vals.state.trim()) errs.state = 'State is required';
  if (!vals.zip.trim()) errs.zip = 'ZIP code is required';

  // Validate numeric fields
  if (vals.bedrooms && isNaN(Number(vals.bedrooms))) {
    errs.bedrooms = 'Must be a number';
  }
  if (vals.bathrooms && isNaN(Number(vals.bathrooms))) {
    errs.bathrooms = 'Must be a number';
  }
  if (vals.square_feet && isNaN(Number(vals.square_feet))) {
    errs.square_feet = 'Must be a number';
  }
  if (vals.year_built) {
    const year = Number(vals.year_built);
    if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 5) {
      errs.year_built = 'Invalid year';
    }
  }

  return errs;
}

export function mapFormDataToProperty(vals: FormData): Partial<Property> {
  return {
    address: vals.address.trim(),
    address_line_2: vals.address_line_2.trim() || undefined,
    city: vals.city.trim(),
    state: vals.state.trim(),
    zip: vals.zip.trim(),
    county: vals.county.trim() || undefined,
    propertyType: vals.propertyType,
    bedrooms: vals.bedrooms ? Number(vals.bedrooms) : undefined,
    bathrooms: vals.bathrooms ? Number(vals.bathrooms) : undefined,
    square_feet: vals.square_feet ? Number(vals.square_feet) : undefined,
    lot_size: vals.lot_size ? Number(vals.lot_size) : undefined,
    year_built: vals.year_built ? Number(vals.year_built) : undefined,
    arv: vals.arv ? Number(vals.arv) : undefined,
    purchase_price: vals.purchase_price ? Number(vals.purchase_price) : undefined,
    notes: vals.notes.trim() || undefined,
  };
}
