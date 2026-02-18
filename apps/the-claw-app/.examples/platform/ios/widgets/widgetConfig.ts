/**
 * widgetConfig.ts
 *
 * iOS Widget Configuration and Data Management
 *
 * This file handles:
 * - Widget size definitions
 * - Update frequency and timeline management
 * - Data fetching and synchronization
 * - Deep linking from widget to app
 * - Shared data storage between app and widget
 *
 * Requirements:
 * - iOS 14+ for basic widgets
 * - iOS 16+ for Live Activities
 * - App Groups enabled in Xcode
 * - WidgetKit framework
 *
 * Related docs:
 * - .examples/platform/ios/widgets/README.md
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Widget size definitions
export enum WidgetSize {
  Small = 'small',     // 2x2 grid
  Medium = 'medium',   // 4x2 grid
  Large = 'large',     // 4x4 grid
}

// Widget update frequency
export enum UpdateFrequency {
  Never = 'never',              // Manual updates only
  Hourly = 'hourly',            // Updates every hour
  HalfDaily = 'halfDaily',      // Updates twice per day
  Daily = 'daily',              // Updates once per day
  Adaptive = 'adaptive',        // System-determined updates
}

// Widget family (iOS terminology)
export enum WidgetFamily {
  SystemSmall = 'systemSmall',
  SystemMedium = 'systemMedium',
  SystemLarge = 'systemLarge',
  SystemExtraLarge = 'systemExtraLarge', // iPad only
}

// Deep link configuration
export interface WidgetDeepLink {
  url: string;
  action: string;
  params?: Record<string, any>;
}

// Widget data structure
export interface WidgetData {
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    category?: string;
  }>;
  completedCount: number;
  totalCount: number;
  lastUpdated: string;
}

// Timeline entry for widget updates
export interface TimelineEntry {
  date: Date;
  data: WidgetData;
  relevance?: number; // 0-100, higher = more relevant
}

/**
 * Widget Configuration Manager
 */
export class WidgetConfiguration {
  private static readonly SHARED_STORAGE_KEY = 'widget_data';
  private static readonly APP_GROUP_ID = 'group.com.yourapp.shared';

  /**
   * Configure widget with appropriate settings
   */
  static async configure(options: {
    updateFrequency: UpdateFrequency;
    enableBackgroundRefresh: boolean;
  }) {
    if (Platform.OS !== 'ios') {
      console.warn('Widgets are only supported on iOS');
      return;
    }

    // Store widget preferences
    await AsyncStorage.setItem('widget_update_frequency', options.updateFrequency);
    await AsyncStorage.setItem(
      'widget_background_refresh',
      options.enableBackgroundRefresh.toString()
    );

    // Request background refresh if enabled
    if (options.enableBackgroundRefresh) {
      // This would integrate with native module
      // NativeModules.WidgetKit.setBackgroundRefresh(true);
    }
  }

  /**
   * Get recommended widget sizes based on device
   */
  static getAvailableSizes(): WidgetFamily[] {
    const isIPad = Platform.isPad;

    if (isIPad) {
      return [
        WidgetFamily.SystemSmall,
        WidgetFamily.SystemMedium,
        WidgetFamily.SystemLarge,
        WidgetFamily.SystemExtraLarge,
      ];
    }

    return [
      WidgetFamily.SystemSmall,
      WidgetFamily.SystemMedium,
      WidgetFamily.SystemLarge,
    ];
  }

  /**
   * Get widget dimensions in points
   */
  static getDimensions(family: WidgetFamily): { width: number; height: number } {
    const isIPad = Platform.isPad;

    if (isIPad) {
      switch (family) {
        case WidgetFamily.SystemSmall:
          return { width: 141, height: 141 };
        case WidgetFamily.SystemMedium:
          return { width: 305, height: 141 };
        case WidgetFamily.SystemLarge:
          return { width: 305, height: 305 };
        case WidgetFamily.SystemExtraLarge:
          return { width: 634, height: 305 };
        default:
          return { width: 305, height: 141 };
      }
    }

    // iPhone dimensions (varies by device, these are for iPhone 14 Pro)
    switch (family) {
      case WidgetFamily.SystemSmall:
        return { width: 158, height: 158 };
      case WidgetFamily.SystemMedium:
        return { width: 338, height: 158 };
      case WidgetFamily.SystemLarge:
        return { width: 338, height: 354 };
      default:
        return { width: 338, height: 158 };
    }
  }
}

/**
 * Widget Data Manager
 * Handles data synchronization between app and widget
 */
export class WidgetDataManager {
  /**
   * Save data for widget to consume
   * Uses App Groups to share data between app and widget extension
   */
  static async saveWidgetData(data: WidgetData): Promise<void> {
    try {
      const serialized = JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString(),
      });

      // Save to AsyncStorage (for app access)
      await AsyncStorage.setItem('widget_data', serialized);

      // Save to shared App Group container (for widget access)
      // This requires native module integration
      // await NativeModules.WidgetKit.saveSharedData(serialized);

      console.log('Widget data saved successfully');
    } catch (error) {
      console.error('Failed to save widget data:', error);
      throw error;
    }
  }

  /**
   * Load widget data from shared storage
   */
  static async loadWidgetData(): Promise<WidgetData | null> {
    try {
      const data = await AsyncStorage.getItem('widget_data');
      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load widget data:', error);
      return null;
    }
  }

  /**
   * Clear widget data
   */
  static async clearWidgetData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('widget_data');
      // await NativeModules.WidgetKit.clearSharedData();
    } catch (error) {
      console.error('Failed to clear widget data:', error);
    }
  }
}

/**
 * Widget Timeline Manager
 * Manages when widgets should update
 */
