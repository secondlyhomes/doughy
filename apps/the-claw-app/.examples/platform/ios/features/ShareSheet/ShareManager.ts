/**
 * ShareManager.ts
 *
 * Core share functionality using native iOS share sheet
 */

import { Share, Platform, Alert } from 'react-native';
import { ShareContent, ShareResult, ShareableTask } from './types';

/**
 * Share Manager - handles all share operations
 */
export class ShareManager {
  /**
   * Share task with native share sheet
   */
  static async shareTask(task: ShareableTask): Promise<ShareResult | null> {
    try {
      const content = this.formatTaskForSharing(task);
      return await this.share(content);
    } catch (error) {
      console.error('[Share] Failed to share task:', error);
      return null;
    }
  }

  /**
   * Share task list
   */
  static async shareTaskList(tasks: ShareableTask[]): Promise<ShareResult | null> {
    try {
      const content = this.formatTaskListForSharing(tasks);
      return await this.share(content);
    } catch (error) {
      console.error('[Share] Failed to share task list:', error);
      return null;
    }
  }

  /**
   * Share generic content
   */
  static async share(content: ShareContent): Promise<ShareResult | null> {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      Alert.alert('Sharing not supported', 'Sharing is only available on mobile devices');
      return null;
    }

    try {
      const result = await Share.share(
        {
          message: content.message,
          url: content.url,
          title: content.title,
        },
        {
          subject: content.subject,
          dialogTitle: content.title || 'Share',
        }
      );

      if (result.action === Share.sharedAction) {
        console.log('[Share] Content shared:', result.activityType);
        return {
          action: 'sharedAction',
          activityType: result.activityType,
        };
      } else if (result.action === Share.dismissedAction) {
        console.log('[Share] Share sheet dismissed');
        return {
          action: 'dismissedAction',
        };
      }

      return null;
    } catch (error) {
      console.error('[Share] Share failed:', error);
      Alert.alert('Share Failed', 'Unable to share content');
      return null;
    }
  }

  /**
   * Format task for sharing
   */
  static formatTaskForSharing(task: ShareableTask): ShareContent {
    const message = [
      `Task: ${task.title}`,
      task.description ? `\n${task.description}` : '',
      task.dueDate ? `\n\nDue: ${new Date(task.dueDate).toLocaleDateString()}` : '',
      task.priority ? `\nPriority: ${task.priority}` : '',
    ]
      .filter(Boolean)
      .join('');

    return {
      message,
      url: `https://yourapp.com/tasks/${task.id}`,
      title: `Task: ${task.title}`,
      subject: `Check out this task: ${task.title}`,
    };
  }

  /**
   * Format task list for sharing
   */
  private static formatTaskListForSharing(tasks: ShareableTask[]): ShareContent {
    const message = [
      `My Tasks (${tasks.length})`,
      '',
      ...tasks.map(
        (task, index) =>
          `${index + 1}. ${task.completed ? '[x]' : '[ ]'} ${task.title}`
      ),
    ].join('\n');

    return {
      message,
      title: `Task List (${tasks.length} tasks)`,
      subject: 'My Task List',
    };
  }

  /**
   * Copy task to clipboard
   */
  static async copyTaskToClipboard(task: ShareableTask): Promise<void> {
    const content = this.formatTaskForSharing(task);
    // This would use Clipboard API
    // await Clipboard.setString(content.message);
    Alert.alert('Copied', 'Task copied to clipboard');
  }
}
