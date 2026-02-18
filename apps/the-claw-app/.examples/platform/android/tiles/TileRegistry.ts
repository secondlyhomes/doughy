/**
 * TileRegistry
 *
 * Registry for managing multiple Quick Settings Tiles
 */

import type { ITileManager } from './types';

/**
 * Multiple Tile Manager Registry
 */
export class TileRegistry {
  private static tiles: Map<string, ITileManager> = new Map();

  /**
   * Register tile
   */
  static register(tileId: string, tileManager: ITileManager): void {
    this.tiles.set(tileId, tileManager);
  }

  /**
   * Get tile by ID
   */
  static get(tileId: string): ITileManager | undefined {
    return this.tiles.get(tileId);
  }

  /**
   * Check if tile is registered
   */
  static has(tileId: string): boolean {
    return this.tiles.has(tileId);
  }

  /**
   * Unregister tile
   */
  static unregister(tileId: string): boolean {
    return this.tiles.delete(tileId);
  }

  /**
   * Get all registered tile IDs
   */
  static getRegisteredTileIds(): string[] {
    return Array.from(this.tiles.keys());
  }

  /**
   * Initialize all tiles
   */
  static async initializeAll(): Promise<void> {
    for (const [tileId, tileManager] of this.tiles) {
      try {
        await tileManager.initialize();
      } catch (error) {
        console.error(`Failed to initialize tile ${tileId}:`, error);
      }
    }
  }

  /**
   * Initialize specific tile
   */
  static async initializeTile(tileId: string): Promise<void> {
    const tileManager = this.tiles.get(tileId);
    if (tileManager) {
      await tileManager.initialize();
    } else {
      console.warn(`Tile ${tileId} not found in registry`);
    }
  }

  /**
   * Cleanup all tiles
   */
  static cleanupAll(): void {
    for (const [tileId, tileManager] of this.tiles) {
      try {
        tileManager.cleanup?.();
      } catch (error) {
        console.error(`Failed to cleanup tile ${tileId}:`, error);
      }
    }
    this.tiles.clear();
  }

  /**
   * Cleanup specific tile
   */
  static cleanupTile(tileId: string): void {
    const tileManager = this.tiles.get(tileId);
    if (tileManager) {
      tileManager.cleanup?.();
      this.tiles.delete(tileId);
    }
  }
}
