/**
 * Platform Detection Module
 *
 * Detects rental platforms from email content.
 *
 * @module _shared/parsers/platform-detection
 */

import type { Platform, ReplyMethod, InquiryType } from "./types.ts";

// =============================================================================
// Platform Patterns
// =============================================================================

export const PLATFORM_PATTERNS: { platform: Platform; patterns: RegExp[] }[] = [
  {
    platform: 'airbnb',
    patterns: [
      /@airbnb\.com$/i,
      /airbnb\.com/i,
      /new message from .* on airbnb/i,
      /airbnb reservation/i,
    ],
  },
  {
    platform: 'furnishedfinder',
    patterns: [
      /@furnishedfinder\.com$/i,
      /furnishedfinder\.com/i,
      /new inquiry from furnishedfinder/i,
      /travel.*(nurse|healthcare)/i,
    ],
  },
  {
    platform: 'turbotenant',
    patterns: [
      /@turbotenant\.com$/i,
      /turbotenant\.com/i,
      /new lead from turbotenant/i,
      /tenant inquiry/i,
    ],
  },
  {
    platform: 'facebook_marketplace',
    patterns: [
      /@facebookmail\.com$/i,
      /facebook\.com\/marketplace/i,
      /marketplace notification/i,
      /replied to your listing/i,
    ],
  },
  {
    platform: 'zillow',
    patterns: [
      /@zillow\.com$/i,
      /zillow\.com/i,
      /new rental lead from zillow/i,
      /zillow rental/i,
    ],
  },
  {
    platform: 'hotpads',
    patterns: [
      /@hotpads\.com$/i,
      /hotpads\.com/i,
      /new lead from hotpads/i,
    ],
  },
  {
    platform: 'craigslist',
    patterns: [
      /craigslist\.org/i,
      /@reply\.craigslist\.org$/i,
    ],
  },
  {
    platform: 'apartments_com',
    patterns: [
      /@apartments\.com$/i,
      /apartments\.com/i,
      /new lead from apartments\.com/i,
    ],
  },
];

// =============================================================================
// Reply Method Mapping
// =============================================================================

export const REPLY_METHOD_BY_PLATFORM: Record<Platform, ReplyMethod> = {
  airbnb: 'email_reply',
  furnishedfinder: 'platform_only',
  turbotenant: 'direct_email',
  facebook_marketplace: 'messenger',
  zillow: 'direct_email',
  hotpads: 'direct_email',
  craigslist: 'email_reply',
  apartments_com: 'direct_email',
  direct_email: 'direct_email',
  unknown: 'unknown',
};

// =============================================================================
// Detection Functions
// =============================================================================

/**
 * Detect which platform the email is from
 *
 * @param from - Email from address
 * @param subject - Email subject
 * @param body - Email body
 * @returns Detected platform
 */
export function detectPlatform(from: string, subject: string, body: string): Platform {
  const searchText = `${from} ${subject} ${body}`;

  for (const { platform, patterns } of PLATFORM_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(searchText)) {
        return platform;
      }
    }
  }

  return 'direct_email';
}

/**
 * Determine reply method based on platform and available contact info
 *
 * @param platform - Detected platform
 * @param hasEmail - Whether contact email is available
 * @param hasPhone - Whether contact phone is available
 * @returns Recommended reply method
 */
export function determineReplyMethod(
  platform: Platform,
  hasEmail: boolean,
  hasPhone: boolean
): ReplyMethod {
  // If we have direct contact info, we can always email directly
  if (hasEmail && platform === 'furnishedfinder') {
    return 'direct_email';
  }

  return REPLY_METHOD_BY_PLATFORM[platform] || 'unknown';
}

/**
 * Detect the type of inquiry
 *
 * @param subject - Email subject
 * @param body - Email body
 * @returns Inquiry type classification
 */
export function detectInquiryType(subject: string, body: string): InquiryType {
  const text = `${subject} ${body}`.toLowerCase();

  if (/(?:available|availability|is.*available|still available)/i.test(text)) {
    return 'availability_check';
  }
  if (/(?:book|reservation|reserve|want to rent)/i.test(text)) {
    return 'booking_request';
  }
  if (/(?:tour|showing|see the|visit|view)/i.test(text)) {
    return 'tour_request';
  }
  if (/(?:price|cost|rate|discount|negotiate|offer)/i.test(text)) {
    return 'price_negotiation';
  }
  if (/(?:cancel|cancellation)/i.test(text)) {
    return 'cancellation';
  }
  if (/(?:confirm|confirmation|booked)/i.test(text)) {
    return 'booking_confirmation';
  }
  if (/(?:application|apply|applied)/i.test(text)) {
    return 'application_submitted';
  }
  if (/(?:review|rating|feedback)/i.test(text)) {
    return 'review';
  }
  if (/\?/.test(text)) {
    return 'question';
  }

  return 'general_inquiry';
}
