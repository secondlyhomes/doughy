/**
 * FocusFilterManager.ts
 *
 * Manager class for iOS Focus Filter functionality
 * Handles detection of Focus mode and filter configuration
 */

import { Platform, NativeEventEmitter } from 'react-native';
import { FocusMode, FocusFilterConfig } from './types';

/**
 * Focus Filter Manager
 *
 * Provides static methods for interacting with iOS Focus filters
 */
export class FocusFilterManager {
  private static emitter: NativeEventEmitter | null = null;

  /**
   * Check if Focus Filters are available
   * Requires iOS 16+
   */
  static isAvailable(): boolean {
    return Platform.OS === 'ios' && parseFloat(Platform.Version as string) >= 16;
  }

  /**
   * Get current Focus mode
   */
  static async getCurrentFocus(): Promise<FocusMode> {
    if (!this.isAvailable()) {
      return FocusMode.None;
    }

    try {
      // This would call native module
      // const mode = await NativeModules.FocusFilter.getCurrentFocus();
      // return mode as FocusMode;

      // For now, return None
      return FocusMode.None;
    } catch (error) {
      console.error('[FocusFilter] Failed to get current focus:', error);
      return FocusMode.None;
    }
  }

  /**
   * Listen for Focus mode changes
   */
  static addFocusChangeListener(callback: (mode: FocusMode) => void): () => void {
    if (!this.isAvailable()) {
      return () => {};
    }

    if (!this.emitter) {
      // this.emitter = new NativeEventEmitter(NativeModules.FocusFilter);
    }

    const subscription = this.emitter?.addListener('onFocusChanged', callback);

    return () => {
      subscription?.remove();
    };
  }

  /**
   * Get filter configuration for current Focus mode
   */
  static async getFilterConfig(): Promise<FocusFilterConfig | null> {
    const mode = await this.getCurrentFocus();

    if (mode === FocusMode.None) {
      return null;
    }

    return this.getDefaultFilterConfig(mode);
  }

  /**
   * Get default filter configuration for Focus mode
   */
  private static getDefaultFilterConfig(mode: FocusMode): FocusFilterConfig {
    switch (mode) {
      case FocusMode.Work:
        return {
          mode,
          shouldFilterTasks: true,
          allowedCategories: ['work', 'business', 'project'],
          allowedPriorities: ['high', 'medium'],
        };

      case FocusMode.Personal:
        return {
          mode,
          shouldFilterTasks: true,
          allowedCategories: ['personal', 'home', 'family'],
          allowedPriorities: ['high', 'medium', 'low'],
        };

      case FocusMode.Sleep:
        return {
          mode,
          shouldFilterTasks: true,
          allowedCategories: [],
          allowedPriorities: [],
        };

      case FocusMode.DoNotDisturb:
        return {
          mode,
          shouldFilterTasks: true,
          allowedCategories: [],
          allowedPriorities: ['high'],
        };

      default:
        return {
          mode,
          shouldFilterTasks: false,
          allowedCategories: [],
          allowedPriorities: [],
        };
    }
  }
}
