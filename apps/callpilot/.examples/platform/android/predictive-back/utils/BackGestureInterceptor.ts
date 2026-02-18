/**
 * BackGestureInterceptor
 *
 * Manages multiple back gesture callbacks with priority support
 */

import type { BackInvokedCallback } from '../types';

interface PrioritizedCallback extends BackInvokedCallback {
  priority?: number;
}

/**
 * Static class for managing back gesture callbacks
 *
 * Supports priority-based callback execution
 */
export class BackGestureInterceptor {
  private static callbacks: Map<string, PrioritizedCallback> = new Map();

  /**
   * Register a back callback with optional priority
   *
   * @param id - Unique identifier for the callback
   * @param callback - Back gesture callback
   * @param priority - Higher priority callbacks are called first (default: 0)
   */
  static register(
    id: string,
    callback: BackInvokedCallback,
    priority: number = 0
  ): void {
    this.callbacks.set(id, { ...callback, priority });
  }

  /**
   * Unregister a back callback
   *
   * @param id - Identifier of the callback to remove
   */
  static unregister(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Handle back gesture - calls highest priority callback
   *
   * @returns true if a callback handled the back gesture
   */
  static async handleBack(): Promise<boolean> {
    // Sort by priority (highest first)
    const sorted = Array.from(this.callbacks.entries()).sort(
      (a, b) => (b[1].priority || 0) - (a[1].priority || 0)
    );

    // Call the highest priority callback
    for (const [, callback] of sorted) {
      if (callback.onBackInvoked) {
        await callback.onBackInvoked();
        return true;
      }
    }

    return false;
  }

  /**
   * Clear all registered callbacks
   */
  static clear(): void {
    this.callbacks.clear();
  }

  /**
   * Get the number of registered callbacks
   */
  static get count(): number {
    return this.callbacks.size;
  }
}
