// src/features/lead-inbox/components/lead-ai-review-card/utils.ts
// Utility functions for AI review card

import type { EditSeverity } from '@/stores/investor-conversations-store';

/**
 * Calculate edit severity by comparing original and edited responses
 */
export function calculateEditSeverity(original: string, edited: string): EditSeverity {
  if (!edited || edited === original) return 'none';

  const originalNormalized = original.toLowerCase().trim();
  const editedNormalized = edited.toLowerCase().trim();

  if (originalNormalized === editedNormalized) return 'none';

  const lenDiff = Math.abs(edited.length - original.length);
  const lenDiffPercent = lenDiff / Math.max(original.length, 1);

  const originalWords = originalNormalized.split(/\s+/);
  const editedWords = editedNormalized.split(/\s+/);
  const originalWordSet = new Set(originalWords);
  const editedWordSet = new Set(editedWords);

  let changedWords = 0;
  for (const word of editedWords) {
    if (!originalWordSet.has(word)) changedWords++;
  }
  for (const word of originalWords) {
    if (!editedWordSet.has(word)) changedWords++;
  }
  const wordChangePercent =
    changedWords / Math.max(originalWords.length + editedWords.length, 1);

  if (lenDiffPercent > 0.4 || wordChangePercent > 0.3 || lenDiffPercent > 0.6) {
    return 'major';
  }

  if (lenDiffPercent > 0.05 || wordChangePercent > 0.1 || changedWords > 0) {
    return 'minor';
  }

  return 'none';
}

/**
 * Get confidence label and color based on confidence score
 */
export function getConfidenceLabel(confidence: number): {
  label: string;
  color: 'success' | 'warning' | 'destructive';
} {
  if (confidence >= 0.85) {
    return { label: 'High confidence', color: 'success' };
  } else if (confidence >= 0.6) {
    return { label: 'Medium confidence', color: 'warning' };
  }
  return { label: 'Low confidence', color: 'destructive' };
}
