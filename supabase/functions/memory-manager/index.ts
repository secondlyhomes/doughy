/**
 * Memory Manager Edge Function
 *
 * Manages MoltBot's memory system including:
 * - User memories (USER.md equivalent) - preferences, writing style, rules
 * - Episodic memories - per-contact conversation summaries
 * - Learning from response outcomes
 *
 * Actions:
 * - store_user_memory: Save a learned preference or pattern
 * - get_user_context: Load all relevant memories for AI context
 * - store_episodic: Save a conversation summary for a contact
 * - get_contact_history: Get past interactions with a contact
 * - learn_from_outcome: Extract learnings from approved/edited responses
 * - get_response_examples: Get example responses for a topic
 * - store_response_example: Save an example response
 *
 * @see /docs/moltbot-ecosystem-expansion.md for memory architecture
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  createCorsResponse,
  createCorsErrorResponse,
} from "../_shared/cors-standardized.ts";

// =============================================================================
// Types
// =============================================================================

type MemoryAction =
  | 'store_user_memory'
  | 'get_user_context'
  | 'store_episodic'
  | 'get_contact_history'
  | 'learn_from_outcome'
  | 'get_response_examples'
  | 'store_response_example'
  | 'update_memory_confidence'
  | 'delete_memory';

type UserMemoryType =
  | 'preference'
  | 'writing_style'
  | 'property_rule'
  | 'response_pattern'
  | 'contact_rule'
  | 'template_override'
  | 'personality_trait';

type MemorySource = 'manual' | 'learned' | 'imported' | 'inferred' | 'system';

type EpisodicType =
  | 'interaction_summary'
  | 'preference_learned'
  | 'issue_history'
  | 'booking_context'
  | 'relationship_note';

interface MemoryManagerRequest {
  action: MemoryAction;
  user_id: string;
  payload: Record<string, unknown>;
}

interface UserMemoryPayload {
  memory_type: UserMemoryType;
  key: string;
  value: unknown;
  source?: MemorySource;
  confidence?: number;
  property_id?: string;
  channel?: string;
  contact_type?: string;
}

interface EpisodicMemoryPayload {
  contact_id: string;
  memory_type: EpisodicType;
  summary: string;
  key_facts?: Record<string, unknown>;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  importance?: number;
  conversation_id?: string;
  expires_in_days?: number;
}

interface UserContextRequest {
  property_id?: string;
  channel?: string;
  contact_type?: string;
  contact_id?: string;
  include_global?: boolean;
}

interface ContactHistoryRequest {
  contact_id: string;
  limit?: number;
  memory_types?: EpisodicType[];
}

interface LearnFromOutcomePayload {
  outcome_id: string;
  conversation_id?: string;
  contact_id?: string;
  original_response: string;
  final_response?: string;
  outcome: 'approved' | 'edited' | 'rejected';
  message_type?: string;
  topic?: string;
  detected_topics?: string[];
}

interface ResponseExamplePayload {
  category: string;
  subcategory?: string;
  topic?: string;
  trigger_message: string;
  response: string;
  context?: Record<string, unknown>;
  rating?: number;
  outcome?: 'positive' | 'negative' | 'neutral';
  source: 'user_approved' | 'imported' | 'generated';
  source_conversation_id?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract learnings from an edited response
 */
