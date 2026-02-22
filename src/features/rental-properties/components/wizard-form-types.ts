// src/features/rental-properties/components/wizard-form-types.ts
// Shared types for wizard step components

import type { UseFormValidationReturn } from '@/hooks/useFormValidation';
import type { UseFieldRefReturn } from '@/hooks/useFieldRef';
import type { ThemeColors } from '@/contexts/ThemeContext';
import type { RentalPropertyFormData } from '../types/form';

export type FieldName = keyof RentalPropertyFormData;

export interface WizardStepProps {
  form: UseFormValidationReturn<RentalPropertyFormData>;
  fieldRefs: UseFieldRefReturn<FieldName>;
  colors: ThemeColors;
}
