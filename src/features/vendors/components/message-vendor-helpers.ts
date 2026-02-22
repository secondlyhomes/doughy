// src/features/vendors/components/message-vendor-helpers.ts
// AI message generation helpers for MessageVendorSheet

import { MessageContext } from './message-vendor-types';

interface GeneratedMessage {
  subject: string;
  body: string;
}

export function generateMessageFromContext(
  vendorName: string,
  context: MessageContext
): GeneratedMessage {
  let generatedSubject = '';
  let generatedBody = '';

  if (context.type === 'maintenance') {
    generatedSubject = `Service Request: ${context.issueTitle || 'Repair Needed'}`;
    generatedBody = `Hi ${vendorName},

I have a ${context.urgency === 'emergency' ? 'urgent ' : ''}repair needed at ${context.propertyAddress || 'my property'}.

Issue: ${context.issueTitle || 'Repair needed'}
${context.issueDescription ? `\nDetails: ${context.issueDescription}` : ''}

${context.urgency === 'emergency' ? 'This is an emergency situation. ' : ''}Could you please let me know your earliest availability?

Thank you,
Property Manager`;
  } else if (context.type === 'turnover') {
    generatedSubject = `Cleaning Request: ${context.propertyAddress || 'Property'}`;
    generatedBody = `Hi ${vendorName},

I need to schedule a turnover cleaning at ${context.propertyAddress || 'my property'}.

${context.scheduledDate ? `Requested date: ${context.scheduledDate}` : 'Please let me know your earliest availability.'}

The property will be vacant and ready for cleaning. Please confirm if this time works for you.

Thank you,
Property Manager`;
  } else {
    generatedBody = `Hi ${vendorName},

I wanted to reach out regarding services at ${context.propertyAddress || 'my property'}.

Please let me know your availability.

Thank you,
Property Manager`;
  }

  return { subject: generatedSubject, body: generatedBody };
}
