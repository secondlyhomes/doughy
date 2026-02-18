// src/features/deals/services/ai-suggestions/utils.ts
// Utility functions for AI suggestions

import type { ActionCategory } from '../../hooks/useNextAction';

/**
 * Infer action category from text
 */
export function inferCategoryFromText(text: string): ActionCategory {
  const lower = text.toLowerCase();

  if (lower.includes('call') || lower.includes('contact') || lower.includes('reach out')) {
    return 'contact';
  }
  if (lower.includes('walkthrough') || lower.includes('photos') || lower.includes('visit')) {
    return 'walkthrough';
  }
  if (lower.includes('offer') || lower.includes('proposal')) {
    return 'offer';
  }
  if (lower.includes('analyze') || lower.includes('comps') || lower.includes('arv')) {
    return 'analyze';
  }
  if (lower.includes('underwrite') || lower.includes('numbers')) {
    return 'underwrite';
  }
  if (lower.includes('negotiate') || lower.includes('counter')) {
    return 'negotiate';
  }
  if (lower.includes('document') || lower.includes('upload') || lower.includes('sign')) {
    return 'document';
  }
  if (lower.includes('close') || lower.includes('title') || lower.includes('escrow')) {
    return 'close';
  }

  return 'followup';
}
