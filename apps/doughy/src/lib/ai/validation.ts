// src/lib/ai/validation.ts
// Input validation for AI requests

export const INPUT_VALIDATION = {
  MAX_MESSAGE_LENGTH: 1000,
  MIN_MESSAGE_LENGTH: 1,
  MAX_CONVERSATION_HISTORY: 10,
} as const;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validate user message before sending to AI
 * @param message - User's input message
 * @returns Validation result with sanitized message
 */
export function validateMessage(message: string): ValidationResult {
  // Check for empty or whitespace-only
  if (!message || message.trim().length < INPUT_VALIDATION.MIN_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: 'Message cannot be empty',
    };
  }

  // Check length limit
  if (message.length > INPUT_VALIDATION.MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `Message too long (max ${INPUT_VALIDATION.MAX_MESSAGE_LENGTH} characters)`,
    };
  }

  // Sanitize the message
  const sanitized = sanitizeInput(message);

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Sanitize user input
 * - Trim whitespace
 * - Normalize multiple spaces to single space
 * - Remove control characters
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')  // Normalize whitespace (multiple spaces → single space)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');  // Remove control chars (except \n, \r, \t)
}

/**
 * Validate conversation history length
 * @param history - Array of conversation messages
 * @returns true if valid, false if too long
 */
export function validateConversationHistory(history: unknown[]): boolean {
  return history.length <= INPUT_VALIDATION.MAX_CONVERSATION_HISTORY;
}
