/**
 * pip-utils.ts
 *
 * Picture-in-Picture utility functions and manager class
 */

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import type { PiPParams, PiPEnterResult } from '../types';

const { PictureInPictureModule } = NativeModules;
export const pipEmitter = new NativeEventEmitter(PictureInPictureModule);

/**
 * PiP Aspect Ratios - common video aspect ratios
 */
export const PIP_ASPECT_RATIOS = {
  VIDEO_16_9: { width: 16, height: 9 },
  VIDEO_4_3: { width: 4, height: 3 },
  VIDEO_21_9: { width: 21, height: 9 },
  SQUARE: { width: 1, height: 1 },
  VERTICAL: { width: 9, height: 16 },
} as const;

/**
 * Picture-in-Picture Manager
 *
 * Manages PiP state and native module communication
 */
export class PictureInPictureManager {
  private static isInPipMode = false;
  private static listeners: Map<string, (isInPipMode: boolean) => void> = new Map();

  /**
   * Check if PiP is supported on this device
   */
  static async isSupported(): Promise<boolean> {
    if (Platform.OS !== 'android' || Platform.Version < 26) {
      return false;
    }

    try {
      const supported = await PictureInPictureModule.isSupported();
      return supported;
    } catch (error) {
      console.error('Failed to check PiP support:', error);
      return false;
    }
  }

  /**
   * Enter Picture-in-Picture mode
   */
  static async enterPiP(params: PiPParams): Promise<PiPEnterResult> {
    try {
      const result = await PictureInPictureModule.enterPictureInPicture(params);
      this.isInPipMode = result.success;
      this.notifyListeners(result.success);
      return result;
    } catch (error: any) {
      console.error('Failed to enter PiP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exit Picture-in-Picture mode
   */
  static async exitPiP(): Promise<void> {
    try {
      await PictureInPictureModule.exitPictureInPicture();
      this.isInPipMode = false;
      this.notifyListeners(false);
    } catch (error) {
      console.error('Failed to exit PiP:', error);
    }
  }

  /**
   * Update PiP params (aspect ratio, actions, etc.)
   */
  static async updatePiP(params: Partial<PiPParams>): Promise<void> {
    try {
      await PictureInPictureModule.updatePictureInPicture(params);
    } catch (error) {
      console.error('Failed to update PiP:', error);
    }
  }

  /**
   * Check if currently in PiP mode
   */
  static getIsInPipMode(): boolean {
    return this.isInPipMode;
  }

  /**
   * Add PiP mode change listener
   */
  static addListener(id: string, callback: (isInPipMode: boolean) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * Remove PiP mode change listener
   */
  static removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners of mode change
   */
  private static notifyListeners(isInPipMode: boolean): void {
    this.listeners.forEach((callback) => callback(isInPipMode));
  }

  /**
   * Initialize PiP event listeners
   */
  static initialize(): void {
    pipEmitter.addListener('onPictureInPictureModeChanged', (event: { isInPipMode: boolean }) => {
      this.isInPipMode = event.isInPipMode;
      this.notifyListeners(event.isInPipMode);
    });

    pipEmitter.addListener('onPictureInPictureActionReceived', (event: { action: string }) => {
      console.log('PiP action received:', event.action);
    });
  }

  /**
   * Cleanup listeners
   */
  static cleanup(): void {
    pipEmitter.removeAllListeners('onPictureInPictureModeChanged');
    pipEmitter.removeAllListeners('onPictureInPictureActionReceived');
    this.listeners.clear();
  }
}

/**
 * PiP Analytics - track PiP usage
 */
export class PiPAnalytics {
  static trackEnter(params: PiPParams): void {
    console.log('PiP entered', params);
    // Send to analytics service
  }

  static trackExit(): void {
    console.log('PiP exited');
    // Send to analytics service
  }

  static trackAction(action: string): void {
    console.log('PiP action:', action);
    // Send to analytics service
  }
}
