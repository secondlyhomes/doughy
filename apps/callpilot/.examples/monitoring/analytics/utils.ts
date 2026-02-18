/**
 * Analytics Utilities
 *
 * Logging and helper functions for analytics.
 */

const LOG_PREFIX = '[Analytics]';

/**
 * Log analytics debug message
 */
export function logDebug(message: string, ...args: any[]): void {
  console.log(`${LOG_PREFIX} ${message}`, ...args);
}

/**
 * Log analytics warning
 */
export function logWarn(message: string, ...args: any[]): void {
  console.warn(`${LOG_PREFIX} ${message}`, ...args);
}

/**
 * Log analytics error
 */
export function logError(message: string, ...args: any[]): void {
  console.error(`${LOG_PREFIX} ${message}`, ...args);
}

/**
 * Create a conditional logger based on debug flag
 */
export function createLogger(debug: boolean) {
  return {
    debug: (message: string, ...args: any[]) => {
      if (debug) logDebug(message, ...args);
    },
    warn: logWarn,
    error: logError,
  };
}