function extractLearnings(
  originalResponse: string,
  finalResponse: string,
  outcome: string
): Record<string, unknown> {
  const learnings: Record<string, unknown> = {
    outcome,
    changes_made: outcome === 'edited',
  };

  if (outcome === 'edited' && finalResponse) {
    // Compare lengths
    const originalLength = originalResponse.length;
    const finalLength = finalResponse.length;
    learnings.length_change = finalLength - originalLength;
    learnings.length_change_percent = Math.round(((finalLength - originalLength) / originalLength) * 100);

    // Check for common edits
    const originalLower = originalResponse.toLowerCase();
    const finalLower = finalResponse.toLowerCase();

    // Greeting changes
    const greetingPatterns = ['hi ', 'hello ', 'hey ', 'dear ', 'good '];
    learnings.greeting_changed = greetingPatterns.some(p =>
      originalLower.startsWith(p) !== finalLower.startsWith(p)
    );

    // Sign-off changes
    const signOffPatterns = ['best,', 'thanks,', 'regards,', 'cheers,', 'sincerely,'];
    learnings.signoff_changed = signOffPatterns.some(p =>
      originalLower.includes(p) !== finalLower.includes(p)
    );

    // Formality change indicators
    const formalIndicators = ['please', 'kindly', 'would you', 'could you'];
    const casualIndicators = ['gonna', 'wanna', 'yeah', 'yep', 'sure thing'];

    const originalFormal = formalIndicators.filter(i => originalLower.includes(i)).length;
    const finalFormal = formalIndicators.filter(i => finalLower.includes(i)).length;
    const originalCasual = casualIndicators.filter(i => originalLower.includes(i)).length;
    const finalCasual = casualIndicators.filter(i => finalLower.includes(i)).length;

    if (finalFormal > originalFormal) {
      learnings.formality_direction = 'more_formal';
    } else if (finalCasual > originalCasual) {
      learnings.formality_direction = 'more_casual';
    }

    // Emoji changes
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu;
    const originalEmojis = (originalResponse.match(emojiRegex) || []).length;
    const finalEmojis = (finalResponse.match(emojiRegex) || []).length;
    if (originalEmojis !== finalEmojis) {
      learnings.emoji_preference = finalEmojis > originalEmojis ? 'more' : 'fewer';
    }
  }

  return learnings;
}

/**
 * Determine what memories to store based on learnings
 */
function learningsToMemories(
  learnings: Record<string, unknown>,
  messageType?: string,
  topic?: string
): Array<{ type: UserMemoryType; key: string; value: unknown; confidence: number }> {
  const memories: Array<{ type: UserMemoryType; key: string; value: unknown; confidence: number }> = [];

  // Only learn from edited responses - they indicate user preferences
  if (learnings.changes_made !== true) {
    return memories;
  }

  // Greeting preference
  if (learnings.greeting_changed) {
    memories.push({
      type: 'writing_style',
      key: 'prefers_different_greeting',
      value: { topic, message_type: messageType },
      confidence: 0.6,
    });
  }

  // Sign-off preference
  if (learnings.signoff_changed) {
    memories.push({
      type: 'writing_style',
      key: 'prefers_different_signoff',
      value: { topic, message_type: messageType },
      confidence: 0.6,
    });
  }

  // Formality preference
  if (learnings.formality_direction) {
    memories.push({
      type: 'writing_style',
      key: 'formality_preference',
      value: learnings.formality_direction,
      confidence: 0.5,
    });
  }

  // Emoji preference
  if (learnings.emoji_preference) {
    memories.push({
      type: 'personality_trait',
      key: 'emoji_usage',
      value: learnings.emoji_preference === 'more' ? 'preferred' : 'avoided',
      confidence: 0.7,
    });
  }

  // Length preference
  const lengthChange = learnings.length_change_percent as number;
  if (Math.abs(lengthChange) > 30) {
    memories.push({
      type: 'writing_style',
      key: 'response_length_preference',
      value: lengthChange > 0 ? 'longer' : 'shorter',
      confidence: 0.5,
    });
  }

  return memories;
}

// =============================================================================
// Action Handlers
// =============================================================================

async function storeUserMemory(
  supabase: SupabaseClient,
  userId: string,
  payload: UserMemoryPayload
): Promise<{ success: boolean; memory_id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('store_user_memory', {
    p_user_id: userId,
    p_memory_type: payload.memory_type,
    p_key: payload.key,
    p_value: payload.value,
    p_source: payload.source || 'learned',
    p_confidence: payload.confidence || 1.0,
    p_property_id: payload.property_id || null,
    p_channel: payload.channel || null,
    p_contact_type: payload.contact_type || null,
  });

  if (error) {
    console.error('Error storing user memory:', error);
    return { success: false, error: error.message };
  }

  return { success: true, memory_id: data };
}