export class WidgetTimelineManager {
  /**
   * Generate timeline entries for widget updates
   * Provides multiple snapshots for different times
   */
  static async generateTimeline(
    currentData: WidgetData,
    frequency: UpdateFrequency
  ): Promise<TimelineEntry[]> {
    const entries: TimelineEntry[] = [];
    const now = new Date();

    switch (frequency) {
      case UpdateFrequency.Hourly:
        // Generate 24 entries, one for each hour
        for (let i = 0; i < 24; i++) {
          const date = new Date(now);
          date.setHours(now.getHours() + i);

          entries.push({
            date,
            data: await this.fetchDataForTime(date),
            relevance: this.calculateRelevance(date),
          });
        }
        break;

      case UpdateFrequency.HalfDaily:
        // Morning and evening updates
        entries.push(
          {
            date: this.getNextTime(now, 9, 0), // 9 AM
            data: currentData,
            relevance: 80,
          },
          {
            date: this.getNextTime(now, 18, 0), // 6 PM
            data: currentData,
            relevance: 90,
          }
        );
        break;

      case UpdateFrequency.Daily:
        // Single daily update
        entries.push({
          date: this.getNextTime(now, 8, 0), // 8 AM
          data: currentData,
          relevance: 100,
        });
        break;

      case UpdateFrequency.Adaptive:
        // Let system determine update times
        entries.push({
          date: now,
          data: currentData,
          relevance: 50,
        });
        break;

      default:
        entries.push({
          date: now,
          data: currentData,
          relevance: 50,
        });
    }

    return entries;
  }

  /**
   * Calculate relevance score based on time of day
   */
  private static calculateRelevance(date: Date): number {
    const hour = date.getHours();

    // Higher relevance during work hours (9 AM - 6 PM)
    if (hour >= 9 && hour <= 18) {
      return 90;
    }
    // Medium relevance during early morning/evening (6-9 AM, 6-10 PM)
    if ((hour >= 6 && hour < 9) || (hour > 18 && hour <= 22)) {
      return 60;
    }
    // Low relevance during night
    return 30;
  }

  /**
   * Get next occurrence of specific time
   */
  private static getNextTime(from: Date, hour: number, minute: number): Date {
    const next = new Date(from);
    next.setHours(hour, minute, 0, 0);

    if (next <= from) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Fetch data for specific time (placeholder)
   */
  private static async fetchDataForTime(date: Date): Promise<WidgetData> {
    // In real implementation, this would fetch actual data
    // For now, return cached data
    return (await WidgetDataManager.loadWidgetData()) || {
      tasks: [],
      completedCount: 0,
      totalCount: 0,
      lastUpdated: date.toISOString(),
    };
  }
}

/**
 * Deep Link Handler
 * Manages navigation from widget to specific app screens
 */
export class WidgetDeepLinkHandler {
  private static readonly SCHEME = 'yourapp://';

  /**
   * Create deep link URL for widget action
   */
  static createDeepLink(action: string, params?: Record<string, any>): string {
    const baseUrl = `${this.SCHEME}${action}`;

    if (!params) {
      return baseUrl;
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    return `${baseUrl}?${queryString}`;
  }

  /**
   * Parse deep link URL
   */
  static parseDeepLink(url: string): WidgetDeepLink | null {
    try {
      if (!url.startsWith(this.SCHEME)) {
        return null;
      }

      const withoutScheme = url.replace(this.SCHEME, '');
      const [action, queryString] = withoutScheme.split('?');

      const params: Record<string, any> = {};
      if (queryString) {
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          params[key] = decodeURIComponent(value);
        });
      }

      return {
        url,
        action,
        params: Object.keys(params).length > 0 ? params : undefined,
      };
    } catch (error) {
      console.error('Failed to parse deep link:', error);
      return null;
    }
  }

  /**
   * Handle deep link navigation
   */
  static handleDeepLink(url: string, navigation: any): boolean {
    const deepLink = this.parseDeepLink(url);
    if (!deepLink) {
      return false;
    }

    switch (deepLink.action) {
      case 'tasks':
        navigation.navigate('Tasks', deepLink.params);
        return true;

      case 'task':
        if (deepLink.params?.id) {
          navigation.navigate('TaskDetail', { taskId: deepLink.params.id });
          return true;
        }
        return false;

      case 'add-task':
        navigation.navigate('AddTask', deepLink.params);
        return true;

      case 'completed':
        navigation.navigate('Tasks', { filter: 'completed' });
        return true;

      default:
        console.warn('Unknown deep link action:', deepLink.action);
        return false;
    }
  }
}

/**
 * Widget Refresh Manager
 * Handles manual and automatic widget refresh
 */
export class WidgetRefreshManager {
  /**
   * Reload all widgets
   */
  static async reloadAllWidgets(): Promise<void> {
    try {
      // This would call native module to reload widgets
      // await NativeModules.WidgetKit.reloadAllTimelines();
      console.log('All widgets reloaded');
    } catch (error) {
      console.error('Failed to reload widgets:', error);
    }
  }

  /**
   * Reload specific widget by kind
   */
  static async reloadWidget(kind: string): Promise<void> {
    try {
      // await NativeModules.WidgetKit.reloadTimeline(kind);
      console.log(`Widget ${kind} reloaded`);
    } catch (error) {
      console.error(`Failed to reload widget ${kind}:`, error);
    }
  }

  /**
   * Get current widget reload policy
   */
  static async getReloadPolicy(): Promise<{
    budget: number;
    used: number;
    nextReloadDate?: Date;
  }> {
    // Widget reload budget (typically ~40-70 per day depending on user behavior)
    // This would come from native module
    return {
      budget: 50,
      used: 10,
      nextReloadDate: new Date(Date.now() + 3600000), // 1 hour from now
    };
  }
}
