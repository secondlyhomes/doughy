// src/features/guest-communication/services/templateService.ts
// Service for template variable substitution and message rendering

import { MessageContext, TEMPLATE_VARIABLES } from '../types';

/**
 * Replace template variables with actual values
 * Variables are in format: {{variable_name}}
 */
export function renderTemplate(template: string, context: MessageContext): string {
  let rendered = template;

  // Build variables map from context
  const variables = buildVariablesFromContext(context);

  // Replace all {{variable}} patterns
  const variablePattern = /\{\{(\w+)\}\}/g;
  rendered = rendered.replace(variablePattern, (match, varName) => {
    const value = variables[varName];
    return value !== undefined ? value : match; // Keep original if no value
  });

  return rendered;
}

/**
 * Build a flat variables map from nested context
 */
export function buildVariablesFromContext(context: MessageContext): Record<string, string> {
  const variables: Record<string, string> = {};

  // Guest variables
  if (context.guest) {
    if (context.guest.first_name) {
      variables.guest_first_name = context.guest.first_name;
    }
    if (context.guest.first_name && context.guest.last_name) {
      variables.guest_name = `${context.guest.first_name} ${context.guest.last_name}`;
    } else if (context.guest.first_name) {
      variables.guest_name = context.guest.first_name;
    }
  }

  // Property variables
  if (context.property) {
    if (context.property.name) {
      variables.property_name = context.property.name;
    }
    if (context.property.address) {
      let fullAddress = context.property.address;
      if (context.property.city) {
        fullAddress += `, ${context.property.city}`;
      }
      if (context.property.state) {
        fullAddress += `, ${context.property.state}`;
      }
      variables.property_address = fullAddress;
    }
    if (context.property.wifi_name) {
      variables.wifi_name = context.property.wifi_name;
    }
    if (context.property.wifi_password) {
      variables.wifi_password = context.property.wifi_password;
    }
  }

  // Booking variables
  if (context.booking) {
    if (context.booking.access_code) {
      variables.access_code = context.booking.access_code;
    }
    if (context.booking.check_in_time) {
      variables.check_in_time = context.booking.check_in_time;
    }
    if (context.booking.checkout_time) {
      variables.checkout_time = context.booking.checkout_time;
    }
    if (context.booking.start_date) {
      variables.check_in_date = formatDate(context.booking.start_date);
    }
    if (context.booking.end_date) {
      variables.checkout_date = formatDate(context.booking.end_date);
    }
  }

  // Host variables
  if (context.host) {
    if (context.host.name) {
      variables.host_name = context.host.name;
    }
    if (context.host.phone) {
      variables.host_phone = context.host.phone;
    }
  }

  return variables;
}

/**
 * Extract variable names from a template
 */
export function extractVariables(template: string): string[] {
  const variablePattern = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variablePattern.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Validate that all required variables have values
 */
export function validateVariables(
  template: string,
  context: MessageContext
): { valid: boolean; missing: string[] } {
  const requiredVars = extractVariables(template);
  const availableVars = buildVariablesFromContext(context);
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!availableVars[varName]) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get preview text for a template with example values
 */
export function getTemplatePreview(template: string): string {
  let preview = template;
  const variablePattern = /\{\{(\w+)\}\}/g;

  preview = preview.replace(variablePattern, (match, varName) => {
    const varInfo = TEMPLATE_VARIABLES[varName as keyof typeof TEMPLATE_VARIABLES];
    return varInfo ? `[${varInfo.example}]` : match;
  });

  return preview;
}

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Default templates for each type
 */
export const DEFAULT_TEMPLATES = {
  check_in_instructions: {
    subject: 'Your Check-in Instructions for {{property_name}}',
    body: `Hi {{guest_name}},

Welcome! Here are your check-in instructions for {{property_name}}:

Address: {{property_address}}

Access Code: {{access_code}}

Check-in Time: {{check_in_time}}

WiFi
Network: {{wifi_name}}
Password: {{wifi_password}}

If you have any questions, feel free to reach out!

Best,
{{host_name}}`,
  },
  checkout_reminder: {
    subject: 'Checkout Reminder - {{property_name}}',
    body: `Hi {{guest_name}},

Just a friendly reminder that checkout is tomorrow at {{checkout_time}}.

Before you leave, please:
- Leave all keys/remotes on the kitchen counter
- Take out any trash
- Make sure all doors and windows are locked

{{checkout_instructions}}

Thank you for staying with us! Safe travels!

Best,
{{host_name}}`,
  },
  house_rules: {
    subject: 'House Rules - {{property_name}}',
    body: `Hi {{guest_name}},

Welcome to {{property_name}}! Here are a few house rules to ensure a comfortable stay:

Quiet Hours: {{quiet_hours}}
Max Guests: {{max_guests}}
Parking: {{parking_info}}
No smoking inside the property
Pets must be approved in advance

If you have any questions, do not hesitate to ask!

Best,
{{host_name}}`,
  },
  review_request: {
    subject: 'How was your stay at {{property_name}}?',
    body: `Hi {{guest_name}},

Thank you for staying at {{property_name}}! We hope you had a wonderful time.

If you have a moment, we would really appreciate a review. It helps other guests and means a lot to us:

{{review_link}}

Thanks again, and we hope to host you again soon!

Best,
{{host_name}}`,
  },
};
