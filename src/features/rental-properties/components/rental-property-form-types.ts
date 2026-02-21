// src/features/rental-properties/components/rental-property-form-types.ts
// Types for the RentalPropertyForm and its section components

import type { UseFormValidationReturn } from '@/hooks/useFormValidation';
import type { UseFieldRefReturn } from '@/hooks/useFieldRef';
import type { ThemeColors } from '@/contexts/ThemeContext';
import type { RentalPropertyFormData } from '../types/form';

/** Field name union derived from form data keys */
export type FieldName = keyof RentalPropertyFormData;

/** Props for the top-level RentalPropertyForm */
export interface RentalPropertyFormProps {
  initialValues?: Partial<RentalPropertyFormData>;
  onSubmit: (data: RentalPropertyFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

/** Shared props passed to each form section component */
export interface FormSectionProps {
  form: UseFormValidationReturn<RentalPropertyFormData>;
  fieldRefs: UseFieldRefReturn<FieldName>;
  colors: ThemeColors;
}
