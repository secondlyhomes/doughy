/**
 * useQuickTaskTile Hook
 *
 * React Hook for Quick Settings Tile integration
 */

import { useState, useEffect, useCallback } from 'react';
import { TileState } from './types';
import type { Task } from './types';
import { QuickTaskTileManager } from './QuickTaskTileManager';
import { getTasks, saveTasks, createTask as createTaskUtil } from './utils/tile-utils';

interface UseQuickTaskTileResult {
  isActive: boolean;
  taskCount: number;
  createTask: (title: string) => Promise<Task>;
  requestAddTile: () => Promise<void>;
  updateTaskCount: () => Promise<void>;
}

/**
 * React Hook for Quick Settings Tile
 */
export function useQuickTaskTile(): UseQuickTaskTileResult {
  const [isActive, setIsActive] = useState(false);
  const [taskCount, setTaskCount] = useState(0);

  const updateTaskCount = useCallback(async () => {
    try {
      const tasks = await getTasks();
      const pendingCount = tasks.filter((t) => !t.completed).length;
      setTaskCount(pendingCount);

      await QuickTaskTileManager.updateTile({
        label: 'Quick Task',
        subtitle: `${pendingCount} pending`,
        icon: 'ic_add_task',
        state: TileState.INACTIVE,
      });
    } catch (error) {
      console.error('Failed to update task count:', error);
    }
  }, []);

  useEffect(() => {
    // Initialize tile
    QuickTaskTileManager.initialize();

    // Setup listeners
    QuickTaskTileManager.addEventListener('tileClicked', () => {
      setIsActive(true);
    });

    QuickTaskTileManager.addEventListener('taskCreated', () => {
      setIsActive(false);
      updateTaskCount();
    });

    // Load initial task count
    updateTaskCount();

    return () => {
      QuickTaskTileManager.cleanup();
    };
  }, [updateTaskCount]);

  const createTask = useCallback(
    async (title: string): Promise<Task> => {
      try {
        const newTask = await createTaskUtil(title, 'manual');
        await updateTaskCount();
        return newTask;
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      }
    },
    [updateTaskCount]
  );

  const requestAddTile = useCallback(async () => {
    await QuickTaskTileManager.requestAddTile();
  }, []);

  return {
    isActive,
    taskCount,
    createTask,
    requestAddTile,
    updateTaskCount,
  };
}
