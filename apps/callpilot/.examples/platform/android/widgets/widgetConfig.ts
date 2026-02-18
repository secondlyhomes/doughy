/**
 * widgetConfig.ts
 *
 * Widget configuration for Android Home Screen Widgets
 *
 * This file contains:
 * - Widget size definitions
 * - Update strategies
 * - RemoteViews configuration
 * - Widget provider settings
 */

import { WidgetInfo, WidgetUpdateStrategy } from 'react-native-android-widget';

/**
 * Widget size configurations
 *
 * Based on Android widget grid cells:
 * - Small: 1x1 (70dp x 70dp)
 * - Medium: 2x2 (150dp x 150dp)
 * - Large: 4x2 (320dp x 150dp)
 * - Extra Large: 4x4 (320dp x 320dp)
 */
export const WIDGET_SIZES = {
  SMALL: {
    minWidth: 40,
    minHeight: 40,
    targetCells: { width: 1, height: 1 },
    maxCells: { width: 1, height: 1 },
  },
  MEDIUM: {
    minWidth: 110,
    minHeight: 110,
    targetCells: { width: 2, height: 2 },
    maxCells: { width: 2, height: 2 },
  },
  LARGE: {
    minWidth: 250,
    minHeight: 110,
    targetCells: { width: 4, height: 2 },
    maxCells: { width: 4, height: 2 },
  },
  EXTRA_LARGE: {
    minWidth: 250,
    minHeight: 250,
    targetCells: { width: 4, height: 4 },
    maxCells: { width: 5, height: 5 },
  },
} as const;

/**
 * Widget update strategies
 */
export const UPDATE_STRATEGIES = {
  // Update on every app launch
  ON_APP_LAUNCH: {
    type: 'manual' as const,
    description: 'Updates when app is opened',
  },

  // Update on data change
  ON_DATA_CHANGE: {
    type: 'manual' as const,
    description: 'Updates when task data changes',
  },

  // Periodic updates
  PERIODIC_15_MIN: {
    type: 'periodic' as const,
    intervalMs: 15 * 60 * 1000, // 15 minutes (minimum on Android)
    description: 'Updates every 15 minutes',
  },

  PERIODIC_30_MIN: {
    type: 'periodic' as const,
    intervalMs: 30 * 60 * 1000,
    description: 'Updates every 30 minutes',
  },

  PERIODIC_1_HOUR: {
    type: 'periodic' as const,
    intervalMs: 60 * 60 * 1000,
    description: 'Updates every hour',
  },

  // Background sync (requires WorkManager)
  BACKGROUND_SYNC: {
    type: 'background' as const,
    constraints: {
      requiresNetworkConnectivity: false,
      requiresCharging: false,
      requiresDeviceIdle: false,
    },
    description: 'Updates via background sync',
  },
} as const;

/**
 * Widget provider configuration
 */
export interface WidgetProviderConfig {
  widgetName: string;
  widgetLabel: string;
  description: string;
  previewImage: string;
  resizeMode: 'horizontal' | 'vertical' | 'none' | 'both';
  minWidth: number;
  minHeight: number;
  minResizeWidth?: number;
  minResizeHeight?: number;
  maxResizeWidth?: number;
  maxResizeHeight?: number;
  updatePeriodMillis: number;
  initialLayout: string;
  configure?: string; // Configuration activity
  widgetCategory?: 'home_screen' | 'keyguard' | 'searchbox';
}

/**
 * Small widget (1x1) configuration
 */
export const SMALL_WIDGET_CONFIG: WidgetProviderConfig = {
  widgetName: 'TaskWidgetSmall',
  widgetLabel: 'Tasks (Small)',
  description: 'Quick view of task completion',
  previewImage: '@drawable/widget_preview_small',
  resizeMode: 'none',
  minWidth: WIDGET_SIZES.SMALL.minWidth,
  minHeight: WIDGET_SIZES.SMALL.minHeight,
  updatePeriodMillis: UPDATE_STRATEGIES.PERIODIC_30_MIN.intervalMs,
  initialLayout: '@layout/widget_small',
  widgetCategory: 'home_screen',
};

/**
 * Medium widget (2x2) configuration
 */
export const MEDIUM_WIDGET_CONFIG: WidgetProviderConfig = {
  widgetName: 'TaskWidgetMedium',
  widgetLabel: 'Tasks',
  description: 'View and manage your tasks',
  previewImage: '@drawable/widget_preview_medium',
  resizeMode: 'both',
  minWidth: WIDGET_SIZES.MEDIUM.minWidth,
  minHeight: WIDGET_SIZES.MEDIUM.minHeight,
  minResizeWidth: WIDGET_SIZES.SMALL.minWidth,
  minResizeHeight: WIDGET_SIZES.SMALL.minHeight,
  updatePeriodMillis: UPDATE_STRATEGIES.PERIODIC_15_MIN.intervalMs,
  initialLayout: '@layout/widget_medium',
  widgetCategory: 'home_screen',
};

