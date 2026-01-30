// src/features/admin/components/api-key-form/types.ts
// Types for API key form components

import type { IntegrationStatus, IntegrationFieldType, IntegrationHealth } from '../../types/integrations';

export interface ApiKeyFormItemProps {
  service: string;
  label: string;
  type?: IntegrationFieldType;
  required?: boolean;
  options?: string[];
  /**
   * Called after save/delete with optional health check result.
   * Pass the result to update parent state directly.
   */
  onSaved?: (healthResult?: IntegrationHealth) => void;
  healthStatus?: IntegrationStatus;
  placeholder?: string;
  description?: string;
  /**
   * When true, defers loading the API key until user interacts with the field.
   * This improves performance when many fields mount at once inside an accordion.
   * @default true
   */
  deferLoad?: boolean;
  /**
   * ISO date string when the key was last updated (for age indicator)
   */
  updatedAt?: string | null;
  /**
   * ISO date string when the key was created (for age indicator)
   */
  createdAt?: string | null;
  /**
   * Whether to show the key age indicator
   * @default false
   */
  showAgeIndicator?: boolean;
}

export interface ApiKeyFormState {
  inputValue: string;
  showValue: boolean;
  isEditing: boolean;
  isReplacing: boolean;
  deleteLoading: boolean;
  isSaveLoading: boolean;
  hasWarning: boolean;
  isTesting: boolean;
  testResult: IntegrationHealth | null;
}

export interface ApiKeyFormActions {
  setInputValue: (value: string) => void;
  setShowValue: (value: boolean) => void;
  setIsEditing: (value: boolean) => void;
  setIsReplacing: (value: boolean) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => void;
  handleTest: () => Promise<void>;
  handleReplace: () => Promise<void>;
  handleCancelReplace: () => void;
}

export interface UseApiKeyFormHandlersOptions {
  service: string;
  label: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  setShowValue: (value: boolean) => void;
  setIsEditing: (value: boolean) => void;
  setIsReplacing: (value: boolean) => void;
  setIsSaveLoading: (value: boolean) => void;
  setDeleteLoading: (value: boolean) => void;
  setHasWarning: (value: boolean) => void;
  setIsTesting: (value: boolean) => void;
  setTestResult: (value: IntegrationHealth | null) => void;
  setKey: (value: string) => void;
  save: (value: string) => Promise<{ success: boolean; error?: string }>;
  deleteKey: () => Promise<{ success: boolean; error?: string }>;
  onSaved?: (healthResult?: IntegrationHealth) => void;
  ensureKeyLoaded: () => Promise<void>;
  initializedRef: React.MutableRefObject<boolean>;
}

export { IntegrationHealth, IntegrationStatus, IntegrationFieldType };