async function getUserContext(
  supabase: SupabaseClient,
  userId: string,
  request: UserContextRequest
): Promise<{ success: boolean; context?: Record<string, unknown>; error?: string }> {
  // Get user memories
  const { data: memoryContext, error: memoryError } = await supabase.rpc('get_user_memory_context', {
    p_user_id: userId,
    p_property_id: request.property_id || null,
    p_channel: request.channel || null,
    p_contact_type: request.contact_type || null,
  });

  if (memoryError) {
    console.error('Error getting user memory context:', memoryError);
    return { success: false, error: memoryError.message };
  }

  // Get contact episodic memories if contact_id provided
  let contactMemories = null;
  if (request.contact_id) {
    const { data: episodic, error: episodicError } = await supabase.rpc('get_contact_episodic_memories', {
      p_user_id: userId,
      p_contact_id: request.contact_id,
      p_limit: 5,
    });

    if (!episodicError) {
      contactMemories = episodic;
    }
  }

  // Get global knowledge if requested
  let globalKnowledge = null;
  if (request.include_global) {
    const { data: global, error: globalError } = await supabase
      .from('moltbot_global_knowledge')
      .select('category, key, value')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(20);

    if (!globalError) {
      globalKnowledge = global;
    }
  }

  return {
    success: true,
    context: {
      user_memories: memoryContext || {},
      contact_memories: contactMemories || [],
      global_knowledge: globalKnowledge || [],
    },
  };
}

async function storeEpisodicMemory(
  supabase: SupabaseClient,
  userId: string,
  payload: EpisodicMemoryPayload
): Promise<{ success: boolean; memory_id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('store_episodic_memory', {
    p_user_id: userId,
    p_contact_id: payload.contact_id,
    p_memory_type: payload.memory_type,
    p_summary: payload.summary,
    p_key_facts: payload.key_facts || null,
    p_sentiment: payload.sentiment || 'neutral',
    p_importance: payload.importance || 5,
    p_conversation_id: payload.conversation_id || null,
    p_expires_in_days: payload.expires_in_days || null,
  });

  if (error) {
    console.error('Error storing episodic memory:', error);
    return { success: false, error: error.message };
  }

  return { success: true, memory_id: data };
}

async function getContactHistory(
  supabase: SupabaseClient,
  userId: string,
  request: ContactHistoryRequest
): Promise<{ success: boolean; memories?: unknown[]; error?: string }> {
  let query = supabase
    .from('moltbot_episodic_memory')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', request.contact_id)
    .eq('is_active', true)
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(request.limit || 10);

  if (request.memory_types && request.memory_types.length > 0) {
    query = query.in('memory_type', request.memory_types);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting contact history:', error);
    return { success: false, error: error.message };
  }

  return { success: true, memories: data || [] };
}

async function learnFromOutcome(
  supabase: SupabaseClient,
  userId: string,
  payload: LearnFromOutcomePayload
): Promise<{ success: boolean; learnings_stored?: number; error?: string }> {
  // Extract learnings from the outcome
  const learnings = extractLearnings(
    payload.original_response,
    payload.final_response || '',
    payload.outcome
  );

  // Convert learnings to memories
  const memoriesToStore = learningsToMemories(
    learnings,
    payload.message_type,
    payload.topic
  );

  // Store each learning as a user memory
  let stored = 0;
  for (const memory of memoriesToStore) {
    const result = await storeUserMemory(supabase, userId, {
      memory_type: memory.type,
      key: memory.key,
      value: memory.value,
      source: 'learned',
      confidence: memory.confidence,
    });

    if (result.success) {
      stored++;
    }
  }

  // Queue the learning for more detailed processing
  const { error: queueError } = await supabase.rpc('queue_learning_opportunity', {
    p_user_id: userId,
    p_outcome_id: payload.outcome_id,
    p_conversation_id: payload.conversation_id || null,
    p_contact_id: payload.contact_id || null,
    p_original_response: payload.original_response,
    p_final_response: payload.final_response || null,
    p_outcome: payload.outcome,
  });

  if (queueError) {
    console.error('Error queueing learning opportunity:', queueError);
  }

  // If approved, consider storing as a response example
  if (payload.outcome === 'approved' || (payload.outcome === 'edited' && payload.final_response)) {
    const responseToStore = payload.outcome === 'approved'
      ? payload.original_response
      : payload.final_response!;

    // Only store if we have topic/category info
    if (payload.topic || payload.message_type) {
      await supabase
        .from('moltbot_response_examples')
        .insert({
          user_id: userId,
          category: payload.message_type || 'general',
          topic: payload.topic,
          trigger_message: '', // Would need to be passed in
          response: responseToStore,
          source: 'user_approved',
          source_conversation_id: payload.conversation_id,
          outcome: 'positive',
          rating: payload.outcome === 'approved' ? 5 : 4,
        });
    }
  }

  return { success: true, learnings_stored: stored };
}

