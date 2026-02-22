// src/config/conversations.ts
// Configuration for conversations feature - Zone G

/**
 * Voice memo recording configuration
 */
export const VOICE_MEMO_CONFIG = {
  /** Maximum recording duration in seconds */
  maxDurationSeconds: 300, // 5 minutes

  /** How long to keep audio files (in days) before auto-delete */
  audioRetentionDays: 7,

  /** Whether to allow users to choose audio retention */
  allowAudioRetention: true,

  /** Audio quality preset */
  quality: 'HIGH' as const,
} as const;

/**
 * Push notification configuration
 */
export const NOTIFICATION_CONFIG = {
  /** Hour of day to send daily digest (0-23) */
  dailyDigestHour: 9,

  /** Minutes past the hour for daily digest */
  dailyDigestMinute: 0,

  /** Default days before showing contact reminder */
  contactReminderDays: 7,

  /** Default days after offer for follow-up reminder */
  offerFollowupDays: 2,
} as const;

/**
 * Conversation list/timeline configuration
 */
export const CONVERSATION_LIST_CONFIG = {
  /** Default items per page */
  pageSize: 50,

  /** Threshold for triggering load more (0-1) */
  loadMoreThreshold: 0.5,

  /** Minimum content length for AI analysis */
  minContentLengthForAnalysis: 10,
} as const;

/**
 * AI analysis configuration
 */
export const AI_ANALYSIS_CONFIG = {
  /** Model to use for SMS analysis */
  model: 'gpt-4o' as const,

  /** Temperature for AI responses (0-1) */
  temperature: 0.2,

  /** Max tokens for combined response */
  maxTokens: 800,

  /** Rate limit delay between batch analysis calls (ms) */
  batchDelayMs: 1000,
} as const;

/**
 * All conversation configuration
 */
export const CONVERSATION_CONFIG = {
  voiceMemo: VOICE_MEMO_CONFIG,
  notifications: NOTIFICATION_CONFIG,
  list: CONVERSATION_LIST_CONFIG,
  aiAnalysis: AI_ANALYSIS_CONFIG,
} as const;

export default CONVERSATION_CONFIG;
