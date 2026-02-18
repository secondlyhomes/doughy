// src/features/settings/services/seeders/common/dates.ts
// Date utilities for seeding

/**
 * Get a date relative to today
 * @param daysOffset - Number of days from today (negative for past)
 * @returns Date object
 */
export function getRelativeDate(daysOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

/**
 * Format a date for database storage (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get a relative date formatted for DB
 * @param daysOffset - Number of days from today
 * @returns Date string in YYYY-MM-DD format
 */
export function getRelativeDateString(daysOffset: number): string {
  return formatDateForDB(getRelativeDate(daysOffset));
}

/**
 * Get a date range for seeding
 * @param startOffset - Days from today for start
 * @param endOffset - Days from today for end
 * @returns Object with start_date and end_date strings
 */
export function getDateRange(startOffset: number, endOffset: number): { start_date: string; end_date: string } {
  return {
    start_date: getRelativeDateString(startOffset),
    end_date: getRelativeDateString(endOffset),
  };
}

/**
 * Get a timestamp relative to now
 * @param hoursOffset - Number of hours from now (negative for past)
 * @returns ISO timestamp string
 */
export function getRelativeTimestamp(hoursOffset: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
}
