/**
 * Confidence Scoring Module
 *
 * Calculates confidence scores for AI-generated responses.
 * Takes into account message type, topics, context, and security factors.
 *
 * @module _shared/ai/confidence-scorer
 */

import { FAQ_TOPICS, SENSITIVE_TOPICS } from "./topic-detector.ts";

// =============================================================================
// Types
// =============================================================================

export interface ConfidenceContext {
  property_id?: string;
  conversation_history?: unknown[];
}

export interface ConfidenceFactors {
  base: number;
  faqBonus: number;
  propertyContextBonus: number;
  historyBonus: number;
  sensitivePenalty: number;
  maintenancePenalty: number;
  bookingPenalty: number;
  securityPenalty: number;
}

// =============================================================================
// Scoring Functions
// =============================================================================

/**
 * Calculate base confidence score for an AI response
 *
 * @param params - Scoring parameters
 * @returns Confidence score between 0.10 and 0.95
 */
export function calculateBaseConfidence(params: {
  message: string;
  response: string;
  topics: string[];
  messageType: string;
  context?: ConfidenceContext;
}): number {
  const { topics, messageType, context } = params;

  let confidence = 0.70; // Base confidence

  // Simple FAQ questions get higher confidence
  if (topics.some(t => FAQ_TOPICS.includes(t)) && messageType === 'faq') {
    confidence += 0.15;
  }

  // Property context increases confidence
  if (context?.property_id) {
    confidence += 0.10;
  }

  // Conversation history helps
  if (context?.conversation_history && context.conversation_history.length > 2) {
    confidence += 0.05;
  }

  // Sensitive topics decrease confidence
  if (topics.some(t => SENSITIVE_TOPICS.includes(t))) {
    confidence -= 0.25;
  }

  // Maintenance issues need review
  if (topics.includes('maintenance')) {
    confidence -= 0.15;
  }

  // Booking requests are important
  if (messageType === 'booking_request') {
    confidence -= 0.10;
  }

  // Cap confidence
  return Math.max(0.10, Math.min(0.95, confidence));
}

/**
 * Calculate detailed confidence factors for debugging
 *
 * @param params - Scoring parameters
 * @returns Breakdown of all confidence factors
 */
export function calculateConfidenceFactors(params: {
  message: string;
  response: string;
  topics: string[];
  messageType: string;
  context?: ConfidenceContext;
  securityAction?: string;
}): ConfidenceFactors {
  const { topics, messageType, context, securityAction } = params;

  const factors: ConfidenceFactors = {
    base: 0.70,
    faqBonus: 0,
    propertyContextBonus: 0,
    historyBonus: 0,
    sensitivePenalty: 0,
    maintenancePenalty: 0,
    bookingPenalty: 0,
    securityPenalty: 0,
  };

  // FAQ bonus
  if (topics.some(t => FAQ_TOPICS.includes(t)) && messageType === 'faq') {
    factors.faqBonus = 0.15;
  }

  // Property context bonus
  if (context?.property_id) {
    factors.propertyContextBonus = 0.10;
  }

  // History bonus
  if (context?.conversation_history && context.conversation_history.length > 2) {
    factors.historyBonus = 0.05;
  }

  // Sensitive penalty
  if (topics.some(t => SENSITIVE_TOPICS.includes(t))) {
    factors.sensitivePenalty = -0.25;
  }

  // Maintenance penalty
  if (topics.includes('maintenance')) {
    factors.maintenancePenalty = -0.15;
  }

  // Booking penalty
  if (messageType === 'booking_request') {
    factors.bookingPenalty = -0.10;
  }

  // Security penalty
  if (securityAction === 'sanitized') {
    factors.securityPenalty = -0.15;
  } else if (securityAction === 'flagged') {
    factors.securityPenalty = -0.25;
  }

  return factors;
}

/**
 * Apply security adjustment to confidence score
 *
 * @param baseConfidence - The base confidence score
 * @param securityAction - The security action taken ('sanitized' | 'flagged' | 'allowed')
 * @returns Adjusted confidence score
 */
export function applySecurityAdjustment(
  baseConfidence: number,
  securityAction: string
): number {
  let adjustment = 0;

  if (securityAction === 'sanitized') {
    adjustment = -0.15;
  } else if (securityAction === 'flagged') {
    adjustment = -0.25;
  }

  return Math.max(0.10, baseConfidence + adjustment);
}

/**
 * Determine if response should auto-send based on confidence and settings
 *
 * @param params - Decision parameters
 * @returns Object with decision and reason
 */
export function shouldAutoSend(params: {
  confidence: number;
  aiMode: 'training' | 'assisted' | 'autonomous';
  autoRespondEnabled: boolean;
  confidenceThreshold: number;
  hasAlwaysReviewTopic: boolean;
  isLeadWithFastResponse: boolean;
  leadConfidenceThreshold: number;
  hasMaintenance: boolean;
  securityFlagged: boolean;
}): { autoSend: boolean; reason?: string } {
  const {
    confidence,
    aiMode,
    autoRespondEnabled,
    confidenceThreshold,
    hasAlwaysReviewTopic,
    isLeadWithFastResponse,
    leadConfidenceThreshold,
    hasMaintenance,
    securityFlagged,
  } = params;

  // Check for always-review topics
  if (hasAlwaysReviewTopic) {
    return { autoSend: false, reason: 'Contains sensitive topic' };
  }

  // Check if auto-respond is disabled
  if (!autoRespondEnabled) {
    return { autoSend: false, reason: 'Auto-respond is disabled' };
  }

  // Training mode: queue almost everything
  if (aiMode === 'training') {
    if (confidence < 0.95) {
      return { autoSend: false, reason: 'Training mode - building your preferences' };
    }
    return { autoSend: true };
  }

  // Autonomous mode: auto-send most things
  if (aiMode === 'autonomous') {
    if (confidence >= 0.50 && !hasAlwaysReviewTopic) {
      return { autoSend: true };
    }
    return { autoSend: false, reason: 'Confidence below autonomous threshold' };
  }

  // Assisted mode (default): check threshold based on contact type
  const threshold = isLeadWithFastResponse
    ? Math.min(confidenceThreshold, leadConfidenceThreshold) / 100
    : confidenceThreshold / 100;

  if (confidence < threshold) {
    return {
      autoSend: false,
      reason: `Confidence ${Math.round(confidence * 100)}% below threshold ${Math.round(threshold * 100)}%`,
    };
  }

  // Maintenance requests always need review
  if (hasMaintenance) {
    return { autoSend: false, reason: 'Maintenance request requires review' };
  }

  // Security-flagged content should not auto-send
  if (securityFlagged) {
    return { autoSend: false, reason: 'Security review recommended' };
  }

  return { autoSend: true };
}
