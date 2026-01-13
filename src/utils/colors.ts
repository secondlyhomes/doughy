// src/utils/colors.ts
// Color utility functions for theme-aware color selection

import { ThemeColors } from '@/context/ThemeContext';

export type StatusType = 'success' | 'warning' | 'info' | 'destructive';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'other';

/**
 * Get the appropriate color for a status type
 */
export function getStatusColor(status: StatusType, colors: ThemeColors): string {
  const map: Record<StatusType, string> = {
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    destructive: colors.destructive,
  };
  return map[status] ?? colors.mutedForeground;
}

/**
 * Get color for positive/negative trend indicators
 */
export function getTrendColor(isPositive: boolean, colors: ThemeColors): string {
  return isPositive ? colors.success : colors.destructive;
}

/**
 * Get color for activity type icons
 */
export function getActivityColor(type: ActivityType, colors: ThemeColors): string {
  const map: Record<ActivityType, string> = {
    call: colors.info,
    email: colors.success,
    meeting: colors.primary,
    note: colors.warning,
    task: colors.mutedForeground,
    other: colors.mutedForeground,
  };
  return map[type] ?? colors.mutedForeground;
}
