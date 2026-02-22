/**
 * Input Formatters
 *
 * Utilities for formatting user input in forms.
 * These formatters ensure consistent data entry and prevent invalid input.
 *
 * @example
 * import { formatCurrency, formatPhone, parseCurrency } from '@/lib/input-formatters';
 *
 * // Format as user types
 * const handleChange = (text: string) => {
 *   setValue(formatCurrency(text));
 * };
 *
 * // Parse for API submission
 * const numericValue = parseCurrency(formattedValue);
 */

/**
 * Format a string as US currency with thousand separators
 * Handles partial input during typing (e.g., "123" → "$123", "1234.5" → "$1,234.5")
 *
 * @param value - Raw input string
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency('1234567.89') // '$1,234,567.89'
 * formatCurrency('1234')       // '$1,234'
 * formatCurrency('1234.5')     // '$1,234.5'
 * formatCurrency('')           // ''
 */
export function formatCurrency(
  value: string,
  options: { allowNegative?: boolean; maxDecimals?: number } = {}
): string {
  const { allowNegative = false, maxDecimals = 2 } = options;

  if (!value || value === '') return '';

  // Remove all non-numeric characters except decimal and minus
  let cleaned = value.replace(/[^0-9.-]/g, '');

  // Handle negative sign
  const isNegative = allowNegative && cleaned.startsWith('-');
  cleaned = cleaned.replace(/-/g, '');

  // Handle multiple decimals - keep only the first
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = cleaned.split('.');

  // Format integer with thousand separators
  const formattedInteger = integerPart
    ? parseInt(integerPart, 10).toLocaleString('en-US')
    : '0';

  // Handle decimal part
  let result = formattedInteger;
  if (decimalPart !== undefined) {
    // Limit decimal places
    const limitedDecimal = decimalPart.slice(0, maxDecimals);
    result += '.' + limitedDecimal;
  }

  // Add currency symbol and negative sign
  return (isNegative ? '-$' : '$') + result;
}

/**
 * Parse a formatted currency string back to a number
 *
 * @param value - Formatted currency string (e.g., "$1,234.56")
 * @returns Numeric value or null if invalid
 *
 * @example
 * parseCurrency('$1,234.56')  // 1234.56
 * parseCurrency('-$500')      // -500
 * parseCurrency('invalid')    // null
 */
export function parseCurrency(value: string): number | null {
  if (!value) return null;

  // Remove currency symbol, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format a string as US phone number: (XXX) XXX-XXXX
 *
 * @param value - Raw input string
 * @returns Formatted phone string
 *
 * @example
 * formatPhone('1234567890')   // '(123) 456-7890'
 * formatPhone('123')          // '(123'
 * formatPhone('1234567')      // '(123) 456-7'
 */
export function formatPhone(value: string): string {
  if (!value) return '';

  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');

  // Limit to 10 digits
  const limited = cleaned.slice(0, 10);

  // Format based on length
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

/**
 * Parse a formatted phone string back to digits only
 *
 * @param value - Formatted phone string
 * @returns Raw digits or null if invalid
 *
 * @example
 * parsePhone('(123) 456-7890')  // '1234567890'
 * parsePhone('invalid')          // null
 */
export function parsePhone(value: string): string | null {
  if (!value) return null;

  const cleaned = value.replace(/\D/g, '');
  return cleaned.length >= 10 ? cleaned.slice(0, 10) : null;
}

/**
 * Format a string as percentage with optional decimal places
 *
 * @param value - Raw input string
 * @param options - Formatting options
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent('5.5')   // '5.5%'
 * formatPercent('100')   // '100%'
 */
export function formatPercent(
  value: string,
  options: { maxDecimals?: number; maxValue?: number } = {}
): string {
  const { maxDecimals = 2, maxValue = 100 } = options;

  if (!value || value === '') return '';

  // Remove all non-numeric characters except decimal
  let cleaned = value.replace(/[^0-9.]/g, '');

  // Handle multiple decimals
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  const [integerPart, decimalPart] = cleaned.split('.');

  // Parse and cap at max value
  let numValue = parseInt(integerPart || '0', 10);
  if (numValue > maxValue) numValue = maxValue;

  let result = String(numValue);
  if (decimalPart !== undefined) {
    result += '.' + decimalPart.slice(0, maxDecimals);
  }

  return result + '%';
}

/**
 * Parse a formatted percentage string back to a number
 *
 * @param value - Formatted percentage string
 * @returns Numeric value (0-100) or null if invalid
 *
 * @example
 * parsePercent('5.5%')   // 5.5
 * parsePercent('100%')   // 100
 */
export function parsePercent(value: string): number | null {
  if (!value) return null;

  const cleaned = value.replace(/%/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format a numeric string with thousand separators (no currency symbol)
 *
 * @param value - Raw input string
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * formatNumber('1234567')   // '1,234,567'
 * formatNumber('1234.56')   // '1,234.56'
 */
export function formatNumber(
  value: string,
  options: { maxDecimals?: number; allowNegative?: boolean } = {}
): string {
  const { maxDecimals = 2, allowNegative = false } = options;

  if (!value || value === '') return '';

  // Remove all non-numeric characters except decimal and minus
  let cleaned = value.replace(/[^0-9.-]/g, '');

  // Handle negative sign
  const isNegative = allowNegative && cleaned.startsWith('-');
  cleaned = cleaned.replace(/-/g, '');

  // Handle multiple decimals
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  const [integerPart, decimalPart] = cleaned.split('.');

  // Format integer with thousand separators
  const formattedInteger = integerPart
    ? parseInt(integerPart, 10).toLocaleString('en-US')
    : '0';

  let result = formattedInteger;
  if (decimalPart !== undefined) {
    result += '.' + decimalPart.slice(0, maxDecimals);
  }

  return isNegative ? '-' + result : result;
}

/**
 * Parse a formatted number string back to a number
 *
 * @param value - Formatted number string
 * @returns Numeric value or null if invalid
 */
export function parseNumber(value: string): number | null {
  if (!value) return null;

  const cleaned = value.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format square footage with commas
 *
 * @param value - Raw input string
 * @returns Formatted square footage string
 *
 * @example
 * formatSquareFeet('2500')   // '2,500 sq ft'
 */
export function formatSquareFeet(value: string): string {
  if (!value || value === '') return '';

  const cleaned = value.replace(/\D/g, '');
  if (!cleaned) return '';

  const formatted = parseInt(cleaned, 10).toLocaleString('en-US');
  return `${formatted} sq ft`;
}

/**
 * Parse square footage back to number
 */
export function parseSquareFeet(value: string): number | null {
  if (!value) return null;

  const cleaned = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}
