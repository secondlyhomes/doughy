/**
 * useHandoff.ts
 *
 * React hook for Handoff functionality
 */

import { useCallback } from 'react';
import { HandoffManager } from '../HandoffManager';
import type { HandoffActivityType, UseHandoffReturn } from '../types';

/**
 * Hook for Handoff functionality
 *
 * @param activityType - The type of Handoff activity
 * @returns Object with startActivity, updateActivity, and stopActivity functions
 */
export function useHandoff(
  activityType: HandoffActivityType | string
): UseHandoffReturn {
  const startActivity = useCallback(
    async (
      title: string,
      userInfo?: Record<string, unknown>,
      webpageURL?: string
    ) => {
      await HandoffManager.startActivity({
        activityType,
        title,
        userInfo,
        webpageURL,
      });
    },
    [activityType]
  );

  const updateActivity = useCallback(
    async (userInfo: Record<string, unknown>) => {
      await HandoffManager.updateActivity(userInfo);
    },
    []
  );

  const stopActivity = useCallback(async () => {
    await HandoffManager.stopActivity();
  }, []);

  return {
    startActivity,
    updateActivity,
    stopActivity,
  };
}
