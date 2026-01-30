/**
 * Message Personalization Module
 *
 * Handles variable substitution in message templates.
 *
 * @module _shared/channel-executors/personalization
 */

import type { ContactInfo } from "./types.ts";

interface PersonalizationContext {
  property_address?: string;
  pain_points?: string[];
  last_conversation?: string;
}

/**
 * Personalize a message template with contact and context variables
 *
 * @param template - Message template with {variable} placeholders
 * @param contact - Contact information
 * @param context - Additional context for personalization
 * @returns Personalized message
 */
export function personalizeMessage(
  template: string,
  contact: ContactInfo,
  context?: PersonalizationContext
): string {
  let message = template;

  // Basic contact variables
  message = message.replace(/\{first_name\}/g, contact.first_name || 'there');
  message = message.replace(/\{last_name\}/g, contact.last_name || '');
  message = message.replace(
    /\{full_name\}/g,
    [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'there'
  );

  // Context variables
  if (context) {
    if (context.property_address) {
      message = message.replace(/\{property_address\}/g, context.property_address);
    }
  }

  return message;
}
