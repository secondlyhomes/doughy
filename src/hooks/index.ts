// src/hooks/index.ts
// Export all custom hooks

export { useDebounce } from './useDebounce';
export { useRefresh } from './useRefresh';
export { useKeyboard, useDismissKeyboard } from './useKeyboard';
export { useTabBarPadding } from './useTabBarPadding';
export { useKeyboardAvoidance, getKeyboardAvoidanceProps } from './useKeyboardAvoidance';
export type { KeyboardAvoidanceConfig, KeyboardAvoidanceProps } from './useKeyboardAvoidance';

// Form validation hooks
export { useFormValidation } from './useFormValidation';
export type {
  ValidationMode,
  FieldState,
  UseFormValidationOptions,
  UseFormValidationReturn,
} from './useFormValidation';

export { useFieldRef } from './useFieldRef';
export type { UseFieldRefOptions, UseFieldRefReturn } from './useFieldRef';
