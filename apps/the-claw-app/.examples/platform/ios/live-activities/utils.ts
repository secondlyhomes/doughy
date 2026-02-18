/**
 * Utility functions for iOS Live Activities
 */

import { Platform } from 'react-native';

/**
 * Minimum iOS version required for Live Activities
 */
const MIN_IOS_VERSION = 16.1;

/**
 * Average time per step for estimation (2 minutes)
 */
const AVG_TIME_PER_STEP_MS = 2 * 60 * 1000;

/**
 * Check if Live Activities are available on this device
 */
export function isLiveActivityAvailable(): boolean {
  return Platform.OS === 'ios' && parseFloat(Platform.Version as string) >= MIN_IOS_VERSION;
}

/**
 * Calculate progress percentage from current/total steps
 */
export function calculateProgress(currentStep: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.round((currentStep / totalSteps) * 100);
}

/**
 * Calculate estimated completion time based on remaining steps
 */
export function calculateEstimatedCompletion(
  currentStep: number,
  totalSteps: number
): string {
  if (currentStep === 0) return 'Calculating...';

  const remainingSteps = totalSteps - currentStep;
  const estimatedMs = remainingSteps * AVG_TIME_PER_STEP_MS;

  const estimatedDate = new Date(Date.now() + estimatedMs);
  const hours = estimatedDate.getHours();
  const minutes = estimatedDate.getMinutes();

  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Generate a unique activity ID
 */
export function generateActivityId(taskId: string): string {
  return `activity_${taskId}_${Date.now()}`;
}

/**
 * Log a Live Activity event
 */
export function logActivityEvent(
  event: string,
  activityId?: string,
  data?: unknown
): void {
  const message = activityId
    ? `[LiveActivity] ${event}: ${activityId}`
    : `[LiveActivity] ${event}`;

  if (data) {
    console.log(message, data);
  } else {
    console.log(message);
  }
}

/**
 * Log a Live Activity error
 */
export function logActivityError(event: string, error: unknown): void {
  console.error(`[LiveActivity] Failed to ${event}:`, error);
}
