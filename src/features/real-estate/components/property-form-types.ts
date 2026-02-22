/**
 * Type definitions and constants for PropertyForm
 */

import { Property } from '../types';

export interface PropertyFormProps {
  initialData?: Partial<Property>;
  onSubmit: (data: Partial<Property>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export interface FormData {
  address: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  lot_size: string;
  year_built: string;
  arv: string;
  purchase_price: string;
  notes: string;
  images: string[];
}

export const initialFormData: FormData = {
  address: '',
  address_line_2: '',
  city: '',
  state: '',
  zip: '',
  county: '',
  propertyType: 'single_family',
  bedrooms: '',
  bathrooms: '',
  square_feet: '',
  lot_size: '',
  year_built: '',
  arv: '',
  purchase_price: '',
  notes: '',
  images: [],
};
