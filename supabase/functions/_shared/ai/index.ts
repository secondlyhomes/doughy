/**
 * AI Module
 *
 * Re-exports all AI-related utilities for edge functions.
 *
 * @module _shared/ai
 */

// Topic Detection
export {
  TOPIC_PATTERNS,
  FAQ_TOPICS,
  SENSITIVE_TOPICS,
  detectTopics,
  classifyMessageType,
  determineSuggestedActions,
  findSensitiveTopic,
  isFaqQuestion,
} from "./topic-detector.ts";

// Confidence Scoring
export {
  calculateBaseConfidence,
  calculateConfidenceFactors,
  applySecurityAdjustment,
  shouldAutoSend,
  type ConfidenceContext,
  type ConfidenceFactors,
} from "./confidence-scorer.ts";

// OpenAI Client
export {
  validateOpenAIResponse,
  generateChatCompletion,
  generateConversationCompletion,
  type OpenAIMessage,
  type OpenAICompletionOptions,
  type OpenAIValidationResult,
} from "./openai-client.ts";
