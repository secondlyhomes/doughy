// src/lib/retry.ts
// Exponential backoff retry utility for API calls

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds before first retry (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds between retries (default: 30000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable (default: all errors) */
  isRetryable?: (error: unknown) => boolean;
  /** Callback fired before each retry attempt */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

/**
 * Default configuration for retry behavior
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  isRetryable: () => true,
  onRetry: () => {},
};

/**
 * Check if an error is a network/timeout error that should be retried
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  return false;
}

/**
 * Check if an HTTP error should be retried based on status code
 * Retries on: 408 (timeout), 429 (rate limit), 500+ (server errors)
 */
export function isRetryableHttpError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 408 || status === 429 || status >= 500;
  }
  return false;
}

/**
 * Default function to determine if an error should be retried
 */
export function defaultIsRetryable(error: unknown): boolean {
  return isNetworkError(error) || isRetryableHttpError(error);
}

/**
 * Calculate delay for a given retry attempt using exponential backoff with jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  // Exponential backoff: baseDelay * multiplier^attempt
  const exponentialDelay = baseDelay * Math.pow(multiplier, attempt);

  // Add jitter (random 0-25% variation) to prevent thundering herd
  const jitter = exponentialDelay * Math.random() * 0.25;

  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with exponential backoff retry logic
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await retryWithBackoff(() => fetchData());
 *
 * // With custom options
 * const result = await retryWithBackoff(
 *   () => callExternalApi(),
 *   {
 *     maxRetries: 5,
 *     baseDelay: 500,
 *     isRetryable: defaultIsRetryable,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error}`);
 *     }
 *   }
 * );
 * ```
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 * @throws The last error if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we've exhausted retries
      if (attempt >= config.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!config.isRetryable(error)) {
        throw error;
      }

      // Calculate delay for this attempt
      const delay = calculateDelay(
        attempt,
        config.baseDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      // Fire callback before retry
      config.onRetry(error, attempt + 1, delay);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Create a wrapped version of a function that automatically retries on failure
 *
 * @example
 * ```typescript
 * const fetchWithRetry = withRetry(fetchData, { maxRetries: 3 });
 * const result = await fetchWithRetry();
 * ```
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: RetryOptions
): T {
  return ((...args: Parameters<T>) =>
    retryWithBackoff(() => fn(...args) as Promise<unknown>, options)) as T;
}

/**
 * Retry configuration presets for common use cases
 */
export const RetryPresets = {
  /** Conservative retry for rate-limited APIs (longer delays, more retries) */
  rateLimited: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    isRetryable: (error: unknown) => isRetryableHttpError(error),
  } satisfies RetryOptions,

  /** Aggressive retry for critical operations (fast initial retry) */
  critical: {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 2,
    isRetryable: defaultIsRetryable,
  } satisfies RetryOptions,

  /** Light retry for non-critical operations */
  light: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    isRetryable: defaultIsRetryable,
  } satisfies RetryOptions,
};
