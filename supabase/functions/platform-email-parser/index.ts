/**
 * Platform Email Parser Edge Function
 *
 * Parses incoming emails from rental platforms (FurnishedFinder, Airbnb, TurboTenant,
 * Facebook Marketplace, Zillow, etc.) and extracts structured data for MoltBot.
 *
 * This function is called by MoltBot when it receives a new email notification.
 * It returns structured data that MoltBot can use to:
 * - Create/update contacts
 * - Score leads
 * - Generate appropriate responses
 * - Know how to reply (platform-only vs direct email)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

/**
 * Supported rental platforms
 */
type Platform =
  | 'airbnb'
  | 'furnishedfinder'
  | 'turbotenant'
  | 'facebook_marketplace'
  | 'zillow'
  | 'hotpads'
  | 'craigslist'
  | 'apartments_com'
  | 'direct_email'
  | 'unknown';

/**
 * How MoltBot should reply to this message
 */
type ReplyMethod =
  | 'email_reply'      // Can reply via email thread (e.g., Airbnb)
  | 'direct_email'     // Contact info provided - email them directly
  | 'platform_only'    // Must use platform website/app
  | 'messenger'        // Facebook Messenger only
  | 'sms'              // SMS/text message
  | 'unknown';

/**
 * Type of inquiry detected
 */
type InquiryType =
  | 'availability_check'
  | 'booking_request'
  | 'question'
  | 'tour_request'
  | 'price_negotiation'
  | 'general_inquiry'
  | 'application_submitted'
  | 'booking_confirmation'
  | 'cancellation'
  | 'review'
  | 'unknown';

/**
 * Profession categories for lead scoring
 */
type Profession =
  | 'travel_nurse'
  | 'healthcare_worker'
  | 'contractor'
  | 'corporate_relocator'
  | 'student'
  | 'military'
  | 'digital_nomad'
  | 'remote_worker'
  | 'other'
  | 'unknown';

/**
 * Parsed contact information
 */
interface ParsedContact {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  profession?: Profession;
  employer?: string;
  hospital?: string; // For healthcare workers
}

/**
 * Parsed date range for desired stay
 */
interface DateRange {
  start_date?: string; // ISO date string
  end_date?: string;
  duration_weeks?: number;
  duration_months?: number;
  flexible?: boolean;
}

/**
 * Property hint from the inquiry
 */
interface PropertyHint {
  address_hint?: string;
  listing_url?: string;
  listing_id?: string;
  property_name?: string;
}

/**
 * The complete parsed email result
 */
interface ParsedEmailResult {
  platform: Platform;
  reply_method: ReplyMethod;
  inquiry_type: InquiryType;
  contact: ParsedContact;
  dates: DateRange;
  property_hint: PropertyHint;
  message_content: string;
  original_subject: string;
  thread_id?: string;
  external_conversation_id?: string;
  guests?: number;
  pets?: boolean;
  budget?: number;
  special_requests?: string[];
  confidence: number; // 0-1 how confident we are in the parsing
  raw_metadata: Record<string, unknown>;
}

/**
 * Request body for the parser
 */
interface ParseEmailRequest {
  from: string;
  to: string;
  subject: string;
  body_text: string;
  body_html?: string;
  received_at?: string;
  headers?: Record<string, string>;
}

// =============================================================================
// Platform Detection Patterns
// =============================================================================

