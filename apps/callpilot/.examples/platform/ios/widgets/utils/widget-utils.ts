/**
 * widget-utils.ts
 *
 * Utility functions for iOS Task Widget
 */

// Re-export styles from dedicated file
export { getWidgetStyles } from './widget-styles';

/**
 * Format due date for display in widget
 */
export function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reset time portions for accurate date comparison
  const resetTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dateOnly = resetTime(date);
  const todayOnly = resetTime(today);
  const tomorrowOnly = resetTime(tomorrow);

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return 'Tomorrow';
  } else if (dateOnly < todayOnly) {
    return 'Overdue';
  } else {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
}

/**
 * Calculate completion percentage
 */
export function calculatePercentage(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
