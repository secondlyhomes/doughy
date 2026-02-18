/**
 * Bubbles.tsx
 *
 * Conversation Bubbles (Android 11+)
 *
 * Features:
 * - Floating chat heads
 * - Quick replies
 * - Bubble metadata
 *
 * Requirements:
 * - Android 11+ (API 30+)
 */

import { NativeModules } from 'react-native';

const { BubblesModule } = NativeModules;

export interface BubbleMetadata {
  conversationId: string;
  shortcutId: string;
  icon: string;
  title: string;
}

export class BubblesManager {
  static async createBubble(metadata: BubbleMetadata): Promise<void> {
    try {
      await BubblesModule.createBubble(metadata);
    } catch (error) {
      console.error('Failed to create bubble:', error);
    }
  }

  static async dismissBubble(conversationId: string): Promise<void> {
    try {
      await BubblesModule.dismissBubble(conversationId);
    } catch (error) {
      console.error('Failed to dismiss bubble:', error);
    }
  }
}
