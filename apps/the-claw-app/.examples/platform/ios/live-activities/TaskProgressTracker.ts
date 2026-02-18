/**
 * TaskProgressTracker
 *
 * High-level class for tracking task progress with Live Activities.
 * Manages the activity lifecycle automatically.
 */

import { TaskLiveActivity } from './TaskLiveActivity';

/**
 * Task progress tracker with automatic Live Activity management
 */
export class TaskProgressTracker {
  private activityId: string | null = null;

  /**
   * Start tracking a task with Live Activity
   */
  async startTracking(
    taskId: string,
    taskTitle: string,
    totalSteps: number
  ): Promise<void> {
    this.activityId = await TaskLiveActivity.start(
      taskId,
      taskTitle,
      totalSteps
    );

    if (this.activityId) {
      console.log('[TaskTracker] Started tracking:', this.activityId);
    }
  }

  /**
   * Update current step progress
   */
  async updateStep(currentStep: number, totalSteps: number): Promise<void> {
    if (!this.activityId) return;

    await TaskLiveActivity.updateProgress(
      this.activityId,
      currentStep,
      totalSteps
    );
  }

  /**
   * Pause the tracking
   */
  async pauseTracking(): Promise<void> {
    if (!this.activityId) return;
    await TaskLiveActivity.pause(this.activityId);
  }

  /**
   * Resume the tracking
   */
  async resumeTracking(): Promise<void> {
    if (!this.activityId) return;
    await TaskLiveActivity.resume(this.activityId);
  }

  /**
   * Complete the tracking (dismisses after 5 seconds)
   */
  async completeTracking(): Promise<void> {
    if (!this.activityId) return;

    await TaskLiveActivity.complete(this.activityId, {
      dismissAfter: 5,
      finalMessage: 'Task completed!',
    });

    this.activityId = null;
  }

  /**
   * Cancel the tracking immediately
   */
  async cancelTracking(): Promise<void> {
    if (!this.activityId) return;

    await TaskLiveActivity.cancel(this.activityId);
    this.activityId = null;
  }

  /**
   * Check if currently tracking
   */
  isTracking(): boolean {
    return this.activityId !== null;
  }

  /**
   * Get current activity ID (if tracking)
   */
  getActivityId(): string | null {
    return this.activityId;
  }
}
