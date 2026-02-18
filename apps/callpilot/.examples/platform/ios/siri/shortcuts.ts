/**
 * shortcuts.ts
 *
 * Siri Shortcuts Integration
 *
 * This file provides:
 * - Shortcut donation (NSUserActivity)
 * - Suggested shortcuts
 * - Intent handling
 * - Voice phrase management
 *
 * Requirements:
 * - npm install react-native-siri-shortcut (or similar)
 * - iOS 12+ for Siri Shortcuts
 * - iOS 13+ for parameter-based shortcuts
 * - Intents.intentdefinition file in Xcode
 *
 * Related docs:
 * - .examples/platform/ios/siri/README.md
 * - .examples/platform/ios/siri/IntentHandler.tsx
 */

import { Platform, NativeModules } from 'react-native';

// Types for Siri Shortcuts
export interface ShortcutOptions {
  activityType: string;
  title: string;
  userInfo?: Record<string, any>;
  keywords?: string[];
  persistentIdentifier?: string;
  isEligibleForSearch?: boolean;
  isEligibleForPrediction?: boolean;
  suggestedInvocationPhrase?: string;
  needsSave?: boolean;
}

export interface SuggestedShortcut {
  phrase: string;
  title: string;
  shortcutType: string;
}

export interface ShortcutActivity {
  activityType: string;
  title: string;
  userInfo: Record<string, any>;
}

// Shortcut activity types
export enum ShortcutActivityType {
  CreateTask = 'com.yourapp.createTask',
  CompleteTask = 'com.yourapp.completeTask',
  ViewTasks = 'com.yourapp.viewTasks',
  ViewTask = 'com.yourapp.viewTask',
  AddQuickTask = 'com.yourapp.addQuickTask',
  MarkAllComplete = 'com.yourapp.markAllComplete',
  ViewCompletedTasks = 'com.yourapp.viewCompletedTasks',
  SearchTasks = 'com.yourapp.searchTasks',
}

/**
 * Main Siri Shortcuts Manager
 */
export class SiriShortcuts {
  private static isAvailable(): boolean {
    return Platform.OS === 'ios' && Platform.Version >= 12;
  }

