/**
 * EdgeToEdgeManager
 *
 * Manager class for edge-to-edge display functionality on Android.
 * Handles enabling/disabling edge-to-edge mode and system bar styling.
 */

import { Platform, NativeModules } from 'react-native';
import { SystemBarStyle, WindowInsets } from './types';

const { EdgeToEdgeModule } = NativeModules;

const DEFAULT_INSETS: WindowInsets = { top: 0, bottom: 0, left: 0, right: 0 };

const DEFAULT_STYLE: SystemBarStyle = {
  statusBarColor: 'transparent',
  navigationBarColor: 'transparent',
  statusBarStyle: 'dark-content',
  navigationBarStyle: 'dark',
};

/**
 * Edge-to-Edge Manager for Android
 *
 * Provides static methods for controlling edge-to-edge display mode.
 */
export class EdgeToEdgeManager {
  /**
   * Check if edge-to-edge is supported on this platform
   * Requires Android 11+ (API 30+)
   */
  static isSupported(): boolean {
    return Platform.OS === 'android' && Platform.Version >= 30;
  }

  /**
   * Enable edge-to-edge mode with optional styling
   */
  static async enable(style?: SystemBarStyle): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Edge-to-edge not supported on this platform');
      return;
    }

    try {
      await EdgeToEdgeModule?.enableEdgeToEdge(style || DEFAULT_STYLE);
    } catch (error) {
      console.error('Failed to enable edge-to-edge:', error);
    }
  }

  /**
   * Disable edge-to-edge mode
   */
  static async disable(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await EdgeToEdgeModule?.disableEdgeToEdge();
    } catch (error) {
      console.error('Failed to disable edge-to-edge:', error);
    }
  }

  /**
   * Update system bar styling without changing edge-to-edge mode
   */
  static async updateSystemBarStyle(style: SystemBarStyle): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await EdgeToEdgeModule?.updateSystemBarStyle(style);
    } catch (error) {
      console.error('Failed to update system bar style:', error);
    }
  }

  /**
   * Get current window insets from the system
   */
  static async getWindowInsets(): Promise<WindowInsets> {
    if (!this.isSupported()) {
      return DEFAULT_INSETS;
    }

    try {
      return await EdgeToEdgeModule?.getWindowInsets() || DEFAULT_INSETS;
    } catch (error) {
      console.error('Failed to get window insets:', error);
      return DEFAULT_INSETS;
    }
  }
}