const PLATFORM_PATTERNS: { platform: Platform; patterns: RegExp[] }[] = [
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
// Reply Method Detection
// =============================================================================

const REPLY_METHOD_BY_PLATFORM: Record<Platform, ReplyMethod> = {
  airbnb: 'email_reply',
  furnishedfinder: 'platform_only', // Unless contact info is provided
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
// Extraction Patterns
// =============================================================================

const NAME_PATTERNS = [
  /(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  /(?:^|\n)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is interested|would like)/i,
  /from:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  /name:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
];

const EMAIL_PATTERN = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

const PHONE_PATTERNS = [
  /(?:phone|cell|mobile|tel|contact)[\s:]+(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/i,
  /(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/,
  /(\d{3}[\s.-]\d{3}[\s.-]\d{4})/,
];

const PROFESSION_PATTERNS: { profession: Profession; patterns: RegExp[] }[] = [
  {
    profession: 'travel_nurse',
    patterns: [
      /travel(?:ing)?\s*nurse/i,
      /traveling\s*(?:rn|lpn|cna)/i,
      /nurse\s*(?:on|for)\s*assignment/i,
    ],
  },
  {
    profession: 'healthcare_worker',
    patterns: [
      /(?:rn|lpn|cna|nurse|doctor|physician|med\s*student|medical)/i,
      /healthcare\s*(?:worker|professional)/i,
      /work(?:s|ing)?\s*(?:at|for)\s*(?:a\s*)?hospital/i,
    ],
  },
  {
    profession: 'contractor',
    patterns: [
      /contractor/i,
      /construction/i,
      /work(?:ing)?\s*(?:on|at)\s*(?:a\s*)?(?:project|site|job)/i,
    ],
  },
  {
    profession: 'corporate_relocator',
    patterns: [
      /relocation/i,
      /corporate\s*housing/i,
      /transferr(?:ing|ed)/i,
      /new\s*job/i,
    ],
  },
  {
    profession: 'student',
    patterns: [
      /student/i,
      /(?:attending|going to)\s*(?:college|university|school)/i,
      /internship/i,
    ],
  },
  {
    profession: 'military',
    patterns: [
      /military/i,
      /(?:army|navy|air force|marines|coast guard)/i,
      /stationed/i,
      /deployment/i,
      /pcs(?:ing)?/i,
    ],
  },
  {
    profession: 'remote_worker',
    patterns: [
      /work(?:ing)?\s*remote(?:ly)?/i,
      /digital\s*nomad/i,
      /work\s*from\s*(?:home|anywhere)/i,
    ],
  },
];

const DATE_PATTERNS = [
  // "Feb 1 - Apr 30" or "February 1 to April 30"
  /(?:from\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?)\s*(?:-|to|through)\s*(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
  // "starting Feb 1" or "move in Feb 1"
  /(?:start(?:ing)?|move\s*in|check\s*in)\s*(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?)/i,
  // "for 13 weeks" or "for 3 months"
  /for\s+(\d+)\s*(week|month)s?/i,
  // "2/1/2025" or "02-01-2025"
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
];

const HOSPITAL_PATTERNS = [
  /(?:work(?:ing)?|assignment)\s*(?:at|for)\s*([A-Z][a-zA-Z\s]+(?:Hospital|Medical|Health|Clinic|Center))/i,
  /([A-Z][a-zA-Z\s]+(?:Hospital|Medical|Health|Clinic|Center))/i,
];

const GUEST_COUNT_PATTERN = /(\d+)\s*(?:guest|people|person|adult|occupant)/i;

const PET_PATTERNS = [
  /(?:i\s+)?have\s+(?:a\s+)?(?:dog|cat|pet)/i,
  /pet\s*(?:friendly|allowed)/i,
  /bring(?:ing)?\s+(?:my\s+)?(?:dog|cat|pet)/i,
];

const BUDGET_PATTERN = /\$?\s*(\d{1,2}),?(\d{3})(?:\s*(?:\/|per)\s*(?:mo|month))?/i;

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Detect which platform the email is from
 */
function detectPlatform(from: string, subject: string, body: string): Platform {
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
 */
function determineReplyMethod(
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
 */
function detectInquiryType(subject: string, body: string): InquiryType {
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

/**
 * Extract contact information from email
 */
function extractContact(from: string, subject: string, body: string): ParsedContact {
  const contact: ParsedContact = {};
  const fullText = `${from} ${subject} ${body}`;

  // Extract name
  for (const pattern of NAME_PATTERNS) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const nameParts = match[1].trim().split(/\s+/);
      contact.first_name = nameParts[0];
      if (nameParts.length > 1) {
        contact.last_name = nameParts.slice(1).join(' ');
      }
      contact.full_name = match[1].trim();
      break;
    }
  }

  // Try to extract name from email "From" field format: "John Doe <john@example.com>"
  if (!contact.full_name) {
    const fromNameMatch = from.match(/^([^<]+)</);
    if (fromNameMatch) {
      const name = fromNameMatch[1].trim();
      if (name && !name.includes('@')) {
        const nameParts = name.split(/\s+/);
        contact.first_name = nameParts[0];
        if (nameParts.length > 1) {
          contact.last_name = nameParts.slice(1).join(' ');
        }
        contact.full_name = name;
      }
    }
  }

  // Extract email
  const emails = body.match(EMAIL_PATTERN);
  if (emails && emails.length > 0) {
    // Filter out platform emails, prefer personal emails
    const personalEmail = emails.find(
      (e) =>
        !e.includes('furnishedfinder') &&
        !e.includes('airbnb') &&
        !e.includes('turbotenant') &&
        !e.includes('zillow') &&
        !e.includes('noreply')
    );
    contact.email = personalEmail || emails[0];
  }

  // Also check the From field for email
  const fromEmailMatch = from.match(EMAIL_PATTERN);
  if (fromEmailMatch && !fromEmailMatch[0].includes('noreply')) {
    contact.email = contact.email || fromEmailMatch[0];
  }

  // Extract phone
  for (const pattern of PHONE_PATTERNS) {
    const match = body.match(pattern);
    if (match && match[1]) {
      contact.phone = match[1].replace(/\D/g, '');
      if (contact.phone.length === 10) {
        contact.phone = `+1${contact.phone}`;
      }
      break;
    }
  }

  // Detect profession
  for (const { profession, patterns } of PROFESSION_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(body)) {
        contact.profession = profession;
        break;
      }
    }
    if (contact.profession) break;
  }

  // Extract hospital/employer
  for (const pattern of HOSPITAL_PATTERNS) {
    const match = body.match(pattern);
    if (match && match[1]) {
      contact.hospital = match[1].trim();
      contact.employer = match[1].trim();
      break;
    }
  }

  return contact;
}

/**
 * Extract date range from email
 */
function extractDates(body: string): DateRange {
  const dates: DateRange = {};

  // Try to find date range
  for (const pattern of DATE_PATTERNS) {
    const match = body.match(pattern);
    if (match) {
      if (match[2] && /week|month/i.test(match[2])) {
        // Duration pattern: "for 13 weeks"
        const count = parseInt(match[1]);
        if (match[2].toLowerCase().includes('week')) {
          dates.duration_weeks = count;
        } else {
          dates.duration_months = count;
        }
      } else if (match[1] && match[2] && !match[3]) {
        // Range pattern: "Feb 1 - Apr 30"
        dates.start_date = parseFlexibleDate(match[1]);
        dates.end_date = parseFlexibleDate(match[2]);
      } else if (match[1]) {
        // Start date pattern: "starting Feb 1"
        dates.start_date = parseFlexibleDate(match[1]);
      }
      break;
    }
  }

  // Check for flexibility
  if (/flexible|asap|as soon as/i.test(body)) {
    dates.flexible = true;
  }

  return dates;
}

/**
 * Parse flexible date formats to ISO string
 */
function parseFlexibleDate(dateStr: string): string | undefined {
  try {
    // Try to parse the date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      // If year not specified, use current or next year
      if (!/\d{4}/.test(dateStr)) {
        const now = new Date();
        if (parsed < now) {
          parsed.setFullYear(parsed.getFullYear() + 1);
        }
      }
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // Parsing failed
  }
  return undefined;
}

/**
 * Extract property hint from email
 */
function extractPropertyHint(subject: string, body: string): PropertyHint {
  const hint: PropertyHint = {};
  const fullText = `${subject} ${body}`;

  // Look for listing URLs
  const urlPatterns = [
    /(https?:\/\/[^\s]+(?:airbnb|furnishedfinder|zillow|turbotenant)[^\s]*)/i,
    /(https?:\/\/[^\s]+listing[^\s]*)/i,
  ];

  for (const pattern of urlPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      hint.listing_url = match[1];
      break;
    }
  }

  // Look for address patterns
  const addressPattern = /(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Way|Ct|Court))/i;
  const addressMatch = fullText.match(addressPattern);
  if (addressMatch) {
    hint.address_hint = addressMatch[1];
  }

  // Look for property name in subject
  const propertyNameMatch = subject.match(/(?:re:|about|inquiry for|interest in)\s*(.+?)(?:\s*-|\s*$)/i);
  if (propertyNameMatch) {
    hint.property_name = propertyNameMatch[1].trim();
  }

  return hint;
}

/**
 * Extract additional details (guests, pets, budget)
 */
function extractAdditionalDetails(body: string): {
  guests?: number;
  pets?: boolean;
  budget?: number;
  special_requests: string[];
} {
  const result: { guests?: number; pets?: boolean; budget?: number; special_requests: string[] } = {
    special_requests: [],
  };

  // Guests
  const guestMatch = body.match(GUEST_COUNT_PATTERN);
  if (guestMatch) {
    result.guests = parseInt(guestMatch[1]);
  }

  // Pets
  for (const pattern of PET_PATTERNS) {
    if (pattern.test(body)) {
      result.pets = true;
      result.special_requests.push('Has pets');
      break;
    }
  }

  // Budget
  const budgetMatch = body.match(BUDGET_PATTERN);
  if (budgetMatch) {
    result.budget = parseInt(`${budgetMatch[1]}${budgetMatch[2]}`);
  }

  // Special requests
  if (/parking/i.test(body)) {
    result.special_requests.push('Needs parking');
  }
  if (/(?:quiet|noise)/i.test(body)) {
    result.special_requests.push('Prefers quiet environment');
  }
  if (/night\s*shift/i.test(body)) {
    result.special_requests.push('Works night shift');
  }
  if (/(?:furnished|unfurnished)/i.test(body)) {
    result.special_requests.push(
      /unfurnished/i.test(body) ? 'Prefers unfurnished' : 'Needs furnished'
    );
  }

  return result;
}

/**
 * Calculate parsing confidence score
 */
function calculateConfidence(result: Partial<ParsedEmailResult>): number {
  let score = 0.5; // Base confidence

  // Platform detection
  if (result.platform && result.platform !== 'unknown') {
    score += 0.1;
  }

  // Contact info
  if (result.contact?.full_name) score += 0.1;
  if (result.contact?.email) score += 0.1;
  if (result.contact?.phone) score += 0.05;

  // Dates
  if (result.dates?.start_date) score += 0.1;
  if (result.dates?.duration_weeks || result.dates?.duration_months) score += 0.05;

  // Profession (important for lead scoring)
  if (result.contact?.profession && result.contact.profession !== 'unknown') {
    score += 0.1;
  }

  return Math.min(1, score);
}

/**
 * Clean message content for storage
 */
function cleanMessageContent(body: string): string {
  // Remove excessive whitespace
  let cleaned = body.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.trim();

  // Truncate if too long
  if (cleaned.length > 5000) {
    cleaned = cleaned.substring(0, 5000) + '...';
  }

  return cleaned;
}

/**
 * Main parsing function
 */
function parseEmail(request: ParseEmailRequest): ParsedEmailResult {
  const { from, subject, body_text, body_html } = request;

  // Use HTML body if available, otherwise text
  let body = body_text || (body_html?.replace(/<[^>]+>/g, ' ') || '');

  // Input validation to prevent ReDoS attacks
  // Truncate very long inputs before processing with regex
  const MAX_BODY_LENGTH = 50000;
  const MAX_SUBJECT_LENGTH = 1000;

  if (body.length > MAX_BODY_LENGTH) {
    body = body.substring(0, MAX_BODY_LENGTH);
  }

  const safeSubject = subject.length > MAX_SUBJECT_LENGTH
    ? subject.substring(0, MAX_SUBJECT_LENGTH)
    : subject;

  // Detect platform
  const platform = detectPlatform(from, safeSubject, body);

  // Extract all data
  const contact = extractContact(from, safeSubject, body);
  const dates = extractDates(body);
  const propertyHint = extractPropertyHint(safeSubject, body);
  const additionalDetails = extractAdditionalDetails(body);

  // Determine reply method
  const replyMethod = determineReplyMethod(
    platform,
    !!contact.email,
    !!contact.phone
  );

  // Detect inquiry type
  const inquiryType = detectInquiryType(safeSubject, body);

  // Build result
  const result: ParsedEmailResult = {
    platform,
    reply_method: replyMethod,
    inquiry_type: inquiryType,
    contact,
    dates,
    property_hint: propertyHint,
    message_content: cleanMessageContent(body),
    original_subject: safeSubject,
    guests: additionalDetails.guests,
    pets: additionalDetails.pets,
    budget: additionalDetails.budget,
    special_requests: additionalDetails.special_requests,
    confidence: 0,
    raw_metadata: {
      from,
      received_at: request.received_at,
      headers: request.headers,
    },
  };

  // Calculate confidence
  result.confidence = calculateConfidence(result);

  return result;
}

// =============================================================================
// HTTP Handler
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Missing authorization header',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Check if this is a service role key (server-to-server authentication)
    // Support both legacy JWT-format key and new SUPABASE_SECRET_KEY format
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY');
    const moltbotSecretKey = Deno.env.get('MOLTBOT_SECRET_KEY');
    const isServiceRole = (secretKey && token === secretKey) ||
                          (moltbotSecretKey && token === moltbotSecretKey);

    let userId: string | undefined;

    if (isServiceRole) {
      // Service role authentication - trusted server-to-server call
      // User ID should be provided in the request body for service role calls
      console.log('[platform-email-parser] Service role authentication');
    } else {
      // User JWT authentication
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabasePublishableKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabasePublishableKey, {
        global: { headers: { Authorization: authHeader } },
      });

      // Verify the user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({
              success: false,
              error: 'Invalid or expired token',
            }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }
      userId = user.id;
    }

    // Parse request body
    const body: ParseEmailRequest = await req.json();

    // Validate required fields
    if (!body.from || !body.subject) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: from, subject',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Parse the email
    const result = parseEmail(body);

    // Return parsed result
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          data: result,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  } catch (error) {
    console.error('Error parsing email:', error);

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
