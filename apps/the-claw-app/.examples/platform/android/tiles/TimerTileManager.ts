/**
 * TimerTileManager
 *
 * Example: Custom tile for toggling Pomodoro timer
 *
 * Features:
 * - Toggle timer on/off
 * - Visual state updates
 * - Countdown display
 */

import { TileState } from './types';
import { QuickTaskTileManager } from './QuickTaskTileManager';

/**
 * Timer Tile Manager
 */
export class TimerTileManager {
  private static isRunning = false;
  private static remainingSeconds = 0;
  private static intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize timer tile
   */
  static async initialize(): Promise<void> {
    this.isRunning = false;
    this.remainingSeconds = 0;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await QuickTaskTileManager.updateTile({
      label: 'Pomodoro',
      subtitle: 'Start timer',
      icon: 'ic_timer',
      state: TileState.INACTIVE,
    });
  }

  /**
   * Handle tile click
   */
  static async handleClick(): Promise<void> {
    this.isRunning = !this.isRunning;

    if (this.isRunning) {
      await this.startTimer(25 * 60); // 25 minutes
    } else {
      await this.stopTimer();
    }
  }

  /**
   * Start the timer
   */
  private static async startTimer(seconds: number): Promise<void> {
    this.remainingSeconds = seconds;

    await QuickTaskTileManager.updateTile({
      label: 'Pomodoro',
      subtitle: this.formatTime(this.remainingSeconds),
      icon: 'ic_timer_running',
      state: TileState.ACTIVE,
    });

    // Note: In production, timer would be implemented in native code
    // This is a demonstration of the concept
    this.intervalId = setInterval(async () => {
      this.remainingSeconds -= 1;

      if (this.remainingSeconds <= 0) {
        await this.timerComplete();
      } else {
        await QuickTaskTileManager.updateTile({
          label: 'Pomodoro',
          subtitle: this.formatTime(this.remainingSeconds),
          icon: 'ic_timer_running',
          state: TileState.ACTIVE,
        });
      }
    }, 1000);
  }

  /**
   * Stop the timer
   */
  private static async stopTimer(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await this.initialize();
  }

  /**
   * Timer completed
   */
  private static async timerComplete(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;

    await QuickTaskTileManager.updateTile({
      label: 'Pomodoro',
      subtitle: 'Complete!',
      icon: 'ic_check',
      state: TileState.ACTIVE,
    });

    // Reset after delay
    setTimeout(async () => {
      await this.initialize();
    }, 3000);
  }

  /**
   * Format seconds to MM:SS
   */
  private static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Cleanup
   */
  static cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.remainingSeconds = 0;
  }
}
