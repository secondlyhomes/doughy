// src/features/admin/services/api-key-health/retry.ts
// Retry and timeout utilities for health checks

export const HEALTH_CHECK_TIMEOUT = 15000; // 15 seconds timeout for health checks
export const MAX_RETRIES = 2; // Number of retries for transient failures
export const INITIAL_RETRY_DELAY = 1000; // 1 second initial retry delay

/**
 * Wrap a promise with a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Check if an error is likely transient (worth retrying)
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket') ||
      message.includes('fetch failed')
    );
  }
  return false;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleep with jitter to prevent thundering herd on retries
 * Uses 50-100% of the base delay for randomization
 */
export function sleepWithJitter(baseMs: number): Promise<void> {
  const jitteredDelay = baseMs * (0.5 + Math.random() * 0.5);
  return sleep(jitteredDelay);
}
