// src/lib/openai/types.ts
// Type definitions for OpenAI service

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIResponse {
  pure_text?: string;
  error?: string;
}

export type AssistantErrorType =
  | 'network'
  | 'auth'
  | 'rate_limit'
  | 'server'
  | 'unknown';

// Discriminated union ensures errorType only exists on failure
export type AssistantResponse =
  | { success: true; message: string; errorType?: never }
  | { success: false; message: string; errorType: AssistantErrorType };

/**
 * Extracted property data from text or voice input
 */
export interface ExtractedPropertyData {
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  condition?: string;
  notes?: string;
  sellerName?: string;
  sellerPhone?: string;
  askingPrice?: number;
  yearBuilt?: number;
  lotSize?: number;
}

/**
 * Document types that can be extracted from images
 */
export type DocumentType =
  | 'mls_sheet'
  | 'tax_record'
  | 'repair_estimate'
  | 'business_card'
  | 'other';

/**
 * Result from image extraction
 */
export interface ImageExtractionResult {
  type: DocumentType;
  extractedData: Record<string, unknown>;
  confidence?: number;
}

/**
 * Document template types for generation
 */
export type DocumentTemplateType =
  | 'offer_letter'
  | 'purchase_agreement'
  | 'seller_report';
