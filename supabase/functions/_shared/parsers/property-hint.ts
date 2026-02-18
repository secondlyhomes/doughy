/**
 * Property Hint Extraction Module
 *
 * Extracts property hints from email content.
 *
 * @module _shared/parsers/property-hint
 */

import type { PropertyHint } from "./types.ts";

/**
 * Extract property hint from email
 *
 * @param subject - Email subject
 * @param body - Email body
 * @returns Extracted property hint
 */
export function extractPropertyHint(subject: string, body: string): PropertyHint {
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
