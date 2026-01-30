/**
 * OpenAI Client Module
 *
 * Provides functions for interacting with the OpenAI API.
 * Includes response validation and error handling.
 *
 * @module _shared/ai/openai-client
 */

// =============================================================================
// Types
// =============================================================================

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OpenAIValidationResult {
  valid: boolean;
  content?: string;
  error?: string;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate OpenAI API response structure
 *
 * @param result - The raw API response
 * @returns Validation result with extracted content if valid
 */
export function validateOpenAIResponse(result: unknown): OpenAIValidationResult {
  if (!result || typeof result !== 'object') {
    return { valid: false, error: 'Invalid response: not an object' };
  }

  const response = result as Record<string, unknown>;

  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    return { valid: false, error: 'Invalid response: missing or empty choices array' };
  }

  const firstChoice = response.choices[0] as Record<string, unknown> | undefined;
  if (!firstChoice || typeof firstChoice !== 'object') {
    return { valid: false, error: 'Invalid response: first choice is not an object' };
  }

  const message = firstChoice.message as Record<string, unknown> | undefined;
  if (!message || typeof message !== 'object') {
    return { valid: false, error: 'Invalid response: message is not an object' };
  }

  const content = message.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    return { valid: false, error: 'Invalid response: content is not a non-empty string' };
  }

  return { valid: true, content };
}

// =============================================================================
// API Calls
// =============================================================================

/**
 * Generate a chat completion using OpenAI API
 *
 * @param systemPrompt - The system prompt to use
 * @param userMessage - The user's message
 * @param options - Optional configuration
 * @returns The generated response text
 * @throws Error if API call fails or response is invalid
 */
export async function generateChatCompletion(
  systemPrompt: string,
  userMessage: string,
  options: OpenAICompletionOptions = {}
): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured. AI responses are unavailable.');
  }

  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 500,
  } = options;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = (errorBody as Record<string, unknown>)?.error;
      const message = typeof errorMessage === 'object' && errorMessage !== null
        ? (errorMessage as Record<string, unknown>)?.message
        : undefined;
      throw new Error(typeof message === 'string' ? message : `OpenAI API error: ${response.status}`);
    }

    const result = await response.json();

    const validation = validateOpenAIResponse(result);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid OpenAI response structure');
    }

    return validation.content!;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

/**
 * Generate a chat completion with conversation history
 *
 * @param messages - Array of messages in the conversation
 * @param options - Optional configuration
 * @returns The generated response text
 */
export async function generateConversationCompletion(
  messages: OpenAIMessage[],
  options: OpenAICompletionOptions = {}
): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured. AI responses are unavailable.');
  }

  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 500,
  } = options;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = (errorBody as Record<string, unknown>)?.error;
      const message = typeof errorMessage === 'object' && errorMessage !== null
        ? (errorMessage as Record<string, unknown>)?.message
        : undefined;
      throw new Error(typeof message === 'string' ? message : `OpenAI API error: ${response.status}`);
    }

    const result = await response.json();

    const validation = validateOpenAIResponse(result);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid OpenAI response structure');
    }

    return validation.content!;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}
