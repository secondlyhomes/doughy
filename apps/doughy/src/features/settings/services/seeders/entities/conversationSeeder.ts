// src/features/settings/services/seeders/entities/conversationSeeder.ts
// Conversation and message seeder for landlord platform

import { supabase } from '@/lib/supabase';
import { getRelativeTimestamp } from '../common/dates';
import type { ConversationSeedData, MessageSeedData } from '../types';
import type { CreatedProperty } from './propertySeeder';
import type { CreatedContact } from './contactSeeder';

export interface CreatedConversation {
  id: string;
  contact_id: string;
  property_id: string;
  channel: string;
  [key: string]: unknown;
}

/**
 * Create conversations from seed data
 */
export async function createConversations(
  userId: string,
  conversationsData: ConversationSeedData[],
  properties: CreatedProperty[],
  contacts: CreatedContact[]
): Promise<CreatedConversation[]> {
  const conversationInserts = conversationsData.map((c, i) => ({
    user_id: userId,
    contact_id: contacts[c.contactIndex].id,
    property_id: properties[c.propertyIndex].id,
    channel: c.channel,
    status: c.status,
    is_ai_enabled: c.is_ai_enabled,
    message_count: 3 + i,
    last_message_at: getRelativeTimestamp(-i * 0.5), // Staggered by 30 min
  }));

  const { data: conversations, error } = await supabase
    .schema('landlord').from('conversations')
    .insert(conversationInserts)
    .select();

  if (error) {
    console.error('Error creating conversations:', error);
    throw new Error(`Failed to create conversations: ${error.message}`);
  }

  if (!conversations || conversations.length === 0) {
    throw new Error('Conversations were not created');
  }

  console.log('Created conversations:', conversations.length);
  return conversations as CreatedConversation[];
}

/**
 * Create messages for a conversation
 */
export async function createMessages(
  conversationId: string,
  messagesData: MessageSeedData[]
): Promise<void> {
  const messageInserts = messagesData.map((m) => ({
    conversation_id: conversationId,
    direction: m.direction,
    content: m.content,
    content_type: 'text',
    sent_by: m.sent_by,
    ai_confidence: m.ai_confidence,
  }));

  const { error } = await supabase.schema('landlord').from('messages').insert(messageInserts);

  if (error) {
    console.error('Error creating messages:', error);
    throw new Error(`Failed to create messages: ${error.message}`);
  }
}

/**
 * Create messages for multiple conversations
 */
export async function createMessagesForConversations(
  conversations: CreatedConversation[],
  messageTemplates: MessageSeedData[][]
): Promise<void> {
  const allMessages = conversations.flatMap((conv, i) => {
    const messages = messageTemplates[i % messageTemplates.length] || [];
    return messages.map((m) => ({
      conversation_id: conv.id,
      direction: m.direction,
      content: m.content,
      content_type: 'text',
      sent_by: m.sent_by,
      ai_confidence: m.ai_confidence,
    }));
  });

  if (allMessages.length === 0) return;

  const { error } = await supabase.schema('landlord').from('messages').insert(allMessages);

  if (error) {
    console.error('Error creating messages:', error);
    throw new Error(`Failed to create messages: ${error.message}`);
  }

  console.log('Created messages:', allMessages.length);
}

/**
 * Create a pending AI response in the queue
 */
export async function createPendingAIResponse(
  userId: string,
  conversationId: string,
  suggestedResponse: string,
  confidence: number,
  reasoning: string
): Promise<void> {
  const { error } = await supabase.schema('landlord').from('ai_queue_items').insert({
    user_id: userId,
    conversation_id: conversationId,
    suggested_response: suggestedResponse,
    confidence,
    reasoning,
    status: 'pending',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    console.error('Error creating AI queue entry:', error);
    throw new Error(`Failed to create AI queue entry: ${error.message}`);
  }

  console.log('Created AI queue entry');
}

/**
 * Delete all conversations and messages for a user
 */
export async function deleteUserConversations(userId: string): Promise<{ errors: Array<{ table: string; message: string }> }> {
  const errors: Array<{ table: string; message: string }> = [];

  // Get conversation IDs first
  const { data: conversations } = await supabase
    .schema('landlord').from('conversations')
    .select('id')
    .eq('user_id', userId);
  const conversationIds = conversations?.map((c) => c.id) || [];

  // Delete messages first
  if (conversationIds.length > 0) {
    const { error: messagesError } = await supabase
      .schema('landlord').from('messages')
      .delete()
      .in('conversation_id', conversationIds);
    if (messagesError) {
      errors.push({ table: 'landlord.messages', message: messagesError.message });
    }
  }

  // Delete AI queue items
  const { error: aiQueueError } = await supabase
    .schema('landlord').from('ai_queue_items')
    .delete()
    .eq('user_id', userId);
  if (aiQueueError) {
    errors.push({ table: 'landlord.ai_queue_items', message: aiQueueError.message });
  }

  // Delete conversations
  const { error: conversationsError } = await supabase
    .schema('landlord').from('conversations')
    .delete()
    .eq('user_id', userId);
  if (conversationsError) {
    errors.push({ table: 'landlord.conversations', message: conversationsError.message });
  }

  return { errors };
}
