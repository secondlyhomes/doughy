// src/features/rental-inbox/components/ai-review-utils.ts
// Pure utility functions for AI review card — edit severity detection and confidence labeling

import type { EditSeverity } from '@/stores/rental-conversations-store';

/**
 * Calculate edit severity by comparing original and edited responses
 * Uses Levenshtein-inspired metric and semantic checks
 */
export function calculateEditSeverity(original: string, edited: string): EditSeverity {
  if (!edited || edited === original) return 'none';

  const originalNormalized = original.toLowerCase().trim();
  const editedNormalized = edited.toLowerCase().trim();

  // If they're the same after normalization, it's just formatting
  if (originalNormalized === editedNormalized) return 'none';

  // Calculate length difference percentage
  const lenDiff = Math.abs(edited.length - original.length);
  const lenDiffPercent = lenDiff / Math.max(original.length, 1);

  // Count word changes
  const originalWords = originalNormalized.split(/\s+/);
  const editedWords = editedNormalized.split(/\s+/);
  const originalWordSet = new Set(originalWords);
  const editedWordSet = new Set(editedWords);

  // Words added or removed
  let changedWords = 0;
  for (const word of editedWords) {
    if (!originalWordSet.has(word)) changedWords++;
  }
  for (const word of originalWords) {
    if (!editedWordSet.has(word)) changedWords++;
  }
  const wordChangePercent = changedWords / Math.max(originalWords.length + editedWords.length, 1);

  // Major if:
  // - More than 40% of content length changed
  // - More than 30% of words changed
  // - Response was completely rewritten (very different length)
  if (lenDiffPercent > 0.4 || wordChangePercent > 0.3 || lenDiffPercent > 0.6) {
    return 'major';
  }

  // Minor if any meaningful change occurred
  if (lenDiffPercent > 0.05 || wordChangePercent > 0.1 || changedWords > 0) {
    return 'minor';
  }

  return 'none';
}

export function getConfidenceLabel(confidence: number): {
  label: string;
  color: 'success' | 'warning' | 'destructive';
} {
  if (confidence >= 0.8) {
    return { label: 'High confidence', color: 'success' };
  } else if (confidence >= 0.5) {
    return { label: 'Medium confidence', color: 'warning' };
  }
  return { label: 'Low confidence', color: 'destructive' };
}