  /**
   * Donate a shortcut for creating a new task
   */
  static async donateCreateTask(taskTitle: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.donateShortcut({
        activityType: ShortcutActivityType.CreateTask,
        title: `Create task: ${taskTitle}`,
        persistentIdentifier: `create-task-${Date.now()}`,
        userInfo: {
          taskTitle,
          action: 'create',
        },
        keywords: ['create', 'task', 'new', 'add', taskTitle.toLowerCase()],
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        suggestedInvocationPhrase: `Create task ${taskTitle}`,
      });

      console.log('[Siri] Donated create task shortcut:', taskTitle);
    } catch (error) {
      console.error('[Siri] Failed to donate create task shortcut:', error);
    }
  }

  /**
   * Donate a shortcut for completing a task
   */
  static async donateCompleteTask(
    taskId: string,
    taskTitle: string
  ): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.donateShortcut({
        activityType: ShortcutActivityType.CompleteTask,
        title: `Complete task: ${taskTitle}`,
        persistentIdentifier: `complete-task-${taskId}`,
        userInfo: {
          taskId,
          taskTitle,
          action: 'complete',
        },
        keywords: ['complete', 'finish', 'done', 'task', taskTitle.toLowerCase()],
        isEligibleForPrediction: true,
        suggestedInvocationPhrase: `Complete ${taskTitle}`,
      });

      console.log('[Siri] Donated complete task shortcut:', taskTitle);
    } catch (error) {
      console.error('[Siri] Failed to donate complete task shortcut:', error);
    }
  }

  /**
   * Donate a shortcut for viewing tasks
   */
  static async donateViewTasks(filter?: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const title = filter ? `View ${filter} tasks` : 'View my tasks';
      const phrase = filter ? `Show my ${filter} tasks` : 'Show my tasks';

      await this.donateShortcut({
        activityType: ShortcutActivityType.ViewTasks,
        title,
        persistentIdentifier: filter ? `view-tasks-${filter}` : 'view-tasks',
        userInfo: {
          filter: filter || 'all',
          action: 'view',
        },
        keywords: ['view', 'show', 'tasks', 'list', filter?.toLowerCase()].filter(
          Boolean
        ) as string[],
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        suggestedInvocationPhrase: phrase,
      });

      console.log('[Siri] Donated view tasks shortcut:', filter);
    } catch (error) {
      console.error('[Siri] Failed to donate view tasks shortcut:', error);
    }
  }

  /**
   * Donate a shortcut for viewing specific task
   */
  static async donateViewTask(taskId: string, taskTitle: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.donateShortcut({
        activityType: ShortcutActivityType.ViewTask,
        title: `View task: ${taskTitle}`,
        persistentIdentifier: `view-task-${taskId}`,
        userInfo: {
          taskId,
          taskTitle,
          action: 'viewTask',
        },
        keywords: ['view', 'show', 'task', taskTitle.toLowerCase()],
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        suggestedInvocationPhrase: `Show ${taskTitle}`,
      });

      console.log('[Siri] Donated view task shortcut:', taskTitle);
    } catch (error) {
      console.error('[Siri] Failed to donate view task shortcut:', error);
    }
  }

  /**
   * Donate a quick add shortcut (no parameters)
   */
  static async donateQuickAdd(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.donateShortcut({
        activityType: ShortcutActivityType.AddQuickTask,
        title: 'Add a task',
        persistentIdentifier: 'quick-add-task',
        userInfo: {
          action: 'quickAdd',
        },
        keywords: ['add', 'create', 'new', 'task', 'quick'],
        isEligibleForSearch: true,
        isEligibleForPrediction: true,
        suggestedInvocationPhrase: 'Add a task',
      });

      console.log('[Siri] Donated quick add shortcut');
    } catch (error) {
      console.error('[Siri] Failed to donate quick add shortcut:', error);
    }
  }

  /**
   * Donate mark all complete shortcut
   */
  static async donateMarkAllComplete(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      await this.donateShortcut({
        activityType: ShortcutActivityType.MarkAllComplete,
        title: 'Mark all tasks complete',
        persistentIdentifier: 'mark-all-complete',
        userInfo: {
          action: 'markAllComplete',
        },
        keywords: ['complete', 'finish', 'all', 'tasks', 'done'],
        isEligibleForPrediction: true,
        suggestedInvocationPhrase: 'Complete all my tasks',
      });

      console.log('[Siri] Donated mark all complete shortcut');
    } catch (error) {
      console.error('[Siri] Failed to donate mark all complete shortcut:', error);
    }
  }

  /**
   * Generic shortcut donation
   */
  private static async donateShortcut(options: ShortcutOptions): Promise<void> {
    try {
      // This would call native module
      // await NativeModules.SiriShortcuts.donateShortcut(options);

      // For now, just log
      console.log('[Siri] Would donate shortcut:', options);
    } catch (error) {
      console.error('[Siri] Failed to donate shortcut:', error);
      throw error;
    }
  }

  /**
   * Setup suggested shortcuts (appears in Settings and Shortcuts app)
   */
  static async setupSuggestedShortcuts(): Promise<void> {
    if (!this.isAvailable()) return;

    const suggestions: SuggestedShortcut[] = [
      {
        phrase: 'Show my tasks',
        title: 'View Tasks',
        shortcutType: ShortcutActivityType.ViewTasks,
      },
      {
        phrase: 'Add a task',
        title: 'Create Task',
        shortcutType: ShortcutActivityType.CreateTask,
      },
      {
        phrase: 'Show completed tasks',
        title: 'View Completed',
        shortcutType: ShortcutActivityType.ViewCompletedTasks,
      },
      {
        phrase: 'Complete my tasks',
        title: 'Mark All Complete',
        shortcutType: ShortcutActivityType.MarkAllComplete,
      },
    ];

    try {
      // This would call native module
      // await NativeModules.SiriShortcuts.setSuggestedShortcuts(suggestions);

      console.log('[Siri] Setup suggested shortcuts:', suggestions.length);
    } catch (error) {
      console.error('[Siri] Failed to setup suggested shortcuts:', error);
    }
  }

  /**
   * Delete specific shortcut
   */
  static async deleteShortcut(persistentIdentifier: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      // await NativeModules.SiriShortcuts.deleteShortcut(persistentIdentifier);
      console.log('[Siri] Deleted shortcut:', persistentIdentifier);
    } catch (error) {
      console.error('[Siri] Failed to delete shortcut:', error);
    }
  }

  /**
   * Delete all shortcuts
   */
  static async deleteAllShortcuts(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      // await NativeModules.SiriShortcuts.deleteAllShortcuts();
      console.log('[Siri] Deleted all shortcuts');
    } catch (error) {
      console.error('[Siri] Failed to delete all shortcuts:', error);
    }
  }

  /**
   * Present add to Siri UI
   */
  static async presentAddToSiri(shortcut: ShortcutOptions): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      // This presents native "Add to Siri" UI
      // const added = await NativeModules.SiriShortcuts.presentAddToSiri(shortcut);
      console.log('[Siri] Present add to Siri UI:', shortcut.title);
      return true;
    } catch (error) {
      console.error('[Siri] Failed to present add to Siri:', error);
      return false;
    }
  }
}

