/**
 * Date Parsing Module
 *
 * Extracts and parses dates from email content.
 *
 * @module _shared/parsers/date-parsing
 */

import type { DateRange } from "./types.ts";

// =============================================================================
// Date Patterns
// =============================================================================

const DATE_PATTERNS = [
  // "Feb 1 - Apr 30" or "February 1 to April 30"
  /(?:from\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?)\s*(?:-|to|through)\s*(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
  // "starting Feb 1" or "move in Feb 1"
  /(?:start(?:ing)?|move\s*in|check\s*in)\s*(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?)/i,
  // "for 13 weeks" or "for 3 months"
  /for\s+(\d+)\s*(week|month)s?/i,
  // "2/1/2025" or "02-01-2025"
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
];

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Parse flexible date formats to ISO string
 *
 * @param dateStr - Date string to parse
 * @returns ISO date string or undefined if parsing fails
 */
export function parseFlexibleDate(dateStr: string): string | undefined {
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      // If year not specified, use current or next year
      if (!/\d{4}/.test(dateStr)) {
        const now = new Date();
        if (parsed < now) {
          parsed.setFullYear(parsed.getFullYear() + 1);
        }
      }
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // Parsing failed
  }
  return undefined;
}

/**
 * Extract date range from email body
 *
 * @param body - Email body
 * @returns Extracted date range
 */
export function extractDates(body: string): DateRange {
  const dates: DateRange = {};

  // Try to find date range
  for (const pattern of DATE_PATTERNS) {
    const match = body.match(pattern);
    if (match) {
      if (match[2] && /week|month/i.test(match[2])) {
        // Duration pattern: "for 13 weeks"
        const count = parseInt(match[1]);
        if (match[2].toLowerCase().includes('week')) {
          dates.duration_weeks = count;
        } else {
          dates.duration_months = count;
        }
      } else if (match[1] && match[2] && !match[3]) {
        // Range pattern: "Feb 1 - Apr 30"
        dates.start_date = parseFlexibleDate(match[1]);
        dates.end_date = parseFlexibleDate(match[2]);
      } else if (match[1]) {
        // Start date pattern: "starting Feb 1"
        dates.start_date = parseFlexibleDate(match[1]);
      }
      break;
    }
  }

  // Check for flexibility
  if (/flexible|asap|as soon as/i.test(body)) {
    dates.flexible = true;
  }

  return dates;
}
