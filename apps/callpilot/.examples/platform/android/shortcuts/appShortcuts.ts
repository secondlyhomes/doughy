/**
 * appShortcuts.ts
 *
 * Android App Shortcuts implementation
 *
 * Types:
 * - Static shortcuts (defined in XML)
 * - Dynamic shortcuts (runtime)
 * - Pinned shortcuts (user-pinned to home screen)
 *
 * Requirements:
 * - Android 7.1+ (API 25+) for basic shortcuts
 * - Android 8.0+ (API 26+) for pinned shortcuts
 *
 * Setup:
 * 1. Define static shortcuts in XML
 * 2. Configure AndroidManifest.xml
 * 3. Implement dynamic shortcuts
 * 4. Handle deep links
 */

import { NativeModules, Linking, Platform } from 'react-native';

const { ShortcutModule } = NativeModules;

/**
 * Shortcut types
 */
export interface Shortcut {
  id: string;
  shortLabel: string;
  longLabel: string;
  disabledMessage?: string;
  icon: string;
  intent: ShortcutIntent;
  categories?: string[];
  rank?: number;
  enabled?: boolean;
}

export interface ShortcutIntent {
  action: string;
  data?: string;
  extras?: Record<string, any>;
}

export interface PinnedShortcut extends Shortcut {
  iconBitmap?: string; // Base64 encoded bitmap
  iconAdaptive?: {
    foreground: string;
    background: string;
  };
}

/**
 * App Shortcuts Manager
 */
export class AppShortcuts {
  /**
   * Check if shortcuts are supported
   */
  static isSupported(): boolean {
    if (Platform.OS !== 'android') return false;
    return Platform.Version >= 25;
  }

  /**
   * Check if pinned shortcuts are supported
   */
  static isPinnedShortcutsSupported(): boolean {
    if (Platform.OS !== 'android') return false;
    return Platform.Version >= 26;
  }

  /**
   * Set dynamic shortcuts
   * Replaces all existing dynamic shortcuts
   */
  static async setDynamicShortcuts(shortcuts: Shortcut[]): Promise<void> {
    if (!this.isSupported()) {
      console.warn('App shortcuts not supported on this platform');
      return;
    }

    try {
      await ShortcutModule.setDynamicShortcuts(shortcuts);
    } catch (error) {
      console.error('Failed to set dynamic shortcuts:', error);
      throw error;
    }
  }

  /**
   * Add dynamic shortcuts
   * Adds to existing shortcuts (up to max limit)
   */
  static async addDynamicShortcuts(shortcuts: Shortcut[]): Promise<void> {
    if (!this.isSupported()) {
      console.warn('App shortcuts not supported on this platform');
      return;
    }

    try {
      await ShortcutModule.addDynamicShortcuts(shortcuts);
    } catch (error) {
      console.error('Failed to add dynamic shortcuts:', error);
      throw error;
    }
  }

  /**
   * Update shortcuts
   */
  static async updateShortcuts(shortcuts: Shortcut[]): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await ShortcutModule.updateShortcuts(shortcuts);
    } catch (error) {
      console.error('Failed to update shortcuts:', error);
      throw error;
    }
  }

  /**
   * Remove dynamic shortcuts by IDs
   */
  static async removeDynamicShortcuts(shortcutIds: string[]): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await ShortcutModule.removeDynamicShortcuts(shortcutIds);
    } catch (error) {
      console.error('Failed to remove dynamic shortcuts:', error);
      throw error;
    }
  }

  /**
   * Remove all dynamic shortcuts
   */
  static async removeAllDynamicShortcuts(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await ShortcutModule.removeAllDynamicShortcuts();
    } catch (error) {
      console.error('Failed to remove all dynamic shortcuts:', error);
      throw error;
    }
  }

  /**
   * Request to pin shortcut to home screen
   */
  static async requestPinShortcut(shortcut: PinnedShortcut): Promise<boolean> {
    if (!this.isPinnedShortcutsSupported()) {
      console.warn('Pinned shortcuts not supported on this platform');
      return false;
    }

    try {
      const result = await ShortcutModule.requestPinShortcut(shortcut);
      return result;
    } catch (error) {
      console.error('Failed to request pin shortcut:', error);
      return false;
    }
  }

  /**
   * Disable shortcuts
   */
  static async disableShortcuts(
    shortcutIds: string[],
    disabledMessage?: string
  ): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await ShortcutModule.disableShortcuts(shortcutIds, disabledMessage);
    } catch (error) {
      console.error('Failed to disable shortcuts:', error);
      throw error;
    }
  }

  /**
   * Enable shortcuts
   */
  static async enableShortcuts(shortcutIds: string[]): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await ShortcutModule.enableShortcuts(shortcutIds);
    } catch (error) {
      console.error('Failed to enable shortcuts:', error);
      throw error;
    }
  }

  /**
   * Get maximum shortcut count
   */
  static async getMaxShortcutCountPerActivity(): Promise<number> {
    if (!this.isSupported()) return 0;

    try {
      const count = await ShortcutModule.getMaxShortcutCountPerActivity();
      return count;
    } catch (error) {
      console.error('Failed to get max shortcut count:', error);
      return 0;
    }
  }

  /**
   * Report shortcut usage
   */
  static async reportShortcutUsed(shortcutId: string): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await ShortcutModule.reportShortcutUsed(shortcutId);
    } catch (error) {
      console.error('Failed to report shortcut usage:', error);
    }
  }
}

