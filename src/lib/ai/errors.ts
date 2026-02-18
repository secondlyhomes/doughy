// src/lib/ai/errors.ts
// Enhanced error handling for AI service

import { AIResponse } from './dealAssistant';

/**
 * Custom error class for AI-specific errors
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Handle AI service errors and return user-friendly AIResponse
 * @param error - The error that occurred
 * @returns AIResponse with appropriate error message
 */
export function handleAIError(error: unknown): AIResponse {
  // Network timeout
  if (error instanceof Error && error.message.toLowerCase().includes('timeout')) {
    return {
      content: "The request took too long. Please try again.",
      confidence: 'low',
      suggestedActions: [],
      metadata: {
        errorCode: 'TIMEOUT',
        retryable: true,
      },
    };
  }

  // Rate limit (429)
  if (isHTTPError(error, 429)) {
    return {
      content: "I'm getting too many requests right now. Please wait a moment before trying again.",
      confidence: 'low',
      suggestedActions: [],
      metadata: {
        errorCode: 'RATE_LIMIT',
        retryAfter: 60,
        retryable: true,
      },
    };
  }

  // Authentication error (401)
  if (isHTTPError(error, 401)) {
    return {
      content: "There's a configuration issue with the AI service. Please contact support.",
      confidence: 'low',
      suggestedActions: [],
      metadata: {
        errorCode: 'AUTH_ERROR',
        retryable: false,
      },
    };
  }

  // Bad request (400)
  if (isHTTPError(error, 400)) {
    return {
      content: "Your request couldn't be processed. Please try rephrasing your question.",
      confidence: 'low',
      suggestedActions: [],
      metadata: {
        errorCode: 'BAD_REQUEST',
        retryable: true,
      },
    };
  }

  // Server error (5xx)
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    if (status >= 500 && status < 600) {
      return {
        content: "The AI service is temporarily unavailable. Please try again in a moment.",
        confidence: 'low',
        suggestedActions: [],
        metadata: {
          errorCode: 'SERVER_ERROR',
          statusCode: status,
          retryable: true,
        },
      };
    }
  }

  // Network error
  if (error instanceof Error && (
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('fetch') ||
    error.message.toLowerCase().includes('connection')
  )) {
    return {
      content: "Network connection issue. Please check your internet and try again.",
      confidence: 'low',
      suggestedActions: [],
      metadata: {
        errorCode: 'NETWORK_ERROR',
        retryable: true,
      },
    };
  }

  // Generic fallback
  console.error('[AI Assistant] Unexpected error:', error);
  return {
    content: "Something went wrong. Please try again.",
    confidence: 'low',
    suggestedActions: [],
    metadata: {
      errorCode: 'UNKNOWN',
      retryable: true,
      error: error instanceof Error ? error.message : String(error),
    },
  };
}

/**
 * Helper to check if error is an HTTP error with specific status
 */
function isHTTPError(error: unknown, statusCode: number): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    (error as any).status === statusCode
  );
}

/**
 * Create a user-friendly error message for specific error codes
 */
export function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    TIMEOUT: "The request took too long. Please try again.",
    RATE_LIMIT: "You're making requests too quickly. Please wait a moment.",
    AUTH_ERROR: "Authentication failed. Please contact support.",
    BAD_REQUEST: "Invalid request. Please try rephrasing your question.",
    SERVER_ERROR: "The service is temporarily unavailable. Please try again later.",
    NETWORK_ERROR: "Network connection issue. Please check your internet.",
    UNKNOWN: "Something went wrong. Please try again.",
  };

  return messages[errorCode] || messages.UNKNOWN;
}
