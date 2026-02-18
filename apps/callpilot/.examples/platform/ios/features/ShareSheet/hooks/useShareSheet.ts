/**
 * useShareSheet Hook
 *
 * Hook for sharing functionality with iOS share sheet
 */

import { ShareManager } from '../ShareManager';
import { ShareContent, ShareResult, ShareableTask } from '../types';

/**
 * Hook for sharing functionality
 */
export function useShare() {
  const shareTask = async (task: ShareableTask): Promise<ShareResult | null> => {
    return await ShareManager.shareTask(task);
  };

  const shareTaskList = async (tasks: ShareableTask[]): Promise<ShareResult | null> => {
    return await ShareManager.shareTaskList(tasks);
  };

  const shareCustom = async (content: ShareContent): Promise<ShareResult | null> => {
    return await ShareManager.share(content);
  };

  const copyToClipboard = async (task: ShareableTask): Promise<void> => {
    await ShareManager.copyTaskToClipboard(task);
  };

  return {
    shareTask,
    shareTaskList,
    shareCustom,
    copyToClipboard,
  };
}
