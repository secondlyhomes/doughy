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
