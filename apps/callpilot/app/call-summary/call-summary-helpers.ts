/**
 * Call Summary — Helper Functions
 *
 * Pure utility functions for generating mock summaries and extraction groups.
 */

import type { ExtractionGroup, CallSummary } from '@/types'

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function generateMockSummary(callId: string, contactId: string, contactName: string, duration: number, extractedData: any): CallSummary {
  const now = new Date().toISOString()
  const followUp = new Date(Date.now() + 3 * 86400000).toISOString()

  return {
    id: `summary-${callId}`,
    callId,
    contactId,
    contactName,
    date: now,
    duration,
    summaryText: `Call with ${contactName} lasted ${formatDuration(duration)}. Discussed the property at ${extractedData.property.address}. ${extractedData.deal.motivation}. Seller is asking $${extractedData.deal.askingPrice.toLocaleString()} and is ${extractedData.deal.sellerFlexibility.toLowerCase()}.`,
    bulletPoints: [
      `Property: ${extractedData.property.bedrooms}BR/${extractedData.property.bathrooms}BA, ${extractedData.property.sqft} sqft, built ${extractedData.property.yearBuilt}`,
      `Condition: ${extractedData.property.condition} — ${extractedData.property.repairs.join(', ')}`,
      `Asking price: $${extractedData.deal.askingPrice.toLocaleString()} (${extractedData.deal.sellerFlexibility})`,
      `Timeline: ${extractedData.deal.timeline}`,
      `Motivation: ${extractedData.deal.motivation}`,
    ],
    sentiment: 'positive',
    actionItems: extractedData.suggestedActions.map((a: any, i: number) => ({
      id: `action-mock-${i}`,
      text: a.action,
      completed: false,
      dueDate: followUp,
    })),
    keyMoments: [
      { id: 'km-mock-1', timestamp: '00:00:30', description: `${contactName} confirmed property ownership`, type: 'commitment' as const },
      { id: 'km-mock-2', timestamp: formatDuration(Math.floor(duration * 0.4)), description: `Shared property details and repair needs`, type: 'interest' as const },
      { id: 'km-mock-3', timestamp: formatDuration(Math.floor(duration * 0.8)), description: `Open to cash offer with quick close`, type: 'commitment' as const },
    ],
    nextStep: `Schedule property walkthrough at ${extractedData.property.address}. Run comps and prepare cash offer.`,
    followUpDate: followUp,
    crmSynced: false,
  }
}

export function generateMockExtractionGroups(contactName: string, extractedData: any): ExtractionGroup[] {
  return [
    {
      label: contactName,
      icon: '\uD83D\uDC64',
      entityId: null,
      fields: [
        { field: 'Name', value: extractedData.contact.name, confidence: 'high' as const, sourceQuote: 'Yes, this is John.', targetTable: 'crm.contacts', targetColumn: 'first_name', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Relationship', value: extractedData.contact.relationship, confidence: 'high' as const, sourceQuote: 'I inherited it from my mom', targetTable: 'crm.contacts', targetColumn: 'notes', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Location', value: extractedData.contact.location, confidence: 'medium' as const, sourceQuote: 'I live out of state', targetTable: 'crm.contacts', targetColumn: 'address', targetPath: null, currentValue: null, action: 'fill_empty' as const },
      ],
    },
    {
      label: 'Property',
      icon: '\uD83C\uDFE0',
      entityId: null,
      fields: [
        { field: 'Address', value: extractedData.property.address, confidence: 'high' as const, sourceQuote: 'the property on Oak Street', targetTable: 'investor.properties', targetColumn: 'address', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Bedrooms', value: String(extractedData.property.bedrooms), confidence: 'high' as const, sourceQuote: "it's a 3 bed, 2 bath", targetTable: 'investor.properties', targetColumn: 'bedrooms', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Sqft', value: String(extractedData.property.sqft), confidence: 'high' as const, sourceQuote: 'About 1,500 square feet', targetTable: 'investor.properties', targetColumn: 'sqft', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Year Built', value: String(extractedData.property.yearBuilt), confidence: 'high' as const, sourceQuote: 'Built in 1985', targetTable: 'investor.properties', targetColumn: 'year_built', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Repairs Needed', value: extractedData.property.repairs.join('; '), confidence: 'medium' as const, sourceQuote: 'The roof is about 15 years old, kitchen is outdated, foundation issues', targetTable: 'investor.properties', targetColumn: 'notes', targetPath: null, currentValue: null, action: 'fill_empty' as const },
      ],
    },
    {
      label: 'Deal',
      icon: '\uD83D\uDCB0',
      entityId: null,
      fields: [
        { field: 'Asking Price', value: `$${extractedData.deal.askingPrice.toLocaleString()}`, confidence: 'high' as const, sourceQuote: 'I was thinking around 180,000', targetTable: 'investor.deals', targetColumn: 'asking_price', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Motivation', value: extractedData.deal.motivation, confidence: 'high' as const, sourceQuote: 'I inherited it from my mom. I live out of state', targetTable: 'investor.deals', targetColumn: 'notes', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Timeline', value: extractedData.deal.timeline, confidence: 'medium' as const, sourceQuote: 'That sounds perfect actually', targetTable: 'investor.deals', targetColumn: 'timeline', targetPath: null, currentValue: null, action: 'fill_empty' as const },
      ],
    },
  ]
}
