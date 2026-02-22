// src/features/assistant/components/ask-tab-types.ts
// Types and constants for the AskTab component

export interface AskTabProps {
  dealId?: string;
}

// Suggestion prompts based on context
export const CONTEXTUAL_SUGGESTIONS = {
  deal_cockpit: [
    'What should I focus on?',
    'Summarize this deal',
    'What\'s missing?',
    'Draft a follow-up',
  ],
  property_detail: [
    'Analyze this property',
    'What\'s the MAO?',
    'Compare to comps',
    'Estimate repairs',
  ],
  generic: [
    'What can you help with?',
    'Show me my top deals',
    'What\'s overdue?',
    'Draft an email',
  ],
};
