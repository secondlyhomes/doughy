// src/features/deals/services/aiSuggestions.ts
// DEPRECATED: This file re-exports from ai-suggestions/ for backward compatibility
// Import directly from '@/features/deals/services/ai-suggestions' for new code

export {
  generateSuggestions,
  getSuggestionsForDeal,
  fetchConversationContext,
} from './ai-suggestions';

export type {
  AISuggestion,
  SuggestionSource,
  ConversationContext,
  SuggestionRequest,
  SuggestionResult,
} from './ai-suggestions';

export { default } from './ai-suggestions';
