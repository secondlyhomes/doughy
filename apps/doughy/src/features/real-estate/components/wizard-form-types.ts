// src/features/real-estate/components/wizard-form-types.ts
// Type definitions for PropertyFormWizard

import { Property } from '../types';

export interface PropertyFormWizardProps {
  initialData?: Partial<Property>;
  onSubmit: (data: Partial<Property>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}
