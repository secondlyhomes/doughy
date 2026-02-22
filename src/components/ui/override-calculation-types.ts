/**
 * Types and helpers for OverrideCalculationSheet
 */

export interface CalculationOverride {
  /** Calculation field name */
  fieldName: string;

  /** Current AI-calculated value */
  aiValue: string;

  /** Unit/suffix (e.g., "$", "%", "sqft") */
  unit?: string;

  /** Input type */
  inputType?: 'currency' | 'percentage' | 'number' | 'text';

  /** Validation function */
  validate?: (value: string) => boolean;

  /** Helper text */
  helperText?: string;
}

export interface OverrideCalculationSheetProps {
  /** Whether sheet is visible */
  isVisible: boolean;

  /** Callback when sheet is closed */
  onClose: () => void;

  /** Callback when override is saved */
  onSave: (newValue: string, reason: string) => void;

  /** Calculation to override */
  calculation: CalculationOverride;

  /** Whether save is in progress */
  isSaving?: boolean;

  /** Custom style */
  style?: import('react-native').ViewStyle;
}

/**
 * Formats input based on type
 */
export function formatInput(value: string, type?: 'currency' | 'percentage' | 'number' | 'text'): string {
  if (!type || type === 'text') return value;

  // Remove non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');

  if (type === 'currency') {
    // Format as currency without symbol (will be added in display)
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  if (type === 'percentage') {
    // Format as percentage without symbol
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  }

  if (type === 'number') {
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  }

  return cleaned;
}

/**
 * Formats a value for display with appropriate unit/prefix
 */
export function getDisplayValue(value: string, calculation: CalculationOverride): string {
  if (!calculation.unit && calculation.inputType !== 'currency' && calculation.inputType !== 'percentage') {
    return value;
  }

  if (calculation.inputType === 'currency') {
    // Parse and format currency value
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return value;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  if (calculation.inputType === 'percentage') {
    return `${value}%`;
  }

  return `${value} ${calculation.unit || ''}`;
}
