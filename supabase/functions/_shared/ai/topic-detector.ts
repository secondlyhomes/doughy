/**
 * Topic Detection Module
 *
 * Detects topics in messages for property management conversations.
 * Used by AI responder to classify messages and determine confidence levels.
 *
 * @module _shared/ai/topic-detector
 */

// =============================================================================
// Topic Patterns
// =============================================================================

export const TOPIC_PATTERNS: Record<string, RegExp[]> = {
  wifi: [/wifi/i, /password/i, /internet/i, /network/i],
  pricing: [/price/i, /rate/i, /cost/i, /fee/i, /how much/i, /\$\d+/],
  availability: [/available/i, /open/i, /vacancy/i, /when can/i],
  check_in: [/check.?in/i, /arrival/i, /access/i, /key/i, /code/i, /door/i],
  check_out: [/check.?out/i, /departure/i, /leave/i, /last day/i],
  amenities: [/amenities/i, /parking/i, /laundry/i, /washer/i, /dryer/i, /kitchen/i],
  maintenance: [/broken/i, /not working/i, /fix/i, /repair/i, /issue/i, /problem/i, /leak/i],
  refund: [/refund/i, /money back/i, /reimburse/i],
  discount: [/discount/i, /deal/i, /lower price/i, /negotiate/i, /reduce/i],
  complaint: [/complaint/i, /unhappy/i, /disappointed/i, /terrible/i, /worst/i, /unacceptable/i],
  cancellation: [/cancel/i, /not coming/i, /can't make it/i],
  extension: [/extend/i, /stay longer/i, /more time/i, /extra week/i, /extra month/i],
  booking: [/book/i, /reserve/i, /hold/i, /secure/i],
  tour: [/tour/i, /visit/i, /see the place/i, /viewing/i, /look at/i],
  security_deposit: [/deposit/i, /security/i],
  damage: [/damage/i, /broke/i, /stain/i, /scratch/i],
  pets: [/pet/i, /dog/i, /cat/i, /animal/i],
  guests: [/guest/i, /visitor/i, /friend staying/i, /partner/i, /girlfriend/i, /boyfriend/i],
};

// Topics that are considered FAQ and get higher confidence
export const FAQ_TOPICS = ['wifi', 'check_in', 'check_out', 'amenities', 'pricing', 'availability'];

// Topics that are sensitive and need review
export const SENSITIVE_TOPICS = ['refund', 'discount', 'complaint', 'cancellation', 'damage', 'security_deposit'];

// =============================================================================
// Detection Functions
// =============================================================================

/**
 * Detect all topics mentioned in a message
 *
 * @param message - The message to analyze
 * @returns Array of detected topic names
 */
export function detectTopics(message: string): string[] {
  const detected: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    if (patterns.some(p => p.test(lowerMessage))) {
      detected.push(topic);
    }
  }

  return detected;
}

/**
 * Classify the message type based on content and detected topics
 *
 * @param message - The message to classify
 * @param topics - Already detected topics
 * @returns Message type classification
 */
export function classifyMessageType(message: string, topics: string[]): string {
  const lowerMessage = message.toLowerCase();

  // Check for complaints first
  if (topics.includes('complaint') || topics.includes('damage')) {
    return 'complaint';
  }

  // Check for booking-related
  if (topics.includes('booking') || topics.includes('availability')) {
    return 'booking_request';
  }

  // Check for maintenance
  if (topics.includes('maintenance')) {
    return 'maintenance';
  }

  // Check for FAQ topics
  if (topics.some(t => FAQ_TOPICS.includes(t))) {
    return 'faq';
  }

  // Check for inquiry indicators
  if (lowerMessage.includes('?') || /looking for|interested in|inquire/i.test(lowerMessage)) {
    return 'inquiry';
  }

  return 'general';
}

/**
 * Determine suggested actions based on message content and topics
 *
 * @param message - The message to analyze
 * @param topics - Detected topics
 * @returns Array of suggested action identifiers
 */
export function determineSuggestedActions(message: string, topics: string[]): string[] {
  const actions: string[] = [];

  if (topics.includes('tour')) {
    actions.push('schedule_tour');
  }

  if (topics.includes('booking') || topics.includes('availability')) {
    actions.push('check_availability');
  }

  if (topics.includes('extension')) {
    actions.push('check_extension_availability');
  }

  if (topics.includes('maintenance')) {
    actions.push('log_maintenance_request');
  }

  if (topics.includes('cancellation')) {
    actions.push('process_cancellation');
  }

  return actions;
}

/**
 * Check if any detected topics are in the sensitive list
 *
 * @param topics - Detected topics
 * @param alwaysReviewTopics - User-configured topics that always need review
 * @returns The first sensitive topic found, or undefined
 */
export function findSensitiveTopic(
  topics: string[],
  alwaysReviewTopics: string[] = SENSITIVE_TOPICS
): string | undefined {
  return topics.find(t => alwaysReviewTopics.includes(t));
}

/**
 * Check if message contains FAQ-type questions
 *
 * @param topics - Detected topics
 * @returns True if any FAQ topics detected
 */
export function isFaqQuestion(topics: string[]): boolean {
  return topics.some(t => FAQ_TOPICS.includes(t));
}
