/**
 * QuickTaskTileManager - Quick Settings Tile manager for rapid task creation
 * Requirements: Android 7.0+ (API 24+), TileService implementation
 */

import { TileState } from './types';
import type { TileConfig } from './types';
import {
  createTileEmitter,
  getQuickTileModule,
  getPendingTaskCount,
  updateTileNative,
  requestAddTileNative,
  isAndroid,
  warnNonAndroid,
} from './utils/tile-utils';

const tileEmitter = createTileEmitter();

/** Quick Task Tile Manager */
export class QuickTaskTileManager {
  private static listeners: Map<string, (data: unknown) => void> = new Map();

  /** Initialize the tile */
  static async initialize(): Promise<void> {
    if (!isAndroid()) {
      warnNonAndroid();
      return;
    }

    tileEmitter?.addListener('onTileAdded', this.handleTileAdded);
    tileEmitter?.addListener('onTileRemoved', this.handleTileRemoved);
    tileEmitter?.addListener('onStartListening', this.handleStartListening);
    tileEmitter?.addListener('onStopListening', this.handleStopListening);
    tileEmitter?.addListener('onClick', this.handleClick);

    await this.updateTile({
      label: 'Quick Task',
      subtitle: 'Add task',
      icon: 'ic_add_task',
      state: TileState.INACTIVE,
    });
  }

  /** Update tile appearance */
  static async updateTile(config: TileConfig): Promise<void> {
    await updateTileNative(config);
  }

  /** Request tile to be added to Quick Settings */
  static async requestAddTile(): Promise<void> {
    await requestAddTileNative();
  }

  /** Add event listener */
  static addEventListener(event: string, callback: (data: unknown) => void): void {
    this.listeners.set(event, callback);
  }

  /** Remove event listener */
  static removeEventListener(event: string): void {
    this.listeners.delete(event);
  }

  /** Handle tile added */
  private static handleTileAdded = async (): Promise<void> => {
    console.log('Tile added to Quick Settings');
    const taskCount = await getPendingTaskCount();
    await this.updateTile({
      label: 'Quick Task',
      subtitle: `${taskCount} pending`,
      icon: 'ic_add_task',
      state: TileState.INACTIVE,
    });
    this.listeners.get('tileAdded')?.({});
  };

  /** Handle tile removed */
  private static handleTileRemoved = (): void => {
    console.log('Tile removed from Quick Settings');
    this.listeners.get('tileRemoved')?.({});
  };

  /** Handle start listening (tile visible) */
  private static handleStartListening = async (): Promise<void> => {
    console.log('Tile is now visible');
    const taskCount = await getPendingTaskCount();
    await this.updateTile({
      label: 'Quick Task',
      subtitle: `${taskCount} pending`,
      icon: 'ic_add_task',
      state: TileState.INACTIVE,
    });
  };

  /** Handle stop listening (tile hidden) */
  private static handleStopListening = (): void => {
    console.log('Tile is now hidden');
  };

  /** Handle tile click */
  private static handleClick = async (): Promise<void> => {
    console.log('Tile clicked');
    try {
      await this.updateTile({
        label: 'Adding Task...',
        icon: 'ic_add_task',
        state: TileState.ACTIVE,
      });

      await this.showTaskDialog();

      const taskCount = await getPendingTaskCount();
      await this.updateTile({
        label: 'Quick Task',
        subtitle: `${taskCount} pending`,
        icon: 'ic_add_task',
        state: TileState.INACTIVE,
      });

      this.listeners.get('tileClicked')?.({});
    } catch (error) {
      console.error('Tile click failed:', error);
      await this.updateTile({
        label: 'Quick Task',
        subtitle: 'Error',
        icon: 'ic_error',
        state: TileState.UNAVAILABLE,
      });
    }
  };

  /** Show task creation dialog */
  private static async showTaskDialog(): Promise<void> {
    const QuickTileModule = getQuickTileModule();
    try {
      await QuickTileModule.showDialog({
        title: 'Add Task',
        message: 'Enter task name',
        positiveButton: 'Add',
        negativeButton: 'Cancel',
      });
    } catch {
      await QuickTileModule.startActivityAndCollapse({
        action: 'android.intent.action.VIEW',
        data: 'yourapp://tasks/new',
      });
    }
  }

  /** Cleanup */
  static cleanup(): void {
    tileEmitter?.removeAllListeners('onTileAdded');
    tileEmitter?.removeAllListeners('onTileRemoved');
    tileEmitter?.removeAllListeners('onStartListening');
    tileEmitter?.removeAllListeners('onStopListening');
    tileEmitter?.removeAllListeners('onClick');
    this.listeners.clear();
  }
}
