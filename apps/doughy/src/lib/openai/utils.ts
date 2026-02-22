// src/lib/openai/utils.ts
// Utility functions for OpenAI service

import { supabase, SUPABASE_URL } from '../supabase';
import type { AssistantErrorType, ChatMessage, OpenAIResponse } from './types';

/**
 * Get error type from HTTP status code
 */
export function getErrorTypeFromStatus(status: number): AssistantErrorType {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * Get user-friendly error message for error type
 */
export function getErrorMessage(errorType: AssistantErrorType): string {
  switch (errorType) {
    case 'auth':
      return 'Authentication error. Please try signing in again.';
    case 'rate_limit':
      return 'Too many requests. Please wait a moment and try again.';
    case 'server':
      return 'Our servers are experiencing issues. Please try again later.';
    case 'network':
      return 'Unable to connect. Please check your internet connection.';
    default:
      return 'Sorry, something went wrong. Please try again.';
  }
}

/**
 * Call OpenAI edge function with standardized options
 */
export async function callOpenAIFunction(
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
 * Get auth headers for API calls
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: sessionData } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (sessionData?.session?.access_token) {
    headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
  }

  return headers;
}
