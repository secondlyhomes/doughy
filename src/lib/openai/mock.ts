// src/lib/openai/mock.ts
// Mock responses for development without backend

import type {
  ExtractedPropertyData,
  ImageExtractionResult,
  DocumentTemplateType,
} from './types';

/**
 * Get mock response for public assistant
 */
export function getMockAssistantResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('price') || lowerMessage.includes('pricing')) {
    return "Doughy offers flexible pricing plans to fit your needs. Our Basic plan starts at $49/month for individual investors, with Professional and Enterprise tiers for growing teams. Visit our pricing page for full details!";
  }

  if (lowerMessage.includes('lead') || lowerMessage.includes('leads')) {
    return "Lead management is one of Doughy's core features! You can import leads from CSV files, add them manually, or capture them through web forms. Our AI helps score and qualify leads automatically based on their likelihood to convert.";
  }

  if (lowerMessage.includes('property') || lowerMessage.includes('analysis')) {
    return "Our property analysis tools help you evaluate investment opportunities quickly. You can calculate ARV, estimate repair costs, and run financing scenarios all in one place. The AI-powered comparable property finder makes valuations easier than ever.";
  }

  if (lowerMessage.includes('how') && lowerMessage.includes('start')) {
    return "Getting started with Doughy is easy! Just sign up for an account, complete your profile, and you'll have access to our lead management and property analysis tools. Check out our Quick Start Guide in the docs for a step-by-step walkthrough.";
  }

  return "Thanks for your question! Doughy is an AI-powered platform designed to help real estate investors manage leads, analyze properties, and close more deals. Is there something specific you'd like to know about our features or how to get started?";
}

/**
 * Get mock property extraction result
 */
export function getMockPropertyExtraction(text: string): ExtractedPropertyData {
  return {
    address: '123 Mock Street',
    bedrooms: 3,
    bathrooms: 2,
    condition: 'needs work',
    notes: 'Mock extraction from: ' + text.substring(0, 50),
  };
}

/**
 * Get mock image extraction result
 */
export function getMockImageExtraction(): ImageExtractionResult {
  return {
    type: 'business_card',
    extractedData: {
      name: 'John Doe',
      phone: '555-123-4567',
      email: 'john@example.com',
      company: 'Mock Real Estate LLC',
    },
    confidence: 0.85,
  };
}

/**
 * Get mock generated document
 */
export function getMockDocument(
  templateType: DocumentTemplateType,
  variables: Record<string, unknown>
): string {
  return `[MOCK ${templateType.toUpperCase()}]

This is a mock document for ${variables.address || 'the property'}.

Generated for demonstration purposes.

---
DISCLAIMER: This is a mock document and should not be used for any legal purposes.`;
}

/**
 * Get mock audio transcription
 */
export function getMockTranscription(): string {
  return 'Mock transcription: Three bedroom, two bathroom house on Main Street. Needs new roof and HVAC. Seller is asking two fifty.';
}

/**
 * Simulate network delay for realistic mock behavior
 */
export async function simulateDelay(minMs: number = 800, maxMs: number = 1500): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
}
