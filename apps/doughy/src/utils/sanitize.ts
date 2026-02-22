// Sanitization utilities for user input

/**
 * Sanitize phone number for use in tel: and sms: URL schemes
 * Removes any characters that could be used for injection attacks
 */
export function sanitizePhone(phone: string): string {
  // Only allow digits, plus sign, hyphens, parentheses, and spaces
  return phone.replace(/[^0-9+\-() ]/g, '');
}

/**
 * Sanitize email for use in mailto: URL scheme
 */
export function sanitizeEmail(email: string): string {
  // Basic sanitization - remove any characters that could break URL
  return encodeURIComponent(email);
}
