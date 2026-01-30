/**
 * Contact Extraction Module
 *
 * Extracts contact information from email content.
 *
 * @module _shared/parsers/contact-extraction
 */

import type { ParsedContact, Profession } from "./types.ts";

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

const HOSPITAL_PATTERNS = [
  /(?:work(?:ing)?|assignment)\s*(?:at|for)\s*([A-Z][a-zA-Z\s]+(?:Hospital|Medical|Health|Clinic|Center))/i,
  /([A-Z][a-zA-Z\s]+(?:Hospital|Medical|Health|Clinic|Center))/i,
];

// =============================================================================
// Extraction Functions
// =============================================================================

/**
 * Extract contact information from email
 *
 * @param from - Email from address
 * @param subject - Email subject
 * @param body - Email body
 * @returns Extracted contact information
 */
export function extractContact(from: string, subject: string, body: string): ParsedContact {
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
 * Extract additional details (guests, pets, budget)
 *
 * @param body - Email body
 * @returns Extracted additional details
 */
export function extractAdditionalDetails(body: string): {
  guests?: number;
  pets?: boolean;
  budget?: number;
  special_requests: string[];
} {
  const GUEST_COUNT_PATTERN = /(\d+)\s*(?:guest|people|person|adult|occupant)/i;
  const PET_PATTERNS = [
    /(?:i\s+)?have\s+(?:a\s+)?(?:dog|cat|pet)/i,
    /pet\s*(?:friendly|allowed)/i,
    /bring(?:ing)?\s+(?:my\s+)?(?:dog|cat|pet)/i,
  ];
  const BUDGET_PATTERN = /\$?\s*(\d{1,2}),?(\d{3})(?:\s*(?:\/|per)\s*(?:mo|month))?/i;

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
