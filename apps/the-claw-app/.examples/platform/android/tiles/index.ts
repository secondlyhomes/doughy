/**
 * Android Quick Settings Tiles
 *
 * Quick Settings Tile for rapid task creation
 *
 * Features:
 * - One-tap task creation
 * - Voice input support
 * - Recent tasks preview
 * - Material You theming
 * - Pomodoro timer tile
 *
 * Requirements:
 * - Android 7.0+ (API 24+)
 * - TileService implementation
 *
 * Setup:
 * 1. Create native TileService (Kotlin/Java)
 * 2. Configure AndroidManifest.xml
 * 3. Handle tile state updates
 */

// Types
export { TileState } from './types';
export type {
  TileConfig,
  Task,
  DialogOptions,
  VoiceRecognitionOptions,
  VoiceRecognitionResult,
  StartActivityOptions,
  ITileManager,
} from './types';

// Managers
export { QuickTaskTileManager } from './QuickTaskTileManager';
export { VoiceTaskTileManager } from './VoiceTaskTileManager';
export { TimerTileManager } from './TimerTileManager';
export { TileRegistry } from './TileRegistry';

// Hooks
export { useQuickTaskTile } from './useQuickTaskTile';

// Utilities
export {
  createTileEmitter,
  getQuickTileModule,
  getPendingTaskCount,
  getTasks,
  saveTasks,
  createTask,
  updateTileNative,
  requestAddTileNative,
  showDialogNative,
  startActivityAndCollapse,
  isAndroid,
  warnNonAndroid,
  TASKS_STORAGE_KEY,
} from './utils/tile-utils';

// Register default tiles on import
import { TileRegistry } from './TileRegistry';
import { QuickTaskTileManager } from './QuickTaskTileManager';
import { VoiceTaskTileManager } from './VoiceTaskTileManager';
import { TimerTileManager } from './TimerTileManager';

TileRegistry.register('quick-task', QuickTaskTileManager);
TileRegistry.register('voice-task', VoiceTaskTileManager);
TileRegistry.register('timer', TimerTileManager);
