/**
 * React hook for managing iOS Live Activities
 *
 * Provides a convenient interface for task Live Activity lifecycle.
 */

import { TaskLiveActivity } from './TaskLiveActivity';

/**
 * Hook return type
 */
export interface UseTaskLiveActivityReturn {
  startActivity: (
    taskId: string,
    taskTitle: string,
    totalSteps?: number
  ) => Promise<string | null>;
  updateProgress: (
    activityId: string,
    currentStep: number,
    totalSteps: number
  ) => Promise<void>;
  completeActivity: (activityId: string) => Promise<void>;
  cancelActivity: (activityId: string) => Promise<void>;
  pauseActivity: (activityId: string) => Promise<void>;
  resumeActivity: (activityId: string) => Promise<void>;
}

/**
 * Hook for managing Live Activities
 */
export function useTaskLiveActivity(): UseTaskLiveActivityReturn {
  const startActivity = async (
    taskId: string,
    taskTitle: string,
    totalSteps: number = 1
  ): Promise<string | null> => {
    return await TaskLiveActivity.start(taskId, taskTitle, totalSteps);
  };

  const updateProgress = async (
    activityId: string,
    currentStep: number,
    totalSteps: number
  ): Promise<void> => {
    await TaskLiveActivity.updateProgress(activityId, currentStep, totalSteps);
  };

  const completeActivity = async (activityId: string): Promise<void> => {
    await TaskLiveActivity.complete(activityId);
  };

  const cancelActivity = async (activityId: string): Promise<void> => {
    await TaskLiveActivity.cancel(activityId);
  };

  const pauseActivity = async (activityId: string): Promise<void> => {
    await TaskLiveActivity.pause(activityId);
  };

  const resumeActivity = async (activityId: string): Promise<void> => {
    await TaskLiveActivity.resume(activityId);
  };

  return {
    startActivity,
    updateProgress,
    completeActivity,
    cancelActivity,
    pauseActivity,
    resumeActivity,
  };
}
