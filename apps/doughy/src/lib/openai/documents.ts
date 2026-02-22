// src/lib/openai/documents.ts
// Document generation functions

import { USE_MOCK_DATA } from '../supabase';
import type { DocumentTemplateType } from './types';
import { SYSTEM_PROMPTS, getDocumentPrompt } from './prompts';
import { callOpenAIFunction } from './utils';
import { getMockDocument, simulateDelay } from './mock';

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
    await simulateDelay(1000, 1500);
    return getMockDocument(templateType, variables);
  }

  try {
    const prompt = getDocumentPrompt(templateType, variables);

    const result = await callOpenAIFunction(
      [
        { role: 'system', content: SYSTEM_PROMPTS.documentGeneration },
        { role: 'user', content: prompt },
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
