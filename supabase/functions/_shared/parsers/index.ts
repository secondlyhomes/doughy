/**
 * Parsers Module
 *
 * Re-exports all parsing utilities for edge functions.
 *
 * @module _shared/parsers
 */

// Types
export type {
  Platform,
  ReplyMethod,
  InquiryType,
  Profession,
  ParsedContact,
  DateRange,
  PropertyHint,
  ParsedEmailResult,
  ParseEmailRequest,
} from "./types.ts";

// Platform Detection
export {
  PLATFORM_PATTERNS,
  REPLY_METHOD_BY_PLATFORM,
  detectPlatform,
  determineReplyMethod,
  detectInquiryType,
} from "./platform-detection.ts";

// Contact Extraction
export {
  extractContact,
  extractAdditionalDetails,
} from "./contact-extraction.ts";

// Date Parsing
export {
  parseFlexibleDate,
  extractDates,
} from "./date-parsing.ts";

// Property Hint
export { extractPropertyHint } from "./property-hint.ts";

// Confidence
export { calculateParsingConfidence } from "./confidence.ts";

// Content Cleaner
export {
  cleanMessageContent,
  sanitizeInput,
  INPUT_LIMITS,
} from "./content-cleaner.ts";