/**
 * Predefined app shortcuts
 */
export const DEFAULT_SHORTCUTS = {
  /**
   * Create new task shortcut
   */
  createTask: {
    id: 'create-task',
    shortLabel: 'New Task',
    longLabel: 'Create a new task',
    disabledMessage: 'Task creation is disabled',
    icon: 'ic_add_shortcut',
    intent: {
      action: 'android.intent.action.VIEW',
      data: 'yourapp://tasks/new',
    },
    categories: ['android.shortcut.conversation'],
    rank: 0,
  } as Shortcut,

  /**
   * View all tasks shortcut
   */
  viewTasks: {
    id: 'view-tasks',
    shortLabel: 'My Tasks',
    longLabel: 'View all my tasks',
    icon: 'ic_list_shortcut',
    intent: {
      action: 'android.intent.action.VIEW',
      data: 'yourapp://tasks',
    },
    rank: 1,
  } as Shortcut,

  /**
   * View completed tasks
   */
  viewCompleted: {
    id: 'view-completed',
    shortLabel: 'Completed',
    longLabel: 'View completed tasks',
    icon: 'ic_check_shortcut',
    intent: {
      action: 'android.intent.action.VIEW',
      data: 'yourapp://tasks?filter=completed',
    },
    rank: 2,
  } as Shortcut,

  /**
   * Quick voice task
   */
  voiceTask: {
    id: 'voice-task',
    shortLabel: 'Voice Task',
    longLabel: 'Create task with voice',
    icon: 'ic_mic_shortcut',
    intent: {
      action: 'android.intent.action.VIEW',
      data: 'yourapp://tasks/new?mode=voice',
    },
    rank: 3,
  } as Shortcut,
};

/**
 * Dynamic Shortcuts Manager
 */
export class DynamicShortcutsManager {
  /**
   * Initialize default shortcuts
   */
  static async initializeDefaults(): Promise<void> {
    const shortcuts = [
      DEFAULT_SHORTCUTS.createTask,
      DEFAULT_SHORTCUTS.viewTasks,
      DEFAULT_SHORTCUTS.viewCompleted,
    ];

    await AppShortcuts.setDynamicShortcuts(shortcuts);
  }

  /**
   * Add recent tasks as shortcuts
   */
  static async updateRecentTasks(tasks: any[]): Promise<void> {
    const recentShortcuts = tasks.slice(0, 3).map((task, index) => ({
      id: `task-${task.id}`,
      shortLabel: task.title,
      longLabel: `Open "${task.title}"`,
      icon: task.completed ? 'ic_check_shortcut' : 'ic_task_shortcut',
      intent: {
        action: 'android.intent.action.VIEW',
        data: `yourapp://tasks/${task.id}`,
      },
      rank: index + 4, // After default shortcuts
    }));

    await AppShortcuts.addDynamicShortcuts(recentShortcuts);
  }

  /**
   * Add project shortcuts
   */
  static async updateProjects(projects: any[]): Promise<void> {
    const projectShortcuts = projects.slice(0, 2).map((project, index) => ({
      id: `project-${project.id}`,
      shortLabel: project.name,
      longLabel: `View ${project.name} tasks`,
      icon: 'ic_folder_shortcut',
      intent: {
        action: 'android.intent.action.VIEW',
        data: `yourapp://projects/${project.id}`,
      },
      rank: index + 7,
    }));

    await AppShortcuts.addDynamicShortcuts(projectShortcuts);
  }

  /**
   * Remove outdated shortcuts
   */
  static async cleanupOldShortcuts(): Promise<void> {
    // Remove shortcuts for deleted tasks
    const shortcuts = await this.getCurrentShortcuts();
    const taskIds = await this.getExistingTaskIds();

    const outdatedIds = shortcuts
      .filter(
        (s: Shortcut) => s.id.startsWith('task-') && !taskIds.includes(s.id.replace('task-', ''))
      )
      .map((s: Shortcut) => s.id);

    if (outdatedIds.length > 0) {
      await AppShortcuts.removeDynamicShortcuts(outdatedIds);
    }
  }

  private static async getCurrentShortcuts(): Promise<Shortcut[]> {
    // Implementation would call native module
    return [];
  }

  private static async getExistingTaskIds(): Promise<string[]> {
    // Implementation would query database
    return [];
  }
}

/**
 * Pinned Shortcuts Manager
 */
