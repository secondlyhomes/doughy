/**
 * AppClipManager.ts
 *
 * Utility class for managing iOS App Clip functionality
 */

import { Platform, Linking } from 'react-native';
import { AppClipConfig, AppClipInvocationType } from './types';

/**
 * App Clip Manager - handles App Clip detection, URL parsing, and upgrades
 */
export class AppClipManager {
  /**
   * Check if running as App Clip
   * In production, this would check the bundle ID suffix
   * App Clips have bundle ID like: com.yourapp.Clip
   */
  static isAppClip(): boolean {
    return Platform.OS === 'ios'; // && NativeModules.AppClip?.isAppClip
  }

  /**
   * Get App Clip invocation URL
   */
  static async getInvocationURL(): Promise<string | null> {
    if (Platform.OS !== 'ios') return null;

    try {
      const url = await Linking.getInitialURL();
      return url;
    } catch (error) {
      console.error('[AppClip] Failed to get invocation URL:', error);
      return null;
    }
  }

  /**
   * Parse App Clip URL parameters
   */
  static parseClipURL(url: string): AppClipConfig {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      const metadata: Record<string, any> = {};
      params.forEach((value, key) => {
        metadata[key] = value;
      });

      return {
        url,
        invocationType: this.detectInvocationType(url),
        metadata,
      };
    } catch (error) {
      return {
        url,
        invocationType: AppClipInvocationType.Unknown,
      };
    }
  }

  /**
   * Detect how App Clip was invoked based on URL patterns
   */
  private static detectInvocationType(url: string): AppClipInvocationType {
    if (url.includes('qr=')) return AppClipInvocationType.QRCode;
    if (url.includes('nfc=')) return AppClipInvocationType.NFCTag;
    return AppClipInvocationType.Unknown;
  }

  /**
   * Show upgrade to full app prompt
   * In production, this would use native module to show App Store modal
   */
  static showUpgradePrompt(): void {
    console.log('[AppClip] Show upgrade prompt');
  }

  /**
   * Get App Store product URL for full app
   */
  static getFullAppURL(): string {
    return 'https://apps.apple.com/app/idYOUR_APP_ID';
  }
}