/**
 * Hook for easy shortcut donations in components
 */
export function useSiriShortcuts() {
  const donateCreateTask = async (taskTitle: string) => {
    await SiriShortcuts.donateCreateTask(taskTitle);
  };

  const donateCompleteTask = async (taskId: string, taskTitle: string) => {
    await SiriShortcuts.donateCompleteTask(taskId, taskTitle);
  };

  const donateViewTasks = async (filter?: string) => {
    await SiriShortcuts.donateViewTasks(filter);
  };

  const donateViewTask = async (taskId: string, taskTitle: string) => {
    await SiriShortcuts.donateViewTask(taskId, taskTitle);
  };

  const presentAddToSiri = async (shortcut: ShortcutOptions) => {
    return await SiriShortcuts.presentAddToSiri(shortcut);
  };

  return {
    donateCreateTask,
    donateCompleteTask,
    donateViewTasks,
    donateViewTask,
    presentAddToSiri,
  };
}

/**
 * Utility: Generate suggested invocation phrases
 */
export class InvocationPhraseGenerator {
  /**
   * Generate phrase for creating a task
   */
  static createTask(taskTitle: string): string {
    const variations = [
      `Create task ${taskTitle}`,
      `Add ${taskTitle} to my tasks`,
      `New task ${taskTitle}`,
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Generate phrase for completing a task
   */
  static completeTask(taskTitle: string): string {
    const variations = [
      `Complete ${taskTitle}`,
      `Mark ${taskTitle} as done`,
      `Finish ${taskTitle}`,
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Generate phrase for viewing tasks
   */
  static viewTasks(filter?: string): string {
    if (filter) {
      return `Show my ${filter} tasks`;
    }

    const variations = [
      'Show my tasks',
      'View my tasks',
      'What are my tasks',
      'List my tasks',
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * Validate phrase meets Apple guidelines
   */
  static validatePhrase(phrase: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Length: 2-100 characters
    if (phrase.length < 2 || phrase.length > 100) {
      errors.push('Phrase must be 2-100 characters');
    }

    // Should not start with "Hey Siri"
    if (phrase.toLowerCase().startsWith('hey siri')) {
      errors.push('Phrase should not start with "Hey Siri"');
    }

    // Should not be a question
    if (phrase.endsWith('?')) {
      errors.push('Phrase should be a statement, not a question');
    }

    // Should not contain app name (Apple removes it)
    const commonAppWords = ['app', 'application'];
    if (commonAppWords.some(word => phrase.toLowerCase().includes(word))) {
      errors.push('Phrase should not contain "app" or "application"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Shortcut donation tracker
 * Prevents over-donation and tracks usage patterns
 */
export class ShortcutDonationTracker {
  private static donations = new Map<string, Date>();
  private static readonly MIN_INTERVAL = 60000; // 1 minute between same donations

  /**
   * Check if should donate shortcut
   */
  static shouldDonate(activityType: string): boolean {
    const lastDonation = this.donations.get(activityType);
    if (!lastDonation) return true;

    const elapsed = Date.now() - lastDonation.getTime();
    return elapsed >= this.MIN_INTERVAL;
  }

  /**
   * Record donation
   */
  static recordDonation(activityType: string): void {
    this.donations.set(activityType, new Date());
  }

  /**
   * Get donation statistics
   */
  static getStats(): {
    totalDonations: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};

    this.donations.forEach((_, type) => {
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      totalDonations: this.donations.size,
      byType,
    };
  }

  /**
   * Clear old donations
   */
  static cleanup(olderThan: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan;

    this.donations.forEach((date, type) => {
      if (date.getTime() < cutoff) {
        this.donations.delete(type);
      }
    });
  }
}
