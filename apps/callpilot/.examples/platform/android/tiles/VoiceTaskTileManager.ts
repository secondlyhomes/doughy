/**
 * VoiceTaskTileManager
 *
 * Voice Input Tile for voice-based task creation
 *
 * Features:
 * - Voice recognition integration
 * - Automatic task creation from speech
 * - Visual feedback during listening
 */

import { TileState } from './types';
import { QuickTaskTileManager } from './QuickTaskTileManager';
import { getQuickTileModule, createTask } from './utils/tile-utils';

/**
 * Voice Input Tile Manager
 */
export class VoiceTaskTileManager {
  /**
   * Initialize voice input tile
   */
  static async initialize(): Promise<void> {
    await QuickTaskTileManager.updateTile({
      label: 'Voice Task',
      subtitle: 'Say your task',
      icon: 'ic_mic',
      state: TileState.INACTIVE,
    });
  }

  /**
   * Handle tile click with voice input
   */
  static async handleClick(): Promise<void> {
    const QuickTileModule = getQuickTileModule();

    try {
      // Set to active state
      await QuickTaskTileManager.updateTile({
        label: 'Listening...',
        icon: 'ic_mic',
        state: TileState.ACTIVE,
      });

      // Start voice recognition
      const result = await QuickTileModule.startVoiceRecognition({
        prompt: 'Say your task',
        language: 'en-US',
      });

      if (result.text) {
        // Create task from voice input
        await createTask(result.text, 'voice');

        // Show success
        await QuickTaskTileManager.updateTile({
          label: 'Task Created',
          subtitle: result.text,
          icon: 'ic_check',
          state: TileState.ACTIVE,
        });

        // Reset after delay
        setTimeout(async () => {
          await this.initialize();
        }, 2000);
      } else {
        // No input
        await this.initialize();
      }
    } catch (error) {
      console.error('Voice input failed:', error);

      // Show error
      await QuickTaskTileManager.updateTile({
        label: 'Voice Task',
        subtitle: 'Error',
        icon: 'ic_error',
        state: TileState.UNAVAILABLE,
      });

      // Reset after delay
      setTimeout(async () => {
        await this.initialize();
      }, 2000);
    }
  }
}
