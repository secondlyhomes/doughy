/**
 * Activity Feed Context Types
 *
 * TypeScript interfaces for the activity feed context.
 */

import type { ReactNode } from 'react';
import type { ActivityFeedItem, ActivityType } from '../../types';

/**
 * Props for the ActivityFeedProvider component
 */
export interface ActivityFeedProviderProps {
  children: ReactNode;
  currentUserId?: string;
  enableRealtime?: boolean;
}

/**
 * Internal state for the activity feed
 */
export interface ActivityFeedState {
  activities: ActivityFeedItem[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
}

/**
 * Actions available for managing the activity feed
 */
export interface ActivityFeedActions {
  loadActivities: (offset?: number, limit?: number) => Promise<void>;
  refreshActivities: () => Promise<void>;
  createActivity: (type: ActivityType, content?: Record<string, any>) => Promise<void>;
}

/**
 * Real-time event handlers for activity feed updates
 */
export interface ActivityFeedRealtimeHandlers {
  handleActivityInsert: (newActivity: ActivityFeedItem) => void;
  handleActivityUpdate: (updatedActivity: ActivityFeedItem) => void;
  handleActivityDelete: (activityId: string) => void;
}

/**
 * Re-export types from main types file for convenience
 */
export type { ActivityFeedItem, ActivityType, ActivityFeedContextValue } from '../../types';