export class PinnedShortcutsManager {
  /**
   * Pin task shortcut
   */
  static async pinTask(task: any): Promise<boolean> {
    const shortcut: PinnedShortcut = {
      id: `pinned-task-${task.id}`,
      shortLabel: task.title,
      longLabel: `Open "${task.title}"`,
      icon: 'ic_task_shortcut',
      intent: {
        action: 'android.intent.action.VIEW',
        data: `yourapp://tasks/${task.id}`,
      },
    };

    return await AppShortcuts.requestPinShortcut(shortcut);
  }

  /**
   * Pin project shortcut
   */
  static async pinProject(project: any): Promise<boolean> {
    const shortcut: PinnedShortcut = {
      id: `pinned-project-${project.id}`,
      shortLabel: project.name,
      longLabel: `View ${project.name}`,
      icon: 'ic_folder_shortcut',
      intent: {
        action: 'android.intent.action.VIEW',
        data: `yourapp://projects/${project.id}`,
      },
    };

    return await AppShortcuts.requestPinShortcut(shortcut);
  }

  /**
   * Pin custom action
   */
  static async pinCustomAction(
    id: string,
    label: string,
    icon: string,
    deepLink: string
  ): Promise<boolean> {
    const shortcut: PinnedShortcut = {
      id: `pinned-${id}`,
      shortLabel: label,
      longLabel: label,
      icon,
      intent: {
        action: 'android.intent.action.VIEW',
        data: deepLink,
      },
    };

    return await AppShortcuts.requestPinShortcut(shortcut);
  }

  /**
   * Create adaptive icon shortcut
   */
  static async pinWithAdaptiveIcon(
    id: string,
    label: string,
    foregroundIcon: string,
    backgroundColor: string,
    deepLink: string
  ): Promise<boolean> {
    const shortcut: PinnedShortcut = {
      id: `pinned-${id}`,
      shortLabel: label,
      longLabel: label,
      icon: 'ic_shortcut_foreground',
      iconAdaptive: {
        foreground: foregroundIcon,
        background: backgroundColor,
      },
      intent: {
        action: 'android.intent.action.VIEW',
        data: deepLink,
      },
    };

    return await AppShortcuts.requestPinShortcut(shortcut);
  }
}

/**
 * Shortcut Analytics
 */
export class ShortcutAnalytics {
  /**
   * Track shortcut usage
   */
  static async trackUsage(shortcutId: string): Promise<void> {
    await AppShortcuts.reportShortcutUsed(shortcutId);

    // Also track in your analytics
    console.log(`Shortcut used: ${shortcutId}`);
  }

  /**
   * Get popular shortcuts
   */
  static async getPopularShortcuts(): Promise<string[]> {
    // Implementation would track usage stats
    return [];
  }
}

/**
 * Deep Link Handler for Shortcuts
 */
export class ShortcutDeepLinkHandler {
  /**
   * Initialize deep link handling
   */
  static initialize(): void {
    Linking.addEventListener('url', this.handleDeepLink);

    // Handle initial URL if app was opened via shortcut
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink({ url });
      }
    });
  }

  /**
   * Handle deep link
   */
  private static handleDeepLink({ url }: { url: string }): void {
    if (!url) return;

    const route = url.replace(/.*?:\/\//g, '');
    const [path, queryString] = route.split('?');

    // Parse query parameters
    const params: Record<string, string> = {};
    if (queryString) {
      queryString.split('&').forEach((param) => {
        const [key, value] = param.split('=');
        params[key] = decodeURIComponent(value);
      });
    }

    // Route to appropriate screen
    this.navigateToRoute(path, params);
  }

  /**
   * Navigate to route
   */
  private static navigateToRoute(path: string, params: Record<string, string>): void {
    // Example routing logic
    if (path === 'tasks/new') {
      // Navigate to create task screen
      console.log('Navigate to create task', params);
    } else if (path.startsWith('tasks/')) {
      // Navigate to task detail
      const taskId = path.replace('tasks/', '');
      console.log('Navigate to task', taskId);
    } else if (path === 'tasks') {
      // Navigate to task list
      console.log('Navigate to tasks', params);
    } else if (path.startsWith('projects/')) {
      // Navigate to project detail
      const projectId = path.replace('projects/', '');
      console.log('Navigate to project', projectId);
    }
  }

  /**
   * Cleanup
   */
  static cleanup(): void {
    Linking.removeAllListeners('url');
  }
}

/**
 * Shortcut Best Practices
 */
export const SHORTCUT_LIMITS = {
  MAX_STATIC: 5,
  MAX_DYNAMIC: 15,
  MAX_TOTAL: 15,
  MAX_PINNED: Infinity,
};

export const SHORTCUT_RECOMMENDATIONS = {
  // Prioritize frequently used actions
  highPriority: ['create-task', 'view-tasks'],

  // Medium priority for occasional use
  mediumPriority: ['view-completed', 'voice-task'],

  // Low priority for rare actions
  lowPriority: ['settings', 'help'],
};
