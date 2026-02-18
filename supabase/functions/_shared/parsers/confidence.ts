/**
 * Confidence Calculation Module
 *
 * Calculates parsing confidence scores.
 *
 * @module _shared/parsers/confidence
 */

import type { ParsedEmailResult } from "./types.ts";

/**
 * Calculate parsing confidence score
 *
 * @param result - Partial parsed result
 * @returns Confidence score between 0 and 1
 */
export function calculateParsingConfidence(result: Partial<ParsedEmailResult>): number {
  let score = 0.5; // Base confidence

  // Platform detection
  if (result.platform && result.platform !== 'unknown') {
    score += 0.1;
  }

  // Contact info
  if (result.contact?.full_name) score += 0.1;
  if (result.contact?.email) score += 0.1;
  if (result.contact?.phone) score += 0.05;

  // Dates
  if (result.dates?.start_date) score += 0.1;
  if (result.dates?.duration_weeks || result.dates?.duration_months) score += 0.05;

  // Profession (important for lead scoring)
  if (result.contact?.profession && result.contact.profession !== 'unknown') {
    score += 0.1;
  }

  return Math.min(1, score);
}
