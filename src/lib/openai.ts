// src/lib/openai.ts
// OpenAI service for calling AI assistants via Supabase edge functions

import { supabase, SUPABASE_URL, USE_MOCK_DATA } from './supabase';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAIResponse {
  pure_text?: string;
  error?: string;
}

// Default system prompts for different assistants
const SYSTEM_PROMPTS = {
  public: `You are Doughy, a helpful assistant for visitors to a real estate platform.

Your purpose is to provide information and assistance to potential clients interested in real estate services.

Your capabilities include:
- Answering general questions about real estate concepts and processes
- Providing basic information about buying, selling, and investing in property
- Explaining how our platform helps real estate clients
- Directing users to relevant resources or services
- Addressing common questions about working with real estate professionals

Key guidelines:
- Keep responses friendly, helpful, and conversational
- Avoid overly technical language when possible
- Don't provide specific investment advice or valuations
- Encourage users to register or contact an agent for personalized assistance
- Focus on being helpful rather than sales-focused`,

  docs: `You are Doughy, a helpful documentation assistant for a real estate platform.
Focus on providing clear, concise answers about the platform's features, usage, and functionality.
Be friendly and helpful. If you don't know an answer, admit it and suggest where they might find more information.
Include relevant links to documentation pages when appropriate.`,
};

// Mock response for development without backend
function getMockResponse(message: string): string {
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
 * Call the public marketing assistant
 * Used for general questions on marketing pages (landing, pricing, etc.)
 */
export async function callPublicAssistant(message: string): Promise<string> {
  // In mock mode, return simulated response
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
    return getMockResponse(message);
  }

  try {
    // Get session to check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();

    // Build the function URL
    const functionUrl = `${SUPABASE_URL}/functions/v1/openai/direct/public`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    // Make the API call
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input: message,
        model: 'gpt-4o-mini',
      }),
    });

    if (!response.ok) {
      console.error('[OpenAI] Error calling assistant API:', response.status);
      throw new Error(`Assistant API error: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    return data.pure_text || "Sorry, I couldn't process your request at this time.";
  } catch (error) {
    console.error('[OpenAI] Error in callPublicAssistant:', error);
    return 'Sorry, I encountered an error while processing your request. Please try again later.';
  }
}

/**
 * Call the documentation assistant
 * Used for questions about the platform's documentation and features
 */
export async function callDocsAssistant(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  // In mock mode, return simulated response
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
    return getMockResponse(message);
  }

  try {
    // Get session to check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();

    // Build the function URL - using same endpoint with different system prompt
    const functionUrl = `${SUPABASE_URL}/functions/v1/openai/direct/public`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    // Build messages array with system prompt and history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPTS.docs },
      ...conversationHistory.filter((m) => m.role !== 'system'),
      { role: 'user', content: message },
    ];

    // Make the API call
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('[OpenAI] Error calling docs assistant API:', response.status);
      throw new Error(`Docs assistant API error: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    return data.pure_text || "Sorry, I couldn't process your request at this time.";
  } catch (error) {
    console.error('[OpenAI] Error in callDocsAssistant:', error);
    return "I'm sorry, I encountered an error processing your request. Please try again later.";
  }
}

// Export system prompts for reference
export { SYSTEM_PROMPTS };

// =============================================================================
// AI Extraction & Generation Functions
// =============================================================================

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

/**
 * Helper to call OpenAI edge function with retry
 */
async function callOpenAIFunction(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: string };
  } = {}
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();

  const functionUrl = `${SUPABASE_URL}/functions/v1/openai`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (sessionData?.session?.access_token) {
    headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      model: options.model || 'gpt-4o',
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens || 1000,
      ...(options.response_format && { response_format: options.response_format }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OpenAI] API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data: OpenAIResponse = await response.json();
  return data.pure_text || '';
}

/**
 * Extract structured property data from text using GPT-4
 *
 * @example
 * ```typescript
 * const data = await extractPropertyData(
 *   "3 bed 2 bath house at 123 Main St, needs new roof, seller John at 555-1234"
 * );
 * // { address: "123 Main St", bedrooms: 3, bathrooms: 2, ... }
 * ```
 */
export async function extractPropertyData(
  text: string
): Promise<ExtractedPropertyData> {
  // In mock mode, return simulated extraction
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      address: '123 Mock Street',
      bedrooms: 3,
      bathrooms: 2,
      condition: 'needs work',
      notes: 'Mock extraction from: ' + text.substring(0, 50),
    };
  }

  try {
    const systemPrompt = `You are a real estate data extraction assistant. Extract property details from the following text.
Return ONLY a JSON object with these fields (omit if not mentioned):
- address: string
- bedrooms: number
- bathrooms: number
- sqft: number
- condition: string (e.g., "needs work", "good condition", "updated")
- notes: string (repair needs, features)
- sellerName: string
- sellerPhone: string
- askingPrice: number
- yearBuilt: number
- lotSize: number (in sqft)

If information is not mentioned, omit that field. Do not make assumptions.`;

    const result = await callOpenAIFunction(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      {
        model: 'gpt-4o',
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }
    );

    return JSON.parse(result) as ExtractedPropertyData;
  } catch (error) {
    console.error('[OpenAI] Property extraction error:', error);
    throw new Error('Failed to extract property data');
  }
}

