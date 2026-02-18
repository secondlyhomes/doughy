/**
 * Utility functions for Android Quick Settings Tiles
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task, TileConfig, DialogOptions, StartActivityOptions } from '../types';

const { QuickTileModule } = NativeModules;

/**
 * Create tile event emitter (Android only)
 */
export function createTileEmitter(): NativeEventEmitter | null {
  if (Platform.OS !== 'android') {
    return null;
  }
  return new NativeEventEmitter(QuickTileModule);
}

/**
 * Get the QuickTileModule reference
 */
export function getQuickTileModule() {
  return QuickTileModule;
}

/**
 * Storage key for tasks
 */
export const TASKS_STORAGE_KEY = '@tasks';

/**
 * Get pending task count from storage
 */
export async function getPendingTaskCount(): Promise<number> {
  try {
    const tasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    if (!tasksJson) return 0;

    const tasks: Task[] = JSON.parse(tasksJson);
    return tasks.filter((t) => !t.completed).length;
  } catch (error) {
    console.error('Failed to get task count:', error);
    return 0;
  }
}

/**
 * Get all tasks from storage
 */
export async function getTasks(): Promise<Task[]> {
  try {
    const tasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    if (!tasksJson) return [];
    return JSON.parse(tasksJson);
  } catch (error) {
    console.error('Failed to get tasks:', error);
    return [];
  }
}

/**
 * Save tasks to storage
 */
export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Create a new task
 */
export async function createTask(
  title: string,
  source: 'voice' | 'manual' = 'manual'
): Promise<Task> {
  const tasks = await getTasks();

  const newTask: Task = {
    id: Date.now().toString(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
    source,
  };

  tasks.push(newTask);
  await saveTasks(tasks);

  return newTask;
}

/**
 * Update tile appearance via native module
 */
export async function updateTileNative(config: TileConfig): Promise<void> {
  try {
    await QuickTileModule.updateTile({
      label: config.label,
      subtitle: config.subtitle,
      icon: config.icon,
      state: config.state,
      contentDescription: config.contentDescription,
    });
  } catch (error) {
    console.error('Failed to update tile:', error);
  }
}

/**
 * Request tile to be added to Quick Settings
 */
export async function requestAddTileNative(): Promise<void> {
  try {
    await QuickTileModule.requestAddTile();
  } catch (error) {
    console.error('Failed to request add tile:', error);
  }
}

/**
 * Show dialog via native module
 */
export async function showDialogNative(options: DialogOptions): Promise<void> {
  await QuickTileModule.showDialog(options);
}

/**
 * Start activity and collapse panel
 */
export async function startActivityAndCollapse(options: StartActivityOptions): Promise<void> {
  await QuickTileModule.startActivityAndCollapse(options);
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

/**
 * Log warning for non-Android platforms
 */
export function warnNonAndroid(): void {
  if (!isAndroid()) {
    console.warn('Quick Settings Tiles are only available on Android');
  }
}