/**
 * Large widget (4x2) configuration
 */
export const LARGE_WIDGET_CONFIG: WidgetProviderConfig = {
  widgetName: 'TaskWidgetLarge',
  widgetLabel: 'Tasks (Large)',
  description: 'Detailed task list with actions',
  previewImage: '@drawable/widget_preview_large',
  resizeMode: 'horizontal',
  minWidth: WIDGET_SIZES.LARGE.minWidth,
  minHeight: WIDGET_SIZES.LARGE.minHeight,
  minResizeWidth: WIDGET_SIZES.MEDIUM.minWidth,
  maxResizeWidth: 500,
  updatePeriodMillis: UPDATE_STRATEGIES.PERIODIC_15_MIN.intervalMs,
  initialLayout: '@layout/widget_large',
  widgetCategory: 'home_screen',
};

/**
 * Extra large widget (4x4) configuration
 */
export const EXTRA_LARGE_WIDGET_CONFIG: WidgetProviderConfig = {
  widgetName: 'TaskWidgetExtraLarge',
  widgetLabel: 'Task Manager',
  description: 'Complete task management dashboard',
  previewImage: '@drawable/widget_preview_extra_large',
  resizeMode: 'both',
  minWidth: WIDGET_SIZES.EXTRA_LARGE.minWidth,
  minHeight: WIDGET_SIZES.EXTRA_LARGE.minHeight,
  minResizeWidth: WIDGET_SIZES.MEDIUM.minWidth,
  minResizeHeight: WIDGET_SIZES.MEDIUM.minHeight,
  updatePeriodMillis: UPDATE_STRATEGIES.PERIODIC_15_MIN.intervalMs,
  initialLayout: '@layout/widget_extra_large',
  configure: 'com.yourapp.WidgetConfigActivity',
  widgetCategory: 'home_screen',
};

/**
 * Widget info array for registration
 */
export const WIDGET_CONFIGS: WidgetInfo[] = [
  {
    name: SMALL_WIDGET_CONFIG.widgetName,
    label: SMALL_WIDGET_CONFIG.widgetLabel,
    description: SMALL_WIDGET_CONFIG.description,
    minWidth: SMALL_WIDGET_CONFIG.minWidth,
    minHeight: SMALL_WIDGET_CONFIG.minHeight,
    previewImage: SMALL_WIDGET_CONFIG.previewImage,
    updatePeriodMillis: SMALL_WIDGET_CONFIG.updatePeriodMillis,
  },
  {
    name: MEDIUM_WIDGET_CONFIG.widgetName,
    label: MEDIUM_WIDGET_CONFIG.widgetLabel,
    description: MEDIUM_WIDGET_CONFIG.description,
    minWidth: MEDIUM_WIDGET_CONFIG.minWidth,
    minHeight: MEDIUM_WIDGET_CONFIG.minHeight,
    previewImage: MEDIUM_WIDGET_CONFIG.previewImage,
    updatePeriodMillis: MEDIUM_WIDGET_CONFIG.updatePeriodMillis,
  },
  {
    name: LARGE_WIDGET_CONFIG.widgetName,
    label: LARGE_WIDGET_CONFIG.widgetLabel,
    description: LARGE_WIDGET_CONFIG.description,
    minWidth: LARGE_WIDGET_CONFIG.minWidth,
    minHeight: LARGE_WIDGET_CONFIG.minHeight,
    previewImage: LARGE_WIDGET_CONFIG.previewImage,
    updatePeriodMillis: LARGE_WIDGET_CONFIG.updatePeriodMillis,
  },
  {
    name: EXTRA_LARGE_WIDGET_CONFIG.widgetName,
    label: EXTRA_LARGE_WIDGET_CONFIG.widgetLabel,
    description: EXTRA_LARGE_WIDGET_CONFIG.description,
    minWidth: EXTRA_LARGE_WIDGET_CONFIG.minWidth,
    minHeight: EXTRA_LARGE_WIDGET_CONFIG.minHeight,
    previewImage: EXTRA_LARGE_WIDGET_CONFIG.previewImage,
    updatePeriodMillis: EXTRA_LARGE_WIDGET_CONFIG.updatePeriodMillis,
  },
];

/**
 * RemoteViews configuration
 */
export interface RemoteViewsConfig {
  packageName: string;
  layoutId: number;
  viewMappings: ViewMapping[];
}

export interface ViewMapping {
  viewId: number;
  type: 'text' | 'image' | 'progress' | 'button';
  dataKey: string;
  clickAction?: string;
}

/**
 * Widget click actions
 */
export const WIDGET_ACTIONS = {
  OPEN_APP: 'com.yourapp.OPEN_APP',
  ADD_TASK: 'com.yourapp.ADD_TASK',
  VIEW_ALL: 'com.yourapp.VIEW_ALL',
  TOGGLE_TASK: 'com.yourapp.TOGGLE_TASK',
  REFRESH: 'com.yourapp.REFRESH_WIDGET',
} as const;

