/**
 * DirectShare.tsx
 *
 * Android Direct Share implementation
 *
 * Features:
 * - Share to specific app targets
 * - Recent conversations
 * - Share shortcuts
 *
 * Requirements:
 * - Android 6.0+ (API 23+) for basic sharing
 * - Android 10+ (API 29+) for improved sharing targets
 */

import { NativeModules } from 'react-native';

const { DirectShareModule } = NativeModules;

export interface ShareTarget {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  intent: {
    action: string;
    data?: string;
  };
}

export class DirectShareManager {
  static async shareToTarget(target: ShareTarget, content: any): Promise<void> {
    try {
      await DirectShareModule.shareToTarget(target, content);
    } catch (error) {
      console.error('Failed to share to target:', error);
    }
  }

  static async createShareShortcut(target: ShareTarget): Promise<void> {
    try {
      await DirectShareModule.createShareShortcut(target);
    } catch (error) {
      console.error('Failed to create share shortcut:', error);
    }
  }
}
