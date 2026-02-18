/**
 * useFocusFilter.ts
 *
 * Custom hook for Focus Filter functionality
 * Manages state, effects, and callbacks for focus filtering
 */

import { useEffect, useState, useCallback } from 'react';
import {
  FocusMode,
  FocusFilterConfig,
  FilterableTask,
  UseFocusFilterReturn,
} from '../types';
import { FocusFilterManager } from '../FocusFilterManager';

/**
 * Get display name for a Focus mode
 */
const getFocusDisplayNameForMode = (mode: FocusMode): string => {
  switch (mode) {
    case FocusMode.Work:
      return 'Work';
    case FocusMode.Personal:
      return 'Personal';
    case FocusMode.Sleep:
      return 'Sleep';
    case FocusMode.DoNotDisturb:
      return 'Do Not Disturb';
    case FocusMode.Driving:
      return 'Driving';
    case FocusMode.Fitness:
      return 'Fitness';
    case FocusMode.Gaming:
      return 'Gaming';
    case FocusMode.Mindfulness:
      return 'Mindfulness';
    case FocusMode.Reading:
      return 'Reading';
    default:
      return 'None';
  }
};

/**
 * Hook for Focus Filter functionality
 *
 * Provides current focus mode, filter configuration, and utility functions
 * for filtering tasks and managing notifications based on iOS Focus mode.
 */
export function useFocusFilter(): UseFocusFilterReturn {
  const [currentFocus, setCurrentFocus] = useState<FocusMode>(FocusMode.None);
  const [filterConfig, setFilterConfig] = useState<FocusFilterConfig | null>(null);

  const loadFilterConfig = useCallback(async (mode: FocusMode) => {
    if (mode === FocusMode.None) {
      setFilterConfig(null);
      return;
    }

    const config = await FocusFilterManager.getFilterConfig();
    setFilterConfig(config);
  }, []);

  const loadCurrentFocus = useCallback(async () => {
    const mode = await FocusFilterManager.getCurrentFocus();
    setCurrentFocus(mode);
    await loadFilterConfig(mode);
  }, [loadFilterConfig]);

  useEffect(() => {
    loadCurrentFocus();

    // Listen for Focus changes
    const unsubscribe = FocusFilterManager.addFocusChangeListener((mode) => {
      setCurrentFocus(mode);
      loadFilterConfig(mode);
    });

    return unsubscribe;
  }, [loadCurrentFocus, loadFilterConfig]);

  /**
   * Filter tasks based on current Focus mode
   */
  const filterTasks = useCallback(
    <T extends FilterableTask>(tasks: T[]): T[] => {
      if (!filterConfig || !filterConfig.shouldFilterTasks) {
        return tasks;
      }

      return tasks.filter((task) => {
        // Filter by category
        if (
          filterConfig.allowedCategories.length > 0 &&
          task.category &&
          !filterConfig.allowedCategories.includes(task.category)
        ) {
          return false;
        }

        // Filter by priority
        if (
          filterConfig.allowedPriorities.length > 0 &&
          task.priority &&
          !filterConfig.allowedPriorities.includes(task.priority)
        ) {
          return false;
        }

        return true;
      });
    },
    [filterConfig]
  );

  /**
   * Check if notifications should be silenced
   */
  const shouldSilenceNotifications = useCallback((): boolean => {
    return currentFocus !== FocusMode.None;
  }, [currentFocus]);

  /**
   * Get Focus mode display name
   */
  const getFocusDisplayName = useCallback((): string => {
    return getFocusDisplayNameForMode(currentFocus);
  }, [currentFocus]);

  return {
    currentFocus,
    filterConfig,
    filterTasks,
    shouldSilenceNotifications,
    getFocusDisplayName,
    isFiltering: filterConfig?.shouldFilterTasks || false,
  };
}
