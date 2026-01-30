// src/lib/openai/assistant.ts
// Assistant calling functions for public and docs assistants

import { supabase, SUPABASE_URL, USE_MOCK_DATA } from '../supabase';
import type { AssistantResponse, ChatMessage, OpenAIResponse } from './types';
import { SYSTEM_PROMPTS } from './prompts';
import { getErrorTypeFromStatus, getErrorMessage } from './utils';
import { getMockAssistantResponse, simulateDelay } from './mock';

/**
 * Call the public marketing assistant
 * Used for general questions on marketing pages (landing, pricing, etc.)
 * Returns a structured response with success status and error information
 */
export async function callPublicAssistant(
  message: string
): Promise<AssistantResponse> {
  // In mock mode, return simulated response
  if (USE_MOCK_DATA) {
    // Only allow mock mode in development
    if (typeof __DEV__ !== 'undefined' && !__DEV__) {
      console.error('[OpenAI] CRITICAL: Mock mode enabled in production build!');
      return {
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        errorType: 'server',
      };
    }
    console.warn('[OpenAI] Using mock response - development mode');
    await simulateDelay(1000, 2000);
    return { success: true, message: getMockAssistantResponse(message) };
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
      const errorType = getErrorTypeFromStatus(response.status);
      console.error('[OpenAI] Error calling assistant API:', response.status);
      return {
        success: false,
        message: getErrorMessage(errorType),
        errorType,
      };
    }

    const data: OpenAIResponse = await response.json();
    if (!data.pure_text) {
      console.warn('[OpenAI] Empty response from API');
      return {
        success: false,
        message: 'The assistant returned an empty response. Please try again.',
        errorType: 'unknown',
      };
    }
    return { success: true, message: data.pure_text };
  } catch (error) {
    console.error('[OpenAI] Error in callPublicAssistant:', error);
    return {
      success: false,
      message: getErrorMessage('network'),
      errorType: 'network',
    };
  }
}

/**
 * Call the documentation assistant
 * Used for questions about the platform's documentation and features
 * Returns a structured response with success status and error information
 */
export async function callDocsAssistant(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<AssistantResponse> {
  // In mock mode, return simulated response
  if (USE_MOCK_DATA) {
    // Only allow mock mode in development
    if (typeof __DEV__ !== 'undefined' && !__DEV__) {
      console.error('[OpenAI] CRITICAL: Mock mode enabled in production build!');
      return {
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        errorType: 'server',
      };
    }
    console.warn('[OpenAI] Using mock response - development mode');
    await simulateDelay(1000, 2000);
    return { success: true, message: getMockAssistantResponse(message) };
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
      const errorType = getErrorTypeFromStatus(response.status);
      console.error('[OpenAI] Error calling docs assistant API:', response.status);
      return {
        success: false,
        message: getErrorMessage(errorType),
        errorType,
      };
    }

    const data: OpenAIResponse = await response.json();
    if (!data.pure_text) {
      console.warn('[OpenAI] Empty response from docs API');
      return {
        success: false,
        message: 'The assistant returned an empty response. Please try again.',
        errorType: 'unknown',
      };
    }
    return { success: true, message: data.pure_text };
  } catch (error) {
    console.error('[OpenAI] Error in callDocsAssistant:', error);
    return {
      success: false,
      message: getErrorMessage('network'),
      errorType: 'network',
    };
  }
}
