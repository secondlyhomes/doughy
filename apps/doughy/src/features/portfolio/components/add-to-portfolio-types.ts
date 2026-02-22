// src/features/portfolio/components/add-to-portfolio-types.ts
// Types for AddToPortfolioSheet and its sub-components

import type { AddToPortfolioFormState } from '../types';

export interface AddToPortfolioSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: import('../types').AddToPortfolioInput) => Promise<void>;
  isLoading?: boolean;
}

export interface PortfolioModeToggleProps {
  mode: AddToPortfolioFormState['mode'];
  onSetMode: (mode: 'existing' | 'new') => void;
}

export interface NewPropertyFieldsProps {
  formData: AddToPortfolioFormState;
  errors: Record<string, string>;
  updateField: <K extends keyof AddToPortfolioFormState>(
    field: K,
    value: AddToPortfolioFormState[K]
  ) => void;
}

export interface AcquisitionDetailsSectionProps {
  formData: AddToPortfolioFormState;
  errors: Record<string, string>;
  updateField: <K extends keyof AddToPortfolioFormState>(
    field: K,
    value: AddToPortfolioFormState[K]
  ) => void;
  onDateChange: (date: Date | undefined) => void;
}
