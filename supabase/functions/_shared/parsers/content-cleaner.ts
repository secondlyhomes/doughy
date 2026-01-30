/**
 * Content Cleaner Module
 *
 * Cleans and sanitizes message content.
 *
 * @module _shared/parsers/content-cleaner
 */

/**
 * Clean message content for storage
 *
 * @param body - Raw message body
 * @returns Cleaned message content
 */
export function cleanMessageContent(body: string): string {
  // Remove excessive whitespace
  let cleaned = body.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.trim();

  // Truncate if too long
  if (cleaned.length > 5000) {
    cleaned = cleaned.substring(0, 5000) + '...';
  }

  return cleaned;
}

/**
 * Sanitize input for ReDoS prevention
 *
 * @param input - Input string
 * @param maxLength - Maximum allowed length
 * @returns Truncated input if necessary
 */
export function sanitizeInput(input: string, maxLength: number): string {
  if (input.length > maxLength) {
    return input.substring(0, maxLength);
  }
  return input;
}

/**
 * Input length limits for ReDoS prevention
 */
export const INPUT_LIMITS = {
  MAX_BODY_LENGTH: 50000,
  MAX_SUBJECT_LENGTH: 1000,
  MAX_FROM_LENGTH: 500,
};