/**
 * Widget update manager
 */
export class WidgetUpdateManager {
  /**
   * Request widget update
   */
  static async requestUpdate(widgetName?: string) {
    try {
      const { requestWidgetUpdate } = await import('react-native-android-widget');

      if (widgetName) {
        await requestWidgetUpdate({ widgetName });
      } else {
        // Update all widgets
        for (const config of WIDGET_CONFIGS) {
          await requestWidgetUpdate({ widgetName: config.name });
        }
      }
    } catch (error) {
      console.error('Failed to request widget update:', error);
    }
  }

  /**
   * Schedule periodic updates
   */
  static async schedulePeriodicUpdates(
    widgetName: string,
    intervalMs: number
  ) {
    try {
      const { scheduleWidgetUpdate } = await import('react-native-android-widget');

      await scheduleWidgetUpdate({
        widgetName,
        intervalMs,
      });
    } catch (error) {
      console.error('Failed to schedule widget updates:', error);
    }
  }

  /**
   * Cancel scheduled updates
   */
  static async cancelScheduledUpdates(widgetName: string) {
    try {
      const { cancelWidgetUpdate } = await import('react-native-android-widget');

      await cancelWidgetUpdate({ widgetName });
    } catch (error) {
      console.error('Failed to cancel widget updates:', error);
    }
  }
}

/**
 * Widget theme manager
 */
export class WidgetThemeManager {
  /**
   * Get Material You colors
   */
  static async getMaterialYouColors() {
    try {
      const { getMaterialYouColors } = await import('react-native-material-you');
      return await getMaterialYouColors();
    } catch (error) {
      console.error('Failed to get Material You colors:', error);
      return null;
    }
  }

  /**
   * Get widget theme
   */
  static async getWidgetTheme() {
    const materialYouColors = await this.getMaterialYouColors();

    if (materialYouColors) {
      return {
        primary: materialYouColors.primary,
        onPrimary: materialYouColors.onPrimary,
        primaryContainer: materialYouColors.primaryContainer,
        onPrimaryContainer: materialYouColors.onPrimaryContainer,
        surface: materialYouColors.surface,
        onSurface: materialYouColors.onSurface,
        surfaceVariant: materialYouColors.surfaceVariant,
        onSurfaceVariant: materialYouColors.onSurfaceVariant,
        outline: materialYouColors.outline,
      };
    }

    // Fallback theme
    return {
      primary: '#6750A4',
      onPrimary: '#FFFFFF',
      primaryContainer: '#EADDFF',
      onPrimaryContainer: '#21005D',
      surface: '#FFFBFE',
      onSurface: '#1C1B1F',
      surfaceVariant: '#E7E0EC',
      onSurfaceVariant: '#49454F',
      outline: '#79747E',
    };
  }
}

/**
 * Widget data sync
 */
export class WidgetDataSync {
  private static syncInProgress = false;

  /**
   * Sync widget data
   */
  static async syncData() {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Fetch latest data
      // Update widget data
      // Request widget updates
      await WidgetUpdateManager.requestUpdate();
    } catch (error) {
      console.error('Widget data sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Setup automatic sync on data changes
   */
  static setupAutoSync() {
    // Listen for task data changes
    // Trigger sync when data changes
    // Debounce to avoid excessive updates
  }
}

/**
 * Widget performance optimization
 */
export const WIDGET_PERFORMANCE = {
  // Maximum number of tasks to display
  MAX_TASKS_SMALL: 0,
  MAX_TASKS_MEDIUM: 3,
  MAX_TASKS_LARGE: 4,
  MAX_TASKS_EXTRA_LARGE: 9,

  // Image loading
  MAX_IMAGE_SIZE: 512, // pixels
  IMAGE_QUALITY: 0.8, // 0-1

  // Update throttling
  MIN_UPDATE_INTERVAL: 5000, // 5 seconds
  DEBOUNCE_DELAY: 1000, // 1 second

  // Data caching
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 100, // items
};

/**
 * Widget analytics
 */
export class WidgetAnalytics {
  /**
   * Track widget interaction
   */
  static trackInteraction(widgetName: string, action: string, metadata?: any) {
    console.log(`Widget interaction: ${widgetName} - ${action}`, metadata);
    // Send to analytics service
  }

  /**
   * Track widget install
   */
  static trackInstall(widgetName: string, size: string) {
    console.log(`Widget installed: ${widgetName} (${size})`);
    // Send to analytics service
  }

  /**
   * Track widget remove
   */
  static trackRemove(widgetName: string) {
    console.log(`Widget removed: ${widgetName}`);
    // Send to analytics service
  }

  /**
   * Track widget error
   */
  static trackError(widgetName: string, error: Error) {
    console.error(`Widget error: ${widgetName}`, error);
    // Send to error tracking service
  }
}