async function getResponseExamples(
  supabase: SupabaseClient,
  userId: string,
  payload: { category?: string; topic?: string; limit?: number }
): Promise<{ success: boolean; examples?: unknown[]; error?: string }> {
  let query = supabase
    .from('moltbot_response_examples')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .order('use_count', { ascending: false })
    .limit(payload.limit || 5);

  if (payload.category) {
    query = query.eq('category', payload.category);
  }

  if (payload.topic) {
    query = query.eq('topic', payload.topic);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting response examples:', error);
    return { success: false, error: error.message };
  }

  return { success: true, examples: data || [] };
}

async function storeResponseExample(
  supabase: SupabaseClient,
  userId: string,
  payload: ResponseExamplePayload
): Promise<{ success: boolean; example_id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('moltbot_response_examples')
    .insert({
      user_id: userId,
      category: payload.category,
      subcategory: payload.subcategory,
      topic: payload.topic,
      trigger_message: payload.trigger_message,
      response: payload.response,
      context: payload.context,
      rating: payload.rating,
      outcome: payload.outcome,
      source: payload.source,
      source_conversation_id: payload.source_conversation_id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error storing response example:', error);
    return { success: false, error: error.message };
  }

  return { success: true, example_id: data?.id };
}

async function updateMemoryConfidence(
  supabase: SupabaseClient,
  userId: string,
  payload: { memory_id: string; was_successful: boolean }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('record_memory_usage', {
    p_memory_id: payload.memory_id,
    p_was_successful: payload.was_successful,
  });

  if (error) {
    console.error('Error updating memory confidence:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function deleteMemory(
  supabase: SupabaseClient,
  userId: string,
  payload: { memory_id: string; memory_table: 'user' | 'episodic' | 'example' }
): Promise<{ success: boolean; error?: string }> {
  const tableMap = {
    user: 'moltbot_user_memory',
    episodic: 'moltbot_episodic_memory',
    example: 'moltbot_response_examples',
  };

  const table = tableMap[payload.memory_table];

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', payload.memory_id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting memory:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(corsHeaders);
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createCorsErrorResponse('Authentication required', 401, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createCorsErrorResponse('Invalid or expired token', 401, corsHeaders);
    }

    // Parse request
    const body: MemoryManagerRequest = await req.json();
    const { action, payload } = body;

    // Use authenticated user ID for security
    const userId = user.id;

    // Route to appropriate handler
    let result: { success: boolean; [key: string]: unknown };

    switch (action) {
      case 'store_user_memory':
        result = await storeUserMemory(supabase, userId, payload as UserMemoryPayload);
        break;

      case 'get_user_context':
        result = await getUserContext(supabase, userId, payload as UserContextRequest);
        break;

      case 'store_episodic':
        result = await storeEpisodicMemory(supabase, userId, payload as EpisodicMemoryPayload);
        break;

      case 'get_contact_history':
        result = await getContactHistory(supabase, userId, payload as ContactHistoryRequest);
        break;

      case 'learn_from_outcome':
        result = await learnFromOutcome(supabase, userId, payload as LearnFromOutcomePayload);
        break;

      case 'get_response_examples':
        result = await getResponseExamples(supabase, userId, payload as { category?: string; topic?: string; limit?: number });
        break;

      case 'store_response_example':
        result = await storeResponseExample(supabase, userId, payload as ResponseExamplePayload);
        break;

      case 'update_memory_confidence':
        result = await updateMemoryConfidence(supabase, userId, payload as { memory_id: string; was_successful: boolean });
        break;

      case 'delete_memory':
        result = await deleteMemory(supabase, userId, payload as { memory_id: string; memory_table: 'user' | 'episodic' | 'example' });
        break;

      default:
        return createCorsErrorResponse(`Unknown action: ${action}`, 400, corsHeaders);
    }

    return createCorsResponse(result, corsHeaders);

  } catch (error) {
    console.error('Memory manager error:', error);
    return createCorsErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      corsHeaders
    );
  }
});