/**
 * Extract data from an image using GPT-4 Vision
 * Supports MLS sheets, tax records, repair estimates, business cards
 *
 * @example
 * ```typescript
 * const result = await extractFromImage(imageUri);
 * if (result.type === 'business_card') {
 *   console.log(result.extractedData.name, result.extractedData.phone);
 * }
 * ```
 */
export async function extractFromImage(
  imageUri: string
): Promise<ImageExtractionResult> {
  // In mock mode, return simulated extraction
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
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

  try {
    // Convert image to base64 if it's a local file URI
    let imageContent: string;
    if (imageUri.startsWith('data:')) {
      imageContent = imageUri;
    } else {
      // Fetch and convert to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      imageContent = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const functionUrl = `${SUPABASE_URL}/functions/v1/openai`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    const systemPrompt = `Analyze this image and extract real estate related data.
First, identify what type of document this is:
- mls_sheet: MLS listing sheet
- tax_record: Property tax record
- repair_estimate: Contractor repair estimate
- business_card: Business card
- other: Other document type

Then extract all relevant data into a JSON object.
For MLS: address, price, beds, baths, sqft, listing_date, agent_name, etc.
For tax_record: address, assessed_value, tax_amount, year_built, etc.
For repair_estimate: line_items (array with description and cost), total, contractor_name
For business_card: name, phone, email, company, title

Return JSON with: { "type": string, "extractedData": object, "confidence": number (0-1) }`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              {
                type: 'image_url',
                image_url: { url: imageContent },
              },
            ],
          },
        ],
        model: 'gpt-4o',
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    return JSON.parse(data.pure_text || '{}') as ImageExtractionResult;
  } catch (error) {
    console.error('[OpenAI] Image extraction error:', error);
    throw new Error('Failed to extract data from image');
  }
}

/**
 * Generate a document from a template using GPT-4
 *
 * @example
 * ```typescript
 * const letter = await generateDocument('offer_letter', {
 *   address: '123 Main St',
 *   buyerName: 'Jane Smith',
 *   offerPrice: 250000,
 *   closingDate: '2024-03-15',
 * });
 * ```
 */
export async function generateDocument(
  templateType: DocumentTemplateType,
  variables: Record<string, unknown>
): Promise<string> {
  // In mock mode, return simulated document
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return `[MOCK ${templateType.toUpperCase()}]

This is a mock document for ${variables.address || 'the property'}.

Generated for demonstration purposes.

---
DISCLAIMER: This is a mock document and should not be used for any legal purposes.`;
  }

  try {
    const prompts: Record<DocumentTemplateType, string> = {
      offer_letter: `Generate a professional real estate offer letter with these details:
Property: ${variables.address}
Buyer: ${variables.buyerName}
Offer Price: $${Number(variables.offerPrice).toLocaleString()}
Closing Date: ${variables.closingDate}
Terms: ${variables.terms || 'Cash purchase, as-is condition'}
${variables.earnestMoney ? `Earnest Money: $${Number(variables.earnestMoney).toLocaleString()}` : ''}

Make it professional but friendly. Include standard contingencies.`,

      purchase_agreement: `Generate a purchase agreement addendum with these details:
${JSON.stringify(variables, null, 2)}

This is a draft for review by an attorney. Include standard clauses for:
- Property description
- Purchase price and payment terms
- Contingencies
- Closing procedures
- Signatures`,

      seller_report: `Generate a detailed seller property report with these details:
${JSON.stringify(variables, null, 2)}

Include sections for:
- Property Overview
- Market Analysis
- Comparable Properties
- Estimated Value Range
- Investment Potential
- Recommended Repairs/Improvements`,
    };

    const systemPrompt = `You are a real estate document generation assistant. Generate professional, legally-sound documents.
Always include a disclaimer that documents should be reviewed by an attorney before signing.
Format the document with clear sections and professional language.`;

    const result = await callOpenAIFunction(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompts[templateType] },
      ],
      {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 2000,
      }
    );

    return result;
  } catch (error) {
    console.error('[OpenAI] Document generation error:', error);
    throw new Error('Failed to generate document');
  }
}

/**
 * Transcribe audio using Whisper API
 * Note: Requires audio file to be accessible via URL or base64
 *
 * @example
 * ```typescript
 * const text = await transcribeAudio(audioUri);
 * const propertyData = await extractPropertyData(text);
 * ```
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  // In mock mode, return simulated transcription
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return 'Mock transcription: Three bedroom, two bathroom house on Main Street. Needs new roof and HVAC. Seller is asking two fifty.';
  }

  try {
    // Note: Whisper API requires FormData with file upload
    // This is typically handled via an edge function that accepts the audio
    const { data: sessionData } = await supabase.auth.getSession();

    // Convert audio URI to blob
    const audioResponse = await fetch(audioUri);
    const audioBlob = await audioResponse.blob();

    // Create form data
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.m4a');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Call the transcription edge function
    const functionUrl = `${SUPABASE_URL}/functions/v1/openai/transcribe`;

    const headers: HeadersInit = {};
    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription API error: ${response.status}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('[OpenAI] Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}
