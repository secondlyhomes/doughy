/**
 * Error Recovery Utilities
 *
 * Provides strategies for recovering from errors gracefully.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecoveryOptions } from '../types/error-types';
import { ErrorStorage } from './error-storage';

export class ErrorRecovery {
  /**
   * Attempt to recover from error with fallback strategies
   */
  static async attemptRecovery<T>(
    operation: () => Promise<T>,
    strategies: Array<() => Promise<T>>,
    options: RecoveryOptions = {}
  ): Promise<T> {
    const { maxRetries = 3, retryDelay = 1000, onRetry } = options;

    // Try primary operation
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (onRetry) {
          onRetry(attempt, error as Error);
        }

        if (attempt === maxRetries) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }

    // Try recovery strategies in order
    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch (error) {
        console.warn('Recovery strategy failed:', error);
      }
    }

    throw new Error('All recovery attempts failed');
  }

  /**
   * Clear app cache and storage (nuclear option)
   */
  static async clearAppData(): Promise<void> {
    try {
      await AsyncStorage.clear();
      await ErrorStorage.clearErrorReports();
      console.log('App data cleared');
    } catch (error) {
      console.error('Failed to clear app data:', error);
      throw error;
    }
  }

  /**
   * Check app health after recovery
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const healthChecks = [
        this.checkBackendHealth(),
        this.checkDatabaseHealth(),
        this.checkAuthHealth(),
      ];

      const results = await Promise.allSettled(healthChecks);
      return results.every((result) => result.status === 'fulfilled');
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  private static async checkBackendHealth(): Promise<void> {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error('Backend unhealthy');
    }
  }

  private static async checkDatabaseHealth(): Promise<void> {
    // Implement database health check
  }

  private static async checkAuthHealth(): Promise<void> {
    // Implement auth health check
  }
}
