// src/lib/openai/extraction.ts
// AI extraction functions for property data, images, and audio

import { supabase, SUPABASE_URL, USE_MOCK_DATA } from '../supabase';
import type {
  ExtractedPropertyData,
  ImageExtractionResult,
  OpenAIResponse,
} from './types';
import { SYSTEM_PROMPTS } from './prompts';
import { callOpenAIFunction, getAuthHeaders } from './utils';
import {
  getMockPropertyExtraction,
  getMockImageExtraction,
  getMockTranscription,
  simulateDelay,
} from './mock';

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
    await simulateDelay(800, 1200);
    return getMockPropertyExtraction(text);
  }

  try {
    const result = await callOpenAIFunction(
      [
        { role: 'system', content: SYSTEM_PROMPTS.propertyExtraction },
        { role: 'user', content: text },
      ],
      {
        model: 'gpt-4o',
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }
    );

    try {
      return JSON.parse(result) as ExtractedPropertyData;
    } catch (parseError) {
      console.error(
        '[OpenAI] Failed to parse property extraction response:',
        parseError
      );
      return {};
    }
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
    await simulateDelay(1200, 1800);
    return getMockImageExtraction();
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

    const headers = await getAuthHeaders();
    const functionUrl = `${SUPABASE_URL}/functions/v1/openai`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: SYSTEM_PROMPTS.imageExtraction },
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
    try {
      return JSON.parse(data.pure_text || '{}') as ImageExtractionResult;
    } catch (parseError) {
      console.error(
        '[OpenAI] Failed to parse image extraction response:',
        parseError
      );
      return {
        type: 'other',
        extractedData: {},
        confidence: 0,
      };
    }
  } catch (error) {
    console.error('[OpenAI] Image extraction error:', error);
    throw new Error('Failed to extract data from image');
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
    await simulateDelay(1500, 2500);
    return getMockTranscription();
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
